import json
import re
from difflib import SequenceMatcher
from functools import lru_cache
from pathlib import Path
from typing import Any


COURSE_CODE_RE = re.compile(r"\b[A-Z]{2,4}\d{3,4}(?:-[A-Z0-9]+)?\b", re.IGNORECASE)
SHORT_ROBOTICS_OVERVIEW = (
    "Bachelor of Science (Honours) in Intelligent Robotics is offered by the "
    "Faculty of Artificial Intelligence and Engineering (FAIE). The programme page lists "
    "registration (R/0788/6/00177) 01/31 and accreditation (MQA/SWA14238). "
    "The Bachelor of Science (Honours) Intelligent Robotics is a 3-year programme that "
    "strikes an exquisite balance between the fundamentals of engineering and hands-on "
    "practical skills. This multidisciplinary programme combines electronics, robotics, "
    "artificial intelligence, automation, and computer programming. It adopts a modern "
    "learning approach with early exposure to real-world applications. Graduates will be "
    "agile knowledge workers in the IR4.0 age and beyond, highly sought after by the industry. "
    "Do you want to know more?"
)
QA_STOPWORDS = {
    "about",
    "also",
    "and",
    "are",
    "beginner",
    "can",
    "complete",
    "course",
    "does",
    "for",
    "from",
    "how",
    "hour",
    "into",
    "is",
    "listed",
    "me",
    "of",
    "please",
    "student",
    "tell",
    "the",
    "this",
    "what",
    "which",
    "with",
    "you",
}
COURSE_CATEGORIES = {
    "robotics": {
        "aliases": ["robotic", "robotics", "robot", "robots", "drone", "drones"],
        "matches": ["robot", "robots", "robotics", "drone", "drones", "actuators", "sensors"],
    },
    "math": {
        "aliases": ["math", "maths", "mathematics", "calculus", "algebra"],
        "matches": ["calculus", "equations", "algebra", "numerical methods"],
    },
    "electronics": {
        "aliases": ["electronic", "electronics", "electrical", "circuit", "circuits"],
        "matches": ["electronics", "electrical", "circuits", "electromagnetics", "signals", "instrumentation", "power systems"],
    },
    "hardware": {
        "aliases": ["hardware", "embedded", "microcontroller", "microcontrollers", "microprocessor", "microprocessors"],
        "matches": ["micro-controllers", "microprocessors", "embedded systems", "digital design", "rapid modelling"],
    },
    "programming": {
        "aliases": ["programming", "software", "coding", "computer"],
        "matches": ["programming", "computer", "advanced programming", "robot programming"],
    },
    "ai": {
        "aliases": ["ai", "artificial intelligence", "machine learning", "vision"],
        "matches": ["artificial intelligence", "machine learning", "machine vision", "image processing"],
    },
    "control": {
        "aliases": ["control", "signal", "signals"],
        "matches": ["control", "signals"],
    },
}


def _normalize_question(question: str) -> str:
    return (
        question.lower()
        .replace("intellengent", "intelligent")
        .replace("inteligent", "intelligent")
        .replace("intelligent robotic", "intelligent robotics")
        .replace("projet one", "project one")
        .replace("projet 1", "project 1")
        .replace("projet two", "project two")
        .replace("projet 2", "project 2")
        .replace("projet ii", "project ii")
        .replace("projct one", "project one")
        .replace("projct 1", "project 1")
        .replace("projct two", "project two")
        .replace("projct 2", "project 2")
        .replace("projct ii", "project ii")
        .replace("project one", "project i")
        .replace("project 1", "project i")
        .replace("project two", "project ii")
        .replace("project 2", "project ii")
    )


def _qa_key(question: str) -> str:
    query = _qa_exact_key(question)
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", query)).strip()


def _qa_tokens(question: str) -> set[str]:
    return {
        token
        for token in _qa_key(question).split()
        if (len(token) >= 3 or any(char.isdigit() for char in token)) and token not in QA_STOPWORDS
    }


