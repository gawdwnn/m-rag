#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

LOG_DIR="${LOG_DIR:-.run/logs}"

if [ ! -d "$LOG_DIR" ]; then
  echo "No log directory found at $LOG_DIR"
  exit 0
fi

tail -n 80 "$LOG_DIR"/api.log "$LOG_DIR"/worker.log "$LOG_DIR"/web.log 2>/dev/null || true
