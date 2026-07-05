from datetime import datetime
from typing import Any
from uuid import uuid4

from peewee import DoesNotExist, IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from api.db.db_models import DB, Tenant, TenantLLM, User, UserTenant, connect_db
from api.utils.crypt import decrypt
from common.constants import ParserType, UserTenantRole

VALID_STATUS = "1"
DEFAULT_CHAT_MODEL_ID = "qwen-plus"
DEFAULT_EMBEDDING_MODEL_ID = "bge-m3"
DEFAULT_PARSER_IDS = ",".join(
    [
        f"{ParserType.NAIVE.value}:General",
        f"{ParserType.QA.value}:Q&A",
        f"{ParserType.ONE.value}:One",
    ]
)


class AuthenticationError(Exception):
    pass


class EmailNotRegisteredError(AuthenticationError):
    pass


class UserService:
    @classmethod
    def get_active_user(cls, user_id: str) -> User | None:
        connect_db()
        with DB.connection_context():
            try:
                return User.get(
                    (User.id == user_id)
                    & (User.status == VALID_STATUS)
                    & (User.is_active == VALID_STATUS)
                )
            except DoesNotExist:
                return None

    @classmethod
    def get_active_user_with_valid_token(cls, user_id: str) -> User | None:
        user = cls.get_active_user(user_id)
        if user is None or not _is_valid_access_token(user.access_token):
            return None
        return user

    @classmethod
    def get_by_access_token(cls, access_token: str) -> User | None:
        connect_db()
        token = str(access_token or "").strip()
        if not _is_valid_access_token(token):
            return None
        with DB.connection_context():
            try:
                return User.get(
                    (User.access_token == token)
                    & (User.status == VALID_STATUS)
                    & (User.is_active == VALID_STATUS)
                )
            except DoesNotExist:
                return None

    @classmethod
    def invalidate_access_token(cls, user_id: str) -> None:
        connect_db()
        with DB.atomic():
            user = cls.get_active_user(user_id)
            if user is None:
                return
            user.access_token = f"INVALID_{uuid4().hex}"
            user.update_date = datetime.utcnow()
            user.save()

    @classmethod
    def register_user(cls, payload: dict[str, Any]) -> User:
        connect_db()
        email = _normalize_email(payload.get("email"))
        password = _normalize_password(payload.get("password"))
        nickname = str(payload.get("nickname") or "").strip()
        if not nickname:
            raise AuthenticationError("A valid nickname is required.")

        with DB.atomic():
            user = User.get_or_none(User.email == email)
            if user is not None:
                raise AuthenticationError(f"Email: {email} has already registered.")
            user = User.create(
                id=uuid4().hex,
                email=email,
                nickname=nickname,
                password=generate_password_hash(password),
                access_token=uuid4().hex,
                login_channel="password",
                last_login_time=datetime.utcnow(),
            )
            cls.ensure_tenant_defaults(user)
            return user

    @classmethod
    def login_by_password(cls, payload: dict[str, Any]) -> User:
        connect_db()
        email = _normalize_email(payload.get("email"))
        password = _normalize_password(payload.get("password"))
        with DB.atomic():
            user = User.get_or_none(
                (User.email == email)
                & (User.status == VALID_STATUS)
                & (User.is_active == VALID_STATUS)
            )
            if user is None:
                raise EmailNotRegisteredError(f"Email: {email} is not registered.")
            if not user.password or not check_password_hash(user.password, password):
                raise AuthenticationError("Email and password do not match.")
            user.access_token = uuid4().hex
            user.last_login_time = datetime.utcnow()
            user.update_date = datetime.utcnow()
            user.save()
            cls.ensure_tenant_defaults(user)
            return user

    @classmethod
    def ensure_tenant_defaults(cls, user: User) -> Tenant:
        tenant, _ = Tenant.get_or_create(
            id=user.id,
            defaults={
                "name": user.nickname,
                "llm_id": DEFAULT_CHAT_MODEL_ID,
                "embd_id": DEFAULT_EMBEDDING_MODEL_ID,
                "parser_ids": DEFAULT_PARSER_IDS,
            },
        )

        chat_llm = cls._ensure_tenant_llm(user.id, DEFAULT_CHAT_MODEL_ID, "chat")
        embedding_llm = cls._ensure_tenant_llm(user.id, DEFAULT_EMBEDDING_MODEL_ID, "embedding")
        UserTenantService.ensure_owner_relation(user.id)

        changed = False
        if tenant.tenant_llm_id != chat_llm.id:
            tenant.tenant_llm_id = chat_llm.id
            changed = True
        if tenant.tenant_embd_id != embedding_llm.id:
            tenant.tenant_embd_id = embedding_llm.id
            changed = True
        if not tenant.parser_ids or tenant.parser_ids in {"naive", "naive one qa"}:
            tenant.parser_ids = DEFAULT_PARSER_IDS
            changed = True
        if changed:
            tenant.update_date = datetime.utcnow()
            tenant.save()
        return tenant

    @classmethod
    def get_tenant_defaults(cls, user_id: str) -> dict[str, Any]:
        connect_db()
        with DB.connection_context():
            user = cls.get_active_user(user_id)
            if user is None:
                raise AuthenticationError("Current user is not authenticated.")
            tenant = cls.ensure_tenant_defaults(user)
            return {
                "tenant_id": tenant.id,
                "llm_id": tenant.llm_id,
                "tenant_llm_id": tenant.tenant_llm_id,
                "embd_id": tenant.embd_id,
                "tenant_embd_id": tenant.tenant_embd_id,
                "parser_ids": tenant.parser_ids,
            }

    @classmethod
    def update_user_settings(cls, user_id: str, payload: dict[str, Any]) -> User:
        connect_db()
        with DB.atomic():
            user = cls.get_active_user(user_id)
            if user is None:
                raise AuthenticationError("Current user is not authenticated.")

            update_fields: dict[str, Any] = {}
            if "nickname" in payload:
                nickname = str(payload.get("nickname") or "").strip()
                if not nickname:
                    raise AuthenticationError("A valid nickname is required.")
                update_fields["nickname"] = nickname
            if "avatar" in payload:
                update_fields["avatar"] = str(payload.get("avatar") or "")
            if "timezone" in payload:
                timezone = str(payload.get("timezone") or "").strip()
                if timezone:
                    update_fields["timezone"] = timezone

            if payload.get("password"):
                current_password = _normalize_password(payload.get("password"))
                if not user.password or not check_password_hash(user.password, current_password):
                    raise AuthenticationError("Password error!")
                new_password_value = payload.get("new_password")
                if new_password_value:
                    update_fields["password"] = generate_password_hash(
                        _normalize_password(new_password_value)
                    )

            for key, value in update_fields.items():
                setattr(user, key, value)
            user.update_date = datetime.utcnow()
            user.save()
            return user

    @classmethod
    def _ensure_tenant_llm(cls, tenant_id: str, model_name: str, model_type: str) -> TenantLLM:
        try:
            return TenantLLM.create(
                tenant_id=tenant_id,
                llm_factory="local",
                model_type=model_type,
                llm_name=model_name,
            )
        except IntegrityError:
            return TenantLLM.get(
                (TenantLLM.tenant_id == tenant_id)
                & (TenantLLM.llm_factory == "local")
                & (TenantLLM.llm_name == model_name)
            )


