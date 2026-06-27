from typing import Any

from common.constants import MAXIMUM_PAGE_NUMBER
from rag.app import naive


def chunk(
    filename: str,
    binary: bytes | None = None,
    from_page: int = 0,
    to_page: int = MAXIMUM_PAGE_NUMBER,
    lang: str = "English",
    callback=None,
    **kwargs: Any,
) -> list[dict[str, Any]]:
    """One-file parser path.

    RAG's `one` parser keeps a file's extracted text together instead of using
    the normal naive chunk sizing. This local path keeps the parser module
    boundary active while reusing the current text/markdown extraction surface.
    """
    parser_config = {
        **(kwargs.get("parser_config") or {}),
        "chunk_token_num": MAXIMUM_PAGE_NUMBER,
        "delimiter": "`\0`",
        "overlapped_percent": 0,
    }
    return naive.chunk(
        filename,
        binary=binary,
        from_page=from_page,
        to_page=to_page,
        lang=lang,
        callback=callback,
        **{**kwargs, "parser_config": parser_config},
    )
