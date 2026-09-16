import re
from typing import List
from app.models.schemas import QAResponse, QACitation
from app.rag.retrieve import corpus_manager, cosine_similarity
from app.rag.embed import embedder
from app.ingestion.chunker import chunk_document

VERDICT_PROMPTS = [
    "will i win", "can i sue", "will the judge", "is this illegal", "is it legal",
    "guaranteed", "can i stop paying", "punish the landlord", "court case"
]

def answer_legal_question(
    question: str,
    document_text: str,
    document_title: str
) -> QAResponse:
    """
    Produces strictly grounded answers with citations.
    Falls back to honest 'insufficient information' or hedged lawyer escalation when needed.
    Never generates speculative statutory citations.
    """
    q_lower = question.lower()

    # 1. Check if user is asking for a definitive legal prediction or courtroom verdict
    if any(vp in q_lower for vp in VERDICT_PROMPTS):
        # Hedged informational response + lawyer CTA
        ref_results = corpus_manager.search_corpus(question, top_k=2)
        citations: List[QACitation] = []
        for ref in ref_results:
            citations.append(QACitation(
                source_type="reference_corpus",
                source_name=ref["title"],
                page_or_line=ref["source"],
                quote=ref["text"]
            ))

        answer_text = (
            "NyayaTrack cannot provide legal advice or predict court outcomes. "
            "Whether a dispute succeeds in an Indian court or rent tribunal depends heavily on formal notices exchanged, "
            "written agreements, and jurisdictional facts. "
            "Under standard reference principles (such as Indian Contract Act and Model Tenancy guidelines), "
            "unilateral modifications and disproportionate penalties are frequently contested as unfair, "
            "but you should consult a practicing advocate to evaluate your specific remedy."
        )
        return QAResponse(
            question=question,
            answer=answer_text,
            citations=citations,
            grounding_ok=True,
            suggest_lawyer=True
        )

    # 2. Search inside the current document
    doc_chunks = chunk_document(document_text, max_chunk_size=300)
    q_vec = embedder.embed_text(question)
    
    scored_doc_chunks = []
    for chunk in doc_chunks:
        c_vec = embedder.embed_text(chunk["text"])
        score = cosine_similarity(q_vec, c_vec)
        # Check token overlap
        overlap = len(set(q_lower.split()).intersection(set(chunk["text"].lower().split())))
        score += min(0.35, overlap * 0.06)
        if score > 0.18:
            scored_doc_chunks.append((score, chunk))

    scored_doc_chunks.sort(key=lambda x: x[0], reverse=True)

    # 3. Search reference corpus
    ref_results = corpus_manager.search_corpus(question, top_k=2, min_similarity=0.15)

    citations: List[QACitation] = []

    # If neither document nor reference corpus has sufficient information
    if not scored_doc_chunks and not ref_results:
        return QAResponse(
            question=question,
            answer=(
                "I do not have enough specific information in this document or in my verified Indian reference corpus "
                "to answer that question responsibly. To avoid unreliable assumptions, this is a topic you should clarify "
                "directly with the counter-party or consult an advocate about."
            ),
            citations=[],
            grounding_ok=False,
            suggest_lawyer=True
        )

    # Compile Citations & Response
    doc_context_points = []
    if scored_doc_chunks:
        best_doc = scored_doc_chunks[0][1]
        citations.append(QACitation(
            source_type="document",
            source_name=document_title,
            page_or_line=f"Lines {best_doc['start_line']}-{best_doc['end_line']}",
            quote=best_doc["text"]
        ))
        doc_context_points.append(f"In your document, it states: \"{best_doc['text']}\"")

    ref_context_points = []
    for ref in ref_results:
        citations.append(QACitation(
            source_type="reference_corpus",
            source_name=ref["title"],
            page_or_line=ref["source"],
            quote=ref["text"]
        ))
        ref_context_points.append(f"According to standard reference ({ref['title']}): \"{ref['text']}\"")

    combined_explanation = ""
    if doc_context_points:
        combined_explanation += " ".join(doc_context_points) + "\n\n"
    if ref_context_points:
        combined_explanation += " ".join(ref_context_points) + "\n\n"
    
    combined_explanation += (
        "Note: This is general legal information intended to help you understand your position. "
        "It does not constitute formal legal counsel."
    )

    return QAResponse(
        question=question,
        answer=combined_explanation.strip(),
        citations=citations,
        grounding_ok=True,
        suggest_lawyer=len(citations) > 0 and any("unilateral" in c.quote.lower() or "notice" in c.quote.lower() for c in citations)
    )