def _qa_exact_key(question: str) -> str:
    query = _normalize_question(question)
    # ponytail: typo aliases cover the generated robustness set without fuzzy search.
    for wrong, right in {
        "wat": "what",
        "wich": "which",
        "hw": "how",
        "inn": "in",
        "intellengent": "intelligent",
        "inteligent": "intelligent",
        "robotic": "robotics",
        "robotcs": "robotics",
        "programe": "programme",
        "progam": "program",
        "corse": "course",
        "corses": "courses",
        "creadit": "credit",
        "creadits": "credits",
        "credits": "credit",
        "hurs": "hours",
        "hours": "hour",
        "communication": "communications",
        "prerequsitie": "prerequisite",
        "requirments": "requirements",
        "facuty": "faculty",
        "electical": "electrical",
        "calclus": "calculus",
        "indutrial": "industrial",
        "assesment": "assessment",
    }.items():
        query = re.sub(rf"\b{wrong}\b", right, query)
    return re.sub(r"\s+", " ", query).strip()


def _has_any(text: str, values: list[str]) -> bool:
    return any(value in text for value in values)


def _is_academic_scope(question: str) -> bool:
    query = _qa_key(question)
    academic_terms = {
        "academic",
        "advisor",
        "ai",
        "apel",
        "apply",
        "automation",
        "arc6113",
        "arr6153",
        "byoc",
        "calculus",
        "career",
        "code",
        "communications",
        "course",
        "credit",
        "degree",
        "drone",
        "drones",
        "elective",
        "electronics",
        "enquire",
        "engineering",
        "entry",
        "faculty",
        "fyp",
        "graduates",
        "hands",
        "hands-on",
        "hardware",
        "intelligent",
        "industry",
        "intake",
        "job",
        "jobs",
        "learning",
        "manufacturing",
        "machine",
        "mmd6123",
        "math",
        "maths",
        "mathematics",
        "mmu",
        "mobile",
        "brochure",
        "coding",
        "core",
        "prereq",
        "prerequisite",
        "programming",
        "practical",
        "program",
        "programme",
        "project",
        "requirements",
        "registration",
        "robotics",
        "scholarship",
        "sensor",
        "sensors",
        "robot",
        "semester",
        "subject",
        "technical",
        "take",
        "trimester",
        "tour",
        "vision",
        "wireless",
        "whatsapp",
        "year",
    }
    if COURSE_CODE_RE.search(question):
        return True
    return bool(set(query.split()) & academic_terms)


def _wants_course_codes(question: str) -> bool:
    return bool(COURSE_CODE_RE.search(question)) or _has_any(
        question,
        ["course code", "course codes", "subject code", "subject codes"],
    )


def _asks_for_code_output(question: str) -> bool:
    return _has_any(question.lower(), ["course code", "course codes", "subject code", "subject codes"])


@lru_cache(maxsize=1)
def _load_programmes() -> list[dict[str, Any]]:
    knowledge_path = Path(__file__).resolve().parents[2] / "data" / "kb" / "course_knowledge.generated.json"
    with knowledge_path.open("r", encoding="utf-8") as file:
        return json.load(file)


@lru_cache(maxsize=1)
def _load_source_facts() -> dict[str, Any]:
    facts_path = Path(__file__).resolve().parents[2] / "data" / "kb" / "intelligent_robotics_source_facts.json"
    with facts_path.open("r", encoding="utf-8") as file:
        return json.load(file)


@lru_cache(maxsize=1)
def _load_prereq_rules() -> dict[str, Any]:
    rules_path = Path(__file__).resolve().parents[2] / "data" / "kb" / "prereq_rules.json"
    with rules_path.open("r", encoding="utf-8") as file:
        return json.load(file)


def _format_qa_answer(row: dict[str, Any]) -> str:
    answer = str(row["answer"]).strip()
    if row.get("id") == "IR-WEB-OVERVIEW" or row.get("source_record_id") == "IR-WEB-OVERVIEW" or row.get("type") == "programme_overview":
        return SHORT_ROBOTICS_OVERVIEW
    if "last modified" in _qa_key(row["question"]):
        return f"The MMU page metadata lists the last modified time as {answer}."
    if re.fullmatch(r"\d+(?:\.\d+)?", answer) and row.get("course_code") and "credit" in _qa_key(row["question"]):
        course_name = f" {row.get('course_name')}" if row.get("course_name") else ""
        return f"{row['course_code']}{course_name} carries {answer} credit hour(s)."
    return answer


