from fastapi import APIRouter
from pydantic import BaseModel, Field
import re

from app.rag.indexer import build_or_load_structure_index, build_or_load_details_index
from app.rag.retriever import search_structure_layer, search_details_layer
from app.rag.reranker import rerank_results
from app.rag.query_router import route_query
from app.rag.course_guard import answer_course_question
from app.advisor.alias_resolver import resolve_aliases
from app.agents.chatbot_agent import ChatbotAgent
from app.agents.retriever_agent import RetrieverAgent
from app.agents.reflection_agent import ReflectionAgent
from app.advisor.session_manager import get_session_manager
from app.advisor.programme_detection import detect_programme
from app.advisor.context_filters import parse_year_level, apply_context_filters
from app.agents.trace import Trace
from app.memory.repo import save_message
from pathlib import Path



router = APIRouter()

PROGRAMME_DETECTION_CONFIDENCE_THRESHOLD = 0.7
MAX_CONTEXT_CHUNKS = 8
STRUCTURE_LAYER_TOP_K = 10
DETAILS_LAYER_TOP_K = 10
RERANKED_CONTEXT_TOP_K = 8

BYOC_INTERESTS = {
    "leadership": {
        "keywords": ["leadership", "manage", "management", "business", "strategy", "entrepreneur"],
        "label": "leadership and business",
        "subjects": [
            ("March/April", "Project Management", "builds project leadership for FYP, robotics builds, and team work"),
            ("March/April", "Corporate Strategy", "adds business decision-making around technical products"),
            ("October/November", "Design Thinking for Strategic Communication", "helps with problem framing and presentation"),
        ],
    },
    "apps": {
        "keywords": ["app", "apps", "mobile", "software", "coding", "programming"],
        "label": "mobile apps and software",
        "subjects": [
            ("March/April", "Introductory Mobile Application Development", "connects robotics ideas with app interfaces"),
            ("October/November", "Introductory Data Visualization", "helps turn robot or sensor data into usable screens"),
        ],
    },
    "networks": {
        "keywords": ["network", "5g", "wireless", "iot", "connected", "communication", "communications"],
        "label": "networks and connected systems",
        "subjects": [
            ("March/April", "Radio Network Planning Towards 5G", "fits connected robots, wireless systems, and IoT direction"),
            ("March/April", "Fundamental of Wireless Communications", "adds communication fundamentals for connected robotics"),
            ("October/November", "Communications Networks", "fits networking and connected-system interests"),
        ],
    },
    "data": {
        "keywords": ["data", "ai", "analytics", "visualization", "machine learning", "ml"],
        "label": "data and AI support skills",
        "subjects": [
            ("October/November", "Introductory Data Science", "supports AI, analytics, and robotics data work"),
            ("October/November", "Introductory Data Visualization", "helps explain sensor or project data clearly"),
            ("March/April", "Digital Transformation Strategy", "adds digital product and technology adoption context"),
        ],
    },
    "creative": {
        "keywords": ["creative", "media", "film", "video", "motion", "design", "visual"],
        "label": "creative media and visual communication",
        "subjects": [
            ("March/April", "Motion Capture", "fits robotics interaction, animation, and avatar work"),
            ("March/April", "Basic Filmmaking", "helps with demo videos and project presentation"),
            ("October/November", "Visual and Corporate Identity", "helps polish product/project branding"),
        ],
    },
    "finance": {
        "keywords": ["finance", "money", "personal finance", "marketing"],
        "label": "finance and marketing",
        "subjects": [
            ("March/April", "Personal Finance", "adds practical financial literacy"),
            ("October/November", "Principal of Finance", "adds finance basics for product or business planning"),
            ("October/November", "Fundamental of Marketing", "helps with communicating a product to users"),
        ],
    },
}

BYOC_FACT_WORDS = [
    "about",
    "ask",
    "can i",
    "check",
    "connect",
    "course code",
    "course name",
    "credit",
    "credits",
    "eligible",
    "faculty",
    "fit",
    "how many",
    "list",
    "listed",
    "means",
    "minor",
    "need to take",
    "option",
    "offered",
    "outside",
    "selecting",
    "shown",
    "slots",
    "subjects",
    "transcript",
    "track",
    "what is",
    "where",
    "will",
    "why",
    "which year",
    "year",
]
BYOC_ADVICE_WORDS = ["choose", "recommend", "should", "pick", "like", "interest", "interested", "best"]
BYOC_FOLLOWUP_WORDS = ["which one", "easier", "harder", "fits"]
BYOC_PREFERENCE_REPLY_WORDS = ["like", "interest", "interested", "prefer", "want", "enjoy", "good at"]

