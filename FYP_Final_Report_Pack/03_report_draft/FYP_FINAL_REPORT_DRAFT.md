# FYP Final Report Draft Pack

Generated: 2026-06-23 02:38:13

Project title placeholder: **AI Avatar for Academic Advising using a Fine-Tuned Large Language Model**

## How to Use This Pack

Use the Word draft as the editable report base. Use the evidence files when filling figures, tables, and citations. The sample A-grade report is used for structure only. Do not copy its prose.

## Source Materials

- MMU report guide/objective: `C:\Users\jeysa\.codex\attachments\2265380a-1c7c-43f9-84d2-96b75540949a\goal-objective.md`
- MMU report template copy: `C:\Users\jeysa\Desktop\Final Years\FYP_Final_Report_Pack\01_source_materials\Revised-FYP-Template-v20250710 (1).docx`
- A-grade sample report copy: `C:\Users\jeysa\Desktop\Final Years\FYP_Final_Report_Pack\01_source_materials\1.Megat_FinalReport.pdf`
- Sample report length: 93 pages
- Installed writing skill: `C:\Users\jeysa\.codex\skills\stop-slop`
- Autoresearch reference: `https://github.com/karpathy/autoresearch`

## Formatting Rules Applied

- Times New Roman, 12 pt body text.
- Chapter and section headings use 12 pt bold.
- Page margins: top 20 mm, bottom 40 mm, left 40 mm, right 25 mm.
- Body paragraphs use 1.5 line spacing and justified alignment.
- References should use IEEE numeric style.

## Draft Abstract

Academic advising in programme-heavy faculties depends on accurate answers to course structures, prerequisites, assessment information, and progression rules. Students often ask these questions through informal channels, and staff must repeat the same explanations across cohorts. This project develops Hive, an AI academic advising kiosk that combines a fine-tuned language model, retrieval-augmented generation, deterministic course guards, and an animated Ebee avatar interface for Multimedia University Faculty of Artificial Intelligence and Engineering advising.

The system uses a React and Vite frontend, a FastAPI backend, FAISS-based retrieval indexes, structured course knowledge files, and a Qwen/Unsloth fine-tuned runtime in WSL. The frontend sends student questions to the backend, displays grounded answers, and presents an avatar-based kiosk experience. The backend routes questions through exact QA matching, course-structure guards, hybrid retrieval, reranking, and fallback generation. The knowledge base includes Intelligent Robotics and Applied AI programme structures, course catalogues, prerequisite rules, QA pairs, and generated indexes.

Evaluation focused on factual answer accuracy and kiosk readiness. The latest project evidence records a full QA-pair live audit of 1315/1315 passing rows, product RAG evaluation of 23/23 passed, raw backend evaluation of 18/18 passed, backend tests with 7 passed, and kiosk readiness with both frontend and backend ready. These results show that deterministic course routing and exact QA matching reduced wrong answers for high-risk academic facts. The project concludes that a guarded RAG design is more suitable for academic advising than ungrounded text generation, especially where programme rules must match official source documents.

## Chapter 1: Introduction

### 1.1 Overview

Hive is an AI academic advising kiosk for students who need fast answers about programme structures, prerequisites, course information, and academic progression. The project combines a conversational interface with a domain knowledge base and an avatar presentation layer. The target setting is the Faculty of Artificial Intelligence and Engineering, where students may need advising support outside office hours or before meeting an academic advisor.

### 1.2 Problem Statements

Students can receive wrong advice if a chatbot answers from general language-model memory instead of official course data. Course plans and prerequisite rules also contain small details that matter, such as term placement, course codes, and project sequencing. A generic chatbot may sound confident while mixing facts from unrelated programmes. The project therefore needs factual grounding, deterministic guards for known academic rules, and repeatable evaluation against stored source answers.

### 1.3 Objectives

1. Build a kiosk-style AI academic advisor that answers student questions through a web interface.
2. Create a structured knowledge base from programme, course, and prerequisite data.
3. Combine retrieval, exact QA matching, and deterministic guards to reduce wrong academic answers.
4. Provide an avatar-based interaction layer for a more approachable advising experience.
5. Verify the system through repeatable accuracy, build, and readiness checks.

### 1.4 Scope

