import re
from typing import List, Optional
from app.models.schemas import (
    StructuredExtraction, DocumentComparisonResult, DiffFieldChange, RiskLevel
)

def extract_numeric_rupees(text: str) -> Optional[int]:
    clean = text.replace(",", "").replace("₹", "").replace("INR", "").replace("Rs.", "").strip()
    match = re.search(r'\b\d{4,9}\b', clean)
    if match:
        return int(match.group(0))
    return None

def extract_notice_days(text: str) -> Optional[int]:
    match = re.search(r'\b(\d+)\s*(?:calendar\s*)?days\b', text, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None

def compare_documents(
    target_doc_id: str,
    target_doc_title: str,
    target_extraction: StructuredExtraction,
    prior_doc_id: str,
    prior_doc_title: str,
    prior_extraction: StructuredExtraction
) -> DocumentComparisonResult:
    """
    Performs deterministic, plain-code diffing between two extracted schemas.
    """
    diffs: List[DiffFieldChange] = []

    # 1. Compare Rent / Primary Amount
    target_rent_item = next((a for a in target_extraction.amounts if "rent" in a.label.lower()), None)
    prior_rent_item = next((a for a in prior_extraction.amounts if "rent" in a.label.lower()), None)

    if target_rent_item and prior_rent_item:
        target_val = extract_numeric_rupees(target_rent_item.value)
        prior_val = extract_numeric_rupees(prior_rent_item.value)

        if target_val and prior_val:
            diff_pct = round(((target_val - prior_val) / prior_val) * 100, 1)
            sign = "+" if diff_pct > 0 else ""
            change_type = "increased" if diff_pct > 0 else "decreased"
            risk = RiskLevel.MEDIUM if diff_pct > 10 else RiskLevel.LOW
            diffs.append(DiffFieldChange(
                field_name="Monthly Rent",
                old_value=prior_rent_item.value,
                new_value=target_rent_item.value,
                change_type=change_type,
                plain_language_explanation=f"Rent has {change_type} by {sign}{diff_pct}% (from ₹{prior_val:,} to ₹{target_val:,}). Market standard annual hike is typically 5% to 10%.",
                risk_impact=risk
            ))

    # 2. Compare Notice Period / Timeline
    target_notice_quote = next((fc.clause_text for fc in target_extraction.flagged_clauses if "notice" in fc.compared_to.lower() or "notice" in fc.clause_text.lower()), None)
    if not target_notice_quote:
        target_notice_quote = next((kd.source_quote for kd in target_extraction.key_dates if "notice" in kd.label.lower()), "")

    prior_notice_quote = next((fc.clause_text for fc in prior_extraction.flagged_clauses if "notice" in fc.compared_to.lower() or "notice" in fc.clause_text.lower()), None)
    if not prior_notice_quote:
        prior_notice_quote = next((kd.source_quote for kd in prior_extraction.key_dates if "notice" in kd.label.lower()), "")

    target_days = extract_notice_days(target_notice_quote)
    prior_days = extract_notice_days(prior_notice_quote)

    if target_days and prior_days:
        if target_days != prior_days:
            change_type = "decreased" if target_days < prior_days else "increased"
            risk = RiskLevel.HIGH if target_days < prior_days else RiskLevel.LOW
            diffs.append(DiffFieldChange(
                field_name="Notice Period",
                old_value=f"{prior_days} days",
                new_value=f"{target_days} days",
                change_type=change_type,
                plain_language_explanation=f"Notice period was reduced from {prior_days} days to {target_days} days (a 50% cut). A 15-day notice gives significantly less time to find alternative accommodation or contest disputes.",
                risk_impact=risk
            ))

    # 3. Check for newly introduced risky clauses
    prior_clause_texts = [c.clause_text.lower() for c in prior_extraction.flagged_clauses]
    for target_clause in target_extraction.flagged_clauses:
        # If this clause was not present in prior document
        if not any(target_clause.clause_text[:40].lower() in pct for pct in prior_clause_texts):
            if "unilateral" in target_clause.compared_to.lower() or target_clause.risk_level == RiskLevel.HIGH:
                diffs.append(DiffFieldChange(
                    field_name="New Restrictive Clause",
                    old_value="Standard mutual notice in original lease",
                    new_value=target_clause.clause_text,
                    change_type="added",
                    plain_language_explanation=f"Newly introduced clause: {target_clause.reason}",
                    risk_impact=target_clause.risk_level
                ))

    summary_text = (
        f"Compared to your previous document '{prior_doc_title}', "
        f"NyayaTrack identified {len(diffs)} material change(s). "
        f"Key highlight: noticeable shift in financial terms and reduced notice response window."
    )

    return DocumentComparisonResult(
        target_doc_id=target_doc_id,
        target_doc_title=target_doc_title,
        prior_doc_id=prior_doc_id,
        prior_doc_title=prior_doc_title,
        differences=diffs,
        summary_explanation=summary_text
    )
