from io import BytesIO

from minio import Minio
from minio.error import S3Error

from api.config import load_api_config


class MinioStorage:
    def __init__(self) -> None:
        config = load_api_config()
        self.client = Minio(
            config.minio_endpoint,
            access_key=config.minio_access_key,
            secret_key=config.minio_secret_key,
            secure=config.minio_secure,
        )

    def put(self, bucket: str, name: str, data: bytes) -> None:
        self._ensure_bucket(bucket)
        self.client.put_object(bucket, name, BytesIO(data), length=len(data))

    def get(self, bucket: str, name: str) -> bytes:
        response = self.client.get_object(bucket, name)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()

    def remove(self, bucket: str, name: str) -> None:
        self.client.remove_object(bucket, name)

    def rm(self, bucket: str, name: str) -> None:
        self.remove(bucket, name)

    def object_exists(self, bucket: str, name: str) -> bool:
        if not self.client.bucket_exists(bucket):
            return False
        try:
            self.client.stat_object(bucket, name)
            return True
        except S3Error as exc:
            if exc.code == "NoSuchKey":
                return False
            raise

    def obj_exist(self, bucket: str, name: str) -> bool:
        return self.object_exists(bucket, name)

    def health(self) -> tuple[str, str | None]:
        try:
            self.client.list_buckets()
            return "ok", None
        except Exception as exc:
            return "error", str(exc)

    def _ensure_bucket(self, bucket: str) -> None:
        if not self.client.bucket_exists(bucket):
            self.client.make_bucket(bucket)


def get_storage() -> MinioStorage:
    return MinioStorage()


def storage_health() -> tuple[str, str | None]:
    return get_storage().health()
