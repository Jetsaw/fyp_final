# Mac Mini Start Here

Use this after the GitHub clone finishes on the Mac mini.

```bash
cd ~/hive
cat deploy/macmini/MAC_MINI_CODEX_TASK.md
```

Minimum command order:

```bash
bash deploy/macmini/preflight-macmini.sh
bash deploy/macmini/install-macmini.sh hive.yourdomain.com
bash deploy/macmini/install-services.sh
cloudflared tunnel login
bash deploy/macmini/setup-cloudflare-tunnel.sh hive.yourdomain.com
bash deploy/macmini/collect-evidence.sh https://hive.yourdomain.com
```

Replace `hive.yourdomain.com` with the real subdomain.

Deployment is complete only when `collect-evidence.sh` shows local health, public health, smoke test, backend service, Caddy, and Cloudflare tunnel status.
