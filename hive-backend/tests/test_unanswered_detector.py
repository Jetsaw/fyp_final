from app.services.unanswered_detector import get_uncertainty_reason, is_unanswered


def test_course_code_clarification_is_unanswered():
    answer = "Tell me the course name or code so I can check eligibility."

    flagged, score = is_unanswered(answer, context="", rag_results_count=3)

    assert flagged
    assert score < 0.6
    assert "Bot requested clarification" in get_uncertainty_reason(answer, 3)
