import json
import re
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
KB = ROOT / "clean_data" / "kb"
OUT = ROOT / "clean_data" / "eval" / "master_qa_accuracy_1500.jsonl"
MANIFEST = ROOT / "manifests" / "master_qa_accuracy_1500_manifest.json"
MMU_URL = "https://www.mmu.edu.my/programmes-by-faculty-all/programmes-by-faculty-faie/bachelor-of-science-hons-in-intelligent-robotics/"


TYPO_MAP = {
    "What": "Wat",
    "what": "wat",
    "Which": "Wich",
    "which": "wich",
    "How": "Hw",
    "how": "hw",
    "In": "Inn",
    "in": "inn",
    "Intelligent": "Inteligent",
    "intelligent": "inteligent",
    "Robotics": "Robotcs",
    "robotics": "robotcs",
    "programme": "programe",
    "program": "progam",
    "course": "corse",
    "courses": "corses",
    "credit": "creadit",
    "credits": "creadits",
    "hours": "hurs",
    "prerequisite": "prerequsitie",
    "requirements": "requirments",
    "Electrical": "Electical",
    "Calculus": "Calclus",
    "Industrial": "Indutrial",
    "assessment": "assesment",
    "faculty": "facuty",
}


STOPWORDS = {
    "about", "after", "also", "answer", "before", "between", "course",
    "courses", "credit", "credits", "does", "from", "have", "hours",
    "intelligent", "lists", "programme", "question", "robotics", "should",
    "student", "students", "that", "their", "there", "this", "what",
    "when", "which", "with", "year",
}


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def load_jsonl(path):
    rows = []
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def compact(text):
    return re.sub(r"\s+", " ", str(text or "")).strip()


def fact(question, answer, category, source_id, source, source_url=MMU_URL, **extra):
    return {
        "question": compact(question),
        "expected_answer": compact(answer),
        "category": category,
        "source_record_id": source_id,
        "source": source,
        "source_url": source_url,
        **{k: v for k, v in extra.items() if v not in (None, "", [])},
    }


def classify(row):
    text = " ".join(
        compact(row.get(k)) for k in ("id", "type", "question", "answer", "content", "tags")
    ).lower()
    if "credit" in text:
        return "course_credit_hours"
    if any(k in text for k in ("prereq", "progression", "relationship", "project i", "project ii", "industrial training")):
        return "course_relationship"
    if "entry" in text or "requirement" in text:
        return "entry_requirement"
    if row.get("source_url") == MMU_URL or str(row.get("id", "")).startswith("IR-WEB"):
        return "website_fact"
    return "course_detail"


def typo(text):
    changed = text
    for src, dst in TYPO_MAP.items():
        changed = re.sub(rf"\b{re.escape(src)}\b", dst, changed, count=1)
        if changed != text:
            return changed
    return re.sub(r"\b([A-Za-z]{7,})\b", lambda m: m.group(1)[:-2] + m.group(1)[-1], text, count=1)


def casual_question(question):
    q = compact(question).rstrip("?")
    q = q[:1].lower() + q[1:] if q else q
    return f"Can you tell me {q}?"


def variant_question(base, style):
    if style == "formal":
        return compact(base).rstrip("?") + "?"
    if style == "casual":
        return casual_question(base)
    return typo(compact(base).rstrip("?") + "?")


def keywords(item):
    values = []
    for key in ("course_code", "course_name", "year", "category"):
        if item.get(key):
            values.append(str(item[key]))
    words = re.findall(r"[A-Za-z0-9][A-Za-z0-9()/-]{2,}", item["expected_answer"])
    for word in words:
        low = word.lower()
        if low not in STOPWORDS and word not in values:
            values.append(word)
        if len(values) >= 8:
            break
    return values


