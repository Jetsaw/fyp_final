#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${1:-hive.yourdomain.com}"
TUNNEL_NAME="${2:-hive}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if ! ls "$HOME/.cloudflared"/cert.pem >/dev/null 2>&1; then
  echo "Run this first on the Mac mini:"
  echo "  cloudflared tunnel login"
  exit 1
fi

cloudflared tunnel create "$TUNNEL_NAME" 2>/dev/null || true
cloudflared tunnel route dns "$TUNNEL_NAME" "$DOMAIN"

TUNNEL_ID="$(cloudflared tunnel list | awk -v name="$TUNNEL_NAME" '$2 == name { print $1; exit }')"
if [ -z "$TUNNEL_ID" ]; then
  echo "Could not find tunnel ID for $TUNNEL_NAME"
  cloudflared tunnel list
  exit 1
fi

mkdir -p "$HOME/.cloudflared"
cp "$ROOT/deploy/macmini/cloudflared-config.yml" "$HOME/.cloudflared/config.yml"
sed -i '' "s/YOUR_TUNNEL_ID/$TUNNEL_ID/g" "$HOME/.cloudflared/config.yml"
sed -i '' "s/YOUR_MAC_USER/$USER/g" "$HOME/.cloudflared/config.yml"
sed -i '' "s/hive.yourdomain.com/$DOMAIN/g" "$HOME/.cloudflared/config.yml"

sudo cloudflared service install
sudo launchctl kickstart -k system/com.cloudflare.cloudflared

echo "Cloudflare Tunnel installed for https://$DOMAIN"

