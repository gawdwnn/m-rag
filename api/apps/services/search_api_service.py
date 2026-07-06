from typing import Any

from api.apps.services import dataset_api_service
from api.db.services import (
    KnowledgebaseNotFound,
    SearchNotFound,
    SearchService,
    SearchValidationError,
)


def create_search(user_id: str, req: dict[str, Any]):
    try:
        return True, SearchService.create(req, user_id)
    except (SearchValidationError, KnowledgebaseNotFound) as exc:
        return False, str(exc)


def list_searches(user_id: str, args: dict[str, Any]):
    try:
        search_apps, total = SearchService.list(
            user_id,
            owner_ids=_string_list(args.get("owner_ids")),
            keywords=str(args.get("keywords", "") or ""),
            page=_positive_int(args.get("page"), 1),
            page_size=_positive_int(args.get("page_size"), 30),
            orderby=str(args.get("orderby") or "create_time"),
            desc=str(args.get("desc", "true")).lower() != "false",
        )
        return True, {"search_apps": search_apps, "total": total}
    except SearchValidationError as exc:
        return False, str(exc)


def get_search(search_id: str, user_id: str):
    try:
        return True, SearchService.get_detail(search_id, user_id)
    except SearchNotFound:
        return False, "Can't find this Search App!"


def update_search(user_id: str, search_id: str, req: dict[str, Any]):
    try:
        return True, SearchService.update(search_id, req, user_id)
    except (SearchNotFound, SearchValidationError, KnowledgebaseNotFound) as exc:
        return False, str(exc)


def delete_search(user_id: str, search_id: str):
    try:
        SearchService.delete(search_id, user_id)
        return True, True
    except SearchNotFound:
        return False, "No authorization."


def search_completion(user_id: str, search_id: str, req: dict[str, Any]):
    if not SearchService.accessible4deletion(search_id, user_id):
        return False, "No authorization."

    try:
        search_app = SearchService.get_detail(search_id, user_id)
    except SearchNotFound:
        return False, f"Cannot find search {search_id}"

    question = str(req.get("question") or "").strip()
    if not question:
        return False, "question is required."

    search_config = search_app.get("search_config") or {}
    kb_ids = search_config.get("kb_ids") or []
    if not kb_ids:
        return False, "`kb_ids` is required."

    retrieval_request = {
        "dataset_ids": kb_ids,
        "question": question,
        "page": _positive_int(req.get("page"), 1),
        "size": _positive_int(req.get("size"), 30),
        "top_k": search_config.get("top_k"),
        "similarity_threshold": search_config.get("similarity_threshold"),
        "vector_similarity_weight": search_config.get("vector_similarity_weight"),
        "doc_ids": req.get("doc_ids", search_config.get("doc_ids") or []),
    }
    return dataset_api_service.search_datasets(user_id, retrieval_request)


def _positive_int(value: Any, default: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    return max(parsed, 1)


def _string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]
