import os
import math
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
from app.rag.embed import embedder

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)

class ReferenceCorpusManager:
    def __init__(self):
        self.corpus_dir = Path(__file__).parent / "corpus"
        self.reference_chunks: List[Dict[str, Any]] = []
        self._load_corpus()

    def _load_corpus(self):
        self.reference_chunks = []
        if not self.corpus_dir.exists():
            return

        for file_path in self.corpus_dir.glob("*.txt"):
            content = file_path.read_text(encoding="utf-8")
            lines = content.split("\n")
            title = "Reference Document"
            source = "General Legal Guidelines"
            url = ""
            body_lines = []

            for line in lines:
                if line.startswith("Title:"):
                    title = line.replace("Title:", "").strip()
                elif line.startswith("Source:"):
                    source = line.replace("Source:", "").strip()
                elif line.startswith("Source URL:"):
                    url = line.replace("Source URL:", "").strip()
                elif line.strip() and not line.startswith("Classification:"):
                    body_lines.append(line.strip())

            # Split into meaningful paragraph chunks
            paragraphs = []
            curr = []
            for bl in body_lines:
                if bl.startswith("Summary & Standard Rules:") or bl.startswith("---"):
                    continue
                curr.append(bl)
                if len(curr) >= 2 or bl.endswith("."):
                    paragraphs.append(" ".join(curr))
                    curr = []
            if curr:
                paragraphs.append(" ".join(curr))

            for idx, p in enumerate(paragraphs):
                if len(p) < 20:
                    continue
                combined_text = f"{title} {p}"
                hash_vec = embedder._hash_embed(combined_text)
                self.reference_chunks.append({
                    "id": f"{file_path.stem}_{idx}",
                    "title": title,
                    "source": source,
                    "url": url,
                    "file_name": file_path.name,
                    "text": p,
                    "combined_text": combined_text,
                    "embedding": hash_vec,
                    "gemini_embedding": None
                })

    def search_corpus(
        self,
        query: str,
        top_k: int = 3,
        min_similarity: float = 0.12,
        api_key: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        use_gemini = embedder.is_semantic_enabled(api_key)
        query_vec: Optional[List[float]] = None

        if use_gemini:
            query_vec = embedder.embed_gemini(query, api_key)
            if query_vec:
                # Pre-embed or lazily embed chunks with Gemini
                for chunk in self.reference_chunks:
                    if chunk.get("gemini_embedding") is None:
                        chunk["gemini_embedding"] = embedder.embed_gemini(chunk["combined_text"], api_key)
            else:
                use_gemini = False

        if not use_gemini or not query_vec:
            query_vec = embedder._hash_embed(query)
            use_gemini = False

        scored: List[Tuple[float, Dict[str, Any]]] = []

        for chunk in self.reference_chunks:
            chunk_vec = chunk["gemini_embedding"] if (use_gemini and chunk.get("gemini_embedding")) else chunk["embedding"]
            score = cosine_similarity(query_vec, chunk_vec)

            # Keyword bonus for direct token overlap
            query_words = set(query.lower().split())
            chunk_words = set(chunk["text"].lower().split())
            overlap = len(query_words.intersection(chunk_words))
            score += min(0.3, overlap * 0.05)

            if score >= min_similarity:
                scored.append((score, chunk))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [
            {
                "score": round(score, 3),
                "title": item["title"],
                "source": item["source"],
                "url": item["url"],
                "text": item["text"],
                "file_name": item["file_name"],
                "semantic_retrieval": use_gemini
            }
            for score, item in scored[:top_k]
        ]

corpus_manager = ReferenceCorpusManager()
