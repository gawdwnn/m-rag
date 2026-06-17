#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-infra/docker-compose.yml}"
RUN_DIR="${RUN_DIR:-.run}"
API_PID="${API_PID:-$RUN_DIR/api.pid}"
WORKER_PID="${WORKER_PID:-$RUN_DIR/worker.pid}"
WEB_PID="${WEB_PID:-$RUN_DIR/web.pid}"

stop_pid_file() {
  local pid_file="$1"

  if [ ! -s "$pid_file" ]; then
    return
  fi

  local pid
  pid="$(cat "$pid_file")"
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    echo "Stopped PID $pid from $pid_file"
  fi
  rm -f "$pid_file"
}

stop_pid_file "$WEB_PID"
stop_pid_file "$WORKER_PID"
stop_pid_file "$API_PID"

pids="$(lsof -ti tcp:9380 -ti tcp:9222 2>/dev/null || true)"
if [ -n "$pids" ]; then
  kill $pids 2>/dev/null || true
  echo "Stopped processes still bound to ports 9380/9222"
fi

if ! docker compose -f "$COMPOSE_FILE" stop; then
  echo "Docker services were not stopped because Docker is unavailable." >&2
fi
