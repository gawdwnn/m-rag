import signal
import time
from datetime import datetime
from functools import partial
from timeit import default_timer as timer

import xxhash

from api.db.db_models import init_database_tables
from api.db.services.document_service import DocumentService
from api.db.services.file2document_service import File2DocumentService
from api.db.services.task_service import TaskService, has_canceled
from common import settings
from rag.app import naive
from rag.utils.redis_conn import REDIS_CONN

FACTORY = {
    "general": naive,
    "naive": naive,
}


def main() -> None:
    running = True

    def stop(_signum, _frame) -> None:
        nonlocal running
        running = False

    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)

    init_database_tables()
    print("task_executor booted; waiting for queued document tasks.", flush=True)
    while running:
        task = collect()
        if task is None:
            time.sleep(1)
            continue
        run_task(task)

    print("task_executor stopped.", flush=True)


def collect() -> dict | None:
    for queue_name in settings.get_svr_queue_names("common"):
        redis_msg = REDIS_CONN.queue_consumer(queue_name)
        if not redis_msg:
            continue
        message = redis_msg.get_message()
        if not message:
            print(f"collect got empty message of {redis_msg.get_msg_id()}", flush=True)
            redis_msg.ack()
            return None
        task = TaskService.get_task(str(message["id"]))
        if not task or has_canceled(str(message["id"])):
            print(f"collect task {message['id']} is unknown or cancelled", flush=True)
            redis_msg.ack()
            return None
        redis_msg.ack()
        return task
    return None


def run_task(task: dict) -> None:
    task_id = task["id"]
    doc_id = task["doc_id"]
    progress = partial(set_progress, task_id)
    print(f"task_executor received task {task_id} for document {doc_id}", flush=True)
    try:
        progress(0.15, "Task has been received.")
        started = timer()
        chunks = build_chunks(task, progress)
        if not chunks:
            progress(1.0, f"No chunk built from {task['name']}")
            return

        TaskService.update_chunk_ids(task_id, " ".join(chunk["id"] for chunk in chunks))
        elapsed = timer() - started
        progress(
            1.0,
            f"Task done ({elapsed:.2f}s). Embedding/indexing starts in the next slice.",
        )
    except RuntimeError as exc:
        if "canceled" not in str(exc).lower():
            error_message = str(exc).replace("'", "")
            progress(-1, f"Internal server error while chunking: {error_message}")
        print(f"task_executor stopped task {task_id}: {exc}", flush=True)
    except Exception as exc:
        error_message = str(exc).replace("'", "")
        progress(-1, f"Internal server error while chunking: {error_message}")
        print(f"task_executor failed task {task_id}: {exc}", flush=True)
    finally:
        exists, doc = DocumentService.get_by_id(doc_id)
        if exists and doc is not None:
            DocumentService.update_progress_immediately([doc.to_api()])


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
