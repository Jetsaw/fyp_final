# Hive AI Academic Advisor: Method, Technology, Git, and Evidence Report

Generated from current workspace evidence on 2026-06-24.

Project path: `C:\Users\jeysa\Desktop\Final Years`

## 1. Project Summary

Hive is an AI academic advising system for the Bachelor of Science (Honours) in Intelligent Robotics. The project combines a kiosk-style React interface, an Ebee avatar, browser voice interaction, a FastAPI backend, deterministic course guards, RAG retrieval, hybrid search, reranking, and evaluation scripts.

The system is designed to answer student questions about:

- Intelligent Robotics programme structure.
- BYOC and elective subjects.
- Project I and Project II requirements.
- Course prerequisites.
- Study progression rules.
- Course details from cleaned programme and course documents.

## 2. High-Level Architecture

```text
Student
  -> React/Vite kiosk UI
  -> local course guard for exact known answers
  -> FastAPI backend
  -> deterministic course guard
  -> query router
  -> structure/details retrieval
  -> hybrid search and reranker
  -> chatbot answer layer
  -> UI answer, speech output, avatar state
```

Main architecture files:

- `frontend/src/App.tsx`
- `frontend/src/courseKnowledge.ts`
- `frontend/src/components/AvatarExact.tsx`
- `hive-backend/app/main.py`
- `hive-backend/app/api/chat.py`
- `hive-backend/app/rag/course_guard.py`
- `hive-backend/app/rag/query_router.py`
- `hive-backend/app/rag/retriever.py`
- `hive-backend/app/rag/hybrid_search.py`
- `hive-backend/app/rag/reranker.py`
- `hive-backend/app/agents/chatbot_agent.py`

## 3. Method Used

### 3.1 Retrieval-Augmented Generation Method

The backend uses RAG so answers are grounded in local course and programme data rather than model memory.

RAG flow:

```text
Question
  -> route query intent
  -> retrieve relevant course/programme chunks
  -> rerank retrieved chunks
  -> build context
  -> answer from context
```

Evidence:

- `hive-backend/app/api/chat.py` loads structure and details indexes, retrieves chunks, reranks results, builds context, and returns `sources` plus `used_rag`.
- `hive-backend/app/agents/chatbot_agent.py` answers from retrieved context. Default config has `USE_LLM=False`, so the system can answer directly from RAG context without requiring a live LLM call.

### 3.2 Deterministic Guard Method

The project uses deterministic guards before general retrieval. This is important because programme facts such as prerequisite rules should not depend only on semantic search.

Guard flow:

```text
Question
  -> exact course/rule match
  -> return verified deterministic answer if matched
  -> otherwise continue to RAG retrieval
```

Evidence:

- Frontend guard: `frontend/src/courseKnowledge.ts`
- Backend guard: `hive-backend/app/rag/course_guard.py`
- Chat API guard call: `answer_course_question(question)` in `hive-backend/app/api/chat.py`

### 3.3 Hybrid Search Method

Hybrid search combines sparse keyword matching and dense/vector-style retrieval.

Purpose:

- BM25/keyword search catches exact course codes, subject names, and terms such as `Project I`, `BYOC`, and credit-hour rules.
- Dense retrieval catches paraphrased questions and natural student wording.
- Reciprocal Rank Fusion combines rankings so exact and semantic matches both influence the final order.

Evidence:

- `hive-backend/app/rag/hybrid_search.py`
- Uses `rank_bm25` when installed.
- Includes a local BM25 fallback implementation if `rank_bm25` is unavailable.
- Uses Reciprocal Rank Fusion through `reciprocal_rank_fusion()`.

### 3.4 Reranker Method

The reranker improves precision after retrieval.

Flow:

```text
retrieve top candidates
  -> cross-encoder reranker scores question/document pairs
  -> keep best context chunks
  -> answer using tighter context
```

Evidence:

- `hive-backend/app/rag/reranker.py`
- Uses `sentence_transformers.CrossEncoder`
- Default model: `cross-encoder/ms-marco-MiniLM-L6-v2`
- Chat API uses `_safe_rerank()` so the API can fall back to sorted retrieval scores if the reranker cannot load.

### 3.5 Dual-Layer Retrieval Method

The backend separates structure-level and details-level retrieval.

