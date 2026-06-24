from typing import Any

from api.db.services import (
    KnowledgebaseNotFound,
    KnowledgebaseService,
    KnowledgebaseValidationError,
)
from api.db.services.llm_service import LLMBundle
from common import settings


async def create_dataset(tenant_id: str, req: dict[str, Any]):
    try:
        return True, KnowledgebaseService.create(req, tenant_id)
    except KnowledgebaseValidationError as exc:
        return False, str(exc)


async def delete_datasets(tenant_id: str, ids: list[str] | None = None, delete_all: bool = False):
    if ids is None and not delete_all:
        return True, {"success_count": 0}
    try:
        KnowledgebaseService.delete_many(ids or [], tenant_id)
        return True, {"success_count": len(ids or [])}
    except KnowledgebaseNotFound as exc:
        return False, f"User '{tenant_id}' lacks permission for datasets: '{exc}'"


def list_datasets(tenant_id: str, args: dict[str, Any]):
    try:
        return True, {"data": KnowledgebaseService.list(tenant_id), "total": 0}
    except KnowledgebaseValidationError as exc:
        return False, str(exc)


def get_dataset(dataset_id: str, tenant_id: str):
    try:
        return True, KnowledgebaseService.get(dataset_id, tenant_id)
    except KnowledgebaseNotFound:
        return False, f"User '{tenant_id}' lacks permission for dataset '{dataset_id}'"


async def update_dataset(tenant_id: str, dataset_id: str, req: dict[str, Any]):
    try:
        return True, KnowledgebaseService.update(dataset_id, req, tenant_id)
    except KnowledgebaseValidationError as exc:
        return False, str(exc)
    except KnowledgebaseNotFound:
        return False, f"User '{tenant_id}' lacks permission for dataset '{dataset_id}'"


def search_datasets(user_id: str, req: dict[str, Any]):
    dataset_ids = [str(value) for value in req.get("dataset_ids", []) if str(value).strip()]
    if not dataset_ids:
        return False, "dataset_ids is required."

    question = str(req.get("question") or "").strip()
    if not question:
        return False, "question is required."

    try:
        records = [
            KnowledgebaseService.get_record(dataset_id, user_id)
            for dataset_id in dataset_ids
        ]
    except KnowledgebaseNotFound as exc:
        return False, f"User '{user_id}' lacks permission for dataset '{exc}'"

    embedding_models = {record.embd_id for record in records}
    if len(embedding_models) != 1:
        return False, "Datasets use different embedding models."

    doc_ids = req.get("doc_ids", [])
    if doc_ids is not None and not isinstance(doc_ids, list):
        return False, "`doc_ids` should be a list"

    page = _positive_int(req.get("page"), 1)
    size = min(_positive_int(req.get("size"), 30), 200)
    top_k = min(_positive_int(req.get("top_k"), 1024), 2048)
    similarity_threshold = _float_between(
        req.get("similarity_threshold"),
        0.0,
        1.0,
        records[0].similarity_threshold,
    )
    vector_similarity_weight = _float_between(
        req.get("vector_similarity_weight"),
        0.0,
        1.0,
        records[0].vector_similarity_weight,
    )

    kb = records[0]
    embd_mdl = LLMBundle(kb.tenant_id, kb.embd_id, lang=kb.language or "English")
    ranks = settings.retriever.retrieval(
        question,
        embd_mdl,
        [kb.tenant_id],
        dataset_ids,
        page,
        size,
        similarity_threshold,
        vector_similarity_weight,
        doc_ids=[str(value) for value in doc_ids] if doc_ids else [],
        top=top_k,
    )
    ranks["chunks"] = settings.retriever.retrieval_by_children(ranks["chunks"], [kb.tenant_id])
    ranks["labels"] = []

    for chunk in ranks["chunks"]:
        chunk.pop("vector", None)

    return True, ranks


def _positive_int(value: Any, default: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    return max(parsed, 1)


def _float_between(value: Any, low: float, high: float, default: float) -> float:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        parsed = default
    return max(low, min(parsed, high))
