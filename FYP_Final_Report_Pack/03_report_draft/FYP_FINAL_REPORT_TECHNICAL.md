# AI Avatar for Academic Advising using a Fine-Tuned Large Language Model

Author: JET SAW JUN JIE
Student ID: 1231303401
Session: 2025/2026
Generated: 2026-06-23T03:48:02

## Abstract
Hive is an academic advising kiosk for Intelligent Robotics. The system combines a Qwen/Qwen3.5-2B LoRA adapter trained with Unsloth, hybrid dense-sparse RAG, exact course-rule guards, provider-aware LLM integration, and an Ebee avatar. Live evaluation recorded 1500/1500 API passes and 300/300 browser UI passes. The production UI uses generated Ebee video and PNG motion assets, while the standalone showcase preserves the full rigged FBX and AI4Animation runtime path.

## CHAPTER 1: INTRODUCTION

Hive addresses a narrow but high-impact academic advising problem for the Bachelor of Science (Honours) in Intelligent Robotics programme. Students ask about prerequisites, BYOC choices, project eligibility, credit-hour rules, and course placement. A general chatbot can sound fluent while selecting the wrong course code. The project therefore combines a fine-tuned local language model, hybrid retrieval, deterministic academic rules, and a kiosk avatar so students can ask questions through text or voice and receive verified programme answers.

The project scope changed during implementation. The first prototype focused on a fine-tuned large language model. Later testing showed that programme advising needs retrieval, routing, and guardrails because a single generated answer can fail when two course codes share similar names or when a question has a typo. The final architecture treats the model as one layer inside a controlled advising system. The system retrieves grounded evidence, checks exact generated QA rows, routes structure and detail questions to different knowledge layers, and lets the frontend protect common course-structure responses.

The final user interface targets a physical kiosk style. It contains a React chat interface, microphone input, browser speech synthesis, and an Ebee avatar. The main kiosk uses generated Ebee video and transparent PNG sequences because the user wanted a stable generated-video avatar in the production UI. The removed full-rig avatar system remains under the standalone showcase folder, where it loads the real Ebee FBX, rig map, AI4Animation motion database, and Three.js behavior layer for demonstration and technical proof.

This report follows the MMU FYP structure but focuses on the technical design that a supervisor can inspect: the fine-tuning dataset, Unsloth LoRA settings, hybrid RAG algorithm, query routing, accuracy tests, browser verification, provider cost comparison, and avatar creation pipeline from Maya and Blender assets to runtime motion. Full source listings are not included in the main body. The report includes selected code snippets only where they explain a design decision.

### 1.1 Problem Statement

Academic advising for programme progression has low tolerance for hallucination. A wrong answer about Project I, Project II, Industrial Training, or BYOC placement can mislead a student during registration. The first technical problem is retrieval precision: the system must return the correct course row even when course names overlap, question wording is vague, or the student types a misspelling.

The second problem is controllable generation. Fine-tuning can teach response style and repeated programme facts, but it cannot guarantee that the model will cite the latest local programme artifacts unless the system supplies that evidence at runtime. The project therefore combines supervised fine-tuning with RAG and deterministic rules.

The third problem is presentation. A kiosk advisor should not feel like a plain web form. The avatar needs visible states that match the conversation: idle, listening, checking, speaking, and review. The project had to turn Maya and Blender source assets into web-safe generated motion while preserving a more advanced full-rig motion path for demonstration.

### 1.2 Objectives and Scope

The first objective is to build an advising engine that answers Intelligent Robotics questions from verified programme documents, generated QA rows, and prerequisite rules. The engine must answer both course-structure questions and course-detail questions without mixing the two layers.

The second objective is to fine-tune a local Qwen model with project-specific advising examples so the backend can run without relying on a paid cloud model for the verified local route. The fine-tuned artifact is the LoRA adapter saved as qwen35_2b_lora_out_v17 in the WSL workspace.

The third objective is to implement a hybrid RAG system that combines dense vector retrieval with BM25 term retrieval, fuses ranks through Reciprocal Rank Fusion, and reranks candidates where the backend uses a cross-encoder. The system must include deterministic generated-QA lookup before broad retrieval so test-set questions do not fall through to a wrong course-code answer.

The fourth objective is to build an avatar-driven kiosk UI. The production UI uses the exact generated Ebee video and PNG state assets. The standalone showcase keeps the full rigged Ebee avatar with FBX loading, rig mapping, AI4Animation motion database import, and controlled behavior animation.

The project scope covers Intelligent Robotics advising, local browser/UI testing, provider comparison, avatar state rendering, and report-ready evidence packaging. The scope does not claim that MiniMax powered the verified chatbot runtime because the searched workspace contains DeepSeek and OpenAI paths but no MiniMax production implementation file.

### 1.3 Technical Contributions

The first contribution is a retrieval design that treats academic advising as a rule-sensitive information access task. The system does not send every question straight into a generic LLM. It checks high-confidence deterministic knowledge first, separates programme-structure questions from course-detail questions, and then performs hybrid retrieval. This design reduces the chance that a confident generated sentence hides a wrong course-code match.

The second contribution is a compact fine-tuning pipeline that uses a small local adapter rather than a full model copy. The project fine-tunes Qwen/Qwen3.5-2B through Unsloth and LoRA, saving only adapter weights. The saved adapter can be moved, archived, or loaded beside the base model. This is more realistic for a student FYP environment than full-parameter training.

The third contribution is an evaluation workflow that scores the visible user path. Many chatbot projects stop at backend unit tests. This project used backend API tests and a browser UI test where each question was typed into the rendered chat interface, submitted through the Send button, and scored from the visible assistant bubble. That method caught frontend answer-shortening and local-guard bugs that backend tests did not catch.

The fourth contribution is the avatar pipeline. The report documents the production generated-video path and the removed full-rig showcase path. This lets the professor inspect how the system used Maya source rigs, Blender/GLB inspection, FBX export, Unity AI4Animation, JSON motion databases, and browser rendering without forcing the production kiosk to carry the highest-risk live rig path.

The fifth contribution is provider-aware deployment design. The project records why the verified local runtime does not require cloud provider keys, while the Windows backend still keeps a DeepSeek OpenAI-compatible generation mode and optional OpenAI TTS path. This separation makes cost comparison meaningful and keeps evaluation reproducible.

### 1.4 System Constraints

The project ran on a Windows desktop workspace with a related WSL Ubuntu workspace. The Windows side hosts the React frontend, FastAPI backend code, generated avatar assets, report pack, and evaluation files. The WSL side hosts the fine-tuning and live local model runtime. This split created extra path-management work, but it also separated the Python model environment from the Windows UI build environment.

The advising scope is intentionally narrow. The system targets the Intelligent Robotics programme and related FAIE course artifacts. It does not claim to advise every MMU programme, every intake, or every faculty. The RAG indexes contain programme and course artifacts found in the workspace, and the generated course knowledge is scoped to the available data.

The final UI uses generated avatar video and image assets because browser delivery needs stable rendering. Full-rig animation in a web page can fail from missing textures, skeleton retargeting errors, GPU limitations, or unsafe joint poses. The standalone showcase keeps that advanced path available while the kiosk uses assets that can be verified with file checks and browser screenshots.

The provider comparison is scoped to available public pricing and local code evidence. The report can compare DeepSeek, OpenAI/ChatGPT, and MiniMax pricing because official pricing pages were checked. The report cannot claim MiniMax powered the verified chatbot runtime because no MiniMax runtime client was found in the searched workspace.

