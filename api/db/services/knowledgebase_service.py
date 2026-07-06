import time
from datetime import datetime
from typing import Any
from uuid import uuid4

from peewee import DoesNotExist

from api.db.db_models import DB, Knowledgebase, User, connect_db
from api.db.services.user_service import UserService, UserTenantService
from common.constants import ParserType

DEFAULT_PARSER_CONFIG = {
    "pages": [[1, 1000000]],
    "chunk_token_num": 128,
    "delimiter": "\n!?;。；！？",
    "children_delimiter": "",
    "layout_recognize": "DeepDOC",
    "table_context_size": 0,
    "image_context_size": 0,
    "overlapped_percent": 0,
}
VALID_STATUS = "1"


class KnowledgebaseNotFound(Exception):
    pass


class KnowledgebaseValidationError(Exception):
    pass


class KnowledgebaseService:
    model = Knowledgebase

    @classmethod
    def list(cls, user_id: str) -> list[dict[str, Any]]:
        connect_db()
        tenant_ids = UserTenantService.get_visible_tenant_ids(user_id)
        with DB.connection_context():
            records = (
                cls.model.select(cls.model, User.nickname, User.avatar.alias("tenant_avatar"))
                .join(User, on=(cls.model.tenant_id == User.id))
                .where(
                    cls._visibility_filter(tenant_ids, user_id)
                )
                .order_by(cls.model.create_time.desc(), cls.model.name.asc())
                .dicts()
            )
            return [_from_joined_record(record) for record in records]

    @classmethod
    def get(cls, kb_id: str, user_id: str) -> dict[str, Any]:
        record = cls.get_record(kb_id, user_id)
        return _with_owner(record.to_api(), _get_user(record.tenant_id))

    @classmethod
    def get_record(cls, kb_id: str, user_id: str) -> Knowledgebase:
        connect_db()
        tenant_ids = UserTenantService.get_visible_tenant_ids(user_id)
        with DB.connection_context():
            try:
                return cls.model.get(
                    (cls.model.id == kb_id)
                    & cls._visibility_filter(tenant_ids, user_id)
                )
            except DoesNotExist as exc:
                raise KnowledgebaseNotFound(kb_id) from exc

    @classmethod
    def create(cls, payload: dict[str, Any], user_id: str) -> dict[str, Any]:
        connect_db()
        tenant_defaults = UserService.get_tenant_defaults(user_id)
        data = _normalize_payload(payload, tenant_defaults)
        name = _deduplicate_name(data["name"], tenant_defaults["tenant_id"])
        kb_id = uuid4().hex
        with DB.atomic():
            cls.model.create(
                id=kb_id,
                tenant_id=tenant_defaults["tenant_id"],
                created_by=user_id,
                name=name,
                description=data["description"],
                embd_id=data["embedding_model"],
                tenant_embd_id=tenant_defaults["tenant_embd_id"],
                permission=data["permission"],
                parser_id=data["chunk_method"],
                parser_config=data["parser_config"],
            )
        return cls.get(kb_id, user_id)

    @classmethod
    def update(cls, kb_id: str, payload: dict[str, Any], user_id: str) -> dict[str, Any]:
        connect_db()
        current = cls.get(kb_id, user_id)
        tenant_defaults = UserService.get_tenant_defaults(user_id)
        data = _normalize_payload({**current, **payload}, tenant_defaults)
        with DB.atomic():
            updated = (
                cls.model.update(
                    name=data["name"],
                    description=data["description"],
                    embd_id=data["embedding_model"],
                    parser_id=data["chunk_method"],
                    parser_config=data["parser_config"],
                    permission=data["permission"],
                    update_time=_current_timestamp(),
                    update_date=datetime.utcnow(),
                )
                .where(
                    (cls.model.id == kb_id)
                    & (cls.model.tenant_id == tenant_defaults["tenant_id"])
                    & (cls.model.status == VALID_STATUS)
                )
                .execute()
            )
        if updated == 0:
            raise KnowledgebaseNotFound(kb_id)
        return cls.get(kb_id, user_id)

    @classmethod
    def delete(cls, kb_id: str, user_id: str) -> None:
        cls.delete_many([kb_id], user_id)

    @classmethod
    def delete_many(cls, kb_ids: list[str], user_id: str) -> None:
        connect_db()
        if not kb_ids:
            return
        tenant_id = UserService.get_tenant_defaults(user_id)["tenant_id"]
        with DB.atomic():
            deleted = (
                cls.model.update(
                    status="0",
                    update_time=_current_timestamp(),
                    update_date=datetime.utcnow(),
                )
                .where(
                    (cls.model.id.in_(kb_ids))
                    & (cls.model.tenant_id == tenant_id)
                    & (cls.model.status == VALID_STATUS)
                )
                .execute()
            )
        if deleted == 0:
            raise KnowledgebaseNotFound(",".join(kb_ids))

    @classmethod
    def _visibility_filter(cls, tenant_ids: list[str], user_id: str):
        return (
            (
                (cls.model.tenant_id == user_id)
                | (
                    (cls.model.tenant_id.in_(tenant_ids))
                    & (cls.model.permission == "team")
                )
            )
            & (cls.model.status == VALID_STATUS)
        )


