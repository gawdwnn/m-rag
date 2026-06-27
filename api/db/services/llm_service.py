import hashlib
import math
import re
from typing import Any


class LLMBundle:
    def __init__(
        self,
        tenant_id: str,
        model_config: str | dict[str, Any],
        lang: str = "English",
    ) -> None:
        self.tenant_id = tenant_id
        if isinstance(model_config, str):
            model_config = {
                "llm_name": model_config,
                "llm_factory": "local",
                "model_type": "embedding",
            }
        self.model_config = model_config
        self.llm_name = str(model_config.get("llm_name") or "")
        self.llm_factory = str(model_config.get("llm_factory") or "local")
        self.lang = lang
        self.max_length = _positive_int(model_config.get("max_length"), 512)
        # Local deterministic vectors stand in for the selected embedding model.
        # The dimension still behaves like RAG: it comes from model output.
        self.vector_size = _positive_int(model_config.get("vector_size"), 32)

    def encode(self, texts: list[str]) -> tuple[list[list[float]], int]:
        safe_texts = [_safe_text(text, self.max_length) for text in texts]
        vectors = [_embed_text(text, self.vector_size) for text in safe_texts]
        token_count = sum(len(_tokens(text)) for text in safe_texts)
        return vectors, token_count

    def encode_queries(self, query: str) -> tuple[list[float], int]:
        vectors, token_count = self.encode([query])
        return vectors[0] if vectors else [], token_count


def _safe_text(text: str | None, max_length: int) -> str:
    value = "None" if text is None else str(text)
    if not value.strip():
        value = "None"
    if len(value) > max_length:
        return value[: int(max_length * 0.95)]
    return value


def _embed_text(text: str, vector_size: int) -> list[float]:
    vector = [0.0] * vector_size
    for token in _tokens(text) or [""]:
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        for index in range(vector_size):
            value = digest[index % len(digest)] / 255.0
            vector[index] += value

    norm = math.sqrt(sum(value * value for value in vector))
    if norm == 0:
        return vector
    return [value / norm for value in vector]


def _tokens(text: str) -> list[str]:
    return re.findall(r"[\w]+", text.lower())


def _positive_int(value: Any, default: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    return max(parsed, 1)
