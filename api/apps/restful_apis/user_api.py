from quart import Blueprint, request

from api.apps import current_user_id, login_required, login_user, logout_user
from api.db.services import AuthenticationError, UserService
from api.utils.api_utils import get_error_argument_result, get_json_result, get_result, run_db_call
from common.connection_utils import construct_response

manager = Blueprint("user_api", __name__)


@manager.get("/users/me")
@login_required
async def get_current_user():
    user = await run_db_call(UserService.get_active_user, current_user_id())
    if user is None:
        return get_error_argument_result("Authentication required.")
    return get_result(data=user.to_safe_dict(for_self=True))


@manager.patch("/users/me")
@login_required
async def setting_user():
    payload = await request.get_json(silent=True) or {}
    try:
        user = await run_db_call(UserService.update_user_settings, current_user_id(), payload)
    except AuthenticationError as exc:
        return get_error_argument_result(str(exc))
    return get_result(data=user.to_safe_dict(for_self=True))


@manager.get("/users/me/models")
@login_required
async def get_current_user_models():
    defaults = await run_db_call(UserService.get_tenant_defaults, current_user_id())
    return get_result(data=defaults)


@manager.post("/auth/login")
async def login():
    payload = await request.get_json(silent=True) or {}
    try:
        user = await run_db_call(UserService.login_by_password, payload)
    except AuthenticationError as exc:
        return get_error_argument_result(str(exc))

    login_user(user)
    return await construct_response(
        data=user.to_safe_dict(for_self=True),
        auth=user.get_id(),
        message="Welcome back!",
    )


@manager.post("/users")
async def register():
    payload = await request.get_json(silent=True) or {}
    try:
        user = await run_db_call(UserService.register_user, payload)
    except AuthenticationError as exc:
        return get_error_argument_result(str(exc))

    login_user(user)
    return await construct_response(
        data=user.to_safe_dict(for_self=True),
        auth=user.get_id(),
        message=f"{user.nickname}, welcome aboard!",
    )


@manager.post("/auth/logout")
@login_required
async def logout():
    await run_db_call(UserService.invalidate_access_token, current_user_id())
    logout_user()
    return get_json_result(data=True)
