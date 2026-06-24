#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# shellcheck source=scripts/env.sh
. "$ROOT_DIR/scripts/env.sh"
load_m_ragflow_env "$ROOT_DIR"

exec uv run python rag/svr/task_executor.py
