import json
from dataclasses import dataclass
from typing import Any

import redis

from api.config import load_api_config


@dataclass
class RedisMessage:
    queue_name: str
    group_name: str
    message_id: bytes
    payload: dict[bytes, bytes]
    client: redis.Redis

    def get_message(self) -> dict[str, Any] | None:
        raw = self.payload.get(b"message")
        if raw is None:
            return None
        try:
            payload = json.loads(raw.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return None
        return payload if isinstance(payload, dict) else None

    def get_msg_id(self) -> str:
        return self.message_id.decode("utf-8")

    def ack(self) -> None:
        self.client.xack(self.queue_name, self.group_name, self.message_id)


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
        self._ensure_stream_key(queue_name)
        payload = {"message": json.dumps(message, default=str)}
        return bool(self.client.xadd(queue_name, payload))

    def queue_consumer(
        self,
        queue_name: str,
        group_name: str,
        consumer_name: str,
        msg_id: str | bytes = b">",
    ) -> RedisMessage | None:
        self._ensure_group(queue_name, group_name)
        messages = self.client.xreadgroup(
            groupname=group_name,
            consumername=consumer_name,
            streams={queue_name: msg_id},
            count=1,
            block=5,
        )
        if not messages:
            return None
        _stream, entries = messages[0]
        if not entries:
            return None
        message_id, payload = entries[0]
        return RedisMessage(
            queue_name=queue_name,
            group_name=group_name,
            message_id=message_id,
            payload=payload,
            client=self.client,
        )

    def get_unacked_iterator(
        self,
        queue_names: list[str],
        group_name: str,
        consumer_name: str,
    ):
        for queue_name in queue_names:
            if not self._group_exists(queue_name, group_name):
                continue
            current_min: str | bytes = "0"
            while True:
                message = self.queue_consumer(
                    queue_name,
                    group_name,
                    consumer_name,
                    current_min,
                )
                if message is None:
                    break
                current_min = message.get_msg_id()
                yield message

    def queue_info(self, queue_name: str, group_name: str) -> dict[str, Any] | None:
        try:
            for group in self.client.xinfo_groups(queue_name):
                if _decode(group.get("name")) == group_name:
                    return {str(_decode(key)): value for key, value in group.items()}
        except redis.exceptions.ResponseError as exc:
            if "no such key" not in str(exc).lower():
                raise
        return None

    def set(self, key: str, value: str, ex: int | None = None) -> bool:
        return bool(self.client.set(key, value, ex=ex))

    def get(self, key: str) -> bytes | None:
        value = self.client.get(key)
        return value if isinstance(value, bytes) else None

    def _ensure_group(self, queue_name: str, group_name: str) -> None:
        self._ensure_stream_key(queue_name)
        try:
            if not self._group_exists(queue_name, group_name):
                self.client.xgroup_create(queue_name, group_name, id="0", mkstream=True)
        except redis.exceptions.ResponseError as exc:
            if "busygroup" not in str(exc).lower():
                raise

    def _group_exists(self, queue_name: str, group_name: str) -> bool:
        try:
            groups = self.client.xinfo_groups(queue_name)
        except redis.exceptions.ResponseError as exc:
            if "no such key" in str(exc).lower():
                return False
            raise
        return any(_decode(group.get("name")) == group_name for group in groups)

    def _ensure_stream_key(self, queue_name: str) -> None:
        key_type = self.client.type(queue_name)
        if key_type in {b"none", b"stream"}:
            return
        if key_type == b"list":
            old_messages = self.client.lrange(queue_name, 0, -1)
            self.client.delete(queue_name)
            for old_message in old_messages:
                self.client.xadd(queue_name, {"message": old_message})
            return
        raise TypeError(f"Redis key {queue_name} is {key_type!r}, not a stream queue.")


def _decode(value: Any) -> Any:
    if isinstance(value, bytes):
        return value.decode("utf-8")
    return value


REDIS_CONN = RedisConnection()


def redis_health() -> tuple[str, str | None]:
    try:
        REDIS_CONN.ping()
        return "ok", None
    except Exception as exc:
        return "error", str(exc)
