import re
from typing import List
from app.models.schemas import FlaggedClause, RiskLevel
from app.ingestion.chunker import split_into_sentences

def analyze_clause_risks(text: str) -> List[FlaggedClause]:
    sentences = split_into_sentences(text)
    flagged: List[FlaggedClause] = []

    for sentence in sentences:
        s_lower = sentence.lower()

        # 1. Short Notice Period Risk (< 15 days or compressed 7 days)
        short_notice_match = re.search(r'\b(within\s+(?:7|ten|10|seven|3|three|5|five|15|fifteen)\s*(?:calendar\s*)?days|notice\s*period\s*of\s*(?:7|ten|10|seven|15|fifteen)\s*days)\b', s_lower)
        if short_notice_match and any(w in s_lower for w in ["vacate", "terminate", "handover", "quit", "leave", "evict", "respond"]):
            flagged.append(FlaggedClause(
                clause_text=sentence,
                risk_level=RiskLevel.HIGH,
                reason="The notice period given is significantly shorter than the standard 30 days (or minimum 15 days) recommended under Indian tenancy conventions and Transfer of Property Act Sec 106.",
                compared_to="Standard Tenancy Notice Period Guidelines (MTA & TPA Sec 106)",
                is_grounded=True
            ))
            continue

        # 2. Unilateral Termination / Discretion
        if any(w in s_lower for w in ["sole discretion", "unilateral right", "without assigning any reason", "without mutual consent", "at will without penalty"]) and any(w in s_lower for w in ["terminate", "cancel", "evict", "modify"]):
            flagged.append(FlaggedClause(
                clause_text=sentence,
                risk_level=RiskLevel.HIGH,
                reason="This clause grants one party unilateral power to cancel or modify terms without reciprocal rights for the other party, creating a high procedural imbalance.",
                compared_to="Fair Contracting and Unilateral Modification Standards",
                is_grounded=True
            ))
            continue

        # 3. Excessive Penalties / Exorbitant Interest
        penalty_match = re.search(r'(\b(?:24%|36%|2% per month|3% per month|penalty of ₹|forfeit (?:the entire|all) security deposit)\b)', s_lower)
        if penalty_match or (any(w in s_lower for w in ["forfeit", "forfeiture"]) and "deposit" in s_lower and "entire" in s_lower):
            flagged.append(FlaggedClause(
                clause_text=sentence,
                risk_level=RiskLevel.HIGH,
                reason="Indian Contract Act Section 74 allows only reasonable pre-estimated compensation. Penalties of 24%+ or total deposit forfeiture for minor delays are considered punitive and vulnerable to dispute.",
                compared_to="Indian Contract Act Sec 74 (Liquidated Damages vs Penalty)",
                is_grounded=True
            ))
            continue

        # 4. Unlimited Liability / Indemnity
        if any(w in s_lower for w in ["unlimited liability", "indemnify and hold harmless against any and all claims", "indemnify without limitation"]):
            flagged.append(FlaggedClause(
                clause_text=sentence,
                risk_level=RiskLevel.HIGH,
                reason="Imposes uncapped financial responsibility on the individual/freelancer for any third-party claims, which severely deviates from market caps (ordinarily capped at total fees paid).",
                compared_to="Standard Freelance Liability Limitation Framework",
                is_grounded=True
            ))
            continue

        # 5. Non-compete after termination
        if any(w in s_lower for w in ["non-compete", "not work for any competitor", "shall not engage in similar business"]) and any(w in s_lower for w in ["1 year", "2 years", "12 months", "post-termination", "after cessation"]):
            flagged.append(FlaggedClause(
                clause_text=sentence,
                risk_level=RiskLevel.MEDIUM,
                reason="Under Indian Contract Act Section 27, post-termination non-compete covenants on individuals/freelancers are void in restraint of trade, yet clients frequently use them to deter workers.",
                compared_to="Indian Contract Act Sec 27 (Restraint of Trade Guidelines)",
                is_grounded=True
            ))
            continue

        # 6. Auto-renewal without Notice or Rent Escalation > 15%
        escalation_match = re.search(r'\b(15%|18%|20%|25%|30%)\s*(?:escalation|increase|hike)\b', s_lower)
        if escalation_match or ("escalation of" in s_lower and any(num in s_lower for num in ["15", "18", "20", "25"])):
            flagged.append(FlaggedClause(
                clause_text=sentence,
                risk_level=RiskLevel.MEDIUM,
                reason="Proposed rent or fee escalation is above the standard market convention (typically 5% to 10% annual escalation in Indian metropolitan residential leases).",
                compared_to="Standard Metropolitan Lease Escalation Practices",
                is_grounded=True
            ))
            continue

    return flagged
