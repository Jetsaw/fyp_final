# Hive FYP — WSL Commands, File Locations, and Related Files

**Project:** AI Avatar for Academic Advising using Fine-Tuned LLM  
**Current direction:** Fine-tuned model + RAG/rules backend + 2.5D kiosk avatar frontend  
**Main development environment:** Windows + WSL Ubuntu 24.04  
**Frontend path:** `C:\Users\jeysa\Desktop\Final Years\frontend`  
**WSL backend/model path:** `~/fyp-unsloth`

---

## 1. Current Confirmed System Status

### Completed

- Fine-tuned model training completed with Unsloth.
- Fine-tuned model exported as LoRA adapter.
- Model loading test passed in WSL.
- FastAPI backend runs on port `8000`.
- `/health` endpoint works.
- `/ask` endpoint works.
- RAG/rule fallback path works.
- Project I / Project II prerequisite correction added.
- CORS issue fixed for frontend request.
- Frontend runs using Vite on port `5173`.
- Browser STT works with live transcript.
- Browser TTS works with selectable voice.
- Auto-send after 2 seconds of silence works.
- 2.5D E-Bee avatar implemented.
- Portrait kiosk UI implemented.
- Landscape technical/demo UI implemented.
- Auto layout fitting for portrait/landscape screen added.
- Avatar background scene added.
- Final UI design direction confirmed as: **AI-Powered Interactive Kiosk with Real-Time Avatar**.

---

## 2. Main Windows Project Locations

### Frontend root

```powershell
C:\Users\jeysa\Desktop\Final Years\frontend
```

### Frontend source files

```powershell
C:\Users\jeysa\Desktop\Final Years\frontend\src
```

### Main frontend files

```powershell
C:\Users\jeysa\Desktop\Final Years\frontend\src\App.tsx
C:\Users\jeysa\Desktop\Final Years\frontend\src\App.css
C:\Users\jeysa\Desktop\Final Years\frontend\src\main.tsx
C:\Users\jeysa\Desktop\Final Years\frontend\src\index.css
```

### Avatar component files

```powershell
C:\Users\jeysa\Desktop\Final Years\frontend\src\components\Avatar2D.tsx
C:\Users\jeysa\Desktop\Final Years\frontend\src\components\Avatar2D.css
```

### Frontend asset files

```powershell
C:\Users\jeysa\Desktop\Final Years\frontend\src\assets\hero-transparent.png
C:\Users\jeysa\Desktop\Final Years\frontend\src\assets\hive-scene-bg.png
C:\Users\jeysa\Desktop\Final Years\frontend\src\assets\hero.png
C:\Users\jeysa\Desktop\Final Years\frontend\src\assets\react.svg
C:\Users\jeysa\Desktop\Final Years\frontend\src\assets\vite.svg
```

### Frontend config files

```powershell
C:\Users\jeysa\Desktop\Final Years\frontend\package.json
C:\Users\jeysa\Desktop\Final Years\frontend\package-lock.json
C:\Users\jeysa\Desktop\Final Years\frontend\vite.config.ts
C:\Users\jeysa\Desktop\Final Years\frontend\tsconfig.json
C:\Users\jeysa\Desktop\Final Years\frontend\tsconfig.app.json
C:\Users\jeysa\Desktop\Final Years\frontend\tsconfig.node.json
C:\Users\jeysa\Desktop\Final Years\frontend\eslint.config.js
C:\Users\jeysa\Desktop\Final Years\frontend\index.html
C:\Users\jeysa\Desktop\Final Years\frontend\README.md
```

---

## 3. Main WSL Project Locations

### WSL project root

```bash
~/fyp-unsloth
```

Expanded path:

```bash
/home/jet/fyp-unsloth
```

Windows access path:

```powershell
\\wsl.localhost\Ubuntu-24.04\home\jet\fyp-unsloth
```

### WSL tar export path

```powershell
\\wsl.localhost\Ubuntu-24.04\home\jet\fyp-unsloth\qwen35_2b_lora_out_v17.tar.gz
```

