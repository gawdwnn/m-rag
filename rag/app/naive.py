import re
from pathlib import Path
from typing import Any

from common.constants import MAXIMUM_PAGE_NUMBER
from rag import nlp

TEXT_LIKE_EXTENSIONS = {
    ".txt",
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
}
MARKDOWN_EXTENSIONS = {".md", ".markdown", ".mdx"}
RAG_AWARE_EXTENSIONS = {
    ".docx",
    ".pdf",
    ".csv",
    ".xls",
    ".xlsx",
    *TEXT_LIKE_EXTENSIONS,
    *MARKDOWN_EXTENSIONS,
    ".html",
    ".htm",
    ".epub",
    ".json",
    ".jsonl",
    ".ldjson",
    ".doc",
}


def chunk(
    filename: str,
    binary: bytes | None = None,
    from_page: int = 0,
    to_page: int = MAXIMUM_PAGE_NUMBER,
    lang: str = "English",
    callback=None,
    **kwargs: Any,
) -> list[dict[str, Any]]:
    """RAG-shaped naive parser/chunker for the focused text path.

    RAG's naive parser first routes by file type, extracts sections, merges
    those sections by parser config, then tokenizes the merged chunks for the
    doc store. This local version keeps that architecture while deferring
    DeepDoc/OCR/table/image branches.
    """
    if binary is None:
        raise ValueError("binary is required.")

    callback = callback or _noop_callback
    parser_config = _normalize_parser_config(kwargs.get("parser_config") or {})
    child_deli = _children_delimiter_pattern(parser_config)
    extension = Path(filename).suffix.lower()
    is_english = (lang or "English").lower() == "english"
    doc = _doc_template(filename)

    callback(
        0.1,
        "Start to parse. "
        f"chunk_token_num={parser_config['chunk_token_num']}, "
        f"delimiter={parser_config['delimiter']!r}, "
        f"overlap={parser_config['overlapped_percent']}%, "
        f"pages={from_page + 1}~{to_page + 1}",
    )

    sections, is_markdown = _extract_sections(
        filename=filename,
        binary=binary,
        extension=extension,
        parser_config=parser_config,
    )
    callback(0.45, f"Extracted {len(sections)} sections from {extension or 'unknown file'}.")

    chunks = _merge_sections(sections, parser_config, is_markdown)
    callback(0.65, f"Merged sections into {len(chunks)} chunks.")

    records = nlp.tokenize_chunks(
        chunks,
        doc,
        is_english,
        pdf_parser=None,
        child_delimiters_pattern=child_deli,
    )
    for index, record in enumerate(records):
        record["chunk_order_int"] = index
        record["available_int"] = 1
    callback(0.8, "Finish parsing.")
    return records


def _extract_sections(
    filename: str,
    binary: bytes,
    extension: str,
    parser_config: dict[str, Any],
) -> tuple[list[tuple[str, str]], bool]:
    if extension in TEXT_LIKE_EXTENSIONS:
        return _extract_text_sections(binary, parser_config["delimiter"]), False

    if extension in MARKDOWN_EXTENSIONS:
        return _extract_markdown_sections(binary, parser_config["delimiter"]), True

    if extension in RAG_AWARE_EXTENSIONS:
        raise NotImplementedError(
            f"{extension} is routed by RAG's naive parser, but this focused "
            "implementation only activates text and markdown extraction before "
            "DeepDoc/table/image parser dependencies are introduced."
        )

    raise NotImplementedError(
        f"{Path(filename).suffix or 'unknown'} is not in the current RAG-aware "
        "naive parser branch for this learning workspace."
    )


def _extract_text_sections(binary: bytes, delimiter: str) -> list[tuple[str, str]]:
    text = _decode_text(binary)
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    parts = _split_by_delimiter(normalized, delimiter)
    return [(part, "") for part in parts]


def _extract_markdown_sections(binary: bytes, delimiter: str) -> list[tuple[str, str]]:
    text = _decode_text(binary)
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    sections = _split_markdown_sections(normalized)
    if len(sections) <= 1:
        sections = _split_by_delimiter(normalized, delimiter)
    return [(section, "") for section in sections if section.strip()]