The project focuses on academic advising questions for selected FAIE programme data, especially Intelligent Robotics and Applied AI artefacts found in the workspace. The system does not replace official academic advisors. It provides first-line guidance and should direct students to official faculty channels for cases that require approval, appeals, or personal academic records.

## Chapter 2: Literature Review

### 2.1 Conversational Academic Advising

Academic advising chatbots must handle factual questions, not only open conversation. A student may ask about prerequisites, credit hours, trimester placement, or project requirements. The system must answer from verified data because an attractive interface cannot compensate for wrong academic facts.

### 2.2 Retrieval-Augmented Generation

Retrieval-augmented generation supports domain-specific question answering by retrieving relevant records before the model writes an answer. In this project, the knowledge base includes JSONL files, course structures, source facts, and FAISS indexes. The design limits unsupported generation by routing high-risk questions to exact source data.

### 2.3 Fine-Tuned Language Models

Fine-tuning adapts a base language model to the style and task patterns of the project. The WSL runtime keeps the fine-tuned model output available while deterministic RAG paths handle official academic facts. This separation lets the model support conversation while the retrieval and guard layers protect facts.

### 2.4 Avatar-Based Interfaces

The frontend uses Ebee avatar assets to make the kiosk feel like an advising station rather than a plain text form. The current main UI uses generated video and image-based avatar states. The older live animated avatar pipeline remains in a standalone showcase for future development.

## Chapter 3: Details of the Design

### 3.1 System Architecture

The system contains three main parts: the React kiosk frontend, the FastAPI backend, and the WSL fine-tuned model runtime. The frontend displays the chat interface and avatar. The backend exposes health and chat endpoints, manages routing, reads knowledge base files, and retrieves relevant context. The WSL runtime serves the fine-tuned Qwen/Unsloth model.

### 3.2 Knowledge Base

The knowledge base contains programme structures, prerequisite graphs, course catalogues, QA pairs, source facts, and generated course-knowledge files. The latest evidence records 1315 Intelligent Robotics QA pairs, 1492 Hive course QA pairs, 94 programme-structure rows, and multiple FAISS indexes for global and detailed retrieval.

### 3.3 Answer Routing

The backend checks exact QA-pair questions before broader routing. This prevents generic rules from answering a question meant for a specific source row. Deterministic course guards handle high-risk facts. Hybrid retrieval and reranking supply context for broader questions. Fallback generation only handles questions outside the deterministic paths.

### 3.4 Frontend Design

The frontend is a Vite React app. It supports a commercial kiosk launch flow, a deterministic course-knowledge guard, avatar readiness checks, and RAG evaluation scripts. The main avatar component uses `AvatarExact` with generated media assets under `frontend\public\avatar\exact`.

## Chapter 4: Presentation of Data

### 4.1 Accuracy Results

The project evidence records these results:

- Full QA-pair live audit: 1315/1315 passed.
- Product RAG evaluation: 23/23 passed.
- Raw backend evaluation: 18/18 passed.
- Frontend build: passed.
- Backend tests: 7 passed.
- Kiosk readiness: frontend ready and backend ready.

### 4.2 Project Artefacts

The project contains 452 report-relevant files after excluding build and cache folders. Key artefacts include frontend source files, backend API and RAG modules, knowledge-base JSONL files, FAISS indexes, evaluation reports, avatar assets, and handoff documents.

### 4.3 Git and Workspace State

The Git repository root resolves to `C:\Users\jeysa`, while the FYP folder is currently untracked inside that wider repository. Treat this FYP pack as a source snapshot rather than a clean project-level commit history. The remote configured in the parent repository is `https://github.com/Jetsaw/Kommu_Ai_ChatBot.git`.

## Chapter 5: Discussion on Findings

### 5.1 Accuracy Improvements

The largest accuracy gain came from exact QA matching and duplicate question removal. Earlier generated QA questions reused the same wording for different source answers. The backend could then return the first matching row, even when another source row was intended. The fix made source-specific questions and routed exact matches before broad rules.

### 5.2 Guarded RAG Versus Ungrounded Generation

The project results support a guarded RAG design for academic advising. The model can handle language variation, but official course facts need deterministic routing. A wrong prerequisite answer can affect student planning, so the system should prefer source-backed answers over fluent guesses.

### 5.3 Runtime Separation

The Windows workspace contains frontend and backend source files, while the active fine-tuned runtime lives in WSL under `Ubuntu-24.04:/home/jet/fyp-unsloth`. This separation helped preserve the working model environment but makes documentation important. The report should include a deployment diagram and a table of runtime paths.