GLOBAL_INDEX = None
GLOBAL_METAS = None

STRUCTURE_INDEX = None
STRUCTURE_METAS = None
DETAILS_INDEX = None
DETAILS_METAS = None

SESSION_MANAGER = None

CHATBOT_AGENT = ChatbotAgent()
RETRIEVER_AGENT = RetrieverAgent()
REFLECTION_AGENT = ReflectionAgent()


def _safe_rerank(question: str, results: list[dict], top_k: int) -> list[dict]:
    """Use the existing cross-encoder reranker, but keep the API alive if it cannot load."""
    if not results:
        return []
    from app.core.config import settings
    if not settings.RERANKING_ENABLED:
        return sorted(results, key=lambda item: item.get("score", 0.0), reverse=True)[:top_k]
    try:
        return rerank_results(question, results, top_k=top_k)
    except Exception as exc:
        print(f"[WARN] Reranking skipped: {exc}")
        return sorted(results, key=lambda item: item.get("score", 0.0), reverse=True)[:top_k]


def _format_context_chunk(result: dict) -> str:
    layer = result.get("layer")
    text = result.get("text", "")
    if layer == "structure":
        return f"[STRUCTURE] {text}"
    if layer == "details":
        return f"[DETAILS - {result.get('course_code', 'N/A')}] {text}"
    return text


def _extract_sources(results: list[dict]) -> list[dict]:
    sources = []
    seen = set()
    for result in results:
        source = (
            result.get("source")
            or result.get("source_file")
            or result.get("metadata", {}).get("source")
            or result.get("metadata", {}).get("source_file")
            or result.get("id")
        )
        key = (source, result.get("page"), result.get("course_code"), result.get("layer"))
        if not source or key in seen:
            continue
        seen.add(key)
        sources.append({
            "source": source,
            "page": result.get("page"),
            "course_code": result.get("course_code"),
            "layer": result.get("layer"),
            "score": result.get("score"),
        })
    return sources


class ChatReq(BaseModel):
    user_id: str
    message: str


class AskReq(BaseModel):
    question: str
    history: list[dict] = Field(default_factory=list)
    user_id: str = "hive-kiosk"


LONG_ANSWER_LIMIT = 430
MORE_INTENT_RE = re.compile(r"^\s*(yes|yup|yeah|more|tell me more|continue|go on|next)\s*[.!?]*\s*$", re.IGNORECASE)


def _wants_full_detail(question: str) -> bool:
    return bool(re.search(r"\b(all|complete|every|full|full list|full outline|show all|show me all)\b", question, re.IGNORECASE))


