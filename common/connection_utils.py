from typing import Any

from quart import jsonify, make_response


async def construct_response(
    code: int = 0,
    message: str = "success",
    data: Any = None,
    auth: str | None = None,
):
    result = {"code": code, "message": message, "data": data}
    response = await make_response(
        jsonify({key: value for key, value in result.items() if value is not None or key == "code"})
    )
    if auth:
        response.headers["Authorization"] = auth
    response.headers["Access-Control-Expose-Headers"] = "Authorization"
    return response
