import inspect
import logging
import sys
import time
from datetime import datetime
from typing import Any

from itsdangerous.url_safe import URLSafeTimedSerializer as Serializer
from peewee import (
    BigIntegerField,
    CharField,
    DateTimeField,
    FloatField,
    IntegerField,
    Model,
    OperationalError,
    PrimaryKeyField,
    TextField,
)
from playhouse.migrate import MySQLMigrator, migrate
from playhouse.mysql_ext import JSONField, MySQLConnectorDatabase

from api.config import load_api_config
from common import settings

DB = MySQLConnectorDatabase(None)


def connect_db() -> None:
    config = load_api_config()
    if DB.database is None:
        DB.init(
            config.db_name,
            host=config.db_host,
            port=config.db_port,
            user=config.db_user,
            password=config.db_password,
            charset="utf8mb4",
        )
    if DB.is_closed():
        DB.connect(reuse_if_open=True)


def close_db() -> None:
    if not DB.is_closed():
        DB.close()


def init_database_tables() -> None:
    connect_db()
    create_failed_list: list[str] = []
    members = inspect.getmembers(sys.modules[__name__], inspect.isclass)

    for _name, model in members:
        if model == BaseModel or not issubclass(model, BaseModel):
            continue
        if model.table_exists():
            logging.debug("table %s already exists, skip creation.", model.__name__)
            continue
        try:
            logging.debug("start create table %s", model.__name__)
            model.create_table(safe=True)
            logging.debug("create table success: %s", model.__name__)
        except Exception:
            logging.exception("create table failed: %s", model.__name__)
            create_failed_list.append(model.__name__)

    if create_failed_list:
        raise RuntimeError(f"create tables failed: {create_failed_list}")
    migrate_db()


def migrate_db() -> None:
    migrator = MySQLMigrator(DB)
    alter_db_add_column("user", "password", CharField(max_length=255, null=True), migrator)
    alter_db_add_column("user", "access_token", CharField(max_length=255, null=True), migrator)
    alter_db_add_column("user", "avatar", TextField(null=True), migrator)
    alter_db_add_column(
        "user",
        "timezone",
        CharField(max_length=64, null=True, default="UTC+8\tAsia/Shanghai"),
        migrator,
    )
    alter_db_add_column(
        "user",
        "login_channel",
        CharField(max_length=32, null=True, default="password"),
        migrator,
    )


def alter_db_add_column(
    table_name: str,
    column_name: str,
    column_type,
    migrator: MySQLMigrator | None = None,
) -> None:
    if _column_exists(table_name, column_name):
        logging.debug("column %s.%s already exists, skip migration.", table_name, column_name)
        return

    try:
        migrate((migrator or MySQLMigrator(DB)).add_column(table_name, column_name, column_type))
    except OperationalError as exc:
        if _is_duplicate_column_error(exc):
            return
        logging.critical("failed to add column %s.%s: %s", table_name, column_name, exc)
        raise


def _column_exists(table_name: str, column_name: str) -> bool:
    return any(column.name == column_name for column in DB.get_columns(table_name))


def _is_duplicate_column_error(exc: OperationalError) -> bool:
    message = str(exc)
    return "1060" in message or "Duplicate column name" in message


def database_health() -> tuple[str, str | None]:
    try:
        connect_db()
        with DB.connection_context():
            DB.execute_sql("SELECT 1")
        return "ok", None
    except Exception as exc:
        return "error", str(exc)


class BaseModel(Model):
    class Meta:
        database = DB


class User(BaseModel):
    id = CharField(max_length=32, primary_key=True)
    nickname = CharField(max_length=100, index=True)
    email = CharField(max_length=255, unique=True)
    password = CharField(max_length=255, null=True)
    access_token = CharField(max_length=255, null=True, index=True)
    avatar = TextField(null=True)
    login_channel = CharField(max_length=32, null=True, default="password", index=True)
    language = CharField(max_length=32, null=True, default="English", index=True)
    timezone = CharField(max_length=64, null=True, default="UTC+8\tAsia/Shanghai", index=True)
    status = CharField(max_length=1, null=True, default="1", index=True)
    is_active = CharField(max_length=1, null=False, default="1", index=True)
    last_login_time = DateTimeField(null=True, index=True)
    create_time = BigIntegerField(default=lambda: int(time.time() * 1000), index=True)
    create_date = DateTimeField(default=datetime.utcnow, index=True)
    update_time = BigIntegerField(default=lambda: int(time.time() * 1000), index=True)
    update_date = DateTimeField(default=datetime.utcnow, index=True)

    class Meta:
        table_name = "user"

    def to_api(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "nickname": self.nickname,
            "email": self.email,
            "avatar": self.avatar or "",
            "language": self.language or "English",
            "timezone": self.timezone or "UTC+8\tAsia/Shanghai",
            "access_token": self.access_token or "",
        }

    def get_id(self) -> str:
        jwt = Serializer(secret_key=settings.get_secret_key())
        return jwt.dumps(str(self.access_token))

    def to_safe_dict(self, *, for_self: bool = False) -> dict[str, Any]:
        result = {
            "id": self.id,
            "nickname": self.nickname,
            "avatar": self.avatar or "",
            "language": self.language or "English",
            "timezone": self.timezone or "UTC+8\tAsia/Shanghai",
            "login_channel": self.login_channel,
            "status": self.status,
            "is_active": self.is_active,
            "create_time": self.create_time,
            "update_time": self.update_time,
        }
        if for_self:
            result["email"] = self.email
        return result


