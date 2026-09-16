from __future__ import annotations
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class DocumentType(str, Enum):
    NOTICE = "Notice"
    CONTRACT = "Contract"
    AGREEMENT = "Agreement"
    POLICY = "Policy"
    UNKNOWN = "Unknown"

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class KeyDate(BaseModel):
    label: str
    date: Optional[str] = None  # ISO-8601 string or descriptive date
    source_quote: str = ""
    is_grounded: bool = True

class AmountItem(BaseModel):
    label: str
    value: str
    source_quote: str = ""
    is_grounded: bool = True

class ObligationItem(BaseModel):
    party: str
    obligation: str
    source_quote: str = ""
    is_grounded: bool = True

class FlaggedClause(BaseModel):
    clause_text: str
    risk_level: RiskLevel
    reason: str
    compared_to: str
    is_grounded: bool = True

class StructuredExtraction(BaseModel):
    document_type: DocumentType
    confidence: float = Field(ge=0.0, le=1.0)
    parties: List[str] = Field(default_factory=list)
    key_dates: List[KeyDate] = Field(default_factory=list)
    amounts: List[AmountItem] = Field(default_factory=list)
    obligations: List[ObligationItem] = Field(default_factory=list)
    flagged_clauses: List[FlaggedClause] = Field(default_factory=list)
    grounding_ok: bool = True
    raw_summary: Optional[str] = None
    summary_hi: Optional[str] = None

class DeadlineStatus(str, Enum):
    URGENT = "urgent"      # < 7 days
    UPCOMING = "upcoming"  # 7 - 30 days
    FUTURE = "future"      # > 30 days
    EXPIRED = "expired"    # in the past
    NO_DATE = "no_date"

class ComputedDeadline(BaseModel):
    id: str
    document_id: str
    document_title: str
    label: str
    target_date: Optional[str] = None
    days_remaining: Optional[int] = None
    status: DeadlineStatus
    source_quote: str = ""

class DiffFieldChange(BaseModel):
    field_name: str
    old_value: str
    new_value: str
    change_type: str  # increased, decreased, modified, added, removed
    plain_language_explanation: str
    risk_impact: RiskLevel

class DocumentComparisonResult(BaseModel):
    target_doc_id: str
    target_doc_title: str
    prior_doc_id: str
    prior_doc_title: str
    differences: List[DiffFieldChange] = Field(default_factory=list)
    summary_explanation: str

class QACitation(BaseModel):
    source_type: str  # "document" or "reference_corpus"
    source_name: str
    page_or_line: Optional[str] = None
    quote: str

class QAResponse(BaseModel):
    question: str
    answer: str
    citations: List[QACitation] = Field(default_factory=list)
    grounding_ok: bool = True
    suggest_lawyer: bool = False
    disclaimer: str = "This response provides general legal information, not legal advice or case outcome predictions. Please consult an advocate for specific legal issues."

class DocumentRecord(BaseModel):
    id: str
    title: str
    filename: Optional[str] = None
    upload_date: str
    content_text: str
    extraction: StructuredExtraction
    deadlines: List[ComputedDeadline] = Field(default_factory=list)
    checklist: List[str] = Field(default_factory=list)
    questions_for_lawyer: List[str] = Field(default_factory=list)
