from app.rag.course_guard import answer_course_question


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
    assert answer["answer"] == (
        "Bachelor of Science (Honours) in Intelligent Robotics is offered by the "
        "Faculty of Artificial Intelligence and Engineering (FAIE). It is a 3-year programme. "
        "Do you want to know more?"
    )