### Windows extracted model folder

```powershell
C:\Users\jeysa\Desktop\qwen35_2b_lora_out_v17
```

---

## 4. WSL Fine-Tuned Model Files

### Model output folder

```bash
~/fyp-unsloth/outputs/qwen35_2b_lora_out_v17
```

Expanded:

```bash
/home/jet/fyp-unsloth/outputs/qwen35_2b_lora_out_v17
```

### Model files inside output folder

```bash
outputs/qwen35_2b_lora_out_v17/README.md
outputs/qwen35_2b_lora_out_v17/adapter_config.json
outputs/qwen35_2b_lora_out_v17/adapter_model.safetensors
outputs/qwen35_2b_lora_out_v17/chat_template.jinja
outputs/qwen35_2b_lora_out_v17/checkpoint-200/
outputs/qwen35_2b_lora_out_v17/checkpoint-240/
outputs/qwen35_2b_lora_out_v17/processor_config.json
outputs/qwen35_2b_lora_out_v17/tokenizer.json
outputs/qwen35_2b_lora_out_v17/tokenizer_config.json
```

### Important model file sizes from earlier output

```text
adapter_model.safetensors    about 177 MB
tokenizer.json               about 20 MB
whole output folder          about 718 MB
```

### Archive/export file

```bash
~/fyp-unsloth/qwen35_2b_lora_out_v17.tar.gz
```

Command used:

```bash
tar -czf qwen35_2b_lora_out_v17.tar.gz outputs/qwen35_2b_lora_out_v17
```

---

## 5. WSL Dataset and Training Files

### Training script

```bash
~/fyp-unsloth/scripts/train_qwen35_unsloth.py
```

### Test script

```bash
~/fyp-unsloth/scripts/test_qwen3_lora.py
```

### Export check script

```bash
~/fyp-unsloth/scripts/check_export_v17.py
```

### Training dataset

```bash
~/fyp-unsloth/data/ir_finetune_qa_pairs_v17.jsonl
```

### Windows source copy of training dataset

```powershell
C:\Users\jeysa\Desktop\data traning\Q&A pairs\ir_finetune_qa_pairs_v17.jsonl
```

### Other source data files

```powershell
C:\Users\jeysa\Desktop\data traning\Raw_Pdf\BSc-IR-March-2026-T2610.pdf
C:\Users\jeysa\Desktop\data traning\Subject Code all - cleaned.docx
```

---

## 6. Backend App Files in WSL

The backend is running from:

```bash
~/fyp-unsloth
```

### Main backend file

```bash
~/fyp-unsloth/app/main.py
```

### Router file

```bash
~/fyp-unsloth/app/router.py
```

### RAG adapter files created/edited

```bash
~/fyp-unsloth/app/rag/docx_adapter.py
~/fyp-unsloth/app/rag/combined_retriever.py
```

### Likely related RAG / rule files

```bash
~/fyp-unsloth/app/rag/
~/fyp-unsloth/prereq_rules.json
```

### Subject/course source used by RAG/rules

```text
Subject Code all - cleaned.docx
prereq_rules.json
```

### Unknown/out-of-system questions file

The system should keep unknown or low-confidence questions in a file. If not already created, use:

```bash
~/fyp-unsloth/data/unknown_questions.jsonl
```

Recommended JSONL structure:

```json
{"timestamp":"2026-04-27T00:00:00","question":"user question here","route":"fallback","confidence":0.30,"answer":"system answer here"}
```

---

## 7. WSL Commands Used So Far

### Enter WSL Ubuntu

From Windows PowerShell:

```powershell
wsl -d Ubuntu-24.04
```

### Go to project folder

```bash
cd ~/fyp-unsloth
```

### Activate virtual environment

```bash
source .venv/bin/activate
```

### Check model output folder

```bash
ls -lah outputs/qwen35_2b_lora_out_v17
```

### Check folder size

```bash
du -sh outputs/qwen35_2b_lora_out_v17
```

