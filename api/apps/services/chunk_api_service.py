import re
from typing import Any

from api.db.services import DocumentService, KnowledgebaseNotFound, KnowledgebaseService
from common import settings
from rag.nlp import search


def list_chunks(
    user_id: str,
    dataset_id: str,
    document_id: str,
    args: dict[str, Any],
):
    try:
        kb = KnowledgebaseService.get_record(dataset_id, user_id)
    except KnowledgebaseNotFound:
        return False, f"You don't own the dataset {dataset_id}."

    docs = DocumentService.query(id=document_id, kb_id=dataset_id)
    if not docs:
        return False, f"You don't own the document {document_id}."
    doc = docs[0]

    index_name = search.index_name(kb.tenant_id)
    chunk_id = str(args.get("id") or "").strip()
    if chunk_id:
        chunk = settings.docStoreConn.get(chunk_id, index_name, [dataset_id])
        if not chunk or str(chunk.get("doc_id")) != document_id:
            return False, f"Chunk not found: {dataset_id}/{chunk_id}"
        return True, {
            "total": 1,
            "chunks": [_map_chunk(chunk)],
            "doc": doc.to_api(),
        }

    page = _to_positive_int(args.get("page"), 1)
    page_size = min(_to_positive_int(args.get("page_size"), 30), 200)
    total, chunks = settings.docStoreConn.list_chunks(
        document_id,
        index_name,
        dataset_id,
        page=page,
        page_size=page_size,
    )
    return True, {
        "total": total,
        "chunks": [_map_chunk(chunk) for chunk in chunks],
        "doc": doc.to_api(),
    }


def _map_chunk(chunk: dict[str, Any]) -> dict[str, Any]:
    clean = _strip_chunk_runtime_fields(dict(chunk))
    return {
        "id": clean.get("id", clean.get("chunk_id", "")),
        "content": clean.get("content_with_weight", ""),
        "document_id": clean.get("doc_id", clean.get("document_id", "")),
        "docnm_kwd": clean.get("docnm_kwd", ""),
        "important_keywords": clean.get("important_kwd", []),
        "questions": clean.get("question_kwd", []),
        "dataset_id": clean.get("kb_id", clean.get("dataset_id", "")),
        "image_id": clean.get("img_id", ""),
        "available": bool(int(clean.get("available_int", 1) or 0)),
        "positions": clean.get("position_int", []),
        "tag_kwd": clean.get("tag_kwd", []),
        "tag_feas": clean.get("tag_feas", {}),
    }


def _strip_chunk_runtime_fields(chunk: dict[str, Any]) -> dict[str, Any]:
    for key in [name for name in chunk if re.search(r"(_vec$|_sm_|_tks|_ltks)", name)]:
        chunk.pop(key, None)
    return chunk


def _to_positive_int(value: Any, default: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    return parsed if parsed > 0 else default
