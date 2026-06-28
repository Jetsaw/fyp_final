#!/usr/bin/env bash
set -euo pipefail

PUBLIC_BASE="${1:-}"

echo "Backend listener:"
lsof -nP -iTCP:8000 -sTCP:LISTEN || true

echo
echo "Caddy listener:"
lsof -nP -iTCP:8080 -sTCP:LISTEN || true

echo
echo "Backend health:"
curl -fsS http://127.0.0.1:8000/api/health && echo

echo
echo "Local Caddy health:"
curl -fsS http://127.0.0.1:8080/api/health && echo

if [ -n "$PUBLIC_BASE" ]; then
  echo
  echo "Public health:"
  curl -fsS "$PUBLIC_BASE/api/health" && echo
fi

echo
echo "Backend logs:"
tail -40 "$HOME/Library/Logs/hive-backend.err.log" 2>/dev/null || true

