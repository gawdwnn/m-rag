from pathlib import Path
from typing import Any
from uuid import uuid4

import xxhash
from werkzeug.datastructures import FileStorage

from api.db import KNOWLEDGEBASE_FOLDER_NAME, FileType
from api.db.db_models import DB, Document, File, Knowledgebase, connect_db
from api.db.services.document_service import DocumentService
from api.db.services.file2document_service import File2DocumentService
from api.utils.file_utils import filename_type
from common import settings
from common.constants import FileSource
from rag.nlp import search

SUPPORTED_TYPES = {FileType.PDF.value, FileType.DOC.value}


class FileUploadError(Exception):
    pass


class FileService:
    model = File

    @classmethod
    def upload_document(
        cls,
        kb: Knowledgebase,
        file_objs: list[FileStorage],
        user_id: str,
    ) -> list[dict[str, Any]]:
        connect_db()
        root_folder = cls.get_root_folder(user_id)
        cls.init_knowledgebase_docs(root_folder["id"], user_id)
        kb_root_folder = cls.get_kb_folder(user_id)
        kb_folder = cls.new_a_file_from_kb(kb.tenant_id, kb.name, kb_root_folder["id"])
        uploaded: list[dict[str, Any]] = []

        for file_obj in file_objs:
            filename = _normalize_filename(file_obj.filename)
            suffix = Path(filename).suffix.lstrip(".").lower()
            file_type = filename_type(filename)
            data = file_obj.read()
            if not data:
                raise FileUploadError(f"{filename}: file is empty.")

            with DB.atomic():
                name = _deduplicate_document_name(filename, kb.id)
                location = name
                while settings.STORAGE_IMPL.obj_exist(kb.id, location):
                    location += "_"
                settings.STORAGE_IMPL.put(kb.id, location, data)

                doc_id = uuid4().hex
                doc = DocumentService.insert(
                    {
                        "id": doc_id,
                        "kb_id": kb.id,
                        "parser_id": cls.get_parser(file_type, name, kb.parser_id),
                        "pipeline_id": kb.pipeline_id,
                        "parser_config": kb.parser_config,
                        "created_by": user_id,
                        "type": file_type,
                        "name": name,
                        "source_type": "local",
                        "suffix": suffix,
                        "location": location,
                        "size": len(data),
                        "content_hash": xxhash.xxh128(data).hexdigest(),
                    }
                )

                cls.add_file_from_kb(doc.to_api(), kb_folder["id"], kb.tenant_id)
                uploaded.append(doc.to_api())

        return uploaded

    @classmethod
    def get_original_bytes(cls, bucket: str, name: str) -> bytes:
        return settings.STORAGE_IMPL.get(bucket, name)

    @classmethod
    def get_root_folder(cls, tenant_id: str) -> dict[str, Any]:
        connect_db()
        existing = cls.model.get_or_none(
            (cls.model.tenant_id == tenant_id) & (cls.model.parent_id == cls.model.id)
        )
        if existing:
            return existing_to_dict(existing)

        file_id = uuid4().hex
        file = cls.model.create(
            id=file_id,
            parent_id=file_id,
            tenant_id=tenant_id,
            created_by=tenant_id,
            name="/",
            type=FileType.FOLDER.value,
            size=0,
            location="",
        )
        return existing_to_dict(file)

    @classmethod
    def get_kb_folder(cls, tenant_id: str) -> dict[str, Any]:
        root_folder = cls.get_root_folder(tenant_id)
        root_id = root_folder["id"]
        kb_folder = cls.model.get_or_none(
            (cls.model.tenant_id == tenant_id)
            & (cls.model.parent_id == root_id)
            & (cls.model.name == KNOWLEDGEBASE_FOLDER_NAME)
        )
        if not kb_folder:
            return cls.new_a_file_from_kb(tenant_id, KNOWLEDGEBASE_FOLDER_NAME, root_id)
        return existing_to_dict(kb_folder)

    @classmethod
    def new_a_file_from_kb(
        cls,
        tenant_id: str,
        name: str,
        parent_id: str,
        ty: str = FileType.FOLDER.value,
        size: int = 0,
        location: str = "",
    ) -> dict[str, Any]:
        existing = cls.model.get_or_none(
            (cls.model.tenant_id == tenant_id)
            & (cls.model.parent_id == parent_id)
            & (cls.model.name == name)
        )
        if existing:
            return existing_to_dict(existing)
        file = cls.model.create(
            id=uuid4().hex,
            parent_id=parent_id,
            tenant_id=tenant_id,
            created_by=tenant_id,
            name=name,
            type=ty,
            size=size,
            location=location,
            source_type=FileSource.KNOWLEDGEBASE.value,
        )
        return existing_to_dict(file)

    @classmethod
    def init_knowledgebase_docs(cls, root_id: str, tenant_id: str) -> None:
        existing = cls.model.get_or_none(
            (cls.model.name == KNOWLEDGEBASE_FOLDER_NAME) & (cls.model.parent_id == root_id)
        )
        if existing:
            return
        folder = cls.new_a_file_from_kb(tenant_id, KNOWLEDGEBASE_FOLDER_NAME, root_id)
        for kb in Knowledgebase.select(Knowledgebase.id, Knowledgebase.name).where(
            Knowledgebase.tenant_id == tenant_id
        ):
            kb_folder = cls.new_a_file_from_kb(tenant_id, kb.name, folder["id"])
            for doc in Document.select().where(Document.kb_id == kb.id):
                cls.add_file_from_kb(doc.to_api(), kb_folder["id"], tenant_id)

    @classmethod
    def add_file_from_kb(cls, doc: dict[str, Any], kb_folder_id: str, tenant_id: str) -> None:
        for _ in File2DocumentService.get_by_document_id(doc["id"]):
            return
        file = cls.model.create(
            id=uuid4().hex,
            parent_id=kb_folder_id,
            tenant_id=tenant_id,
            created_by=tenant_id,
            name=doc["name"],
            type=doc["type"],
            size=doc["size"],
            location=doc["location"],
            source_type=FileSource.KNOWLEDGEBASE.value,
        )
        File2DocumentService.insert(file.id, doc["id"])

    @classmethod
    def delete_docs(cls, doc_ids: list[str], tenant_id: str) -> str:
        connect_db()
        errors: list[str] = []
        from api.db.services.task_service import TaskService, cancel_all_task_of

        for doc_id in doc_ids:
            try:
                exists, doc = DocumentService.get_by_id(doc_id)
                if not exists or doc is None:
                    raise FileUploadError("Document not found!")

                bucket, name = File2DocumentService.get_storage_address(doc_id=doc_id)
                bridges = File2DocumentService.get_by_document_id(doc_id)

                cancel_all_task_of(doc_id)
                TaskService.delete_by_doc_ids([doc_id])

                index_name = search.index_name(tenant_id)
                try:
                    settings.docStoreConn.delete({"doc_id": doc_id}, index_name, doc.kb_id)
                except Exception as exc:
                    raise RuntimeError(f"Failed to delete chunks from doc store: {exc}") from exc

                if not DocumentService.delete_document_and_update_kb_counts(doc_id):
                    raise FileUploadError("Document not found!")

                deleted_file_count = 0
                if bridges:
                    file_id = bridges[0].file_id
                    deleted_file_count = (
                        cls.model.delete()
                        .where(
                            (cls.model.id == file_id)
                            & (cls.model.source_type == FileSource.KNOWLEDGEBASE.value)
                        )
                        .execute()
                    )
                File2DocumentService.delete_by_document_id(doc_id)
                if deleted_file_count > 0 and bucket and name:
                    settings.STORAGE_IMPL.rm(bucket, name)
            except Exception as exc:
                errors.append(f"{doc_id}: {exc}")

        return "; ".join(errors)

    @staticmethod
    def get_parser(doc_type: str, filename: str, default: str) -> str:
        if doc_type == "visual":
            return "picture"
        if doc_type == "aural":
            return "audio"
        suffix = Path(filename).suffix.lower()
        if suffix in {".ppt", ".pptx", ".pages"}:
            return "presentation"
        if suffix in {".msg", ".eml"}:
            return "email"
        return default