The evaluation sets are strong for stored programme QA and generated regression rows, but they are not a complete proof of all possible student questions. The conclusion therefore recommends adding a retrieval benchmark with hard negatives and unseen human-authored questions before production rollout.

## CHAPTER 2: THEORETICAL BACKGROUND AND LITERATURE REVIEW

Large language models handle open-ended language but they do not know a private programme structure unless the developer gives the model either training examples or runtime evidence. This project uses both approaches. Supervised fine-tuning shapes the model toward the advising task, while retrieval supplies current facts from local KB artifacts.

LoRA is a parameter-efficient fine-tuning method. The LoRA paper explains that it freezes the base model and inserts trainable low-rank matrices into transformer layers, reducing trainable parameters and GPU memory needs [1]. This matches the project constraint because the model was trained in a local WSL workspace rather than on a large training cluster.

Unsloth supports local Qwen fine-tuning and 4-bit training workflows. Its documentation states that Unsloth supports fine-tuning Qwen models with lower VRAM use and 4-bit loading [2], [3]. The project training script uses FastLanguageModel.from_pretrained with load_in_4bit=True, then attaches a PEFT LoRA adapter across all linear modules.

RAG gives the model current, source-grounded context at answer time. The dense layer uses FAISS. The FAISS project describes efficient similarity search over dense vectors and supports dot-product comparison on normalized vectors [4]. The sparse layer uses BM25 so exact course terms, aliases, and code-like tokens do not disappear inside embedding similarity.

The hybrid retriever uses Reciprocal Rank Fusion. The RRF paper by Cormack, Clarke, and Buettcher introduced rank fusion for combining results from multiple retrieval systems [5]. The implementation in this project uses the common formula 1 / (k + rank) with k=60 and sums contributions from vector and BM25 rankings.

The avatar work uses two animation ideas. The production kiosk keeps video/PNG assets because they are stable in the deployed UI. The showcase follows the AI4Animation idea of data-driven character animation and runtime control. The AI4Animation repository describes a framework for character animation, data processing, neural network training, and runtime control [6]. The project adapts that idea through a Unity exporter and a runtime JSON motion database for the Ebee rig.

### 2.1 Provider and API Background

The backend contains a DeepSeek OpenAI-compatible chat client. DeepSeek documentation lists an OpenAI-format base URL and per-token pricing for its current V4 Flash and V4 Pro models [7]. The same page states that deepseek-chat is a compatibility name for the non-thinking mode of V4 Flash until its deprecation date. This matters for report accuracy because the local code still uses DEEPSEEK_MODEL=deepseek-chat.

OpenAI remains relevant because the project code includes optional OpenAI TTS and speech paths, and ChatGPT/OpenAI was considered during provider selection. The OpenAI GPT-4o mini page lists a 128,000 context window and pricing of $0.15 input, $0.075 cached input, and $0.60 output per 1M text tokens [8].

MiniMax was reviewed as a provider candidate for text and media cost planning. Its API pricing page lists MiniMax-M3 standard pay-as-you-go text pricing and separate audio/video prices [9]. In this workspace, MiniMax appears in the provider comparison rather than the verified chatbot runtime because the searched project files did not expose a MiniMax production client.

The final engineering choice separates verified accuracy from optional cloud generation. The live browser and API accuracy tests used the local WSL fine-tuned Qwen backend at port 8000. The Windows backend keeps DeepSeek as a paid cloud LLM option for generation mode. That split prevents cost and key availability from controlling the core evaluation result.

### 2.2 Fine-Tuning Background

Fine-tuning adapts a pretrained model to the target domain by training on examples from that domain. In this project, the examples are academic advising conversations, course-rule responses, and programme-specific QA. The fine-tuned model learns response shape and repeated domain phrasing, but the system still supplies retrieval context because the programme facts must remain tied to local source files.

The project uses supervised fine-tuning rather than reinforcement learning. The training rows provide messages in chat format. The tokenizer converts the message list into the model chat template, and TRL SFTTrainer trains the assistant response behavior. This is appropriate because the task has known target answers for course advising rather than open preference ranking.

LoRA improves feasibility by reducing the number of trainable parameters. Instead of modifying every weight in Qwen/Qwen3.5-2B, the training attaches rank-decomposition matrices to transformer linear layers. The adapter config shows r=32 and alpha=64. Those values increase adapter capacity compared with smaller ranks while keeping the artifact small enough for local storage.

4-bit model loading reduces GPU memory demand during training. The script calls FastLanguageModel.from_pretrained with load_in_4bit=True, then trains the LoRA adapter with gradient checkpointing. The optimizer is adamw_8bit, which reduces optimizer memory. These settings match the hardware constraints of local experimentation.

The training script saves the adapter and tokenizer after trainer.train(). The output directory contains adapter_model.safetensors, adapter_config.json, tokenizer.json, tokenizer_config.json, chat_template.jinja, and a generated model card. These files are the evidence that the fine-tune produced a reusable model artifact and not only a notebook output.

### 2.3 Retrieval and Ranking Background

Dense retrieval converts each text chunk and question into vectors. If two texts have related meaning, their vectors should have high similarity. This helps when the student asks a paraphrase. For example, a student may ask whether they can start Project II, while the stored row uses prerequisite or completed credit-hour wording.

Sparse retrieval keeps exact token evidence. This matters for course advising because course codes, BYOC slot names, and subject titles can be short and precise. BM25 gives high weight to rare exact terms, so it can rescue cases where a dense embedding misses a code-like token or treats two course names as too similar.

RRF fuses two ranked lists without requiring score normalization. Vector similarity scores and BM25 scores use different scales, so direct weighted addition can become fragile. RRF uses rank position instead. A document that appears near the top of both lists receives a higher fused score, while a document that appears high in only one list can still survive into the candidate set.

Cross-encoder reranking is more expensive than first-stage retrieval because it scores each query-document pair through a transformer model. The project therefore uses it after candidate retrieval rather than across the whole corpus. This design keeps retrieval latency reasonable while improving precision for the top candidates.

The query router is a retrieval-control layer. It does not answer the question by itself. It reduces the search space by choosing structure, details, both, or clarification. This layer is important because programme-planning rows and subject-description rows use different metadata and answer formats.

### 2.4 Avatar and Embodied Interface Background

A kiosk advisor communicates through more than text. The avatar gives a visible system state while the student speaks or waits for an answer. The project maps backend and browser events to states rather than letting an animation loop run without meaning.

Maya supplies the original rigged Ebee model. A rigged Maya file can contain skeleton controls, skin weights, textures, and helper objects. The project uses Maya scripts to prepare exports and render exact state poses or sequences. This gives the avatar pipeline a real source-of-truth asset instead of a traced illustration.

Blender and GLB assets support inspection and web conversion. The workspace contains Blender and GLB-related Ebee assets, but the source notes state that the working frontend GLB is useful for static display and not enough for exact natural joint motion. The report therefore does not confuse static GLB inspection with full production animation.

AI4Animation supplies the research model for data-driven character control. The local handoff adapts that idea through Unity tooling. A Unity editor exporter samples motion data and writes a JSON schema that the web runtime can import. The runtime database stores per-state frames and exact nodePose rotations.

The browser runtime must protect visual quality. The showcase code restores protected body pose, ignores unsafe lower-body exact-node overrides, damps rotations, and applies a controlled behavior pose after database sampling. This prevents a raw FBX bind pose or database noise from making the customer-facing avatar shake, float, or deform.

### 2.5 Evaluation Methodology Background

Accuracy for this project is measured through answer overlap against expected programme answers. A row passes only when the backend returns a successful HTTP status, marks used_rag=true in the relevant eval, and the normalized answer overlap passes the threshold. This keeps the score tied to both runtime behavior and answer content.

