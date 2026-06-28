from datetime import datetime, timedelta

from app.advisor.session_manager import ConversationWindow, SessionManager, SESSION_TTL_SECONDS


def test_conversation_window_keeps_five_recent_pairs():
    assert ConversationWindow().max_pairs == 5


def test_session_expires_after_ten_minutes(tmp_path):
    manager = SessionManager(storage_dir=tmp_path)
    session = manager.get_session("ttl-test")
    session.preferences["byoc"] = {"interests": ["apps"]}
    session.updated_at = (datetime.utcnow() - timedelta(seconds=SESSION_TTL_SECONDS + 1)).isoformat()
    manager._save_session(session)
    manager.sessions.clear()

    fresh = manager.get_session("ttl-test")

    assert fresh.session_id == "ttl-test"
    assert fresh.preferences == {}
    assert fresh.created_at != session.created_at
