# Hive Academic Advisor - Final Project Handoff

Date: 2026-06-28  
Workspace: `C:\Users\jeysa\Desktop\Final Years`

## Final Status

Hive Academic Advisor is ready as a local Windows project and packaged for Mac mini hosting.

The current system includes:

- React/Vite frontend in `frontend`.
- FastAPI backend in `hive-backend`.
- RAG/course guard for deterministic course answers.
- Multi-turn BYOC memory flow.
- 3-layer session memory.
- Backend collection for low-confidence or unanswered questions.
- Mac mini deployment scripts under `deploy/macmini`.

## Main Runtime

Backend:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\hive-backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Health check:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
```

Frontend:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\frontend"
npm run dev -- --host 127.0.0.1 --port 5174
```

Important: this backend exposes health at `/api/health`, not `/health`.

## What Was Fixed

### QA Accuracy

The QA matcher now handles:

- Exact QA pair questions.
- Same-meaning questions.
- Common spelling mistakes.
- Course-code requests.
- Credit-hour questions.
- BYOC slot facts.
- Page metadata answers.

Main files:

- `hive-backend/app/rag/course_guard.py`
- `hive-backend/tests/test_course_guard_similarity.py`
- `hive-backend/tests/test_rag_system.py`

### BYOC Multi-Turn Memory

BYOC now separates two cases:

- Advice flow: "Help me choose BYOC" -> asks what the student likes -> recommends exact BYOC subjects.
- Fact flow: "What year has Elective 1 BYOC?", "Is Personal Finance a BYOC option?", "How do I check eligibility?" -> answers directly, not as a recommendation.

Main files:

- `hive-backend/app/api/chat.py`
- `hive-backend/tests/test_byoc_memory.py`

### 3-Layer Memory

Session memory now exposes:

- `profile`: programme, user name, current term.
- `preferences`: saved choices such as BYOC interests.
- `task_state`: active multi-turn flow state.

Main file:

- `hive-backend/app/advisor/session_manager.py`

### Unanswered Question Collection

The backend stores low-confidence/clarification answers for admin review.

Admin endpoints include:

- `GET /api/admin/unanswered`
- `GET /api/admin/unanswered/stats`
- `POST /api/admin/unanswered/{question_id}/answer`
- `POST /api/admin/unanswered/{question_id}/ignore`

Main files:

- `hive-backend/app/repositories/unanswered_repo.py`
- `hive-backend/app/services/unanswered_detector.py`
- `hive-backend/app/api/admin.py`
- `hive-backend/app/memory/db.py`

## Verification Results

All latest checks passed on the live backend at `http://127.0.0.1:8000`.

### Focused Tests

Command:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\hive-backend"
python -m pytest tests\test_byoc_memory.py tests\test_course_guard_similarity.py tests\test_unanswered_detector.py tests\test_rag_system.py -q
```

Result:

```text
15 passed
```

### Base QA Pair Eval

Command:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\frontend"
$env:QA_EVAL_CONCURRENCY='16'
$env:QA_EVAL_BASE_URL='http://127.0.0.1:8000'
Remove-Item Env:QA_PAIRS_PATH -ErrorAction SilentlyContinue
npm run rag:eval:qa-all
```

Result:

```text
1421/1421 passed
Average overlap: 1
Minimum overlap: 1
```

Report:

```text
hybride serch master file/reports/base_qa_1421_live_eval_report.json
```

### Master QA Pair Eval

Command:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\frontend"
$env:QA_EVAL_CONCURRENCY='16'
$env:QA_EVAL_BASE_URL='http://127.0.0.1:8000'
$env:QA_PAIRS_PATH='C:\Users\jeysa\Desktop\Final Years\hive-backend\data\kb\master_qa_pairs.clean.jsonl'
npm run rag:eval:qa-all
```

Result:

```text
2151/2151 passed
Average overlap: 1
Minimum overlap: 1
```

Report:

```text
hybride serch master file/reports/master_qa_2151_live_eval_report.json
```

### Generated Similarity, Typo, General, and Regression Eval

Command:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years"
python "hybride serch master file\scripts\evaluate_live_question_sets.py" --base-url http://127.0.0.1:8000 --concurrency 16 --timeout 30
```

Result:

```text
master_accuracy_first_1000: 1000/1000 passed
beginner_general_500: 500/500 passed
mixed_regression_1500: 1500/1500 passed
```

Summary report:

```text
hybride serch master file/reports/live_eval_summary_1000_plus_500.json
```

## Mac Mini Hosting

The project is packaged for Mac mini deployment.

Transfer archive:

```text
C:\Users\jeysa\Desktop\hive-project.tar.gz
```

The archive excludes:

- `.env`
- `.git`
- `.venv`
- `node_modules`
- logs
- Python cache files

Fast path from Windows:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years"

powershell -ExecutionPolicy Bypass -File ".\deploy\macmini\deploy-to-mac.ps1" `
  -MacUser "macuser" `
  -MacHost "192.168.1.50" `
  -Domain "hive.yourdomain.com" `
  -InstallServices
```

After copying to the Mac mini:

```bash
cloudflared tunnel login
bash ~/hive/deploy/macmini/setup-cloudflare-tunnel.sh hive.yourdomain.com
bash ~/hive/deploy/macmini/status.sh https://hive.yourdomain.com
bash ~/hive/deploy/macmini/smoke-test.sh https://hive.yourdomain.com
```

Public hosting plan:

- Backend runs privately on `127.0.0.1:8000`.
- Caddy serves frontend on `127.0.0.1:8080`.
- Caddy proxies `/ask` and `/api/*` to FastAPI.
- Cloudflare Tunnel exposes the app at a public HTTPS subdomain.
- Existing website only needs a link/button to the Hive subdomain.

## Key Reports

```text
hybride serch master file/reports/base_qa_1421_live_eval_report.json
hybride serch master file/reports/master_qa_2151_live_eval_report.json
hybride serch master file/reports/master_accuracy_first_1000_live_eval_report.json
hybride serch master file/reports/beginner_general_500_live_eval_report.json
hybride serch master file/reports/mixed_regression_1500_live_eval_report.json
hybride serch master file/reports/live_eval_summary_1000_plus_500.json
deploy/macmini/README.md
deploy/macmini/DEPLOYMENT_STATUS.md
```

## Remaining Manual Inputs

Public Mac mini deployment still needs:

- Mac mini SSH username.
- Mac mini LAN IP or hostname.
- Final public subdomain.
- Cloudflare account login for the domain.

No new autocorrect library was added. The implemented spelling tolerance uses existing local normalization, typo aliases, and similar-QA matching.
