# Hive RAG Accuracy Status

Generated from:

- `rag-eval-report.product.json`
- `rag-eval-report.raw-backend.json`

## Summary

- Commercial product path: 20/20 passed
- Raw backend path: 20/20 passed

## Interpretation

The commercial kiosk path is protected by generated deterministic course-structure knowledge and backend fallback. The raw backend path is evaluated against the fine-tuned Intelligent Robotics backend scope: project/progression rules plus rebuilt Intelligent Robotics year, BYOC, university-subject, and prerequisite coverage.

## Product Results

| Case | Status | Gaps |
| --- | --- | --- |
| project_i_prereq | PASS | - |
| project_i_simple | PASS | - |
| project_ii_prereq | PASS | - |
| course_code_query | PASS | - |
| progression_rules | PASS | - |
| robotics_year_1 | PASS | - |
| robotics_year_1_codes | PASS | - |
| robotics_faculty | PASS | - |
| robotics_accreditation | PASS | - |
| robotics_page_actions | PASS | - |
| robotics_dkm_bridging_note | PASS | - |
| robotics_year_2 | PASS | - |
| robotics_year_3 | PASS | - |
| robotics_industrial_training | PASS | - |
| robotics_byoc_march_recommendation | PASS | - |
| robotics_mpu | PASS | - |
| robotics_masterplan_assessment | PASS | - |
| robotics_masterplan_clo | PASS | - |
| robotics_masterplan_alias | PASS | - |
| robotics_masterplan_topics | PASS | - |

## Raw Backend Results

| Case | Status | Gaps |
| --- | --- | --- |
| project_i_prereq | PASS | - |
| project_i_simple | PASS | - |
| project_ii_prereq | PASS | - |
| course_code_query | PASS | - |
| progression_rules | PASS | - |
| robotics_year_1 | PASS | - |
| robotics_year_1_codes | PASS | - |
| robotics_faculty | PASS | - |
| robotics_accreditation | PASS | - |
| robotics_page_actions | PASS | - |
| robotics_dkm_bridging_note | PASS | - |
| robotics_year_2 | PASS | - |
| robotics_year_3 | PASS | - |
| robotics_industrial_training | PASS | - |
| robotics_byoc_march_recommendation | PASS | - |
| robotics_mpu | PASS | - |
| robotics_masterplan_assessment | PASS | - |
| robotics_masterplan_clo | PASS | - |
| robotics_masterplan_alias | PASS | - |
| robotics_masterplan_topics | PASS | - |

## Backend Fix Command

```powershell
$env:HIVE_BACKEND_PATH='C:\Users\jeysa\Desktop\Final Years\hive-backend'
npm run backend:patch:status
npm run backend:patch:check
npm run backend:patch:apply
npm run rag:eval:raw
```
