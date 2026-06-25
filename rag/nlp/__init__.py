import copy
import re
from typing import Any


def tokenize_chunks(
    chunks: list[str],
    doc: dict[str, Any],
    eng: bool,
    pdf_parser=None,
    child_delimiters_pattern: str | None = None,
) -> list[dict[str, Any]]:
    """Wrap merged chunks as doc-store records.

    RAG's full helper can crop PDF source regions and split child chunks.
    This focused version keeps the same boundary for text-like documents.
    """
    results: list[dict[str, Any]] = []
    for index, chunk in enumerate(chunks):
        if not chunk.strip():
            continue
        record = copy.deepcopy(doc)
        add_positions(record, [[index] * 5])
        if child_delimiters_pattern:
            record["mom_with_weight"] = chunk
            results.extend(split_with_pattern(record, child_delimiters_pattern, chunk, eng))
            continue
        tokenize(record, chunk, eng)
        results.append(record)
    return results


def naive_merge(
    sections: str | list[str] | list[tuple[str, str]],
    chunk_token_num: int = 128,
    delimiter: str = "\n。；！？",
    overlapped_percent: float = 0,
) -> list[str]:
    """Merge extracted sections into chunk-sized strings.

    This mirrors RAG's phase boundary while keeping the local implementation
    dependency-light. Sections may carry a source-position suffix as
    ``(text, position)`` tuples.
    """
    if not sections:
        return []
    if isinstance(sections, str):
        sections = [sections]
    normalized_sections: list[tuple[str, str]] = []
    for section in sections:
        if isinstance(section, tuple):
            text, pos = section
        else:
            text, pos = section, ""
        if str(text).strip():
            normalized_sections.append((str(text), str(pos or "")))
    if not normalized_sections:
        return []

    custom_delimiters = [match.group(1) for match in re.finditer(r"`([^`]+)`", delimiter)]
    if custom_delimiters:
        custom_pattern = "|".join(
            re.escape(value) for value in sorted(set(custom_delimiters), key=len, reverse=True)
        )
        chunks: list[str] = []
        for section, pos in normalized_sections:
            for value in re.split(f"({custom_pattern})", section, flags=re.DOTALL):
                if not value or re.fullmatch(custom_pattern, value):
                    continue
                chunks.append(_with_position("\n" + value, pos))
        return chunks

    limit = max(int(chunk_token_num or 0), 0)
    if limit == 0:
        return [_with_position("\n" + section, pos) for section, pos in normalized_sections]

    overlap_ratio = _normalize_overlap(overlapped_percent) / 100
    chunks = [""]
    token_counts = [0]

    for section, pos in normalized_sections:
        text = _with_position("\n" + section, pos)
        token_count = num_tokens_from_string(text)
        threshold = limit * (1 - overlap_ratio)
        if chunks[-1] == "" or token_counts[-1] > threshold:
            if chunks:
                overlap = _overlap_tail(chunks[-1], overlap_ratio)
                text = overlap + text
            chunks.append(text)
            token_counts.append(token_count)
        else:
            chunks[-1] += text
            token_counts[-1] += token_count

    return [chunk for chunk in chunks if chunk.strip()]


def tokenize(d: dict[str, Any], content: str, eng: bool) -> None:
    tokens = _tokens(content)
    fine_tokens = tokens if eng else _fine_grained_tokens(content)
    d["content_with_weight"] = content
    d["content_ltks"] = " ".join(tokens)
    d["content_sm_ltks"] = " ".join(fine_tokens)


def add_positions(d: dict[str, Any], positions: list[list[int]]) -> None:
    page_nums = []
    top_values = []
    normalized_positions = []
    for position in positions:
        if len(position) < 5:
            position = [*position, *([0] * (5 - len(position)))]
        page = int(position[0]) + 1
        page_nums.append(page)
        top_values.append(int(position[1]))
        normalized_positions.append(tuple(int(value) for value in position[:5]))
    d["page_num_int"] = page_nums
    d["position_int"] = normalized_positions
    d["top_int"] = top_values


def split_with_pattern(
    d: dict[str, Any],
    pattern: str,
    content: str,
    eng: bool,
) -> list[dict[str, Any]]:
    try:
        compiled_pattern = re.compile(f"({pattern})", flags=re.DOTALL)
    except re.error:
        record = copy.deepcopy(d)
        tokenize(record, content, eng)
        return [record]

    records: list[dict[str, Any]] = []
    parts = [part for part in compiled_pattern.split(content)]
    for index in range(0, len(parts), 2):
        text = parts[index]
        if not text:
            continue
        if index + 1 < len(parts):
            text += parts[index + 1]
        record = copy.deepcopy(d)
        tokenize(record, text, eng)
        records.append(record)
    return records


def num_tokens_from_string(value: str) -> int:
    return len(_tokens(value))


def _tokens(value: str) -> list[str]:
    return re.findall(r"[\w]+", value.lower())


def _fine_grained_tokens(value: str) -> list[str]:
    return [char for char in value.lower() if not char.isspace()]


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


def _with_position(text: str, pos: str) -> str:
    if not pos or num_tokens_from_string(text) < 8 or pos in text:
        return text
    return text + pos


def _overlap_tail(text: str, ratio: float) -> str:
    if ratio <= 0 or not text:
        return ""
    tail_length = int(len(text) * ratio)
    if tail_length <= 0:
        return ""
    return text[-tail_length:]
