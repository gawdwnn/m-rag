import mimetypes
from io import BytesIO

from quart import Blueprint, request, send_file

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


@manager.delete("/datasets/<dataset_id>/documents")
@login_required
async def delete_documents(dataset_id: str):
    payload = await request.get_json(silent=True) or {}
    success, result = await run_db_call(
        document_api_service.delete_documents,
        current_user_id(),
        dataset_id,
        payload,
    )
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)


@manager.post("/datasets/<dataset_id>/documents/batch-update-status")
@login_required
async def batch_update_document_status(dataset_id: str):
    payload = await request.get_json(silent=True) or {}
    success, result = await run_db_call(
        document_api_service.batch_update_document_status,
        current_user_id(),
        dataset_id,
        payload,
    )
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)


@manager.get("/documents/<document_id>/preview")
@login_required
async def preview_document(document_id: str):
    success, result = await run_db_call(
        document_api_service.get_document_file,
        current_user_id(),
        document_id,
    )
    if not success:
        return get_error_data_result(message=result)
    mimetype = _guess_mimetype(result["name"])
    return await send_file(
        BytesIO(result["data"]),
        mimetype=mimetype,
        attachment_filename=result["name"],
        as_attachment=False,
    )


@manager.get("/datasets/<dataset_id>/documents/<document_id>")
@login_required
async def download_dataset_document(dataset_id: str, document_id: str):
    success, result = await run_db_call(
        document_api_service.get_document_file,
        current_user_id(),
        document_id,
        dataset_id,
    )
    if not success:
        return get_error_data_result(message=result)
    return await send_file(
        BytesIO(result["data"]),
        mimetype="application/octet-stream",
        attachment_filename=result["name"],
        as_attachment=True,
    )


@manager.get("/documents/<document_id>")
@login_required
async def download_document(document_id: str):
    success, result = await run_db_call(
        document_api_service.get_document_file,
        current_user_id(),
        document_id,
    )
    if not success:
        return get_error_data_result(message=result)
    return await send_file(
        BytesIO(result["data"]),
        mimetype="application/octet-stream",
        attachment_filename=result["name"],
        as_attachment=True,
    )


def _guess_mimetype(filename: str) -> str:
    return mimetypes.guess_type(filename)[0] or "application/octet-stream"
