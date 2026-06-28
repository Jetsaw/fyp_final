#!/usr/bin/env bash
set -euo pipefail

PUBLIC_URL="${1:-}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "Hive deployment evidence"
echo "Generated: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "Root: $ROOT"
echo

echo "Backend local health:"
curl -fsS http://127.0.0.1:8000/api/health || true
echo
echo

echo "Caddy local health:"
curl -fsS http://127.0.0.1:8080/api/health || true
echo
echo

if [ -n "$PUBLIC_URL" ]; then
  echo "Public health:"
  curl -fsS "$PUBLIC_URL/api/health" || true
  echo
  echo

  echo "Public smoke test:"
  bash "$ROOT/deploy/macmini/smoke-test.sh" "$PUBLIC_URL" || true
else
  echo "Public health: skipped, pass https://your-domain as first argument"
fi
echo

echo "Backend launchd status:"
launchctl print "gui/$(id -u)/com.hive.backend" 2>/dev/null | sed -n '1,40p' || true
echo

echo "Caddy status:"
brew services list 2>/dev/null | grep -E '^caddy[[:space:]]' || true
echo

echo "Cloudflare tunnel status:"
sudo -n launchctl print system/com.cloudflare.cloudflared 2>/dev/null | sed -n '1,40p' || true
