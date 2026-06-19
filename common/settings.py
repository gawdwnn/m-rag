from api.storage import get_storage

STORAGE_IMPL = get_storage()
DOC_MAXIMUM_SIZE = 128 * 1024 * 1024


def get_svr_queue_name(priority: int, suffix: str = "common") -> str:
    return f"te.{priority}.{suffix}"


def get_svr_queue_names(suffix: str = "common") -> list[str]:
    return [get_svr_queue_name(priority, suffix) for priority in [1, 0]]


def get_secret_key() -> str:
    from api.config import load_api_config

    return load_api_config().secret_key
