from typing import Any

from api.db.services import (
    KnowledgebaseNotFound,
    KnowledgebaseService,
    KnowledgebaseValidationError,
)


async def create_dataset(tenant_id: str, req: dict[str, Any]):
    try:
        return True, KnowledgebaseService.create(req, tenant_id)
    except KnowledgebaseValidationError as exc:
        return False, str(exc)


async def delete_datasets(tenant_id: str, ids: list[str] | None = None, delete_all: bool = False):
    if ids is None and not delete_all:
        return True, {"success_count": 0}
    try:
        KnowledgebaseService.delete_many(ids or [], tenant_id)
        return True, {"success_count": len(ids or [])}
    except KnowledgebaseNotFound as exc:
        return False, f"User '{tenant_id}' lacks permission for datasets: '{exc}'"


def list_datasets(tenant_id: str, args: dict[str, Any]):
    try:
        return True, {"data": KnowledgebaseService.list(tenant_id), "total": 0}
    except KnowledgebaseValidationError as exc:
        return False, str(exc)


def get_dataset(dataset_id: str, tenant_id: str):
    try:
        return True, KnowledgebaseService.get(dataset_id, tenant_id)
    except KnowledgebaseNotFound:
        return False, f"User '{tenant_id}' lacks permission for dataset '{dataset_id}'"


async def update_dataset(tenant_id: str, dataset_id: str, req: dict[str, Any]):
    try:
        return True, KnowledgebaseService.update(dataset_id, req, tenant_id)
    except KnowledgebaseValidationError as exc:
        return False, str(exc)
    except KnowledgebaseNotFound:
        return False, f"User '{tenant_id}' lacks permission for dataset '{dataset_id}'"
