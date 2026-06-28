import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
KB_DIR = ROOT / "data" / "kb"
PAGEINDEX_DIR = ROOT / "data" / "pageindex_out"
MASTER_PLAN_DIR = Path(r"C:\Users\jeysa\Desktop\data traning\Master&Plan")
MASTER_SUBJECT_JSON = MASTER_PLAN_DIR / "ir_subject_master.json"
MASTER_SUBJECT_JSONL = MASTER_PLAN_DIR / "ir_subject_Master_Raw.jsonl"
MASTER_ALIASES_JSON = MASTER_PLAN_DIR / "ir_subject_aliases.json"
MASTER_PREREQ_GRAPH_JSON = MASTER_PLAN_DIR / "ir_prerequisite_graph.json"

SOURCE_URL = "https://www.mmu.edu.my/programmes-by-faculty-all/programmes-by-faculty-faie/bachelor-of-science-hons-in-intelligent-robotics/"
PROGRAMME = "Bachelor of Science (Honours) in Intelligent Robotics"
PROGRAMME_SHORT = "Intelligent Robotics"
SOURCE = "MMU Intelligent Robotics programme page"
WEBSITE_TITLE = "Adapt and Innovate, Enrol in a Robotics Course in Malaysia | MMU"
PAGE_META_DESCRIPTION = (
    "Explore robotics in Malaysia with MMU's Bachelor of Science in Intelligent Robotics. "
    "Gain hands-on experience in multi-disciplinary programme. See the requirements here."
)
PAGE_MODIFIED_TIME = "2026-05-18T04:30:16+00:00"
FACULTY = "Faculty of Artificial Intelligence and Engineering (FAIE)"
REGISTRATION_ID = "(R/0788/6/00177) 01/31"
MQA_ID = "(MQA/SWA14238)"
PROGRAMME_DESCRIPTION = (
    "The Bachelor of Science (Honours) Intelligent Robotics is a 3-year programme that strikes an "
    "exquisite balance between the fundamentals of engineering and hands-on practical skills. This "
    "multidisciplinary programme combines electronics, robotics, artificial intelligence, automation, "
    "and computer programming. It adopts a modern learning approach with early exposure to real-world "
    "applications. Graduates will be agile knowledge workers in the IR4.0 age and beyond, highly "
    "sought after by the industry."
)
PAGE_ACTION_LINKS = [
    ("ENQUIRE NOW", "https://www.mmu.edu.my/programmes-by-faculty-all/programmes-by-faculty-faie/bachelor-of-science-hons-in-intelligent-robotics/mmu2018/enquire-now/"),
    ("HOW TO APPLY", "https://www.mmu.edu.my/programmes-by-faculty-all/programmes-by-faculty-faie/bachelor-of-science-hons-in-intelligent-robotics/mmu2018/how-to-apply/"),
    ("DOWNLOAD BROCHURE", "https://www.mmu.edu.my/wp-content/uploads/2026/05/2026-MMU_FOE-FAIE-FET-FCI-FIST-14-05-2026-small.pdf"),
    ("DOWNLOAD PROGRAMME FEES", "https://www.mmu.edu.my/wp-content/uploads/2023/07/UG_Fee-Structure_update_150725_MQA.pdf"),
]
PAGE_TOP_LINKS = [
    ("APPLY NOW", "https://www.mmu.edu.my/apply-now/"),
    ("INTAKE INFO", "https://www.mmu.edu.my/intake_enquiry/"),
    ("SCHOLARSHIP", "https://www.mmu.edu.my/financial-assistance/"),
]
PAGE_SUPPORT_LINKS = [
    ("VIRTUAL TOUR", "https://streetview.my/multimediauniversity/"),
    ("WHATSAPP", "https://wa.me/60383125959?text=Hello%20Multimedia%20University!"),
]
PAGE_SECTIONS = [
    "Entry Requirements",
    "Programme Structure",
    "Core",
    "Year 1",
    "Year 2",
    "Year 3",
    "BYOC Elective Subjects",
    "University Subjects",
    "Career Prospects",
]
APEL_A_URL = "https://www.mmu.edu.my/apel-a/"

CORE_BY_YEAR = {
    "Year 1": [
        ("ARM6113", "Technical Calculus"),
        ("ARC6113", "Computer and Programming"),
        ("ARC6123", "Micro-Controllers & Microprocessors"),
        ("ARL6113", "Electrical Circuits"),
        ("ARE6113", "Basic Electronics"),
        ("ARM6123", "Differential Equations"),
        ("ARE6123", "Digital Design"),
        ("ARM6133", "Linear Algebra and Numerical Methods"),
        ("MID6113", "Rapid Modelling"),
        ("ARE6133", "Analog Electronics"),
    ],
    "Year 2": [
        ("ARL6143", "Linear Systems & Signals"),
        ("ARL6134", "Electromagnetics with Applications"),
        ("ARL6123", "Electrical Machines and Power Systems"),
        ("ARR6123", "Robotics - Machine Design and Mechanisms"),
        ("ARA6113", "Introduction to Artificial Intelligence"),
        ("ARR6133", "Actuators and Sensors"),
        ("ARC6133", "Electronics Instrumentation"),
        ("ARR6143", "Robotics - Modelling and Control"),
        ("ARC6144", "Feedback Control"),
        ("ARC6173", "Advanced Programming"),
        ("ARA6123", "Machine Learning Concepts and Technologies"),
        ("ARA6144", "Machine Vision & Image Processing"),
    ],
    "Year 3": [
        ("ARR6153", "Mobile Robots and Drones"),
        ("ARP6110-P1", "Project I"),
        ("ARP6110-P2", "Project II"),
        ("ART6116", "Industrial Training"),
        ("ARC6184", "Making Embedded Systems"),
        ("ARR6163", "Robot Programming"),
        ("BYOC-1", "Elective 1 BYOC"),
        ("BYOC-2", "Elective 2 BYOC"),
        ("BYOC-3", "Elective 3 BYOC"),
    ],
}

PREREQS = {
    "ARM6123": ["ARM6113 Technical Calculus"],
    "ARA6113": ["ARC6113 Computer and Programming"],
    "ARA6123": ["ARC6113 Computer and Programming"],
    "ARR6163": ["ARC6113 Computer and Programming"],
    "ARC6184": ["ARC6123 Micro-Controllers & Microprocessors"],
    "ARR6153": [
        "ARC6123 Micro-Controllers & Microprocessors",
        "ARR6123 Robotics - Machine Design and Mechanisms",
    ],
    "ARL6143": ["ARL6113 Electrical Circuits"],
    "ARP6110-P1": ["Completed 60 credit hours"],
    "ARP6110-P2": ["Completed 60 credit hours", "ARP6110-P1 Project I"],
    "ART6116": ["Completed 60 credit hours"],
}

