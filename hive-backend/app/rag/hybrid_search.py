import re
import math
from collections import Counter
from typing import List, Dict, Tuple
import numpy as np

try:
    from rank_bm25 import BM25Okapi
except ImportError:
    class BM25Okapi:
        def __init__(self, corpus: list[list[str]], k1: float = 1.5, b: float = 0.75):
            self.corpus = corpus
            self.k1 = k1
            self.b = b
            self.doc_freqs = [Counter(doc) for doc in corpus]
            self.doc_lengths = [len(doc) for doc in corpus]
            self.avgdl = sum(self.doc_lengths) / len(self.doc_lengths) if self.doc_lengths else 0.0
            term_doc_counts: Counter[str] = Counter()
            for doc in corpus:
                term_doc_counts.update(set(doc))
            total_docs = len(corpus)
            self.idf = {
                term: math.log(1 + (total_docs - freq + 0.5) / (freq + 0.5))
                for term, freq in term_doc_counts.items()
            }

        def get_scores(self, query: list[str]) -> np.ndarray:
            scores: list[float] = []
            for freqs, doc_len in zip(self.doc_freqs, self.doc_lengths):
                score = 0.0
                for term in query:
                    freq = freqs.get(term, 0)
                    if not freq:
                        continue
                    denom = freq + self.k1 * (1 - self.b + self.b * doc_len / (self.avgdl or 1.0))
                    score += self.idf.get(term, 0.0) * freq * (self.k1 + 1) / denom
                scores.append(score)
            return np.array(scores, dtype=float)

TOKEN_RE = re.compile(r"[a-zA-Z0-9]+")


def tokenize(text: str) -> list[str]:
    return TOKEN_RE.findall((text or "").lower())


class HybridSearcher:
    """
    Implements hybrid search combining dense (vector) and sparse (BM25) retrieval.
    Uses Reciprocal Rank Fusion (RRF) to combine scores.
    """
    
    def __init__(self, alpha: float = 0.5):
        """
        Initialize hybrid searcher.
        
        Args:
            alpha: Weight for vector search (1-alpha for BM25). 
                   0.5 = equal weight, 1.0 = vector only, 0.0 = BM25 only
        """
        self.alpha = alpha
        self.bm25_index: BM25Okapi | None = None
        self.doc_ids: List[int] = []
        self.tokenized_docs: List[List[str]] = []
    
    def build_bm25_index(self, documents: List[str], doc_ids: List[int] | None = None):
        """
        Build BM25 index from documents.
        
        Args:
            documents: List of text documents
            doc_ids: Optional caller-owned document IDs. Defaults to list positions.
        """
        self.doc_ids = doc_ids if doc_ids is not None else list(range(len(documents)))
        self.tokenized_docs = [tokenize(doc) for doc in documents]
        self.bm25_index = BM25Okapi(self.tokenized_docs)
    
    def bm25_search(self, query: str, top_k: int = 10) -> List[Tuple[int, float]]:
        """
        Perform BM25 search.
        
        Args:
            query: Search query
            top_k: Number of results
        
        Returns:
            List of (index, score) tuples
        """
        if self.bm25_index is None:
            return []
        
        tokenized_query = tokenize(query)
        scores = self.bm25_index.get_scores(tokenized_query)
        
        # Get top-k indices
        top_indices = np.argsort(scores)[::-1][:top_k]
        return [(int(self.doc_ids[idx]), float(scores[idx])) for idx in top_indices]
    
    @staticmethod
    def reciprocal_rank_fusion(
        vector_results: List[Tuple[int, float]],
        bm25_results: List[Tuple[int, float]],
        k: int = 60
    ) -> List[Tuple[int, float]]:
        """
        Combine rankings using Reciprocal Rank Fusion.
        
        Args:
            vector_results: List of (index, score) from vector search
            bm25_results: List of (index, score) from BM25
            k: RRF constant (typically 60)
        
        Returns:
            Fused list of (index, score) tuples
        """
        rrf_scores: Dict[int, float] = {}
        
        # Add vector search scores
        for rank, (idx, _) in enumerate(vector_results, start=1):
            rrf_scores[idx] = rrf_scores.get(idx, 0.0) + 1.0 / (k + rank)
        
        # Add BM25 scores
        for rank, (idx, _) in enumerate(bm25_results, start=1):
            rrf_scores[idx] = rrf_scores.get(idx, 0.0) + 1.0 / (k + rank)
        
        # Sort by fused score
        sorted_results = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_results
    
    def hybrid_search(
        self,
        query: str,
        vector_results: List[Dict],
        top_k: int = 10
    ) -> List[Dict]:
        """
        Perform hybrid search combining vector and BM25.
        
        Args:
            query: Search query
            vector_results: Results from vector search with 'text' field
            top_k: Number of results to return
        
        Returns:
            Hybrid ranked results
        """
        if self.bm25_index is None or not vector_results:
            return vector_results[:top_k]
        
        # Get BM25 results
        bm25_results = self.bm25_search(query, top_k=len(vector_results))
        
        # Create index to result mapping. Existing callers may pass local result
        # positions; newer callers can pass source meta indices in "_meta_index".
        vector_tuples = [
            (int(r.get("_meta_index", i)), r.get("score", 0.0))
            for i, r in enumerate(vector_results)
        ]
        result_by_id = {
            int(r.get("_meta_index", i)): r
            for i, r in enumerate(vector_results)
        }
        
        # Fuse rankings
        fused = self.reciprocal_rank_fusion(vector_tuples, bm25_results)
        
        # Build final result list
        hybrid_results = []
        for idx, rrf_score in fused[:top_k]:
            if idx in result_by_id:
                result = dict(result_by_id[idx])
                result["hybrid_score"] = float(rrf_score)
                result["original_vector_score"] = result.get("score", 0.0)
                result["score"] = float(rrf_score)  # Use hybrid score as primary
                hybrid_results.append(result)
        
        return hybrid_results


# Global hybrid searcher instance
_hybrid_searcher: HybridSearcher | None = None


def get_hybrid_searcher() -> HybridSearcher:
    """Get or create global hybrid searcher."""
    global _hybrid_searcher
    if _hybrid_searcher is None:
        _hybrid_searcher = HybridSearcher()
    return _hybrid_searcher
