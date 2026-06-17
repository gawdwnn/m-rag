from enum import StrEnum

from api.db.db_models import (
    DB,
    Document,
    File,
    File2Document,
    Knowledgebase,
    Task,
    close_db,
    connect_db,
    database_health,
    init_database_tables,
)


class FileType(StrEnum):
    PDF = "pdf"
    DOC = "doc"
    VISUAL = "visual"
    AURAL = "aural"
    VIRTUAL = "virtual"
    FOLDER = "folder"
    OTHER = "other"


VALID_FILE_TYPES = {
    FileType.PDF,
    FileType.DOC,
    FileType.VISUAL,
    FileType.AURAL,
    FileType.VIRTUAL,
    FileType.FOLDER,
    FileType.OTHER,
}

KNOWLEDGEBASE_FOLDER_NAME = ".knowledgebase"
SKILLS_FOLDER_NAME = "skills"


__all__ = [
    "DB",
    "Document",
    "File",
    "File2Document",
    "FileType",
    "KNOWLEDGEBASE_FOLDER_NAME",
    "Knowledgebase",
    "SKILLS_FOLDER_NAME",
    "Task",
    "VALID_FILE_TYPES",
    "close_db",
    "connect_db",
    "database_health",
    "init_database_tables",
]
