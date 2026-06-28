# Hive FYP Progress Log

**Project title:** AI Avatar for Academic Advising using Fine-Tuned Large Language Model  
**Current working name:** Hive / Hive Kiosk  
**Last updated:** 27 April 2026  
**Main goal:** Build an AI-powered academic advising kiosk/avatar that answers programme, course code, prerequisite, Project I/II, and progression questions using a fine-tuned LLM first, then RAG/rule fallback when needed.

---

## 1. Current Project Status

The project is now at the **integration and UI polish stage**.

Completed core parts:

- Fine-tuned model completed and tested.
- Model evaluation reached approximately **96% accuracy** based on the user’s latest test result.
- FastAPI backend is running successfully on WSL Ubuntu.
- `/health` endpoint works.
- `/ask` endpoint works.
- Fine-tuned-model-first route works.
- RAG/rule fallback route works.
- Course structure / subject code data has been loaded into RAG/rules.
- Project I / Project II prerequisite logic has been corrected.
- Frontend is running in Vite React.
- STT / mic flow works.
- TTS voice output works.
- Auto-send after 2 seconds of silence works.
- 2.5D E-Bee avatar UI has been implemented.
- Portrait kiosk mode and landscape technical mode have been added.
- Auto screen-fit logic has been added for portrait/landscape monitor orientation.
- Current final design direction: **AI-Powered Interactive Kiosk with Real-Time Avatar**.

Current visual concept:

- **Portrait mode:** main kiosk interface for demo/user interaction.
- **Landscape mode:** technical/debug demo interface with chat history, sources, route, confidence, backend status, and voice controls.

---

## 2. Main Architecture

```text
User
 ↓
Frontend React Kiosk UI
 ↓
Speech Recognition / Text Input
 ↓
FastAPI Backend /ask
 ↓
Router
 ├─ Fine-tuned Qwen3.5 2B LoRA model first
 ├─ Rule-based prerequisite validation
 └─ RAG fallback using course/programme documents
 ↓
Answer
 ↓
Frontend displays answer + TTS speaks answer + avatar state changes
```

---

## 3. Backend Progress

### 3.1 Fine-Tuned Model

The fine-tuned model has already been trained using Unsloth in WSL Ubuntu.

**Training environment:**

```text
WSL Ubuntu 24.04
Python virtual environment: .venv
GPU: NVIDIA GeForce RTX 4060 Laptop GPU, 8 GB VRAM
Framework: Unsloth
Base model: Qwen/Qwen3.5-2B
Fine-tuning method: LoRA / RSLoRA
```

**Model output folder:**

```text
/home/jet/fyp-unsloth/outputs/qwen35_2b_lora_out_v17
```

**Exported archive:**

```text
/home/jet/fyp-unsloth/qwen35_2b_lora_out_v17.tar.gz
```

**Windows copy location:**

```text
C:\Users\jeysa\Desktop\qwen35_2b_lora_out_v17
```

**Important model files:**

```text
outputs/qwen35_2b_lora_out_v17/
├─ README.md
├─ adapter_config.json
├─ adapter_model.safetensors
├─ chat_template.jinja
├─ checkpoint-200/
├─ checkpoint-240/
├─ processor_config.json
├─ tokenizer.json
└─ tokenizer_config.json
```

**Current model status:**

- Load test passed.
- Local FastAPI backend successfully loads the fine-tuned model.
- Model can answer known course/prerequisite questions.
- Some low-confidence or ambiguous questions are routed to RAG/rule fallback.

---

### 3.2 Fine-Tuning Training Script

**Location:**

```text
/home/jet/fyp-unsloth/scripts/train_qwen35_unsloth.py
```

**Key configuration:**

```text
MODEL_NAME = "Qwen/Qwen3.5-2B"
DATASET_PATH = "data/ir_finetune_qa_pairs_v17.jsonl"
OUTPUT_DIR = "outputs/qwen35_2b_lora_out_v17"
MAX_SEQ_LENGTH = 512
LORA_R = 32
LORA_ALPHA = 64
LORA_DROPOUT = 0
LEARNING_RATE = 5e-5
NUM_EPOCHS = 5
USE_RSLORA = True
```

