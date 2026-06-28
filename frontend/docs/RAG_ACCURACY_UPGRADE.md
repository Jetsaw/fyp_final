# Hive RAG Accuracy Upgrade

This plan improves answer quality without changing the fine-tuned model. Keep the fine-tune as the response generator and make retrieval deterministic, testable, and source-grounded.

## Decision

Do not add NVIDIA PersonaPlex to the RAG accuracy path. PersonaPlex is a real-time full-duplex speech-to-speech/persona system, so it can be a future voice layer for the kiosk, but it will not fix wrong course answers.

Use this order instead:

1. Rule-first retrieval for course structure, prerequisites, credit hours, progression rules, and course-code lookups.
2. Hybrid retrieval over the course documents using exact lexical matching plus dense embeddings.
3. Rerank the top retrieved chunks before building the LLM context.
4. Run an evaluation set before every demo.

## Recommended Libraries

- Ragas: evaluation metrics and test generation for LLM/RAG applications.
- FlashRank: small CPU-friendly reranking for search and retrieval pipelines.
- Qdrant FastEmbed: lightweight local embedding generation if the backend needs a cleaner embedding path.
- Microsoft GraphRAG: only consider this later if the project must answer broad relationship questions across many documents. It is heavier than needed for course prerequisite accuracy.

Detailed GitHub repo decision matrix:

```text
docs/GITHUB_RAG_REPO_DECISION.md
```

## Backend Patch Shape

The backend source is outside this frontend workspace. I prepared a tailored apply helper here:

```text
scripts/apply-backend-rag-patch.ps1
```

It targets the current backend files under `C:\Users\jeysa\Desktop\Hive\hive-backend` and changes retrieval/routing only, not the fine-tuned model.

The intended FastAPI flow is:

```python
def answer_question(question: str, history: list[dict]) -> dict:
    normalized = normalize_course_query(question)

    rule_answer = try_rule_answer(normalized)
    if rule_answer:
        return {
            "answer": rule_answer.text,
            "sources": rule_answer.sources,
            "used_rag": True,
            "route": "rule_first",
        }

    candidates = hybrid_retrieve(
        query=normalized,
        dense_top_k=30,
        lexical_top_k=30,
    )
    reranked = rerank(question=normalized, documents=candidates, top_k=8)
    context = build_context(reranked)

    return generate_with_finetune(
        question=question,
        history=history,
        context=context,
        sources=[doc.source for doc in reranked],
    )
```

## Rules To Add First

- Normalize course IDs: `ARP6110-P1`, `ARP6110 P1`, `ARP 6110`, and `Project I` should resolve to the same course record.
- Prerequisite queries should search `prereq_rules.json` before free-form document chunks.
- Course structure queries should read the cleaned course structure table first.
- Progression-rule queries must retrieve the progression/course-structure source, not only a single prerequisite edge.
- If a rule source has the answer, return it directly with sources instead of asking the model to infer.

## Current Eval Result

The product path now passes the expanded eval set:

```text
14/14 passed
```

This is achieved by the deterministic course-knowledge guard in `src/courseKnowledge.ts` plus the running backend fallback. The facts are generated from the included course-structure KB into:

```text
src/courseKnowledgeData.ts
scripts/course-knowledge.generated.json
```

Regenerate them with:

```powershell
npm run course:generate
npm run course:validate
```

The latest raw backend check still fails the structure/progression cases:

```text
4/14 passed
```

The backend answered some structure questions with narrow prerequisite facts or wrong course-structure values. Fix that by running the backend apply helper, adding a specific `progression` intent, retrieving the progression/course-structure document first, and returning `used_rag: true` with sources.

Backend helper commands:

```powershell
npm run backend:patch:status
npm run backend:patch:check
npm run backend:patch:apply
npm run rag:eval:raw
```

The apply command creates timestamped backups in the backend folder before modifying backend files.
`npm run rag:eval:raw` is expected to fail before the backend patch is applied.
Restore the latest backup with:

```powershell
npm run backend:patch:restore
```

## Demo Gate

Run the kiosk checks:

```powershell
npm run commercial:check
```

The eval set is in:

```text
scripts/rag-eval-set.json
```

Reports are written to:

```text
rag-eval-report.product.json
rag-eval-report.raw-backend.json
docs/RAG_ACCURACY_STATUS.md
```

Add more cases whenever you find a wrong answer in the UI. The fastest way to improve the product is to turn every failure into a repeatable test.
