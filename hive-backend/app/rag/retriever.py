from typing import List, Dict, Tuple, Optional, Callable
import re
import faiss
from app.rag.embeddings import embed_query
from app.core.config import settings
from app.rag.reranker import rerank_results
from app.rag.hybrid_search import HybridSearcher

COURSE_CODE_RE = re.compile(r"\b[A-Z]{3}\d{4}\b")

COURSE_CODE_BOOST_SCORE = 0.3
MIN_MEANINGFUL_CHUNK_SIZE = 100
FILTER_SEARCH_MULTIPLIER = 3
STRUCTURE_SEARCH_MULTIPLIER = 2

_HYBRID_CACHE: dict[tuple[str, int, int], HybridSearcher] = {}


def _meta_search_text(meta: Dict) -> str:
    parts = [
        meta.get("course_code"),
        meta.get("course_name"),
        meta.get("question"),
        meta.get("answer"),
        meta.get("content"),
        meta.get("text"),
        meta.get("type"),
        meta.get("programme"),
        meta.get("source"),
        meta.get("source_file"),
    ]
    course_codes = meta.get("course_codes")
    if isinstance(course_codes, list):
        parts.extend(course_codes)
    tags = meta.get("tags")
    if isinstance(tags, list):
        parts.extend(tags)
    return " ".join(str(part) for part in parts if part)


def _source_label(meta: Dict) -> str:
    parts = [
        meta.get("source"),
        meta.get("kb_source_file"),
        meta.get("master_source_file"),
        meta.get("source_file"),
    ]
    seen: set[str] = set()
    labels: list[str] = []
    for part in parts:
        if not part:
            continue
        label = str(part)
        if label in seen:
            continue
        seen.add(label)
        labels.append(label)
    return " ".join(labels)


def _get_hybrid_searcher(scope: str, metas: List[Dict]) -> HybridSearcher:
    cache_key = (scope, id(metas), len(metas))
    cached = _HYBRID_CACHE.get(cache_key)
    if cached:
        return cached

    searcher = HybridSearcher()
    searcher.build_bm25_index(
        [_meta_search_text(meta) for meta in metas],
        doc_ids=list(range(len(metas))),
    )
    _HYBRID_CACHE[cache_key] = searcher
    return searcher


def _programme_value(programme: Optional[str]) -> Optional[str]:
    if programme is None:
        return None
    return getattr(programme, "value", programme)


def _dense_candidates(index: faiss.Index, query: str, candidate_k: int) -> List[Tuple[int, float]]:
    q = embed_query(query).reshape(1, -1)
    scores, ids = index.search(q, min(candidate_k, index.ntotal))
    return [
        (int(idx), float(score))
        for score, idx in zip(scores[0].tolist(), ids[0].tolist())
        if idx != -1
    ]


def _hybrid_candidates(
    index: faiss.Index,
    metas: List[Dict],
    query: str,
    top_k: int,
    fallback_multiplier: int,
    scope: str,
    include_meta: Callable[[Dict], bool],
) -> List[Tuple[int, float]]:
    dense_k = max(settings.HYBRID_DENSE_TOP_K, top_k * fallback_multiplier)
    dense_results = [
        (idx, score)
        for idx, score in _dense_candidates(index, query, dense_k)
        if include_meta(metas[idx])
    ]

    if not settings.HYBRID_SEARCH_ENABLED:
        return dense_results[:top_k]

    searcher = _get_hybrid_searcher(scope, metas)
    bm25_results: list[tuple[int, float]] = []
    for idx, score in searcher.bm25_search(query, top_k=min(settings.HYBRID_BM25_TOP_K * 3, len(metas))):
        if include_meta(metas[idx]):
            bm25_results.append((idx, score))
        if len(bm25_results) >= settings.HYBRID_BM25_TOP_K:
            break

    fused = HybridSearcher.reciprocal_rank_fusion(
        dense_results,
        bm25_results,
        k=settings.HYBRID_RRF_K,
    )
    return fused[:top_k]


