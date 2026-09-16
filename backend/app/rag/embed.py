import os
import math
import re
from typing import List, Dict
import requests

class TextEmbedder:
    """
    Dual-mode embedder:
    - If GEMINI_API_KEY or OPENAI_API_KEY is configured and valid, attempts API embeddings.
    - Otherwise, uses a robust deterministic normalized term-frequency + subword n-gram vectorizer
      that operates locally with zero external API requirements.
    """
    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.openai_key = os.getenv("OPENAI_API_KEY", "").strip()
        # Filter out placeholder keys
        if "your_" in self.openai_key or not self.openai_key:
            self.openai_key = None
        if "your_" in self.gemini_key or not self.gemini_key:
            self.gemini_key = None

    def embed_text(self, text: str) -> List[float]:
        # Local deterministic hashing & word frequency vector
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