### 5.4 Limitations

The current draft still needs supervisor details, official student details, final screenshots, final references, and any faculty-required declaration text. The system should also be re-tested immediately before submission because backend availability affects kiosk readiness and live RAG scores.

## Chapter 6: Conclusions and Recommendations

Hive demonstrates that an academic advising chatbot can answer programme-specific questions when the system combines source-grounded retrieval, deterministic guards, and repeatable evaluation. The current evidence shows strong factual accuracy on stored QA pairs and readiness checks. Future work should expand the official course dataset, add a supervisor-approved escalation policy, improve analytics for unanswered questions, and package the WSL backend deployment steps for repeatable installation.

## IEEE Reference Placeholders

[1] P. Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks," 2020.

[2] E. J. Hu et al., "LoRA: Low-Rank Adaptation of Large Language Models," 2021.

[3] J. Johnson, M. Douze, and H. Jegou, "Billion-scale similarity search with GPUs," IEEE Transactions on Big Data, 2019.

[4] FastAPI documentation.

[5] React documentation.

[6] Vite documentation.

[7] Official MMU FAIE course and programme documents used in the project knowledge base.

## Template Structure Snapshot

- DECLARATION
- ABSTRACT
- TABLE OF CONTENTS
- DECLARATION	iii
- ABSTRACT		v
- TABLE OF CONTENTS	vii
- CHAPTER 1:	INTRODUCTION	1
- 1.1	Overview	1
- 1.2	Problem Statements	1
- 1.3	Project Scope	1
- 1.4	Report Outline	1
- CHAPTER 2:	LITERATURE REVIEW	2
- 2.1	Guides on Writing Reviews of Literature	2
- 2.1.1	Introduction Section	2
- 2.1.2	Literature Review Section	3
- 2.2	References and Citations	4
- CHAPTER 3:	DETAILS OF THE DESIGN	5
- 3.1	Writing Style	5
- 3.2	Figures and Tables	5
- 3.3	Equations	7
- CHAPTER 4:	DATA PRESENTATION AND DISCUSSION OF FINDINGS	8
- 4.1	Data Presentation	8
- 4.2	Discussion of Findings	9
- CHAPTER 5:	CONCLUSIONS	10
- 5.1	Summary and Conclusions	10
- 5.2	Areas of Future Research	10

## Evidence Extracts

### Frontend README

```text
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

```

### QA Accuracy Report Extract

```text
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
|   |   |       |-- maya_scene_inspection.j
```

### Cleanup Report Extract

