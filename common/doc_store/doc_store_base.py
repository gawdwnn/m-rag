from abc import ABC, abstractmethod


class DocStoreConnection(ABC):
    @abstractmethod
    def create_idx(
        self,
        index_name: str,
        dataset_id: str,
        vector_size: int,
        parser_id: str | None = None,
    ):
        raise NotImplementedError

    @abstractmethod
    def index_exist(self, index_name: str, dataset_id: str) -> bool:
        raise NotImplementedError

    @abstractmethod
    def insert(
        self,
        documents: list[dict],
        index_name: str,
        dataset_id: str | None = None,
    ) -> list[str]:
        raise NotImplementedError

    @abstractmethod
    def delete(self, condition: dict, index_name: str, dataset_id: str) -> int:
        raise NotImplementedError

    @abstractmethod
    def get(self, chunk_id: str, index_name: str, dataset_ids: list[str]) -> dict | None:
        raise NotImplementedError

    @abstractmethod
    def list_chunks(
        self,
        doc_id: str,
        index_name: str,
        dataset_id: str,
        page: int = 1,
        page_size: int = 30,
    ) -> tuple[int, list[dict]]:
        raise NotImplementedError

    @abstractmethod
    def search(
        self,
        index_names: list[str],
        dataset_ids: list[str],
        query_vector: list[float],
        vector_field: str,
        top: int,
        doc_ids: list[str] | None = None,
    ) -> tuple[int, list[dict]]:
        raise NotImplementedError
