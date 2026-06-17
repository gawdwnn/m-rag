import random
import time
from datetime import datetime
from typing import Any

from peewee import DoesNotExist

from api.db.db_models import DB, Document, Knowledgebase, Task, connect_db
from common.constants import TaskStatus

VALID_STATUS = "1"


class DocumentNotFound(Exception):
    pass


class DocumentService:
    model = Document

    @classmethod
    def insert(cls, doc: dict[str, Any]) -> Document:
        connect_db()
        with DB.atomic():
            created = cls.model.create(**doc)
            updated = (
                Knowledgebase.update(
                    doc_num=Knowledgebase.doc_num + 1,
                    update_time=_current_timestamp(),
                    update_date=datetime.utcnow(),
                )
                .where(
                    (Knowledgebase.id == doc["kb_id"])
                    & (Knowledgebase.status == VALID_STATUS)
                )
                .execute()
            )
            if updated == 0:
                raise DocumentNotFound(f"Knowledgebase {doc['kb_id']} not found.")
            return created

    @classmethod
    def list_by_dataset(cls, dataset_id: str) -> list[dict[str, Any]]:
        connect_db()
        with DB.connection_context():
            docs = (
                cls.model.select()
                .where(
                    (cls.model.kb_id == dataset_id)
                    & (cls.model.status == VALID_STATUS)
                )
                .order_by(cls.model.create_time.desc(), cls.model.name.asc())
            )
            return [doc.to_api() for doc in docs]

    @classmethod
    def get(cls, document_id: str, dataset_id: str) -> Document:
        connect_db()
        with DB.connection_context():
            try:
                return cls.model.get(
                    (cls.model.id == document_id)
                    & (cls.model.kb_id == dataset_id)
                    & (cls.model.status == VALID_STATUS)
                )
            except DoesNotExist as exc:
                raise DocumentNotFound(document_id) from exc

    @classmethod
    def get_by_id(cls, document_id: str) -> tuple[bool, Document | None]:
        connect_db()
        with DB.connection_context():
            document = cls.model.get_or_none(
                (cls.model.id == document_id) & (cls.model.status == VALID_STATUS)
            )
            return document is not None, document

    @classmethod
    def query(cls, **filters: Any) -> list[Document]:
        connect_db()
        query = cls.model.select().where(cls.model.status == VALID_STATUS)
        for key, value in filters.items():
            query = query.where(getattr(cls.model, key) == value)
        with DB.connection_context():
            return list(query)

    @classmethod
    def update_by_id(cls, document_id: str, info: dict[str, Any]) -> int:
        connect_db()
        payload = {
            **info,
            "update_time": _current_timestamp(),
            "update_date": datetime.utcnow(),
        }
        with DB.connection_context():
            return cls.model.update(**payload).where(cls.model.id == document_id).execute()

    @classmethod
    def clear_chunk_num_when_rerun(cls, document_id: str) -> int:
        connect_db()
        with DB.atomic():
            doc = cls.model.get_or_none(cls.model.id == document_id)
            if doc is None:
                raise DocumentNotFound(document_id)
            updated = (
                Knowledgebase.update(
                    token_num=Knowledgebase.token_num - doc.token_num,
                    chunk_num=Knowledgebase.chunk_num - doc.chunk_num,
                    update_time=_current_timestamp(),
                    update_date=datetime.utcnow(),
                )
                .where(Knowledgebase.id == doc.kb_id)
                .execute()
            )
            cls.model.update(token_num=0, chunk_num=0).where(cls.model.id == document_id).execute()
            return updated

    @classmethod
    def begin2parse(cls, document_id: str) -> None:
        cls.update_by_id(
            document_id,
            {
                "progress_msg": "Task is queued...",
                "process_begin_at": datetime.utcnow(),
                "progress": random.random() / 100.0,
                "run": TaskStatus.RUNNING.value,
            },
        )

    @classmethod
    def run(cls, tenant_id: str, doc: dict[str, Any], _kb_table_num_map: dict[str, Any]) -> None:
        from api.db.services.file2document_service import File2DocumentService
        from api.db.services.task_service import queue_tasks

        doc["tenant_id"] = tenant_id
        bucket, name = File2DocumentService.get_storage_address(doc_id=doc["id"])
        queue_tasks(doc, bucket, name, 0)

    @classmethod
    def update_progress(cls) -> None:
        connect_db()
        with DB.connection_context():
            docs = [
                doc.to_api()
                for doc in cls.model.select().where(
                    (cls.model.status == VALID_STATUS)
                    & (cls.model.run == TaskStatus.RUNNING.value)
                )
            ]
        cls.update_progress_immediately(docs)

    @classmethod
    def update_progress_immediately(cls, docs: list[dict[str, Any]]) -> None:
        connect_db()
        with DB.connection_context():
            for doc in docs:
                cls._sync_one_progress(doc["id"])

    @classmethod
    def _sync_one_progress(cls, document_id: str) -> None:
        doc = cls.model.get_or_none(cls.model.id == document_id)
        if doc is None or doc.run == TaskStatus.CANCEL.value:
            return

        tasks = list(
            Task.select()
            .where(Task.doc_id == document_id)
            .order_by(Task.from_page.asc(), Task.create_time.asc())
        )
        if not tasks:
            return

        progress_total = 0.0
        finished = True
        failed = 0
        messages: list[str] = []
        for task in tasks:
            progress = float(task.progress or 0)
            if 0 <= progress < 1:
                finished = False
            if progress == -1:
                failed += 1
            progress_total += progress if progress >= 0 else 0
            if task.progress_msg:
                messages.append(task.progress_msg)

        next_progress = progress_total / len(tasks)
        next_run = TaskStatus.RUNNING.value
        if finished and failed:
            next_progress = -1
            next_run = TaskStatus.FAIL.value
        elif finished:
            next_progress = 1
            next_run = TaskStatus.DONE.value

        begin_at = doc.process_begin_at or datetime.utcnow()
        duration = max((datetime.utcnow() - begin_at).total_seconds(), 0)
        cls.model.update(
            run=next_run,
            progress=next_progress,
            progress_msg="\n".join(sorted(messages)) or doc.progress_msg,
            process_begin_at=begin_at,
            process_duration=duration,
            update_time=_current_timestamp(),
            update_date=datetime.utcnow(),
        ).where(
            (cls.model.id == document_id)
            & ((cls.model.run.is_null(True)) | (cls.model.run != TaskStatus.CANCEL.value))
        ).execute()


def _current_timestamp() -> int:
    return int(time.time() * 1000)