Structure layer:

- Programme structure.
- Progression rules.
- Year/trimester planning.

Details layer:

- Course descriptions.
- Prerequisites.
- Assessment.
- Course topics.
- Course learning details.

Evidence:

- `hive-backend/app/api/chat.py`
- `build_or_load_structure_index()`
- `build_or_load_details_index()`
- `search_structure_layer()`
- `search_details_layer()`

### 3.6 Evaluation Method

The project uses multiple evaluation layers.

Evaluation methods:

- Product RAG evaluation through the frontend/product path.
- Raw backend RAG evaluation.
- Full UI evaluation through rendered visible assistant messages.
- Course knowledge validation.
- Avatar and kiosk readiness checks.

Evidence:

- `frontend/scripts/evaluate-rag-accuracy.mjs`
- `frontend/scripts/evaluate-rag-raw-backend.ps1`
- `frontend/scripts/evaluate-all-qa-pairs.mjs`
- `frontend/scripts/check-rag-deliverables.mjs`
- `frontend/scripts/validate-course-knowledge.mjs`
- `frontend/scripts/validate-exact-avatar.mjs`
- `frontend/scripts/check-kiosk-readiness.mjs`
- `hybride serch master file/scripts/evaluate_ui_mixed_300.cjs`

## 4. Technology Stack

### 4.1 Frontend

Main technologies:

- React `^19.2.5`
- React DOM `^19.2.5`
- TypeScript `~6.0.2`
- Vite `^8.0.10`
- ESLint `^10.2.1`
- Browser Web Speech API for speech recognition and speech synthesis

Frontend evidence:

- `frontend/package.json`
- `frontend/src/App.tsx`
- `frontend/src/main.tsx`
- `frontend/src/App.css`
- `frontend/src/components/AvatarExact.tsx`
- `frontend/src/components/AvatarExact.css`

Frontend scripts:

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run avatar:ready`
- `npm run kiosk:check`
- `npm run commercial:check`

### 4.2 Backend

Main technologies:

- Python
- FastAPI `0.115.0`
- Uvicorn `0.30.6`
- Pydantic `2.9.2`
- pydantic-settings `2.5.2`
- httpx `0.27.2`
- SQLite for local session and memory storage

Backend evidence:

- `hive-backend/requirements.txt`
- `hive-backend/app/main.py`
- `hive-backend/app/api/chat.py`
- `hive-backend/app/memory/db.py`
- `hive-backend/app/memory/repo.py`

Backend run pattern:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\hive-backend"
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 4.3 RAG and Search

Main technologies:

- FAISS CPU `1.8.0.post1`
- sentence-transformers `3.0.1`
- CrossEncoder reranker
- NumPy `1.26.4`
- rank-bm25 `0.2.2`
- pypdf `5.0.1`
- python-docx `1.1.2`

RAG data and index evidence:

- `hive-backend/data/indexes/global/index.faiss`
- `hive-backend/data/indexes/global/meta.jsonl`
- `hive-backend/data/indexes/global/structure_index.faiss`
- `hive-backend/data/indexes/global/structure_meta.jsonl`
- `hive-backend/data/indexes/global/details_index.faiss`
- `hive-backend/data/indexes/global/details_meta.jsonl`
- `hive-backend/data/kb/programme_structure.jsonl`
- `hive-backend/data/kb/prereq_rules.json`
- `hive-backend/data/kb/master_qa_pairs.clean.jsonl`

### 4.4 LLM and Voice

LLM:

- DeepSeek client is implemented as an OpenAI-compatible chat-completions client.
- `USE_LLM=False` by default in config, so the backend can run in RAG-direct mode.
- OpenAI-compatible DeepSeek configuration exists in `hive-backend/app/core/config.py`.

Voice:

- Frontend uses browser speech recognition and speech synthesis through Web Speech APIs.
- Backend includes Whisper speech-to-text support.
- Backend TTS service supports browser mode, OpenAI, ElevenLabs, and Azure provider paths.

Evidence:

- `hive-backend/app/llm/deepseek.py`
- `hive-backend/app/core/config.py`
- `hive-backend/app/voice/whisper_stt.py`
- `hive-backend/app/voice/tts_service.py`
- `frontend/src/App.tsx`

### 4.5 Avatar and UI Assets

Avatar method:

- Main app uses generated video assets for the Ebee avatar states.
- Avatar states include idle, listening, thinking, speaking, and error.
- The UI supports portrait and landscape kiosk layouts.

Evidence:

- `frontend/src/components/AvatarExact.tsx`
- `frontend/public/avatar/exact/videos/`
- `frontend/public/avatar/exact/idle.png`
- `frontend/public/avatar/exact/listening.png`
- `frontend/public/avatar/exact/thinking.png`
- `frontend/public/avatar/exact/speaking.png`
- `frontend/showcase/animated-avatar/`

The animated 3D avatar work exists as a separate showcase system, while the main app uses generated video/image avatar assets.

## 5. Git Usage

Current Git evidence from this workspace:

- Git root: `C:/Users/jeysa`
- Git directory: `C:/Users/jeysa/.git`
- Current branch: `main`
- Remote: `origin https://github.com/Jetsaw/Kommu_Ai_ChatBot.git`
- Recent commits:
  - `9a90c65 update .gitignore to ignore sessions.db and website_data.json`
  - `541be7e Restructure repo: flatten folder structure`
  - `a9f0132 Cleaned repo: removed unused files, added greeting disclaimer, LA escalation, session_state logging`

