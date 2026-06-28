from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = PROJECT_ROOT / "hive-backend"
MASTER_ROOT = PROJECT_ROOT / "hybride serch master file"

RAW_ROOT = MASTER_ROOT / "raw_sources"
RAW_PROGRAMME = RAW_ROOT / "programme"
RAW_COURSES = RAW_ROOT / "course_pdfs"
RAW_SUBJECTS = RAW_ROOT / "subject_codes"

CLEAN_ROOT = MASTER_ROOT / "clean_data"
CLEAN_KB = CLEAN_ROOT / "kb"
CLEAN_GLOBAL_DOCS = CLEAN_ROOT / "global_docs"
CLEAN_MASTER_QA = CLEAN_ROOT / "master_qa"
MANIFEST_DIR = MASTER_ROOT / "manifests"

BACKEND_KB = BACKEND_ROOT / "data" / "kb"
BACKEND_GLOBAL_DOCS = BACKEND_ROOT / "data" / "global_docs"
BACKEND_INDEX_DIR = BACKEND_ROOT / "data" / "indexes" / "global"

MASTER_QA_NAME = "master_qa_pairs.clean.jsonl"


def ensure_dirs() -> None:
    for path in [
        RAW_PROGRAMME,
        RAW_COURSES,
        RAW_SUBJECTS,
        CLEAN_KB,
        CLEAN_GLOBAL_DOCS,
        CLEAN_MASTER_QA,
        MANIFEST_DIR,
        BACKEND_KB,
        BACKEND_GLOBAL_DOCS,
    ]:
        path.mkdir(parents=True, exist_ok=True)


def classify_raw_source(path: Path) -> Path:
    name = path.name.lower()
    if name.endswith(".docx"):
        return RAW_SUBJECTS / path.name
    if "bsc-ir" in name or "intelligent robotics" in name:
        return RAW_PROGRAMME / path.name
    return RAW_COURSES / path.name


def arrange_raw_sources() -> list[dict[str, Any]]:
    arranged = []
    for source in sorted(MASTER_ROOT.iterdir()):
        if not source.is_file():
            continue
        if source.suffix.lower() not in {".pdf", ".docx"}:
            continue
        target = classify_raw_source(source)
        if target.exists():
            arranged.append({"source": str(source), "target": str(target), "action": "already_exists"})
            continue
        shutil.move(str(source), str(target))
        arranged.append({"source": str(source), "target": str(target), "action": "moved"})
    return arranged


def copy_tree_files(source_root: Path, target_root: Path, suffixes: set[str] | None = None) -> list[dict[str, Any]]:
    copied = []
    if not source_root.exists():
        return copied
    for source in sorted(p for p in source_root.rglob("*") if p.is_file()):
        if suffixes and source.suffix.lower() not in suffixes:
            continue
        rel = source.relative_to(source_root)
        target = target_root / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        copied.append({"source": str(source), "target": str(target), "bytes": target.stat().st_size})
    return copied


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    if not path.exists():
        return records
    with path.open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            if not line.strip():
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(f"{path}:{line_no} is not valid JSONL: {exc}") from exc
            if isinstance(record, dict):
                records.append(record)
    return records


def normalize_master_record(record: dict[str, Any], source_file: str, fallback_id: int) -> dict[str, Any] | None:
    question = str(record.get("question") or "").strip()
    answer = str(record.get("answer") or record.get("content") or "").strip()
    if not question or not answer:
        return None

    normalized: dict[str, Any] = {
        "id": str(record.get("id") or f"MASTER-QA-{fallback_id:05d}"),
        "question": question,
        "answer": answer,
        "content": str(record.get("content") or answer),
        "source_file": source_file,
    }

    for key in [
        "course_code",
        "course_name",
        "programme",
        "type",
        "term",
        "source",
        "source_url",
        "page",
        "tags",
        "course_codes",
    ]:
        if key in record and record[key] not in (None, "", []):
            normalized[key] = record[key]

    tags = normalized.get("tags")
    if tags and not isinstance(tags, list):
        normalized["tags"] = [str(tags)]

    normalized["master_source_file"] = source_file
    return normalized


def build_master_qa() -> dict[str, Any]:
    source_files = [
        BACKEND_KB / "intelligent_robotics_qa_pairs.jsonl",
        BACKEND_KB / "hive_course_qa_pairs.jsonl",
        BACKEND_KB / "programme_structure.jsonl",
        BACKEND_GLOBAL_DOCS / "faie_full_qa.jsonl",
    ]

    seen: set[tuple[str, str, str]] = set()
    master_records: list[dict[str, Any]] = []
    fallback_id = 1

    for source_path in source_files:
        for record in read_jsonl(source_path):
            normalized = normalize_master_record(record, source_path.name, fallback_id)
            fallback_id += 1
            if not normalized:
                continue
            key = (
                str(normalized.get("id", "")).lower(),
                normalized["question"].lower(),
                normalized["answer"].lower(),
            )
            if key in seen:
                continue
            seen.add(key)
            master_records.append(normalized)

    target = CLEAN_MASTER_QA / MASTER_QA_NAME
    with target.open("w", encoding="utf-8", newline="\n") as f:
        for record in master_records:
            f.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")

    shutil.copy2(target, CLEAN_KB / MASTER_QA_NAME)
    shutil.copy2(target, BACKEND_KB / MASTER_QA_NAME)

    return {
        "target": str(target),
        "backend_target": str(BACKEND_KB / MASTER_QA_NAME),
        "records": len(master_records),
        "source_files": [str(path) for path in source_files],
    }