def from_course_knowledge(course_doc):
    source = course_doc.get("source", "course_knowledge.generated.json")
    programme = course_doc["label"]
    items = [
        fact(
            "What programme is the Intelligent Robotics knowledge file about?",
            programme,
            "website_fact",
            "course_knowledge.programme",
            source,
        ),
        fact(
            "What are the aliases for the Intelligent Robotics programme?",
            ", ".join(course_doc.get("aliases", [])),
            "course_detail",
            "course_knowledge.aliases",
            source,
        ),
    ]

    for term in course_doc.get("terms", []):
        year = term["label"]
        pairs = list(zip(term.get("courseCodes", []), term.get("courses", [])))
        items.append(fact(
            f"Which courses are listed in {year} for Intelligent Robotics?",
            "; ".join(f"{code} {name}" for code, name in pairs),
            "course_relationship",
            f"course_knowledge.{term['id']}.courses",
            source,
            year=year,
        ))
        for code, name in pairs:
            items.append(fact(
                f"In which year is {name} ({code}) placed?",
                f"{name} ({code}) is listed under {year}.",
                "course_relationship",
                f"course_knowledge.{term['id']}.{code}",
                source,
                course_code=code,
                course_name=name,
                year=year,
            ))

    if course_doc.get("projectRule"):
        rule = course_doc["projectRule"]
        items.append(fact(
            "What is required before taking Project I in Intelligent Robotics?",
            rule,
            "course_relationship",
            "course_knowledge.projectRule",
            source,
        ))
        items.append(fact(
            "What is required before taking Project II in Intelligent Robotics?",
            rule,
            "course_relationship",
            "course_knowledge.projectRule.projectII",
            source,
        ))

    if course_doc.get("industrialTrainingRule"):
        items.append(fact(
            "How many completed credit hours are required before Industrial Training?",
            course_doc["industrialTrainingRule"],
            "course_credit_hours",
            "course_knowledge.industrialTrainingRule",
            source,
        ))

    if course_doc.get("mpuNote"):
        items.append(fact(
            "What does the knowledge file say about MPU or university subjects?",
            course_doc["mpuNote"],
            "course_detail",
            "course_knowledge.mpuNote",
            source,
        ))
    return items


def from_source_facts(src):
    items = []
    simple_fields = {
        "website_title": "What is the MMU website page title for Intelligent Robotics?",
        "page_meta_description": "What does the MMU Intelligent Robotics page meta description say?",
        "page_modified_time": "When was the MMU Intelligent Robotics page last modified?",
        "faculty": "Which faculty offers Bachelor of Science (Honours) in Intelligent Robotics?",
        "duration": "What is the duration of the Intelligent Robotics programme?",
        "registration": "What registration number is listed for Intelligent Robotics?",
        "mqa": "What MQA accreditation is listed for Intelligent Robotics?",
        "description": "What does the MMU website say about the Intelligent Robotics programme?",
    }
    for key, question in simple_fields.items():
        if src.get(key):
            items.append(fact(question, src[key], "website_fact", f"source_facts.{key}", src.get("source", "intelligent_robotics_source_facts.json")))

    for link_group in ("page_action_links", "page_top_links", "page_support_links"):
        links = src.get(link_group) or []
        if links:
            answer = "; ".join(f"{x.get('label')}: {x.get('url')}" for x in links)
            items.append(fact(
                f"What links are listed in {link_group.replace('_', ' ')} on the MMU page?",
                answer,
                "website_link",
                f"source_facts.{link_group}",
                src.get("source", "intelligent_robotics_source_facts.json"),
            ))

    if src.get("page_sections"):
        items.append(fact(
            "Which sections appear on the MMU Intelligent Robotics page?",
            "; ".join(src["page_sections"]),
            "website_fact",
            "source_facts.page_sections",
            src.get("source", "intelligent_robotics_source_facts.json"),
        ))

    for year, courses in (src.get("core_by_year") or {}).items():
        pairs = []
        for course in courses:
            if isinstance(course, dict):
                pairs.append((course.get("code"), course.get("name")))
            else:
                pairs.append((course[0], course[1]))
        answer = "; ".join(f"{code} {name}" for code, name in pairs)
        items.append(fact(
            f"What core courses does the MMU page list for {year}?",
            answer,
            "course_relationship",
            f"source_facts.core_by_year.{year}",
            src.get("source", "intelligent_robotics_source_facts.json"),
            year=year,
        ))
    return items