Important Git note:

The active Git root is the user home directory, not an isolated `Final Years` project repository. Current evidence shows the FYP folder is not cleanly tracked as a normal standalone project repo. A previous report-pack evidence file records `status_scoped_to_fyp` as `?? ./`, and `git ls-files` scoped to `C:\Users\jeysa\Desktop\Final Years` returned no tracked project files in this inspection.

Recommended Git cleanup before final submission:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years"
git init
git add frontend hive-backend "hybride serch master file" FYP_Final_Report_Pack HIVE_PROJECT_METHOD_TECH_GIT_REPORT.md
git commit -m "Document Hive FYP implementation"
git remote add origin <your-submission-repository-url>
git push -u origin main
```

Use the existing home-level Git repository only if that is intentional. For FYP submission, a dedicated project repository is cleaner.

## 6. Main Project Folders

| Folder/File | Purpose |
|---|---|
| `frontend/` | React/Vite kiosk UI, avatar, browser voice, local course guard, frontend eval scripts |
| `hive-backend/` | FastAPI backend, RAG, course guards, memory, voice services, tests |
| `hybride serch master file/` | Cleaned KB data, generated question sets, UI evaluation reports |
| `FYP_Final_Report_Pack/` | Generated FYP report pack, figures, DOCX/Markdown report drafts, evidence files |
| `data/indexes/global/` | Root-level FAISS index copy |
| `QA_ACCURACY_API_AUDIT_PROJECT_TREE.md` | Prior API/RAG audit and project tree evidence |
| `FYP_MASTER_BACKUP_CLEANUP_REPORT.md` | Backup and cleanup evidence |

## 7. Important Data Sources

Knowledge base sources include:

- `hive-backend/data/global_docs/BSc-October-2025-T2530.pdf`
- `hive-backend/data/global_docs/FAIE_Course_Catalog_Clean.pdf`
- `hive-backend/data/global_docs/faie_full_qa.jsonl`
- `hive-backend/data/global_docs/master_raw_sources/programme/BSc-IR-March-2026-T2610.pdf`
- `hive-backend/data/global_docs/master_raw_sources/subject_codes/Subject Code all.docx`
- `hive-backend/data/kb/programme_structure.jsonl`
- `hive-backend/data/kb/prereq_rules.json`
- `hive-backend/data/kb/master_qa_pairs.clean.jsonl`
- `hive-backend/data/kb/intelligent_robotics_qa_pairs.jsonl`

## 8. Verification Results

### 8.1 Rendered UI Evaluation

Current report:

- File: `hybride serch master file/reports/ui_mixed_300_live_eval_report.json`
- UI URL: `http://127.0.0.1:8080`
- Dataset: `hybride serch master file/clean_data/eval/mixed_regression_questions_1500.jsonl`
- Total questions: 300
- Passed: 300
- Failed: 0
- Accuracy: 1.0
- Average overlap: 0.919979
- Average latency: 532.37 ms
- P50 latency: 538 ms
- P95 latency: 791 ms
- Max latency: 1155 ms