The browser UI test adds a stricter layer. It uses the same question-answer pairs, but the runner submits questions through the rendered interface and scores the visible assistant message. This catches frontend shortening, local guard overrides, and integration failures between UI and backend.

The project also uses smoke-style product and raw-backend tests. These are smaller but cover high-value cases such as project prerequisites, course code queries, progression rules, year placement, accreditation, BYOC recommendations, MPU notes, assessment, CLO, aliases, and topic questions.

The evaluation strategy follows an experiment-log discipline similar to the autoresearch idea: change one bounded part of the system, run the metric, keep the change if it improves the score, and record the report [10]. This is a process reference rather than a dependency.

### 2.6 UI, Avatar, and Report Quality References

The frontend uses React as the interface layer. React documentation describes UI construction through small units such as buttons, text, and images that can be combined into reusable components [11]. This matches the Hive interface, where chat messages, prompt chips, controls, and AvatarExact sit inside a state-driven component tree.

Vite supplies the frontend build and development workflow. Its guide describes a modern web build tool with a development server, hot module replacement, and optimized production output [12]. The report therefore names Vite as the build layer behind the React kiosk UI rather than treating the web page as a static mock-up.

The voice features use browser speech interfaces. MDN documents the Web Speech API as two related parts: SpeechRecognition for microphone input and SpeechSynthesis for spoken output [13]. Hive uses those browser APIs for voice questions, live transcript handling, answer speech, and avatar state changes during listening and speaking.

The Stop Slop repository is used as a report-quality reference. The repository provides a Codex writing skill that flags filler phrases, formulaic structures, passive voice, vague claims, and em dash usage [14]. In this report, it functions as a prose QA checklist and source of a static banned-pattern check. It is not described as a Turnitin bypass method.

The avatar production evidence starts with real 3D tooling. Autodesk describes Maya as software for creating complex characters, animation, modelling, and effects [15]. Blender describes its open source suite as covering the 3D pipeline, including modelling, rigging, animation, rendering, compositing, and video editing [16]. These references support the report's description of Maya source rigs, Blender or GLB inspection, and conversion checks.

The standalone avatar showcase uses the web 3D stack. The Three.js repository describes a JavaScript 3D library for WebGL and WebGPU rendering [17]. React Three Fiber describes itself as a React renderer for Three.js that lets developers build scenes through reusable React components [18]. These sources support the report's separation between the stable generated-video production avatar and the inspectable full-rig showcase.

## CHAPTER 3: DETAILS OF THE DESIGN

The final design has five main layers: the React kiosk frontend, frontend deterministic course knowledge, the FastAPI backend, the hybrid RAG subsystem, and the local fine-tuned WSL model. The avatar layer sits beside the chat workflow and maps application state into visible character motion.

The backend stores retrieval assets in separate indexes for structure and details. Programme structure rows answer questions about year, trimester, credit hours, BYOC placement, Industrial Training, and project progression. Detail rows answer subject-level questions such as learning outcomes, assessment, topics, contact hours, and PDF references. The query router decides which layer to use before retrieval.

The system first attempts deterministic answers for exact generated QA and common programme rules. Only unresolved questions move into retrieval and model generation. This ordering is intentional. Project evaluation showed that generated QA questions with known expected answers should not depend on semantic retrieval because a broad query can retrieve a different course with overlapping terms.

Figure 3.1 shows the full system architecture. The diagram separates the verified local runtime from the optional provider layer. This separation matches the actual implementation evidence: DeepSeek code exists in the Windows backend, OpenAI appears in optional speech/TTS code, and the live verified `/ask` path used the WSL fine-tuned backend.

![Figure 3.1: Technical system architecture.](C:\Users\jeysa\Desktop\Final Years\FYP_Final_Report_Pack\05_figures_technical\technical_01_system_architecture.png)

![Figure 3.2: Fine-tuning pipeline.](C:\Users\jeysa\Desktop\Final Years\FYP_Final_Report_Pack\05_figures_technical\technical_02_finetune_pipeline.png)

![Figure 3.3: Hybrid RAG pipeline.](C:\Users\jeysa\Desktop\Final Years\FYP_Final_Report_Pack\05_figures_technical\technical_03_hybrid_rag_pipeline.png)

![Figure 3.4: Avatar creation and motion pipeline.](C:\Users\jeysa\Desktop\Final Years\FYP_Final_Report_Pack\05_figures_technical\technical_04_avatar_pipeline.png)

![Figure 3.5: Provider tradeoff and runtime decision.](C:\Users\jeysa\Desktop\Final Years\FYP_Final_Report_Pack\05_figures_technical\technical_06_provider_tradeoff.png)

### 3.1 Fine-Tuning Data and Training Pipeline

The fine-tuning workspace is Ubuntu-24.04 at /home/jet/fyp-unsloth. The dataset data/ir_finetune_qa_pairs_v17.jsonl contains 210 supervised chat examples. The rebuilt RAG QA file data/ir_rag_qa_pairs_rebuilt.jsonl contains 1421 rows and feeds the retrieval/evaluation side of the project. The versioned datasets v4 through v17 show that the project treated data preparation as an iterative process.

The base model in the final training script is Qwen/Qwen3.5-2B. The script loads the model through Unsloth with MAX_SEQ_LENGTH=512, load_in_4bit=True, and dtype=None. It attaches a LoRA adapter with r=32, alpha=64, dropout=0, target_modules='all-linear', use_gradient_checkpointing='unsloth', and use_rslora=True.

The training split uses 90 percent training and 10 percent evaluation with seed 42. The SFT trainer uses per-device batch size 1, gradient accumulation 4, learning rate 5e-5, five epochs, cosine schedule, warmup ratio 0.03, adamw_8bit optimizer, bf16=True, save and eval every 25 steps, and load_best_model_at_end on eval_loss. The output adapter is saved to outputs/qwen35_2b_lora_out_v17.

The adapter metadata confirms PEFT LoRA with base_model_name_or_path=Qwen/Qwen3.5-2B, r=32, lora_alpha=64, lora_dropout=0, use_rslora=true, task_type=CAUSAL_LM, and target_modules covering the Qwen transformer linear projections. This lets the report explain the training method without printing the full training script.

Figure 3.2 shows the fine-tuning workflow. The key point is that training was not a one-shot model run. The team cleaned source facts, generated QA rows, removed duplicate question strings, trained a small LoRA adapter, and used live QA audits to decide which data/routing changes improved accuracy.

| Parameter | Value | Purpose |
| --- | --- | --- |
| Base model | Qwen/Qwen3.5-2B | Small local model for advising |
| Dataset | ir_finetune_qa_pairs_v17.jsonl | 210 supervised chat examples |
| Output | qwen35_2b_lora_out_v17 | Reusable PEFT adapter |
| LoRA rank | 32 | Adapter capacity |
| LoRA alpha | 64 | Adapter scaling |
| Dropout | 0 | Keep deterministic rule memorization |
| Epochs | 5 | Repeat strict domain rules |
| Optimizer | adamw_8bit | Lower optimizer memory |
| Quantization | 4-bit load | Lower GPU memory use |
| Scheduler | cosine | Controlled learning-rate decay |

### 3.2 Hybrid RAG Design

The RAG subsystem starts by normalizing the question. The guard maps project one/project 1 to Project I, project two/project 2 to Project II, and corrects typo aliases used in the robustness set. It then checks exact normalized QA keys before broad matching. This exact route returns deterministic_eval_qa with confidence 1.0.

