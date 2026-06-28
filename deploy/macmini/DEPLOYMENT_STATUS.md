# Hive Mac Mini Deployment Status

## Current State

The Windows workspace is packaged for Mac mini deployment. If the GitHub push path is used, the Mac mini can instead clone `git@github.com:Jetsaw/fyp_final.git` into `~/hive`.

Transfer archive:

```text
C:\Users\jeysa\Desktop\hive-project.tar.gz
```

The archive excludes:

- `.env`
- `.env.*`
- `.git`
- `.venv`
- `node_modules`
- logs
- Python cache files

## Included Deployment Tools

- `pack-for-mac.ps1`: creates the clean transfer archive on Windows.
- `deploy-to-mac.ps1`: copies the archive to the Mac mini and runs install steps over SSH.
- `find-ssh-hosts.ps1`: scans the local Windows LAN for SSH hosts when the Mac IP is unknown.
- `preflight-macmini.sh`: checks Mac dependencies before deployment.
- `install-macmini.sh`: builds frontend and installs backend Python dependencies.
- `install-services.sh`: installs backend `launchd` service and Caddy.
- `setup-cloudflare-tunnel.sh`: creates/routes/installs Cloudflare Tunnel after login.
- `status.sh`: checks backend, Caddy, public health, and logs.
- `smoke-test.sh`: checks `/api/health` and a real `/ask` answer.
- `collect-evidence.sh`: prints the local, public, and service evidence to report back.
- `deploy/windows/prepare-github-clean-copy.ps1`: creates a safe clean copy for GitHub push.

## Fast Path Commands

From Windows:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years"

powershell -ExecutionPolicy Bypass -File ".\deploy\macmini\deploy-to-mac.ps1" `
  -MacUser "macuser" `
  -MacHost "192.168.1.50" `
  -PreflightOnly
```

Then:

```powershell
powershell -ExecutionPolicy Bypass -File ".\deploy\macmini\deploy-to-mac.ps1" `
  -MacUser "macuser" `
  -MacHost "192.168.1.50" `
  -Domain "hive.yourdomain.com" `
  -InstallServices
```

On the Mac mini:

```bash
cloudflared tunnel login
bash ~/hive/deploy/macmini/setup-cloudflare-tunnel.sh hive.yourdomain.com
bash ~/hive/deploy/macmini/status.sh https://hive.yourdomain.com
bash ~/hive/deploy/macmini/collect-evidence.sh https://hive.yourdomain.com
```

## Required External Inputs

Actual public deployment still needs:

- Mac mini SSH username.
- Mac mini LAN IP or hostname.
- Public subdomain, for example `hive.yourdomain.com`.
- Cloudflare account login for the domain.

## Completion Evidence Needed

The deployment is complete only when these pass:

```bash
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1:8080/api/health
curl https://hive.yourdomain.com/api/health
bash ~/hive/deploy/macmini/smoke-test.sh https://hive.yourdomain.com
```

And browser checks pass:

- Public page loads.
- Chat answers a real course question.
- Avatar/video assets load.
- Voice input works over HTTPS.
- Mac mini reboot keeps backend, Caddy, and tunnel alive.
