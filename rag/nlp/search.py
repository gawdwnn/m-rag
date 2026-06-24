import re
from collections import Counter
from typing import Any


def index_name(uid: str) -> str:
    return f"ragflow_{uid}"


class Dealer:
    def retrieval(
        self,
        question: str,
        embd_mdl,
        tenant_ids: list[str] | str,
        kb_ids: list[str],
        page: int,
        page_size: int,
        similarity_threshold: float = 0.2,
        vector_similarity_weight: float = 0.3,
        top: int = 1024,
        doc_ids: list[str] | None = None,
        aggs: bool = True,
        rerank_mdl=None,
        highlight: bool = False,
        rank_feature: dict | None = None,
        trace_id=None,
    ) -> dict[str, Any]:
        ranks: dict[str, Any] = {"total": 0, "chunks": [], "doc_aggs": []}
        question = str(question or "").strip()
        if not question:
            return ranks

        from common import settings

        if isinstance(tenant_ids, str):
            tenant_ids = [tenant_id for tenant_id in tenant_ids.split(",") if tenant_id]

        page = max(int(page or 1), 1)
        page_size = max(min(int(page_size or 30), 200), 1)
        top = max(1, min(int(top or 1024), 2048))
        similarity_threshold = _clamp(float(similarity_threshold or 0), 0, 1)
        vector_similarity_weight = _clamp(float(vector_similarity_weight or 0), 0, 1)
        term_similarity_weight = 1 - vector_similarity_weight

        vectors, _token_count = embd_mdl.encode([question])
        query_vector = vectors[0] if vectors else []
        if not query_vector:
            return ranks

        vector_field = f"q_{len(query_vector)}_vec"
        total, candidates = settings.docStoreConn.search(
            [index_name(tenant_id) for tenant_id in tenant_ids],
            kb_ids,
            query_vector,
            vector_field,
            top,
            doc_ids=doc_ids,
        )
        if total == 0 or not candidates:
            return ranks

        scored: list[dict[str, Any]] = []
        for candidate in candidates:
            vector_similarity = _vector_similarity(candidate.get("_score", 0))
            term_similarity = _term_similarity(
                question,
                str(candidate.get("content_with_weight") or ""),
                str(candidate.get("content_ltks") or ""),
            )
            similarity = (
                term_similarity_weight * term_similarity
                + vector_similarity_weight * vector_similarity
            )
            if similarity < similarity_threshold:
                continue
            scored.append(
                {
                    "chunk_id": candidate.get("id", ""),
                    "content_ltks": candidate.get("content_ltks", ""),
                    "content_with_weight": candidate.get("content_with_weight", ""),
                    "doc_id": candidate.get("doc_id", ""),
                    "docnm_kwd": candidate.get("docnm_kwd", ""),
                    "kb_id": candidate.get("kb_id", ""),
                    "important_kwd": candidate.get("important_kwd", []),
                    "tag_kwd": candidate.get("tag_kwd", []),
                    "image_id": candidate.get("img_id", ""),
                    "similarity": similarity,
                    "vector_similarity": vector_similarity,
                    "term_similarity": term_similarity,
                    "vector": candidate.get(vector_field, []),
                    "positions": candidate.get("position_int", []),
                    "doc_type_kwd": candidate.get("doc_type_kwd", ""),
                    "mom_id": candidate.get("mom_id", ""),
                    "row_id": candidate.get("row_id", ""),
                }
            )

        scored.sort(key=lambda item: item["similarity"], reverse=True)
        ranks["total"] = len(scored)
        begin = (page - 1) * page_size
        ranks["chunks"] = scored[begin : begin + page_size]

        if aggs:
            doc_aggs: dict[str, dict[str, Any]] = {}
            for chunk in scored:
                doc_name = str(chunk.get("docnm_kwd") or "")
                if doc_name not in doc_aggs:
                    doc_aggs[doc_name] = {
                        "doc_name": doc_name,
                        "doc_id": chunk.get("doc_id", ""),
                        "count": 0,
                    }
                doc_aggs[doc_name]["count"] += 1
            ranks["doc_aggs"] = list(doc_aggs.values())

        return ranks

    def retrieval_by_children(self, chunks: list[dict], tenant_ids: list[str] | str):
        return chunks


def _vector_similarity(score: float) -> float:
    # Elasticsearch script score is cosineSimilarity + 1.0.
    return _clamp(float(score or 0) / 2, 0, 1)


def _term_similarity(question: str, content: str, tokenized_content: str) -> float:
    query_tokens = _tokens(question)
    if not query_tokens:
        return 0.0
    content_tokens = _tokens(tokenized_content or content)
    if not content_tokens:
        return 0.0

    query_counts = Counter(query_tokens)
    content_counts = Counter(content_tokens)
    overlap = sum(min(count, content_counts[token]) for token, count in query_counts.items())
    return _clamp(overlap / sum(query_counts.values()), 0, 1)


def _tokens(value: str) -> list[str]:
    return re.findall(r"[\w]+", value.lower())


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(value, high))
