.PHONY: setup start stop status logs docker-services docker-ps docker-logs docker-stop api web worker health check reset-docker-data

API_URL ?= http://127.0.0.1:9380
COMPOSE_FILE ?= infra/docker-compose.yml

setup:
	test -f .env || cp .env.example .env
	uv sync
	cd web && npm install

start:
	COMPOSE_FILE=$(COMPOSE_FILE) ./scripts/start.sh

stop:
	COMPOSE_FILE=$(COMPOSE_FILE) ./scripts/stop.sh

status:
	COMPOSE_FILE=$(COMPOSE_FILE) ./scripts/status.sh

logs:
	./scripts/logs.sh

docker-services:
	docker compose -f $(COMPOSE_FILE) up -d

docker-ps:
	docker compose -f $(COMPOSE_FILE) ps

docker-logs:
	docker compose -f $(COMPOSE_FILE) logs --tail=80

docker-stop:
	docker compose -f $(COMPOSE_FILE) stop

api:
	./scripts/api.sh

web:
	./scripts/web.sh

worker:
	./scripts/worker.sh

health:
	curl -i $(API_URL)/api/v1/system/healthz

check:
	uv run python -m compileall api common rag
	uv run --extra dev ruff check api common rag
	uv run --extra dev pytest test
	cd web && npm run build

reset-docker-data:
	docker compose -f $(COMPOSE_FILE) down -v
