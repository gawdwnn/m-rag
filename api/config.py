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
    )
