from typing import Any

from werkzeug.datastructures import FileStorage

from api.db.services import (
    DocumentService,
    FileService,
    FileUploadError,
    KnowledgebaseNotFound,
    KnowledgebaseService,
)


def list_documents(user_id: str, dataset_id: str, _args: dict[str, Any]):
    try:
        KnowledgebaseService.get_record(dataset_id, user_id)
        docs = DocumentService.list_by_dataset(dataset_id)
        return True, {"docs": docs, "total": len(docs)}
    except KnowledgebaseNotFound:
        return False, f"User '{user_id}' lacks permission for dataset '{dataset_id}'"


def upload_documents(user_id: str, dataset_id: str, file_objs: list[FileStorage]):
    try:
        kb = KnowledgebaseService.get_record(dataset_id, user_id)
        docs = FileService.upload_document(kb, file_objs, user_id)
        return True, docs
    except KnowledgebaseNotFound:
        return False, f"User '{user_id}' lacks permission for dataset '{dataset_id}'"
    except FileUploadError as exc:
        return False, str(exc)
