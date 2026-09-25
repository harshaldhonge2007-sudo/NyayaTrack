import os
import re
import json
from datetime import datetime
from typing import List, Tuple, Optional
import requests

from app.models.schemas import (
    StructuredExtraction, DocumentType, KeyDate, AmountItem,
    ObligationItem, FlaggedClause, RiskLevel
)
from app.extraction.classify import classify_document
from app.extraction.clause_risk import analyze_clause_risks
from app.ingestion.chunker import split_into_sentences

def verify_source_quote(source_quote: str, document_text: str) -> bool:
    """
    Verifies that the source_quote exists verbatim as a substring in the document text.
    Allows for minor normalized whitespace differences to prevent hallucinated citations.
    """
    if not source_quote or not source_quote.strip():
        return False

    norm_doc = " ".join(document_text.split()).lower()
    norm_quote = " ".join(source_quote.split()).lower()
    return norm_quote in norm_doc

def extract_structured_fields_with_ai(text: str, api_key: Optional[str] = None) -> Optional[dict]:
    """
    Attempts GenAI structured extraction via Google Gemini 1.5 Flash.
    """
    key = api_key or os.getenv("GEMINI_API_KEY", "").strip()
    if not key or "your_" in key:
        return None

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
        prompt = (
            "You are an Indian legal document analyzer. Extract structured entities in JSON format: "
            "parties (array of string names), "
            "amounts (array of objects with 'label', 'value', and verbatim 'source_quote'), "
            "key_dates (array of objects with 'label', 'date', and verbatim 'source_quote'), "
            "obligations (array of objects with 'party', 'obligation', and verbatim 'source_quote').\n"
            "CRITICAL: The 'source_quote' must be an exact substring from the document.\n\n"
            f"DOCUMENT:\n{text[:4000]}"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json"
            }
        }
        resp = requests.post(url, json=payload, timeout=6)
        if resp.status_code == 200:
            data = resp.json()
            cand_text = data.get("candidates", [])[0]["content"]["parts"][0]["text"]
            return json.loads(cand_text)
    except Exception:
        pass
    return None

