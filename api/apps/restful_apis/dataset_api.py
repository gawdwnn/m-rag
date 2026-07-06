from quart import Blueprint, request

from api.apps import current_user_id, login_required
from api.apps.services import dataset_api_service
from api.utils.api_utils import (
    get_error_argument_result,
    get_error_data_result,
    get_result,
    run_db_call,
)

manager = Blueprint("dataset_api", __name__)


@manager.get("/datasets")
@login_required
async def list_datasets():
    args = dict(request.args)
    success, result = await run_db_call(dataset_api_service.list_datasets, current_user_id(), args)
    if success:
        return get_result(data=result["data"])
    return get_error_data_result(message=result)


@manager.post("/datasets")
@login_required
async def create():
    req = await request.get_json(silent=True) or {}
    success, result = await dataset_api_service.create_dataset(current_user_id(), req)
    if success:
        return get_result(data=result), 201
    return get_error_data_result(message=result)


@manager.post("/datasets/search")
@login_required
async def search_datasets():
    req = await request.get_json(silent=True) or {}
    if (
        not str(req.get("search_id") or "").strip()
        and (not isinstance(req.get("dataset_ids"), list) or not req.get("dataset_ids"))
    ):
        return get_error_argument_result("dataset_ids is required.")
    if not str(req.get("question") or "").strip():
        return get_error_argument_result("question is required.")

    success, result = await run_db_call(
        dataset_api_service.search_datasets,
        current_user_id(),
        req,
    )
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)


@manager.post("/datasets/<dataset_id>/search")
@login_required
async def search(dataset_id: str):
    req = await request.get_json(silent=True) or {}
    if not str(req.get("question") or "").strip():
        return get_error_argument_result("question is required.")
    req["dataset_ids"] = [dataset_id]

    success, result = await run_db_call(
        dataset_api_service.search_datasets,
        current_user_id(),
        req,
    )
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)


@manager.get("/datasets/<dataset_id>")
@login_required
async def get(dataset_id: str):
    success, result = await run_db_call(
        dataset_api_service.get_dataset,
        dataset_id,
        current_user_id(),
    )
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)


@manager.put("/datasets/<dataset_id>")
@login_required
async def update(dataset_id: str):
    req = await request.get_json(silent=True) or {}
    success, result = await dataset_api_service.update_dataset(current_user_id(), dataset_id, req)
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)


@manager.delete("/datasets")
@login_required
async def delete():
    req = await request.get_json(silent=True) or {}
    success, result = await dataset_api_service.delete_datasets(
        current_user_id(),
        req.get("ids"),
        req.get("delete_all", False),
    )
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)
