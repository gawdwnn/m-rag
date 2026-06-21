import os
from dataclasses import dataclass


@dataclass(frozen=True)
class ApiConfig:
    env: str
    host: str
    port: int
    secret_key: str
    db_host: str
    db_port: int
    db_name: str
    db_user: str
    db_password: str
    minio_endpoint: str
    minio_access_key: str
    minio_secret_key: str
    minio_secure: bool
    redis_host: str
    redis_port: int
    redis_password: str
    redis_db: int
    doc_engine: str
    es_host: str
    es_port: int
    elastic_password: str


def load_api_config() -> ApiConfig:
    return ApiConfig(
        env=os.getenv("M_RAGFLOW_ENV", "local"),
        host=os.getenv("M_RAGFLOW_API_HOST", "127.0.0.1"),
        port=int(os.getenv("M_RAGFLOW_API_PORT", "9380")),
        secret_key=os.getenv("M_RAGFLOW_SECRET_KEY", "m-ragflow-local-dev-secret"),
        db_host=os.getenv("M_RAGFLOW_DB_HOST", "127.0.0.1"),
        db_port=int(os.getenv("M_RAGFLOW_DB_PORT", "3307")),
        db_name=os.getenv("M_RAGFLOW_DB_NAME", "m_ragflow"),
        db_user=os.getenv("M_RAGFLOW_DB_USER", "m_ragflow"),
        db_password=os.getenv("M_RAGFLOW_DB_PASSWORD", "m_ragflow"),
        minio_endpoint=os.getenv("M_RAGFLOW_MINIO_ENDPOINT", "127.0.0.1:9002"),
        minio_access_key=os.getenv("M_RAGFLOW_MINIO_ACCESS_KEY", "m_ragflow"),
        minio_secret_key=os.getenv("M_RAGFLOW_MINIO_SECRET_KEY", "m_ragflow_secret"),
        minio_secure=os.getenv("M_RAGFLOW_MINIO_SECURE", "false").lower() == "true",
        redis_host=os.getenv("M_RAGFLOW_REDIS_HOST", "127.0.0.1"),
        redis_port=int(os.getenv("M_RAGFLOW_REDIS_PORT", "6381")),
        redis_password=os.getenv("M_RAGFLOW_REDIS_PASSWORD", "m_ragflow_redis"),
        redis_db=int(os.getenv("M_RAGFLOW_REDIS_DB", "0")),
        doc_engine=os.getenv("DOC_ENGINE", "elasticsearch"),
        es_host=os.getenv("ES_HOST", "127.0.0.1"),
        es_port=int(os.getenv("ES_PORT", "1202")),
        elastic_password=os.getenv("ELASTIC_PASSWORD", "infini_m_ragflow"),
    )