BYOC = {
    "March/April": [
        "Fundamentals of Marketing",
        "Digital Transformation Strategy",
        "Personal Finance",
        "Radio Network Planning Towards 5G",
        "Media Anthropology",
        "Project Management",
        "Motion Capture",
        "Media Law",
        "Corporate Strategy",
        "Social Media Strategies",
        "Introductory Mobile Application Development",
        "Basic Filmmaking",
        "Fundamental of Wireless Communications",
    ],
    "October/November": [
        "Design Thinking for Strategic Communication",
        "Corporate Communication",
        "Suspenseful Filmmaking",
        "Communications Networks",
        "Introductory Data Science",
        "Introductory Data Visualization",
        "Visual and Corporate Identity",
        "Information Visualization",
        "Principal of Finance",
        "Fundamental of Marketing",
    ],
}

UNIVERSITY_SUBJECTS = [
    "Character Building Program: Character Building and Sustainable Society",
    "Fundamentals of Digital Competence for Programmers",
    "U1 - Falsafah dan Isu Semasa",
    "U1 - Penghayatan Etika dan Peradaban Isu Semasa (local students) / Bahasa Melayu Komunikasi 2 (international students)",
    "U2 - Bahasa Kebangsaan A / Foreign Language",
    "U3 - Integrity and Leadership",
    "U4 - Co-Curriculum",
]

CAREERS = [
    "Robotics System Designer/Programmers",
    "AI and Machine Learning Developer",
    "Embedded System Designer",
    "Control and Automation Specialist",
    "Field Application Technologist",
    "Printed Circuit Board (PCB) Designer",
    "Production and Planning Engineer",
    "Industry 4.0 Technologist",
]

ENTRY_REQUIREMENTS = [
    "Pass Foundation or Matriculation studies in a related field from a recognised institution with a minimum CGPA of 2.00.",
    "Pass STPM or equivalent with a minimum Grade C (GP 2.00) in any 2 subjects.",
    "Pass A-Level with a minimum Grade D in any two subjects.",
    "Pass UEC with a minimum Grade B in at least five subjects.",
    "Pass STAM with minimum grade of Jayyid.",
    "Recognised Diploma in a related field with a minimum CGPA of 2.00 or equivalent.",
    "Pass DKM, DLKM or DVM with a minimum CGPA of 2.50; candidates below 2.50 must have at least two years of related work experience.",
    "Other relevant and equivalent qualifications recognised by the Malaysian Government.",
    "Possess an APEL.A certificate from MQA for admission into Bachelor programmes.",
]
ENTRY_REQUIREMENT_NOTE = "DKM / DLKM / DVM candidates may be required to undergo a Bridging Programme as an additional requirement."

COURSE_OVERVIEWS = {
    "Technical Calculus": "Foundational calculus for robotics, engineering analysis, modelling, and later control or signal courses.",
    "Computer and Programming": "Programming foundations for robotics software, algorithms, control structures, functions, data handling, and implementation.",
    "Micro-Controllers & Microprocessors": "Embedded processor fundamentals for interfacing sensors, actuators, controllers, and robotics hardware.",
    "Electrical Circuits": "Electrical circuit theory needed for electronics, signals, power systems, and robotics hardware analysis.",
    "Basic Electronics": "Semiconductor and electronics fundamentals supporting instrumentation, microcontrollers, sensors, and embedded systems.",
    "Differential Equations": "Mathematical modelling of dynamic systems used in robotics, control, signals, and automation.",
    "Digital Design": "Digital logic and sequential/combinational design for computing hardware and embedded robotics systems.",
    "Linear Algebra and Numerical Methods": "Matrix methods and numerical techniques used in robotics kinematics, AI, modelling, and simulation.",
    "Rapid Modelling": "Hands-on prototyping and modelling skills for robotics design, fabrication, and iteration.",
    "Analog Electronics": "Analog circuit analysis and design for sensing, instrumentation, filtering, and signal conditioning.",
    "Linear Systems & Signals": "System and signal foundations for control, communications, feedback, and robotics response analysis.",
    "Electromagnetics with Applications": "Electromagnetic principles relevant to electrical machines, sensors, communications, and applied engineering.",
    "Electrical Machines and Power Systems": "Machine and power-system concepts for robotics drives, actuators, and automation systems.",
    "Robotics - Machine Design and Mechanisms": "Mechanical design and mechanisms used to build and analyse robot movement and structure.",
    "Introduction to Artificial Intelligence": "AI concepts and techniques used in intelligent robotic perception, reasoning, and decision support.",
    "Actuators and Sensors": "Robotic sensing and actuation components for perception, measurement, movement, and control.",
    "Electronics Instrumentation": "Measurement and instrumentation methods for acquiring and interpreting engineering signals.",
    "Robotics - Modelling and Control": "Robot modelling and control concepts for planning, stabilising, and commanding robotic systems.",
    "Feedback Control": "Feedback-system design for controlling dynamic systems and robotic behaviours.",
    "Advanced Programming": "Advanced software development practices for larger robotics, AI, and automation applications.",
    "Machine Learning Concepts and Technologies": "Machine learning concepts and technologies that support data-driven intelligent robotic systems.",
    "Machine Vision & Image Processing": "Vision and image processing methods for perception, inspection, and robotic scene understanding.",
    "Mobile Robots and Drones": "Mobile robot and drone concepts, integrating embedded systems, mechanisms, sensing, and control.",
    "Project I": "First capstone project stage for applying robotics knowledge after reaching the credit-hour requirement.",
    "Project II": "Second capstone project stage continuing Project I work after meeting the project progression rule.",
    "Industrial Training": "Industry placement for applying engineering and robotics skills in a real workplace.",
    "Making Embedded Systems": "Embedded system development for robotics hardware, microcontrollers, and connected devices.",
    "Robot Programming": "Programming robots and robotic behaviours using prior computer programming foundations.",
}

MOJIBAKE_REPLACEMENTS = {
    "\u00e2\u20ac\u2122": "'",
    "\u00e2\u20ac\u02dc": "'",
    "\u00e2\u20ac\u0153": '"',
    "\u00e2\u20ac\u009d": '"',
    "\u00e2\u20ac\u201c": "-",
    "\u00e2\u20ac\u201d": "-",
}


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def clean_text(value):
    if isinstance(value, str):
        text = value
        for old, new in MOJIBAKE_REPLACEMENTS.items():
            text = text.replace(old, new)
        return text
    if isinstance(value, list):
        return [clean_text(item) for item in value]
    if isinstance(value, dict):
        return {key: clean_text(item) for key, item in value.items()}
    return value


