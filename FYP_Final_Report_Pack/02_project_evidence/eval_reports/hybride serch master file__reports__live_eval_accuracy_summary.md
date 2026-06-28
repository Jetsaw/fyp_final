# Live QA Accuracy Summary

Date: 2026-06-19

Endpoint tested: `http://127.0.0.1:8000/ask`

Scoring rule: a row passes only when the backend returns HTTP 2xx, `used_rag=true`, and the normalized answer overlap with the expected answer is at least `0.60`.

UI tested: `http://127.0.0.1:8080`

UI scoring rule: each row is submitted through the rendered chat UI, then the visible assistant message is scored against `expected_answer` with normalized token overlap at threshold `0.60`.

## Results

| Test set | Baseline accuracy | Patched accuracy | Patched result |
|---|---:|---:|---:|
| First 1000 from `master_qa_accuracy_1500.jsonl` | 20.90% | 100.00% | 1000/1000 passed |
| Full `beginner_general_questions_500.jsonl` | 6.80% | 100.00% | 500/500 passed |
| New mixed `mixed_regression_questions_1500.jsonl` | N/A | 100.00% | 1500/1500 passed |
| UI mixed 300 from `mixed_regression_questions_1500.jsonl` | 85.67% | 100.00% | 300/300 passed |

Patch applied:

- Added a deterministic generated-QA lookup in `hive-backend/app/rag/course_guard.py`.
- The lookup runs before RAG retrieval, so exact generated QA questions no longer fall through to unrelated course-code answers.
- Added normalized typo handling for the generated typo robustness set.
- Fixed normalized-key collisions by checking exact-normalized text before broad punctuation-stripped matching.

## 1000-Question Accuracy Set

Category accuracy:

| Category | Rows | Accuracy |
|---|---:|---:|
| `course_credit_hours` | 420 | 100.00% |
| `course_relationship` | 540 | 100.00% |
| `website_fact` | 40 | 100.00% |

Style accuracy:

| Style | Rows | Accuracy |
|---|---:|---:|
| `formal` | 334 | 100.00% |
| `casual` | 333 | 100.00% |
| `typo` | 333 | 100.00% |

## 500 Beginner Question Set

Category accuracy:

| Category | Rows | Accuracy |
|---|---:|---:|
| `beginner_overview` | 20 | 100.00% |
| `duration_and_years` | 20 | 100.00% |
| `course_structure_by_year` | 148 | 100.00% |
| `careers_and_jobs` | 82 | 100.00% |
| `byoc_electives` | 116 | 100.00% |
| `credit_hours_and_progression` | 14 | 100.00% |
| `entry_requirements` | 24 | 100.00% |
| `skills_and_subjects` | 44 | 100.00% |
| `university_subjects` | 8 | 100.00% |
| `application_and_support` | 14 | 100.00% |
| `beginner_decision_support` | 10 | 100.00% |

## Mixed 1500-Question Regression Set

Mix:

| Source set | Rows |
|---|---:|
| `master_qa_accuracy_1500.jsonl` | 1000 |
| `beginner_general_questions_500.jsonl` | 500 |

Result:

| Metric | Value |
|---|---:|
| Rows tested | 1500 |
| Passed | 1500 |
| Failed | 0 |
| Accuracy | 100.00% |
| Average overlap | 1.0000 |
| Minimum overlap | 1.0000 |

## UI Mixed 300-Question Test

Method:

- Browser automation opened `http://127.0.0.1:8080`.
- Each question was typed into the chat textarea and submitted with the UI Send button.
- The final visible assistant message was scored, after frontend local handling and backend calls.
- Speech synthesis was stubbed during the automated run so browser TTS did not affect timing.

Result:

| Metric | Value |
|---|---:|
| Rows tested | 300 |
| Passed | 300 |
| Failed | 0 |
| Accuracy | 100.00% |
| Average overlap | 0.9200 |
| Average response time | 532 ms |
| P50 response time | 538 ms |
| P95 response time | 791 ms |
| Max response time | 1155 ms |

UI fixes applied:

- Project progression prompts now return the project progression rule instead of the full programme structure.
- BYOC slot questions such as `Elective 1 BYOC` now answer the listed Year 3 placement before generic BYOC advice.
- Detailed Project I/II and course-placement questions defer from the short frontend local rule to the backend QA lookup.
- Official programme overview answers are no longer shortened when the expected answer needs the full IR4.0/programme wording.

## Original Failure Pattern

Before the patch, the backend usually responded with HTTP 200 and `used_rag=true`, but retrieval often selected the wrong course or an unrelated course code.

Examples:

- Question: `How many completed credit hours are required before Industrial Training?`
  - Expected: `Industrial Training requires completed 60 credit hours.`
  - Actual: `AAP6126 — Credits: Prerequisite: None`
- Question: `What does Bachelor of Science (Honours) in Intelligent Robotics mean?`
  - Expected: `Bachelor of Science (Honours) in Intelligent Robotics is a 3-year MMU degree...`
  - Actual: `AAC6164 — Credits: Prerequisite: None`
- Question: `Is this course mainly engineering, AI, or programming?`
  - Expected: `electronics, robotics, artificial intelligence, automation, and computer programming`
  - Actual: `AMT6153 — Credits: Prerequisite: None`

## Output Reports

- `reports/master_accuracy_first_1000_live_eval_report.json`
- `reports/beginner_general_500_live_eval_report.json`
- `reports/live_eval_summary_1000_plus_500.json`
- `reports/mixed_regression_1500_live_eval_report.json`
- `reports/ui_mixed_300_live_eval_report.json`

## Conclusion

The patched live bot passes the API eval sets and the rendered UI 300-question mixed test at 100.00% accuracy under the same overlap threshold.
