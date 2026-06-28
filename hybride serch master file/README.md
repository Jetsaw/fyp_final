# Hive Hybrid Search Master Knowledge Pack

This folder is the source-of-truth pack for Hive QA/RAG accuracy work.

## Layout

- `raw_sources/programme/`: programme brochure/source PDFs.
- `raw_sources/course_pdfs/`: individual course and MPU PDFs.
- `raw_sources/subject_codes/`: subject-code source documents.
- `clean_data/kb/`: backend-ready JSON, JSONL, and YAML knowledge files.
- `clean_data/master_qa/master_qa_pairs.clean.jsonl`: merged deduped QA master file.
- `clean_data/global_docs/`: source documents mirrored for global RAG indexing.
- `manifests/`: generated build manifests.

## Backend Integration

The builder syncs `master_qa_pairs.clean.jsonl` into:

`hive-backend/data/kb/master_qa_pairs.clean.jsonl`

The backend details index prefers this master QA file, then falls back to the older QA files if it is missing.

## Rebuild

Run from `hive-backend`:

```powershell
python scripts/build_master_knowledge_pack.py
python rebuild_indices.py
```

Last generated: 2026-06-18T09:34:28.281326+00:00
Master QA records: 2151
