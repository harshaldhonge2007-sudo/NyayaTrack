import re
from datetime import datetime, date, timedelta
from typing import List, Optional
from app.models.schemas import KeyDate, ComputedDeadline, DeadlineStatus

# Current benchmark date (or system today)
TODAY = date(2026, 9, 16)

def parse_date_str(date_str: str) -> Optional[date]:
    """
    Parses various date formats commonly seen in Indian legal notices and contracts.
    """
    if not date_str:
        return None

    date_clean = date_str.strip()
    
    # Check for "within X days"
    within_match = re.search(r'within\s+(\d+)\s+(?:calendar\s+)?days', date_clean, re.IGNORECASE)
    if within_match:
        days = int(within_match.group(1))
        return TODAY + timedelta(days=days)

    # Clean ordinals like 1st, 2nd, 3rd, 15th
    clean_ord = re.sub(r'(\d+)(?:st|nd|rd|th)', r'\1', date_clean)

    formats = [
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%d %B %Y",
        "%d %b %Y",
        "%B %d, %Y",
        "%b %d, %Y"
    ]

    for fmt in formats:
        # Search for date pattern matching this format
        for part in re.split(r'[,;]|\s+to\s+|\s+by\s+or\s+before\s+', clean_ord):
            part_str = part.strip()
            try:
                dt = datetime.strptime(part_str, fmt).date()
                return dt
            except ValueError:
                pass

    return None

def compute_deadlines_from_dates(doc_id: str, doc_title: str, key_dates: List[KeyDate]) -> List[ComputedDeadline]:
    """
    Strictly plain-code computation of deadlines and countdowns.
    No LLM is used for date math.
    """
    computed: List[ComputedDeadline] = []

    for idx, kd in enumerate(key_dates):
        if not kd.date:
            continue

        parsed = parse_date_str(kd.date)
        if parsed:
            days_left = (parsed - TODAY).days
            if days_left < 0:
                status = DeadlineStatus.EXPIRED
            elif days_left <= 7:
                status = DeadlineStatus.URGENT
            elif days_left <= 30:
                status = DeadlineStatus.UPCOMING
            else:
                status = DeadlineStatus.FUTURE

            target_iso = parsed.isoformat()
        else:
            days_left = None
            status = DeadlineStatus.NO_DATE
            target_iso = None

        computed.append(ComputedDeadline(
            id=f"{doc_id}_dl_{idx}",
            document_id=doc_id,
            document_title=doc_title,
            label=kd.label,
            target_date=target_iso or kd.date,
            days_remaining=days_left,
            status=status,
            source_quote=kd.source_quote
        ))

    # Sort deadlines: urgent first, then upcoming, then future, then expired
    def sort_key(d: ComputedDeadline):
        if d.days_remaining is None:
            return 9999
        if d.days_remaining >= 0:
            return d.days_remaining
        return 10000 + abs(d.days_remaining)

    computed.sort(key=sort_key)
    return computed
