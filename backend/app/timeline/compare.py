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

def extract_payment_window(text: str) -> Optional[int]:
    net_match = re.search(r'net[- ]?(\d+)', text, re.IGNORECASE)
    if net_match:
        return int(net_match.group(1))
    days_match = re.search(r'(?:payable\s+within|payment\s+within|within)\s+(?:\w+\s+)?\(?(\d+)\)?\s*(?:calendar\s+|business\s+)?days', text, re.IGNORECASE)
    if days_match:
        return int(days_match.group(1))
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
    Performs comprehensive multi-field deterministic contract diffing across:
    - Primary Rent / Professional Fees
    - Security Deposit Changes
    - Notice Period & Response Windows
    - Commercial Payment Disbursement Terms (e.g. Net-15 vs Net-45)
    - Newly Introduced Restrictive Clauses (Non-compete, Indemnity, Unilateral termination)
    """
    diffs: List[DiffFieldChange] = []

    # 1. Compare Rent / Primary Amount
    target_rent = next((a for a in target_extraction.amounts if any(k in a.label.lower() for k in ["rent", "fee", "retainer"])), None)
    if not target_rent and target_extraction.amounts:
        target_rent = target_extraction.amounts[0]

    prior_rent = next((a for a in prior_extraction.amounts if any(k in a.label.lower() for k in ["rent", "fee", "retainer"])), None)
    if not prior_rent and prior_extraction.amounts:
        prior_rent = prior_extraction.amounts[0]

    if target_rent and prior_rent:
        target_val = extract_numeric_rupees(target_rent.value)
        prior_val = extract_numeric_rupees(prior_rent.value)

        if target_val and prior_val and target_val != prior_val:
            diff_pct = round(((target_val - prior_val) / prior_val) * 100, 1)
            sign = "+" if diff_pct > 0 else ""
            change_type = "increased" if diff_pct > 0 else "decreased"
            risk = RiskLevel.MEDIUM if diff_pct > 10 else RiskLevel.LOW
            label = "Professional Retainer Fee" if "fee" in target_rent.label.lower() else "Monthly Rent"
            diffs.append(DiffFieldChange(
                field_name=label,
                old_value=prior_rent.value,
                new_value=target_rent.value,
                change_type=change_type,
                plain_language_explanation=f"{label} has {change_type} by {sign}{diff_pct}% (from {prior_rent.value} to {target_rent.value}). Standard annual adjustments are typically 5% to 10%.",
                risk_impact=risk
            ))

    # 2. Compare Security Deposit
    target_dep = next((a for a in target_extraction.amounts if "deposit" in a.label.lower()), None)
    prior_dep = next((a for a in prior_extraction.amounts if "deposit" in a.label.lower()), None)
    if target_dep and prior_dep and target_dep.value != prior_dep.value:
        diffs.append(DiffFieldChange(
            field_name="Security Deposit",
            old_value=prior_dep.value,
            new_value=target_dep.value,
            change_type="modified",
            plain_language_explanation=f"Security deposit changed from {prior_dep.value} to {target_dep.value}.",
            risk_impact=RiskLevel.MEDIUM
        ))

    # 3. Compare Notice Period / Termination Window
    target_notice_quote = next((fc.clause_text for fc in target_extraction.flagged_clauses if "notice" in fc.compared_to.lower() or "notice" in fc.clause_text.lower()), None)
    if not target_notice_quote:
        target_notice_quote = next((kd.source_quote for kd in target_extraction.key_dates if "notice" in kd.label.lower()), "")

    prior_notice_quote = next((fc.clause_text for fc in prior_extraction.flagged_clauses if "notice" in fc.compared_to.lower() or "notice" in fc.clause_text.lower()), None)
    if not prior_notice_quote:
        prior_notice_quote = next((kd.source_quote for kd in prior_extraction.key_dates if "notice" in kd.label.lower()), "")

    target_days = extract_notice_days(target_notice_quote)
    prior_days = extract_notice_days(prior_notice_quote)

    if target_days and prior_days and target_days != prior_days:
        change_type = "decreased" if target_days < prior_days else "increased"
        risk = RiskLevel.HIGH if target_days < prior_days else RiskLevel.LOW
        cut_pct = round((1 - target_days / prior_days) * 100) if target_days < prior_days else 0
        diffs.append(DiffFieldChange(
            field_name="Notice Period",
            old_value=f"{prior_days} days",
            new_value=f"{target_days} days",
            change_type=change_type,
            plain_language_explanation=f"Notice period was reduced from {prior_days} days to {target_days} days (a {cut_pct}% cut). A compressed notice leaves significantly less time to find alternative arrangements.",
            risk_impact=risk
        ))

    # 4. Compare Payment Terms (Net-15 to Net-45)
    target_all_text = " ".join([o.obligation for o in target_extraction.obligations] + [fc.clause_text for fc in target_extraction.flagged_clauses])
    prior_all_text = " ".join([o.obligation for o in prior_extraction.obligations] + [fc.clause_text for fc in prior_extraction.flagged_clauses])
    target_pay = extract_payment_window(target_all_text)
    prior_pay = extract_payment_window(prior_all_text)
    if target_pay and prior_pay and target_pay != prior_pay:
        diffs.append(DiffFieldChange(
            field_name="Payment Disbursement Window",
            old_value=f"Net-{prior_pay} days",
            new_value=f"Net-{target_pay} days",
            change_type="increased" if target_pay > prior_pay else "decreased",
            plain_language_explanation=f"Payment timeline shifted from {prior_pay} days to {target_pay} days. Slower disbursements directly strain independent worker working capital.",
            risk_impact=RiskLevel.MEDIUM if target_pay > prior_pay else RiskLevel.LOW
        ))

    # 5. Check for Newly Introduced Risky Clauses
    prior_clause_texts = [c.clause_text.lower() for c in prior_extraction.flagged_clauses]
    for target_clause in target_extraction.flagged_clauses:
        # If this clause was not present in prior document
        if not any(target_clause.clause_text[:40].lower() in pct for pct in prior_clause_texts):
            field_title = "New Restrictive Clause"
            if "unilateral" in target_clause.compared_to.lower():
                field_title = "New Unilateral Termination Clause"
            elif "27" in target_clause.compared_to or "compete" in target_clause.compared_to.lower():
                field_title = "New Restraint of Trade (Non-Compete)"
            elif "indemnity" in target_clause.compared_to.lower() or "liability" in target_clause.compared_to.lower():
                field_title = "New Uncapped Indemnity Clause"
            elif "deposit" in target_clause.compared_to.lower() or "74" in target_clause.compared_to:
                field_title = "New Deposit Forfeiture Clause"

            diffs.append(DiffFieldChange(
                field_name=field_title,
                old_value="Standard mutual terms in baseline document",
                new_value=target_clause.clause_text,
                change_type="added",
                plain_language_explanation=f"Newly introduced deviation: {target_clause.reason}",
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