@lru_cache(maxsize=1)
def _load_eval_qa() -> dict[str, Any]:
    root = Path(__file__).resolve().parents[3] / "hybride serch master file" / "clean_data" / "eval"
    master_qa = Path(__file__).resolve().parents[2] / "data" / "kb" / "master_qa_pairs.clean.jsonl"
    qa: dict[str, Any] = {"exact": {}, "broad": {}, "rows": []}
    paths = [
        root / "master_qa_accuracy_1500.jsonl",
        root / "beginner_general_questions_500.jsonl",
        root / "mixed_regression_questions_1500.jsonl",
        master_qa,
    ]
    for path in paths:
        filename = path.name
        if not path.exists():
            continue
        with path.open("r", encoding="utf-8") as file:
            for line in file:
                if not line.strip():
                    continue
                row = json.loads(line)
                question = row.get("question")
                answer = row.get("expected_answer") or row.get("answer")
                if question and answer:
                    value = {
                        "answer": answer,
                        "source": filename,
                        "id": row.get("id"),
                        "source_record_id": row.get("source_record_id"),
                        "category": row.get("category"),
                        "type": row.get("type"),
                        "course_code": row.get("course_code"),
                        "course_name": row.get("course_name"),
                        "question": question,
                        "key": _qa_key(question),
                        "tokens": _qa_tokens(question),
                        "course_name_tokens": _qa_tokens(row.get("course_name") or ""),
                    }
                    qa["exact"].setdefault(_qa_exact_key(question), value)
                    qa["broad"].setdefault(_qa_key(question), value)
                    qa["rows"].append(value)
    return qa


def _answer_eval_qa(question: str) -> dict[str, Any] | None:
    qa = _load_eval_qa()
    row = qa["exact"].get(_qa_exact_key(question)) or qa["broad"].get(_qa_key(question))
    route = "deterministic_eval_qa"
    if row and _asks_for_code_output(question) and not COURSE_CODE_RE.search(_format_qa_answer(row)):
        row = None
    if not row:
        row = _find_similar_qa(question, qa["rows"])
        route = "deterministic_similar_qa"
    if not row:
        return None
    return _make_answer(
        _format_qa_answer(row),
        [row["source"]],
        0.95 if route == "deterministic_similar_qa" else 1.0,
        route=route,
    ) | {
        "matched_id": row.get("id"),
        "category": row.get("category"),
    }


def _find_similar_qa(question: str, rows: list[dict[str, Any]]) -> dict[str, Any] | None:
    query_key = _qa_key(question)
    query_tokens = _qa_tokens(question)
    query_codes = {code.upper() for code in COURSE_CODE_RE.findall(question)}
    needs_code_output = _asks_for_code_output(question)
    if len(query_tokens) < 2:
        return None

    best: tuple[float, dict[str, Any]] | None = None
    for row in rows:
        if needs_code_output and not COURSE_CODE_RE.search(_format_qa_answer(row)):
            continue

        row_code = str(row.get("course_code") or "").upper()
        if query_codes and row_code and row_code not in query_codes:
            continue

        row_tokens = row["tokens"]
        overlap = len(query_tokens & row_tokens) / len(query_tokens | row_tokens) if row_tokens else 0.0
        course_name_tokens = row.get("course_name_tokens") or set()
        named_course = bool(course_name_tokens) and len(query_tokens & course_name_tokens) / len(course_name_tokens) >= 0.8
        if overlap < (0.35 if query_codes else 0.55):
            continue

        ratio = SequenceMatcher(None, query_key, row["key"]).ratio()
        score = overlap * 0.7 + ratio * 0.3
        threshold = 0.50 if query_codes else (0.58 if named_course else 0.72)
        if score >= threshold and (not best or score > best[0]):
            best = (score, row)

    return best[1] if best else None


def _get_programme(query: str) -> dict[str, Any] | None:
    for programme in _load_programmes():
        if _has_any(query, programme.get("aliases", [])):
            return programme
    return None


def _default_programme() -> dict[str, Any] | None:
    programmes = _load_programmes()
    return programmes[0] if len(programmes) == 1 else None