def sync_backend_sources() -> dict[str, Any]:
    kb_copies = copy_tree_files(BACKEND_KB, CLEAN_KB, {".json", ".jsonl", ".yaml", ".yml"})
    global_doc_copies = copy_tree_files(BACKEND_GLOBAL_DOCS, CLEAN_GLOBAL_DOCS, {".pdf", ".docx", ".jsonl"})

    raw_to_clean = copy_tree_files(RAW_ROOT, CLEAN_GLOBAL_DOCS / "master_raw_sources", {".pdf", ".docx"})
    raw_to_backend = copy_tree_files(RAW_ROOT, BACKEND_GLOBAL_DOCS / "master_raw_sources", {".pdf", ".docx"})

    return {
        "kb_files_copied_to_master": len(kb_copies),
        "global_docs_copied_to_master": len(global_doc_copies),
        "raw_sources_copied_to_master_global_docs": len(raw_to_clean),
        "raw_sources_copied_to_backend_global_docs": len(raw_to_backend),
    }


def clear_generated_indexes() -> list[str]:
    removed = []
    if not BACKEND_INDEX_DIR.exists():
        return removed

    allowed_root = BACKEND_INDEX_DIR.resolve()
    for path in BACKEND_INDEX_DIR.glob("*"):
        if not path.is_file():
            continue
        resolved = path.resolve()
        if allowed_root not in resolved.parents:
            raise RuntimeError(f"Refusing to remove index outside {allowed_root}: {resolved}")
        if path.suffix.lower() in {".faiss", ".jsonl"}:
            path.unlink()
            removed.append(str(path))
    return removed


def write_readme(summary: dict[str, Any]) -> None:
    readme = MASTER_ROOT / "README.md"
    readme.write_text(
        "\n".join(
            [
                "# Hive Hybrid Search Master Knowledge Pack",
                "",
                "This folder is the source-of-truth pack for Hive QA/RAG accuracy work.",
                "",
                "## Layout",
                "",
                "- `raw_sources/programme/`: programme brochure/source PDFs.",
                "- `raw_sources/course_pdfs/`: individual course and MPU PDFs.",
                "- `raw_sources/subject_codes/`: subject-code source documents.",
                "- `clean_data/kb/`: backend-ready JSON, JSONL, and YAML knowledge files.",
                "- `clean_data/master_qa/master_qa_pairs.clean.jsonl`: merged deduped QA master file.",
                "- `clean_data/global_docs/`: source documents mirrored for global RAG indexing.",
                "- `manifests/`: generated build manifests.",
                "",
                "## Backend Integration",
                "",
                "The builder syncs `master_qa_pairs.clean.jsonl` into:",
                "",
                "`hive-backend/data/kb/master_qa_pairs.clean.jsonl`",
                "",
                "The backend details index prefers this master QA file, then falls back to the older QA files if it is missing.",
                "",
                "## Rebuild",
                "",
                "Run from `hive-backend`:",
                "",
                "```powershell",
                "python scripts/build_master_knowledge_pack.py",
                "python rebuild_indices.py",
                "```",
                "",
                f"Last generated: {summary['generated_at']}",
                f"Master QA records: {summary['master_qa']['records']}",
                "",
            ]
        ),
        encoding="utf-8",
        newline="\n",
    )


def main() -> None:
    if not MASTER_ROOT.exists():
        raise FileNotFoundError(f"Master folder not found: {MASTER_ROOT}")
    if not BACKEND_ROOT.exists():
        raise FileNotFoundError(f"Backend folder not found: {BACKEND_ROOT}")

    ensure_dirs()
    arranged = arrange_raw_sources()
    sync_summary = sync_backend_sources()
    master_qa = build_master_qa()
    removed_indexes = clear_generated_indexes()

    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "master_root": str(MASTER_ROOT),
        "backend_root": str(BACKEND_ROOT),
        "arranged_raw_sources": arranged,
        "sync": sync_summary,
        "master_qa": master_qa,
        "removed_generated_indexes": removed_indexes,
    }

    manifest_path = MANIFEST_DIR / "master_knowledge_manifest.json"
    manifest_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")
    write_readme(summary)

    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
