from app.rag.course_guard import answer_course_question
from app.course_guard_server import _fallback_answer


def test_similar_credit_question_uses_existing_qa_pair():
    answer = answer_course_question("How many credit hours does Wireless Communications have?")

    assert answer
    assert answer["route"] == "deterministic_similar_qa"
    assert answer["matched_id"] == "ATE6133-02"
    assert answer["answer"] == "ATE6133 Wireless Communications carries 3 credit hour(s)."


def test_similar_byoc_question_uses_existing_qa_pair():
    answer = answer_course_question("Which intake has Fundamental Wireless Communication BYOC?")

    assert answer
    assert answer["route"] == "deterministic_similar_qa"
    assert answer["matched_id"] == "IR-BEGINNER-0171"


def test_typo_question_autocorrects_to_existing_qa_pair():
    answer = answer_course_question("Hw many creadit hurs does Wireless Communication have?")

    assert answer
    assert answer["route"] == "deterministic_similar_qa"
    assert answer["matched_id"] == "ATE6133-02"


def test_same_meaning_credit_question_uses_existing_qa_pair():
    answer = answer_course_question("Can you tell me the credit hours for Wireless Communications?")

    assert answer
    assert answer["route"] == "deterministic_similar_qa"
    assert answer["matched_id"] == "ATE6133-02"


def test_byoc_slot_fact_is_not_rewritten_as_advice():
    answer = answer_course_question("Which year is BYOC-1 Elective 1 BYOC listed in?")

    assert answer
    assert answer["route"] in {"deterministic_byoc_slot", "deterministic_eval_qa"}
    assert "BYOC-1" in answer["answer"]
    assert "Year 3" in answer["answer"]


def test_intelligent_robotics_overview_is_short_and_invites_followup():
    answer = answer_course_question("tell me about Bachelor of Science Intelligent Robotics")

    assert answer
    assert "Faculty of Artificial Intelligence and Engineering (FAIE)" in answer["answer"]
    assert "R/0788/6/00177" in answer["answer"]
    assert "MQA/SWA14238" in answer["answer"]
    assert "IR4.0" in answer["answer"]
    assert answer["answer"].endswith("Do you want to know more?")


def test_singular_intelligent_robotic_overview_is_short():
    answer = answer_course_question("tell me about intelligent robotic")

    assert answer
    assert "Bachelor of Science (Honours) in Intelligent Robotics" in answer["answer"]
    assert "computer programming" in answer["answer"]
    assert "real-world applications" in answer["answer"]
    assert answer["answer"].endswith("Do you want to know more?")


def test_unknown_question_uses_safe_staff_fallback():
    answer = answer_course_question("what is cafeteria menu on Mars?")

    assert answer["route"] == "safe_fallback"
    assert "rephrase your question" in answer["answer"]
    assert "FAIE staff" in answer["answer"]

    standalone = _fallback_answer("what is cafeteria menu on Mars?")
    assert standalone["answer"] == answer["answer"]


def test_category_question_asks_for_year_or_full_list():
    answer = answer_course_question("what are the robotic program being offer")

    assert answer
    assert answer["route"] == "deterministic_course_category_prompt"
    assert "Year 1" in answer["answer"]
    assert "full list" in answer["answer"]


def test_category_full_list_returns_names_without_codes():
    answer = answer_course_question("give me the full list of robotic courses in this course")

    assert answer
    assert answer["route"] == "deterministic_course_category"
    assert "Robotics - Machine Design and Mechanisms" in answer["answer"]
    assert "Robot Programming" in answer["answer"]
    assert "ARR" not in answer["answer"]


def test_category_year_filter_returns_names_without_codes():
    answer = answer_course_question("what are the electronic courses in year 1")

    assert answer
    assert answer["route"] == "deterministic_course_category"
    assert "Electrical Circuits" in answer["answer"]
    assert "Basic Electronics" in answer["answer"]
    assert "ARE" not in answer["answer"]


def test_new_join_question_uses_year_one_structure():
    answer = answer_course_question("when i new join the course what course i take")

    assert answer
    assert answer["route"] == "deterministic_starter_courses"
    assert "Source is by year, not semester" in answer["answer"]
    assert "Technical Calculus" in answer["answer"]
    assert "Computer and Programming" in answer["answer"]


def test_project_two_typo_uses_project_ii_prerequisite_rule():
    answer = answer_course_question("What is prereq for projet 2?")

    assert answer
    assert answer["route"] == "deterministic_course_rules"
    assert "Project II" in answer["answer"]
    assert "Project I" in answer["answer"]
    assert "completed 60 credit hours" in answer["answer"].lower()


def test_need_to_take_course_presence_question():
    answer = answer_course_question("Do I need to take Basic Electronics in this robotics degree?")

    assert answer
    assert answer["route"] == "deterministic_course_presence"
    assert answer["answer"].startswith("Yes, you need to take Basic Electronics.")
    assert "Basic Electronics" in answer["answer"]
    assert "Year 1" in answer["answer"]


def test_programme_support_link_question():
    answer = answer_course_question("Where do I go for Scholarship?")

    assert answer
    assert "https://www.mmu.edu.my/financial-assistance/" in answer["answer"]


def test_industry_four_question_uses_source_facts():
    answer = answer_course_question("Does this degree prepare me for Industry 4.0 work?")

    assert answer
    assert "Industry 4.0" in answer["answer"] or "IR4.0" in answer["answer"]


def test_general_prerequisite_code_rule():
    answer = answer_course_question("What is the pre-requisite for ARA6123?")

    assert answer
    assert answer["route"] == "deterministic_course_rules"
    assert "ARA6123" in answer["answer"]
    assert "ARC6113" in answer["answer"]
