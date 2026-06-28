import sqlite3
from typing import List, Dict
from app.core.config import settings


def save_message(user_id: str, role: str, content: str) -> None:
    conn = sqlite3.connect(settings.SQLITE_PATH)
    conn.execute(
        "INSERT INTO messages(user_id, role, content) VALUES (?, ?, ?)",
        (user_id, role, content),
    )
    conn.commit()
    conn.close()
    


def get_recent_messages(user_id: str | None = None, limit: int = 8) -> List[Dict[str, str]]:
    conn = sqlite3.connect(settings.SQLITE_PATH)
    if isinstance(user_id, int):
        limit = user_id
        user_id = None

    if user_id:
        cur = conn.execute(
            "SELECT user_id, role, content, created_at FROM messages WHERE user_id=? ORDER BY id DESC LIMIT ?",
            (user_id, limit),
        )
    else:
        cur = conn.execute(
            "SELECT user_id, role, content, created_at FROM messages ORDER BY id DESC LIMIT ?",
            (limit,),
        )
    rows = cur.fetchall()
    conn.close()

    rows.reverse()
    return [{"user_id": r[0], "role": r[1], "content": r[2], "created_at": r[3]} for r in rows]


# Admin query functions
def get_all_conversations(limit: int = 50) -> list[dict]:
    """Get summary of all user conversations"""
    conn = sqlite3.connect(settings.SQLITE_PATH)
    cur = conn.execute("""
        SELECT 
            user_id,
            COUNT(*) as message_count,
            MAX(created_at) as last_message_time,
            (SELECT content FROM messages m2 
             WHERE m2.user_id = m1.user_id 
             ORDER BY created_at DESC LIMIT 1) as last_message
        FROM messages m1
        GROUP BY user_id
        ORDER BY last_message_time DESC
        LIMIT ?
    """, (limit,))
    
    rows = cur.fetchall()
    conn.close()
    
    return [
        {
            "user_id": r[0],
            "message_count": r[1],
            "last_message_time": r[2],
            "last_message": r[3][:100] if r[3] else "",
        }
        for r in rows
    ]


def get_conversation_history(user_id: str) -> list[dict]:
    """Get full conversation history for a user"""
    conn = sqlite3.connect(settings.SQLITE_PATH)
    cur = conn.execute(
        "SELECT role, content, created_at FROM messages WHERE user_id=? ORDER BY created_at ASC",
        (user_id,),
    )
    rows = cur.fetchall()
    conn.close()
    
    return [{"role": r[0], "content": r[1], "timestamp": r[2]} for r in rows]


