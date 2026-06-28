#!/usr/bin/env bash
set -euo pipefail

cd "${HIVE_BACKEND_DIR:-$HOME/fyp-unsloth}"
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
