import argparse
import copy
import logging
import re
import signal
import sys
import threading
import time
from datetime import datetime
from functools import partial
from timeit import default_timer as timer

import xxhash

from api.db.db_models import close_db, init_database_tables
from api.db.services.document_service import DocumentService
from api.db.services.file2document_service import File2DocumentService
from api.db.services.llm_service import LLMBundle
from api.db.services.task_service import TaskService, has_canceled
from common import settings
from common.constants import SVR_CONSUMER_GROUP_NAME, ParserType, PipelineTaskType
from rag.app import naive, one, qa
from rag.nlp import search
from rag.utils.redis_conn import REDIS_CONN

FACTORY = {
    "general": naive,
    ParserType.NAIVE.value: naive,
    ParserType.ONE.value: one,
    ParserType.QA.value: qa,
}

TASK_TYPE_TO_PIPELINE_TASK_TYPE = {
    "dataflow": PipelineTaskType.PARSE,
    "raptor": PipelineTaskType.RAPTOR,
    "graphrag": PipelineTaskType.GRAPH_RAG,
    "mindmap": PipelineTaskType.MINDMAP,
    "memory": PipelineTaskType.MEMORY,
}

TASK_TYPE = "common"
TE_IDX = "0"
CONSUMER_NAME = f"task_executor_{TASK_TYPE}_{TE_IDX}"
BOOT_AT = datetime.now().astimezone().isoformat(timespec="milliseconds")
DONE_TASKS = 0
FAILED_TASKS = 0
CURRENT_TASKS = {}
UNACKED_ITERATOR = None

stop_event = threading.Event()


def signal_handler(sig, frame):
    logging.info("Received interrupt signal, shutting down...")
    stop_event.set()
    time.sleep(1)
    sys.exit(0)


def main() -> None:
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    init_database_tables()
    close_db()
    print(
        f"{CONSUMER_NAME} booted at {BOOT_AT}; waiting for {TASK_TYPE} document tasks.",
        flush=True,
    )
    while not stop_event.is_set():
        handle_task()

    print(f"{CONSUMER_NAME} stopped.", flush=True)


def collect():
    global UNACKED_ITERATOR

    queue_names = settings.get_svr_queue_names(TASK_TYPE)
    if UNACKED_ITERATOR is None:
        UNACKED_ITERATOR = REDIS_CONN.get_unacked_iterator(
            queue_names,
            SVR_CONSUMER_GROUP_NAME,
            CONSUMER_NAME,
        )
    try:
        redis_msg = next(UNACKED_ITERATOR)
    except StopIteration:
        UNACKED_ITERATOR = None
    else:
        return task_from_redis_message(redis_msg)

    for queue_name in queue_names:
        redis_msg = REDIS_CONN.queue_consumer(
            queue_name,
            SVR_CONSUMER_GROUP_NAME,
            CONSUMER_NAME,
        )
        if not redis_msg:
            continue
        return task_from_redis_message(redis_msg)
    return None, None


def task_from_redis_message(redis_msg):
    message = redis_msg.get_message()
    if not message:
        print(f"collect got empty message of {redis_msg.get_msg_id()}", flush=True)
        return redis_msg, None
    task = TaskService.get_task(str(message["id"]))
    if not task or has_canceled(str(message["id"])):
        print(f"collect task {message['id']} is unknown or cancelled", flush=True)
        return redis_msg, None
    task["task_type"] = str(message.get("task_type") or task.get("task_type") or "")
    return redis_msg, task


def handle_task() -> None:
    global DONE_TASKS, FAILED_TASKS

    redis_msg, task = collect()
    if task is None:
        if redis_msg is not None:
            FAILED_TASKS += 1
            redis_msg.ack()
        time.sleep(1)
        return

    task_id = task["id"]
    try:
        CURRENT_TASKS[task_id] = copy.deepcopy(task)
        do_handle_task(task)
        DONE_TASKS += 1
        print(f"handle_task done for task {task_id}", flush=True)
    except RuntimeError as exc:
        FAILED_TASKS += 1
        if "canceled" not in str(exc).lower():
            error_message = str(exc).replace("'", "")
            set_progress(task_id, -1, f"Internal server error while chunking: {error_message}")
        print(f"handle_task stopped task {task_id}: {exc}", flush=True)
    except Exception as exc:
        FAILED_TASKS += 1
        error_message = str(exc).replace("'", "")
        set_progress(task_id, -1, f"Internal server error while chunking: {error_message}")
        print(f"handle_task failed task {task_id}: {exc}", flush=True)
    finally:
        CURRENT_TASKS.pop(task_id, None)
        exists, doc = DocumentService.get_by_id(task["doc_id"])
        if exists and doc is not None:
            DocumentService.update_progress_immediately([doc.to_api()])
        if redis_msg is not None:
            redis_msg.ack()


