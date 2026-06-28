# GitHub RAG Accuracy Repo Decision

Goal: improve Hive course-answer accuracy without changing the fine-tuned model.

## Decision Summary

Do not add `NVIDIA/personaplex` to the RAG accuracy path. It is a real-time speech-to-speech persona/voice system, so it belongs in a future voice/avatar layer, not in retrieval correctness.

For this project, the best sequence is:

1. Keep the fine-tuned model as the generator.
2. Use deterministic course-structure guards for exact facts.
3. Add backend reranking and stronger structure routing.
4. Add RAG evals and keep them in the demo gate.
5. Consider heavier graph or retriever training systems only if questions become relationship-heavy across many documents.

## Repo Matrix

| Repo | Fit | Use In Hive | Decision |
| --- | --- | --- | --- |
| NVIDIA/personaplex | Voice/persona layer | Future voice avatar, full-duplex speech, persona prompting | Do not use for RAG accuracy |
| LeDat98/NexusRAG | Hybrid retrieval reference | Confirms the useful pattern: vector over-fetch, structured knowledge, cross-encoder reranking, cited context | Use as architecture reference, not as a dependency |
| NovaSearch-Team/RAG-Retrieval | Retriever/reranker tooling | Useful later if training or swapping rerankers becomes necessary | Defer; current fix does not fine-tune models |
| vibrantlabsai/ragas | RAG/LLM evaluation | Regression evals for answer correctness, faithfulness, context quality | Recommended later for backend eval suite |
| PrithivirajDamodaran/FlashRank | Retrieval reranking | Rerank top retrieved course chunks before LLM context | Good lightweight alternative if sentence-transformers reranker is too heavy |
| qdrant/fastembed | Lightweight embeddings | Cleaner local embedding generation if current embeddings become slow or inconsistent | Optional |
| microsoft/graphrag | Graph-based RAG | Course relationship reasoning across many linked docs | Defer; likely too heavy for current course-file scope |

## Current Implementation

The commercial product path currently uses:

```text
src/courseKnowledge.ts
src/courseKnowledgeData.ts
scripts/course-knowledge.generated.json
scripts/evaluate-rag-accuracy.mjs
```

This protects exact course-structure and prerequisite facts while the backend RAG service is being fixed.

The writable backend copy now also has the same deterministic course guard:

```text
C:\Users\jeysa\Desktop\Final Years\hive-backend\app\rag\course_guard.py
C:\Users\jeysa\Desktop\Final Years\hive-backend\data\kb\course_knowledge.generated.json
```

`/api/chat`, `/api/ask`, and root `/ask` in the writable backend can use this guard before falling through to RAG/generation.

## Backend Recommendation

Use the writable backend copy:

```powershell
$env:HIVE_BACKEND_PATH='C:\Users\jeysa\Desktop\Final Years\hive-backend'
npm run backend:patch:status
npm run backend:patch:check
```

Then restart the backend and run:

```powershell
npm run rag:eval:raw
```

The raw backend should improve from the current structure-failing baseline.

## Source Links

- https://github.com/NVIDIA/personaplex
- https://github.com/LeDat98/NexusRAG
- https://github.com/NovaSearch-Team/RAG-Retrieval
- https://github.com/vibrantlabsai/ragas
- https://github.com/PrithivirajDamodaran/FlashRank
- https://github.com/qdrant/fastembed
- https://github.com/microsoft/graphrag