def _merge_sections(
    sections: list[tuple[str, str]],
    parser_config: dict[str, Any],
    is_markdown: bool,
) -> list[str]:
    # RAG has a markdown-specific image-aware merge branch. This local path
    # still goes through the same merge boundary while image branches are deferred.
    _ = is_markdown
    return nlp.naive_merge(
        sections,
        int(parser_config["chunk_token_num"]),
        str(parser_config["delimiter"]),
        float(parser_config["overlapped_percent"]),
    )


def _normalize_parser_config(parser_config: dict[str, Any]) -> dict[str, Any]:
    chunk_token_num = _as_int(parser_config.get("chunk_token_num"), 128)
    delimiter = str(parser_config.get("delimiter") or "\n!?;。；！？")
    return {
        **parser_config,
        "chunk_token_num": chunk_token_num,
        "delimiter": delimiter,
        "children_delimiter": str(parser_config.get("children_delimiter") or ""),
        "layout_recognize": parser_config.get("layout_recognize", "DeepDOC"),
        "table_context_size": max(0, _as_int(parser_config.get("table_context_size"), 0)),
        "image_context_size": max(0, _as_int(parser_config.get("image_context_size"), 0)),
        "overlapped_percent": _normalize_overlap(parser_config.get("overlapped_percent", 0)),
    }


def _children_delimiter_pattern(parser_config: dict[str, Any]) -> str:
    child_deli = str(parser_config.get("children_delimiter") or "")
    if not child_deli:
        return ""
    try:
        child_deli = (
            child_deli.encode("utf-8")
            .decode("unicode_escape")
            .encode("latin1")
            .decode("utf-8")
        )
    except (UnicodeDecodeError, UnicodeEncodeError):
        pass

    custom_child_delimiters = re.findall(r"`([^`]+)`", child_deli)
    pattern = "|".join(re.sub(r"`([^`]+)`", "", child_deli))
    if custom_child_delimiters:
        custom_pattern = "|".join(
            re.escape(value)
            for value in sorted(set(custom_child_delimiters), key=len, reverse=True)
            if value
        )
        pattern += custom_pattern
    return pattern


def _doc_template(filename: str) -> dict[str, str]:
    title = re.sub(r"\.[a-zA-Z0-9]+$", "", filename)
    title_tokens = _tokens(title)
    return {
        "docnm_kwd": filename,
        "title_tks": " ".join(title_tokens),
        "title_sm_tks": " ".join(_fine_grained_tokens(" ".join(title_tokens))),
    }


def _split_by_delimiter(text: str, delimiter: str) -> list[str]:
    delimiters = delimiter or "\n"
    custom_delimiters = [match.group(1) for match in re.finditer(r"`([^`]+)`", delimiters)]
    if custom_delimiters:
        pattern = "|".join(
            re.escape(value) for value in sorted(set(custom_delimiters), key=len, reverse=True)
        )
    else:
        pattern = f"[{''.join(re.escape(char) for char in delimiters)}]+"
    parts = re.split(pattern, text)
    sections = [part.strip() for part in parts if part.strip()]
    if sections:
        return sections
    stripped = text.strip()
    return [stripped] if stripped else []


def _split_markdown_sections(text: str) -> list[str]:
    sections: list[str] = []
    current: list[str] = []
    for line in text.splitlines():
        if line.startswith("#") and current:
            sections.append("\n".join(current).strip())
            current = []
        current.append(line)
    if current:
        sections.append("\n".join(current).strip())
    return [section for section in sections if section]


def _decode_text(binary: bytes) -> str:
    for encoding in ("utf-8", "utf-16", "latin-1"):
        try:
            return binary.decode(encoding)
        except UnicodeDecodeError:
            continue
    return binary.decode("utf-8", errors="ignore")


def _tokens(value: str) -> list[str]:
    return re.findall(r"[\w]+", value.lower())


def _fine_grained_tokens(value: str) -> list[str]:
    return [char for char in value.lower() if not char.isspace()]


def _as_int(value: Any, default: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _normalize_overlap(value: Any) -> float:
    try:
        overlap = float(value or 0)
    except (TypeError, ValueError):
        return 0
    if overlap < 0:
        return 0
    if overlap <= 1:
        return overlap * 100
    return min(int(overlap), 90)


def _noop_callback(_prog=None, _msg="") -> None:
    return None