def _normalize_filename(filename: str | None) -> str:
    name = Path(filename or "").name.strip()
    if not name:
        raise FileUploadError("No file selected.")
    if len(name.encode("utf-8")) > 255:
        raise FileUploadError("File name must be 255 bytes or less.")
    if filename_type(name) == FileType.OTHER.value:
        raise FileUploadError("This type of file has not been supported yet.")
    return name


def _deduplicate_document_name(name: str, kb_id: str) -> str:
    existing = {
        doc.name
        for doc in DocumentService.model.select(DocumentService.model.name).where(
            (DocumentService.model.kb_id == kb_id)
            & (DocumentService.model.status == "1")
        )
    }
    if name not in existing:
        return name

    stem = Path(name).stem
    suffix = Path(name).suffix
    counter = 1
    candidate = f"{stem} ({counter}){suffix}"
    while candidate in existing:
        counter += 1
        candidate = f"{stem} ({counter}){suffix}"
    return candidate


def existing_to_dict(file: File) -> dict[str, Any]:
    return {
        "id": file.id,
        "parent_id": file.parent_id,
        "tenant_id": file.tenant_id,
        "created_by": file.created_by,
        "name": file.name,
        "location": file.location,
        "size": int(file.size),
        "type": file.type,
        "source_type": file.source_type,
    }