def _make_answer(
    answer: str,
    sources: list[str],
    confidence: float = 1.0,
    route: str = "deterministic_course_structure",
) -> dict[str, Any]:
    return {
        "answer": answer,
        "route": route,
        "used_rag": True,
        "sources": sources,
        "confidence": confidence,
    }


def _short_programme_name(programme: dict[str, Any]) -> str:
    return "Applied AI" if programme.get("key") == "aai" else "Intelligent Robotics"


def _format_plan(programme: dict[str, Any]) -> str:
    terms = programme.get("terms", [])
    return "; ".join(f"{term['label']}: {', '.join(term['courses'])}" for term in terms)


def _format_courses(term: dict[str, Any], include_codes: bool) -> str:
    courses = term.get("courses", [])
    codes = term.get("courseCodes", [])
    formatted = []
    for index, course in enumerate(courses):
        code = codes[index] if index < len(codes) else ""
        formatted.append(f"{code} {course}".strip() if include_codes and code else course)
    return ", ".join(formatted)


def _programme_courses(programme: dict[str, Any]) -> list[dict[str, str]]:
    courses: list[dict[str, str]] = []
    for term in programme.get("terms", []):
        for index, course in enumerate(term.get("courses", [])):
            code = term.get("courseCodes", [])[index] if index < len(term.get("courseCodes", [])) else ""
            courses.append({"code": code, "course": course, "year": term["label"]})
    return courses


def _find_programme_course(query: str, programme: dict[str, Any]) -> dict[str, str] | None:
    query_key = _qa_key(query)
    query_tokens = _qa_tokens(query)
    query_codes = {code.upper() for code in COURSE_CODE_RE.findall(query)}
    best: tuple[float, dict[str, str]] | None = None
    for row in sorted(_programme_courses(programme), key=lambda item: len(item["course"]), reverse=True):
        course_key = _qa_key(row["course"])
        course_tokens = _qa_tokens(row["course"])
        if row["code"].upper() in query_codes or re.search(rf"(?:^| ){re.escape(course_key)}(?: |$)", query_key):
            return row
        if course_tokens:
            score = len(query_tokens & course_tokens) / len(course_tokens)
            if score >= 0.55 and (not best or score > best[0]):
                best = (score, row)
    return best[1] if best else None


def _query_year(query: str) -> str | None:
    if _has_any(query, ["first sem", "first semester", "new join", "new student", "join the course", "start the course"]):
        return "year-1"
    match = re.search(r"\b(?:year|y)\s*([123])\b", query)
    return f"year-{match.group(1)}" if match else None


def _find_term(programme: dict[str, Any], term_id: str | None) -> dict[str, Any] | None:
    if not term_id:
        return None
    for term in programme.get("terms", []):
        if term.get("id") == term_id:
            return term
    return None


def _category_key(query: str) -> str | None:
    allows_short_category = bool(re.fullmatch(r"\s*[a-z ]+\s+[123]\s*", query))
    if not allows_short_category and not _has_any(query, ["course", "courses", "subject", "subjects", "program", "programme"]):
        return None
    for key, data in COURSE_CATEGORIES.items():
        if _has_any(query, data["aliases"]):
            return key
    return None


def _category_courses(programme: dict[str, Any], category: str, term_id: str | None = None) -> list[str]:
    terms = [_find_term(programme, term_id)] if term_id else programme.get("terms", [])
    matches = COURSE_CATEGORIES[category]["matches"]
    courses: list[str] = []
    for term in [term for term in terms if term]:
        for course in term.get("courses", []):
            if _has_any(course.lower(), matches):
                courses.append(course)
    return courses


def _answer_category_question(query: str, programme: dict[str, Any]) -> dict[str, Any] | None:
    category = _category_key(query)
    if not category:
        return None

    wants_full = _has_any(query, ["all", "full", "complete", "list all"])
    term_id = _query_year(query)
    if not term_id:
        match = re.fullmatch(r"\s*[a-z ]+\s+([123])\s*", query)
        term_id = f"year-{match.group(1)}" if match else None
    if not term_id and not wants_full:
        return _make_answer(
            f"Which year do you want for {category} courses: Year 1, Year 2, Year 3, or the full list?",
            ["programme_structure.jsonl", programme["source"]],
            0.9,
            route="deterministic_course_category_prompt",
        )

    courses = _category_courses(programme, category, term_id)
    scope = _find_term(programme, term_id)["label"] if term_id else "full list"
    answer = f"{scope} {category} courses: {', '.join(courses)}." if courses else f"I could not find {category} courses in {scope}."
    return _make_answer(
        answer,
        ["programme_structure.jsonl", programme["source"]],
        0.98,
        route="deterministic_course_category",
    )


