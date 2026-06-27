from elasticsearch import Elasticsearch, NotFoundError
from elasticsearch.client import IndicesClient

from api.config import load_api_config
from common.doc_store.doc_store_base import DocStoreConnection


class ESConnection(DocStoreConnection):
    def __init__(self) -> None:
        config = load_api_config()
        self.es = Elasticsearch(
            [f"http://{config.es_host}:{config.es_port}"],
            basic_auth=("elastic", config.elastic_password),
            request_timeout=60,
        )

    def create_idx(
        self,
        index_name: str,
        dataset_id: str,
        vector_size: int,
        parser_id: str | None = None,
    ):
        if self.index_exist(index_name, dataset_id):
            return True
        mappings = _mapping(vector_size)
        return IndicesClient(self.es).create(
            index=index_name,
            mappings=mappings,
            settings={"number_of_shards": 1, "number_of_replicas": 0},
        )

    def index_exist(self, index_name: str, dataset_id: str) -> bool:
        return bool(self.es.indices.exists(index=index_name))

    def insert(
        self,
        documents: list[dict],
        index_name: str,
        dataset_id: str | None = None,
    ) -> list[str]:
        operations = []
        for document in documents:
            assert "_id" not in document
            assert "id" in document
            source = dict(document)
            source["kb_id"] = dataset_id
            operations.append({"index": {"_index": index_name, "_id": source["id"]}})
            operations.append(source)

        if not operations:
            return []

        response = self.es.bulk(index=index_name, operations=operations, refresh="wait_for")
        if not response.get("errors"):
            return []

        errors: list[str] = []
        for item in response.get("items", []):
            for action in ["create", "delete", "index", "update"]:
                if action in item and "error" in item[action]:
                    errors.append(f"{item[action].get('_id')}:{item[action]['error']}")
        return errors

    def delete(self, condition: dict, index_name: str, dataset_id: str) -> int:
        doc_id = condition.get("doc_id")
        if doc_id is not None:
            query: dict = {"term": {"doc_id": doc_id}}
            response = self.es.delete_by_query(
                index=index_name,
                query=query,
                refresh=True,
                conflicts="proceed",
                ignore_unavailable=True,
            )
            return int(response.get("deleted") or 0)

        ids = condition.get("id")
        if ids is None:
            return 0
        if isinstance(ids, str):
            ids = [ids]
        deleted = 0
        for chunk_id in ids:
            try:
                self.es.delete(index=index_name, id=chunk_id, refresh=True)
                deleted += 1
            except NotFoundError:
                continue
        return deleted

    def get(self, chunk_id: str, index_name: str, dataset_ids: list[str]) -> dict | None:
        try:
            response = self.es.get(index=index_name, id=chunk_id, source=True)
        except NotFoundError:
            return None

        source = response.get("_source") or {}
        if dataset_ids and source.get("kb_id") not in dataset_ids:
            return None
        return {"id": response.get("_id"), **source}

    def list_chunks(
        self,
        doc_id: str,
        index_name: str,
        dataset_id: str,
        page: int = 1,
        page_size: int = 30,
    ) -> tuple[int, list[dict]]:
        if not self.index_exist(index_name, dataset_id):
            return 0, []

        page = max(int(page or 1), 1)
        page_size = max(min(int(page_size or 30), 200), 1)
        response = self.es.search(
            index=index_name,
            query={
                "bool": {
                    "filter": [
                        {"term": {"doc_id": doc_id}},
                        {"term": {"kb_id": dataset_id}},
                    ]
                }
            },
            sort=[
                {"chunk_order_int": {"order": "asc", "unmapped_type": "integer"}},
                {"create_timestamp_flt": {"order": "asc", "unmapped_type": "float"}},
            ],
            from_=(page - 1) * page_size,
            size=page_size,
            track_total_hits=True,
        )
        total = response.get("hits", {}).get("total", 0)
        if isinstance(total, dict):
            total = int(total.get("value") or 0)
        chunks = [
            {"id": hit.get("_id"), **(hit.get("_source") or {})}
            for hit in response.get("hits", {}).get("hits", [])
        ]
        return int(total or 0), chunks

    def search(
        self,
        index_names: list[str],
        dataset_ids: list[str],
        query_vector: list[float],
        vector_field: str,
        top: int,
        doc_ids: list[str] | None = None,
    ) -> tuple[int, list[dict]]:
        existing_indexes = [
            index_name
            for index_name in index_names
            if self.index_exist(index_name, dataset_ids[0] if dataset_ids else "")
        ]
        if not existing_indexes:
            return 0, []

        filters: list[dict] = [
            {"terms": {"kb_id": dataset_ids}},
            {"term": {"available_int": 1}},
            {"exists": {"field": vector_field}},
        ]
        if doc_ids:
            filters.append({"terms": {"doc_id": doc_ids}})

        response = self.es.search(
            index=existing_indexes,
            query={
                "script_score": {
                    "query": {"bool": {"filter": filters}},
                    "script": {
                        "source": f"cosineSimilarity(params.query_vector, '{vector_field}') + 1.0",
                        "params": {"query_vector": query_vector},
                    },
                }
            },
            size=max(int(top or 1), 1),
            track_total_hits=True,
        )

        total = response.get("hits", {}).get("total", 0)
        if isinstance(total, dict):
            total = int(total.get("value") or 0)

        chunks = [
            {
                "id": hit.get("_id"),
                "_score": float(hit.get("_score") or 0),
                **(hit.get("_source") or {}),
            }
            for hit in response.get("hits", {}).get("hits", [])
        ]
        return int(total or 0), chunks


def _mapping(vector_size: int) -> dict:
    vector_name = f"q_{vector_size}_vec"
    return {
        "properties": {
            "id": {"type": "keyword"},
            "doc_id": {"type": "keyword"},
            "kb_id": {"type": "keyword"},
            "mom_id": {"type": "keyword"},
            "docnm_kwd": {"type": "keyword"},
            "name_kwd": {"type": "keyword"},
            "tag_kwd": {"type": "keyword"},
            "important_kwd": {"type": "keyword"},
            "question_kwd": {"type": "keyword"},
            "doc_type_kwd": {"type": "keyword"},
            "row_id": {"type": "keyword"},
            "content_with_weight": {"type": "text"},
            "content_ltks": {"type": "text"},
            "content_sm_ltks": {"type": "text"},
            "mom_with_weight": {"type": "text"},
            "question_tks": {"type": "text"},
            "important_tks": {"type": "text"},
            "title_tks": {"type": "text"},
            "title_sm_tks": {"type": "text"},
            "available_int": {"type": "integer"},
            "chunk_order_int": {"type": "integer"},
            "page_num_int": {"type": "integer"},
            "position_int": {"type": "integer"},
            "top_int": {"type": "integer"},
            "create_timestamp_flt": {"type": "float"},
            vector_name: {
                "type": "dense_vector",
                "dims": vector_size,
                "index": True,
                "similarity": "cosine",
            },
        }
    }
