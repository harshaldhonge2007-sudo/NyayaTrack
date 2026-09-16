import re
from typing import List, Dict, Any

def split_into_sentences(text: str) -> List[str]:
    # Split by periods, exclamation, or question marks followed by whitespace or linebreaks
    raw_sentences = re.split(r'(?<=[.!?])\s+|\n\n+', text)
    cleaned = [s.strip() for s in raw_sentences if s.strip()]
    return cleaned

def chunk_document(text: str, max_chunk_size: int = 500) -> List[Dict[str, Any]]:
    """
    Chunks document into numbered chunks with line and sentence tracking.
    """
    lines = text.split("\n")
    chunks = []
    current_chunk = []
    current_length = 0
    start_line = 1

    for idx, line in enumerate(lines, start=1):
        line_str = line.strip()
        if not line_str:
            continue
        
        current_chunk.append(line_str)
        current_length += len(line_str)

        if current_length >= max_chunk_size:
            chunks.append({
                "chunk_index": len(chunks) + 1,
                "start_line": start_line,
                "end_line": idx,
                "text": " ".join(current_chunk)
            })
            current_chunk = []
            current_length = 0
            start_line = idx + 1

    if current_chunk:
        chunks.append({
            "chunk_index": len(chunks) + 1,
            "start_line": start_line,
            "end_line": len(lines),
            "text": " ".join(current_chunk)
        })

    return chunks
