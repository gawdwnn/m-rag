import time
from datetime import datetime
from typing import Any

from peewee import DoesNotExist

from api.db.db_models import DB, Document, Knowledgebase, connect_db

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


def _current_timestamp() -> int:
    return int(time.time() * 1000)
