#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-infra/docker-compose.yml}"
RUN_DIR="${RUN_DIR:-.run}"
API_PID="${API_PID:-$RUN_DIR/api.pid}"
WORKER_PID="${WORKER_PID:-$RUN_DIR/worker.pid}"
WEB_PID="${WEB_PID:-$RUN_DIR/web.pid}"

show_process() {
  local name="$1"
  local pid_file="$2"

  if [ -s "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    echo "$name: running, PID $(cat "$pid_file")"
  else
    echo "$name: stopped"
  fi
}

if ! docker compose -f "$COMPOSE_FILE" ps; then
  echo "Docker services: unavailable"
fi
show_process "API" "$API_PID"
show_process "worker" "$WORKER_PID"
show_process "web" "$WEB_PID"
