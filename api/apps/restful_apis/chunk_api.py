from quart import Blueprint, request

from api.apps import current_user_id, login_required
from api.apps.services import chunk_api_service
from api.utils.api_utils import get_error_data_result, get_result, run_db_call

manager = Blueprint("chunk_api", __name__)


@manager.get("/datasets/<dataset_id>/documents/<document_id>/chunks")
@login_required
async def list_chunks(dataset_id: str, document_id: str):
    success, result = await run_db_call(
        chunk_api_service.list_chunks,
        current_user_id(),
        dataset_id,
        document_id,
        dict(request.args),
    )
    if success:
        return get_result(data=result)
    return get_error_data_result(message=result)
