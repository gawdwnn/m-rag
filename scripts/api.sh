#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# shellcheck source=scripts/env.sh
. "$ROOT_DIR/scripts/env.sh"
load_rag_env "$ROOT_DIR"

API_HOST="${RAG_API_HOST:-127.0.0.1}"
API_PORT="${RAG_API_PORT:-9380}"

exec uv run hypercorn api.app:app --bind "$API_HOST:$API_PORT"