def extract_structured_fields(text: str, api_key: Optional[str] = None) -> StructuredExtraction:
    """
    Dual-engine structured extraction:
    1. If Gemini API key is available, attempts GenAI structured schema extraction.
    2. Enforces strict anti-hallucination verification on every extracted citation.
    3. Seamlessly merges with or defaults to deterministic pattern-based extraction
       when offline or when key is absent.
    """
    doc_type, confidence = classify_document(text)
    sentences = split_into_sentences(text)

    parties: List[str] = []
    key_dates: List[KeyDate] = []
    amounts: List[AmountItem] = []
    obligations: List[ObligationItem] = []

    # 1. Deterministic Extraction Baseline
    # Parties
    party_patterns = [
        r'(?:between|by and between|landlord|lessor|client)\s*[:\-]?\s*([A-Z][a-zA-Z\s\.,]{2,40}?)(?:,\s*residing|hereinafter|and|\(tenant\))',
        r'(?:tenant|lessee|contractor|consultant)\s*[:\-]?\s*([A-Z][a-zA-Z\s\.,]{2,40}?)(?:,\s*residing|hereinafter|and|\(the|\.)',
        r'(?:from|issued by)\s*[:\-]?\s*([A-Z][a-zA-Z\s\.,]{2,40}?)(?:\n|,|to)',
        r'(?:to|attention)\s*[:\-]?\s*([A-Z][a-zA-Z\s\.,]{2,40}?)(?:\n|,|flat|subject)'
    ]
    for pattern in party_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for m in matches:
            val = m.group(1).strip().strip(",.- ")
            if val and len(val) > 2 and val not in parties and not any(kw in val.lower() for kw in ["whereas", "herein", "schedule", "agreement"]):
                parties.append(val)
                if len(parties) >= 4:
                    break

    # Key Dates & Deadlines
    date_patterns = [
        (r'(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s+\d{4})', "Formal Date"),
        (r'(\d{4}-\d{2}-\d{2})', "ISO Date"),
        (r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', "Standard Date"),
        (r'(within\s+\d+\s+(?:calendar\s+)?days(?:\s+of\s+receipt)?)', "Response Deadline Window"),
        (r'(by\s+or\s+before\s+\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+,?\s+\d{4})', "Target Cutoff Date")
    ]

    for sentence in sentences:
        for pat, label in date_patterns:
            matches = re.finditer(pat, sentence, re.IGNORECASE)
            for m in matches:
                matched_str = m.group(1).strip()
                s_lower = sentence.lower()
                field_label = "Effective Date"
                if "vacate" in s_lower or "handover" in s_lower:
                    field_label = "Vacate / Handover Deadline"
                elif "respond" in s_lower or "reply" in s_lower:
                    field_label = "Response Deadline"
                elif "due" in s_lower or "pay" in s_lower:
                    field_label = "Payment Due Date"
                elif "commence" in s_lower or "start" in s_lower:
                    field_label = "Commencement Date"
                elif "notice period" in s_lower:
                    field_label = "Notice Period"

                if not any(kd.date == matched_str for kd in key_dates):
                    key_dates.append(KeyDate(
                        label=field_label,
                        date=matched_str,
                        source_quote=sentence,
                        is_grounded=True
                    ))
                    if len(key_dates) >= 6:
                        break

    # Amounts
    amount_patterns = [
        (r'(₹\s*[\d,]+(?:\.\d{2})?|\bINR\s*[\d,]+|Rs\.?\s*[\d,]+)', "Currency Amount"),
        (r'(\b[\d,]+\s*(?:Rupees|per month|p\.m\.|advance|deposit)\b)', "Rent / Deposit")
    ]
    for sentence in sentences:
        for pat, _ in amount_patterns:
            matches = re.finditer(pat, sentence, re.IGNORECASE)
            for m in matches:
                val = m.group(1).strip()
                s_lower = sentence.lower()
                amount_label = "Financial Term"
                if "monthly rent" in s_lower or "rent of" in s_lower or "revised rent" in s_lower:
                    amount_label = "Monthly Rent"
                elif "security deposit" in s_lower or "caution deposit" in s_lower:
                    amount_label = "Security Deposit"
                elif "maintenance" in s_lower:
                    amount_label = "Maintenance Charge"
                elif "fee" in s_lower or "compensation" in s_lower or "invoice" in s_lower:
                    amount_label = "Consulting / Project Fee"
                elif "penalty" in s_lower:
                    amount_label = "Penalty Amount"

                if not any(a.value == val for a in amounts):
                    amounts.append(AmountItem(
                        label=amount_label,
                        value=val,
                        source_quote=sentence,
                        is_grounded=True
                    ))
                    if len(amounts) >= 6:
                        break

    # Obligations
    for sentence in sentences:
        s_lower = sentence.lower()
        if any(w in s_lower for w in ["shall", "must", "agrees to", "covenants to", "required to", "is notified to"]):
            party_name = "Tenant / Recipient"
            if any(w in s_lower for w in ["landlord", "owner", "lessor"]):
                party_name = "Landlord"
            elif any(w in s_lower for w in ["client", "company"]):
                party_name = "Client"
            elif any(w in s_lower for w in ["freelancer", "contractor"]):
                party_name = "Contractor"

            clean_ob = sentence.strip()
            if clean_ob and len(clean_ob) > 20 and not any(o.obligation == clean_ob for o in obligations):
                obligations.append(ObligationItem(
                    party=party_name,
                    obligation=clean_ob,
                    source_quote=sentence,
                    is_grounded=True
                ))
                if len(obligations) >= 5:
                    break

    # 2. Optional GenAI Extraction Enrichment
    ai_data = extract_structured_fields_with_ai(text, api_key=api_key)
    if ai_data and isinstance(ai_data, dict):
        if "parties" in ai_data and isinstance(ai_data["parties"], list):
            for p in ai_data["parties"]:
                if isinstance(p, str) and len(p) > 2 and p not in parties:
                    parties.append(p)

        if "amounts" in ai_data and isinstance(ai_data["amounts"], list):
            for a in ai_data["amounts"]:
                if isinstance(a, dict) and "value" in a and "source_quote" in a:
                    if verify_source_quote(a["source_quote"], text) and not any(x.value == a["value"] for x in amounts):
                        amounts.append(AmountItem(
                            label=a.get("label", "Financial Amount"),
                            value=a["value"],
                            source_quote=a["source_quote"],
                            is_grounded=True
                        ))

        if "key_dates" in ai_data and isinstance(ai_data["key_dates"], list):
            for kd in ai_data["key_dates"]:
                if isinstance(kd, dict) and "date" in kd and "source_quote" in kd:
                    if verify_source_quote(kd["source_quote"], text) and not any(x.date == kd["date"] for x in key_dates):
                        key_dates.append(KeyDate(
                            label=kd.get("label", "Key Date"),
                            date=kd["date"],
                            source_quote=kd["source_quote"],
                            is_grounded=True
                        ))

    # Flagged Clauses
    flagged_clauses = analyze_clause_risks(text)

    # 3. Grounding Verification
    all_grounded = True
    for kd in key_dates:
        if not verify_source_quote(kd.source_quote, text):
            kd.is_grounded = False
            all_grounded = False

    for amt in amounts:
        if not verify_source_quote(amt.source_quote, text):
            amt.is_grounded = False
            all_grounded = False

    for ob in obligations:
        if not verify_source_quote(ob.source_quote, text):
            ob.is_grounded = False
            all_grounded = False

    for fc in flagged_clauses:
        if not verify_source_quote(fc.clause_text, text):
            fc.is_grounded = False
            all_grounded = False

    return StructuredExtraction(
        document_type=doc_type,
        confidence=confidence,
        parties=parties,
        key_dates=key_dates,
        amounts=amounts,
        obligations=obligations,
        flagged_clauses=flagged_clauses,
        grounding_ok=all_grounded
    )
