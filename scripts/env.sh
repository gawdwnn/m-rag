#!/usr/bin/env bash

load_m_ragflow_env() {
  local root_dir="$1"
  local env_file="$root_dir/.env"

  if [ -f "$env_file" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$env_file"
    set +a
  fi
}
