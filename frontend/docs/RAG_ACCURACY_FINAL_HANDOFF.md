# Hive RAG Accuracy Final Handoff

## Objective

Increase Hive RAG accuracy using the included course file and course structure while leaving the fine-tuned model unchanged.

## GitHub Research Decision

`NVIDIA/personaplex` should not be added to the RAG accuracy path. It is useful for a future real-time voice/persona/avatar layer, but it does not solve course retrieval, reranking, source grounding, or factual answer correctness.

Recommended accuracy path:

1. Deterministic course-structure guard for exact known facts.
2. Backend structure routing for course-plan/progression questions.
3. Backend reranking before context construction.
4. `/ask`, `/api/ask`, and `/api/chat` compatibility for different backend deployments.
5. Product and raw-backend eval gates.

Detailed repo matrix:

```text
docs/GITHUB_RAG_REPO_DECISION.md
```

## Implemented In Frontend Workspace

Course-structure accuracy:

```text
src/courseKnowledge.ts
src/courseKnowledgeData.ts
scripts/course-knowledge.generated.json
scripts/generate-course-knowledge.mjs
scripts/validate-course-knowledge.mjs
```

Evaluation and reports:

```text
scripts/rag-eval-set.json
scripts/evaluate-rag-accuracy.mjs
scripts/evaluate-rag-raw-backend.ps1
scripts/summarize-rag-eval.mjs
scripts/check-rag-deliverables.mjs
rag-eval-report.product.json
rag-eval-report.raw-backend.json
docs/RAG_ACCURACY_STATUS.md
```

Backend patch workflow:

```text
scripts/apply-backend-rag-patch.ps1
scripts/restore-backend-rag-patch.ps1
backend-patches/README.md
```

Writable backend course guard:

```text
C:\Users\jeysa\Desktop\Final Years\hive-backend\app\rag\course_guard.py
C:\Users\jeysa\Desktop\Final Years\hive-backend\data\kb\course_knowledge.generated.json
C:\Users\jeysa\Desktop\Final Years\hive-backend\app\api\chat.py
C:\Users\jeysa\Desktop\Final Years\hive-backend\app\main.py
```

## Current Verified Status

Commercial product path:

```text
14/14 passed
```

Current live old raw backend path at `http://127.0.0.1:8000`:

```text
4/14 passed
```

Patched course guard backend path at `http://127.0.0.1:8010`:

```text
14/14 passed
```

The frontend commercial product path is protected from the known course-structure failures. The running raw backend process on port `8000` is still the older `/ask` service, not the patched writable backend copy. The patched guard service on port `8010` verifies the backend-side deterministic course-structure path.

Writable backend copy:

```text
C:\Users\jeysa\Desktop\Final Years\hive-backend
```

This copy was created from `C:\Users\jeysa\Desktop\Hive\hive-backend` so Codex can apply backend edits inside the writable workspace. The original backend folder remains the source copy and was not modified by this workflow.

The writable copy has:

```text
6/6 backend patch markers present
server-side deterministic course guard present
root /ask compatibility route exposed
backend Python syntax compile passed with bundled Codex Python
direct deterministic guard coverage passed 14/14
strict raw HTTP eval against port 8010 passed 14/14
```

Full patched main FastAPI runtime verification is still pending because the available Python runtime in this Codex shell does not have the full backend dependency set installed:

```text
missing: fastapi, uvicorn, sentence_transformers, faiss
```

The course guard FastAPI runtime does run with the available WSL venv and verifies the deterministic course accuracy layer.

## Main Commands

Full commercial readiness gate:

```powershell
npm run commercial:check
```

Raw backend accuracy gate:

```powershell
npm run rag:eval:raw
```

Verified course guard backend:

```powershell
npm run backend:guard:start
$env:RAG_EVAL_BASE_URL='http://127.0.0.1:8010'
npm run rag:eval:raw
Remove-Item Env:\RAG_EVAL_BASE_URL
```

Raw backend patch check/apply:

```powershell
$env:HIVE_BACKEND_PATH='C:\Users\jeysa\Desktop\Final Years\hive-backend'
npm run backend:patch:status
npm run backend:patch:check
npm run backend:patch:apply
npm run rag:eval:raw
```

Rollback latest backend backup:

```powershell
npm run backend:patch:restore
```

## Important Constraint

The original backend folder is outside the writable Codex workspace:

```text
C:\Users\jeysa\Desktop\Hive\hive-backend
```

Use the writable copy for Codex edits:

```text
C:\Users\jeysa\Desktop\Final Years\hive-backend
```

When patching or restoring, set `HIVE_BACKEND_PATH` to the writable copy first.

## Completion Criteria

Frontend/commercial product work is complete when:

```powershell
npm run commercial:check
```

passes.

Main backend service work is complete only when:

```powershell
$env:HIVE_BACKEND_PATH='C:\Users\jeysa\Desktop\Final Years\hive-backend'
npm run backend:patch:apply
npm run rag:eval:raw
```

passes after starting or restarting the backend from `C:\Users\jeysa\Desktop\Final Years\hive-backend`.