def load_subject_master() -> list[dict]:
    raw_by_code = {}
    if MASTER_SUBJECT_JSONL.exists():
        for row in read_jsonl(MASTER_SUBJECT_JSONL):
            if row.get("record_type") == "subject_master_full" and row.get("canonical_code"):
                raw_by_code[row["canonical_code"]] = row

    if MASTER_SUBJECT_JSON.exists():
        rows = json.loads(MASTER_SUBJECT_JSON.read_text(encoding="utf-8"))
        for row in rows:
            raw = raw_by_code.get(row.get("canonical_code"))
            if raw and raw.get("full_text"):
                row["full_text"] = raw["full_text"]
        return clean_text(rows)
    if raw_by_code:
        return clean_text(list(raw_by_code.values()))
    return []


def load_json_dict(path: Path) -> dict:
    if not path.exists():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    return clean_text(data if isinstance(data, dict) else {})


def write_jsonl(path: Path, rows: list[dict]) -> None:
    path.write_text(
        "".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows),
        encoding="utf-8",
    )


def format_items(items) -> str:
    if not items:
        return "None specified."
    if isinstance(items, str):
        return items
    return "; ".join(str(item) for item in items)


def format_course_names(courses: list[tuple[str, str]]) -> str:
    return ", ".join(name for _, name in courses)


def format_course_code_names(courses: list[tuple[str, str]]) -> str:
    return ", ".join(f"{code} {name}" for code, name in courses)


def build_byoc_answer(term: str, subjects: list[str]) -> str:
    subject_text = ", ".join(subjects)
    if term == "March/April":
        recommendations = (
            "A practical way to choose: 1. Pick Project Management or Corporate Strategy if you want "
            "stronger project leadership. 2. Pick Introductory Mobile Application Development if you "
            "want to connect robotics with apps. 3. Pick Radio Network Planning Towards 5G or "
            "Fundamental of Wireless Communications if you like connected robots and networks. "
            "4. Pick Motion Capture or Basic Filmmaking if you want creative or interactive robotics "
            "work. 5. Pick Personal Finance if you want a useful life skill outside the technical track."
        )
    else:
        recommendations = (
            "A practical way to choose: 1. Pick Introductory Data Science or Introductory Data "
            "Visualization if you want stronger data skills for robotics. 2. Pick Communications "
            "Networks if you are interested in connected systems. 3. Pick Design Thinking for Strategic "
            "Communication if you want better problem framing and presentation skills. 4. Pick Corporate "
            "Communication or Visual and Corporate Identity if you want stronger communication for "
            "projects. 5. Pick Principal of Finance or Fundamental of Marketing if you want broader "
            "business awareness."
        )
    return f"{term} BYOC elective subjects include: {subject_text}. {recommendations}"


def format_assessment(items: list[dict]) -> str:
    if not items:
        return "Assessment details are not specified."
    parts = []
    for item in items:
        label = item.get("item", "Assessment item")
        weight = item.get("weight")
        parts.append(f"{label}: {weight}%" if weight is not None else str(label))
    return "; ".join(parts) + "."


def all_courses() -> list[dict]:
    rows = []
    for year, courses in CORE_BY_YEAR.items():
        for code, name in courses:
            rows.append(
                {
                    "code": code,
                    "course_code": code,
                    "name": name,
                    "course_name": name,
                    "year": year,
                    "category": "BYOC Elective" if code.startswith("BYOC") else "Core",
                    "programme": PROGRAMME,
                    "source": SOURCE,
                    "source_url": SOURCE_URL,
                    "prereq": PREREQS.get(code, []),
                    "overview": COURSE_OVERVIEWS.get(name, f"{name} is listed in the {PROGRAMME_SHORT} structure."),
                }
            )
    return rows