def _normalize_payload(payload: dict[str, Any], tenant_defaults: dict[str, Any]) -> dict[str, Any]:
    name = str(payload.get("name", "")).strip()
    if not name:
        raise KnowledgebaseValidationError("Knowledgebase name is required.")
    if len(name) > 128:
        raise KnowledgebaseValidationError("Knowledgebase name must be 128 characters or less.")

    payload_parser_config = payload.get("parser_config") or {}
    if not isinstance(payload_parser_config, dict):
        raise KnowledgebaseValidationError("parser_config must be an object.")
    parser_config = {**DEFAULT_PARSER_CONFIG, **payload_parser_config}
    if not isinstance(parser_config, dict):
        raise KnowledgebaseValidationError("parser_config must be an object.")
    parser_config["llm_id"] = tenant_defaults["llm_id"]

    chunk_method = str(payload.get("chunk_method", "naive")).strip() or "naive"
    if not _valid_chunk_method(chunk_method):
        raise KnowledgebaseValidationError(f"Unsupported chunk method: {chunk_method}.")

    return {
        "name": name,
        "description": str(payload.get("description", "")).strip(),
        "embedding_model": str(
            payload.get("embedding_model", tenant_defaults["embd_id"])
        ).strip()
        or tenant_defaults["embd_id"],
        "permission": _normalize_permission(payload.get("permission", "me")),
        "chunk_method": chunk_method,
        "parser_config": parser_config,
    }


def _current_timestamp() -> int:
    return int(time.time() * 1000)


def _with_owner(data: dict[str, Any], user: Any) -> dict[str, Any]:
    return {
        **data,
        "nickname": getattr(user, "nickname", "") or data.get("created_by", ""),
        "tenant_avatar": getattr(user, "avatar", "") or "",
    }


def _from_joined_record(record: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": record["id"],
        "tenant_id": record["tenant_id"],
        "name": record["name"],
        "language": record.get("language") or "English",
        "description": record.get("description") or "",
        "embedding_model": record["embd_id"],
        "permission": record["permission"],
        "created_by": record["created_by"],
        "chunk_method": record["parser_id"],
        "parser_config": record["parser_config"],
        "document_count": int(record["doc_num"]),
        "token_num": int(record["token_num"]),
        "chunk_count": int(record["chunk_num"]),
        "status": record["status"],
        "avatar": record.get("avatar") or "",
        "update_time": record["update_time"],
        "created_at": _timestamp_to_iso(record["create_time"]),
        "updated_at": _timestamp_to_iso(record["update_time"]),
        "nickname": record.get("nickname") or record["created_by"],
        "tenant_avatar": record.get("tenant_avatar") or "",
    }


def _get_user(user_id: str) -> Any:
    return UserService.get_active_user(user_id)


def _timestamp_to_iso(value: int | None) -> str:
    if not value:
        return ""
    return datetime.fromtimestamp(value / 1000).isoformat()


def _normalize_permission(value: Any) -> str:
    permission = str(value or "me").strip()
    if permission not in {"me", "team"}:
        raise KnowledgebaseValidationError("permission must be 'me' or 'team'.")
    return permission


def _valid_chunk_method(chunk_method: str) -> bool:
    return chunk_method == "general" or ParserType.valid(chunk_method)


def _deduplicate_name(name: str, tenant_id: str) -> str:
    existing = {
        record.name
        for record in Knowledgebase.select(Knowledgebase.name).where(
            (Knowledgebase.tenant_id == tenant_id)
            & (Knowledgebase.status == VALID_STATUS)
        )
    }
    if name not in existing:
        return name

    counter = 1
    while f"{name} ({counter})" in existing:
        counter += 1
    return f"{name} ({counter})"
