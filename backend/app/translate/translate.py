from typing import Tuple, List
from app.models.schemas import StructuredExtraction, ComputedDeadline, DocumentType

def generate_checklist_and_questions(
    extraction: StructuredExtraction,
    deadlines: List[ComputedDeadline]
) -> Tuple[List[str], List[str]]:
    checklist: List[str] = []
    questions_for_lawyer: List[str] = []

    # 1. Checklist generation
    for dl in deadlines:
        if dl.target_date:
            checklist.append(f"Send written response regarding '{dl.label}' before {dl.target_date} (preserve postal/email proof).")
        else:
            checklist.append(f"Acknowledge receipt and request clarification on '{dl.label}'.")

    if extraction.document_type == DocumentType.NOTICE:
        checklist.append("Gather payment receipts, initial tenancy agreement, and previous rent transfer bank statements.")
        checklist.append("Draft a polite counter-proposal referencing the original 30-day notice clause.")
    elif extraction.document_type in [DocumentType.CONTRACT, DocumentType.AGREEMENT]:
        checklist.append("Review payment milestones and ensure clause specifies Net-15 or Net-30 payment terms.")
        checklist.append("Request written confirmation of work handover criteria before signing.")

    # 2. Questions for lawyer brief
    if extraction.flagged_clauses:
        for fc in extraction.flagged_clauses:
            if "notice" in fc.compared_to.lower():
                questions_for_lawyer.append("Does the landlord's 15-day notice period violate Section 106 of the Transfer of Property Act or local Rent Control guidelines in my state?")
            elif "unilateral" in fc.compared_to.lower():
                questions_for_lawyer.append("Is the landlord's unilateral 7-day termination power considered unconscionable and legally challengeable?")
            elif "penalty" in fc.compared_to.lower():
                questions_for_lawyer.append("Can the counter-party legally forfeit my entire security deposit without showing an itemized damage bill under Indian Contract Act Sec 74?")
            elif "non-compete" in fc.compared_to.lower():
                questions_for_lawyer.append("How does Section 27 of the Indian Contract Act protect me against post-contract client non-compete restrictions?")
    
    if not questions_for_lawyer:
        questions_for_lawyer.append("Are there any hidden indemnity liabilities in this document that I should push to cap?")
        questions_for_lawyer.append("Does this notice meet procedural requirements for service under civil law?")

    return checklist[:5], questions_for_lawyer[:4]

def generate_bilingual_summaries(
    title: str,
    extraction: StructuredExtraction
) -> Tuple[str, str]:
    # English summary
    parties_str = ", ".join(extraction.parties) if extraction.parties else "Specified Parties"
    flagged_count = len(extraction.flagged_clauses)
    
    rent_val = next((a.value for a in extraction.amounts if "rent" in a.label.lower()), None)
    
    en_summary = (
        f"This document is a {extraction.document_type.value} concerning {parties_str}. "
    )
    if rent_val:
        en_summary += f"It states a monthly rent / financial obligation of {rent_val}. "
    if flagged_count > 0:
        en_summary += f"NyayaTrack flagged {flagged_count} clause(s) requiring your attention due to compressed notice timelines or unilateral terms."
    else:
        en_summary += "The extracted clauses align generally with standard reference conventions."

    # Hindi plain-language summary (Devanagari script)
    hi_summary = (
        f"यह दस्तावेज़ {parties_str} के संबंध में एक {extraction.document_type.value} (विधिक सूचना/अनुबंध) है। "
    )
    if rent_val:
        hi_summary += f"इसमें मासिक किराया / देय राशि {rent_val} उल्लिखित है। "
    if flagged_count > 0:
        hi_summary += (
            f"न्यायट्रैक ने इसमें {flagged_count} ऐसे प्रावधानों (क्लॉज) को चिन्हित किया है जिनमें जोखिम हो सकता है—"
            f"विशेषकर कम समय की नोटिस अवधि (15 दिन) या एकतरफा शर्तें। कृपया हस्ताक्षर या सहमति देने से पहले वकील से परामर्श करें।"
        )
    else:
        hi_summary += "इस दस्तावेज़ की शर्तें सामान्य भारतीय मानकों के अनुरूप प्रतीत होती हैं।"

    return en_summary, hi_summary