### Create export check script

```bash
nano scripts/check_export_v17.py
```

### Run export check script

```bash
python scripts/check_export_v17.py
```

### Open WSL folder in Windows Explorer

```bash
explorer.exe .
```

### Create compressed model export

```bash
tar -czf qwen35_2b_lora_out_v17.tar.gz outputs/qwen35_2b_lora_out_v17
```

### Run backend server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Test health endpoint

```bash
curl http://127.0.0.1:8000/health
```

Expected:

```json
{"status":"ok"}
```

### Test ask endpoint

```bash
curl -X POST "http://127.0.0.1:8000/ask" \
  -H "Content-Type: application/json" \
  -d '{"question":"What are the prerequisites for ARP6110-P2?"}'
```

Expected corrected answer:

```json
{
  "question":"What are the prerequisites for ARP6110-P2?",
  "route":"rag_first",
  "used_rag":true,
  "answer":"The prerequisites for ARP6110-P2 Project II are Completed 60 credit hours; ARP6110-P1 Project I.",
  "sources":["prereq_rules.json","Subject Code all - cleaned.docx"],
  "confidence":1.0
}
```

### Test natural Project II question

```bash
curl -X POST "http://127.0.0.1:8000/ask" \
  -H "Content-Type: application/json" \
  -d '{"question":"Project II needs what before I can take it?"}'
```

Expected corrected answer:

```json
{
  "answer":"The prerequisites for ARP6110-P2 Project II are Completed 60 credit hours; ARP6110-P1 Project I."
}
```

### Test negative disambiguation

```bash
curl -X POST "http://127.0.0.1:8000/ask" \
  -H "Content-Type: application/json" \
  -d '{"question":"Is Mobile Robots and Drones ARR6123?"}'
```

Expected corrected answer:

```json
{
  "answer":"No. Mobile Robots and Drones is ARR6153. Robotics – Machine Design and Mechanisms is ARR6123."
}
```

---

## 8. Windows Frontend Commands

### Go to frontend folder

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\frontend"
```

### Install frontend dependencies

```powershell
npm install
```

### Start frontend

```powershell
npm run dev
```

### Frontend URL

```text
http://localhost:5173
```

### Backend URL used by frontend

```text
http://127.0.0.1:8000
```

### Important API base inside `App.tsx`

```tsx
const API_BASE = "http://127.0.0.1:8000";
```

---

## 9. Current Frontend File List

### Root files

```text
frontend/
├─ .gitignore
├─ eslint.config.js
├─ index.html
├─ package-lock.json
├─ package.json
├─ README.md
├─ tsconfig.app.json
├─ tsconfig.json
├─ tsconfig.node.json
├─ vite.config.ts
```

### Source files

```text
frontend/src/
├─ App.css
├─ App.tsx
├─ index.css
├─ main.tsx
```

### Components

```text
frontend/src/components/
├─ Avatar2D.tsx
├─ Avatar2D.css
```

### Assets

```text
frontend/src/assets/
├─ hero-transparent.png
├─ hive-scene-bg.png
├─ hero.png
├─ react.svg
├─ vite.svg
```

---

## 10. Current Backend File List to Verify in WSL

Run this in WSL:

```bash
cd ~/fyp-unsloth
find app -maxdepth 3 -type f | sort
```

Expected important files should include:

```text
app/main.py
app/router.py
app/rag/docx_adapter.py
app/rag/combined_retriever.py
```

Run this to list model/dataset/script files:

```bash
find scripts data outputs/qwen35_2b_lora_out_v17 -maxdepth 2 -type f | sort
```

Expected important files should include:

```text
scripts/train_qwen35_unsloth.py
scripts/test_qwen3_lora.py
scripts/check_export_v17.py
data/ir_finetune_qa_pairs_v17.jsonl
outputs/qwen35_2b_lora_out_v17/adapter_config.json
outputs/qwen35_2b_lora_out_v17/adapter_model.safetensors
outputs/qwen35_2b_lora_out_v17/tokenizer.json
outputs/qwen35_2b_lora_out_v17/tokenizer_config.json
```

---

## 11. Final Running Order for Demo

### Terminal 1 — Backend in WSL

```bash
wsl -d Ubuntu-24.04
cd ~/fyp-unsloth
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Leave this terminal open.

