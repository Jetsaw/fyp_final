#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BREW_PREFIX="$(brew --prefix)"

cp "$ROOT/deploy/macmini/com.hive.backend.plist" "$HOME/Library/LaunchAgents/com.hive.backend.plist"
sed -i '' "s/YOUR_MAC_USER/$USER/g" "$HOME/Library/LaunchAgents/com.hive.backend.plist"
mkdir -p "$HOME/Library/Logs"

launchctl bootout "gui/$(id -u)" "$HOME/Library/LaunchAgents/com.hive.backend.plist" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$HOME/Library/LaunchAgents/com.hive.backend.plist"
launchctl enable "gui/$(id -u)/com.hive.backend"
launchctl kickstart -k "gui/$(id -u)/com.hive.backend"

sudo cp "$ROOT/deploy/macmini/Caddyfile" "$BREW_PREFIX/etc/Caddyfile"
sudo sed -i '' "s/YOUR_MAC_USER/$USER/g" "$BREW_PREFIX/etc/Caddyfile"
brew services restart caddy

echo "Installed backend launchd service and Caddy."

