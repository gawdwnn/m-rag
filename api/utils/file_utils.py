import re
from pathlib import Path

from api.db import FileType


def filename_type(filename: str | None) -> str:
    name = Path(filename or "").name.lower()
    if re.match(r".*\.pdf$", name):
        return FileType.PDF.value
    if re.match(r".*\.(doc|docx|md|txt)$", name):
        return FileType.DOC.value
    return FileType.OTHER.value