---

### 3.3 Model Test Script

**Location:**

```text
/home/jet/fyp-unsloth/scripts/test_qwen3_lora.py
```

**Adapter path used:**

```text
outputs/qwen35_2b_lora_out_v17
```

**Test coverage includes:**

- code-to-title questions
- title-to-code questions
- prerequisite questions
- yes/no prerequisite questions
- multi-prerequisite questions
- negative disambiguation
- connected chat follow-up questions
- natural language questions
- Project I / Project II progression questions

**Latest reported accuracy:**

```text
~96%
```

---

### 3.4 Backend API

**Backend root path:**

```text
/home/jet/fyp-unsloth
```

**Run command:**

```bash
cd ~/fyp-unsloth
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Backend URL:**

```text
http://127.0.0.1:8000
```

**Health endpoint:**

```text
GET http://127.0.0.1:8000/health
```

Expected output:

```json
{"status":"ok"}
```

**Ask endpoint:**

```text
POST http://127.0.0.1:8000/ask
```

Example test:

```bash
curl -X POST "http://127.0.0.1:8000/ask" \
  -H "Content-Type: application/json" \
  -d '{"question":"What are the prerequisites for ARP6110-P2?"}'
```

Expected corrected answer:

```text
The prerequisites for ARP6110-P2 Project II are Completed 60 credit hours; ARP6110-P1 Project I.
```

---

## 4. RAG / Rule System Progress

### 4.1 Data Sources Used

Original source files provided by user:

```text
C:\Users\jeysa\Desktop\data traning\Raw_Pdf\BSc-IR-March-2026-T2610.pdf
C:\Users\jeysa\Desktop\data traning\Subject Code all - cleaned.docx
C:\Users\jeysa\Desktop\data traning\Q&A pairs\ir_finetune_qa_pairs_v17.jsonl
```

Main RAG/rule information currently loaded:

```text
Subject Code all - cleaned.docx
prereq_rules.json
```

### 4.2 RAG / Rule Behavior

Current route behavior:

```text
Known / high-confidence model answer → fine-tuned model route
Programme/rule lookup needed → RAG/rule route
Low confidence / unknown answer → safe fallback + log unknown question
```

Important corrected rule:

```text
ARP6110-P2 Project II requires:
1. ARP6110-P1 Project I
2. Completed 60 credit hours
```

Example corrected outputs:

```text
Question: What are the prerequisites for ARP6110-P2?
Answer: The prerequisites for ARP6110-P2 Project II are Completed 60 credit hours; ARP6110-P1 Project I.

Question: Project II needs what before I can take it?
Answer: The prerequisites for ARP6110-P2 Project II are Completed 60 credit hours; ARP6110-P1 Project I.
```

---

## 5. Frontend Progress

### 5.1 Frontend Location

**Windows frontend folder:**

```text
C:\Users\jeysa\Desktop\Final Years\frontend
```

**Run command:**

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\frontend"
npm run dev
```

**Frontend local URL:**

```text
http://localhost:5173
```

### 5.2 Frontend Stack

```text
React
TypeScript
Vite
CSS
Browser SpeechRecognition API
Browser SpeechSynthesis API
```

### 5.3 Current Frontend Features

Completed:

- Chat interface.
- User message bubble.
- Assistant/Hive answer bubble.
- Debug mode toggle.
- Route display.
- RAG used display.
- Confidence display.
- Sources display.
- Backend health check button.
- Voice selection dropdown.
- Voice output on/off toggle.
- Stop speaking button.
- Clear chat button.
- Mic button.
- Live transcript display.
- Auto-send after 2 seconds of silence.
- Text mode and voice mode buttons.
- Portrait/landscape layout switch button.
- Auto-fit layout based on screen orientation.

---

## 6. Current Final UI Direction

### 6.1 Product Concept

Final UI name/positioning:

```text
AI-Powered Interactive Kiosk with Real-Time Avatar
```

