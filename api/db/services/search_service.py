import time
from copy import deepcopy
from datetime import datetime
from numbers import Real
from typing import Any
from uuid import uuid4

from peewee import DoesNotExist, fn

from api.db.db_models import DB, Search, User, connect_db
from api.db.services.knowledgebase_service import KnowledgebaseService
from api.db.services.user_service import UserService, UserTenantService

VALID_STATUS = "1"
DEFAULT_SEARCH_CONFIG = {
    "kb_ids": [],
    "doc_ids": [],
    "similarity_threshold": 0.2,
    "vector_similarity_weight": 0.3,
    "use_kg": False,
    "rerank_id": "",
    "top_k": 1024,
    "summary": False,
    "chat_id": "",
    "llm_setting": {},
    "chat_settingcross_languages": [],
    "highlight": False,
    "keyword": False,
    "web_search": False,
    "related_search": False,
    "query_mindmap": False,
}


class SearchNotFound(Exception):
    pass


class SearchValidationError(Exception):
    pass


class SearchService:
    model = Search

    @classmethod
    def save(cls, **kwargs: Any) -> Search:
        connect_db()
        current_ts = _current_timestamp()
        now = datetime.utcnow()
        kwargs["create_time"] = current_ts
        kwargs["create_date"] = now
        kwargs["update_time"] = current_ts
        kwargs["update_date"] = now
        with DB.atomic():
            return cls.model.create(**kwargs)

    @classmethod
    def create(cls, payload: dict[str, Any], user_id: str) -> dict[str, Any]:
        connect_db()
        tenant_id = UserService.get_tenant_defaults(user_id)["tenant_id"]
        name = _normalize_name(payload.get("name"))
        description = str(payload.get("description") or "").strip()
        search_config = _normalize_search_config(
            payload.get("search_config") or {},
            user_id=user_id,
        )
        search_id = uuid4().hex
        cls.save(
            id=search_id,
            name=_deduplicate_name(name, tenant_id),
            description=description,
            tenant_id=tenant_id,
            created_by=user_id,
            avatar=str(payload.get("avatar") or ""),
            search_config=search_config,
        )
        return {"search_id": search_id}

    @classmethod
    def list(
        cls,
        user_id: str,
        *,
        owner_ids: list[str] | None = None,
        keywords: str = "",
        page: int = 1,
        page_size: int = 30,
        orderby: str = "create_time",
        desc: bool = True,
    ) -> tuple[list[dict[str, Any]], int]:
        connect_db()
        effective_owner_ids = _effective_owner_ids(user_id, owner_ids)
        page = max(int(page or 1), 1)
        page_size = min(max(int(page_size or 30), 1), 200)
        order_field = getattr(cls.model, orderby, cls.model.create_time)

        with DB.connection_context():
            query = (
                cls.model.select(cls.model, User.nickname, User.avatar.alias("tenant_avatar"))
                .join(User, on=(User.id == cls.model.tenant_id))
                .where(
                    (cls.model.tenant_id.in_(effective_owner_ids))
                    & (cls.model.status == VALID_STATUS)
                )
            )
            if keywords:
                query = query.where(fn.LOWER(cls.model.name).contains(keywords.lower()))
            query = query.order_by(order_field.desc() if desc else order_field.asc())
            total = query.count()
            records = list(query.paginate(page, page_size).dicts())
        return [_with_owner(record) for record in records], total

    @classmethod
    def get_detail(cls, search_id: str, user_id: str) -> dict[str, Any]:
        connect_db()
        tenant_ids = UserTenantService.get_visible_tenant_ids(user_id)
        with DB.connection_context():
            record = (
                cls.model.select(cls.model, User.nickname, User.avatar.alias("tenant_avatar"))
                .join(User, on=(User.id == cls.model.tenant_id))
                .where(
                    (cls.model.id == search_id)
                    & (cls.model.tenant_id.in_(tenant_ids))
                    & (cls.model.status == VALID_STATUS)
                )
                .dicts()
                .first()
            )
        if not record:
            raise SearchNotFound(search_id)
        return _with_owner(record)

    @classmethod
    def get_record(cls, search_id: str, user_id: str) -> Search:
        connect_db()
        tenant_ids = UserTenantService.get_visible_tenant_ids(user_id)
        with DB.connection_context():
            try:
                return cls.model.get(
                    (cls.model.id == search_id)
                    & (cls.model.tenant_id.in_(tenant_ids))
                    & (cls.model.status == VALID_STATUS)
                )
            except DoesNotExist as exc:
                raise SearchNotFound(search_id) from exc

    @classmethod
    def get_owned_record(cls, search_id: str, user_id: str) -> Search:
        connect_db()
        tenant_id = UserService.get_tenant_defaults(user_id)["tenant_id"]
        with DB.connection_context():
            try:
                return cls.model.get(
                    (cls.model.id == search_id)
                    & (cls.model.tenant_id == tenant_id)
                    & (cls.model.created_by == user_id)
                    & (cls.model.status == VALID_STATUS)
                )
            except DoesNotExist as exc:
                raise SearchNotFound(search_id) from exc

    @classmethod
    def accessible4deletion(cls, search_id: str, user_id: str) -> bool:
        connect_db()
        with DB.connection_context():
            return (
                cls.model.select(cls.model.id)
                .where(
                    (cls.model.id == search_id)
                    & (cls.model.created_by == user_id)
                    & (cls.model.status == VALID_STATUS)
                )
                .first()
                is not None
            )

    @classmethod
    def update(cls, search_id: str, payload: dict[str, Any], user_id: str) -> dict[str, Any]:
        connect_db()
        current = cls.get_owned_record(search_id, user_id)
        tenant_id = UserService.get_tenant_defaults(user_id)["tenant_id"]
        name = _normalize_name(payload.get("name", current.name))
        if name.lower() != current.name.lower() and _name_exists(name, tenant_id):
            raise SearchValidationError("Duplicated search name.")

        current_config = deepcopy(current.search_config or DEFAULT_SEARCH_CONFIG)
        incoming_config = payload.get("search_config", {})
        if not isinstance(incoming_config, dict):
            raise SearchValidationError("search_config must be a JSON object.")

        search_config = _normalize_search_config(
            {**current_config, **incoming_config},
            user_id=user_id,
        )
        update_fields = {
            "name": name,
            "description": str(payload.get("description", current.description or "") or "").strip(),
            "avatar": str(payload.get("avatar", current.avatar or "") or ""),
            "search_config": search_config,
            "update_time": _current_timestamp(),
            "update_date": datetime.utcnow(),
        }
        with DB.atomic():
            updated = (
                cls.model.update(**update_fields)
                .where(
                    (cls.model.id == search_id)
                    & (cls.model.tenant_id == tenant_id)
                    & (cls.model.status == VALID_STATUS)
                )
                .execute()
            )
        if updated == 0:
            raise SearchNotFound(search_id)
        return cls.get_detail(search_id, user_id)

    @classmethod
    def delete(cls, search_id: str, user_id: str) -> bool:
        connect_db()
        if not cls.accessible4deletion(search_id, user_id):
            raise SearchNotFound(search_id)
        with DB.atomic():
            return cls.model.delete().where(cls.model.id == search_id).execute() > 0