def _split_long_answer(answer: str) -> list[str]:
    if len(answer) <= LONG_ANSWER_LIMIT:
        return [answer]

    sentences = [sentence for sentence in re.split(r"(?<=[.!?])\s+", answer.strip()) if sentence]
    if len(sentences) < 3:
        return [answer]

    size = max(1, (len(sentences) + 2) // 3)
    return [" ".join(sentences[index : index + size]) for index in range(0, len(sentences), size)]


def _with_memory_answer_parts(question: str, answer: str, session, memory_status: dict) -> str:
    if _wants_full_detail(question) or len(memory_status.get("layers", {})) < 3:
        session.metadata.pop("answer_parts", None)
        return answer

    parts = _split_long_answer(answer)
    if len(parts) <= 1:
        session.metadata.pop("answer_parts", None)
        return answer

    session.metadata["answer_parts"] = {"parts": parts, "next_index": 1}
    return f"{parts[0]} Do you want to know more?"


def _next_answer_part(session) -> str | None:
    state = session.metadata.get("answer_parts") or {}
    parts = state.get("parts") or []
    index = int(state.get("next_index") or 0)
    if not parts or index >= len(parts):
        session.metadata.pop("answer_parts", None)
        return None

    state["next_index"] = index + 1
    if state["next_index"] >= len(parts):
        session.metadata.pop("answer_parts", None)
        return parts[index]

    session.metadata["answer_parts"] = state
    return f"{parts[index]} Do you want to know more?"


def _text_has_any(text: str, values: list[str]) -> bool:
    return any(value in text for value in values)


def _byoc_intake(question: str) -> str | None:
    text = question.lower()
    if "march" in text or "april" in text:
        return "March/April"
    if "october" in text or "november" in text:
        return "October/November"
    return None


def _byoc_interests(question: str) -> list[str]:
    text = question.lower()
    return [
        key
        for key, data in BYOC_INTERESTS.items()
        if _text_has_any(text, data["keywords"])
    ]


def _is_byoc_advice_turn(question: str, session) -> bool:
    text = question.lower()
    pending = session.metadata.get("task_state", {}).get("pending_flow") == "byoc"
    has_byoc_preferences = bool((session.preferences.get("byoc") or {}).get("interests"))
    pending_reply = pending and (
        bool(_byoc_interests(question))
        or bool(_byoc_intake(question))
        or _text_has_any(text, BYOC_PREFERENCE_REPLY_WORDS)
    )
    follows_byoc = has_byoc_preferences and _text_has_any(text, BYOC_FOLLOWUP_WORDS)
    mentions_byoc = "byoc" in text or "elective" in text
    asks_fact = mentions_byoc and _text_has_any(text, BYOC_FACT_WORDS)
    return pending_reply or follows_byoc or (mentions_byoc and not asks_fact)


def _byoc_followup_answer() -> str:
    return (
        "To recommend BYOC accurately, tell me what you care about most: "
        "leadership/business, mobile apps/software, networks/5G, data/AI, creative/media, or finance/marketing. "
        "If you know your intake, also say March/April or October/November."
    )


def _answer_byoc_advice(question: str, session) -> dict | None:
    if not _is_byoc_advice_turn(question, session):
        return None

    preferences = dict(session.preferences)
    byoc = dict(preferences.get("byoc") or {})
    interests = set(byoc.get("interests") or [])
    interests.update(_byoc_interests(question))

    intake = _byoc_intake(question) or byoc.get("intake")
    task_state = dict(session.metadata.get("task_state") or {})
    task_state["pending_flow"] = "byoc"

    if interests:
        byoc["interests"] = sorted(interests)
    if intake:
        byoc["intake"] = intake

    preferences["byoc"] = byoc
    session.preferences = preferences
    session.metadata["task_state"] = task_state

    if not interests:
        return {
            "answer": _byoc_followup_answer(),
            "route": "byoc_preference_followup",
            "used_rag": True,
            "sources": ["programme_structure.jsonl", "master_qa_pairs.clean.jsonl"],
            "confidence": 0.9,
        }

    picks = []
    for interest in interests:
        for option in BYOC_INTERESTS[interest]["subjects"]:
            if not intake or option[0] == intake:
                picks.append((interest, *option))

    if not picks:
        for interest in interests:
            picks.extend((interest, *option) for option in BYOC_INTERESTS[interest]["subjects"])

    seen = set()
    lines = []
    for interest, option_intake, subject, reason in picks:
        key = (option_intake, subject)
        if key in seen:
            continue
        seen.add(key)
        lines.append(f"{len(lines) + 1}. {subject} ({option_intake}) - {reason}.")
        if len(lines) == 4:
            break

    labels = ", ".join(BYOC_INTERESTS[i]["label"] for i in sorted(interests))
    intake_text = f" for {intake}" if intake else ""
    answer = (
        f"Based on your BYOC preference{intake_text}: {labels}. "
        f"My best picks are:\n" + "\n".join(lines) +
        "\nI saved this preference, so you can ask follow-up questions like 'which one is easier?' or 'which fits robotics projects best?'."
    )

    task_state.pop("pending_flow", None)
    session.metadata["task_state"] = task_state
    return {
        "answer": answer,
        "route": "byoc_memory_recommendation",
        "used_rag": True,
        "sources": ["programme_structure.jsonl", "master_qa_pairs.clean.jsonl"],
        "confidence": 0.98,
    }


def initialize_new_rag_system():
    """Initialize the new dual-layer RAG system."""
    global STRUCTURE_INDEX, STRUCTURE_METAS, DETAILS_INDEX, DETAILS_METAS, SESSION_MANAGER
    
    if STRUCTURE_INDEX is None:
        STRUCTURE_INDEX, STRUCTURE_METAS = build_or_load_structure_index()
    
    if DETAILS_INDEX is None:
        DETAILS_INDEX, DETAILS_METAS = build_or_load_details_index()
    
    if SESSION_MANAGER is None:
        from pathlib import Path
        from app.core.config import settings
        session_storage = Path(settings.DATA_DIR) / "sessions"
        SESSION_MANAGER = get_session_manager(storage_dir=session_storage)


@router.post("/chat")
async def chat(req: ChatReq):
    user_id = (req.user_id or "").strip()
    question = (req.message or "").strip()

    if not user_id or not question:
        return {"answer": "Please enter a message."}

    # Initialize new RAG system if needed
    initialize_new_rag_system()

    trace = Trace()
    save_message(user_id, "user", question)

    session = SESSION_MANAGER.get_session(user_id)
    if MORE_INTENT_RE.match(question):
        next_part = _next_answer_part(session)
        if next_part:
            SESSION_MANAGER.add_to_history(user_id, "user", question)
            SESSION_MANAGER.add_to_history(user_id, "assistant", next_part)
            save_message(user_id, "assistant", next_part)
            return {
                "answer": next_part,
                "route": "answer_part_continuation",
                "used_rag": True,
                "memory": SESSION_MANAGER.get_memory_status(user_id),
            }
    
    detection = detect_programme(
        question, 
        SESSION_MANAGER.get_context(user_id)
    )
    
    print(f"[CHAT] Programme detection result: programme={detection.programme}, confidence={detection.confidence}, threshold={PROGRAMME_DETECTION_CONFIDENCE_THRESHOLD}")
    print(f"[CHAT] Session programme before: {session.programme}")
    
    # NEW: Extract name from introduction if present
    import re
    name_patterns = [
        r"I'm ([A-Z][a-z]+)",
        r"I am ([A-Z][a-z]+)",
        r"my name is ([A-Z][a-z]+)",
        r"call me ([A-Z][a-z]+)",
        r"this is ([A-Z][a-z]+)"
    ]
    
    for pattern in name_patterns:
        match = re.search(pattern, question, re.IGNORECASE)
        if match:
            name = match.group(1).capitalize()
            if not session.user_name:
                SESSION_MANAGER.set_user_name(user_id, name)
                session = SESSION_MANAGER.get_session(user_id)
                print(f"[CHAT] Extracted and stored user name: {name}")
            break
    
    # NEW: If programme was just detected, return acknowledgment response
    programme_just_detected = False
    if detection.programme and detection.confidence > PROGRAMME_DETECTION_CONFIDENCE_THRESHOLD and not session.programme:
        print(f"[CHAT] Setting programme to: {detection.programme}")
        SESSION_MANAGER.set_programme(user_id, detection.programme)
        session = SESSION_MANAGER.get_session(user_id)
        print(f"[CHAT] Session programme after: {session.programme}")
        programme_just_detected = True
        
        # PRIORITY FIX: Don't immediately return greeting if user asked a detailed question
        # Check if this is an actual course question that needs RAG answer
        detailed_question_keywords = [
            "what is", "about", "prerequisite", "credit", "assessment",
            "topics", "cover", "lab", "how is", "does", "how many",
            "progression", "course structure", "study plan", "byoc",
            "elective", "project", "which one", "fits"
        ]
        is_detailed_question = any(kw in question.lower() for kw in detailed_question_keywords)
        
        # Only return greeting if this is NOT a detailed question
        if not is_detailed_question:
            # Format programme name for display
            programme_name = detection.programme.value.replace('_', ' ').title() if hasattr(detection.programme, 'value') else str(detection.programme)
            
            welcome_response = "Hi, I'm Hive."
            save_message(user_id, "assistant", welcome_response)
            SESSION_MANAGER.add_to_history(user_id, "assistant", welcome_response)
            return {"response": welcome_response, "type": "programme_acknowledgment"}
        # If it IS a detailed question, continue to RAG retrieval below
    
    # NEW: Handle recap/memory queries
    recap_intents = [
        "what's my name", "whats my name", "who am i",
        "what programme", "which programme", "my programme",
        "remind me what", "what did i", "what was my"
    ]
    
    query_lower = question.lower()
    is_programme_fact_question = "knowledge file" in query_lower or "programme is" in query_lower
    if not is_programme_fact_question and any(intent in query_lower for intent in recap_intents):
        # Build recap response based on available session data
        recap_parts = []
        
        if "name" in query_lower:
            if session.user_name:
                recap_parts.append(f"Your name is {session.user_name}.")
            else:
                recap_parts.append("I don't have your name stored yet. Feel free to introduce yourself!")
        
        if "programme" in query_lower or "studying" in query_lower:
            if session.programme:
                programme_name = session.programme.value.replace('_', ' ').title() if hasattr(session.programme, 'value') else str(session.programme)
                recap_parts.append(f"You're interested in {programme_name}.")
            else:
                recap_parts.append("You haven't mentioned a programme yet. What programme are you interested in?")
        
        # If we have both and query is general
        if not recap_parts and (session.user_name or session.programme):
            if session.user_name:
                recap_parts.append(f"Your name is {session.user_name}.")
            if session.programme:
                programme_name = session.programme.value.replace('_', ' ').title() if hasattr(session.programme, 'value') else str(session.programme)
                recap_parts.append(f"You're studying {programme_name}.")
        
        if recap_parts:
            recap_response = " ".join(recap_parts)
            save_message(user_id, "assistant", recap_response)
            SESSION_MANAGER.add_to_history(user_id, "assistant", recap_response)
            return {"response": recap_response, "type": "recap"}

    byoc_answer = _answer_byoc_advice(question, session)
    if byoc_answer:
        memory_status = SESSION_MANAGER.get_memory_status(user_id)
        byoc_answer["answer"] = _with_memory_answer_parts(question, byoc_answer["answer"], session, memory_status)
        SESSION_MANAGER.update_session(user_id, {
            "preferences": session.preferences,
            "metadata": session.metadata,
            "mode": "BYOC",
        })
        await SESSION_MANAGER.add_conversation_pair(user_id, question, byoc_answer["answer"])
        SESSION_MANAGER.add_to_history(user_id, "user", question)
        SESSION_MANAGER.add_to_history(user_id, "assistant", byoc_answer["answer"])
        save_message(user_id, "assistant", byoc_answer["answer"])
        return byoc_answer | {
            "memory": memory_status,
        }

    guarded_answer = answer_course_question(question)
    if guarded_answer:
        memory_status = SESSION_MANAGER.get_memory_status(user_id)
        guarded_answer["answer"] = _with_memory_answer_parts(question, guarded_answer["answer"], session, memory_status)
        SESSION_MANAGER.add_to_history(user_id, "user", question)
        SESSION_MANAGER.add_to_history(user_id, "assistant", guarded_answer["answer"])
        save_message(user_id, "assistant", guarded_answer["answer"])
        return guarded_answer | {
            "memory": memory_status,
        }
    
    route = route_query(question, session)
    
    course_codes = route.detected_course_codes.copy() if route.detected_course_codes else []
    
    if route.requires_course_code and not course_codes:
        resolved = resolve_aliases(question, session.programme)
        course_codes.extend([r['course_code'] for r in resolved])
    
    results = []
    context_parts = []
    
    if route.should_query_structure and STRUCTURE_INDEX and STRUCTURE_INDEX.ntotal > 0:
        structure_results = search_structure_layer(
            STRUCTURE_INDEX,
            STRUCTURE_METAS,
            question,
            programme=session.programme,
            top_k=STRUCTURE_LAYER_TOP_K
        )
        results.extend(structure_results)
        
        for r in structure_results:
            context_parts.append(f"[STRUCTURE] {r.get('text', '')}")
    
    if route.should_query_details and DETAILS_INDEX and DETAILS_INDEX.ntotal > 0:
        details_results = search_details_layer(
            DETAILS_INDEX,
            DETAILS_METAS,
            question,
            course_codes=course_codes if course_codes else None,
            top_k=DETAILS_LAYER_TOP_K
        )
        results.extend(details_results)
    
    if results:
        results = _safe_rerank(question, results, top_k=RERANKED_CONTEXT_TOP_K)
        context_parts = [_format_context_chunk(result) for result in results[:MAX_CONTEXT_CHUNKS]]
    else:
        context_parts = []
    
    if not context_parts and GLOBAL_INDEX and GLOBAL_METAS:
        reflection = await REFLECTION_AGENT.reflect(question, trace)
        retrieval = RETRIEVER_AGENT.retrieve(
            GLOBAL_INDEX,
            GLOBAL_METAS,
            reflection["retrieval_query"],
            trace,
        )
        context = retrieval["context"]
    else:
        context = "\n\n".join(context_parts[:MAX_CONTEXT_CHUNKS])
    
    try:
        response = await CHATBOT_AGENT.answer(
            question,
            trace,
            context=context,
            use_context=True if context else False,
        )
    except Exception as e:
        print(f"[ERROR] CHATBOT_AGENT.answer failed: {e}")
        import traceback
        traceback.print_exc()
        return {
            "answer": f"Sorry, I encountered an error while processing your question. Please try again.",
            "error": str(e),
            "trace": trace.to_dict()
        }
    
    try:
        evaluation = await REFLECTION_AGENT.evaluate(
            question,
            response["answer"],
            context,
            trace,
        )
        
        if evaluation["should_rerun"]:
            response = await CHATBOT_AGENT.answer(
                question,
                trace,
                context=context,
                use_context=True,
            )
    except Exception as e:
        print(f"[ERROR] REFLECTION_AGENT.evaluate failed: {e}")
        # Continue without reflection if it fails

    memory_status = SESSION_MANAGER.get_memory_status(user_id)
    response["answer"] = _with_memory_answer_parts(question, response["answer"], session, memory_status)

    try:
        await SESSION_MANAGER.add_conversation_pair(user_id, question, response["answer"])
    except Exception as e:
        print(f"[ERROR] SESSION_MANAGER.add_conversation_pair failed: {e}")
        # Continue even if session storage fails
    
    SESSION_MANAGER.add_to_history(user_id, "user", question)
    SESSION_MANAGER.add_to_history(user_id, "assistant", response["answer"])
    
    if route.query_type == "STRUCTURE_ONLY":
        SESSION_MANAGER.update_session(user_id, {"mode": "STRUCTURE"})
    elif route.query_type == "DETAILS_ONLY":
        SESSION_MANAGER.update_session(user_id, {"mode": "DETAILS"})
    
    save_message(user_id, "assistant", response["answer"])
    
    from app.services.unanswered_detector import is_unanswered, get_uncertainty_reason
    from app.repositories.unanswered_repo import save_unanswered_question
    
    is_low_confidence, confidence_score = is_unanswered(
        answer=response["answer"],
        context=context,
        rag_results_count=len(results)
    )
    
    if is_low_confidence:
        try:
            uncertainty_reason = get_uncertainty_reason(response["answer"], len(results))
            save_unanswered_question(
                question=question,
                attempted_answer=response["answer"],
                confidence_score=confidence_score,
                rag_results_count=len(results),
                uncertainty_reason=uncertainty_reason,
                user_id=user_id
            )
        except Exception as e:
            print(f"Failed to save unanswered question: {e}")
    
    return {
        "answer": response["answer"],
        "sources": _extract_sources(results),
        "used_rag": bool(context),
        "trace": trace.to_dict(),
        "metadata": {
            "programme": session.programme,
            "query_type": route.query_type,
            "target_layer": route.target_layer,
            "course_codes": course_codes,
            "results_count": len(results)
        },
        "memory": memory_status
    }


@router.post("/ask")
async def ask(req: AskReq):
    question = (req.question or "").strip()
    return await chat(ChatReq(user_id=req.user_id, message=question))


@router.post("/session/reset")
async def reset_session(user_id: str):
    """Reset user session and clear conversation memory."""
    initialize_new_rag_system()
    SESSION_MANAGER.clear_session(user_id)
    return {"status": "reset", "user_id": user_id}


@router.get("/session/status")
async def get_session_status(user_id: str):
    """Get session status."""
    initialize_new_rag_system()
    session = SESSION_MANAGER.get_session(user_id)
    return {
        "user_id": user_id,
        "programme": session.programme,
        "current_term": session.current_term,
        "mode": session.mode,
        "history_count": len(session.history)
    }


@router.get("/session/memory")
async def get_memory_status(user_id: str):
    """Get conversation memory status for UI display."""
    initialize_new_rag_system()
    memory_status = SESSION_MANAGER.get_memory_status(user_id)
    return memory_status


@router.get("/session/summary")
async def get_conversation_summary(user_id: str):
    """Get conversation summary if available."""
    initialize_new_rag_system()
    session = SESSION_MANAGER.get_session(user_id)
    window = session.conversation_window
    
    return {
        "summary": window.summary,
        "pairs_count": len(window.pairs),
        "summarized_count": window.summarized_pair_count,
        "total_pairs": window.summarized_pair_count + len(window.pairs)
    }
