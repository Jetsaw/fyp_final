#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${1:-hive.yourdomain.com}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PYTHON_BIN="$(command -v python3.11 || command -v python3)"

cd "$ROOT/frontend"
npm ci
VITE_API_BASE="" npm run build

cd "$ROOT/hive-backend"
"$PYTHON_BIN" -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt

if [ ! -f .env ]; then
  cp "$ROOT/deploy/macmini/hive-backend.env.example" .env
  sed -i '' "s/hive.yourdomain.com/$DOMAIN/g" .env
fi

echo "Installed Hive under $ROOT"
echo "Backend env: $ROOT/hive-backend/.env"
echo "Frontend build: $ROOT/frontend/dist"