def build_structure_rows() -> list[dict]:
    rows = [
        qa_row(
            "IR-WEB-OVERVIEW",
            "programme_overview",
            "What is the Bachelor of Science (Honours) in Intelligent Robotics?",
            (
                f"{PROGRAMME} is offered by {FACULTY}. The programme page lists registration "
                f"{REGISTRATION_ID} and accreditation {MQA_ID}. {PROGRAMME_DESCRIPTION}"
            ),
        ),
        qa_row(
            "IR-WEB-PAGE-TITLE",
            "website_metadata",
            "What is the MMU website page title for Intelligent Robotics?",
            WEBSITE_TITLE,
        ),
        qa_row(
            "IR-WEB-META-DESCRIPTION",
            "website_metadata",
            "What does the MMU Intelligent Robotics page meta description say?",
            PAGE_META_DESCRIPTION,
        ),
        qa_row(
            "IR-WEB-MODIFIED-TIME",
            "website_metadata",
            "When was the MMU Intelligent Robotics page last modified?",
            f"The MMU page metadata lists the last modified time as {PAGE_MODIFIED_TIME}.",
        ),
        qa_row(
            "IR-WEB-FACULTY",
            "website_metadata",
            "Which faculty offers the Intelligent Robotics programme?",
            f"The Intelligent Robotics programme is offered by {FACULTY}.",
        ),
        qa_row(
            "IR-WEB-ACCREDITATION",
            "programme_overview",
            "What are the registration and accreditation identifiers for Intelligent Robotics?",
            f"The programme page lists registration {REGISTRATION_ID} and accreditation {MQA_ID}.",
        ),
        qa_row(
            "IR-WEB-ACTIONS",
            "website_action_links",
            "What action links are provided on the MMU Intelligent Robotics page?",
            "The page provides these action links: "
            + "; ".join(f"{label}: {href}" for label, href in PAGE_ACTION_LINKS)
            + ".",
        ),
        qa_row(
            "IR-WEB-TOP-LINKS",
            "website_action_links",
            "What top quick links are shown on the MMU Intelligent Robotics page?",
            "The page header shows these quick links: "
            + "; ".join(f"{label}: {href}" for label, href in PAGE_TOP_LINKS)
            + ".",
        ),
        qa_row(
            "IR-WEB-SUPPORT-LINKS",
            "website_action_links",
            "What support links are shown on the MMU Intelligent Robotics page?",
            "The page shows these support links: "
            + "; ".join(f"{label}: {href}" for label, href in PAGE_SUPPORT_LINKS)
            + ".",
        ),
        qa_row(
            "IR-WEB-APEL-A-LINK",
            "website_action_links",
            "What APEL.A link does the MMU Intelligent Robotics page provide?",
            f"The page points APEL.A applicants to {APEL_A_URL}.",
        ),
        qa_row(
            "IR-WEB-SECTIONS",
            "website_metadata",
            "What sections are shown on the MMU Intelligent Robotics page?",
            "The scraped page sections include: " + ", ".join(PAGE_SECTIONS) + ".",
        ),
    ]

    for idx, req in enumerate(ENTRY_REQUIREMENTS, start=1):
        rows.append(qa_row(f"IR-WEB-ENTRY-{idx:02d}", "entry_requirement", f"What is entry requirement {idx} for Intelligent Robotics?", req))
    rows.append(
        qa_row(
            "IR-WEB-ENTRY-NOTE-DKM-BRIDGING",
            "entry_note",
            "What note applies to DKM, DLKM or DVM applicants for Intelligent Robotics?",
            ENTRY_REQUIREMENT_NOTE,
        )
    )

    for year, courses in CORE_BY_YEAR.items():
        rows.append(
            qa_row(
                f"IR-WEB-{slug(year).upper()}",
                "term_structure",
                f"What courses are listed in {year} for Intelligent Robotics?",
                f"{year}: {format_course_names(courses)}.",
                course_codes=[code for code, _ in courses],
            )
        )
        for code, name in courses:
            rows.append(
                qa_row(
                    f"IR-WEB-COURSE-{code}",
                    "course_in_structure",
                    f"Where does {name} fit in the Intelligent Robotics structure?",
                    f"{name} is listed under {year} in the Intelligent Robotics programme structure.",
                    course_codes=[code],
                )
            )

    for term, subjects in BYOC.items():
        rows.append(
            qa_row(
                f"IR-WEB-BYOC-{slug(term).upper()}",
                "byoc_electives",
                f"What BYOC elective subjects are offered in {term} for Intelligent Robotics?",
                build_byoc_answer(term, subjects),
            )
        )

    rows.append(
        qa_row(
            "IR-WEB-UNIVERSITY-SUBJECTS",
            "mpu_notes",
            "What university subjects are included in Intelligent Robotics?",
            "University subjects include: " + "; ".join(UNIVERSITY_SUBJECTS) + ".",
        )
    )
    rows.append(
        qa_row(
            "IR-WEB-CAREERS",
            "career_prospects",
            "What career prospects are listed for Intelligent Robotics graduates?",
            "Career prospects include: " + ", ".join(CAREERS) + ".",
        )
    )
    rows.append(
        qa_row(
            "IR-WEB-PROJECT-RULE",
            "rule",
            "What is the project progression rule for Intelligent Robotics?",
            "Project I requires completed 60 credit hours. Project II requires completed 60 credit hours and Project I.",
            course_codes=["ARP6110-P1", "ARP6110-P2"],
        )
    )
    rows.append(
        qa_row(
            "IR-WEB-INDUSTRIAL-TRAINING-RULE",
            "rule",
            "What is the Industrial Training prerequisite for Intelligent Robotics?",
            "Industrial Training requires completed 60 credit hours.",
            course_codes=["ART6116"],
        )
    )
    return rows


def qa_row(id_: str, row_type: str, question: str, answer: str, course_codes: list[str] | None = None) -> dict:
    row = {
        "id": id_,
        "type": row_type,
        "programme": PROGRAMME,
        "question": question,
        "answer": answer,
        "content": answer,
        "source": SOURCE,
        "source_url": SOURCE_URL,
    }
    if course_codes:
        row["course_codes"] = course_codes
    return row


def build_course_qa_rows() -> list[dict]:
    rows = []
    for course in all_courses():
        code = course["code"]
        name = course["name"]
        prereqs = course["prereq"]
        prereq_text = "; ".join(prereqs) if prereqs else "No prerequisite is specified on the MMU programme page or current extracted prerequisite rules."
        templates = [
            ("overview", f"What is {code} ({name}) about?", course["overview"]),
            ("name_to_code", f"What is the course code for {name}?", f"The course code for {name} is {code}."),
            ("code_to_name", f"What is the course name for {code}?", f"{code} is {name}."),
            ("year", f"Which year is {code} {name} listed in?", f"{code} {name} is listed in {course['year']} of the Intelligent Robotics structure."),
            ("prerequisite", f"What prerequisite is listed for {code} {name} in the MMU website structure?", f"Prerequisite for {code} {name}: {prereq_text}"),
            ("progression", f"How does {code} connect to the Intelligent Robotics learning path?", f"{code} {name} connects to {course['year']} {course['category'].lower()} study in Intelligent Robotics."),
        ]
        for idx, (tag, question, answer) in enumerate(templates, start=1):
            rows.append(
                {
                    "id": f"IR-{code}-{idx:02d}",
                    "course_code": code,
                    "course_name": name,
                    "programme": PROGRAMME,
                    "question": question,
                    "answer": answer,
                    "source": SOURCE,
                    "source_url": SOURCE_URL,
                    "tags": [tag, "intelligent_robotics"],
                }
            )
    return rows