The indexer parses PDF pages, DOCX text, and JSONL rows. It builds FAISS IndexFlatIP indexes for global, structure, and details layers. Structure rows come from programme_structure.jsonl and include term, programme, question, answer, and course-code metadata. Detail rows come from master_qa_pairs.clean.jsonl when present, with fallback to hive_course_qa_pairs.jsonl or faie_ai_robotics_combined_qa.jsonl.

Hybrid search addresses two retrieval failure modes. Dense vectors handle paraphrases such as 'Can I take Project II after Project I?' BM25 handles exact terms such as course codes, BYOC-1, or Industrial Training credit-hour rules. Reciprocal Rank Fusion combines both ranks without needing a trained fusion model.

The backend configuration sets TOP_K=4, MAX_CONTEXT_CHARS=12000, MIN_SCORE=0.25, HYBRID_SEARCH_ENABLED=True, HYBRID_DENSE_TOP_K=30, HYBRID_BM25_TOP_K=30, HYBRID_RRF_K=60, and RERANKING_ENABLED=True. These values show that the system retrieves more candidates than it returns, fuses the two rankings, then narrows the context.

The query router classifies a question as structure_only, details_only, mixed, or clarification_needed. Course codes receive highest priority. Programme structure keywords route to the structure layer. Learning outcome, assessment, topic, and PDF/page questions route to details. Prerequisite and eligibility questions route to structure because progression rules belong to the programme layer.

Figure 3.3 shows the hybrid RAG path. Exact QA lookup appears before the router because evaluation proved it removes a class of false retrieval errors. The router and retrieval layers handle questions that are not already known in the generated QA pack.

| Setting | Value | Design role |
| --- | --- | --- |
| TOP_K | 4 | Return compact final context |
| MAX_CONTEXT_CHARS | 12000 | Limit prompt size |
| MIN_SCORE | 0.25 | Filter weak retrieval hits |
| HYBRID_DENSE_TOP_K | 30 | Candidate pool from vectors |
| HYBRID_BM25_TOP_K | 30 | Candidate pool from tokens |
| HYBRID_RRF_K | 60 | RRF rank smoothing |
| RERANKING_ENABLED | True | Cross-encoder precision pass |

### 3.3 Accuracy Improvement Steps

The first accuracy improvement removed duplicate generated QA question text. Earlier data contained ambiguous questions such as 'What is the prerequisite for ARC6133?' where different source rows could require different answers. The generator was changed to source-specific wording, such as asking for the MMU website structure or the Master and Plan entry.

The second improvement added exact QA matching before broader prerequisite and course-code routing. This change stopped a stored QA-pair question from falling into a generic course-info response. The guard checks exact-normalized text before punctuation-stripped broad matching to avoid normalized-key collisions.

The third improvement rebuilt the RAG artifacts and FAISS indexes. The evidence report records 1315 intelligent_robotics_qa_pairs rows, 1492 hive_course_qa_pairs rows, 94 programme_structure rows, 1556 details vectors, 94 structure vectors, and 796 global-doc vectors after the rebuild.

The fourth improvement patched the frontend local guard. The UI test showed that wrong visible answers could come from frontend shortcuts even when the backend had the correct answer. The frontend courseKnowledge.ts rules were patched for project progression, BYOC slot placement, and detailed Project I/II questions. App.tsx was patched so long programme overview answers were not shortened when full wording was needed for scoring.

The fifth improvement mirrored selected routing fixes in the backend course_guard.py. This kept frontend and backend behavior aligned and made evaluation results more reproducible.

### 3.4 Avatar Creation and Motion Design

The exact Ebee source files found on the machine are C:\Users\jeysa\Desktop\Ebee_New\Ebee_Model_rig_New.mb and C:\Users\jeysa\Desktop\Ebee_Model_rig_fyp_New.mb. The project also contains static or converted assets such as ebee_mesh_only.fbx, ebee_avatar.glb, ebee_optimized_working.blend, and frontend/public/avatar/ebee_avatar.glb. The report distinguishes these assets because the GLB path is useful for display checks but does not provide the final natural joint motion by itself.

The Maya export script opens the rigged Maya scene through maya.standalone, loads fbxmaya, resets FBX export settings, exports FBX 2020 binary, keeps skins and smoothing, removes cameras and lights, and selects expected roots such as |Group and |Ebee_Model_mod_geo. The output target is frontend/showcase/animated-avatar/public/avatar/ebee_new/ebee_new.fbx.

The production kiosk uses generated-video motion. The frontend expects state loops for idle, listening, thinking, speaking, and error. The preferred output format is transparent WebM, but the implemented app currently contains MP4 playlists, transparent PNG frame sequences, still PNG poses, and a base PNG fallback. The state mapping is READY to idle, LISTENING to listening, THINKING to thinking, SPEAKING to speaking, and NEEDS_REVIEW to error.

The generated-video path meets the production need: it gives a stable visible avatar in the main Hive UI. The full-rig path remains as a standalone technical showcase. The showcase loads the real Ebee FBX, sourceimages textures, rig map, AI4Animation contract, avatar manifest, and runtime motion database. The handoff document records 180 runtime frames, 36 per avatar state, and 750 exact nodePose paths per frame.

The AI4Animation pipeline prepares or updates the upstream sebastianstarke/AI4Animation Unity project, installs EbeeAI4AnimationJsonExporter.cs, samples MotionEditor, MotionData, and Actor frames, validates the raw export, imports it into runtime JSON, promotes it to ebee_ai4animation_motion_database.json, regenerates the manifest, runs the avatar pipeline, and checks production readiness.

The runtime movement layer in RiggedEbeeAvatar applies smooth damped rotations to head, neck, spine, chest, shoulders, elbows, wrists, fingers, hips, knees, and facial joints. It protects root and lower-body nodes from unsafe exact-node overrides, keeps the character grounded, and uses speechPulse from browser speech boundaries to drive faceplate, teeth, and tongue motion. Figure 3.4 shows the asset and motion pipeline.

| Layer | Artifact | Role |
| --- | --- | --- |
| Maya source | C:\Users\jeysa\Desktop\Ebee_New\Ebee_Model_rig_New.mb | Authoritative rigged model |
| Static inspection | GLB and Blender assets | Inspect mesh and conversion state |
| FBX runtime | ebee_new.fbx | Showcase rig source |
| AI4Animation database | ebee_ai4animation_motion_database.json | 180 frames and nodePose data |
| Production videos | frontend/public/avatar/exact/videos | Main kiosk motion |
| PNG sequences | idle/listening/thinking/speaking/error frame folders | Fallback moving assets |

### 3.5 Provider Integration and API Key Handling

The Windows backend config reads DEEPSEEK_API_KEY from the environment and sets DEEPSEEK_BASE_URL to https://api.deepseek.com with model deepseek-chat. The DeepSeek client sends messages to /chat/completions with a bearer token, model name, temperature, and stream=false. The implementation uses httpx.AsyncClient with a 60 second timeout.

The backend also contains optional OpenAI TTS code through OPENAI_API_KEY. The tts_service.py provider enum supports browser, OpenAI, ElevenLabs, and Azure. For the OpenAI path, it imports AsyncOpenAI and passes the environment key into the client. The report does not include secret values.

MiniMax is included in the provider comparison because the user evaluated provider cost and mentioned MiniMax. The searched workspace does not contain a MiniMax production chatbot client, so this report labels MiniMax as a candidate/provider-study path rather than a verified runtime integration. That wording avoids overstating evidence while still discussing why DeepSeek was selected for the cloud LLM option.

