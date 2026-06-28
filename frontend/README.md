# Hive Kiosk Frontend

Commercial kiosk UI for the Hive AI Academic Advisor.

RAG accuracy handoff:

```text
docs/RAG_ACCURACY_FINAL_HANDOFF.md
```

## Run Frontend

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\frontend"
npm install
npm run dev -- --host 127.0.0.1 --port 5174
```

Open:

```text
http://127.0.0.1:5174/
```

## Commercial Demo Launch

Start the backend first. If Docker Desktop is available, use the Windows backend copy:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\frontend"
.\scripts\start-hive-backend-docker.ps1
```

If using the original Linux/Unsloth backend:

```bash
cd "/mnt/c/Users/jeysa/Desktop/Final Years/frontend"
bash ./scripts/start-hive-backend-linux.sh
```

Then start the kiosk:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\frontend"
.\scripts\start-commercial-kiosk.ps1
```

Check readiness:

```powershell
npm run kiosk:check
```

Expected for a fully connected demo:

```text
Frontend ready: yes
Backend ready: yes
```

## Backend Contract

The frontend expects the FastAPI RAG/fine-tuned model backend:

```text
GET  /health
POST /ask
```

It also supports the Windows Hive backend copy:

```text
GET  /api/health
POST /api/chat
```

Default API base:

```text
same-origin Vite proxy to http://127.0.0.1:8000
```

Override it with:

```powershell
Copy-Item .env.example .env
```

Then edit:

```text
VITE_API_BASE=http://127.0.0.1:8000
```

For the local dev server, leaving `VITE_API_BASE` empty is usually better because Vite proxies `/health`, `/ask`, and `/api/*` to `http://127.0.0.1:8000` and avoids browser CORS issues.

Backend command from the project log:

```bash
cd ~/fyp-unsloth
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Checks

```powershell
npm run avatar:ready
npm run kiosk:check
npm run course:generate
npm run course:validate
npm run rag:eval
npm run rag:deliverables
npm run lint
npm run build
```

`npm run rag:eval` sends representative course questions to the running backend through the frontend dev server. Product-mode results are written to `rag-eval-report.product.json`; raw-backend results are written to `rag-eval-report.raw-backend.json`; the markdown summary is written to `docs/RAG_ACCURACY_STATUS.md`. Use them before demos to catch retrieval or source-grounding regressions.

One-command commercial gate:

```powershell
npm run commercial:check
```

The kiosk also includes a deterministic course-knowledge guard for high-risk facts from the course structure and prerequisite files. This prevents the commercial UI from displaying known-wrong answers for Project I/II, Applied AI terms, Applied AI industrial training, Intelligent Robotics trimesters, Intelligent Robotics MPU/university-course prompts, and progression prompts while the backend RAG patch is being applied.

Refresh the course guard from the backend KB:

```powershell
npm run course:generate
```

By default this reads:

```text
C:\Users\jeysa\Desktop\Final Years\hive-backend\data\kb\programme_structure.jsonl
```

For another course-structure file:

```powershell
$env:COURSE_STRUCTURE_JSONL='C:\path\to\programme_structure.jsonl'
npm run course:generate
Remove-Item Env:\COURSE_STRUCTURE_JSONL
```

If setting a backend path manually, either the parent Hive folder or the backend folder is accepted:

```powershell
$env:HIVE_BACKEND_PATH='C:\Users\jeysa\Desktop\Final Years\hive-backend'
npm run backend:patch:check
Remove-Item Env:\HIVE_BACKEND_PATH
```

To test only the raw backend without the product guard:

```powershell
npm run rag:eval:raw
```

This command is expected to fail until `npm run backend:patch:apply` has been run and the backend has been restarted.

Apply the backend-side retrieval/reranking edits when working directly on the backend checkout:

```powershell
npm run backend:patch:status
npm run backend:patch:check
npm run backend:patch:apply
npm run rag:eval:raw
```

The apply command creates timestamped backups in the backend folder before editing files.

Restore the latest backend patch backup if needed:

```powershell
npm run backend:patch:restore
```

## Avatar Assets

Exact Ebee assets live in:

```text
public/avatar/exact
```

The app loads avatar assets in this order:

```text
1. state PNG frame sequence
2. state PNG pose
3. fallback transparent Ebee PNG
```

Transparent WebM can be enabled later by setting:

```text
VITE_ENABLE_AVATAR_WEBM=true
```
