import signal
import time
from datetime import datetime
from functools import partial

from api.db.db_models import init_database_tables
from api.db.services.document_service import DocumentService
from api.db.services.task_service import TaskService, has_canceled
from common import settings
from rag.utils.redis_conn import REDIS_CONN


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
        time.sleep(0.75)
        progress(0.5, "Focused ingestion handoff reached the worker.")
        time.sleep(0.75)
        progress(1.0, "Task done. Parser/chunker work starts in the next slice.")
    except RuntimeError as exc:
        print(f"task_executor stopped task {task_id}: {exc}", flush=True)
    finally:
        exists, doc = DocumentService.get_by_id(doc_id)
        if exists and doc is not None:
            DocumentService.update_progress_immediately([doc.to_api()])


def set_progress(task_id: str, prog: float, msg: str) -> None:
    if has_canceled(task_id):
        TaskService.update_progress(
            task_id,
            {"progress": -1, "progress_msg": _format_message(f"{msg} [Canceled]")},
        )
        raise RuntimeError("Task has been canceled.")
    TaskService.update_progress(
        task_id,
        {"progress": prog, "progress_msg": _format_message(msg)},
    )


def _format_message(message: str) -> str:
    return f"{datetime.now().strftime('%H:%M:%S')} {message}"
