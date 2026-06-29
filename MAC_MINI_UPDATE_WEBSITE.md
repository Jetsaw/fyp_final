# Mac Mini Update Website Runbook

Use this on the Mac mini when Windows/GitHub has new Hive changes and the live website needs to be refreshed.

Live site:

```text
https://hive.ethosai.my
```

Expected Mac project path:

```text
~/hive
```

## 1. Go To The Live Project

```bash
cd ~/hive
pwd
git status --short
git log -1 --oneline
```

If `git status --short` shows local changes, save them before pulling:

```bash
git stash push -u -m "before-website-update-$(date +%Y%m%d-%H%M%S)"
```

Do not run `git reset --hard` unless you are sure the Mac-side changes are useless.

## 2. Pull Latest GitHub Changes

```bash
cd ~/hive
git fetch origin main
git pull --ff-only origin main
```

If this fails because of local changes, run the stash command from step 1, then run the pull again.

## 3. Rebuild And Restart

Run the full safe update when you are not sure what changed:

```bash
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

cd ~/hive/hive-backend
source .venv/bin/activate
pip install -r requirements.txt
launchctl kickstart -k "gui/$(id -u)/com.hive.backend"

cd ~/hive/frontend
npm install
npm run build
brew services restart caddy
```

For QA/knowledge/backend-only changes, this shorter update is usually enough:

```bash
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

cd ~/hive
git pull --ff-only origin main
launchctl kickstart -k "gui/$(id -u)/com.hive.backend"
```

## 4. Verify Local Website

```bash
curl -fsS http://127.0.0.1:8080/api/health
```

Expected:

```json
{"status":"ok"}
```

Test one real answer:

```bash
curl -fsS -X POST http://127.0.0.1:8080/ask \
  -H "Content-Type: application/json" \
  --data '{"question":"What are the prerequisites for Project II?"}'
```

Expected answer should mention:

```text
ARP6110-P2 Project II requires completed 60 credit hours and ARP6110-P1 Project I.
```

## 5. Verify Public Website

```bash
curl -fsS https://hive.ethosai.my/api/health
```

Expected:

```json
{"status":"ok"}
```

Public answer test:

```bash
curl -fsS -X POST https://hive.ethosai.my/ask \
  -H "Content-Type: application/json" \
  --data '{"question":"What are the prerequisites for Project II?"}'
```

## 6. Check Services If Something Fails

```bash
launchctl print "gui/$(id -u)/com.hive.backend" | head -80
launchctl print "gui/$(id -u)/homebrew.mxcl.caddy" | head -80
launchctl print "gui/$(id -u)/com.cloudflare.cloudflared.hive" | head -80

tail -80 ~/Library/Logs/hive-backend.err.log
tail -80 ~/Library/Logs/hive-backend.out.log
tail -80 /opt/homebrew/var/log/caddy.log
tail -80 ~/Library/Logs/cloudflared-hive.err.log
```

## 7. If You Used Git Stash

Only re-apply the stash if you know the Mac-side edits are still needed:

```bash
git stash list
git stash show --stat stash@{0}
```

If needed:

```bash
git stash pop
```

Then rebuild/restart again from step 3.

## Codex Task

If Codex is running on the Mac mini, give it this:

```text
Update the live Hive website from GitHub.

Work in ~/hive. First check git status and git log. If the checkout has local changes, stash them with a timestamped message before pulling. Pull origin main with --ff-only. Then run the full safe update: backend pip install, backend launchctl kickstart, frontend npm install, frontend npm run build, and brew services restart caddy.

Verify local health at http://127.0.0.1:8080/api/health, public health at https://hive.ethosai.my/api/health, and a public /ask smoke test for "What are the prerequisites for Project II?". Do not use git reset --hard.
```
