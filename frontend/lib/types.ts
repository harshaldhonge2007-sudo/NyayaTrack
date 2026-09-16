export interface KeyDate {
  label: string;
  date: string | null;
  source_quote: string;
  is_grounded: boolean;
}

export interface AmountItem {
  label: string;
  value: string;
  source_quote: string;
  is_grounded: boolean;
}

export interface ObligationItem {
  party: string;
  obligation: string;
  source_quote: string;
  is_grounded: boolean;
}

export interface FlaggedClause {
  clause_text: string;
  risk_level: "low" | "medium" | "high";
  reason: string;
  compared_to: string;
  is_grounded: boolean;
}

export interface StructuredExtraction {
  document_type: "Notice" | "Contract" | "Agreement" | "Policy" | "Unknown";
  confidence: number;
  parties: string[];
  key_dates: KeyDate[];
  amounts: AmountItem[];
  obligations: ObligationItem[];
  flagged_clauses: FlaggedClause[];
  grounding_ok: boolean;
  raw_summary: string;
  summary_hi: string;
}

export interface ComputedDeadline {
  id: string;
  document_id: string;
  document_title: string;
  label: string;
  target_date: string;
  days_remaining: number | null;
  status: "urgent" | "upcoming" | "future" | "expired" | "no_date";
  source_quote: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  filename?: string;
  upload_date: string;
  content_text: string;
  extraction: StructuredExtraction;
  deadlines: ComputedDeadline[];
  checklist: string[];
  questions_for_lawyer: string[];
}

export interface DiffFieldChange {
  field_name: string;
  old_value: string;
  new_value: string;
  change_type: string;
  plain_language_explanation: string;
  risk_impact: "low" | "medium" | "high";
}

export interface DocumentComparisonResult {
  target_doc_id: string;
  target_doc_title: string;
  prior_doc_id: string;
  prior_doc_title: string;
  differences: DiffFieldChange[];
  summary_explanation: string;
}

export interface QACitation {
  source_type: string;
  source_name: string;
  page_or_line?: string;
  quote: string;
}

export interface QAResponse {
  question: string;
  answer: string;
  citations: QACitation[];
  grounding_ok: boolean;
  suggest_lawyer: boolean;
  disclaimer: string;
}