This is the strongest user-visible proof because it scores the visible React assistant answer after frontend and backend handling.

### 8.2 Product RAG Evaluation

Current report:

- File: `frontend/rag-eval-report.product.json`
- Base URL: `http://127.0.0.1:5174`
- Total: 20
- Passed: 20
- Generated at: `2026-06-16T04:33:17.060Z`

### 8.3 Raw Backend RAG Evaluation

Current report:

- File: `frontend/rag-eval-report.raw-backend.json`
- Base URL: `http://127.0.0.1:8021`
- Total: 20
- Passed: 20
- Generated at: `2026-06-18T09:37:49.495Z`

### 8.4 Technical Report Build Evidence

Generated report pack evidence:

- `FYP_Final_Report_Pack/03_report_draft/FYP_FINAL_REPORT_TECHNICAL.md`
- `FYP_Final_Report_Pack/03_report_draft/FYP_FINAL_REPORT_TECHNICAL.docx`
- `FYP_Final_Report_Pack/03_report_draft/FYP_FINAL_REPORT_TECHNICAL_UI_AVATAR.docx`
- `FYP_Final_Report_Pack/TECHNICAL_REPORT_BUILD_SUMMARY.json`

The build summary lists architecture, fine-tuning, RAG, avatar, accuracy, provider comparison, UI, and avatar figure outputs.

## 9. Commands Used or Available

Frontend:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\frontend"
npm install
npm run dev
npm run build
npm run lint
npm run avatar:ready
npm run kiosk:check
npm run rag:eval:product
npm run rag:eval:raw
npm run rag:summary
npm run rag:deliverables
npm run commercial:check
```

Backend:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\hive-backend"
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
python -m pytest tests/test_requirements.py tests/test_rag_system.py
python scripts/rebuild_intelligent_robotics_rag.py
```

Git inspection commands used for this report:

```powershell
git rev-parse --show-toplevel
git rev-parse --git-dir
git branch --show-current
git log --oneline -n 12
git ls-files -- "C:/Users/jeysa/Desktop/Final Years"
```

## 10. What To Say In The Written FYP Methodology

A concise methodology statement:

The project was developed as a hybrid RAG academic advising system. Programme and course documents were cleaned into structured JSONL knowledge bases, then indexed with FAISS for dense retrieval and supported by BM25 lexical search for exact course-code and prerequisite matching. A query router selects between programme-structure retrieval and detailed course retrieval. Retrieved candidates are reranked using a cross-encoder reranker before being passed to the answer layer. Deterministic course guards are placed before RAG to protect exact rules such as prerequisites, BYOC, Project I/II, and progression facts. The frontend is a React/Vite kiosk UI with an Ebee avatar, browser voice input/output, and local fallback course knowledge. Accuracy was verified using frontend product RAG tests, raw backend RAG tests, and a 300-question rendered UI evaluation that scored the visible assistant answer.

## 11. Submission Notes

Include these in the final submission package:

- Source code: `frontend/` and `hive-backend/`
- Knowledge base: `hive-backend/data/kb/`
- Indexes: `hive-backend/data/indexes/global/`
- UI assets: `frontend/public/avatar/exact/`
- Evaluation reports:
  - `frontend/rag-eval-report.product.json`
  - `frontend/rag-eval-report.raw-backend.json`
  - `hybride serch master file/reports/ui_mixed_300_live_eval_report.json`
- Final report pack:
  - `FYP_Final_Report_Pack/03_report_draft/`
  - `FYP_Final_Report_Pack/05_figures/`
  - `FYP_Final_Report_Pack/05_figures_technical/`
- Git evidence:
  - branch, remote, latest commits, and whether the submission repository is a clean standalone repo.

## 12. Current Limitations

- The current Git root is not scoped only to this FYP folder. Create a clean standalone repo before submission if Git evidence is required.
- DeepSeek LLM support exists, but `USE_LLM` defaults to false, so the current default answer path is RAG-direct/deterministic rather than live LLM generation.
- Backend provider paths for OpenAI, ElevenLabs, and Azure TTS exist, but the main frontend uses browser-native speech synthesis by default.
- Generated avatar video/image assets are used in the main app; the more advanced animated 3D avatar system is kept separately under `frontend/showcase/animated-avatar/`.

