from app.advisor.session_manager import SessionState
from app.api.chat import _answer_byoc_advice


def test_byoc_flow_asks_for_preferences_first():
    session = SessionState(session_id="byoc-test")

    answer = _answer_byoc_advice("tell me byoc", session)

    assert answer
    assert answer["route"] == "byoc_intro"
    assert "Build Your Own Curriculum" in answer["answer"]
    assert "help you choose" in answer["answer"]
    assert session.metadata["task_state"]["pending_flow"] == "byoc"


def test_byoc_flow_explains_then_collects_preferences():
    session = SessionState(session_id="byoc-test")
    _answer_byoc_advice("tell me byoc", session)

    explanation = _answer_byoc_advice("tell me more", session)
    assert explanation
    assert explanation["route"] == "byoc_intro"
    assert "elective slots" in explanation["answer"]

    choice = _answer_byoc_advice("help me choose", session)
    assert choice
    assert choice["route"] == "byoc_preference_followup"
    assert "Tell me what you care about most" in choice["answer"]


def test_byoc_flow_uses_next_turn_preferences():
    session = SessionState(session_id="byoc-test")
    _answer_byoc_advice("Help me choose BYOC", session)

    answer = _answer_byoc_advice("I like mobile apps and wireless networks", session)

    assert answer
    assert answer["route"] == "byoc_memory_recommendation"
    assert "Introductory Mobile Application Development" in answer["answer"]
    assert "Radio Network Planning Towards 5G" in answer["answer"]
    assert len(answer["answer"]) < 320
    assert "Do you want to know more?" not in answer["answer"]
    assert session.preferences["byoc"]["interests"] == ["apps", "networks"]

    followup = _answer_byoc_advice("which one fits robotics projects best?", session)
    assert followup
    assert followup["route"] == "byoc_memory_recommendation"
    assert "Introductory Mobile Application Development" in followup["answer"]


def test_byoc_fact_question_escapes_preference_memory():
    session = SessionState(session_id="byoc-test")
    _answer_byoc_advice("Help me choose BYOC", session)
    _answer_byoc_advice("I like mobile apps and wireless networks", session)

    answer = _answer_byoc_advice("Which year is BYOC-1 Elective 1 BYOC listed in?", session)

    assert answer is None


def test_byoc_faq_question_escapes_preference_memory():
    session = SessionState(session_id="byoc-test")
    _answer_byoc_advice("I like data and AI", session)

    assert _answer_byoc_advice("Why does this course have BYOC electives?", session) is None
    assert _answer_byoc_advice("In wich year is Elective 1 BYOC (BYOC-1) placed?", session) is None
    assert _answer_byoc_advice("Is Personal Finance a BYOC option?", session) is None
    assert _answer_byoc_advice("How do I check if I am eligible for BYOC?", session) is None
    assert _answer_byoc_advice("What should I compare before choosing this course?", session) is None
    assert _answer_byoc_advice("What should I ask the faculty before selecting BYOC?", session) is None