class TenantService:
    model = Tenant

    @classmethod
    def get_joined_tenants_by_user_id(cls, user_id: str) -> list[dict[str, Any]]:
        connect_db()
        with DB.connection_context():
            records = (
                cls.model.select(
                    cls.model.id.alias("tenant_id"),
                    cls.model.name,
                    cls.model.llm_id,
                    cls.model.embd_id,
                    UserTenant.role,
                )
                .join(
                    UserTenant,
                    on=(
                        (cls.model.id == UserTenant.tenant_id)
                        & (UserTenant.user_id == user_id)
                        & (UserTenant.status == VALID_STATUS)
                        & (UserTenant.role == UserTenantRole.NORMAL.value)
                    ),
                )
                .where(cls.model.status == VALID_STATUS)
                .dicts()
            )
            return list(records)


class UserTenantService:
    model = UserTenant

    @classmethod
    def ensure_owner_relation(cls, user_id: str) -> UserTenant:
        connect_db()
        relation, _ = cls.model.get_or_create(
            user_id=user_id,
            tenant_id=user_id,
            defaults={
                "id": uuid4().hex,
                "role": UserTenantRole.OWNER.value,
                "invited_by": user_id,
            },
        )
        changed = False
        if relation.role != UserTenantRole.OWNER.value:
            relation.role = UserTenantRole.OWNER.value
            changed = True
        if relation.status != VALID_STATUS:
            relation.status = VALID_STATUS
            changed = True
        if changed:
            relation.update_date = datetime.utcnow()
            relation.save()
        return relation

    @classmethod
    def query(cls, **filters: Any) -> list[UserTenant]:
        connect_db()
        query = cls.model.select().where(cls.model.status == VALID_STATUS)
        for key, value in filters.items():
            query = query.where(getattr(cls.model, key) == value)
        with DB.connection_context():
            return list(query)

    @classmethod
    def get_user_tenant_relation_by_user_id(cls, user_id: str) -> list[dict[str, Any]]:
        return [
            {
                "id": relation.id,
                "user_id": relation.user_id,
                "tenant_id": relation.tenant_id,
                "role": relation.role,
            }
            for relation in cls.query(user_id=user_id)
        ]

    @classmethod
    def get_visible_tenant_ids(cls, user_id: str) -> list[str]:
        relations = cls.query(user_id=user_id)
        tenant_ids = {relation.tenant_id for relation in relations}
        tenant_ids.add(user_id)
        return list(tenant_ids)


def _normalize_email(value: Any) -> str:
    email = str(value or "").strip().lower()
    if "@" not in email:
        raise AuthenticationError("A valid email is required.")
    return email


def _normalize_password(value: Any) -> str:
    try:
        password = decrypt(str(value or ""))
    except Exception as exc:
        raise AuthenticationError("Failed to decrypt password.") from exc
    if len(password) < 6:
        raise AuthenticationError("Password must be at least 6 characters.")
    return password


def _is_valid_access_token(value: Any) -> bool:
    token = str(value or "").strip()
    return len(token) >= 32 and not token.startswith("INVALID_")