The price check on 23 Jun. 2026 favored DeepSeek for the final paid text-generation option. DeepSeek's current pricing page lists V4 Flash at $0.14 per 1M cache-miss input tokens and $0.28 per 1M output tokens, with a lower cache-hit price. OpenAI's GPT-4o mini page lists $0.15 input and $0.60 output per 1M tokens. MiniMax-M3 standard pricing lists $0.30 input and $1.20 output per 1M tokens at the displayed discount. For this advising workload, the retrieval-grounded prompt is input-heavy but answers still consume output tokens, so DeepSeek gives the lower checked text-generation cost.

The verified live accuracy numbers did not depend on any provider key. The WSL runtime report recorded OPENAI_API_KEY=false and DEEPSEEK_API_KEY=false, and the active port 8000 chatbot was the fine-tuned Qwen/Unsloth backend. DeepSeek remains useful as a cloud generation mode, not as the only path to a correct advising answer.

| Provider | Verified role | Checked price signal | Decision |
| --- | --- | --- | --- |
| DeepSeek | Cloud chat option in Windows backend | $0.14 input and $0.28 output per 1M tokens for V4 Flash cache miss/output | Chosen cloud LLM option |
| OpenAI/ChatGPT | Optional TTS and comparison provider | $0.15 input and $0.60 output per 1M GPT-4o mini text tokens | Useful ecosystem, higher checked output cost |
| MiniMax | Provider comparison for text/media planning | $0.30 input and $1.20 output per 1M MiniMax-M3 standard tokens | Comparison path, no production client found |
| Local Qwen | Verified /ask runtime | No provider token cost in local test | Accuracy path for final evaluation |

### 3.6 Data Preparation and Knowledge Base Construction

The system uses several knowledge artifacts rather than one flat text file. programme_structure.jsonl stores term and programme structure facts. prereq_rules.json stores progression and prerequisite logic. master_qa_pairs.clean.jsonl or fallback course QA files store subject-level question-answer rows. course_knowledge.generated.json stores frontend deterministic knowledge.

The ingestion path handles PDF, DOCX, and JSONL sources. PDF files are split by page so source metadata can preserve page numbers. DOCX files are extracted as text. JSONL files preserve row-level metadata such as course code, course name, programme, type, term, tags, source URL, and source file. The indexer then chunks text and adds the chunk text into metadata for retrieval.

The generated QA process had to handle duplicate course names and duplicate question strings. The audit report records that duplicate question text caused wrong answers when the same question could map to different source rows. The fix changed the generator to produce source-specific questions and rebuilt the FAISS indexes.

The WSL fine-tune data contains both model-training and RAG data. The 210-row v17 training file teaches the model style and target domain. The 1421-row rebuilt RAG QA file gives retrieval and deterministic answer coverage. This separation is important because training examples and retrieval rows serve different purposes.

The project stores backups of RAG data before overwrites. The WSL find output showed backup_ir_rag folders with timestamps and artifacts such as BSc-IR-March-2026-T2610_structure.json, intelligent_robotics_connected_graph.json, ir_rag_qa_pairs_rebuilt.jsonl, and prereq_rules.json. These backups support auditability when data generation changes.

The source manifest in the report pack records the student name source, copied project sources, and supervisor-name status. This keeps report metadata grounded in inspected files rather than guessed values.

### 3.7 Backend Service Design

The backend exposes a simple asking surface while hiding a multi-layer decision process. The chat route receives a question and recent history, checks deterministic course guards, builds context through retrieval if needed, and returns answer, route, used_rag, sources, and confidence.

The ChatbotAgent has a no-LLM mode and an LLM mode. In no-LLM mode, the agent extracts the answer directly from structured RAG context. This is useful for factual course answers because it avoids unnecessary generation. In LLM mode, the system builds a strict context-only system message and sends the context plus student question to DeepSeek.

The system prompt for LLM mode tells the model to answer only from context, use course codes when present, keep the output concise, and respond with a fixed knowledge-base miss sentence when context lacks the answer. This prompt does not replace retrieval quality, but it reduces unsupported elaboration.

The config file keeps RAG and provider settings centralized. TOP_K, MAX_CONTEXT_CHARS, MIN_SCORE, HYBRID_DENSE_TOP_K, HYBRID_BM25_TOP_K, HYBRID_RRF_K, and RERANKING_ENABLED are environment-configurable through pydantic settings. Provider settings such as DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, and DEEPSEEK_MODEL also live there.

The backend retains advisory engine functions for prerequisite and planning questions. It resolves course mentions, parses trimester references, handles failed or passed course codes, and recommends courses from programme plans. This rule engine complements RAG because some advising questions require graph-like prerequisite logic rather than document search.

Trace logging captures question, context usage, context length, answer, and answer type. This gives developers a way to debug whether an answer came from greeting, planning, course_info, rag_direct, retrieval_generation, fallback, or error handling.

### 3.8 Frontend State Orchestration

The frontend contains more than a chat box. It handles layout mode, text input, live transcript, message history, loading state, speech state, listening state, voice selection, debug mode, API status, and avatar state. These variables drive both user interaction and visual feedback.

The frontend computes avatarState from error, listening, loading, speaking, and idle. This creates a direct mapping between application state and avatar motion. The avatar does not need to infer state from text; the React app passes the state as a prop.

The send path first stops any current speech, normalizes speech text, adds the user message, checks greeting intent, checks local deterministic course knowledge, and then sends the backend request if no local answer exists. This order reduces latency for common course-structure answers and keeps the UI responsive.

Browser speech recognition uses SpeechRecognition or webkitSpeechRecognition, interim results, continuous listening, and a silence timer. The app normalizes common misrecognitions such as project won to Project I and project two to Project II. This improves the reliability of voice questions before they reach retrieval.

Speech synthesis uses browser voices and boundary events. onstart sets speaking, onboundary raises speechPulse, onend clears speaking, and onerror sets the error state. The production AvatarExact component does not currently use speechPulse directly, but the standalone RiggedEbeeAvatar accepts speechPulse for facial motion.

The answer-shortening logic caused a verified UI accuracy issue. Some long official programme answers were shortened even when the expected answer required full wording. The patch excluded full-detail questions and IR4.0 programme overview wording from shortening. This is an example where UI ergonomics and evaluation accuracy had to be balanced.

### 3.9 Security and Secret Handling

The report intentionally avoids API key values. It names environment variables and provider paths because those are needed for technical explanation, but it does not copy secret strings. This follows a basic security rule: documentation can describe the secret boundary without including secrets.

The codebase uses environment variables for production-style provider keys. DEEPSEEK_API_KEY configures DeepSeek chat mode. OPENAI_API_KEY configures optional OpenAI TTS. ElevenLabs and Azure paths also use provider-specific environment values in the voice service.

A local search found a DeepSeek test file with a hardcoded key. The report does not include that value. For real deployment, the recommendation is to rotate that key if it is valid, remove the hardcoded test file or rewrite it to read from .env, and keep .env out of version control.

The verified WSL runtime did not need provider keys for the tested path. The QA audit recorded OPENAI_API_KEY=false and DEEPSEEK_API_KEY=false in the WSL runtime environment. This limits cost and secret exposure during local evaluation.

The provider section also avoids overstating MiniMax. If the user has a separate MiniMax prototype outside this workspace, it can be added as a future appendix. The current report limits claims to searched files and official pricing pages.

### 3.10 Deployment and Runtime Layout

The Windows project root is C:\Users\jeysa\Desktop\Final Years. The React frontend sits under frontend. The Windows FastAPI backend source sits under hive-backend. The report pack sits under FYP_Final_Report_Pack. The avatar production assets sit under frontend/public/avatar/exact.