def build_subject_detail_qa_rows(subjects: list[dict]) -> list[dict]:
    rows = []

    def add(subject: dict, tag: str, question: str, answer: str) -> None:
        code = subject.get("canonical_code", "UNKNOWN")
        title = subject.get("canonical_title", code)
        rows.append(
            {
                "id": f"IR-MP-{slug(code).upper()}-{len([row for row in rows if row.get('course_code') == code]) + 1:03d}",
                "type": f"subject_{tag}",
                "course_code": code,
                "course_name": title,
                "programme": PROGRAMME,
                "question": question,
                "answer": answer,
                "content": answer,
                "source": "Master&Plan Intelligent Robotics subject master",
                "source_url": str(MASTER_PLAN_DIR),
                "tags": [tag, "subject_master", "intelligent_robotics"],
            }
        )

    for subject in subjects:
        code = subject.get("canonical_code")
        title = subject.get("canonical_title")
        if not code or not title:
            continue

        aliases = subject.get("alias_codes", []) + subject.get("alias_titles", [])
        alias_text = format_items(aliases) if aliases else "No aliases are listed."
        prerequisites = subject.get("prerequisite_policy_text") or format_items(subject.get("prerequisites"))
        assessment = subject.get("assessment") or []
        laboratory = subject.get("laboratory")
        topics = subject.get("course_contents") or []
        clos = subject.get("clos") or []
        notes = subject.get("notes") or []
        source_structure = subject.get("source_structure", "Not specified")
        source_detail = subject.get("source_detail", "Not specified")
        year = subject.get("year")
        trimester = subject.get("trimester")
        intake = subject.get("intake_cycle_label")
        credits = subject.get("credit_hours")
        contact_hours = subject.get("contact_hours") or "Not specified"
        objective = subject.get("objective") or "No objective is specified."
        category = subject.get("category") or "Not specified"
        group = subject.get("group") or "Not specified"

        add(
            subject,
            "overview",
            f"What is {code} {title} about?",
            f"{code} {title} is a {category} subject in the {group} group. Objective: {objective}",
        )
        add(subject, "code_to_name", f"What is the title of {code}?", f"{code} is {title}.")
        add(subject, "name_to_code", f"What is the subject code for {title}?", f"The subject code for {title} is {code}.")
        add(subject, "aliases", f"What aliases are listed for {code} {title}?", f"Aliases for {code} {title}: {alias_text}")
        add(
            subject,
            "placement",
            f"When is {code} {title} placed in the Intelligent Robotics plan?",
            f"{code} {title} is listed in Year {year}, Trimester {trimester}, intake cycle {intake}.",
        )
        add(subject, "credits", f"How many credit hours is {code}?", f"{code} {title} carries {credits} credit hour(s).")
        add(subject, "contact_hours", f"What are the contact hours for {code}?", f"{code} {title} contact hours: {contact_hours}.")
        add(subject, "prerequisite", f"What prerequisite does Master&Plan list for {code} {title}?", f"Prerequisite for {code} {title}: {prerequisites}")
        add(subject, "objective", f"What is the objective of {code} {title}?", objective)
        add(subject, "assessment", f"How is {code} {title} assessed?", format_assessment(assessment))

        for index, item in enumerate(assessment, start=1):
            label = item.get("item", f"Assessment item {index}")
            weight = item.get("weight")
            weight_text = f"{weight}%" if weight is not None else "weight not specified"
            add(
                subject,
                "assessment_item",
                f"What is assessment item {index} for {code}?",
                f"Assessment item {index} for {code} {title}: {label}, {weight_text}.",
            )

        add(subject, "laboratory", f"Does {code} {title} have laboratory work?", f"Laboratory for {code} {title}: {format_items(laboratory)}")
        if isinstance(laboratory, list):
            for index, lab in enumerate(laboratory, start=1):
                add(subject, "laboratory_item", f"What is lab item {index} for {code}?", f"Lab item {index} for {code} {title}: {lab}.")

        add(subject, "topics", f"What topics are covered in {code} {title}?", f"Course contents for {code} {title}: {format_items(topics)}")
        for index, topic in enumerate(topics, start=1):
            add(subject, "topic_item", f"What is topic {index} in {code}?", f"Topic {index} in {code} {title}: {topic}.")

        add(subject, "clos", f"What are the course learning outcomes for {code} {title}?", f"Course learning outcomes for {code} {title}: {format_items(clos)}")
        for index, clo in enumerate(clos, start=1):
            add(subject, "clo_item", f"What is CLO {index} for {code}?", f"CLO {index} for {code} {title}: {clo}")

        add(
            subject,
            "source",
            f"What sources were used for {code} {title}?",
            f"{code} {title} uses source structure {source_structure} and source detail {source_detail}.",
        )
        add(subject, "notes", f"What notes are listed for {code} {title}?", f"Notes for {code} {title}: {format_items(notes)}")

        if subject.get("full_text"):
            add(subject, "full_outline", f"Show the full subject outline for {code} {title}.", subject["full_text"])

        add(
            subject,
            "study_scope",
            f"What should a student know from {code} {title}?",
            f"{code} {title} objective: {objective} Key contents: {format_items(topics)} Learning outcomes: {format_items(clos)}",
        )

    return rows


def build_alias_mapping_qa_rows(alias_mapping: dict) -> list[dict]:
    rows = []
    for code, info in sorted(alias_mapping.items()):
        title = info.get("canonical_title", code)
        alias_codes = info.get("alias_codes", [])
        alias_titles = info.get("alias_titles", [])
        rows.append(
            {
                "id": f"IR-MP-ALIAS-{slug(code).upper()}",
                "type": "subject_alias_mapping",
                "course_code": code,
                "course_name": title,
                "programme": PROGRAMME,
                "question": f"What aliases are mapped to {code} {title}?",
                "answer": f"{code} {title} alias codes: {format_items(alias_codes)} Alias titles: {format_items(alias_titles)}",
                "content": f"{code} {title} alias codes: {format_items(alias_codes)} Alias titles: {format_items(alias_titles)}",
                "source": "Master&Plan subject aliases",
                "source_url": str(MASTER_ALIASES_JSON),
                "tags": ["aliases", "subject_aliases", "intelligent_robotics"],
            }
        )
        for alias in alias_codes:
            rows.append(
                {
                    "id": f"IR-MP-ALIAS-CODE-{slug(alias).upper()}",
                    "type": "subject_alias_code",
                    "course_code": code,
                    "course_name": title,
                    "programme": PROGRAMME,
                    "question": f"What canonical subject does alias code {alias} map to?",
                    "answer": f"Alias code {alias} maps to {code} {title}.",
                    "content": f"Alias code {alias} maps to {code} {title}.",
                    "source": "Master&Plan subject aliases",
                    "source_url": str(MASTER_ALIASES_JSON),
                    "tags": ["alias_code", "subject_aliases", "intelligent_robotics"],
                }
            )
        for alias in alias_titles:
            rows.append(
                {
                    "id": f"IR-MP-ALIAS-TITLE-{slug(code + '-' + alias).upper()}",
                    "type": "subject_alias_title",
                    "course_code": code,
                    "course_name": title,
                    "programme": PROGRAMME,
                    "question": f"What canonical subject does alias title {alias} map to?",
                    "answer": f"Alias title {alias} maps to {code} {title}.",
                    "content": f"Alias title {alias} maps to {code} {title}.",
                    "source": "Master&Plan subject aliases",
                    "source_url": str(MASTER_ALIASES_JSON),
                    "tags": ["alias_title", "subject_aliases", "intelligent_robotics"],
                }
            )
    return rows


def build_prereq_graph_qa_rows(prereq_graph: dict) -> list[dict]:
    rows = []
    for code, prerequisites in sorted(prereq_graph.items()):
        rows.append(
            {
                "id": f"IR-MP-PREREQ-GRAPH-{slug(code).upper()}",
                "type": "subject_prerequisite_graph",
                "course_code": code,
                "course_name": code,
                "programme": PROGRAMME,
                "question": f"What prerequisites does the Master&Plan graph list for {code}?",
                "answer": f"The Master&Plan prerequisite graph lists these prerequisite codes for {code}: {format_items(prerequisites)}",
                "content": f"The Master&Plan prerequisite graph lists these prerequisite codes for {code}: {format_items(prerequisites)}",
                "source": "Master&Plan prerequisite graph",
                "source_url": str(MASTER_PREREQ_GRAPH_JSON),
                "tags": ["prerequisite_graph", "subject_master", "intelligent_robotics"],
            }
        )
    return rows