def search(index: faiss.Index, metas: List[Dict], query: str, top_k: int | None = None, metadata_filter: Dict[str, str] | None = None, use_reranking: bool = False) -> List[Dict]:
    if top_k is None:
        top_k = settings.TOP_K

    if index is None or metas is None or index.ntotal == 0:
        return []

    if metadata_filter:
        filtered_indices = []
        filtered_metas = []
        for idx, meta in enumerate(metas):
            if all(meta.get(key) == value for key, value in metadata_filter.items()):
                filtered_indices.append(idx)
                filtered_metas.append(meta)
        
        if not filtered_indices:
            return []
    
    q = embed_query(query).reshape(1, -1)
    
    search_k = top_k * FILTER_SEARCH_MULTIPLIER if metadata_filter else top_k
    scores, ids = index.search(q, min(search_k, index.ntotal))

    results: list[dict] = []
    for score, idx in zip(scores[0].tolist(), ids[0].tolist()):
        if idx == -1:
            continue
        meta = metas[idx]
        
        if metadata_filter:
            if not all(meta.get(key) == value for key, value in metadata_filter.items()):
                continue
        
        results.append(
            {
                "score": float(score),
                "source_file": meta.get("source_file"),
                "page": meta.get("page"),
                "type": meta.get("type"),
                "programme": meta.get("programme"),
                "text": meta.get("text", ""),
            }
        )

    codes = COURSE_CODE_RE.findall(query.upper())
    if codes:
        for r in results:
            txt = (r.get("text") or "").upper()
            if any(code in txt for code in codes):
                r["score"] += COURSE_CODE_BOOST_SCORE

    results.sort(key=lambda x: x["score"], reverse=True)

    if use_reranking and settings.RERANKING_ENABLED and results:
        results = rerank_results(query, results, top_k)
        return results

    return results[:top_k]


def build_context(results: List[Dict], return_sources: bool = False) -> Tuple[str, List[Dict]]:
    """
    Build context from search results with intelligent truncation.
    
    Args:
        results: List of search results with scores and text
        return_sources: Whether to return source attribution
    
    Returns:
        Tuple of (context_string, sources_list)
    """
    good = [r for r in results if r.get("score", 0.0) >= settings.MIN_SCORE]
    if not good:
        return "", []

    ctx_parts: list[str] = []
    sources: list[dict] = []
    total = 0

    good.sort(key=lambda x: x.get("score", 0.0), reverse=True)

    for idx, r in enumerate(good):
        snippet = (r.get("text") or "").strip()
        if not snippet:
            continue

        if total + len(snippet) > settings.MAX_CONTEXT_CHARS:
            if idx == 0:
                remaining = settings.MAX_CONTEXT_CHARS - total
                if remaining > MIN_MEANINGFUL_CHUNK_SIZE:
                    snippet = snippet[:remaining] + "..."
                    ctx_parts.append(snippet)
                    total += len(snippet)
            break

        total += len(snippet)
        ctx_parts.append(snippet)
        
        if return_sources:
            sources.append({
                "source_file": r.get("source_file"),
                "page": r.get("page"),
                "type": r.get("type"),
                "score": r.get("score"),
            })

    context = "\n\n".join(ctx_parts)
    return context, sources if return_sources else []


