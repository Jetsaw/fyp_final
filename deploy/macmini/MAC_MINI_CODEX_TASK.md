# Mac Mini Codex Task: Deploy Hive Publicly

You are Codex running on the Mac mini. Your job is to deploy Hive from `~/hive` and expose it publicly.

Expected public URL:

```text
https://hive.yourdomain.com
```

Replace `hive.yourdomain.com` with the real subdomain before running public setup.

## Current Expected Files

The project must exist here:

```bash
~/hive
```

It can arrive either way:

```bash
# GitHub path
git clone git@github.com:Jetsaw/fyp_final.git ~/hive

# Tarball path, if Windows copied ~/hive-project.tar.gz
rm -rf ~/hive
mkdir -p ~/hive
tar -xzf ~/hive-project.tar.gz -C ~/hive
```

Important files:

```bash
~/hive/frontend
~/hive/hive-backend
~/hive/deploy/macmini/preflight-macmini.sh
~/hive/deploy/macmini/install-macmini.sh
~/hive/deploy/macmini/install-services.sh
~/hive/deploy/macmini/setup-cloudflare-tunnel.sh
~/hive/deploy/macmini/status.sh
~/hive/deploy/macmini/smoke-test.sh
~/hive/deploy/macmini/collect-evidence.sh
```

## Rules

- Do not expose FastAPI port `8000` to the internet.
- Keep backend bound to `127.0.0.1:8000`.
- Caddy serves frontend locally on `127.0.0.1:8080`.
- Cloudflare Tunnel exposes Caddy, not FastAPI.
- Use RAG-only first: `USE_LLM=false`.
- Do not copy or reuse the Windows `.env` API key.

## Step 1: Preflight

Run:

```bash
bash ~/hive/deploy/macmini/preflight-macmini.sh
```

If tools are missing, install:

```bash
brew install python@3.11 node caddy cloudflared
```

Also prevent sleep:

```bash
sudo pmset -a sleep 0
```

## Step 2: Install App

Set the real domain:

```bash
DOMAIN="hive.yourdomain.com"
```

Run:

```bash
cd ~/hive
bash deploy/macmini/install-macmini.sh "$DOMAIN"
```

This must:

- run `npm ci`
- build `frontend/dist`
- create `hive-backend/.venv`
- install backend Python requirements
- create safe backend `.env` if missing

## Step 3: Install Local Services

Run:

```bash
bash ~/hive/deploy/macmini/install-services.sh
```

This must:

- install backend as `launchd` user service `com.hive.backend`
- install Caddy config
- start/restart Caddy

Check local health:

```bash
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1:8080/api/health
```

Run local smoke test:

```bash
bash ~/hive/deploy/macmini/smoke-test.sh
```

## Step 4: Cloudflare Tunnel

Cloudflare prerequisites:

- Domain is managed in Cloudflare.
- You can log in to Cloudflare from this Mac.

Login once:

```bash
cloudflared tunnel login
```

Then:

```bash
bash ~/hive/deploy/macmini/setup-cloudflare-tunnel.sh "$DOMAIN"
```

This must:

- create/reuse tunnel named `hive`
- route DNS for the domain
- write `~/.cloudflared/config.yml`
- install/start `cloudflared` service

## Step 5: Public Verification

Run:

```bash
bash ~/hive/deploy/macmini/status.sh "https://$DOMAIN"
bash ~/hive/deploy/macmini/smoke-test.sh "https://$DOMAIN"
bash ~/hive/deploy/macmini/collect-evidence.sh "https://$DOMAIN"
```

Browser checks:

- `https://$DOMAIN` loads.
- Chat answers: `How many credit hours does Wireless Communications have?`
- Avatar/video assets load.
- Voice input works over HTTPS.

## Step 6: Reboot Verification

Reboot the Mac mini:

```bash
sudo reboot
```

After reboot, verify again:

```bash
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1:8080/api/health
curl "https://$DOMAIN/api/health"
bash ~/hive/deploy/macmini/smoke-test.sh "https://$DOMAIN"
bash ~/hive/deploy/macmini/collect-evidence.sh "https://$DOMAIN"
```

## Completion Evidence To Report Back

Report these exact results:

```text
DOMAIN=
Backend local health:
Caddy local health:
Public health:
Smoke test answer:
launchd backend status:
Caddy status:
Cloudflare tunnel status:
Reboot verification:
```

The deployment is not complete until public smoke test and reboot verification both pass.

## Useful Debug Commands

Backend logs:

```bash
tail -100 ~/Library/Logs/hive-backend.err.log
tail -100 ~/Library/Logs/hive-backend.out.log
```

Service status:

```bash
launchctl print "gui/$(id -u)/com.hive.backend"
brew services list
sudo launchctl print system/com.cloudflare.cloudflared
```

Ports:

```bash
lsof -nP -iTCP:8000 -sTCP:LISTEN
lsof -nP -iTCP:8080 -sTCP:LISTEN
```

Rollback:

```bash
launchctl bootout "gui/$(id -u)" ~/Library/LaunchAgents/com.hive.backend.plist
brew services stop caddy
sudo launchctl bootout system/com.cloudflare.cloudflared
```
