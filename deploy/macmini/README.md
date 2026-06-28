# Hive Mac Mini Public Hosting Guide

This guide moves the project from Windows or GitHub to a Mac mini and exposes it publicly at `https://hive.yourdomain.com`.

Recommended setup:

- Existing website stays where it is.
- Add a link/button from the website to `https://hive.yourdomain.com`.
- Mac mini runs the Hive backend on `127.0.0.1:8000`.
- Caddy serves the frontend on local port `8080`.
- Cloudflare Tunnel exposes local Caddy to the public internet.

Do not expose FastAPI port `8000` directly.

## 1. Prepare The Mac Mini

On the Mac mini:

```bash
xcode-select --install
```

Install Homebrew if missing, then:

```bash
brew install python@3.11 node caddy cloudflared ffmpeg
```

Disable sleep for a server-style setup:

```bash
sudo pmset -a sleep 0
```

Enable SSH:

```text
System Settings -> General -> Sharing -> Remote Login -> On
```

Find the Mac IP:

```bash
ipconfig getifaddr en0
```

If you do not know the Mac IP, scan from Windows after enabling Remote Login on the Mac:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years"
powershell -ExecutionPolicy Bypass -File ".\deploy\macmini\find-ssh-hosts.ps1"
```

## 2. Get The Project Onto The Mac

If the clean GitHub repository is ready, clone it on the Mac:

```bash
git clone git@github.com:Jetsaw/fyp_final.git ~/hive
```

To create the clean GitHub copy on Windows, run `deploy/windows/prepare-github-clean-copy.ps1`.

If GitHub is not ready, package it from Windows instead:

From Windows PowerShell:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years"
powershell -ExecutionPolicy Bypass -File ".\deploy\macmini\pack-for-mac.ps1"
```

This creates:

```text
C:\Users\jeysa\Desktop\hive-project.tar.gz
```

It intentionally excludes `.env`, `.env.*`, `node_modules`, virtualenvs, caches, logs, and `.git`.

## 3. Copy Windows Tarball To The Mac Mini

Replace `macuser` and `192.168.1.50`:

```powershell
scp "$env:USERPROFILE\Desktop\hive-project.tar.gz" macuser@192.168.1.50:~/hive-project.tar.gz
```

On the Mac mini:

```bash
rm -rf ~/hive
mkdir -p ~/hive
tar -xzf ~/hive-project.tar.gz -C ~/hive
```

Fast path from Windows, replacing the same values:

Preflight first:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years"
powershell -ExecutionPolicy Bypass -File ".\deploy\macmini\deploy-to-mac.ps1" `
  -MacUser "macuser" `
  -MacHost "192.168.1.50" `
  -PreflightOnly
```

Then deploy:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years"
powershell -ExecutionPolicy Bypass -File ".\deploy\macmini\deploy-to-mac.ps1" `
  -MacUser "macuser" `
  -MacHost "192.168.1.50" `
  -Domain "hive.yourdomain.com" `
  -InstallServices
```

Use the manual steps below if the fast path stops because Homebrew, SSH, or sudo is not ready yet.

## 4. Install The App On The Mac Mini

Replace the domain:

```bash
cd ~/hive
bash deploy/macmini/install-macmini.sh hive.yourdomain.com
```

This builds `frontend/dist`, creates `hive-backend/.venv`, installs backend dependencies, and creates a safe RAG-only `.env` if one is missing.

## 5. Test Backend Locally

```bash
cd ~/hive/hive-backend
source .venv/bin/activate
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In another terminal:

```bash
bash ~/hive/deploy/macmini/smoke-test.sh
```

Stop the manual backend with `Ctrl+C` after the smoke test passes.

## 6. Install Backend As A Login Service

Run:

```bash
bash ~/hive/deploy/macmini/install-services.sh
```

Check it:

```bash
curl http://127.0.0.1:8000/api/health
tail -80 ~/Library/Logs/hive-backend.err.log
```

## 7. Check Local Frontend

Check it:

```bash
curl http://127.0.0.1:8080/api/health
open http://127.0.0.1:8080
```

## 8. Expose Publicly With Cloudflare Tunnel

Cloudflare requirements:

- Your domain is managed in Cloudflare.
- You can create DNS records.

Login once:

```bash
cloudflared tunnel login
```

Then run:

```bash
bash ~/hive/deploy/macmini/setup-cloudflare-tunnel.sh hive.yourdomain.com
```

Open:

```text
https://hive.yourdomain.com
```

Check service status:

```bash
bash ~/hive/deploy/macmini/status.sh https://hive.yourdomain.com
```

## 9. Final Public Smoke Test

```bash
bash ~/hive/deploy/macmini/smoke-test.sh https://hive.yourdomain.com
```

Browser checks:

- `https://hive.yourdomain.com` loads.
- Chat answers an Intelligent Robotics question.
- Avatar/video assets load.
- Voice input works. Voice needs HTTPS, so test through the public domain.
- Mac mini reboot still brings the app back.

## 10. Add Link From Existing Website

Add one link/button to your current website:

```html
<a href="https://hive.yourdomain.com">Open Hive Academic Advisor</a>
```

## Rollback

Disable public access:

```bash
sudo launchctl bootout system/com.cloudflare.cloudflared
```

Stop backend:

```bash
launchctl bootout "gui/$(id -u)" ~/Library/LaunchAgents/com.hive.backend.plist
```

The existing website is unaffected because Hive is hosted on a separate subdomain.