class Tenant(BaseModel):
    id = CharField(max_length=32, primary_key=True)
    name = CharField(max_length=100, null=True, index=True)
    llm_id = CharField(max_length=128, default="qwen-plus", index=True)
    tenant_llm_id = IntegerField(null=True, index=True)
    embd_id = CharField(max_length=128, default="bge-m3", index=True)
    tenant_embd_id = IntegerField(null=True, index=True)
    parser_ids = CharField(max_length=256, default="naive", index=True)
    status = CharField(max_length=1, null=True, default="1", index=True)
    create_time = BigIntegerField(default=lambda: int(time.time() * 1000), index=True)
    create_date = DateTimeField(default=datetime.utcnow, index=True)
    update_time = BigIntegerField(default=lambda: int(time.time() * 1000), index=True)
    update_date = DateTimeField(default=datetime.utcnow, index=True)

    class Meta:
        table_name = "tenant"


class TenantLLM(BaseModel):
    id = PrimaryKeyField()
    tenant_id = CharField(max_length=32, index=True)
    llm_factory = CharField(max_length=128, default="local", index=True)
    model_type = CharField(max_length=128, null=True, index=True)
    llm_name = CharField(max_length=128, null=True, default="", index=True)
    status = CharField(max_length=1, null=False, default="1", index=True)
    create_time = BigIntegerField(default=lambda: int(time.time() * 1000), index=True)
    create_date = DateTimeField(default=datetime.utcnow, index=True)
    update_time = BigIntegerField(default=lambda: int(time.time() * 1000), index=True)
    update_date = DateTimeField(default=datetime.utcnow, index=True)

    class Meta:
        table_name = "tenant_llm"
        indexes = ((("tenant_id", "llm_factory", "llm_name"), True),)


class Knowledgebase(BaseModel):
    id = CharField(max_length=32, primary_key=True)
    avatar = TextField(null=True)
    tenant_id = CharField(max_length=32, index=True)
    name = CharField(max_length=128, index=True)
    language = CharField(max_length=32, null=True, default="English", index=True)
    description = TextField(null=True)
    embd_id = CharField(max_length=128, index=True)
    tenant_embd_id = IntegerField(null=True, index=True)
    permission = CharField(max_length=16, default="me", index=True)
    created_by = CharField(max_length=32, index=True)
    doc_num = IntegerField(default=0, index=True)
    token_num = BigIntegerField(default=0, index=True)
    chunk_num = IntegerField(default=0, index=True)
    similarity_threshold = FloatField(default=0.2, index=True)
    vector_similarity_weight = FloatField(default=0.3, index=True)
    parser_id = CharField(max_length=32, index=True, default="naive")
    pipeline_id = CharField(max_length=32, null=True, index=True)
    parser_config = JSONField(
        default={"pages": [[1, 1000000]], "table_context_size": 0, "image_context_size": 0}
    )
    pagerank = IntegerField(default=0)
    graphrag_task_id = CharField(max_length=32, null=True, index=True)
    graphrag_task_finish_at = DateTimeField(null=True)
    raptor_task_id = CharField(max_length=32, null=True, index=True)
    raptor_task_finish_at = DateTimeField(null=True)
    mindmap_task_id = CharField(max_length=32, null=True, index=True)
    mindmap_task_finish_at = DateTimeField(null=True)
    status = CharField(max_length=1, null=True, default="1", index=True)
    create_time = BigIntegerField(default=lambda: int(time.time() * 1000), index=True)
    create_date = DateTimeField(default=datetime.utcnow, index=True)
    update_time = BigIntegerField(default=lambda: int(time.time() * 1000), index=True)
    update_date = DateTimeField(default=datetime.utcnow, index=True)

    class Meta:
        table_name = "knowledgebase"

    def to_api(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "name": self.name,
            "language": self.language or "English",
            "description": self.description or "",
            "embedding_model": self.embd_id,
            "permission": self.permission,
            "created_by": self.created_by,
            "chunk_method": self.parser_id,
            "parser_config": self.parser_config,
            "document_count": int(self.doc_num),
            "token_num": int(self.token_num),
            "chunk_count": int(self.chunk_num),
            "status": self.status,
            "created_at": _timestamp_to_iso(self.create_time),
            "updated_at": _timestamp_to_iso(self.update_time),
        }


