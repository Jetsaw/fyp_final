#!/usr/bin/env bash
set -euo pipefail

missing=0

check() {
  local label="$1"
  local command="$2"
  if eval "$command" >/dev/null 2>&1; then
    echo "ok: $label"
  else
    echo "missing: $label"
    missing=1
  fi
}

echo "Hive Mac mini preflight"
echo

check "Homebrew" "command -v brew"
check "Python 3.11" "command -v python3.11"
check "Node.js" "command -v node"
check "npm" "command -v npm"
check "Caddy" "command -v caddy"
check "cloudflared" "command -v cloudflared"
check "ffmpeg" "command -v ffmpeg"
check "tar" "command -v tar"
check "curl" "command -v curl"
check "launchctl" "command -v launchctl"

echo
if sudo -n true >/dev/null 2>&1; then
  echo "ok: passwordless sudo currently available"
else
  echo "info: sudo may prompt during Caddy/cloudflared service install"
fi

if [ -f "$HOME/.cloudflared/cert.pem" ]; then
  echo "ok: cloudflared is logged in"
else
  echo "info: cloudflared tunnel login still needed before public exposure"
fi

echo
if [ "$missing" -ne 0 ]; then
  echo "Install missing tools with:"
  echo "  brew install python@3.11 node caddy cloudflared ffmpeg"
  exit 1
fi

echo "Mac mini preflight passed."
