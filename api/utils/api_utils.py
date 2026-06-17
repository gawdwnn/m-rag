import asyncio
from collections.abc import Callable
from typing import Any, TypeVar

from quart import jsonify

T = TypeVar("T")


async def run_db_call(func: Callable[..., T], *args: Any) -> T:
    return await asyncio.to_thread(func, *args)


def get_result(data: Any = None, code: int = 0, message: str = "success"):
    return jsonify({"code": code, "data": data, "message": message})


def get_json_result(data: Any = None, code: int = 0, message: str = "success"):
    return get_result(data=data, code=code, message=message)


def get_error_argument_result(message: str):
    return jsonify({"code": 100, "data": False, "message": message, "error": message}), 400


def get_error_data_result(message: str):
    return jsonify({"code": 101, "data": False, "message": message, "error": message}), 400
