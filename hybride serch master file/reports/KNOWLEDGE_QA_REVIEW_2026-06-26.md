# Knowledge And QA Review

Date: 2026-06-26

## Output Files

- Full row review: `hybride serch master file/reports/qa_pair_review.csv`
- Machine summary: `hybride serch master file/reports/qa_pair_review_summary.json`
- This report: `hybride serch master file/reports/KNOWLEDGE_QA_REVIEW_2026-06-26.md`

## Active Runtime Path

The app is not using random loose QA files first. The active details index is built from:

`hive-backend/data/kb/master_qa_pairs.clean.jsonl`

That file is mirrored from:

`hybride serch master file/clean_data/master_qa/master_qa_pairs.clean.jsonl`

The details index currently contains `2,215` chunks from `master_qa_pairs.clean.jsonl`. This means weak rows in the master QA file can directly affect responses.

## QA Review Summary

Active master QA rows reviewed: `2,151`

| Decision | Rows | Meaning |
|---|---:|---|
| `keep` | 1,424 | Useful enough to keep for now. |
| `review` | 432 | Not immediately trash, but too templated, too generic, or needs better answer context. |
| `cut_or_rewrite` | 295 | Low-value or harmful for student-facing answers. Remove or rewrite before rebuilding the index. |

Issue counts:

| Issue | Rows |
|---|---:|
| `repeated_answer_template` | 627 |
| `placeholder_or_non_answer` | 207 |
| `low_user_value_question` | 88 |
| `too_short_answer` | 69 |
| `numeric_answer_needs_context` | 69 |
| `duplicate_question` | 44 |
| `metadata_not_student_advice` | 10 |

## Main Finding

The problem is not the number of QA pairs. The problem is that the master QA file mixes useful advising facts with generated filler rows.

Examples of weak rows:

- Website metadata questions such as page title, meta description, support links, and last-modified date.
- Numbered entry requirement questions like "What is entry requirement 1?" instead of one consolidated entry-requirements answer.
- FAIE catalog placeholders like "Not specified in the provided FAIE course catalog excerpt."
- Generic generated PDF-location questions like "Where in the original PDF is ATE6133 listed?"
- Repeated answers for objective, overview, and skills questions where multiple questions return basically the same sentence.
- Numeric-only answers such as `3`, which can render badly or provide no context.

## Live Response Check

I sent five quick `/ask` requests to the running backend at `http://127.0.0.1:8000`.

Observed bad outputs:

- `How is ATE6133 assessed?` returned: "I'm having trouble connecting to my brain. Please try again."
- `What are the prerequisites for ATE6133?` returned: "I don't have information about ATE6133 in my database. Please check the course code."
- `Where in the original PDF is ATE6133 listed?` returned the same brain-failure style response.
- `How many credits is ATE6133 Wireless Communications?` returned: `ATE6133 — Credits: Prerequisite: None`

So the response issue has two causes:

1. Weak QA rows pollute the retrieval pool.
2. The runtime answer path still depends on the chatbot/LLM fallback for some retrieved context, so weak context becomes weak or failed responses.

## File Map

| File | Rows | Role |
|---|---:|---|
| `hive-backend/data/kb/intelligent_robotics_qa_pairs.jsonl` | 1,421 | Main Intelligent Robotics generated QA/facts. |
| `hive-backend/data/kb/hive_course_qa_pairs.jsonl` | 1,360 | Older course QA set, not directly represented as its own source in the current master after dedupe. |
| `hive-backend/data/kb/programme_structure.jsonl` | 61 | Structure rules, years, entry requirements, BYOC, project progression. |
| `hive-backend/data/global_docs/faie_full_qa.jsonl` | 730 | FAIE catalog QA; many generated template rows need pruning. |
| `hive-backend/data/kb/master_qa_pairs.clean.jsonl` | 2,151 | Active merged details QA source. |
| `hybride serch master file/clean_data/eval/master_qa_accuracy_1500.jsonl` | 1,500 | Eval set, not direct knowledge. |
| `hybride serch master file/clean_data/eval/beginner_general_questions_500.jsonl` | 500 | Eval set, not direct knowledge. |
| `hybride serch master file/clean_data/eval/mixed_regression_questions_1500.jsonl` | 1,500 | Eval set, not direct knowledge. |

## What To Cut First

Start with rows marked `cut_or_rewrite` in:

`hybride serch master file/reports/qa_pair_review.csv`

Highest-value cuts:

- `placeholder_or_non_answer`
- `low_user_value_question`
- PDF page-location questions
- metadata-only website questions
- numeric-only answers without context

## Minimum Fix Path

1. Review `qa_pair_review.csv`.
2. Remove or rewrite the `cut_or_rewrite` rows from the source generator, not only from the built JSONL.
3. Rebuild the master pack:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\hive-backend"
python scripts/build_master_knowledge_pack.py
python rebuild_indices.py
```

4. Re-run a small UI/API smoke set before doing another 300-question run.

Skipped for now: deleting or replacing the active QA file. Add that after you confirm the review CSV, because direct deletion without approval can remove rows you may still want for report evidence or eval coverage.
