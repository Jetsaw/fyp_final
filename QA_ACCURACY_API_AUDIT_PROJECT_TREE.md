# QA Accuracy, API Runtime, and Project Tree Report

Date: 2026-06-16  
Workspace: `C:\Users\jeysa\Desktop\Final Years`

## Summary

The chatbot accuracy issue came from ambiguous QA-pair questions and broad routing. Four generated QA questions had duplicate text but different answers, so `/ask` could return the first matching row even when the intended row came from another source.

I fixed this by:

- Adding exact QA-pair matching before broader prerequisite and course-code routing in the WSL fine-tuned backend.
- Removing duplicate QA question text from the Robotics generator by making source-specific prerequisite questions.
- Regenerating and syncing the QA/RAG artifacts.
- Rebuilding the FAISS indexes.
- Raising generated fallback answer temperature from `0.0` to `0.2` with `top_p=0.9`.
- Keeping deterministic RAG answers stable for factual course/prerequisite answers.
- Adding a full live QA-pair evaluator.

Result: every stored Intelligent Robotics QA pair now passes the live `/ask` audit.

## Accuracy Results

### Full QA-Pair Live Audit

Command:

```powershell
npm run rag:eval:qa-all
```

Result:

```text
QA rows: 1315
Summary: 1315/1315 passed
Average overlap: 1
Minimum overlap: 1
Report: frontend\qa-pair-full-eval-report.json
```

This test sends every question from:

```text
C:\Users\jeysa\Desktop\Final Years\hive-backend\data\kb\intelligent_robotics_qa_pairs.jsonl
```

to the live backend:

```text
http://127.0.0.1:8000/ask
```

It checks that the answer uses RAG, avoids the `ft_first` fallback route, and matches the stored QA answer content.

### Standard RAG Evals

Product path:

```powershell
npm run rag:eval:product
```

Result:

```text
23/23 passed
```

Raw backend path:

```powershell
npm run rag:eval:raw
```

Result:

```text
18/18 passed
```

### Stop-Slop Output Check

Command:

```powershell
npm run stopslop:check
```

Result:

```text
PASS How is ARM6113 Technical Calculus assessed?
PASS What is the Intelligent Robotics programme structure?
PASS Explain why a student should check prerequisites before Project II.
```

### Course Knowledge

Command:

```powershell
npm run course:generate
npm run course:validate
```

Result:

```text
Course knowledge validation passed
Programmes: 2
- Applied AI: 9 terms
- Intelligent Robotics: 3 terms
```

### Build and Backend Tests

Frontend:

```powershell
npm run build
```

Result:

```text
vite build passed
```

Backend:

```powershell
python -m pytest tests/test_requirements.py tests/test_rag_system.py
```

Result:

```text
7 passed, 6 warnings
```

The warnings are existing pytest warnings because several tests return dictionaries instead of using only assertions.

### Kiosk Runtime

Command:

```powershell
npm run kiosk:check
```

Result:

```text
Frontend ready: yes
Backend ready: yes
```

Known warning:

```text
backend /api/health: 404
```

The active WSL backend exposes `/health` and `/ask`, not `/api/health`.

## QA/RAG Artifact Counts

Current generated artifacts:

```text
intelligent_robotics_qa_pairs.jsonl: 1315 rows
hive_course_qa_pairs.jsonl: 1492 rows
programme_structure.jsonl: 94 rows
details index: 1556 vectors
structure index: 94 vectors
global docs index: 796 vectors
```

Duplicate QA question text:

```text
0 duplicates
```

WSL sync target:

```text
\\wsl.localhost\Ubuntu-24.04\home\jet\fyp-unsloth\data\ir_rag_qa_pairs_rebuilt.jsonl
```

Latest WSL backup before overwrite:

```text
\\wsl.localhost\Ubuntu-24.04\home\jet\fyp-unsloth\data\backup_ir_rag_20260616_030246
```

## Fix Details

### Exact QA Matching

Updated WSL file:

```text
\\wsl.localhost\Ubuntu-24.04\home\jet\fyp-unsloth\app\main.py
```

The backend now checks exact QA-pair questions first:

```text
question -> exact QA row -> deterministic_rebuilt_rag answer
```

This prevents generic rules from stealing a QA-pair question.

