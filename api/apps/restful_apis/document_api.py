from quart import Blueprint, request

from api.apps import current_user_id, login_required
from api.apps.services import document_api_service
from api.utils.api_utils import get_error_data_result, get_result, run_db_call

manager = Blueprint("document_api", __name__)


@manager.get("/datasets/<dataset_id>/documents")
@login_required
async def list_documents(dataset_id: str):
    success, result = await run_db_call(
        document_api_service.list_documents,
        current_user_id(),
        dataset_id,
        dict(request.args),
    )
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)


@manager.post("/datasets/<dataset_id>/documents")
@login_required
async def upload_documents(dataset_id: str):
    files = await request.files
    if "file" not in files:
        return get_error_data_result(message="No file part!")

    file_objs = files.getlist("file")
    if not file_objs:
        return get_error_data_result(message="No file selected!")

    success, result = await run_db_call(
        document_api_service.upload_documents,
        current_user_id(),
        dataset_id,
        file_objs,
    )
    if success:
        return get_result(data=result), 201
    return get_error_data_result(message=result)


@manager.post("/documents/ingest")
@login_required
async def ingest_documents():
    payload = await request.get_json(silent=True) or {}
    success, result = await run_db_call(
        document_api_service.ingest_documents,
        current_user_id(),
        payload,
    )
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)


@manager.post("/datasets/<dataset_id>/documents/parse")
@login_required
async def parse_documents(dataset_id: str):
    payload = await request.get_json(silent=True) or {}
    success, result = await run_db_call(
        document_api_service.parse_documents,
        current_user_id(),
        dataset_id,
        payload,
    )
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)


@manager.post("/datasets/<dataset_id>/documents/stop")
@login_required
async def stop_parse_documents(dataset_id: str):
    payload = await request.get_json(silent=True) or {}
    success, result = await run_db_call(
        document_api_service.stop_parse_documents,
        current_user_id(),
        dataset_id,
        payload,
    )
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)
