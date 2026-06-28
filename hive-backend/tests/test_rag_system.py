import os

import requests


BASE_URL = os.environ.get("HIVE_BACKEND_BASE_URL", "http://127.0.0.1:8000")
ANSWER_ROUTES = {
    "deterministic_rebuilt_rag",
    "deterministic_eval_qa",
    "deterministic_similar_qa",
    "deterministic_course_rules",
    "rag_first",
}


def ask(question: str) -> dict:
    response = requests.post(
        f"{BASE_URL}/ask",
        json={"question": question},
        timeout=30,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["route"] in ANSWER_ROUTES
    assert data["answer"]
    return data


def test_health():
    response = requests.get(f"{BASE_URL}/api/health", timeout=5)

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_year_1_structure_query():
    data = ask("What courses are listed in Year 1 for Intelligent Robotics?")
    answer = data["answer"]

    assert "Technical Calculus" in answer
    assert "Computer and Programming" in answer
    assert "Micro-Controllers" in answer


def test_year_1_course_codes_query():
    data = ask("What course codes are listed in Year 1 for Intelligent Robotics?")
    answer = data["answer"]

    assert "ARM6113" in answer
    assert "ARC6113" in answer
    assert "ARC6123" in answer


def test_alias_resolution_from_master_plan():
    data = ask("What canonical subject does alias code MID6113 map to?")
    answer = data["answer"]

    assert "MID6113" in answer
    assert "MMD6123" in answer
    assert "Digital Fabrication and Prototyping" in answer


def test_prerequisite_rule_query():
    data = ask("What are the prerequisites for Project II?")
    answer = data["answer"]

    assert "Project II" in answer
    assert "completed 60 credit hours" in answer.lower()
    assert "Project I" in answer
