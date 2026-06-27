import re
from pathlib import Path
from typing import Any

from common.constants import MAXIMUM_PAGE_NUMBER
from rag import nlp
from rag.app.naive import MARKDOWN_EXTENSIONS, TEXT_LIKE_EXTENSIONS


def chunk(
    filename: str,
    binary: bytes | None = None,
    from_page: int = 0,
    to_page: int = MAXIMUM_PAGE_NUMBER,
    lang: str = "English",
    callback=None,
    **kwargs: Any,
) -> list[dict[str, Any]]:
    """Focused Q/A parser path.

    RAG's full `qa` parser supports richer spreadsheet and document inputs.
    This local path activates the same parser-id/module boundary for simple
    text Q/A material and emits `question_kwd` for the embedding stage.
    """
    if binary is None:
        raise ValueError("binary is required.")

    callback = callback or _noop_callback
    extension = Path(filename).suffix.lower()
    if extension not in TEXT_LIKE_EXTENSIONS and extension not in MARKDOWN_EXTENSIONS:
        raise NotImplementedError(
            f"{extension or 'unknown'} is routed by RAG's qa parser, but this "
            "focused implementation activates text and markdown Q/A extraction only."
        )

    callback(0.1, "Start to parse Q/A text.")
    text = _decode_text(binary)
    pairs = _parse_pairs(text)
    callback(0.45, f"Extracted {len(pairs)} Q/A chunks.")

    is_english = (lang or "English").lower() == "english"
    title = re.sub(r"\.[a-zA-Z0-9]+$", "", filename)
    title_tokens = _tokens(title)
    records: list[dict[str, Any]] = []
    for index, pair in enumerate(pairs):
        record = {
            "docnm_kwd": filename,
            "title_tks": " ".join(title_tokens),
            "title_sm_tks": " ".join(_fine_grained_tokens(" ".join(title_tokens))),
            "available_int": 1,
            "chunk_order_int": index,
            "question_kwd": [pair["question"]] if pair["question"] else [],
            "question_tks": " ".join(_tokens(pair["question"])),
        }
        nlp.add_positions(record, [[index] * 5])
        nlp.tokenize(record, pair["answer"], is_english)
        records.append(record)

    callback(0.8, "Finish parsing Q/A text.")
    return records


def _parse_pairs(text: str) -> list[dict[str, str]]:
    pairs: list[dict[str, str]] = []
    current_question = ""
    current_answer: list[str] = []

    for line in text.replace("\r\n", "\n").replace("\r", "\n").splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        question_match = re.match(r"^(q|question)\s*[:：]\s*(.+)$", stripped, re.IGNORECASE)
        answer_match = re.match(r"^(a|answer)\s*[:：]\s*(.+)$", stripped, re.IGNORECASE)
        if question_match:
            if current_question or current_answer:
                pairs.append(_pair(current_question, current_answer))
            current_question = question_match.group(2).strip()
            current_answer = []
            continue
        if answer_match:
            current_answer.append(answer_match.group(2).strip())
            continue
        current_answer.append(stripped)

    if current_question or current_answer:
        pairs.append(_pair(current_question, current_answer))

    if pairs:
        return pairs

    fallback = text.strip()
    return [{"question": "", "answer": fallback}] if fallback else []


def _pair(question: str, answer_lines: list[str]) -> dict[str, str]:
    answer = "\n".join(line for line in answer_lines if line.strip()).strip()
    return {"question": question.strip(), "answer": answer or question.strip() or "None"}


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


def _noop_callback(_prog=None, _msg="") -> None:
    return None
