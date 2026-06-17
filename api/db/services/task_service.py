import logging
import time
from datetime import datetime
from typing import Any
from uuid import uuid4

import xxhash

from api.db.db_models import DB, Document, Knowledgebase, Task, Tenant, connect_db
from common import settings
from common.constants import MAXIMUM_TASK_PAGE_NUMBER
from rag.utils.redis_conn import REDIS_CONN

TASK_MAX_LOG_LENGTH = 3000


class TaskService:
    model = Task

    @classmethod
    def get_task(cls, task_id: str) -> dict[str, Any] | None:
        connect_db()
        with DB.connection_context():
            task = cls.model.get_or_none(cls.model.id == task_id)
            if task is None:
                return None
            doc = Document.get_or_none(Document.id == task.doc_id)
            if doc is None:
                return None
            kb = Knowledgebase.get_or_none(Knowledgebase.id == doc.kb_id)
            if kb is None:
                return None
            tenant = Tenant.get_or_none(Tenant.id == kb.tenant_id)

            if task.retry_count >= 3:
                cls.update_progress(
                    task.id,
                    {"progress": -1, "progress_msg": "ERROR: Task is abandoned after 3 attempts."},
                )
                return None

            cls.model.update(
                retry_count=task.retry_count + 1,
                progress=max(float(task.progress or 0), 0.03),
                update_time=_current_timestamp(),
                update_date=datetime.utcnow(),
            ).where(cls.model.id == task.id).execute()

            return {
                "id": task.id,
                "doc_id": task.doc_id,
                "from_page": int(task.from_page),
                "to_page": int(task.to_page),
                "task_type": task.task_type or "",
                "priority": int(task.priority),
                "retry_count": int(task.retry_count) + 1,
                "kb_id": doc.kb_id,
                "parser_id": doc.parser_id,
                "parser_config": doc.parser_config,
                "name": doc.name,
                "type": doc.type,
                "location": doc.location,
                "size": int(doc.size),
                "tenant_id": kb.tenant_id,
                "language": kb.language or "English",
                "embd_id": kb.embd_id,
                "llm_id": tenant.llm_id if tenant else "",
            }

    @classmethod
    def get_tasks(cls, doc_id: str) -> list[dict[str, Any]]:
        connect_db()
        with DB.connection_context():
            rows = (
                cls.model.select()
                .where(cls.model.doc_id == doc_id)
                .order_by(cls.model.from_page.asc(), cls.model.create_time.desc())
            )
            return [
                {
                    "id": row.id,
                    "from_page": int(row.from_page),
                    "progress": float(row.progress),
                    "digest": row.digest or "",
                    "chunk_ids": row.chunk_ids or "",
                }
                for row in rows
            ]

    @classmethod
    def update_progress(cls, task_id: str, info: dict[str, Any]) -> None:
        connect_db()
        with DB.connection_context():
            task = cls.model.get_or_none(cls.model.id == task_id)
            if task is None:
                logging.warning("Task %s not found while updating progress", task_id)
                return

            update: dict[str, Any] = {
                "update_time": _current_timestamp(),
                "update_date": datetime.utcnow(),
            }
            message = str(info.get("progress_msg") or "").strip()
            if message:
                update["progress_msg"] = _trim_log("\n".join([task.progress_msg or "", message]))

            if "progress" in info:
                next_progress = float(info["progress"])
                current_progress = float(task.progress or 0)
                if next_progress >= 1 or (
                    current_progress != -1
                    and (next_progress == -1 or next_progress > current_progress)
                ):
                    update["progress"] = next_progress

            if task.begin_at:
                update["process_duration"] = max(
                    (datetime.utcnow() - task.begin_at).total_seconds(),
                    0,
                )

            cls.model.update(**update).where(cls.model.id == task_id).execute()

    @classmethod
    def update_chunk_ids(cls, task_id: str, chunk_ids: str) -> None:
        connect_db()
        with DB.connection_context():
            cls.model.update(chunk_ids=chunk_ids).where(cls.model.id == task_id).execute()

    @classmethod
    def delete_by_doc_ids(cls, doc_ids: list[str]) -> int:
        connect_db()
        with DB.connection_context():
            if not doc_ids:
                return 0
            return cls.model.delete().where(cls.model.doc_id.in_(doc_ids)).execute()


def queue_tasks(doc: dict[str, Any], bucket: str, name: str, priority: int = 0) -> None:
    from api.db.services.document_service import DocumentService

    task = {
        "id": uuid4().hex,
        "doc_id": doc["id"],
        "from_page": 0,
        "to_page": MAXIMUM_TASK_PAGE_NUMBER,
        "task_type": "",
        "priority": priority,
        "begin_at": datetime.utcnow(),
        "progress": 0.0,
        "digest": _task_digest(doc, bucket, name),
        "chunk_ids": "",
    }
    connect_db()
    with DB.atomic():
        Task.delete().where(Task.doc_id == doc["id"]).execute()
        Task.create(**task)
        DocumentService.begin2parse(doc["id"])

    queue_name = settings.get_svr_queue_name(priority, "common")
    message = {"id": task["id"], "doc_id": doc["id"], "task_type": task["task_type"]}
    if not REDIS_CONN.queue_product(queue_name, message=message):
        raise RuntimeError("Can't access Redis. Please check Redis status.")


def cancel_all_task_of(doc_id: str) -> None:
    connect_db()
    with DB.connection_context():
        tasks = list(Task.select(Task.id).where(Task.doc_id == doc_id))
    for task in tasks:
        try:
            REDIS_CONN.set(f"{task.id}-cancel", "x", ex=60 * 60)
        except Exception:
            logging.exception("Failed to set cancel marker for task %s", task.id)


def has_canceled(task_id: str) -> bool:
    try:
        return REDIS_CONN.get(f"{task_id}-cancel") is not None
    except Exception:
        logging.exception("Failed to read cancel marker for task %s", task_id)
        return False


def _task_digest(doc: dict[str, Any], bucket: str, name: str) -> str:
    hasher = xxhash.xxh64()
    for value in [
        doc.get("id", ""),
        doc.get("parser_id", ""),
        doc.get("parser_config", {}),
        bucket,
        name,
        0,
        MAXIMUM_TASK_PAGE_NUMBER,
    ]:
        hasher.update(str(value).encode("utf-8"))
    return hasher.hexdigest()


def _trim_log(text: str) -> str:
    lines = text.strip().splitlines()
    return "\n".join(lines[-TASK_MAX_LOG_LENGTH:])


def _current_timestamp() -> int:
    return int(time.time() * 1000)
