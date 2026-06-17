from enum import StrEnum

MAXIMUM_PAGE_NUMBER = 100000000
MAXIMUM_TASK_PAGE_NUMBER = 100000000


class FileSource(StrEnum):
    LOCAL = "local"
    KNOWLEDGEBASE = "knowledgebase"


class TaskStatus(StrEnum):
    UNSTART = "0"
    RUNNING = "1"
    CANCEL = "2"
    DONE = "3"
    FAIL = "4"
    SCHEDULE = "5"


VALID_TASK_STATUS = {
    TaskStatus.UNSTART,
    TaskStatus.RUNNING,
    TaskStatus.CANCEL,
    TaskStatus.DONE,
    TaskStatus.FAIL,
    TaskStatus.SCHEDULE,
}