### Duplicate QA Question Fix

Updated generator:

```text
C:\Users\jeysa\Desktop\Final Years\hive-backend\scripts\rebuild_intelligent_robotics_rag.py
```

Old ambiguous examples:

```text
What is the prerequisite for ARC6133?
What is the prerequisite for ARC6144?
```

New source-specific examples:

```text
What prerequisite is listed for ARC6133 Electronics Instrumentation in the MMU website structure?
What prerequisite does Master&Plan list for ARC6133 Advanced Programming?
What prerequisite is listed for ARC6144 Feedback Control in the MMU website structure?
What prerequisite does Master&Plan list for ARC6144 Machine Vision & Image Processing?
```

The generator now produces zero duplicate question strings.

### Temperature Change

Updated WSL file:

```text
\\wsl.localhost\Ubuntu-24.04\home\jet\fyp-unsloth\app\main.py
```

Generated fallback answers changed from:

```python
temperature=0.0
do_sample=False
```

to:

```python
temperature=0.2
do_sample=True
top_p=0.9
```

This only affects model-generated fallback responses. Deterministic RAG answers still return exact facts from the QA/rules data.

## DeepSeek, ChatGPT, and API Runtime Check

### Active Runtime

The live chatbot backend is:

```text
/home/jet/fyp-unsloth/.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Health:

```text
http://127.0.0.1:8000/health -> {"status":"ok"}
```

The frontend is:

```text
http://127.0.0.1:5174
```

### Provider Status

WSL runtime environment:

```text
wsl:OPENAI_API_KEY=false
wsl:DEEPSEEK_API_KEY=false
```

WSL app code scan:

```text
No deepseek/openai/chatgpt references found under \\wsl.localhost\Ubuntu-24.04\home\jet\fyp-unsloth\app
```

Process scan:

```text
Active project processes are Vite and WSL uvicorn.
No DeepSeek, OpenAI, or ChatGPT project service process is running for the chatbot backend.
```

Important distinction:

- `hive-backend\app\llm\deepseek.py` exists in the Windows backend source.
- `hive-backend\app\voice\tts_service.py` has optional OpenAI TTS code.
- The active port `8000` chatbot is the WSL fine-tuned Qwen/Unsloth backend, not DeepSeek or ChatGPT.
- The Codex desktop app itself uses OpenAI services, but that is not the project chatbot runtime.

## Changed Files

Windows project:

```text
C:\Users\jeysa\Desktop\Final Years\hive-backend\scripts\rebuild_intelligent_robotics_rag.py
C:\Users\jeysa\Desktop\Final Years\hive-backend\data\kb\intelligent_robotics_qa_pairs.jsonl
C:\Users\jeysa\Desktop\Final Years\hive-backend\data\kb\hive_course_qa_pairs.jsonl
C:\Users\jeysa\Desktop\Final Years\hive-backend\data\kb\intelligent_robotics_connected_graph.json
C:\Users\jeysa\Desktop\Final Years\hive-backend\data\kb\intelligent_robotics_source_facts.json
C:\Users\jeysa\Desktop\Final Years\hive-backend\data\pageindex_out\BSc-IR-March-2026-T2610_structure.json
C:\Users\jeysa\Desktop\Final Years\hive-backend\data\indexes\global\details_index.faiss
C:\Users\jeysa\Desktop\Final Years\hive-backend\data\indexes\global\details_meta.jsonl
C:\Users\jeysa\Desktop\Final Years\hive-backend\data\indexes\global\structure_index.faiss
C:\Users\jeysa\Desktop\Final Years\hive-backend\data\indexes\global\structure_meta.jsonl
C:\Users\jeysa\Desktop\Final Years\frontend\scripts\evaluate-all-qa-pairs.mjs
C:\Users\jeysa\Desktop\Final Years\frontend\package.json
C:\Users\jeysa\Desktop\Final Years\frontend\qa-pair-full-eval-report.json
C:\Users\jeysa\Desktop\Final Years\frontend\rag-eval-report.product.json
C:\Users\jeysa\Desktop\Final Years\frontend\rag-eval-report.raw-backend.json
C:\Users\jeysa\Desktop\Final Years\frontend\docs\RAG_ACCURACY_STATUS.md
```

WSL runtime:

```text
\\wsl.localhost\Ubuntu-24.04\home\jet\fyp-unsloth\app\main.py
\\wsl.localhost\Ubuntu-24.04\home\jet\fyp-unsloth\app\output_style.py
\\wsl.localhost\Ubuntu-24.04\home\jet\fyp-unsloth\app\models\prompt_builder.py
\\wsl.localhost\Ubuntu-24.04\home\jet\fyp-unsloth\data\ir_rag_qa_pairs_rebuilt.jsonl
\\wsl.localhost\Ubuntu-24.04\home\jet\fyp-unsloth\data\intelligent_robotics_connected_graph.json
\\wsl.localhost\Ubuntu-24.04\home\jet\fyp-unsloth\data\intelligent_robotics_source_facts.json
\\wsl.localhost\Ubuntu-24.04\home\jet\fyp-unsloth\data\pageindex_out\BSc-IR-March-2026-T2610_structure.json
```

## Project Tree

Generated from the current workspace, excluding build/cache folders such as `node_modules`, `dist`, `__pycache__`, and backup folders.

```text
Final Years/
|-- frontend/
|   |-- backend-patches/
|   |   `-- README.md
|   |-- docs/
|   |   |-- GITHUB_RAG_REPO_DECISION.md
|   |   |-- RAG_ACCURACY_FINAL_HANDOFF.md
|   |   |-- RAG_ACCURACY_STATUS.md
|   |   `-- RAG_ACCURACY_UPGRADE.md
|   |-- public/
|   |   |-- avatar/
|   |   |   `-- exact/
|   |   |       |-- error/
|   |   |       |-- idle/
|   |   |       |-- listening/
|   |   |       |-- speaking/
|   |   |       |-- thinking/
|   |   |       |-- videos/
|   |   |       |-- CONVERT_RENDERED_FRAMES.md
|   |   |       |-- error.png
|   |   |       |-- EXPORT_GUIDE.md
|   |   |       |-- idle.png
|   |   |       |-- listening.png
|   |   |       |-- maya_prepare_exact_ebee_render.py
|   |   |       |-- maya_scene_inspection.json
|   |   |       |-- README.md
|   |   |       |-- SOURCE_ASSETS_FOUND.md
|   |   |       |-- speaking.png
|   |   |       `-- thinking.png
|   |   |-- avatar.png
|   |   |-- favicon.svg
|   |   `-- icons.svg
|   |-- scripts/
|   |   |-- fixtures/
|   |   |   |-- ai4animation-ebee-motion-sample.json
|   |   |   `-- ebee-external-motion-sample.json
|   |   |-- apply-backend-rag-patch.ps1
|   |   |-- check-backend-rag-patch-status.ps1
|   |   |-- check-kiosk-readiness.mjs
|   |   |-- check-rag-deliverables.mjs
|   |   |-- check-stop-slop-output.mjs
|   |   |-- course-knowledge.generated.json
|   |   |-- evaluate-all-qa-pairs.mjs
|   |   |-- evaluate-rag-accuracy.mjs
|   |   |-- evaluate-rag-raw-backend.ps1
|   |   |-- generate-course-knowledge.mjs
|   |   |-- rag-eval-set.json
|   |   |-- restore-backend-rag-patch.ps1
|   |   |-- start-commercial-kiosk.ps1
|   |   |-- start-course-guard-backend.ps1
|   |   |-- start-hive-backend-docker.ps1
|   |   |-- start-hive-backend-linux.sh
|   |   |-- summarize-rag-eval.mjs
|   |   |-- validate-course-knowledge.mjs
|   |   `-- ... 1 more files
|   |-- showcase/
|   |   `-- animated-avatar/
|   |       |-- docs/
|   |       |   `-- AVATAR_AI4ANIMATION_HANDOFF.md
|   |       |-- public/
|   |       |   `-- avatar/
|   |       |-- scripts/
|   |       |   |-- check-ebee-avatar-pipeline.mjs
|   |       |   |-- export-ai4animation-contract.mjs
|   |       |   |-- export-ai4animation-handoff-package.mjs
|   |       |   |-- export-ai4animation-json-schema.mjs
|   |       |   |-- export-ebee-avatar-manifest.mjs
|   |       |   |-- export-ebee-motion-database.mjs
|   |       |   |-- export-ebee-rig-map.mjs
|   |       |   |-- export_maya_ebee_fbx.py
|   |       |   |-- generate-ebee-full-rig-ai4animation-export.mjs
|   |       |   |-- import-ai4animation-motion.mjs
|   |       |   |-- import-ebee-motion-database.mjs
|   |       |   |-- inspect_maya_ebee_scene.py
|   |       |   |-- install-ai4animation-motion.mjs
|   |       |   |-- install-ai4animation-production-pipeline.mjs
|   |       |   |-- install-ai4animation-unity-exporter.mjs
|   |       |   |-- prepare-ai4animation-unity-project.mjs
|   |       |   |-- promote-ai4animation-motion.mjs
|   |       |   |-- render_maya_ebee_poses.py
|   |       |   `-- ... 24 more files
|   |       |-- src/
|   |       |   |-- assets/
|   |       |   `-- components/
|   |       |-- tools/
|   |       |   `-- ai4animation/
|   |       `-- README.md
|   |-- src/
|   |   |-- assets/
|   |   |   |-- ebee-exact-transparent.png
|   |   |   |-- hero-transparent.png
|   |   |   |-- hero.png
|   |   |   |-- hive-scene-bg.png
|   |   |   |-- react.svg
|   |   |   `-- vite.svg
|   |   |-- components/
|   |   |   |-- Avatar2D.css
|   |   |   |-- Avatar2D.tsx
|   |   |   |-- AvatarExact.css
|   |   |   `-- AvatarExact.tsx
|   |   |-- App.css
|   |   |-- App.tsx
|   |   |-- courseKnowledge.ts
|   |   |-- courseKnowledgeData.ts
|   |   |-- index.css
|   |   |-- main.tsx
|   |   `-- vite-env.d.ts
|   |-- .env.example
|   |-- avatar-video-check.png
|   |-- avatar-video-only-landscape-wait.png
|   |-- avatar-video-only-landscape.png
|   |-- avatar-video-only-portrait.png
|   |-- avatar-video-only-verified.png
|   |-- avatar-white-landscape.png
|   |-- avatar-white-portrait.png
|   |-- eslint.config.js
|   |-- index.html
|   |-- package-lock.json
|   |-- package.json
|   |-- qa-pair-full-eval-report.json
|   |-- rag-eval-report.json
|   |-- rag-eval-report.product.json
|   |-- rag-eval-report.raw-backend.json
|   |-- README.md
|   |-- tsconfig.app.json
|   `-- ... 5 more files
|-- hive-backend/
|   |-- app/
|   |   |-- advisor/
|   |   |   |-- alias_resolver.py
|   |   |   |-- context_filters.py
|   |   |   |-- engine.py
|   |   |   |-- intent.py
|   |   |   |-- programme_detection.py
|   |   |   |-- schemas.py
|   |   |   `-- session_manager.py
|   |   |-- agents/
|   |   |   |-- __init__.py
|   |   |   |-- chatbot_agent.py
|   |   |   |-- ingestion_agent.py
|   |   |   |-- reflection_agent.py
|   |   |   |-- retriever_agent.py
|   |   |   `-- trace.py
|   |   |-- api/
|   |   |   |-- admin.py
|   |   |   |-- admin_dashboard.py
|   |   |   |-- chat.py
|   |   |   |-- health.py
|   |   |   `-- voice.py
|   |   |-- core/
|   |   |   |-- config.py
|   |   |   `-- logging.py
|   |   |-- llm/
|   |   |   `-- deepseek.py
|   |   |-- memory/
|   |   |   |-- db.py
|   |   |   `-- repo.py
|   |   |-- preprocess/
|   |   |   |-- build_kb.py
|   |   |   `-- extractors.py
|   |   |-- rag/
|   |   |   |-- parsers/
|   |   |   |   |-- docx.py
|   |   |   |   |-- jsonl_parser.py
|   |   |   |   `-- pdf.py
|   |   |   |-- chunking.py
|   |   |   |-- course_guard.py
|   |   |   |-- embeddings.py
|   |   |   |-- hierarchical_retrieval.py
|   |   |   |-- hybrid_search.py
|   |   |   |-- indexer.py
|   |   |   |-- query_router.py
|   |   |   |-- rag_metrics.py
|   |   |   |-- reranker.py
|   |   |   `-- retriever.py
|   |   |-- repositories/
|   |   |   `-- unanswered_repo.py
|   |   |-- services/
|   |   |   |-- summarizer.py
|   |   |   `-- unanswered_detector.py
|   |   |-- voice/
|   |   |   |-- __init__.py
|   |   |   |-- tts_service.py
|   |   |   `-- whisper_stt.py
|   |   |-- course_guard_server.py
|   |   `-- main.py
|   |-- data/
|   |   |-- global_docs/
|   |   |   |-- BSc-October-2025-T2530.pdf
|   |   |   |-- FAIE_Course_Catalog_Clean.pdf
|   |   |   `-- faie_full_qa.jsonl
|   |   |-- indexes/
|   |   |   `-- global/
|   |   |       |-- details_index.faiss
|   |   |       |-- details_meta.jsonl
|   |   |       |-- index.faiss
|   |   |       |-- meta.jsonl
|   |   |       |-- structure_index.faiss
|   |   |       `-- structure_meta.jsonl
|   |   |-- kb/
|   |   |   |-- alias_mapping.jsonl
|   |   |   |-- course_knowledge.generated.json
|   |   |   |-- hive_course_catalog_master.jsonl
|   |   |   |-- hive_course_qa_pairs.jsonl
|   |   |   |-- hive_kb_courses.jsonl
|   |   |   |-- intelligent_robotics_connected_graph.json
|   |   |   |-- intelligent_robotics_qa_pairs.jsonl
|   |   |   |-- intelligent_robotics_source_facts.json
|   |   |   |-- prereq_graph.json
|   |   |   |-- prereq_rules.json
|   |   |   |-- programme_plan.json
|   |   |   |-- programme_structure.jsonl
|   |   |   `-- rules.yaml
|   |   |-- pageindex_out/
|   |   |   `-- BSc-IR-March-2026-T2610_structure.json
|   |   |-- sessions/
|   |   |   |-- 6bba561b-27bc-4739-b4fb-f71a57d1c4b4.json
|   |   |   |-- ai_user.json
|   |   |   |-- curl_debug.json
|   |   |   |-- fresh_user_course_1770229664066.json
|   |   |   |-- success_final_001.json
|   |   |   |-- user_1769617517955_r9lld99vl.json
|   |   |   |-- user_1769631514014_isyayd287.json
|   |   |   |-- user_1770272240522_1k449t8di.json
|   |   |   `-- user_1770272318282_peh6nlwn0.json
|   |   `-- hive.db
|   |-- scripts/
|   |   |-- fix_prerequisites.py
|   |   `-- rebuild_intelligent_robotics_rag.py
|   |-- tests/
|   |   |-- __init__.py
|   |   |-- run_diagnostic.py
|   |   |-- test_all_components.py
|   |   |-- test_chatbot_accuracy.py
|   |   |-- test_rag_system.py
|   |   `-- test_requirements.py
|   |-- debug_test.py
|   |-- dockerfile
|   |-- qa_test_set.json
|   |-- README.md
|   |-- rebuild_indices.py
|   |-- requirement_test_results.json
|   |-- requirements.txt
|   |-- test_50_questions.py
|   |-- test_all_features.py
|   |-- test_chatbot_qa.py
|   |-- test_deepseek.py
|   |-- test_extended_suite.py
|   |-- test_qa_accuracy.py
|   |-- test_qa_matching.py
|   `-- test_student_conversation.py
`-- FYP_MASTER_BACKUP_CLEANUP_REPORT.md
```

## Current Service URLs

```text
Frontend: http://127.0.0.1:5174
Backend:  http://127.0.0.1:8000
Health:   http://127.0.0.1:8000/health
Ask:      http://127.0.0.1:8000/ask
```

## Recommended Next Checks

Use these when you change QA data again:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\frontend"
npm run rag:eval:qa-all
npm run rag:eval:raw
npm run rag:eval:product
npm run stopslop:check
npm run kiosk:check
```

Use this when you regenerate Robotics data:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\hive-backend"
python scripts\rebuild_intelligent_robotics_rag.py
$env:PYTHONIOENCODING='utf-8'; python rebuild_indices.py
```
