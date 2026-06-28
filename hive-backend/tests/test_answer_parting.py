import os

os.environ.setdefault("DEEPSEEK_API_KEY", "test-key")

from app.advisor.session_manager import SessionState
from app.api.chat import _next_answer_part, _with_memory_answer_parts


def test_long_answer_uses_three_memory_layers_for_followup_parts():
    session = SessionState(session_id="parts-test")
    memory = {"layers": {"profile": {}, "preferences": {}, "task_state": {}}}
    answer = " ".join(
        f"Sentence {index} explains a detailed programme point with enough words to make the answer bulky."
        for index in range(1, 10)
    )

    first = _with_memory_answer_parts("tell me about the programme", answer, session, memory)
    second = _next_answer_part(session)
    third = _next_answer_part(session)

    assert first.endswith("Do you want to know more?")
    assert second and second.endswith("Do you want to know more?")
    assert third
    assert "answer_parts" not in session.metadata


def test_full_detail_question_skips_answer_parting():
    session = SessionState(session_id="parts-test")
    memory = {"layers": {"profile": {}, "preferences": {}, "task_state": {}}}
    answer = " ".join(f"Sentence {index} has detailed content." for index in range(1, 20))

    assert _with_memory_answer_parts("show me the full answer", answer, session, memory) == answer
    assert "answer_parts" not in session.metadata


def test_long_low_punctuation_answer_still_splits():
    session = SessionState(session_id="parts-test")
    memory = {"layers": {"profile": {}, "preferences": {}, "task_state": {}}}
    answer = " ".join(f"technical_detail_{index}" for index in range(90))

    first = _with_memory_answer_parts("what should I know", answer, session, memory)

    assert first.endswith("Do you want to know more?")
    assert session.metadata["answer_parts"]["next_index"] == 1