def search_structure_layer(
    index: faiss.Index, 
    metas: List[Dict], 
    query: str, 
    top_k: int | None = None,
    programme: Optional[str] = None
) -> List[Dict]:
    """
    Search programme structure layer.
    
    Args:
        index: FAISS index for structure layer
        metas: Metadata for structure layer
        query: Search query
        top_k: Number of results
        programme: Optional programme filter
    
    Returns:
        List of search results
    """
    if top_k is None:
        top_k = settings.TOP_K
    
    if index is None or metas is None or index.ntotal == 0:
        return []
    
    programme_filter = _programme_value(programme)

    def include_meta(meta: Dict) -> bool:
        if not programme_filter:
            return True
        meta_programme = meta.get('programme', '')
        return meta_programme == 'ALL' or meta_programme == programme_filter

    candidates = _hybrid_candidates(
        index,
        metas,
        query,
        top_k=top_k,
        fallback_multiplier=STRUCTURE_SEARCH_MULTIPLIER,
        scope="structure",
        include_meta=include_meta,
    )
    
    results: list[dict] = []
    for idx, score in candidates:
        meta = metas[idx]
        
        results.append({
            "score": float(score),
            "id": meta.get("id"),
            "type": meta.get("type"),
            "programme": meta.get("programme"),
            "layer": "structure",
            "text": meta.get("text", ""),
            "metadata": {k: v for k, v in meta.items() if k not in ['text', 'layer']}
        })
    
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]


def search_details_layer(
    index: faiss.Index, 
    metas: List[Dict], 
    query: str, 
    course_codes: Optional[List[str]] = None,
    top_k: int | None = None
) -> List[Dict]:
    """
    Search subject details layer with course code filtering.
    
    Args:
        index: FAISS index for details layer
        metas: Metadata for details layer
        query: Search query
        course_codes: Optional list of course codes to filter by
        top_k: Number of results
    
    Returns:
        List of search results
    """
    if top_k is None:
        top_k = settings.TOP_K
    
    if index is None or metas is None or index.ntotal == 0:
        return []
    
    course_code_set = set(course_codes or [])

    def include_meta(meta: Dict) -> bool:
        if not course_code_set:
            return True
        return meta.get('course_code', '') in course_code_set

    candidates = _hybrid_candidates(
        index,
        metas,
        query,
        top_k=max(top_k * FILTER_SEARCH_MULTIPLIER, top_k),
        fallback_multiplier=FILTER_SEARCH_MULTIPLIER,
        scope="details",
        include_meta=include_meta,
    )
    
    results: list[dict] = []
    for idx, score in candidates:
        meta = metas[idx]
        
        results.append({
            "score": float(score),
            "id": meta.get("id"),
            "course_code": meta.get("course_code"),
            "course_name": meta.get("course_name"),
            "question": meta.get("question"),
            "answer": meta.get("answer"),
            "layer": "details",
            "text": meta.get("text", ""),
            "source": _source_label(meta),
            "tags": meta.get("tags", [])
        })
    
    # SEMANTIC RE-RANKING: Boost answers matching query intent
    query_lower = query.lower()
    
    for result in results:
        boost = 0.0
        tags = result.get("tags", [])
        question_text = result.get("question", "").lower()
        
        # Boost for "about/overview" questions
        if any(keyword in query_lower for keyword in ["what is", "about", "overview", "describe"]):
            if "overview" in tags or "topics" in tags:
                boost += 0.5  # Strong boost for matching tags
            elif "prerequisite" in tags or "credit" in tags or "assessment" in tags:
                boost -= 0.3  # Strong penalty for non-overview answers
        
        # Boost for prerequisite questions
        elif any(keyword in query_lower for keyword in ["prerequisite", "pre-req", "prereq", "require"]):
            if "prerequisite" in tags:
                boost += 0.5
            elif "overview" in tags:
                boost -= 0.2
        
        # Boost for assessment questions
        elif any(keyword in query_lower for keyword in ["assess", "exam", "test", "graded"]):
            if "assessment" in tags:
                boost += 0.5
        
        # Boost for credit hours questions
        elif any(keyword in query_lower for keyword in ["credit", "hours", "how many"]):
            if "credit_hours" in tags:
                boost += 0.5
        
        # Boost for topic questions
        elif any(keyword in query_lower for keyword in ["topics", "cover", "learn", "content"]):
            if "topics" in tags or "overview" in tags:
                boost += 0.5
        
        # Apply boost to score (higher score = better match)
        result["score"] = result["score"] + boost
        result["boost"] = boost  # For debugging
    
    # Re-sort by adjusted score
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]
