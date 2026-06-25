#!/usr/bin/env bash

load_rag_env() {
  local root_dir="$1"
  local env_file="$root_dir/.env"
  local project_venv="$root_dir/.venv"

  export PYTHONPATH="$root_dir"

  if [ -f "$env_file" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$env_file"
    set +a
  fi

  export PYTHONPATH="$root_dir${PYTHONPATH:+:$PYTHONPATH}"

  if [ -n "${VIRTUAL_ENV:-}" ] && [ "$VIRTUAL_ENV" != "$project_venv" ]; then
    unset VIRTUAL_ENV
  fi
}