def from_master_rows(rows):
    items = []
    for row in rows:
        question = row.get("question")
        answer = row.get("answer") or row.get("content")
        if not question or not answer:
            continue
        items.append(fact(
            question,
            answer,
            classify(row),
            row.get("id", "master_qa_pairs.clean.jsonl"),
            row.get("source") or row.get("master_source_file") or "master_qa_pairs.clean.jsonl",
            row.get("source_url") or MMU_URL,
            course_code=row.get("course_code"),
            course_name=row.get("course_name"),
            year=row.get("year"),
        ))
    return items


def priority(item):
    order = {
        "course_credit_hours": 0,
        "course_relationship": 1,
        "website_fact": 2,
        "website_link": 3,
        "entry_requirement": 4,
        "course_detail": 5,
    }
    return order.get(item["category"], 9)


def select_base(items):
    quotas = {
        "course_credit_hours": 140,
        "course_relationship": 180,
        "website_fact": 100,
        "entry_requirement": 20,
        "website_link": 3,
        "course_detail": 57,
    }
    chosen = []
    chosen_keys = set()
    by_category = {}
    for item in items:
        by_category.setdefault(item["category"], []).append(item)

    for category, limit in quotas.items():
        for item in by_category.get(category, [])[:limit]:
            key = item["question"].lower()
            chosen.append(item)
            chosen_keys.add(key)

    for item in sorted(items, key=priority):
        if len(chosen) >= 500:
            break
        key = item["question"].lower()
        if key not in chosen_keys:
            chosen.append(item)
            chosen_keys.add(key)

    return chosen[:500]


def dedupe(items):
    seen = set()
    unique = []
    for item in items:
        key = item["question"].lower()
        if key not in seen:
            seen.add(key)
            unique.append(item)
    return unique


def build():
    course_docs = load_json(KB / "course_knowledge.generated.json")
    source_facts = load_json(KB / "intelligent_robotics_source_facts.json")
    master_rows = load_jsonl(KB / "master_qa_pairs.clean.jsonl")

    items = []
    for course_doc in course_docs:
        items.extend(from_course_knowledge(course_doc))
    items.extend(from_source_facts(source_facts))
    items.extend(from_master_rows(master_rows))

    base = select_base(dedupe(items))
    if len(base) != 500:
        raise RuntimeError(f"Need 500 base facts, found {len(base)}")

    records = []
    for index, item in enumerate(base, start=1):
        for variant, style in enumerate(("formal", "casual", "typo"), start=1):
            out = {
                "id": f"IR-EVAL-{len(records) + 1:04d}",
                "question": variant_question(item["question"], style),
                "expected_answer": item["expected_answer"],
                "expected_keywords": keywords(item),
                "category": item["category"],
                "style": style,
                "variant": variant,
                "has_typo": style == "typo",
                "source_record_id": item["source_record_id"],
                "source": item["source"],
                "source_url": item["source_url"],
            }
            for optional in ("course_code", "course_name", "year"):
                if item.get(optional):
                    out[optional] = item[optional]
            records.append(out)

    return records


def validate(records):
    assert len(records) == 1500
    assert len({r["id"] for r in records}) == 1500
    assert len({r["question"] for r in records}) == 1500
    styles = Counter(r["style"] for r in records)
    assert styles == {"formal": 500, "casual": 500, "typo": 500}
    categories = Counter(r["category"] for r in records)
    for required in ("course_credit_hours", "course_relationship", "website_fact"):
        assert categories[required] > 0, required
    assert sum(r["has_typo"] for r in records) == 500
    assert any(r["source_url"] == MMU_URL for r in records)
    return {"styles": styles, "categories": categories}


def main():
    records = build()
    stats = validate(records)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8", newline="\n") as handle:
        for record in records:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")
    MANIFEST.write_text(json.dumps({
        "output_file": str(OUT),
        "record_count": len(records),
        "style_counts": stats["styles"],
        "category_counts": stats["categories"],
        "source_files": [
            str(KB / "master_qa_pairs.clean.jsonl"),
            str(KB / "course_knowledge.generated.json"),
            str(KB / "intelligent_robotics_source_facts.json"),
        ],
        "source_url": MMU_URL,
    }, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {len(records)} records to {OUT}")
    print(f"wrote manifest to {MANIFEST}")


if __name__ == "__main__":
    main()