class Document(BaseModel):
    id = CharField(max_length=32, primary_key=True)
    thumbnail = TextField(null=True)
    kb_id = CharField(max_length=256, index=True)
    parser_id = CharField(max_length=32, index=True)
    pipeline_id = CharField(max_length=32, null=True, index=True)
    parser_config = JSONField(
        default={"pages": [[1, 1000000]], "table_context_size": 0, "image_context_size": 0}
    )
    source_type = CharField(max_length=128, default="local", index=True)
    type = CharField(max_length=32, index=True)
    created_by = CharField(max_length=32, index=True)
    name = CharField(max_length=255, null=True, index=True)
    location = CharField(max_length=255, null=True, index=True)
    size = BigIntegerField(default=0, index=True)
    token_num = IntegerField(default=0, index=True)
    chunk_num = IntegerField(default=0, index=True)
    progress = FloatField(default=0, index=True)
    progress_msg = TextField(null=True, default="")
    process_begin_at = DateTimeField(null=True, index=True)
    process_duration = FloatField(default=0)
    suffix = CharField(max_length=32, index=True)
    content_hash = CharField(max_length=32, null=True, default="", index=True)
    run = CharField(max_length=1, null=True, default="0", index=True)
    status = CharField(max_length=1, null=True, default="1", index=True)
    create_time = BigIntegerField(default=lambda: int(time.time() * 1000), index=True)
    create_date = DateTimeField(default=datetime.utcnow, index=True)
    update_time = BigIntegerField(default=lambda: int(time.time() * 1000), index=True)
    update_date = DateTimeField(default=datetime.utcnow, index=True)

    class Meta:
        table_name = "document"

    def to_api(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "dataset_id": self.kb_id,
            "kb_id": self.kb_id,
            "name": self.name or "",
            "location": self.location or "",
            "size": int(self.size),
            "type": self.type,
            "suffix": self.suffix,
            "source_type": self.source_type,
            "chunk_method": self.parser_id,
            "parser_id": self.parser_id,
            "parser_config": self.parser_config,
            "token_num": int(self.token_num),
            "token_count": int(self.token_num),
            "chunk_num": int(self.chunk_num),
            "chunk_count": int(self.chunk_num),
            "progress": float(self.progress),
            "progress_msg": self.progress_msg or "",
            "run": self.run or "0",
            "status": self.status,
            "created_by": self.created_by,
            "created_at": _timestamp_to_iso(self.create_time),
            "updated_at": _timestamp_to_iso(self.update_time),
        }


class File(BaseModel):
    id = CharField(max_length=32, primary_key=True)
    parent_id = CharField(max_length=32, index=True)
    tenant_id = CharField(max_length=32, index=True)
    created_by = CharField(max_length=32, index=True)
    name = CharField(max_length=255, index=True)
    location = CharField(max_length=255, null=True, index=True)
    size = BigIntegerField(default=0, index=True)
    type = CharField(max_length=32, index=True)
    source_type = CharField(max_length=128, default="", index=True)
    create_time = BigIntegerField(default=lambda: int(time.time() * 1000), index=True)
    create_date = DateTimeField(default=datetime.utcnow, index=True)
    update_time = BigIntegerField(default=lambda: int(time.time() * 1000), index=True)
    update_date = DateTimeField(default=datetime.utcnow, index=True)

    class Meta:
        table_name = "file"


class File2Document(BaseModel):
    id = CharField(max_length=32, primary_key=True)
    file_id = CharField(max_length=32, null=True, index=True)
    document_id = CharField(max_length=32, null=True, index=True)
    create_time = BigIntegerField(default=lambda: int(time.time() * 1000), index=True)
    create_date = DateTimeField(default=datetime.utcnow, index=True)
    update_time = BigIntegerField(default=lambda: int(time.time() * 1000), index=True)
    update_date = DateTimeField(default=datetime.utcnow, index=True)

    class Meta:
        table_name = "file2document"


def _timestamp_to_iso(value: int | None) -> str:
    if not value:
        return ""
    return datetime.fromtimestamp(value / 1000).isoformat()