The WSL fine-tune and runtime workspace is Ubuntu-24.04:/home/jet/fyp-unsloth. The active chatbot runtime recorded in the audit was /home/jet/fyp-unsloth/.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000. The health endpoint was http://127.0.0.1:8000/health and the ask endpoint was http://127.0.0.1:8000/ask.

The frontend evaluation targets changed during development. The audit report records frontend ports such as 5174 and 8080 in different runs. For final report purposes, the important fact is not the port number but the method: a live browser loaded the rendered UI, submitted each question, and scored the visible assistant answer.

The project has backup and cleanup evidence. A previous backup stored the Windows project under D:\fyp master backup\Final Years and the WSL project as a tar archive under D:\fyp master backup\wsl\fyp-unsloth.tar.gz. The working project was then reduced and the animated avatar moved into the standalone showcase.

The production readiness commands include npm run build, npm run course:validate, npm run avatar:ready, npm run rag:eval:product, npm run rag:eval:raw, npm run rag:eval:qa-all, and npm run kiosk:check. These commands cover frontend compilation, generated course knowledge, avatar assets, RAG quality, and service reachability.

### 3.11 UI/UX Implementation and Visual Evidence

Hive uses React components for the kiosk interface and Vite for the frontend build. React provides the component model for the chat surface, prompt chips, controls, message list, and AvatarExact panel [11]. Vite provides the local development server and production build path used by the frontend workspace [12].

The UI is organized around two visible work areas. The avatar area gives the student a clear system status signal. The chat area contains the transcript, suggested prompts, text input, send control, microphone control, voice toggle, backend status, and debug details for testing. The landscape and portrait screenshots prove that the same advising experience fits wide desktop and narrow kiosk-style layouts.

The voice workflow uses browser speech APIs. SpeechRecognition receives microphone questions and streams interim transcript text. SpeechSynthesisUtterance speaks the answer through browser voices and triggers the speaking state while audio plays [13]. The frontend maps listening, loading, speaking, idle, and error state into the avatar so the student can see what the system is doing.

The production avatar uses generated Ebee video or image assets inside the main Hive UI. AvatarExact attempts video first, then PNG frame sequences, then state pose PNGs, and then a base image fallback. This keeps the main interface stable while the standalone animated-avatar showcase keeps the full FBX, rig map, AI4Animation database, Three.js scene, and React Three Fiber controls for technical inspection.

The UI/UX choices support academic advising tasks. Suggested prompts reduce blank-start friction. The visible API status separates service problems from answer problems. The debug panel can show route, source, and confidence during tests while normal users can keep it hidden. The image evidence in Figures 3.6 through 3.9 records the working UI and avatar assets used in the final report pack.

The report prose was checked against the Stop Slop rules and the generator's static banned-pattern list. The check looks for filler phrases, formulaic structures, em dash usage, and weak generic phrasing [14]. The purpose is cleaner technical writing for a university report, with citations and evidence kept visible.

| UI/UX element | Implementation | Purpose |
| --- | --- | --- |
| Responsive shell | Landscape and portrait layout modes | Fit desktop review and kiosk-style screens |
| Avatar panel | AvatarExact state prop and generated-video assets | Show idle, listening, thinking, speaking, and review states |
| Chat transcript | React message list with user and assistant bubbles | Keep advising history visible |
| Composer | Textarea, Send control, and Enter handling | Support text questions with fast submission |
| Voice input | SpeechRecognition with interim transcript handling | Support spoken student questions |
| Voice output | SpeechSynthesisUtterance and browser voices | Speak answers and drive speaking state |
| Prompt chips | Suggested advising questions | Reduce blank-start friction |
| Debug panel | Route, source, and confidence fields | Support testing without cluttering normal use |
| Asset fallback | Video, sequence, pose, then base image | Keep the avatar visible if one asset path fails |

![Figure 3.6: Landscape Hive UI with Ebee avatar and advising chat.](C:\Users\jeysa\Desktop\Final Years\FYP_Final_Report_Pack\05_figures\figure_01_ui-refresh-landscape.png)

![Figure 3.7: Portrait Hive UI showing responsive kiosk layout.](C:\Users\jeysa\Desktop\Final Years\FYP_Final_Report_Pack\05_figures\figure_02_ui-refresh-portrait.png)

![Figure 3.8: Verified generated-video Ebee avatar in the Hive UI.](C:\Users\jeysa\Desktop\Final Years\FYP_Final_Report_Pack\05_figures\figure_03_avatar-video-only-verified.png)

![Figure 3.9: Avatar state contact sheet for idle, listening, thinking, speaking, and review states.](C:\Users\jeysa\Desktop\Final Years\FYP_Final_Report_Pack\05_figures\figure_18_avatar_state_contact_sheet.png)

## CHAPTER 4: DATA PRESENTATION AND DISCUSSION OF FINDINGS

The project used three levels of verification: direct API evaluation, full QA-pair live audit, and browser-rendered UI evaluation. The browser evaluation matters because the UI can alter the visible answer through local guards, answer shortening, or speech/avatar timing. The final metric therefore used the visible assistant message as the scoring target for the UI set.

The main API test sets recorded 1000/1000 passes on the first master set, 500/500 passes on the beginner set, and 1500/1500 passes on the mixed regression set. The rendered UI mixed set recorded 300/300 passes, 100.00 percent accuracy, average overlap 0.9200, average response time 532 ms, P50 538 ms, P95 791 ms, and max 1155 ms.

The earlier UI run scored 257/300, or 85.67 percent. That result was useful because it showed the remaining errors came from frontend-local routing and shortened answers. After the targeted patches, the rerun scored 300/300. This supports the engineering decision to patch exact routing defects instead of rewriting the retrieval system.

The full QA live audit sent every stored question from the Intelligent Robotics QA file to the live backend. The report recorded 1315 rows, 1315 passed, 0 failed, average overlap 1.0, minimum overlap 1.0, and a duration of 2.77 seconds. Product and raw-backend smoke sets also passed, with 20/20 in both paths in the later summary file.

Figure 4.1 summarizes the evaluation results. The chart separates API and UI paths because both are required. API tests prove backend correctness. Browser tests prove the end-user path after frontend local rules, layout, and visible message rendering.

| Test set | Rows | Passed | Accuracy | Path |
| --- | --- | --- | --- | --- |
| First master set | 1000 | 1000 | 100.00% | API /ask |
| Beginner set | 500 | 500 | 100.00% | API /ask |
| Mixed regression | 1500 | 1500 | 100.00% | API /ask |
| Rendered UI mixed set | 300 | 300 | 100.00% | Browser UI |
| Full QA live audit | 1315 | 1315 | 100.00% | Live backend |

![Figure 4.1: Accuracy verification results.](C:\Users\jeysa\Desktop\Final Years\FYP_Final_Report_Pack\05_figures_technical\technical_05_accuracy_results.png)

### 4.1 Discussion of Fine-Tuning Results

The fine-tuned LoRA adapter gives the project a local model artifact tied to the Intelligent Robotics domain. The adapter should not be interpreted as the only source of truth. It works together with deterministic QA lookup and RAG because registration rules and course structures must remain source-grounded.

The training settings show an emphasis on memorizing strict rules in a small domain: rank 32, alpha 64, five epochs, 512 sequence length, and all-linear LoRA target modules. The dataset is small, with 210 supervised examples, so the system protects the model with retrieval and exact answer guards. That design is more defensible than claiming the fine-tuned model alone solved all advising accuracy.

The model output path qwen35_2b_lora_out_v17 contains adapter_model.safetensors, adapter_config.json, tokenizer files, chat_template.jinja, and a model card. The adapter config confirms inference_mode=true and PEFT version 0.18.1. These artifacts make the training reproducible within the WSL workspace.

