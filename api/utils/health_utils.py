from api.db import database_health
from api.storage import storage_health
from common import settings
from rag.utils.redis_conn import redis_health


def run_health_checks() -> tuple[dict[str, str | dict[str, str]], bool]:
    db_status, db_error = database_health()
    redis_status, redis_error = redis_health()
    storage_status, storage_error = storage_health()
    doc_engine_status, doc_engine_error = _doc_engine_health()
    result: dict[str, str | dict[str, str]] = {
        "db": "ok" if db_status == "ok" else "nok",
        "redis": "ok" if redis_status == "ok" else "nok",
        "doc_engine": "ok" if doc_engine_status == "ok" else "nok",
        "storage": "ok" if storage_status == "ok" else "nok",
    }
    meta: dict[str, str] = {}
    if db_error:
        meta["db"] = db_error
    if storage_error:
        meta["storage"] = storage_error
    if redis_error:
        meta["redis"] = redis_error
    if doc_engine_error:
        meta["doc_engine"] = doc_engine_error
    if meta:
        result["_meta"] = meta

    all_ok = all(result.get(key) == "ok" for key in ("db", "redis", "doc_engine", "storage"))
    result["status"] = "ok" if all_ok else "nok"
    return result, all_ok


def _doc_engine_health() -> tuple[str, str | None]:
    try:
        settings.docStoreConn.es.info()
        return "ok", None
    except Exception as exc:
        return "error", str(exc)
