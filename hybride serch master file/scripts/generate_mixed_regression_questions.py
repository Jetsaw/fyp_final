import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EVAL = ROOT / "clean_data" / "eval"
OUT = EVAL / "mixed_regression_questions_1500.jsonl"
MANIFEST = ROOT / "manifests" / "mixed_regression_questions_1500_manifest.json"


def load_jsonl(path):
    with path.open(encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def main():
    master = load_jsonl(EVAL / "master_qa_accuracy_1500.jsonl")
    beginner = load_jsonl(EVAL / "beginner_general_questions_500.jsonl")
    selected = []
    seen = set()

    def add(row, source_file):
        if len(selected) >= 1500 or row["question"].lower() in seen:
            return
        seen.add(row["question"].lower())
        item = dict(row)
        item["original_id"] = row["id"]
        item["mixed_source_file"] = source_file
        item["id"] = f"IR-MIX-{len(selected) + 1:04d}"
        selected.append(item)

    for i in range(500):
        add(master[i * 2], "master_qa_accuracy_1500.jsonl")
        add(master[i * 2 + 1], "master_qa_accuracy_1500.jsonl")
        add(beginner[i], "beginner_general_questions_500.jsonl")

    for row in master:
        add(row, "master_qa_accuracy_1500.jsonl")
    for row in beginner:
        add(row, "beginner_general_questions_500.jsonl")

    assert len(selected) == 1500
    assert len({row["id"] for row in selected}) == 1500
    assert len({row["question"] for row in selected}) == 1500

    OUT.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8", newline="\n") as handle:
        for row in selected:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    MANIFEST.write_text(json.dumps({
        "output_file": str(OUT),
        "record_count": len(selected),
        "mix": {
            "master_qa_accuracy_1500.jsonl": sum(1 for r in selected if r["mixed_source_file"] == "master_qa_accuracy_1500.jsonl"),
            "beginner_general_questions_500.jsonl": sum(1 for r in selected if r["mixed_source_file"] == "beginner_general_questions_500.jsonl"),
        },
        "category_counts": Counter(row.get("category", "unknown") for row in selected),
        "style_counts": Counter(row.get("style", "none") for row in selected),
        "source_files": [
            str(EVAL / "master_qa_accuracy_1500.jsonl"),
            str(EVAL / "beginner_general_questions_500.jsonl"),
        ],
    }, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {len(selected)} records to {OUT}")
    print(f"wrote manifest to {MANIFEST}")


if __name__ == "__main__":
    main()
