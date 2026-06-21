import hashlib
import math
import re


class LLMBundle:
    def __init__(self, tenant_id: str, model_name: str, lang: str = "English") -> None:
        self.tenant_id = tenant_id
        self.llm_name = model_name
        self.lang = lang
        self.max_length = 512
        self.vector_size = 32

    def encode(self, texts: list[str]) -> tuple[list[list[float]], int]:
        vectors = [_embed_text(text, self.vector_size) for text in texts]
        token_count = sum(len(_tokens(text)) for text in texts)
        return vectors, token_count


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
