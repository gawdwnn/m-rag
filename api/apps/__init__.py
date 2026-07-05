import asyncio
import logging
import threading
import time
from collections.abc import Awaitable, Callable
from functools import wraps
from typing import ParamSpec, TypeVar

from itsdangerous.url_safe import URLSafeTimedSerializer as Serializer
from quart import Quart, current_app, jsonify, request, session
from werkzeug.local import LocalProxy

from api.config import load_api_config
from api.db.db_models import User, init_database_tables
from api.db.services.user_service import UserService
from common import settings

P = ParamSpec("P")
T = TypeVar("T")


def _load_user() -> User | None:
    jwt = Serializer(secret_key=settings.get_secret_key())
    authorization = request.headers.get("Authorization", "").strip()
    if not authorization:
        return _load_user_from_session()

    if authorization.lower().startswith("bearer "):
        auth_token = authorization.split(maxsplit=1)[1].strip()
    else:
        auth_token = authorization
    try:
        access_token = str(jwt.loads(auth_token))
    except Exception:
        return _load_user_from_session()
    if not access_token:
        return _load_user_from_session()
    return UserService.get_by_access_token(access_token) or _load_user_from_session()


def _load_user_from_session() -> User | None:
    user_id = session.get("_user_id")
    if not user_id:
        return None
    return UserService.get_active_user_with_valid_token(str(user_id))


current_user = LocalProxy(_load_user)


def current_user_id() -> str:
    user = _load_user()
    if user is None:
        raise RuntimeError("No authenticated user is loaded.")
    return user.id


def login_required(func: Callable[P, Awaitable[T]]) -> Callable[P, Awaitable[T]]:
    @wraps(func)
    async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        if _load_user() is None:
            return jsonify({"error": "Authentication required."}), 401
        return await current_app.ensure_async(func)(*args, **kwargs)

    return wrapper


def login_user(user: User) -> None:
    session["_user_id"] = user.id


def logout_user() -> None:
    session.pop("_user_id", None)


def create_app() -> Quart:
    app = Quart(__name__)
    config = load_api_config()
    app.secret_key = config.secret_key
    app.url_map.strict_slashes = False

    from api.apps.restful_apis.chunk_api import manager as chunk_manager
    from api.apps.restful_apis.dataset_api import manager as dataset_manager
    from api.apps.restful_apis.document_api import manager as document_manager
    from api.apps.restful_apis.search_api import manager as search_manager
    from api.apps.restful_apis.system_api import manager as system_manager
    from api.apps.restful_apis.user_api import manager as user_manager

    app.register_blueprint(system_manager, url_prefix="/api/v1")
    app.register_blueprint(user_manager, url_prefix="/api/v1")
    app.register_blueprint(dataset_manager, url_prefix="/api/v1")
    app.register_blueprint(document_manager, url_prefix="/api/v1")
    app.register_blueprint(chunk_manager, url_prefix="/api/v1")
    app.register_blueprint(search_manager, url_prefix="/api/v1")

    @app.before_serving
    async def init_db() -> None:
        await asyncio.to_thread(init_database_tables)
        _start_update_progress_thread()

    return app


app = create_app()


_progress_thread_started = False


def _start_update_progress_thread() -> None:
    global _progress_thread_started
    if _progress_thread_started:
        return
    _progress_thread_started = True

    def update_progress() -> None:
        from api.db.services.document_service import DocumentService

        while True:
            try:
                DocumentService.update_progress()
            except Exception:
                logging.exception("update_progress exception")
            time.sleep(2)

    threading.Thread(target=update_progress, daemon=True).start()
