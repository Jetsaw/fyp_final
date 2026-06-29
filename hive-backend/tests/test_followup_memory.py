import asyncio

from app.advisor.session_manager import SessionManager
from app.api import chat as chat_module
from app.api.chat import ChatReq


def test_overview_yes_uses_five_pair_memory(monkeypatch):
    chat_module.SESSION_MANAGER = SessionManager()
    monkeypatch.setattr(chat_module, "initialize_new_rag_system", lambda: None)
    monkeypatch.setattr(chat_module, "save_message", lambda *args, **kwargs: None)

    first = asyncio.run(chat_module.chat(ChatReq(user_id="followup-test", message="tell me about the Intelligent Robotics")))
    second = asyncio.run(chat_module.chat(ChatReq(user_id="followup-test", message="yes")))
    third = asyncio.run(chat_module.chat(ChatReq(user_id="followup-test", message="yes")))
    fourth = asyncio.run(chat_module.chat(ChatReq(user_id="followup-test", message="yes")))

    assert first["memory"]["pairs_count"] == 1
    assert second["route"] == "answer_part_continuation"
    assert "hands-on practical skills" in second["answer"]
    assert second["memory"]["pairs_count"] == 2
    assert "IR4.0" in third["answer"]
    assert "covers robotics" in fourth["answer"]


def test_byoc_advice_uses_five_pair_memory(monkeypatch):
    chat_module.SESSION_MANAGER = SessionManager()
    monkeypatch.setattr(chat_module, "initialize_new_rag_system", lambda: None)
    monkeypatch.setattr(chat_module, "save_message", lambda *args, **kwargs: None)

    first = asyncio.run(chat_module.chat(ChatReq(user_id="byoc-memory-test", message="advise me on BYOC")))
    second = asyncio.run(chat_module.chat(ChatReq(user_id="byoc-memory-test", message="career skill")))
    third = asyncio.run(chat_module.chat(ChatReq(user_id="byoc-memory-test", message="mobile apps and wireless networks")))

    assert first["route"] == "byoc_preference_followup"
    assert second["route"] == "byoc_advice_interest_prompt"
    assert third["route"] == "byoc_memory_recommendation"
    assert third["memory"]["pairs_count"] == 3
    assert third["memory"]["layers"]["preferences"]["byoc"]["goal"] == "career skill"
