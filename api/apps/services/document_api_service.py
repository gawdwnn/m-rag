from typing import Any

from werkzeug.datastructures import FileStorage

from api.db.services import (
    DocumentService,
    File2DocumentService,
    FileService,
    FileUploadError,
    KnowledgebaseNotFound,
    KnowledgebaseService,
    TaskService,
)
from api.db.services.task_service import cancel_all_task_of
from common.constants import TaskStatus


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


def ingest_documents(user_id: str, payload: dict[str, Any]):
    document_ids = payload.get("doc_ids")
    run = str(payload.get("run", ""))
    if not isinstance(document_ids, list) or not document_ids:
        return False, "`doc_ids` is required"
    if run not in {TaskStatus.RUNNING.value, TaskStatus.CANCEL.value}:
        return False, "`run` must be 1 (run) or 2 (cancel)"

    errors: list[str] = []
    success_count = 0
    kb_table_num_map: dict[str, Any] = {}

    for doc_id in _unique_strings(document_ids):
        success, message = _run_one_document(
            user_id=user_id,
            doc_id=doc_id,
            run=run,
            delete=bool(payload.get("delete", False)),
            apply_kb=bool(payload.get("apply_kb", False)),
            kb_table_num_map=kb_table_num_map,
        )
        if success:
            success_count += 1
        else:
            errors.append(message)

    if success_count == 0 and errors:
        return False, "; ".join(errors)
    result: dict[str, Any] = {"success_count": success_count}
    if errors:
        result["errors"] = errors
    return True, result


def parse_documents(user_id: str, dataset_id: str, payload: dict[str, Any]):
    try:
        KnowledgebaseService.get_record(dataset_id, user_id)
    except KnowledgebaseNotFound:
        return False, f"User '{user_id}' lacks permission for dataset '{dataset_id}'"

    document_ids = payload.get("document_ids")
    if not isinstance(document_ids, list) or not document_ids:
        return False, "`document_ids` is required"

    errors: list[str] = []
    success_count = 0
    kb_table_num_map: dict[str, Any] = {}
    for doc_id in _unique_strings(document_ids):
        if not DocumentService.query(kb_id=dataset_id, id=doc_id):
            errors.append(f"Document not found: {doc_id}")
            continue
        success, message = _run_one_document(
            user_id=user_id,
            doc_id=doc_id,
            run=TaskStatus.RUNNING.value,
            delete=True,
            apply_kb=False,
            kb_table_num_map=kb_table_num_map,
        )
        if success:
            success_count += 1
        else:
            errors.append(message)

    if success_count == 0 and errors:
        return False, "; ".join(errors)
    result: dict[str, Any] = {"success_count": success_count}
    if errors:
        result["errors"] = errors
    return True, result


def stop_parse_documents(user_id: str, dataset_id: str, payload: dict[str, Any]):
    try:
        KnowledgebaseService.get_record(dataset_id, user_id)
    except KnowledgebaseNotFound:
        return False, f"User '{user_id}' lacks permission for dataset '{dataset_id}'"

    document_ids = payload.get("document_ids")
    if not isinstance(document_ids, list) or not document_ids:
        return False, "`document_ids` is required"

    errors: list[str] = []
    success_count = 0
    for doc_id in _unique_strings(document_ids):
        if not DocumentService.query(kb_id=dataset_id, id=doc_id):
            errors.append(f"Document not found: {doc_id}")
            continue
        success, message = _run_one_document(
            user_id=user_id,
            doc_id=doc_id,
            run=TaskStatus.CANCEL.value,
            delete=False,
            apply_kb=False,
            kb_table_num_map={},
        )
        if success:
            success_count += 1
        else:
            errors.append(message)

    if success_count == 0 and errors:
        return False, "; ".join(errors)
    result: dict[str, Any] = {"success_count": success_count}
    if errors:
        result["errors"] = errors
    return True, result


def delete_documents(user_id: str, dataset_id: str, payload: dict[str, Any]):
    try:
        kb = KnowledgebaseService.get_record(dataset_id, user_id)
    except KnowledgebaseNotFound:
        return False, f"User '{user_id}' lacks permission for dataset '{dataset_id}'"

    document_ids = payload.get("ids") or []
    delete_all = bool(payload.get("delete_all", False))
    if not delete_all and not document_ids:
        return False, "`ids` is required unless `delete_all` is true"
    if delete_all and document_ids:
        return False, "Do not provide both `ids` and `delete_all`"
    if delete_all:
        document_ids = [doc.id for doc in DocumentService.query(kb_id=dataset_id)]
    if not isinstance(document_ids, list):
        return False, "`ids` must be a list"

    doc_ids = _unique_strings(document_ids)
    dataset_doc_ids = {doc.id for doc in DocumentService.query(kb_id=dataset_id)}
    invalid_ids = [doc_id for doc_id in doc_ids if doc_id not in dataset_doc_ids]
    if invalid_ids:
        return False, (
            f"These documents do not belong to dataset {dataset_id} or Document not found: "
            f"{', '.join(invalid_ids)}"
        )

    errors = FileService.delete_docs(doc_ids, kb.tenant_id)
    if errors:
        return False, errors
    return True, {"deleted": len(doc_ids)}