Recommended display text:

```text
Hive
AI Academic Advisor
```

or for final presentation:

```text
Hive Kiosk
AI Academic Advising Avatar
```

### 6.2 Portrait Mode

Purpose:

```text
Main user-facing kiosk mode.
```

Portrait mode layout:

```text
Top:
- Hive logo
- Hive title
- AI Academic Advisor subtitle
- Landscape switch button

Middle:
- E-Bee Advisor scene
- Sci-fi background
- E-Bee 2.5D avatar
- status chip: READY / LISTENING / THINKING / SPEAKING / NEEDS REVIEW
- subtitle / assistant caption

Lower:
- input text box
- Send button
- Text Mode button
- Voice Mode button
- optional mini chat history
```

### 6.3 Landscape Mode

Purpose:

```text
Technical/demo mode for examiner or developer view.
```

Landscape mode layout:

```text
Left:
- full chat history
- live transcript
- input box
- mic/send buttons

Right:
- E-Bee advisor scene
- backend status
- voice controls
- debug controls
- clear chat
```

---

## 7. Important Frontend Files

Current important frontend file list:

```text
C:\Users\jeysa\Desktop\Final Years\frontend\src\App.tsx
C:\Users\jeysa\Desktop\Final Years\frontend\src\App.css
C:\Users\jeysa\Desktop\Final Years\frontend\src\main.tsx
C:\Users\jeysa\Desktop\Final Years\frontend\src\components\Avatar2D.tsx
C:\Users\jeysa\Desktop\Final Years\frontend\src\components\Avatar2D.css
C:\Users\jeysa\Desktop\Final Years\frontend\src\assets\hero-transparent.png
C:\Users\jeysa\Desktop\Final Years\frontend\src\assets\hive-scene-bg.png
C:\Users\jeysa\Desktop\Final Years\frontend\src\assets\hero.png
C:\Users\jeysa\Desktop\Final Years\frontend\package.json
C:\Users\jeysa\Desktop\Final Years\frontend\vite.config.ts
C:\Users\jeysa\Desktop\Final Years\frontend\tsconfig.json
```

### 7.1 Latest Critical Files to Preserve

These are the files that now contain the final UI logic and should not be overwritten carelessly:

```text
src/App.tsx
src/App.css
src/components/Avatar2D.tsx
src/components/Avatar2D.css
```

### 7.2 Required Asset Files

Required for the current avatar design:

```text
src/assets/hero-transparent.png
src/assets/hive-scene-bg.png
```

Notes:

- `hero-transparent.png` must be a real transparent PNG.
- If the image has fake checkerboard background, it will look wrong.
- `hive-scene-bg.png` is the sci-fi lab/kiosk background.

---

## 8. Generated Design Reference Files

Design screenshots/reference exports generated during the UI process:

```text
/mnt/data/hive_kiosk_portrait_1080x1920.png
/mnt/data/hive_kiosk_landscape_1920x1080.png
/mnt/data/a_pair_of_digital_3d_rendered_images_showcases_a_u.png
```

Descriptions:

```text
hive_kiosk_portrait_1080x1920.png
- Portrait kiosk reference output.

hive_kiosk_landscape_1920x1080.png
- Landscape demo reference output.

a_pair_of_digital_3d_rendered_images_showcases_a_u.png
- Generated concept image showing portrait and landscape Hive Kiosk avatar style.
```

---

## 9. Current Known Issues / Things to Watch

### 9.1 Avatar Image Quality

Potential issue:

```text
If hero-transparent.png is not actually transparent, the mascot may show a box/checkerboard/white background.
```

Fix:

```text
Use remove.bg / Canva background remover / Photoshop / Photopea to export real transparent PNG.
Replace:
src/assets/hero-transparent.png
```

### 9.2 Portrait Monitor Fit

Current issue noticed:

```text
When a physical monitor is rotated into portrait mode, the UI may still need scaling to fit perfectly.
```

Fix already added:

```text
CSS auto-fit patch using orientation media queries, 100dvh, clamp(), and internal scroll panels.
```