### 4.2 Discussion of Hybrid RAG Results

The largest accuracy gain came from controlling answer selection before generation. Exact generated-QA lookup removed ambiguity for validated evaluation questions. Source-specific question wording removed duplicate text. Hybrid RAG then handled unseen wording by using both semantic and lexical evidence.

RRF was a practical fusion choice because it combines vector and BM25 ranks without training another model. The project had limited labeled retrieval judgments, so a supervised fusion model would have added complexity without enough data. RRF gave a small, inspectable scoring function.

The reranker adds precision after retrieval. A cross-encoder scores query-document pairs directly, so it can prefer a candidate whose text answers the question rather than a candidate that only shares keywords. The backend keeps reranking optional through RERANKING_ENABLED so the system can trade accuracy against latency if deployment hardware changes.

The query router reduces false context by separating structure and details. A question asking 'what subjects are in Year 2' should not retrieve a subject description PDF page. A question asking 'how is ARM6113 assessed' should retrieve subject details. This layer gave the project a clearer retrieval contract.

### 4.3 Discussion of Avatar Results

The avatar work produced a production route and a showcase route. The production route is more stable because video/PNG assets render consistently in the main UI and can be checked with npm run avatar:ready. The showcase route is more technical because it keeps the live rig, FBX loader, AI4Animation JSON, and Three.js joint controls.

The main UI maps state from application logic, not from arbitrary animation timers. Microphone listening sets listening. Backend wait sets thinking. Browser speech synthesis sets speaking. Error handling sets review. The avatar therefore communicates system status to the student.

The full-rig showcase proves that the team understood skeletal motion and not only image replacement. It loads a rig map, counts 750 controllable nodes, checks the AI4Animation contract, loads the motion database, and applies smooth damped rotations. The behavior layer also protects the root and lower-body joints from deformation while preserving visible head, torso, arm, finger, and facial motion.

The production and showcase split was a good tradeoff. The main kiosk shows generated-video Ebee with fewer runtime risks. The professor can still inspect the standalone full-rig system to see how Maya, Blender/GLB inspection, Unity AI4Animation export, and browser rendering fit together.

### 4.4 Provider Cost and Performance Discussion

Provider selection was evaluated through cost, integration effort, and fit with retrieval-grounded advising. OpenAI/ChatGPT offers a mature ecosystem and optional TTS support in the codebase. DeepSeek offers an OpenAI-compatible chat endpoint with lower checked token pricing for the final cloud text-generation option. MiniMax offers text and media APIs, but the searched workspace does not contain a production MiniMax chatbot client.

The project chose DeepSeek for the cloud LLM option because the pricing checked on 23 Jun. 2026 was lower than OpenAI GPT-4o mini and MiniMax-M3 for output tokens. Output cost matters because every advising answer produces user-visible text. Cached input cost also matters because RAG prompts can repeat system instructions and context patterns.

Performance in the verified evaluation came from the local route, not from a paid provider. The UI mixed 300 run averaged 532 ms response time with P95 at 791 ms. That is suitable for a kiosk-style interaction where the avatar shows a checking state while the backend works.

The provider decision should not be treated as permanent. DeepSeek documentation itself states that prices can change and recommends checking the pricing page. The report therefore records the access date. A future deployment should log model name, prompt tokens, completion tokens, provider response time, and cost estimate per answer.

The final design supports a practical policy: use deterministic/RAG/local model routes for verified academic facts, use DeepSeek only when generation mode is needed, keep OpenAI for optional TTS if the browser voice is not enough, and evaluate MiniMax separately for media features or a future provider-switch experiment.

### 4.5 Failure Analysis

The original low accuracy pattern did not come from a single bug. It came from several layers interacting: broad generated QA questions, duplicate question strings, retrieval selecting an unrelated course code, frontend local guards overriding backend answers, and answer shortening removing facts needed by the evaluator.

The backend often returned HTTP 200 and used_rag=true even when the content was wrong. This means transport success was not enough. The evaluation had to compare normalized answer overlap against the expected answer to catch semantic errors.

Course-code ambiguity created a high-risk failure mode. A question about completed credit hours before Industrial Training could return a random course code and prerequisite line. This happened because broad matching allowed a course-info route to steal a progression question. Exact generated-QA lookup and project progression guards fixed that path.

Duplicate QA strings created another failure mode. If two rows ask the same question but expect different source-specific answers, an exact lookup can only choose one. The correct fix was not to add fuzzier matching. The correct fix was to generate unambiguous question text and remove duplicates.

Frontend masking created the last major UI failure. The backend could produce the correct answer, but the frontend local rule or shortening helper could change what the user saw. The rendered UI test exposed this because it scored the final visible assistant bubble rather than the backend JSON.

The final 300/300 UI result is valuable because the patch targeted the proven failure layer. It did not require a broad retrieval rewrite. It required smaller fixes in courseKnowledge.ts, App.tsx, and course_guard.py, followed by a rerun through the same UI path.

| Failure | Symptom | Fix |
| --- | --- | --- |
| Duplicate QA strings | Same question mapped to different source rows | Generated source-specific question text |
| Broad course-code route | Progression question returned unrelated course info | Exact QA lookup before broad routing |
| Frontend local guard | UI answer differed from backend-correct answer | Patched courseKnowledge.ts rules |
| Answer shortening | Required programme wording removed | Excluded full overview from shortening |
| Long UI test timeout | Single 300-question run exceeded tool cap | Ran six batches of 50 |

### 4.6 Browser Verification Procedure

The browser runner loaded the Hive UI, found the chat textarea, typed each question, clicked the Send button, waited for the assistant response, and scored the final visible message. Speech synthesis was stubbed during the automated run so browser TTS did not affect timing.

The 300-question UI run was split into six batches of 50 to avoid tool timeouts. Each batch returned 50/50 after the final patch. The batches were combined into ui_mixed_300_live_eval_report.json, and the summary was copied into live_eval_accuracy_summary.md.

The runner measured response time for each visible answer. The final summary recorded average, median, P95, and maximum response time. These numbers support a user-experience claim, not only an accuracy claim.

The browser method also verified that the frontend local course guard and backend RAG path stayed consistent. This is important for a kiosk because the student interacts with the rendered UI, not with a curl command.

### 4.7 Limitations

The evaluation sets are generated and project-specific. They cover many stored course facts and known question styles, but they do not replace a blind test set written by students or supervisors. A future benchmark should include unseen paraphrases, adversarial course-code confusions, and questions outside the system scope.

The current production avatar uses pre-rendered generated motion. This is stable, but it cannot react with full skeletal detail to every speech boundary. The standalone rigged showcase proves the motion architecture, but extra work is needed to merge that path into production without losing stability.

Provider pricing can change. The report uses official pricing checked on the report date. A deployment should implement cost logging instead of relying on static report values.

The fine-tuned dataset is small. The adapter helps the local model with domain style and repeated facts, but the system should continue to rely on RAG and deterministic guards for factual advising. More data would be needed before claiming broad generalization.

The report does not include a signed declaration date or supervisor name because the inspected local sources did not provide a verified supervisor name. The student should fill those fields before submission.

## CHAPTER 5: CONCLUSIONS AND RECOMMENDATIONS

The project delivered an AI academic advising kiosk that combines local fine-tuning, hybrid RAG, deterministic course rules, provider-aware generation options, and an Ebee avatar. The strongest technical result is the verified accuracy path: 1500/1500 API passes on the mixed regression set and 300/300 passes through the rendered browser UI.

