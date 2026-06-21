from uuid import uuid4

from api.db.db_models import DB, Document, File, File2Document, connect_db
from common.constants import FileSource


class File2DocumentService:
    model = File2Document

    @classmethod
    def insert(cls, file_id: str, document_id: str) -> File2Document:
        connect_db()
        return cls.model.create(id=uuid4().hex, file_id=file_id, document_id=document_id)

    @classmethod
    def get_by_document_id(cls, document_id: str) -> list[File2Document]:
        connect_db()
        return list(cls.model.select().where(cls.model.document_id == document_id))

    @classmethod
    def delete_by_document_id(cls, document_id: str) -> int:
        connect_db()
        return cls.model.delete().where(cls.model.document_id == document_id).execute()

    @classmethod
    def get_storage_address(
        cls,
        doc_id: str | None = None,
        file_id: str | None = None,
    ) -> tuple[str, str]:
        connect_db()
        with DB.connection_context():
            bridge = None
            if doc_id:
                bridge = cls.model.get_or_none(cls.model.document_id == doc_id)
            elif file_id:
                bridge = cls.model.get_or_none(cls.model.file_id == file_id)

            if bridge is not None:
                file = File.get_by_id(bridge.file_id)
                if not file.source_type or file.source_type == FileSource.LOCAL.value:
                    return file.parent_id, file.location or ""
                doc_id = bridge.document_id

            if not doc_id:
                raise ValueError("doc_id or file_id is required.")
            doc = Document.get_by_id(doc_id)
            return doc.kb_id, doc.location or ""
