from enum import StrEnum

MAXIMUM_PAGE_NUMBER = 100000000
MAXIMUM_TASK_PAGE_NUMBER = 100000000
SVR_CONSUMER_GROUP_NAME = "rag_flow_svr_task_broker"


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


class UserTenantRole(StrEnum):
    OWNER = "owner"
    NORMAL = "normal"


class PipelineTaskType(StrEnum):
    PARSE = "Parse"
    DOWNLOAD = "Download"
    RAPTOR = "RAPTOR"
    GRAPH_RAG = "GraphRAG"
    MINDMAP = "Mindmap"
    MEMORY = "Memory"


class ParserType(StrEnum):
    NAIVE = "naive"
    ONE = "one"
    QA = "qa"

    @classmethod
    def valid(cls, value: str) -> bool:
        try:
            cls(value)
            return True
        except ValueError:
            return False


VALID_TASK_STATUS = {
    TaskStatus.UNSTART,
    TaskStatus.RUNNING,
    TaskStatus.CANCEL,
    TaskStatus.DONE,
    TaskStatus.FAIL,
    TaskStatus.SCHEDULE,
}

VALID_PIPELINE_TASK_TYPES = {
    PipelineTaskType.PARSE,
    PipelineTaskType.DOWNLOAD,
    PipelineTaskType.RAPTOR,
    PipelineTaskType.GRAPH_RAG,
    PipelineTaskType.MINDMAP,
}
