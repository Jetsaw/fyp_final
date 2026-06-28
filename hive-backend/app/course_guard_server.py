from fastapi import FastAPI
from pydantic import BaseModel, Field

from app.rag.course_guard import answer_course_question


class AskReq(BaseModel):
    question: str
    history: list[dict] = Field(default_factory=list)
    user_id: str = "hive-kiosk"


class ChatReq(BaseModel):
    user_id: str = "hive-kiosk"
    message: str


app = FastAPI(title="HIVE Course Guard", version="1.0")


def _is_greeting(question: str) -> bool:
    return question.strip().lower() in {
        "hi",
        "hello",
        "hey",
        "hai",
        "helo",
        "good morning",
        "good afternoon",
        "good evening",
    }


def _greeting_answer(question: str) -> dict:
    return {
        "question": question,
        "answer": "Hi, I'm Hive.",
        "route": "greeting",
        "used_rag": False,
        "sources": [],
        "confidence": 1.0,
    }


def _fallback_answer(question: str) -> dict:
    return {
        "question": question,
        "answer": "I could not match that to the Intelligent Robotics knowledge base. Ask about prerequisites, BYOC, study plan, Project I or Project II.",
        "route": "safe_fallback",
        "used_rag": False,
        "sources": [],
        "confidence": 0.0,
    }


def _answer(question: str) -> dict:
    if _is_greeting(question):
        return _greeting_answer(question)

    guarded = answer_course_question(question)
    if guarded:
        return {
            "question": question,
            **guarded,
        }
    return _fallback_answer(question)


@app.get("/health")
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "course_guard"}


@app.post("/ask")
@app.post("/api/ask")
async def ask(req: AskReq):
    return _answer((req.question or "").strip())


@app.post("/api/chat")
async def chat(req: ChatReq):
    return _answer((req.message or "").strip())