def build_open_day_qa_rows(subjects: list[dict]) -> list[dict]:
    rows = []

    def add(question: str, answer: str, row_type: str = "open_day_parent_student", course_codes: list[str] | None = None) -> None:
        rows.append(
            {
                "id": f"IR-OPEN-DAY-{len(rows) + 1:03d}",
                "type": row_type,
                "programme": PROGRAMME,
                "question": question,
                "answer": answer,
                "content": answer,
                "source": "Open day parent and student QA expansion",
                "source_url": SOURCE_URL,
                "tags": ["open_day", "parent", "student", "intelligent_robotics"],
                **({"course_codes": course_codes} if course_codes else {}),
            }
        )

    total_core_courses = sum(len(courses) for courses in CORE_BY_YEAR.values())
    total_byoc = sum(len(subjects) for subjects in BYOC.values())
    career_answer = "Graduates can target roles such as " + ", ".join(CAREERS) + "."
    requirements_answer = "Entry routes include Foundation/Matriculation, STPM, A-Level, UEC, STAM, Diploma, DKM/DLKM/DVM, other recognised equivalents, or APEL.A where applicable."
    structure_answer = "The programme runs for 3 years. Year 1 builds maths, programming, electronics and modelling; Year 2 adds AI, control, sensors and machine vision; Year 3 includes projects, industrial training, embedded systems, robot programming and BYOC electives."

    general_pairs = [
        ("How many years is Intelligent Robotics?", "Intelligent Robotics is a 3-year programme."),
        ("How long will my child study in Intelligent Robotics?", "Your child should expect a 3-year Bachelor of Science (Honours) programme."),
        ("Is Intelligent Robotics suitable for open day students who like robots?", "Yes. It combines robotics, electronics, AI, automation and computer programming with hands-on practical work."),
        ("What is this Intelligent Robotics course about overall?", PROGRAMME_DESCRIPTION),
        ("What will students learn in this robotics degree?", "Students learn engineering fundamentals, electronics, robotics, artificial intelligence, automation, embedded systems, machine vision, control and programming."),
        ("Is this more hardware or software?", "It is multidisciplinary: students study both hardware areas such as electronics, sensors and embedded systems, and software areas such as programming, AI, machine learning and robot programming."),
        ("Is there hands-on learning?", "Yes. The programme emphasises hands-on practical skills, real-world applications, projects, modelling, embedded systems, robot programming and industrial training."),
        ("Do students need programming?", "Yes. Programming is part of the pathway through Computer and Programming, Advanced Programming, Machine Learning, Making Embedded Systems and Robot Programming."),
        ("Do students need strong maths?", "Maths is important. Year 1 includes Technical Calculus, Differential Equations, and Linear Algebra and Numerical Methods to support robotics, control, signals and AI."),
        ("What if my child is interested in AI and robots?", "This programme fits that interest because it combines robotics with artificial intelligence, machine learning, machine vision, embedded systems and automation."),
        ("What jobs can I do after I finish?", career_answer),
        ("What job can my child get after this degree?", career_answer),
        ("What are the career options after graduating?", career_answer),
        ("What are the crerre options for this course?", career_answer),
        ("What career can I do after finish Intelligent Robotics?", career_answer),
        ("Can graduates work in automation?", "Yes. The listed career prospects include Control and Automation Specialist, Industry 4.0 Technologist, Production and Planning Engineer and related robotics roles."),
        ("Can graduates work in AI?", "Yes. The listed career prospects include AI and Machine Learning Developer, plus robotics roles that use AI, machine vision and automation."),
        ("Can graduates work with drones?", "Yes. The programme includes Mobile Robots and Drones and prepares students for robotics, control, embedded and automation roles."),
        ("Can graduates work in embedded systems?", "Yes. The career prospects include Embedded System Designer, and the study plan includes microcontrollers, electronics and Making Embedded Systems."),
        ("Can graduates work in manufacturing?", "Yes. Career paths include Production and Planning Engineer, Industry 4.0 Technologist, automation and robotics system roles."),
        ("What are the entry requirements overall?", requirements_answer),
        ("What are the total requirements to enter?", requirements_answer),
        ("Can diploma students apply?", "Yes. A recognised Diploma in a related field with minimum CGPA 2.00 or equivalent is listed as an entry route."),
        ("Can A-Level students apply?", "Yes. A-Level applicants need a minimum Grade D in any two subjects."),
        ("Can STPM students apply?", "Yes. STPM or equivalent requires at least Grade C (GP 2.00) in any 2 subjects."),
        ("Can UEC students apply?", "Yes. UEC applicants need a minimum Grade B in at least five subjects."),
        ("Can DKM DLKM or DVM students apply?", "Yes. DKM, DLKM or DVM applicants need minimum CGPA 2.50; below 2.50 requires at least two years of related work experience, and a Bridging Programme may be required."),
        ("Can working adults use APEL?", f"Yes. Applicants with an APEL.A certificate from MQA can use that route for Bachelor programme admission. Page link: {APEL_A_URL}."),
        ("Is there a bridging programme?", ENTRY_REQUIREMENT_NOTE),
        ("Where can we apply?", "Use the APPLY NOW link: https://www.mmu.edu.my/apply-now/."),
        ("Where can parents ask about intake?", "Use the INTAKE INFO link: https://www.mmu.edu.my/intake_enquiry/."),
        ("Is scholarship information available?", "Yes. Scholarship information is linked at https://www.mmu.edu.my/financial-assistance/."),
        ("Where can I download the brochure?", "The brochure link is https://www.mmu.edu.my/wp-content/uploads/2026/05/2026-MMU_FOE-FAIE-FET-FCI-FIST-14-05-2026-small.pdf."),
        ("Where can I check programme fees?", "The programme fees link is https://www.mmu.edu.my/wp-content/uploads/2023/07/UG_Fee-Structure_update_150725_MQA.pdf."),
        ("What is the programme structure summary?", structure_answer),
        ("What does Year 1 focus on?", "Year 1 builds maths, programming, microcontrollers, circuits, electronics, digital design, numerical methods and rapid modelling."),
        ("What does Year 2 focus on?", "Year 2 adds signals, electromagnetics, machines and power systems, mechanisms, AI, sensors, instrumentation, control, advanced programming, machine learning and machine vision."),
        ("What does Year 3 focus on?", "Year 3 includes Mobile Robots and Drones, Project I, Project II, Industrial Training, Making Embedded Systems, Robot Programming and BYOC electives."),
        ("Does the course include internship?", "Yes. Industrial Training is part of Year 3 and requires completed 60 credit hours."),
        ("Does the course have final year project?", "Yes. Project I and Project II are in Year 3. Project I requires completed 60 credit hours; Project II requires completed 60 credit hours and Project I."),
        ("How many core courses are listed?", f"The extracted programme structure lists {total_core_courses} core course/activity entries across Year 1, Year 2 and Year 3, including projects, industrial training and BYOC slots."),
        ("How many BYOC choices are available?", f"The extracted BYOC lists include {total_byoc} choices across March/April and October/November offerings."),
        ("What is BYOC?", "BYOC means students can choose elective subjects from the listed BYOC options, subject to offering and availability."),
        ("Should a parent choose this for a child who likes practical engineering?", "It is a good fit for practical engineering interests because it covers electronics, embedded systems, robotics mechanisms, sensors, control, projects and industrial training."),
        ("Should a student choose this if they like coding?", "It can fit a coding-focused student because the plan includes Computer and Programming, Advanced Programming, Machine Learning, Making Embedded Systems and Robot Programming."),
        ("What makes this different from pure AI?", "This programme is broader than pure AI because it combines AI with robotics hardware, electronics, sensors, control, embedded systems, machine vision and automation."),
        ("Is this programme accredited?", f"The programme page lists registration {REGISTRATION_ID} and accreditation {MQA_ID}."),
        ("Which faculty offers it?", f"It is offered by {FACULTY}."),
        ("What is the official programme name?", PROGRAMME),
        ("What is the page title for this programme?", WEBSITE_TITLE),
    ]

    for question, answer in general_pairs:
        add(question, answer)

    subject_lookup = {
        subject.get("canonical_code"): subject
        for subject in subjects
        if subject.get("canonical_code") and subject.get("canonical_title")
    }
    for course in all_courses():
        subject = subject_lookup.get(course["code"])
        credits = subject.get("credit_hours") if subject else None
        credit_text = f"{course['code']} {course['name']} carries {credits} credit hour(s)." if credits is not None else f"{course['code']} {course['name']} credit hours are not specified in the extracted subject master."
        add(f"How many credits is {course['name']}?", credit_text, "open_day_subject_credit", [course["code"]])
        if len(rows) >= 100:
            break

    while len(rows) < 100:
        course = all_courses()[(len(rows) - len(general_pairs)) % len(all_courses())]
        subject = subject_lookup.get(course["code"])
        credits = subject.get("credit_hours") if subject else None
        credit_text = f"{course['code']} {course['name']} carries {credits} credit hour(s)." if credits is not None else f"{course['code']} {course['name']} credit hours are not specified in the extracted subject master."
        add(f"As a parent, how many credit hours does {course['name']} have?", credit_text, "open_day_subject_credit", [course["code"]])

    return rows[:100]


