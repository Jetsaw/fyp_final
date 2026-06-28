import os

import requests


BASE_URL = os.environ.get("HIVE_BACKEND_BASE_URL", "http://127.0.0.1:8000")


def ask(question: str) -> dict:
    response = requests.post(
        f"{BASE_URL}/ask",
        json={"question": question},
        timeout=30,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["answer"]
    return data


def test_intelligent_robotics_programme_overview():
    data = ask("Tell me about the Intelligent Robotics programme")
    answer = data["answer"].lower()

    assert data["used_rag"] is True
    assert "robotics" in answer
    assert "intelligent" in answer


def test_master_plan_assessment_answer():
    data = ask("How is ARM6113 Technical Calculus assessed?")
    answer = data["answer"]

    assert data["route"] == "deterministic_rebuilt_rag"
    assert "Tests/Quizzes: 40%" in answer
    assert "Final Examination: 60%" in answer


def test_scraped_page_action_links_are_complete():
    data = ask("What action links are provided on the MMU Intelligent Robotics page?")
    answer = data["answer"]

    assert "ENQUIRE NOW" in answer
    assert "HOW TO APPLY" in answer
    assert "DOWNLOAD BROCHURE" in answer
    assert "DOWNLOAD PROGRAMME FEES" in answer
    assert "UG_Fee-Structure_update_150725_MQA.pdf" in answer


def test_reported_robot_programing_typo_matches_robot_programming():
    data = ask("robot programing")
    answer = data["answer"]

    assert data["route"] == "deterministic_rebuilt_rag"
    assert data["used_rag"] is True
    assert "ARR6163" in answer
    assert "Robot Programming" in answer


def test_reported_math_1_alias_matches_technical_calculus():
    data = ask("math 1")
    answer = data["answer"]

    assert data["route"] == "deterministic_rebuilt_rag"
    assert data["used_rag"] is True
    assert "ARM6113" in answer
    assert "Technical Calculus" in answer


def test_reported_typo_more_intelligent_robotics_returns_overview():
    data = ask("ell me more Intelligent Robotics")
    answer = data["answer"]

    assert data["route"] == "deterministic_rebuilt_rag"
    assert data["used_rag"] is True
    assert "Intelligent Robotics" in answer
    assert "Faculty of Artificial Intelligence and Engineering" in answer


def test_open_day_career_typo_matches_career_prospects():
    data = ask("what are the crerre after finish this course")
    answer = data["answer"]

    assert data["route"] == "deterministic_rebuilt_rag"
    assert data["used_rag"] is True
    assert "Robotics System Designer" in answer
    assert "Industry 4.0 Technologist" in answer


def test_open_day_job_after_finish_matches_career_prospects():
    data = ask("what job can i do after i finish")
    answer = data["answer"]

    assert data["route"] == "deterministic_rebuilt_rag"
    assert data["used_rag"] is True
    assert "AI and Machine Learning Developer" in answer


def test_math_1_credit_question_uses_credit_row():
    data = ask("how many credit hours for math 1")
    answer = data["answer"]

    assert data["route"] == "deterministic_rebuilt_rag"
    assert data["used_rag"] is True
    assert "ARM6113" in answer
    assert "3 credit hour" in answer


def test_open_day_child_likes_coding_and_robots():
    data = ask("what if my child likes coding and robots")
    answer = data["answer"]

    assert data["route"] == "deterministic_rebuilt_rag"
    assert data["used_rag"] is True
    assert "coding-focused" in answer
    assert "Robot Programming" in answer


def test_open_day_hardware_or_software_without_question_mark():
    data = ask("is this more hardware or software")
    answer = data["answer"]

    assert data["route"] == "deterministic_rebuilt_rag"
    assert data["used_rag"] is True
    assert "hardware" in answer.lower()
    assert "software" in answer.lower()