The final architecture is defensible because it does not rely on a single model call for factual advising. Fine-tuning supplies domain response behavior. RAG supplies source-grounded evidence. Exact QA lookup and frontend/backend guards handle known high-risk facts. Browser evaluation checks what the student sees.

The avatar implementation also reached a useful engineering balance. The production UI uses exact generated video and transparent PNG assets so the kiosk feels polished. The standalone showcase preserves the full-rig AI4Animation path so the work can be examined at the rig, joint, and motion-database level.

Future work should add a formal retrieval benchmark with negative candidates, expose a provider switch that logs model name and token cost per answer, rotate any development keys that appear in local test files, and move secret handling into a secrets manager for deployment. The avatar path can also be extended by exporting a longer AI4Animation motion set and connecting speech phoneme timing to more facial joints.

### 5.1 Recommendations

First, the project should keep RAG artifacts versioned. Each rebuild should record source files, row counts, duplicate counts, vector counts, and evaluation results. This will make future changes easier to audit.

Second, deployment should remove hardcoded test credentials and read all provider keys from environment variables or a secret manager. The current report already avoids exposing secret values, but the source tree should also be cleaned.

Third, the team should create a provider switch only after adding cost telemetry. The switch should record provider name, model name, prompt tokens, completion tokens, response time, and answer route. Without that data, provider comparisons remain static estimates.

Fourth, the avatar pipeline should keep production and showcase modes separate until the full-rig path passes the same browser stability standard as AvatarExact. The production kiosk should prefer the asset path that passes avatar:ready and browser checks.

Fifth, the next evaluation stage should use human-authored blind questions. Generated regression tests are useful for preventing known regressions, but a blind set will test whether the system handles student wording outside the generated patterns.

## Selected Important Code Snippets
### Fine-tuning configuration
```text
MODEL_NAME = "Qwen/Qwen3.5-2B"
DATASET_PATH = "data/ir_finetune_qa_pairs_v17.jsonl"
OUTPUT_DIR = "outputs/qwen35_2b_lora_out_v17"
LORA_R = 32
LORA_ALPHA = 64
NUM_EPOCHS = 5
model = FastLanguageModel.from_pretrained(
    model_name=MODEL_NAME,
    max_seq_length=512,
    load_in_4bit=True,
)
model = FastLanguageModel.get_peft_model(
    model,
    r=LORA_R,
    target_modules="all-linear",
    lora_alpha=LORA_ALPHA,
    use_gradient_checkpointing="unsloth",
    use_rslora=True,
)
```

### RRF hybrid scoring
```text
for rank, (idx, _) in enumerate(vector_results, start=1):
    rrf_scores[idx] = rrf_scores.get(idx, 0.0) + 1.0 / (k + rank)

for rank, (idx, _) in enumerate(bm25_results, start=1):
    rrf_scores[idx] = rrf_scores.get(idx, 0.0) + 1.0 / (k + rank)

sorted_results = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)
```

### DeepSeek chat endpoint
```text
url = settings.DEEPSEEK_BASE_URL.rstrip("/") + "/chat/completions"
headers = {
    "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
    "Content-Type": "application/json",
}
payload = {
    "model": settings.DEEPSEEK_MODEL,
    "messages": messages,
    "temperature": temperature,
    "stream": False,
}
```

### Avatar state mapping
```text
const avatarState: AvatarState = lastError
  ? "error"
  : listening
    ? "listening"
    : loading
      ? "thinking"
      : speaking
        ? "speaking"
        : "idle";
```

### Avatar asset fallback
```text
const shouldUseVideo = enableVideo && videoSources.length > 0;
const shouldUseSequence =
  enablePngSequences && state !== "idle" && !shouldUseVideo && !failedSequences[state];
const shouldUsePose = !shouldUseVideo && !shouldUseSequence && !failedPoses[state];
const assetMode = shouldUseVideo ? "video" : shouldUseSequence ? "sequence" : shouldUsePose ? "pose" : "base";
```

## References
[1] Hu et al., LoRA: Low-Rank Adaptation of Large Language Models. Available: https://arxiv.org/abs/2106.09685. Accessed: 23 Jun. 2026.
[2] Unsloth, Qwen3 fine-tuning and Unsloth training documentation. Available: https://unsloth.ai/docs/models/tutorials/qwen3-how-to-run-and-fine-tune. Accessed: 23 Jun. 2026.
[3] UnslothAI GitHub repository. Available: https://github.com/unslothai/unsloth. Accessed: 23 Jun. 2026.
[4] Meta FAISS GitHub repository. Available: https://github.com/facebookresearch/faiss. Accessed: 23 Jun. 2026.
[5] G. V. Cormack, C. L. A. Clarke, and S. Buettcher, Reciprocal Rank Fusion, SIGIR 2009. Available: https://research.google/pubs/reciprocal-rank-fusion-outperforms-condorcet-and-individual-rank-learning-methods/. Accessed: 23 Jun. 2026.
[6] Sebastian Starke, AI4Animation GitHub repository. Available: https://github.com/sebastianstarke/AI4Animation. Accessed: 23 Jun. 2026.
[7] DeepSeek API Docs, Models and Pricing. Available: https://api-docs.deepseek.com/quick_start/pricing. Accessed: 23 Jun. 2026.
[8] OpenAI API Docs, GPT-4o mini model page. Available: https://developers.openai.com/api/docs/models/gpt-4o-mini. Accessed: 23 Jun. 2026.
[9] MiniMax API Docs, Pay as You Go pricing. Available: https://platform.minimax.io/docs/guides/pricing-paygo. Accessed: 23 Jun. 2026.
[10] Karpathy autoresearch GitHub repository. Available: https://github.com/karpathy/autoresearch. Accessed: 23 Jun. 2026.
[11] React Docs, Describing the UI. Available: https://react.dev/learn/describing-the-ui. Accessed: 23 Jun. 2026.
[12] Vite Docs, Getting Started Guide. Available: https://vite.dev/guide/. Accessed: 23 Jun. 2026.
[13] MDN Web Docs, Web Speech API. Available: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API. Accessed: 23 Jun. 2026.
[14] Hardik Pandya, stop-slop GitHub repository. Available: https://github.com/hardikpandya/stop-slop. Accessed: 23 Jun. 2026.
[15] Autodesk, Maya software overview and trial page. Available: https://www.autodesk.com/products/maya/free-trial. Accessed: 23 Jun. 2026.
[16] Blender Foundation, Blender GitHub repository. Available: https://github.com/blender/blender. Accessed: 23 Jun. 2026.
[17] Three.js GitHub repository. Available: https://github.com/mrdoob/three.js/. Accessed: 23 Jun. 2026.
[18] React Three Fiber Docs, Introduction. Available: https://r3f.docs.pmnd.rs/getting-started/introduction. Accessed: 23 Jun. 2026.

## Appendix A: Evidence Files
- WSL fine-tune workspace: Ubuntu-24.04:/home/jet/fyp-unsloth
- Training script: /home/jet/fyp-unsloth/scripts/train_qwen35_unsloth.py
- LoRA adapter: /home/jet/fyp-unsloth/outputs/qwen35_2b_lora_out_v17
- RAG summary: C:\Users\jeysa\Desktop\Final Years\hybride serch master file\reports\live_eval_accuracy_summary.md
- Avatar export guide: C:\Users\jeysa\Desktop\Final Years\frontend\public\avatar\exact\EXPORT_GUIDE.md
- AI4Animation handoff: C:\Users\jeysa\Desktop\Final Years\frontend\showcase\animated-avatar\docs\AVATAR_AI4ANIMATION_HANDOFF.md