Need to test with:

```text
Chrome fullscreen F11
Windows Display → Portrait orientation
Browser zoom 90% or 100%
```

### 9.3 Speech Recognition Accuracy

Possible STT issue:

```text
Project I/II may be misheard as:
- project one / project two
- project won / project to
- max one / max two
- mats one / maps two
```

Current fix:

```text
normalizeSpeechText() inside App.tsx maps common misheard terms into Project I / Project II.
```

Need to improve if more misheard phrases appear during demo.

### 9.4 Unknown Questions

Required feature:

```text
Questions that cannot be answered confidently should be saved into a file for future dataset improvement.
```

Need to confirm backend file path, likely:

```text
/home/jet/fyp-unsloth/data/unknown_questions.jsonl
```

or:

```text
/home/jet/fyp-unsloth/app/data/unknown_questions.jsonl
```

Action needed:

```text
Check backend implementation and confirm unknown question logging path.
```

---

## 10. Current Demo Commands

### 10.1 Start Backend

In WSL Ubuntu:

```bash
cd ~/fyp-unsloth
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Check:

```text
http://127.0.0.1:8000/health
```

Expected:

```json
{"status":"ok"}
```

### 10.2 Start Frontend

In Windows PowerShell:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\frontend"
npm run dev
```

Open:

```text
http://localhost:5173
```

### 10.3 Test API Manually

```bash
curl -X POST "http://127.0.0.1:8000/ask" \
  -H "Content-Type: application/json" \
  -d '{"question":"Can I take Project II without Project I?"}'
```

Expected answer:

```text
No. ARP6110-P2 Project II requires ARP6110-P1 Project I and completed 60 credit hours.
```

---

## 11. Demo Script

Recommended final demo flow:

```text
1. Start backend in WSL.
2. Start frontend in Windows.
3. Open Chrome at http://localhost:5173.
4. Use portrait monitor / F11 fullscreen.
5. Show Hive Kiosk UI.
6. Press Voice Mode.
7. Ask: "Can I take Project II without Project I?"
8. Wait for 2 seconds silence.
9. Show auto-send.
10. Show avatar status changes:
    LISTENING → THINKING → SPEAKING → READY
11. Let TTS speak answer.
12. Switch to landscape mode.
13. Show technical details:
    route, RAG used, confidence, sources.
```

Good demo questions:

```text
Can I take Project II without Project I?
What is the prerequisite for ARM6123?
Is Mobile Robots and Drones ARR6123?
What is the subject code for Differential Equations?
If I fail Project I, can I take Project II?
```

---

## 12. What Needs To Be Done Next

### Priority 1 — Final Functional Testing

Do this before adding anything else:

```text
[ ] Run backend.
[ ] Run frontend.
[ ] Test /health.
[ ] Test text input.
[ ] Test mic input.
[ ] Test 2-second auto-send.
[ ] Test TTS output.
[ ] Test Project I/II questions.
[ ] Test unknown question fallback.
[ ] Test portrait mode on rotated monitor.
[ ] Test landscape mode on normal monitor.
```

### Priority 2 — Confirm Unknown Question Logging

Need to verify backend saves unanswered/low-confidence questions.

Expected output file:

```text
unknown_questions.jsonl
```

Recommended location:

```text
/home/jet/fyp-unsloth/data/unknown_questions.jsonl
```

Each row should look like:

```json
{"timestamp":"2026-04-27T20:00:00","question":"...","reason":"low_confidence_or_no_match","route":"fallback"}
```

### Priority 3 — UI Final Polish

```text
[ ] Confirm hero-transparent.png is truly transparent.
[ ] Remove any red marks or accidental drawing marks from avatar image.
[ ] Check portrait mode in F11 fullscreen.
[ ] Adjust browser zoom if needed.
[ ] Hide debug mode during user-facing demo.
[ ] Keep landscape debug mode ready for examiner.
```

### Priority 4 — FYP Documentation

Need to prepare final documentation sections:

