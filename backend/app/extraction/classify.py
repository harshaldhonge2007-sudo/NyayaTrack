import os
import re
import json
from typing import Tuple
from app.models.schemas import DocumentType

def classify_document(text: str) -> Tuple[DocumentType, float]:
    """
    Classifies the document into Notice, Contract, Agreement, Policy, or Unknown.
    Returns (document_type, confidence).
    """
    text_lower = text.lower()[:3000]

    # Rule-based / NLP pattern scoring
    notice_keywords = [
        "notice", "demand notice", "eviction notice", "legal notice", "reminder notice",
        "cure notice", "default notice", "vacate the premises", "hereby notified", "take notice"
    ]
    agreement_keywords = [
        "tenancy agreement", "lease agreement", "rental agreement", "service agreement",
        "non-disclosure agreement", "license agreement", "this agreement is entered into",
        "parties hereto agree", "whereas the landlord"
    ]
    contract_keywords = [
        "freelance contract", "employment contract", "consulting contract", "master services contract",
        "contractor agreement", "scope of work", "deliverables", "independent contractor"
    ]
    policy_keywords = [
        "privacy policy", "terms of service", "terms of use", "acceptable use policy",
        "code of conduct", "cookie policy"
    ]

    notice_score = sum(3 if kw in text_lower[:500] else 1 for kw in notice_keywords if kw in text_lower)
    agreement_score = sum(3 if kw in text_lower[:500] else 1 for kw in agreement_keywords if kw in text_lower)
    contract_score = sum(3 if kw in text_lower[:500] else 1 for kw in contract_keywords if kw in text_lower)
    policy_score = sum(3 if kw in text_lower[:500] else 1 for kw in policy_keywords if kw in text_lower)

    scores = [
        (DocumentType.NOTICE, notice_score),
        (DocumentType.AGREEMENT, agreement_score),
        (DocumentType.CONTRACT, contract_score),
        (DocumentType.POLICY, policy_score)
    ]
    scores.sort(key=lambda x: x[1], reverse=True)
    best_type, best_score = scores[0]

    if best_score == 0:
        return DocumentType.UNKNOWN, 0.40

    confidence = min(0.98, max(0.65, 0.50 + (best_score * 0.08)))
    return best_type, round(confidence, 2)
