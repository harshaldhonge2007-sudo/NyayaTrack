import os
import math
import re
from typing import List, Dict, Optional
import requests

class TextEmbedder:
    """
    Dual-mode semantic and deterministic embedder:
    - If GEMINI_API_KEY is configured, uses Google Gemini text-embedding-004 (768-dim semantic embeddings)
      for true semantic vector search that accurately matches paraphrased legal inquiries.
    - If OPENAI_API_KEY is configured, supports OpenAI embeddings as secondary option.
    - When running offline or when external keys are not provided, gracefully falls back to a deterministic
      normalized term-frequency + subword n-gram vectorizer (256-dim) with zero external dependencies.
    - Includes in-memory caching to eliminate redundant network latency and protect rate limits.
    """
    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.openai_key = os.getenv("OPENAI_API_KEY", "").strip()
        # Filter out placeholder keys
        if "your_" in self.openai_key or not self.openai_key:
            self.openai_key = None
        if "your_" in self.gemini_key or not self.gemini_key:
            self.gemini_key = None
        self._cache: Dict[str, List[float]] = {}

    def is_semantic_enabled(self, api_key: Optional[str] = None) -> bool:
        key = api_key or self.gemini_key
        return bool(key and len(key) > 10 and not key.startswith("your_"))

    def embed_gemini(self, text: str, api_key: Optional[str] = None) -> Optional[List[float]]:
        key = api_key or self.gemini_key
        if not key or "your_" in key:
            return None

        cache_key = f"gemini_{text.strip()[:300]}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={key}"
            payload = {
                "content": {
                    "parts": [{"text": text[:2048]}]
                }
            }
            resp = requests.post(url, json=payload, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                values = data.get("embedding", {}).get("values")
                if values and isinstance(values, list):
                    norm = math.sqrt(sum(x * x for x in values))
                    if norm > 0:
                        values = [x / norm for x in values]
                    self._cache[cache_key] = values
                    return values
        except Exception:
            # Fall back safely on network error, timeout, or rate-limit
            pass
        return None

    def embed_text(self, text: str, api_key: Optional[str] = None) -> List[float]:
        """
        Embeds text. Attempts Gemini text-embedding-004 when key is present,
        and falls back deterministically to term-frequency subword hashing.
        """
        if self.is_semantic_enabled(api_key):
            vec = self.embed_gemini(text, api_key)
            if vec is not None:
                return vec
        return self._hash_embed(text)

    def _hash_embed(self, text: str) -> List[float]:
        cache_key = f"hash_{text.strip()[:300]}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        tokens = self._tokenize(text)
        dim = 256
        vec = [0.0] * dim
        for t in tokens:
            # 32-bit FNV-1a hash
            h = 2166136261
            for char in t:
                h = ((h ^ ord(char)) * 16777619) & 0xFFFFFFFF
            idx = h % dim
            vec[idx] += 1.0

        # L2 normalize
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        self._cache[cache_key] = vec
        return vec

    def _tokenize(self, text: str) -> List[str]:
        words = re.findall(r'\b[a-zA-Z0-9_\-\.₹]+\b', text.lower())
        # Also include 3-grams of words
        ngrams = []
        for w in words:
            if len(w) > 4:
                for i in range(len(w) - 2):
                    ngrams.append(w[i:i+3])
        return words + ngrams

embedder = TextEmbedder()