def build_graph(qa_rows: list[dict]) -> dict:
    nodes = [
        {"id": "programme:intelligent_robotics", "type": "programme", "label": PROGRAMME, "source": SOURCE},
    ]
    edges = []

    for year in CORE_BY_YEAR:
        year_id = f"year:{slug(year)}"
        nodes.append({"id": year_id, "type": "year", "label": year})
        edges.append({"source": "programme:intelligent_robotics", "target": year_id, "type": "HAS_YEAR"})

    for course in all_courses():
        course_id = f"course:{course['code']}"
        year_id = f"year:{slug(course['year'])}"
        nodes.append(
            {
                "id": course_id,
                "type": "course",
                "label": f"{course['code']} {course['name']}",
                "code": course["code"],
                "name": course["name"],
                "year": course["year"],
                "category": course["category"],
            }
        )
        edges.append({"source": year_id, "target": course_id, "type": "CONTAINS_COURSE"})
        edges.append({"source": course_id, "target": "programme:intelligent_robotics", "type": "BELONGS_TO_PROGRAMME"})
        for prereq in course["prereq"]:
            prereq_code = prereq.split()[0]
            prereq_id = f"course:{prereq_code}" if prereq_code.startswith(("AR", "MI")) else f"rule:{slug(prereq)}"
            if not any(node["id"] == prereq_id for node in nodes):
                nodes.append({"id": prereq_id, "type": "rule", "label": prereq})
            edges.append({"source": course_id, "target": prereq_id, "type": "REQUIRES"})

    node_ids = {node["id"] for node in nodes}
    for row in qa_rows:
        if row.get("course_code"):
            course_id = f"course:{row['course_code']}"
            if course_id not in node_ids:
                nodes.append(
                    {
                        "id": course_id,
                        "type": "course",
                        "label": f"{row['course_code']} {row.get('course_name', '')}".strip(),
                        "code": row["course_code"],
                        "name": row.get("course_name"),
                        "source": row.get("source"),
                    }
                )
                edges.append({"source": course_id, "target": "programme:intelligent_robotics", "type": "BELONGS_TO_PROGRAMME"})
                node_ids.add(course_id)

        qa_id = f"qa:{row['id']}"
        nodes.append({"id": qa_id, "type": "qa", "label": row["question"], "answer": row["answer"], "source": row["source"]})
        target = "programme:intelligent_robotics"
        if row.get("course_code"):
            target = f"course:{row['course_code']}"
        elif row.get("course_codes"):
            target = f"course:{row['course_codes'][0]}"
        edges.append({"source": qa_id, "target": target, "type": "ANSWERS_ABOUT"})

    return {
        "version": 1,
        "programme": PROGRAMME,
        "source": SOURCE,
        "source_url": SOURCE_URL,
        "nodes": nodes,
        "edges": edges,
    }


def build_prereq_graph_mapping() -> dict:
    graph: dict[str, list[str]] = {}
    for code, prereqs in PREREQS.items():
        for prereq in prereqs:
            prereq_code = prereq.split()[0]
            graph.setdefault(prereq_code, [])
            if code not in graph[prereq_code]:
                graph[prereq_code].append(code)
    return {key: sorted(value) for key, value in sorted(graph.items())}


def build_programme_plan() -> dict:
    return {
        PROGRAMME_SHORT: {
            year.replace(" ", ""): [code for code, _ in courses]
            for year, courses in CORE_BY_YEAR.items()
        }
    }