```text
# FYP Master Backup And Cleanup Report

Date: 2026-06-10  
Project: `C:\Users\jeysa\Desktop\Final Years`

## Summary

A full backup was created first, then the working project was cleaned. The next-version UI now uses the generated-video avatar path, while the previous live animated/AI4Animation avatar system was moved into a standalone showcase folder.

## Backup

Backup location:

```text
D:\fyp master backup
```

Backup contents:

```text
D:\fyp master backup\Final Years
D:\fyp master backup\wsl\fyp-unsloth.tar.gz
```

Verified backup sizes:

| Backup Item | Size |
| --- | ---: |
| Windows project backup | 3.647 GB |
| WSL project archive | 15.073 GB |

The WSL backup archive contains the active WSL project:

```text
Ubuntu-24.04:/home/jet/fyp-unsloth
```

## Working Project After Cleanup

Current working project:

```text
C:\Users\jeysa\Desktop\Final Years
```

Final checked size:

| Item | Size |
| --- | ---: |
| Full working project | 0.463 GB |
| Frontend | 0.458 GB |
| Animated avatar showcase | 0.335 GB |
| Backend | 0.005 GB |

## Main UI Change

The main UI was changed from the live rigged avatar system to the generated-video avatar path.

Main app now uses:

```text
frontend\src\components\AvatarExact.tsx
frontend\src\components\AvatarExact.css
frontend\public\avatar\exact
```

The main app no longer references:

```text
RiggedEbeeAvatar
Avatar3D
ebeeRigController
@react-three
three
frontend\public\avatar\ebee_new
```

## Animated Avatar Showcase

The live animated/AI4Animation avatar system was moved to:

```text
frontend\showcase\animated-avatar
```

Moved showcase contents include:

```text
frontend\showcase\animated-avatar\src\components\RiggedEbeeAvatar.tsx
frontend\showcase\animated-avatar\src\components\ebeeRigController.ts
frontend\showcase\animated-avatar\src\components\Avatar3D.tsx
frontend\showcase\animated-avatar\src\components\Avatar3D.css
frontend\showcase\animated-avatar\public\avatar\ebee_new
frontend\showcase\animated-avatar\public\avatar\ebee_avatar.glb
frontend\showcase\animated-avatar\scripts
frontend\showcase\animated-avatar\tools\ai4animation
frontend\showcase\animated-avatar\docs\AVATAR_AI4ANIMATION_HANDOFF.md
```

A showcase README was added:

```text
frontend\showcase\animated-avatar\README.md
```

## Removed From Working Project

Generated/runtime clutter removed:

```text
frontend\artifacts
frontend\dist
frontend\node_modules
frontend\avatar-pipeline-latest.log
frontend\vite-dev-5174.log
frontend\vite-dev-5174.err.log
.dist
frontend\output
```

Backend cleanup removed:

```text
hive-backend\test-results
hive-backend\test_results_extended.json
hive-backend\app\**\__pycache__
hive-backend\data\sessions\test/debug/final/ali session JSON files
```

## WSL Cleanup

Active WSL project:

```text
Ubuntu-24.04:/home/jet/fyp-unsloth
```

WSL size before cleanup:

```text
about 23 GB
```

WSL size after cleanup:

```text
9.5 GB
```

Kept:

```text
/home/jet/fyp-unsloth/app
/home/jet/fyp-unsloth/scripts
/home/jet/fyp-unsloth/data
/home/jet/fyp-unsloth/.env
/home/jet/fyp-unsloth/.venv
/home/jet/fyp-unsloth/outputs/qwen35_2b_lora_out_v17
/home/jet/fyp-unsloth/qwen35_2b_lora_out_v17.tar.gz
```

Removed old WSL model output folders:

```text
qwen35_2b_lora_out_base
qwen35_2b_lora_out_v4
qwen35_2b_lora_out_v5
qwen35_2b_lora_out_v6
qwen35_2b_lora_out_v7
qwen35_2b_lora_out_v8
qwen35_2b_lora_out_v9
qwen35_2b_lora_out_v9_1
qwen35_2b_lora_out_v10
qwen35_2b_lora_out_v11
qwen35_2b_lora_out_v12
qwen35_2b_lora_out_v13
qwen35_2b_lora_out_v14
qwen35_2b_lora_out_v15
qwen35_2b_lora_out_v16
```

Only this model output remains:

```text
qwen35_2b_lora_out_v17
```

## Path Fixes

Old backend paths pointing to:

```text
C:\Users\jeysa\Desktop\Hive
```

were updated to:

```text
C:\Users\jeysa\Desktop\Final Years\hive-backend
```

Updated files included:

```text
frontend\README.md
frontend\scripts\generate-course-knowledge.mjs
frontend\scripts\apply-backend-rag-patch.ps1
frontend\scripts\check-backend-rag-patch-status.ps1
frontend\scripts\restore-backend-rag-patch.ps1
frontend\scripts\start-commercial-kiosk.ps1
frontend\scripts\start-hive-backend-docker.ps1
```

## Verification

Passed:

```powershell
npm install
npm run build
npm run course:validate
```

`npm install` result:

```text
153 packages installed
0 vulnerabilities
```

`npm run build` result:

```text
TypeScript build passed
Vite production build passed
```

`npm run course:validate` result:

```text
Course knowledge validation passed
Programmes: 2
- Applied AI: 9 terms
- Intelligent Robotics: 9 terms
```

Live frontend checks:

```text
http://127.0.0.1:5174/                     OK 200
http://127.0.0.1:5174/avatar/exact/idle.png OK 200
```

`npm run kiosk:check` result:

```text
Frontend ready: yes
Backend ready: no
```

Backend readiness was `no` because no backend server was running at the time of the check.

## Current Dev Server

Frontend dev server was started and verified at:

```text
http://127.0.0.1:5174/
```

## Notes

- The backup was verified before cleanup.
- The generated `frontend\dist` folder was removed again after build verification.
- The main UI is now prepared for generated `.webm` avatar loops under:

```text
frontend\public\avatar\exact
```


```
