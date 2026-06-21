#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-infra/docker-compose.yml}"
RUN_DIR="${RUN_DIR:-.run}"
LOG_DIR="${LOG_DIR:-$RUN_DIR/logs}"
API_PID="${API_PID:-$RUN_DIR/api.pid}"
WORKER_PID="${WORKER_PID:-$RUN_DIR/worker.pid}"
WEB_PID="${WEB_PID:-$RUN_DIR/web.pid}"

# shellcheck source=scripts/env.sh
. "$ROOT_DIR/scripts/env.sh"
load_m_ragflow_env "$ROOT_DIR"

mkdir -p "$LOG_DIR"

docker compose -f "$COMPOSE_FILE" up -d --wait

start_process() {
  local name="$1"
  local pid_file="$2"
  local log_file="$3"
  shift 3

  if [ -s "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    echo "$name already running with PID $(cat "$pid_file")"
    return
  fi

  nohup "$@" >"$log_file" 2>&1 &
  echo "$!" >"$pid_file"
  echo "Started $name with PID $(cat "$pid_file"); log: $log_file"
}

start_process "API" "$API_PID" "$LOG_DIR/api.log" "$ROOT_DIR/scripts/api.sh"
start_process "worker" "$WORKER_PID" "$LOG_DIR/worker.log" "$ROOT_DIR/scripts/worker.sh"
start_process "web" "$WEB_PID" "$LOG_DIR/web.log" "$ROOT_DIR/scripts/web.sh"

echo "m-ragflow starting. Open http://127.0.0.1:9222 after the web log shows Vite is ready."