def batch_update_document_status(user_id: str, dataset_id: str, payload: dict[str, Any]):
    try:
        KnowledgebaseService.get_record(dataset_id, user_id)
    except KnowledgebaseNotFound:
        return False, f"User '{user_id}' lacks permission for dataset '{dataset_id}'"

    document_ids = payload.get("doc_ids") or []
    status = str(payload.get("status", ""))
    if not isinstance(document_ids, list) or not document_ids:
        return False, "`doc_ids` must be a non-empty list"
    if status not in {"0", "1"}:
        return False, "`status` must be 0 or 1"

    doc_ids = _unique_strings(document_ids)
    dataset_doc_ids = {doc.id for doc in DocumentService.query(kb_id=dataset_id)}
    invalid_ids = [doc_id for doc_id in doc_ids if doc_id not in dataset_doc_ids]
    if invalid_ids:
        return False, (
            f"These documents do not belong to dataset {dataset_id} or Document not found: "
            f"{', '.join(invalid_ids)}"
        )

    for doc_id in doc_ids:
        DocumentService.update_by_id(doc_id, {"status": status})
    return True, {"updated": len(doc_ids)}


def get_document_file(user_id: str, document_id: str, dataset_id: str | None = None):
    exists, doc = DocumentService.get_by_id(document_id)
    if not exists or doc is None:
        return False, "Document not found!"

    if dataset_id is not None and doc.kb_id != dataset_id:
        return False, f"The dataset does not own the document {document_id}."

    try:
        KnowledgebaseService.get_record(doc.kb_id, user_id)
    except KnowledgebaseNotFound:
        return False, "No authorization."

    bucket, name = File2DocumentService.get_storage_address(doc_id=document_id)
    data = FileService.get_original_bytes(bucket, name)
    return True, {
        "data": data,
        "name": doc.name or document_id,
        "suffix": doc.suffix or "",
        "type": doc.type,
    }


def _run_one_document(
    *,
    user_id: str,
    doc_id: str,
    run: str,
    delete: bool,
    apply_kb: bool,
    kb_table_num_map: dict[str, Any],
) -> tuple[bool, str]:
    exists, doc = DocumentService.get_by_id(doc_id)
    if not exists or doc is None:
        return False, f"Document not found: {doc_id}"
    try:
        kb = KnowledgebaseService.get_record(doc.kb_id, user_id)
    except KnowledgebaseNotFound:
        return False, "No authorization."

    if run == TaskStatus.CANCEL.value:
        tasks = TaskService.get_tasks(doc_id)
        has_unfinished_task = any((task["progress"] or 0) < 1 for task in tasks)
        if (
            str(doc.run) in {TaskStatus.RUNNING.value, TaskStatus.CANCEL.value}
            or has_unfinished_task
        ):
            cancel_all_task_of(doc_id)
            DocumentService.update_by_id(doc_id, {"run": TaskStatus.CANCEL.value})
            return True, ""
        return False, "Cannot cancel a task that is not in RUNNING status"

    info: dict[str, Any] = {"run": TaskStatus.RUNNING.value, "progress": 0}
    if delete or str(doc.run) == TaskStatus.DONE.value:
        DocumentService.clear_chunk_num_when_rerun(doc_id)
        info.update({"progress_msg": "", "chunk_num": 0, "token_num": 0})

    if apply_kb:
        parser_config = dict(doc.parser_config or {})
        parser_config["llm_id"] = kb.parser_config.get("llm_id")
        DocumentService.update_by_id(doc_id, {"parser_config": parser_config})
        exists, doc = DocumentService.get_by_id(doc_id)
        if not exists or doc is None:
            return False, f"Document not found: {doc_id}"

    DocumentService.update_by_id(doc_id, info)
    if delete:
        TaskService.delete_by_doc_ids([doc_id])

    DocumentService.run(kb.tenant_id, doc.to_api(), kb_table_num_map)
    return True, ""


def _unique_strings(values: list[Any]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        item = str(value).strip()
        if item and item not in seen:
            seen.add(item)
            result.append(item)
    return result