def _normalize_search_config(config: dict[str, Any], *, user_id: str) -> dict[str, Any]:
    if not isinstance(config, dict):
        raise SearchValidationError("search_config must be a JSON object.")

    normalized = deepcopy(DEFAULT_SEARCH_CONFIG)
    normalized.update({key: value for key, value in config.items() if key in normalized})
    normalized["kb_ids"] = _string_list(normalized.get("kb_ids"))
    normalized["doc_ids"] = _string_list(normalized.get("doc_ids"))
    normalized["similarity_threshold"] = _float_between(
        normalized.get("similarity_threshold"),
        0.0,
        1.0,
        DEFAULT_SEARCH_CONFIG["similarity_threshold"],
    )
    normalized["vector_similarity_weight"] = _float_between(
        normalized.get("vector_similarity_weight"),
        0.0,
        1.0,
        DEFAULT_SEARCH_CONFIG["vector_similarity_weight"],
    )
    normalized["top_k"] = min(
        _positive_int(normalized.get("top_k"), DEFAULT_SEARCH_CONFIG["top_k"]),
        2048,
    )

    unsupported = _unsupported_active_features(config, normalized)
    if unsupported:
        raise SearchValidationError(
            "Unsupported Search App features in this block: " + ", ".join(unsupported)
        )

    for kb_id in normalized["kb_ids"]:
        KnowledgebaseService.get_record(kb_id, user_id)
    return normalized


