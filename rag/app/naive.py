import re
from pathlib import Path
from typing import Any

from common.constants import MAXIMUM_PAGE_NUMBER


def chunk(
    filename: str,
    binary: bytes | None = None,
    from_page: int = 0,
    to_page: int = MAXIMUM_PAGE_NUMBER,
    lang: str = "English",
    callback=None,
    **kwargs: Any,
) -> list[dict[str, Any]]:
    """Baseline RAGFlow-shaped naive parser/chunker for text-like files.

    RAGFlow's real naive parser supports many document formats and DeepDoc paths.
    This focused slice preserves the module/function shape and parser config flow
    while teaching the smallest text chunking path.
    """
    if binary is None:
        raise ValueError("binary is required.")

    parser_config = kwargs.get("parser_config") or {}
    chunk_token_num = int(parser_config.get("chunk_token_num") or 128)
    delimiter = str(parser_config.get("delimiter") or "\n!?;。；！？")

    callback = callback or _noop_callback
    callback(0.1, "Start to parse.")

    suffix = Path(filename).suffix.lower()
    if suffix not in {
        ".txt",
        ".md",
        ".markdown",
        ".mdx",
        ".py",
        ".js",
        ".java",
        ".c",
        ".cpp",
        ".h",
        ".php",
        ".go",
        ".ts",
        ".sh",
        ".cs",
        ".kt",
        ".sql",
    }:
        raise NotImplementedError("file type not supported yet(text-like files supported)")

    text = _decode_text(binary)
    sections = _split_sections(text, delimiter)
    chunks = _merge_sections(sections, chunk_token_num)

    callback(0.8, "Finish parsing.")

    title_tokens = _tokens(Path(filename).stem)
    doc = {
        "docnm_kwd": filename,
        "title_tks": " ".join(title_tokens),
        "title_sm_tks": " ".join(_fine_grained_tokens(Path(filename).stem)),
    }
    is_english = (lang or "English").lower() == "english"
    return [_tokenize_chunk(value, index, doc, is_english) for index, value in enumerate(chunks)]


def _decode_text(binary: bytes) -> str:
    for encoding in ("utf-8", "utf-16", "latin-1"):
        try:
            return binary.decode(encoding)
        except UnicodeDecodeError:
            continue
    return binary.decode("utf-8", errors="ignore")


def _split_sections(text: str, delimiter: str) -> list[str]:
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    delimiters = delimiter or "\n"
    escaped = "".join(re.escape(ch) for ch in delimiters)
    parts = re.split(f"[{escaped}]+", normalized)
    sections = [part.strip() for part in parts if part.strip()]
    if sections:
        return sections
    return [normalized.strip()] if normalized.strip() else []


def _merge_sections(sections: list[str], chunk_token_num: int) -> list[str]:
    if not sections:
        return []
    if chunk_token_num <= 0:
        return sections

    chunks: list[str] = []
    current: list[str] = []
    current_count = 0

    for section in sections:
        section_count = len(_tokens(section))
        if current and current_count + section_count > chunk_token_num:
            chunks.append("\n".join(current).strip())
            current = []
            current_count = 0
        current.append(section)
        current_count += section_count

    if current:
        chunks.append("\n".join(current).strip())
    return [item for item in chunks if item]


def _tokenize_chunk(
    value: str,
    index: int,
    doc: dict[str, Any],
    is_english: bool,
) -> dict[str, Any]:
    tokens = _tokens(value)
    fine_tokens = tokens if is_english else _fine_grained_tokens(value)
    page_num = index + 1
    return {
        **doc,
        "content_with_weight": value,
        "content_ltks": " ".join(tokens),
        "content_sm_ltks": " ".join(fine_tokens),
        "available_int": 1,
        "chunk_order_int": index,
        "page_num_int": [page_num],
        "position_int": [(page_num, index, index, index, index)],
        "top_int": [index],
    }


def _tokens(value: str) -> list[str]:
    return re.findall(r"[\w]+", value.lower())


def _fine_grained_tokens(value: str) -> list[str]:
    return [char for char in value.lower() if not char.isspace()]


def _noop_callback(_prog=None, _msg="") -> None:
    return None