def do_handle_task(task: dict) -> None:
    task_id = task["id"]
    doc_id = task["doc_id"]
    task_type = task.get("task_type", "")
    pipeline_task_type = (
        TASK_TYPE_TO_PIPELINE_TASK_TYPE.get(task_type, PipelineTaskType.PARSE)
        or PipelineTaskType.PARSE
    )
    progress = partial(set_progress, task_id)
    print(f"task_executor received task {task_id} for document {doc_id}", flush=True)
    if task_type:
        raise RuntimeError(
            f"Task type is not supported yet: {task_type} "
            f"({pipeline_task_type.value})"
        )
    progress(0.15, "Task has been received.")
    started = timer()
    chunks = build_chunks(task, progress)
    if not chunks:
        progress(1.0, f"No chunk built from {task['name']}")
        return

    embedding_model = LLMBundle(
        task["tenant_id"],
        {
            "llm_name": task["embd_id"],
            "llm_factory": "local",
            "model_type": "embedding",
        },
        lang=task["language"],
    )
    started_embedding = timer()
    token_count, vector_size = embedding(
        chunks,
        embedding_model,
        task.get("parser_config") or {},
        progress,
    )
    progress(msg=f"Embedding chunks ({timer() - started_embedding:.2f}s)")

    init_kb(task, vector_size)
    started_indexing = timer()
    insert_result = insert_chunks(task_id, task["tenant_id"], task["kb_id"], chunks, progress)
    if not insert_result:
        return

    chunk_count = len({chunk["id"] for chunk in chunks})
    DocumentService.increment_chunk_num(
        task["doc_id"],
        task["kb_id"],
        token_count,
        chunk_count,
        0,
    )
    progress(msg=f"Indexing done ({timer() - started_indexing:.2f}s).")
    elapsed = timer() - started
    progress(
        1.0,
        f"Task done ({elapsed:.2f}s).",
    )


def build_chunks(task: dict, progress_callback) -> list[dict]:
    if task["size"] > settings.DOC_MAXIMUM_SIZE:
        max_mb = int(settings.DOC_MAXIMUM_SIZE / 1024 / 1024)
        message = f"File size exceeds( <= {max_mb}Mb )"
        progress_callback(
            -1,
            message,
        )
        raise RuntimeError(message)

    parser_id = str(task["parser_id"]).lower()
    if parser_id not in FACTORY:
        raise RuntimeError(f"Parser is not supported yet: {task['parser_id']}")

    chunker = FACTORY[parser_id]
    try:
        started = timer()
        bucket, name = File2DocumentService.get_storage_address(doc_id=task["doc_id"])
        binary = settings.STORAGE_IMPL.get(bucket, name)
        if binary is None:
            raise FileNotFoundError(
                f"File not found: storage returned no content for {bucket}/{name}."
            )
        print(f"From minio({timer() - started:.2f}s) {bucket}/{name}", flush=True)
    except Exception as exc:
        if "not found" in str(exc).lower() or "no such file" in str(exc).lower():
            progress_callback(
                -1,
                f"Can not find file <{task['name']}> from minio. Could you try it again?",
            )
        else:
            error_message = str(exc).replace("'", "")
            progress_callback(-1, f"Get file from minio: {error_message}")
        raise

    try:
        raw_chunks = chunker.chunk(
            task["name"],
            binary=binary,
            from_page=task["from_page"],
            to_page=task["to_page"],
            lang=task["language"],
            callback=progress_callback,
            kb_id=task["kb_id"],
            parser_config=task.get("parser_config") or {},
            tenant_id=task["tenant_id"],
        )
    except Exception:
        raise

    docs: list[dict] = []
    for chunk in raw_chunks:
        if "__outline__" in chunk:
            chunk.pop("__outline__", None)
        document_chunk = {
            "doc_id": task["doc_id"],
            "kb_id": str(task["kb_id"]),
            **chunk,
        }
        document_chunk["docnm_kwd"] = task["name"]
        document_chunk["id"] = xxhash.xxh64(
            (document_chunk["content_with_weight"] + str(document_chunk["doc_id"])).encode(
                "utf-8",
                "surrogatepass",
            )
        ).hexdigest()
        document_chunk["create_time"] = str(datetime.now()).replace("T", " ")[:19]
        document_chunk["create_timestamp_flt"] = datetime.now().timestamp()
        docs.append(document_chunk)

    progress_callback(msg=f"Generate {len(docs)} chunks")
    return docs