```text
[ ] Abstract
[ ] Problem statement
[ ] Objectives
[ ] System architecture diagram
[ ] Methodology
[ ] Dataset preparation
[ ] Fine-tuning setup
[ ] Evaluation result
[ ] RAG fallback design
[ ] Avatar/kiosk UI design
[ ] Testing results
[ ] Limitations
[ ] Future work
```

### Priority 5 — Presentation / Poster

Need to prepare:

```text
[ ] Final pitch deck
[ ] Demo script
[ ] Poster / A3 design
[ ] Architecture diagram
[ ] Result table
[ ] Screenshots of portrait and landscape UI
```

---

## 13. Suggested Final Report Wording

### 13.1 UI Design Description

```text
The final interface is designed as a portrait-mode interactive academic advising kiosk. The system uses a 2.5D animated E-Bee mascot avatar integrated with speech recognition, text-to-speech, fine-tuned LLM response generation, rule-based prerequisite validation, and RAG fallback. A secondary landscape mode is provided for technical demonstration, showing chat history, retrieved sources, confidence values, and routing information.
```

### 13.2 System Routing Description

```text
The system follows a fine-tuned-model-first routing strategy. If the fine-tuned model can answer confidently, the response is returned directly. If the query involves programme rules, prerequisite validation, or uncertain information, the system falls back to rule-based validation and RAG retrieval from programme documents. This reduces hallucination risk while preserving fast responses for common advising questions.
```

### 13.3 Avatar Design Description

```text
The avatar interface uses a lightweight 2.5D animated mascot rather than a full 3D model to reduce deployment complexity, latency, and hardware requirements. The avatar changes visual states during listening, thinking, speaking, and fallback conditions, providing users with a real-time conversational experience suitable for kiosk deployment.
```

---

## 14. GitHub / Commit Checklist

Before pushing to GitHub:

```text
[ ] Remove unused test images if too large.
[ ] Do not commit API keys.
[ ] Add .env.example.
[ ] Add README.md.
[ ] Add setup instructions.
[ ] Add backend run command.
[ ] Add frontend run command.
[ ] Add model path instruction.
[ ] Add screenshot folder.
[ ] Add known limitations.
```

Recommended GitHub structure:

```text
Final Years/
├─ backend/ or fyp-unsloth/
│  ├─ app/
│  │  ├─ main.py
│  │  ├─ router.py
│  │  ├─ rag/
│  │  └─ ...
│  ├─ data/
│  ├─ outputs/qwen35_2b_lora_out_v17/
│  ├─ scripts/
│  └─ requirements.txt
│
├─ frontend/
│  ├─ src/
│  │  ├─ App.tsx
│  │  ├─ App.css
│  │  ├─ main.tsx
│  │  ├─ components/
│  │  │  ├─ Avatar2D.tsx
│  │  │  └─ Avatar2D.css
│  │  └─ assets/
│  │     ├─ hero-transparent.png
│  │     └─ hive-scene-bg.png
│  ├─ package.json
│  └─ vite.config.ts
│
└─ docs/
   ├─ screenshots/
   ├─ architecture.md
   ├─ progress_log.md
   └─ demo_script.md
```

---

## 15. Final Current Status Summary

```text
Core AI: completed
Fine-tuned model: completed
Evaluation: completed, approx. 96%
Backend API: working
RAG/rules: working
Project I/II rule: fixed
Frontend: working
Voice input: working
Voice output: working
2.5D avatar: working
Portrait kiosk mode: working
Landscape technical mode: working
Auto-fit layout: added
Next: final test, unknown question logging check, documentation, presentation materials
```

---

## 16. Do Not Change Unless Necessary

Avoid changing these unless there is a clear bug:

```text
src/App.tsx
src/App.css
src/components/Avatar2D.tsx
src/components/Avatar2D.css
outputs/qwen35_2b_lora_out_v17/
app/main.py
app/router.py
prereq_rules.json
Subject Code all - cleaned.docx
```

The current system is already suitable for final polishing and FYP demonstration. The remaining work should focus on **testing, documentation, and presentation**, not adding risky new features.
