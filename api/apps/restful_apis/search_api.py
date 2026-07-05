from quart import Blueprint, request

from api.apps import current_user_id, login_required
from api.apps.services import search_api_service
from api.utils.api_utils import (
    get_error_argument_result,
    get_error_data_result,
    get_result,
    run_db_call,
)

manager = Blueprint("search_api", __name__)


@manager.post("/searches")
@login_required
async def create():
    req = await request.get_json(silent=True) or {}
    if "name" not in req:
        return get_error_argument_result("name is required.")
    success, result = await run_db_call(search_api_service.create_search, current_user_id(), req)
    if success:
        return get_result(data=result), 201
    return get_error_data_result(message=result)


@manager.get("/searches")
@login_required
async def list_searches():
    args = dict(request.args)
    args["owner_ids"] = request.args.getlist("owner_ids")
    success, result = await run_db_call(
        search_api_service.list_searches,
        current_user_id(),
        args,
    )
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)


@manager.get("/searches/<search_id>")
@login_required
async def detail(search_id: str):
    success, result = await run_db_call(
        search_api_service.get_search,
        search_id,
        current_user_id(),
    )
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)


@manager.put("/searches/<search_id>")
@login_required
async def update(search_id: str):
    req = await request.get_json(silent=True) or {}
    if "name" not in req:
        return get_error_argument_result("name is required.")
    if "search_config" not in req:
        return get_error_argument_result("search_config is required.")
    success, result = await run_db_call(
        search_api_service.update_search,
        current_user_id(),
        search_id,
        req,
    )
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)


@manager.delete("/searches/<search_id>")
@login_required
async def delete_search(search_id: str):
    success, result = await run_db_call(
        search_api_service.delete_search,
        current_user_id(),
        search_id,
    )
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)


@manager.post("/searches/<search_id>/completion")
@manager.post("/searches/<search_id>/completions")
@login_required
async def completion(search_id: str):
    req = await request.get_json(silent=True) or {}
    if not str(req.get("question") or "").strip():
        return get_error_argument_result("question is required.")
    success, result = await run_db_call(
        search_api_service.search_completion,
        current_user_id(),
        search_id,
        req,
    )
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)
