import json
from dataclasses import dataclass
from typing import Any

import redis

from api.config import load_api_config


@dataclass
class RedisMessage:
    queue_name: str
    raw: bytes

    def get_message(self) -> dict[str, Any] | None:
        try:
            payload = json.loads(self.raw.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return None
        return payload if isinstance(payload, dict) else None

    def get_msg_id(self) -> str:
        message = self.get_message() or {}
        return str(message.get("id") or "")

    def ack(self) -> None:
        return None


class RedisConnection:
    def __init__(self) -> None:
        self._client: redis.Redis | None = None

    @property
    def client(self) -> redis.Redis:
        if self._client is None:
            config = load_api_config()
            self._client = redis.Redis(
                host=config.redis_host,
                port=config.redis_port,
                password=config.redis_password or None,
                db=config.redis_db,
                decode_responses=False,
            )
        return self._client

    def ping(self) -> bool:
        return bool(self.client.ping())

    def queue_product(self, queue_name: str, message: dict[str, Any]) -> bool:
        payload = json.dumps(message, default=str).encode("utf-8")
        return bool(self.client.rpush(queue_name, payload))

    def queue_consumer(self, queue_name: str, *_args: Any) -> RedisMessage | None:
        item = self.client.lpop(queue_name)
        if item is None:
            return None
        return RedisMessage(queue_name=queue_name, raw=item)

    def set(self, key: str, value: str, ex: int | None = None) -> bool:
        return bool(self.client.set(key, value, ex=ex))

    def get(self, key: str) -> bytes | None:
        value = self.client.get(key)
        return value if isinstance(value, bytes) else None


REDIS_CONN = RedisConnection()


def redis_health() -> tuple[str, str | None]:
    try:
        REDIS_CONN.ping()
        return "ok", None
    except Exception as exc:
        return "error", str(exc)
