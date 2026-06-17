from api.storage import get_storage

STORAGE_IMPL = get_storage()


def get_secret_key() -> str:
    from api.config import load_api_config

    return load_api_config().secret_key
