import os
import math
from pathlib import Path
from typing import List, Dict, Any, Tuple
from app.rag.embed import embedder

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if len(v1) != len(v2) or not v1:
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
                vec = embedder.embed_text(f"{title} {p}")
                self.reference_chunks.append({
                    "id": f"{file_path.stem}_{idx}",
                    "title": title,
                    "source": source,
                    "url": url,
                    "file_name": file_path.name,
                    "text": p,
                    "embedding": vec
                })

    def search_corpus(self, query: str, top_k: int = 3, min_similarity: float = 0.12) -> List[Dict[str, Any]]:
        query_vec = embedder.embed_text(query)
        scored: List[Tuple[float, Dict[str, Any]]] = []

        for chunk in self.reference_chunks:
            score = cosine_similarity(query_vec, chunk["embedding"])
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
                "file_name": item["file_name"]
            }
            for score, item in scored[:top_k]
        ]

corpus_manager = ReferenceCorpusManager()