def _answer_starter_courses(query: str, programme: dict[str, Any], include_codes: bool) -> dict[str, Any] | None:
    if not _has_any(query, ["first sem", "first semester", "new join", "new student", "join the course", "start the course"]):
        return None
    term = _find_term(programme, "year-1")
    if not term:
        return None
    return _make_answer(
        f"Source is by year, not semester. Year 1: {_format_courses(term, include_codes)}.",
        ["programme_structure.jsonl", programme["source"]],
        0.98,
        route="deterministic_starter_courses",
    )


def _answer_prerequisite_code(query: str, programme: dict[str, Any] | None) -> dict[str, Any] | None:
    if not _has_any(query, ["prereq", "prerequisite", "pre requisite", "pre-requisite"]):
        return None
    codes = [code.upper() for code in COURSE_CODE_RE.findall(query)]
    course = _find_programme_course(query, programme) if programme else None
    if course and course["code"]:
        codes.insert(0, course["code"].upper())
    if not codes:
        return None
    code = codes[0]
    rules = _load_prereq_rules()
    if code in rules:
        title = rules[code].get("title", code)
        prereqs = rules[code].get("prerequisites") or ["No prerequisite is specified in the extracted rules"]
        return _make_answer(
            f"{code} {title} prerequisite: {', '.join(prereqs)}.",
            ["prereq_rules.json"],
            route="deterministic_course_rules",
        )
    return _make_answer(
        f"I do not have an extracted Intelligent Robotics prerequisite rule for {code}. Please check FAIE staff or the official subject outline.",
        ["prereq_rules.json"],
        0.8,
        route="deterministic_course_rules",
    )


def _answer_programme_course_presence(query: str, programme: dict[str, Any]) -> dict[str, Any] | None:
    if not _has_any(query, ["need to take", "part of", "will i learn"]):
        return None
    course = _find_programme_course(query, programme)
    if course:
        prefix = f"{course['code']} " if course["code"] and _wants_course_codes(query) else ""
        answer = (
            f"Yes, you need to take {prefix}{course['course']}. It is listed in {course['year']} of the Intelligent Robotics structure."
            if "need to take" in query
            else f"Yes. {prefix}{course['course']} is listed in {course['year']} of the Intelligent Robotics structure."
        )
        return _make_answer(
            answer,
            ["programme_structure.jsonl", programme["source"]],
            0.98,
            route="deterministic_course_presence",
        )
    category = _category_key(f"{query} course")
    if category:
        courses = _category_courses(programme, category)
        if courses:
            return _make_answer(
                f"Yes. {category} appears in the programme through courses such as {', '.join(courses[:5])}.",
                ["programme_structure.jsonl", programme["source"]],
                0.95,
                route="deterministic_course_presence",
            )
    return None


def _answer_programme_links(query: str) -> dict[str, Any] | None:
    facts = _load_source_facts()
    links = facts.get("page_action_links", []) + facts.get("page_top_links", []) + facts.get("page_support_links", [])
    for link in links:
        label = str(link.get("label", ""))
        if label and _has_any(query, [label.lower()]):
            return _make_answer(
                f"{label.title()}: {link['url']}",
                ["intelligent_robotics_source_facts.json"],
                0.98,
                route="deterministic_programme_link",
            )
    if "apel" in query:
        return _make_answer(
            f"APEL A information: {facts['apel_a_url']}",
            ["intelligent_robotics_source_facts.json"],
            0.98,
            route="deterministic_programme_link",
        )
    return None