def embedding(
    docs: list[dict],
    model: LLMBundle,
    parser_config: dict | None = None,
    callback=None,
) -> tuple[int, int]:
    parser_config = parser_config or {}
    titles = [doc.get("docnm_kwd", "Title") for doc in docs]
    contents = [_embedding_content(doc, model.max_length) for doc in docs]

    token_count = 0
    title_vectors, title_tokens = model.encode(titles[0:1])
    token_count += title_tokens
    content_vectors: list[list[float]] = []
    for offset in range(0, len(contents), settings.EMBEDDING_BATCH_SIZE):
        batch = contents[offset : offset + settings.EMBEDDING_BATCH_SIZE]
        vectors, batch_tokens = model.encode(batch)
        content_vectors.extend(vectors)
        token_count += batch_tokens
        if callback:
            callback(prog=0.7 + 0.2 * (offset + len(batch)) / len(contents), msg="")

    title_weight = float(parser_config.get("filename_embd_weight") or 0.1)
    title_vector = title_vectors[0] if title_vectors else []
    vector_size = 0
    for index, doc in enumerate(docs):
        content_vector = content_vectors[index]
        vector_size = len(content_vector)
        if title_vector and len(title_vector) == vector_size:
            vector = [
                title_weight * title_value + (1 - title_weight) * content_value
                for title_value, content_value in zip(title_vector, content_vector, strict=False)
            ]
        else:
            vector = content_vector
        doc[f"q_{len(vector)}_vec"] = vector
    return token_count, vector_size


def _embedding_content(doc: dict, max_length: int) -> str:
    questions = doc.get("question_kwd") or []
    if isinstance(questions, str):
        questions = [questions]
    content = "\n".join(str(question) for question in questions if str(question).strip())
    if not content:
        content = str(doc.get("content_with_weight") or "")
    content = re.sub(r"</?(table|td|caption|tr|th)( [^<>]{0,12})?>", " ", content)
    if not content.strip():
        content = "None"
    return content[: max(max_length - 10, 1)]


def init_kb(task: dict, vector_size: int):
    index_name = search.index_name(task["tenant_id"])
    return settings.docStoreConn.create_idx(
        index_name,
        task["kb_id"],
        vector_size,
        task.get("parser_id"),
    )


def insert_chunks(
    task_id: str,
    tenant_id: str,
    dataset_id: str,
    chunks: list[dict],
    progress_callback,
) -> bool:
    index_name = search.index_name(tenant_id)
    mothers = _mother_chunks(chunks)
    for offset in range(0, len(mothers), settings.DOC_BULK_SIZE):
        if has_canceled(task_id):
            progress_callback(-1, msg="Task has been canceled.")
            return False

        batch = mothers[offset : offset + settings.DOC_BULK_SIZE]
        errors = settings.docStoreConn.insert(batch, index_name, dataset_id)
        if errors:
            error_message = f"Insert mother chunk error: {errors}"
            progress_callback(-1, msg=error_message)
            raise RuntimeError(error_message)

    for offset in range(0, len(chunks), settings.DOC_BULK_SIZE):
        if has_canceled(task_id):
            progress_callback(-1, msg="Task has been canceled.")
            return False

        batch = chunks[offset : offset + settings.DOC_BULK_SIZE]
        errors = settings.docStoreConn.insert(batch, index_name, dataset_id)
        if errors:
            error_message = f"Insert chunk error: {errors}"
            progress_callback(-1, msg=error_message)
            raise RuntimeError(error_message)

        chunk_ids = [chunk["id"] for chunk in chunks[: offset + len(batch)]]
        TaskService.update_chunk_ids(task_id, " ".join(chunk_ids))
        progress_callback(prog=0.8 + 0.1 * (offset + len(batch)) / len(chunks), msg="")
    return True


def _mother_chunks(chunks: list[dict]) -> list[dict]:
    mothers: list[dict] = []
    mother_ids: set[str] = set()
    kept_fields = {
        "id",
        "content_with_weight",
        "doc_id",
        "docnm_kwd",
        "kb_id",
        "available_int",
        "position_int",
        "create_timestamp_flt",
        "page_num_int",
        "top_int",
    }
    for chunk in chunks:
        mother_text = str(chunk.get("mom") or chunk.get("mom_with_weight") or "")
        if not mother_text:
            continue
        mother_id = xxhash.xxh64(mother_text.encode("utf-8")).hexdigest()
        chunk["mom_id"] = mother_id
        if mother_id in mother_ids:
            continue
        mother_ids.add(mother_id)

        mother = copy.deepcopy(chunk)
        mother["id"] = mother_id
        mother["content_with_weight"] = mother_text
        mother["available_int"] = 0
        for field in list(mother.keys()):
            if field not in kept_fields:
                del mother[field]
        mothers.append(mother)
    return mothers


def set_progress(task_id: str, prog: float | None = None, msg: str = "Processing...") -> None:
    if has_canceled(task_id):
        payload = {"progress": -1, "progress_msg": _format_message(f"{msg} [Canceled]")}
        TaskService.update_progress(task_id, payload)
        raise RuntimeError("Task has been canceled.")
    payload = {"progress_msg": _format_message(msg)}
    if prog is not None:
        payload["progress"] = prog
    TaskService.update_progress(task_id, payload)


def _format_message(message: str) -> str:
    return f"{datetime.now().strftime('%H:%M:%S')} {message}"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Task Executor")
    parser.add_argument("-i", "--index", type=str, default="0")
    parser.add_argument("-t", "--type", type=str, default="common")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    TASK_TYPE = args.type
    TE_IDX = args.index
    CONSUMER_NAME = f"task_executor_{TASK_TYPE}_{TE_IDX}"
    main()