### Terminal 2 — Frontend in Windows PowerShell

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\frontend"
npm run dev
```

Open:

```text
http://localhost:5173
```

### Browser demo settings

```text
Chrome fullscreen: F11
Zoom: 90% or 100%
Rotated monitor: Windows Display Orientation = Portrait
```

---

## 12. Important Demo Questions

Use these during presentation:

### Project II prerequisite

```text
Can I take Project II without Project I?
```

Expected:

```text
No. ARP6110-P2 Project II requires ARP6110-P1 Project I and completed 60 credit hours.
```

### Failed Project I

```text
If I fail Project I, can I take Project II?
```

Expected:

```text
No. Project II requires Project I and completed 60 credit hours.
```

### Mobile Robots disambiguation

```text
Is Mobile Robots and Drones ARR6123?
```

Expected:

```text
No. Mobile Robots and Drones is ARR6153. Robotics – Machine Design and Mechanisms is ARR6123.
```

### Differential Equations code

```text
What is the subject code for Differential Equations?
```

Expected:

```text
ARM6123.
```

---

## 13. Current Architecture Summary

```text
User speech/text
   ↓
React frontend kiosk UI
   ↓
FastAPI /ask endpoint
   ↓
Router logic
   ↓
Fine-tuned Qwen3.5-2B LoRA first OR RAG/rule path
   ↓
Prerequisite validation rules
   ↓
Answer + route + confidence + sources
   ↓
Frontend chat bubble + avatar state + TTS
```

---

## 14. Main Implementation Decisions

### Final avatar direction

Use 2.5D E-Bee avatar instead of full 3D.

Reason:

```text
2.5D gives stable real-time demo quality within tight FYP timeline.
3D pipeline needs Maya/Blender/GLB/lip-sync work and has higher risk.
```

### Final UI direction

```text
Portrait mode = kiosk mode for final user demo.
Landscape mode = technical demo mode for showing chat, route, confidence, and sources.
```

### Final title wording

Recommended final title:

```text
AI-Powered Interactive Kiosk with Real-Time Avatar
```

or:

```text
Hive Kiosk: AI Academic Advising Avatar
```

---

## 15. Remaining Tasks

### Must finish

- Confirm `hero-transparent.png` is real transparent PNG, not checkerboard fake transparency.
- Confirm `hive-scene-bg.png` exists and loads correctly.
- Confirm portrait mode auto-fits rotated monitor.
- Test with F11 fullscreen.
- Test microphone in final demo environment.
- Test selected TTS voice.
- Test backend answers with 5–10 fixed questions.
- Turn debug mode off for clean portrait demo.
- Use landscape mode only when showing technical details.

### Should finish

- Add unknown question logging if not fully implemented.
- Add final README with run commands.
- Add screenshots for report.
- Add system architecture diagram.
- Add final demo script.

### Optional

- Add idle blinking animation.
- Add speaking pulse animation.
- Add voice waveform visualizer.
- Add admin page for unknown questions.
- Add better STT using Whisper later.
- Add real 3D avatar or video avatar as future work.

---

## 16. Recommended README Section

```md
## How to Run Hive Kiosk

### Backend

```bash
cd ~/fyp-unsloth
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\frontend"
npm run dev
```

Open:

```text
http://localhost:5173
```
```

---

## 17. Notes for Future Self

- Do not rebuild the model unless dataset changes.
- Do not switch to 3D avatar before final demo.
- Focus on stable demo and report.
- Portrait kiosk mode is the final visual output.
- Landscape mode is for technical explanation.
- Keep backend running in WSL during demo.
- Keep frontend running in Windows PowerShell during demo.

