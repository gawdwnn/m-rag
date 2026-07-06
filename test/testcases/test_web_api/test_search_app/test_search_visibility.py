import pytest

from api.apps.services import search_api_service
from api.db.services import search_service
from api.db.services.knowledgebase_service import KnowledgebaseNotFound


def test_effective_owner_ids_defaults_to_visible_tenants(monkeypatch):
    monkeypatch.setattr(
        search_service.UserTenantService,
        "get_visible_tenant_ids",
        lambda user_id: [user_id, "team-tenant-2"],
    )

    owner_ids = search_service._effective_owner_ids("tenant-1")

    assert set(owner_ids) == {"tenant-1", "team-tenant-2"}


def test_effective_owner_ids_rejects_unauthorized_owner_ids(monkeypatch):
    monkeypatch.setattr(
        search_service.UserTenantService,
        "get_visible_tenant_ids",
        lambda user_id: [user_id, "team-tenant-2"],
    )

    with pytest.raises(search_service.SearchValidationError, match="authorized owner_ids"):
        search_service._effective_owner_ids("tenant-1", ["foreign-tenant"])


def test_search_config_validates_dataset_binding_against_visible_knowledgebases(monkeypatch):
    calls = []

    def get_record(kb_id, user_id):
        calls.append((kb_id, user_id))
        if kb_id == "private-kb":
            raise KnowledgebaseNotFound(kb_id)
        return object()

    monkeypatch.setattr(search_service.KnowledgebaseService, "get_record", get_record)

    normalized = search_service._normalize_search_config(
        {"kb_ids": ["team-kb"], "top_k": 12},
        user_id="user-b",
    )

    assert normalized["kb_ids"] == ["team-kb"]
    assert normalized["top_k"] == 12
    assert calls == [("team-kb", "user-b")]

    with pytest.raises(KnowledgebaseNotFound):
        search_service._normalize_search_config(
            {"kb_ids": ["private-kb"]},
            user_id="user-b",
        )


def test_search_completion_requires_owner_permission_before_retrieval(monkeypatch):
    def fail_if_called(*args, **kwargs):
        raise AssertionError("completion should stop before detail or retrieval")

    monkeypatch.setattr(
        search_api_service.SearchService,
        "accessible4deletion",
        lambda search_id, user_id: False,
    )
    monkeypatch.setattr(search_api_service.SearchService, "get_detail", fail_if_called)
    monkeypatch.setattr(search_api_service.dataset_api_service, "search_datasets", fail_if_called)

    success, result = search_api_service.search_completion(
        "user-b",
        "owner-search",
        {"question": "visibility"},
    )

    assert success is False
    assert result == "No authorization."


def test_search_update_and_delete_report_no_authorization_for_non_owner(monkeypatch):
    def raise_not_found(*args, **kwargs):
        raise search_api_service.SearchNotFound("owner-search")

    monkeypatch.setattr(search_api_service.SearchService, "update", raise_not_found)
    monkeypatch.setattr(search_api_service.SearchService, "delete", raise_not_found)

    update_success, update_result = search_api_service.update_search(
        "user-b",
        "owner-search",
        {"name": "Should Not Update", "search_config": {}},
    )
    delete_success, delete_result = search_api_service.delete_search("user-b", "owner-search")

    assert update_success is False
    assert update_result == "owner-search"
    assert delete_success is False
    assert delete_result == "No authorization."
