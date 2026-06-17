from quart import Blueprint, jsonify

from api.utils.health_utils import run_health_checks

manager = Blueprint("system_api", __name__)


@manager.get("/system/healthz")
async def healthz():
    result, all_ok = run_health_checks()
    return jsonify(result), (200 if all_ok else 503)
