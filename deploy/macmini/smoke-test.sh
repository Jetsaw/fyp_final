#!/usr/bin/env bash
set -euo pipefail

PUBLIC_BASE="${1:-http://127.0.0.1:8080}"
BACKEND_BASE="${2:-http://127.0.0.1:8000}"

curl -fsS "$BACKEND_BASE/api/health" >/dev/null
curl -fsS "$PUBLIC_BASE/api/health" >/dev/null

curl -fsS "$PUBLIC_BASE/ask" \
  -H "Content-Type: application/json" \
  -d '{"question":"How many credit hours does Wireless Communications have?","history":[]}' \
  | python3 -c 'import json,sys; data=json.load(sys.stdin); assert "Wireless Communications" in data.get("answer",""); print(data["answer"])'

echo "Hive smoke test passed for $PUBLIC_BASE"