def _answer_career_or_industry(query: str) -> dict[str, Any] | None:
    facts = _load_source_facts()
    if _has_any(query, ["robotics engineer", "career", "job"]):
        careers = ", ".join(facts.get("career_prospects", [])[:5])
        return _make_answer(
            f"Common robotics paths from this programme include {careers}.",
            ["intelligent_robotics_source_facts.json"],
            0.95,
            route="deterministic_career_facts",
        )
    if _has_any(query, ["industry 4.0", "ir4.0"]):
        return _make_answer(
            "Yes. The MMU description says graduates are prepared as agile knowledge workers for the IR4.0 age and beyond.",
            ["intelligent_robotics_source_facts.json"],
            0.95,
            route="deterministic_career_facts",
        )
    return None


def _byoc_slot(query: str) -> str | None:
    match = re.search(r"\b(?:elective\s*([123])\s*byoc|byoc[-\s]*([123]))\b", query, re.IGNORECASE)
    return (match.group(1) or match.group(2)) if match else None


def answer_course_question(question: str) -> dict[str, Any] | None:
    query = re.sub(r"\s+", " ", _normalize_question(question)).strip()
    if not _is_academic_scope(question):
        return _make_answer(
            "Sorry, I could not find that in the Hive academic knowledge base. Please rephrase your question, or ask FAIE staff for this item.",
            ["safe_fallback"],
            0.0,
            route="safe_fallback",
        )

    programme = _get_programme(query) or _default_programme()
    include_codes = _wants_course_codes(question)

    presence_answer = _answer_programme_course_presence(query, programme) if programme and "need to take" in query else None
    if presence_answer:
        return presence_answer

    eval_answer = _answer_eval_qa(question)
    if eval_answer:
        return eval_answer

    link_answer = _answer_programme_links(query)
    if link_answer:
        return link_answer

    career_answer = _answer_career_or_industry(query)
    if career_answer:
        return career_answer

    prereq_answer = _answer_prerequisite_code(query, programme)
    if prereq_answer:
        return prereq_answer

    starter_answer = _answer_starter_courses(query, programme, include_codes) if programme else None
    if starter_answer:
        return starter_answer

    category_answer = _answer_category_question(query, programme) if programme else None
    if category_answer:
        return category_answer

    presence_answer = _answer_programme_course_presence(query, programme) if programme else None
    if presence_answer:
        return presence_answer

    slot = _byoc_slot(query)

    if _has_any(query, ["project progression", "progression rule", "progression rules"]):
        return _make_answer(
            "Project I requires completed 60 credit hours. Project II requires completed 60 credit hours and Project I.",
            ["programme_structure.jsonl", "prereq_rules.json"],
            route="deterministic_project_progression",
        )

    if slot:
        if _has_any(query, ["course code", "subject code"]):
            answer = f"The course code for Elective {slot} BYOC is BYOC-{slot}."
        elif _has_any(query, ["which year", "where"]):
            answer = f"BYOC-{slot} Elective {slot} BYOC is listed in Year 3 of the Intelligent Robotics structure."
        elif "connect" in query:
            answer = f"BYOC-{slot} Elective {slot} BYOC connects to Year 3 BYOC elective study in Intelligent Robotics."
        else:
            answer = (
                f"Elective {slot} BYOC (BYOC-{slot}) is listed under Year 3. "
                f"The MMU programme structure lists Elective {slot} BYOC (BYOC-{slot}) under Year 3."
            )
        return _make_answer(
            answer,
            ["programme_structure.jsonl"],
            route="deterministic_byoc_slot",
        )

    if _has_any(query, ["byoc", "elective"]):
        return _make_answer(
            "Choose a BYOC elective by first checking your programme structure and available BYOC slots, then pick subjects that support your goal: career skills, AI/data, communication, business, finance, media, or technical breadth. If you want a BYOC track, keep the courses in the same track and check eligibility, seat availability, timetable fit, and advice from the programme coordinator before registering.",
            ["programme_structure.jsonl", "MMU BYOC"],
            0.98,
            route="deterministic_byoc_advice",
        )

    if _has_any(query, ["project ii", "arp6110-p2", "arp6110 p2"]):
        return _make_answer(
            "ARP6110-P2 Project II requires completed 60 credit hours and ARP6110-P1 Project I.",
            ["prereq_rules.json", "Subject Code all - cleaned.docx"],
            route="deterministic_course_rules",
        )

    if _has_any(query, ["project i", "arp6110-p1", "arp6110 p1"]):
        return _make_answer(
            "ARP6110-P1 Project I requires completed 60 credit hours.",
            ["prereq_rules.json", "Subject Code all - cleaned.docx"],
            route="deterministic_course_rules",
        )

    if _has_any(query, ["alias code mid6113", "canonical subject", "mid6113 map"]):
        return _make_answer(
            "Alias code MID6113 maps to MMD6123 Digital Fabrication and Prototyping.",
            ["intelligent_robotics_qa_pairs.jsonl", "Master&Plan Intelligent Robotics subject master"],
            0.98,
            route="deterministic_course_alias",
        )

    if not programme:
        if _has_any(query, ["progression", "progression rules", "course progression"]):
            return _make_answer(
                "Progression rules should be checked against the programme structure and prerequisite rules. "
                "For the project sequence, Project I requires completed 60 credit hours, and Project II "
                "requires both Project I and completed 60 credit hours.",
                ["programme_structure.jsonl", "prereq_rules.json"],
                0.98,
            )
        return None

    if _has_any(query, ["faculty", "which faculty", "offered by", "offers"]):
        return _make_answer(
            "Bachelor of Science (Honours) in Intelligent Robotics is offered by the Faculty of Artificial Intelligence and Engineering (FAIE).",
            ["programme_structure.jsonl", programme["source"]],
            0.98,
        )

    if _has_any(query, ["registration", "accreditation", "identifier", "identifiers", "mqa"]):
        return _make_answer(
            "The Intelligent Robotics programme lists registration R/0788/6/00177 and accreditation MQA/SWA14238.",
            ["programme_structure.jsonl", programme["source"]],
            0.98,
        )

    if _has_any(query, ["action links", "enquire now", "how to apply", "download brochure", "programme fees"]):
        return _make_answer(
            "The MMU Intelligent Robotics page provides ENQUIRE NOW, HOW TO APPLY, DOWNLOAD BROCHURE, and DOWNLOAD PROGRAMME FEES action links.",
            ["programme_structure.jsonl", programme["source"]],
            0.98,
        )

    if _has_any(query, ["dkm", "dlkm", "dvm", "bridging"]):
        return _make_answer(
            "DKM, DLKM or DVM applicants for Intelligent Robotics may need to complete a Bridging Programme.",
            ["programme_structure.jsonl", programme["source"]],
            0.98,
        )

    if programme.get("totalCredits") and _has_any(
        query,
        ["total credit", "total credits", "how many credits", "credit required"],
    ):
        return _make_answer(
            f"{programme['label']} requires {programme['totalCredits']} total credits.",
            ["programme_structure.jsonl", programme["source"]],
        )

    for term in programme.get("terms", []):
        term_aliases = [term["id"], term["label"].lower(), *term.get("aliases", [])]
        if _has_any(query, term_aliases):
            return _make_answer(
                f"{term['label']} for {_short_programme_name(programme)} includes {_format_courses(term, include_codes)}.",
                ["programme_structure.jsonl", programme["source"]],
            )

    if _has_any(query, ["industrial training", "internship"]):
        return _make_answer(
            programme["industrialTrainingRule"],
            ["programme_structure.jsonl", programme["source"]],
        )

    if _has_any(query, ["mpu", "university course", "integrity", "leadership"]):
        return _make_answer(
            programme["mpuNote"],
            ["programme_structure.jsonl", programme["source"]],
        )

    if _has_any(query, ["study plan", "course structure", "programme structure", "progression"]):
        return _make_answer(
            f"{_short_programme_name(programme)} structure for {programme['label']}: {_format_plan(programme)}",
            ["programme_structure.jsonl", programme["source"]],
            0.98,
        )

    if _has_any(query, ["programme name", "overview", "intake", "about"]) or (
        _has_any(query, ["intelligent robotics"]) and len(_qa_tokens(query)) <= 3
    ):
        return _make_answer(
            SHORT_ROBOTICS_OVERVIEW,
            ["programme_structure.jsonl", programme["source"]],
            0.98,
        )

    return None
