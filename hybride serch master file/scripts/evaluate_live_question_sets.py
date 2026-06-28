import argparse
import json
import re
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EVAL = ROOT / "clean_data" / "eval"
REPORTS = ROOT / "reports"


def load_jsonl(path, limit):
    rows = []
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                rows.append(json.loads(line))
            if limit and len(rows) >= limit:
                break
    return rows


def normalize(value):
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9%/.-]+", " ", str(value or "").lower())).strip()


def tokens(value):
    return [token for token in normalize(value).split(" ") if len(token) >= 3 or any(ch.isdigit() for ch in token)]


def overlap(expected, actual):
    expected_tokens = sorted(set(tokens(expected)))
    if not expected_tokens:
        return 1.0
    actual_tokens = set(tokens(actual))
    return sum(1 for token in expected_tokens if token in actual_tokens) / len(expected_tokens)


def ask(base_url, question, timeout):
    body = json.dumps({"question": question, "history": []}).encode("utf-8")
    req = urllib.request.Request(
        f"{base_url.rstrip('/')}/ask",
        data=body,
        headers={"content-type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            text = response.read().decode("utf-8", errors="replace")
            payload = json.loads(text) if text else {}
            return response.status, payload, None
    except urllib.error.HTTPError as exc:
        return exc.code, {}, str(exc)
    except Exception as exc:
        return 0, {}, str(exc)


def evaluate_row(base_url, row, threshold, timeout):
    status, payload, error = ask(base_url, row["question"], timeout)
    answer = payload.get("answer") or payload.get("response") or payload.get("message") or ""
    expected = row.get("expected_answer") or row.get("answer") or ""
    score = overlap(expected, answer)
    used_rag = payload.get("used_rag") is True or payload.get("usedRag") is True
    keyword_hits = []
    keyword_misses = []
    for keyword in row.get("expected_keywords") or []:
        if normalize(keyword) in normalize(answer):
            keyword_hits.append(keyword)
        else:
            keyword_misses.append(keyword)
    passed = status >= 200 and status < 300 and used_rag and score >= threshold
    return {
        "id": row.get("id"),
        "question": row.get("question"),
        "category": row.get("category"),
        "style": row.get("style"),
        "status": status,
        "used_rag": used_rag,
        "score": round(score, 4),
        "passed": passed,
        "keyword_hits": keyword_hits,
        "keyword_misses": keyword_misses,
        "error": error,
        "expected_preview": re.sub(r"\s+", " ", expected)[:240],
        "answer_preview": re.sub(r"\s+", " ", str(answer))[:240],
        "sources_count": len(payload.get("sources") or []),
    }


def run_case(name, path, limit, base_url, threshold, concurrency, timeout):
    rows = load_jsonl(path, limit)
    started = time.time()
    results = []
    with ThreadPoolExecutor(max_workers=concurrency) as pool:
        futures = {
            pool.submit(evaluate_row, base_url, row, threshold, timeout): index
            for index, row in enumerate(rows)
        }
        for future in as_completed(futures):
            results.append(future.result())

    results.sort(key=lambda item: item["id"] or "")
    passed = sum(1 for item in results if item["passed"])
    scores = [item["score"] for item in results]
    by_category = Counter(item.get("category") or "unknown" for item in results)
    passed_by_category = Counter(item.get("category") or "unknown" for item in results if item["passed"])
    by_style = Counter(item.get("style") or "none" for item in results)
    passed_by_style = Counter(item.get("style") or "none" for item in results if item["passed"])
    report = {
        "name": name,
        "base_url": base_url,
        "input_file": str(path),
        "limit": limit,
        "threshold": threshold,
        "total": len(results),
        "passed": passed,
        "failed": len(results) - passed,
        "accuracy": round(passed / len(results), 4) if results else 0,
        "average_overlap": round(sum(scores) / len(scores), 4) if scores else 0,
        "minimum_overlap": min(scores) if scores else 0,
        "duration_seconds": round(time.time() - started, 2),
        "category_counts": by_category,
        "category_accuracy": {
            category: round(passed_by_category[category] / count, 4)
            for category, count in by_category.items()
        },
        "style_counts": by_style,
        "style_accuracy": {
            style: round(passed_by_style[style] / count, 4)
            for style, count in by_style.items()
        },
        "failures": [item for item in results if not item["passed"]][:100],
        "results": results,
    }
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    parser.add_argument("--threshold", type=float, default=0.60)
    parser.add_argument("--concurrency", type=int, default=8)
    parser.add_argument("--timeout", type=float, default=30)
    args = parser.parse_args()

    cases = [
        ("master_accuracy_first_1000", EVAL / "master_qa_accuracy_1500.jsonl", 1000),
        ("beginner_general_500", EVAL / "beginner_general_questions_500.jsonl", 500),
        ("mixed_regression_1500", EVAL / "mixed_regression_questions_1500.jsonl", 1500),
    ]
    REPORTS.mkdir(parents=True, exist_ok=True)
    reports = []
    for name, path, limit in cases:
        report = run_case(name, path, limit, args.base_url, args.threshold, args.concurrency, args.timeout)
        out = REPORTS / f"{name}_live_eval_report.json"
        out.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
        reports.append({k: report[k] for k in ("name", "input_file", "limit", "threshold", "total", "passed", "failed", "accuracy", "average_overlap", "minimum_overlap", "duration_seconds")})
        print(f"{name}: {report['passed']}/{report['total']} passed accuracy={report['accuracy']} avg_overlap={report['average_overlap']} report={out}")

    summary = {
        "base_url": args.base_url,
        "threshold": args.threshold,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "reports": reports,
    }
    summary_path = REPORTS / "live_eval_summary_1000_plus_500.json"
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"summary: {summary_path}")


if __name__ == "__main__":
    main()