def _effective_owner_ids(user_id: str, owner_ids: list[str] | None = None) -> list[str]:
    authorized_owner_ids = set(UserTenantService.get_visible_tenant_ids(user_id))
    requested_owner_ids = {
        str(owner_id).strip()
        for owner_id in owner_ids or []
        if str(owner_id).strip()
    }
    if not requested_owner_ids:
        return list(authorized_owner_ids)
    unauthorized_owner_ids = requested_owner_ids - authorized_owner_ids
    if unauthorized_owner_ids:
        raise SearchValidationError("Only authorized owner_ids can be queried.")
    return list(requested_owner_ids)


def _unsupported_active_features(
    incoming_config: dict[str, Any],
    normalized_config: dict[str, Any],
) -> list[str]:
    unsupported = []
    if normalized_config.get("rerank_id"):
        unsupported.append("rerank_id")
    if normalized_config.get("use_kg"):
        unsupported.append("use_kg")
    if normalized_config.get("keyword"):
        unsupported.append("keyword")
    if normalized_config.get("web_search"):
        unsupported.append("web_search")
    if normalized_config.get("related_search"):
        unsupported.append("related_search")
    if normalized_config.get("query_mindmap"):
        unsupported.append("query_mindmap")
    if normalized_config.get("summary"):
        unsupported.append("summary")
    if incoming_config.get("cross_languages"):
        unsupported.append("cross_languages")
    if incoming_config.get("chat_settingcross_languages"):
        unsupported.append("chat_settingcross_languages")
    if _has_metadata_filter(incoming_config.get("meta_data_filter")):
        unsupported.append("meta_data_filter")
    return unsupported


def _has_metadata_filter(value: Any) -> bool:
    if not value:
        return False
    if not isinstance(value, dict):
        return True
    return any(bool(item) for item in value.values())


def _normalize_name(value: Any) -> str:
    name = str(value or "").strip()
    if not name:
        raise SearchValidationError("Search name can't be empty.")
    if len(name.encode("utf-8")) > 128:
        raise SearchValidationError("Search name must be 128 characters or less.")
    return name


def _deduplicate_name(name: str, tenant_id: str) -> str:
    connect_db()
    with DB.connection_context():
        existing = {
            record.name
            for record in Search.select(Search.name).where(
                (Search.tenant_id == tenant_id) & (Search.status == VALID_STATUS)
            )
        }
    if name not in existing:
        return name
    counter = 1
    while f"{name} ({counter})" in existing:
        counter += 1
    return f"{name} ({counter})"


def _name_exists(name: str, tenant_id: str) -> bool:
    connect_db()
    with DB.connection_context():
        return (
            Search.select(Search.id)
            .where(
                (Search.name == name)
                & (Search.tenant_id == tenant_id)
                & (Search.status == VALID_STATUS)
            )
            .first()
            is not None
        )


def _string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def _positive_int(value: Any, default: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    return max(parsed, 1)


def _float_between(value: Any, low: float, high: float, default: float) -> float:
    if not isinstance(value, Real):
        try:
            value = float(value)
        except (TypeError, ValueError):
            value = default
    return max(low, min(float(value), high))


def _with_owner(record: dict[str, Any]) -> dict[str, Any]:
    search_config = record.get("search_config") or {}
    return {
        **record,
        "avatar": record.get("avatar") or "",
        "description": record.get("description") or "",
        "search_config": search_config,
        "nickname": record.get("nickname") or record.get("created_by") or "",
        "tenant_avatar": record.get("tenant_avatar") or "",
    }


def _current_timestamp() -> int:
    return int(time.time() * 1000)