def build_pageindex(structure_rows: list[dict], qa_rows: list[dict], graph: dict) -> dict:
    children = []
    for row in structure_rows:
        children.append(
            {
                "title": row["question"],
                "node_id": row["id"],
                "page_number": None,
                "summary": row["answer"],
                "content": f"Q: {row['question']}\nA: {row['answer']}",
                "metadata": {"type": row["type"], "source": row["source"], "source_url": row["source_url"]},
            }
        )
    for row in qa_rows:
        children.append(
            {
                "title": row["question"],
                "node_id": row["id"],
                "page_number": None,
                "summary": row["answer"],
                "content": f"Q: {row['question']}\nA: {row['answer']}",
                "metadata": {
                    "type": "qa",
                    "course_code": row.get("course_code"),
                    "course_name": row.get("course_name"),
                    "source": row["source"],
                    "source_url": row["source_url"],
                },
            }
        )

    return {
        "doc_name": "MMU Intelligent Robotics programme page + rebuilt QA graph",
        "source_url": SOURCE_URL,
        "structure": [
            {
                "title": PROGRAMME,
                "node_id": "ir-root",
                "page_number": None,
                "summary": (
                    "Rebuilt Intelligent Robotics RAG index from the MMU programme page, generated QA pairs, "
                    "course-year links, prerequisite links, BYOC subjects, university subjects, and career prospects."
                ),
                "content": f"{PROGRAMME}\nSource: {SOURCE_URL}\nGraph nodes: {len(graph['nodes'])}; edges: {len(graph['edges'])}.",
                "children": children,
            }
        ],
    }


def merge_replace(path: Path, new_rows: list[dict], is_robotics) -> None:
    old_rows = read_jsonl(path)
    kept = [row for row in old_rows if not is_robotics(row)]
    write_jsonl(path, kept + new_rows)


def main() -> None:
    KB_DIR.mkdir(parents=True, exist_ok=True)
    PAGEINDEX_DIR.mkdir(parents=True, exist_ok=True)
    subject_master = load_subject_master()
    subject_aliases = load_json_dict(MASTER_ALIASES_JSON)
    source_prereq_graph = load_json_dict(MASTER_PREREQ_GRAPH_JSON)

    source_facts = {
        "programme": PROGRAMME,
        "website_title": WEBSITE_TITLE,
        "page_meta_description": PAGE_META_DESCRIPTION,
        "page_modified_time": PAGE_MODIFIED_TIME,
        "faculty": FACULTY,
        "duration": "3 years",
        "registration": REGISTRATION_ID,
        "mqa": MQA_ID,
        "description": PROGRAMME_DESCRIPTION,
        "source": SOURCE,
        "source_url": SOURCE_URL,
        "page_action_links": [{"label": label, "url": href} for label, href in PAGE_ACTION_LINKS],
        "page_top_links": [{"label": label, "url": href} for label, href in PAGE_TOP_LINKS],
        "page_support_links": [{"label": label, "url": href} for label, href in PAGE_SUPPORT_LINKS],
        "page_sections": PAGE_SECTIONS,
        "apel_a_url": APEL_A_URL,
        "core_by_year": CORE_BY_YEAR,
        "byoc": BYOC,
        "university_subjects": UNIVERSITY_SUBJECTS,
        "career_prospects": CAREERS,
        "entry_requirements": ENTRY_REQUIREMENTS,
        "entry_requirement_note": ENTRY_REQUIREMENT_NOTE,
        "master_plan_source_dir": str(MASTER_PLAN_DIR),
        "subject_master_count": len(subject_master),
        "subject_master": subject_master,
        "subject_aliases": subject_aliases,
        "source_prerequisite_graph": source_prereq_graph,
    }

    structure_rows = build_structure_rows()
    course_qa_rows = build_course_qa_rows()
    subject_detail_qa_rows = build_subject_detail_qa_rows(subject_master)
    subject_alias_qa_rows = build_alias_mapping_qa_rows(subject_aliases)
    source_prereq_graph_qa_rows = build_prereq_graph_qa_rows(source_prereq_graph)
    open_day_qa_rows = build_open_day_qa_rows(subject_master)
    detail_qa_rows = course_qa_rows + subject_detail_qa_rows + subject_alias_qa_rows + source_prereq_graph_qa_rows + open_day_qa_rows
    all_qa_rows = structure_rows + detail_qa_rows
    graph = build_graph(all_qa_rows)

    (KB_DIR / "intelligent_robotics_source_facts.json").write_text(json.dumps(source_facts, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (KB_DIR / "intelligent_robotics_connected_graph.json").write_text(json.dumps(graph, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    write_jsonl(KB_DIR / "intelligent_robotics_qa_pairs.jsonl", all_qa_rows)

    plan_path = KB_DIR / "programme_plan.json"
    write_jsonl(KB_DIR / "programme_structure.jsonl", structure_rows)
    write_jsonl(KB_DIR / "hive_course_qa_pairs.jsonl", detail_qa_rows)
    plan_path.write_text(json.dumps(build_programme_plan(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    (KB_DIR / "prereq_graph.json").write_text(json.dumps(build_prereq_graph_mapping(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (KB_DIR / "prereq_rules.json").write_text(json.dumps({
        code: {"title": next((c["name"] for c in all_courses() if c["code"] == code), code), "prerequisites": prereqs}
        for code, prereqs in sorted(PREREQS.items())
    }, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (PAGEINDEX_DIR / "BSc-IR-March-2026-T2610_structure.json").write_text(
        json.dumps(build_pageindex(structure_rows, detail_qa_rows, graph), indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(f"Generated {len(structure_rows)} structure rows")
    print(f"Generated {len(course_qa_rows)} course QA rows")
    print(f"Loaded {len(subject_master)} Master&Plan subject rows")
    print(f"Generated {len(subject_detail_qa_rows)} Master&Plan subject-detail QA rows")
    print(f"Generated {len(subject_alias_qa_rows)} Master&Plan alias QA rows")
    print(f"Generated {len(source_prereq_graph_qa_rows)} Master&Plan prerequisite graph QA rows")
    print(f"Generated {len(open_day_qa_rows)} open-day parent/student QA rows")
    print(f"Generated {len(all_qa_rows)} total Intelligent Robotics QA rows")
    print(f"Generated graph nodes={len(graph['nodes'])} edges={len(graph['edges'])}")
    print(f"Wrote {KB_DIR / 'intelligent_robotics_connected_graph.json'}")
    print(f"Wrote {PAGEINDEX_DIR / 'BSc-IR-March-2026-T2610_structure.json'}")


if __name__ == "__main__":
    main()
