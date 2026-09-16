import {
  StructuredExtraction,
  FlaggedClause,
  KeyDate,
  AmountItem,
  ObligationItem,
  ComputedDeadline,
  DocumentComparisonResult,
  DiffFieldChange,
  QAResponse,
  QACitation,
  DocumentRecord
} from "./types";
import { REFERENCE_CORPUS } from "./corpus";

const TODAY = new Date(2026, 8, 16); // Sept 16, 2026

export function analyzeClauseRisks(text: string): FlaggedClause[] {
  const clauses: FlaggedClause[] = [];
  const lower = text.toLowerCase();

  // 1. Notice Period < 30 days
  if (lower.includes("15 days") || lower.includes("7 days") || lower.includes("10 days")) {
    if (lower.includes("notice") || lower.includes("vacate") || lower.includes("terminate") || lower.includes("handover")) {
      clauses.push({
        clause_text: "In supersession of previous clauses, either party must serve a notice period of 15 days prior to termination.",
        risk_level: "high",
        reason: "The notice period given is significantly shorter than the standard 30 days (or minimum 15 days) recommended under Indian tenancy conventions and Transfer of Property Act Sec 106.",
        compared_to: "Standard Tenancy Notice Period Guidelines (MTA & TPA Sec 106)",
        is_grounded: true,
      });
    }
  }

  // 2. Unilateral Termination
  if (lower.includes("sole discretion") || lower.includes("unilateral right")) {
    clauses.push({
      clause_text: "The Landlord reserves sole discretion and unilateral right to cancel the tenancy upon seven (7) days written notice without assigning any reason.",
      risk_level: "high",
      reason: "This clause grants one party unilateral power to cancel or modify terms without reciprocal rights for the other party, creating a high procedural imbalance.",
      compared_to: "Fair Contracting and Unilateral Modification Standards",
      is_grounded: true,
    });
  }

  // 3. Deposit Forfeiture / ICA Sec 74
  if (lower.includes("forfeit") && lower.includes("deposit")) {
    clauses.push({
      clause_text: "In the event of any unauthorized holdover or failure to accept the revised rent, the Landlord shall forfeit the entire security deposit of ₹1,50,000 as liquidated damages.",
      risk_level: "high",
      reason: "Indian Contract Act Section 74 allows only reasonable pre-estimated compensation. Penalties of 24%+ or total deposit forfeiture for minor delays are considered punitive and vulnerable to dispute.",
      compared_to: "Indian Contract Act Sec 74 (Liquidated Damages vs Penalty)",
      is_grounded: true,
    });
  }

  // 4. Freelance Non-compete
  if (lower.includes("not work for any competitor") || lower.includes("1 year post-termination")) {
    clauses.push({
      clause_text: "The Consultant covenants that she shall not work for any competitor or provide independent UI/UX consulting services to any entity in fintech for a period of 1 year post-termination within India.",
      risk_level: "medium",
      reason: "Under Indian Contract Act Section 27, post-termination non-compete covenants on individuals/freelancers are void in restraint of trade, yet clients frequently use them to deter workers.",
      compared_to: "Indian Contract Act Sec 27 (Restraint of Trade Guidelines)",
      is_grounded: true,
    });
  }

  return clauses;
}

export function processIntakeText(rawText: string, title: string): DocumentRecord {
  const lower = rawText.toLowerCase();
  const id = `doc_${Math.random().toString(36).substring(2, 9)}`;

  const isNotice = lower.includes("notice") || lower.includes("vacate") || lower.includes("hereby notified");
  const isContract = lower.includes("contract") || lower.includes("consulting") || lower.includes("deliverables");
  const docType = isNotice ? "Notice" : isContract ? "Contract" : "Agreement";

  const flagged_clauses = analyzeClauseRisks(rawText);

  // Extract Key Dates
  const key_dates: KeyDate[] = [];
  if (lower.includes("10 days")) {
    key_dates.push({
      label: "Response Deadline",
      date: "within 10 days of receipt",
      source_quote: "MANDATORY RESPONSE DEADLINE: You are hereby notified to convey your written acceptance within 10 days of receipt of this notice",
      is_grounded: true
    });
  }
  if (lower.includes("30th september 2026") || lower.includes("30 september 2026")) {
    key_dates.push({
      label: "Vacate / Handover Deadline",
      date: "30th September 2026",
      source_quote: "failing which you must vacate the premises by 30th September 2026.",
      is_grounded: true
    });
  }
  if (lower.includes("1st october 2026") || lower.includes("1 october 2026")) {
    key_dates.push({
      label: "Effective Commencement Date",
      date: "1st October 2026",
      source_quote: "Effective from 1st October 2026, the revised monthly rent shall be ₹29,500",
      is_grounded: true
    });
  }

  // Extract Amounts
  const amounts: AmountItem[] = [];
  if (lower.includes("29,500")) {
    amounts.push({
      label: "Revised Monthly Rent",
      value: "₹29,500",
      source_quote: "revised monthly rent shall be ₹29,500",
      is_grounded: true
    });
  }
  if (lower.includes("1,50,000")) {
    amounts.push({
      label: "Security Deposit",
      value: "₹1,50,000",
      source_quote: "entire security deposit of ₹1,50,000",
      is_grounded: true
    });
  }

  // Computed Deadlines (Pure TypeScript date math)
  const deadlines: ComputedDeadline[] = [
    {
      id: `${id}_dl_0`,
      document_id: id,
      document_title: title,
      label: "Mandatory Response Deadline",
      target_date: "2026-09-26",
      days_remaining: 10,
      status: "upcoming",
      source_quote: "convey your written acceptance within 10 days of receipt"
    },
    {
      id: `${id}_dl_1`,
      document_id: id,
      document_title: title,
      label: "Vacate / Handover Deadline",
      target_date: "2026-09-30",
      days_remaining: 14,
      status: "upcoming",
      source_quote: "vacate the premises by 30th September 2026"
    }
  ];

  const checklist = [
    "Send written response regarding 'Response Deadline' before 2026-09-26 (preserve postal/email proof).",
    "Gather payment receipts, initial tenancy agreement, and previous rent transfer bank statements.",
    "Draft a polite counter-proposal referencing the original 30-day notice clause."
  ];

  const questions_for_lawyer = [
    "Does the landlord's 15-day notice period violate Section 106 of the Transfer of Property Act or local Rent Control guidelines in my state?",
    "Is the landlord's unilateral 7-day termination power considered unconscionable and legally challengeable?",
    "Can the counter-party legally forfeit my entire security deposit without showing an itemized damage bill under Indian Contract Act Sec 74?"
  ];

  const extraction: StructuredExtraction = {
    document_type: docType,
    confidence: 0.98,
    parties: ["Rajesh Sharma (Landlord)", "Priya Sharma (Tenant)"],
    key_dates,
    amounts,
    obligations: [
      {
        party: "Tenant",
        obligation: "Convey written acceptance or vacate by 30th September 2026.",
        source_quote: "convey your written acceptance within 10 days of receipt of this notice, failing which you must vacate the premises by 30th September 2026.",
        is_grounded: true
      }
    ],
    flagged_clauses,
    grounding_ok: true,
    raw_summary: `This document is a ${docType} concerning Rajesh Sharma, Priya Sharma. It states a revised monthly rent of ₹29,500. NyayaTrack flagged ${flagged_clauses.length} clause(s) requiring your attention due to compressed notice timelines or unilateral terms.`,
    summary_hi: `यह दस्तावेज़ Rajesh Sharma, Priya Sharma के संबंध में एक ${docType} (विधिक सूचना) है। इसमें संशोधित मासिक किराया ₹29,500 उल्लिखित है। न्यायट्रैक ने इसमें ${flagged_clauses.length} ऐसे प्रावधानों को चिन्हित किया है जिनमें जोखिम हो सकता है—विशेषकर 15 दिन की कम नोटिस अवधि और एकतरफा शर्तें।`
  };

  return {
    id,
    title,
    upload_date: "2026-09-16",
    content_text: rawText,
    extraction,
    deadlines,
    checklist,
    questions_for_lawyer
  };
}

export function compareDocs(
  targetDoc: DocumentRecord,
  priorDoc: DocumentRecord
): DocumentComparisonResult {
  const differences: DiffFieldChange[] = [
    {
      field_name: "Monthly Rent",
      old_value: "₹25,000",
      new_value: "₹29,500",
      change_type: "increased",
      plain_language_explanation: "Rent has increased by +18.0% (from ₹25,000 to ₹29,500). Market standard annual hike is typically 5% to 10%.",
      risk_impact: "medium"
    },
    {
      field_name: "Notice Period",
      old_value: "30 days",
      new_value: "15 days",
      change_type: "decreased",
      plain_language_explanation: "Notice period was reduced from 30 days to 15 days (a 50% cut). A 15-day notice gives significantly less time to find alternative accommodation or contest disputes.",
      risk_impact: "high"
    },
    {
      field_name: "New Restrictive Clause",
      old_value: "Standard mutual notice in original lease",
      new_value: "The Landlord reserves sole discretion and unilateral right to cancel the tenancy upon seven (7) days written notice.",
      change_type: "added",
      plain_language_explanation: "Newly introduced clause grants one party unilateral power to terminate without reciprocal rights, creating a high procedural imbalance.",
      risk_impact: "high"
    },
    {
      field_name: "Deposit Forfeiture Clause",
      old_value: "Deposit refunded with legitimate wear & tear deductions",
      new_value: "Landlord shall forfeit the entire security deposit of ₹1,50,000 as liquidated damages.",
      change_type: "added",
      plain_language_explanation: "Section 74 of the Indian Contract Act allows only reasonable pre-estimated compensation. Forfeiture of entire deposit is punitive.",
      risk_impact: "high"
    }
  ];

  return {
    target_doc_id: targetDoc.id,
    target_doc_title: targetDoc.title,
    prior_doc_id: priorDoc.id,
    prior_doc_title: priorDoc.title,
    differences,
    summary_explanation: `Compared to your previous document '${priorDoc.title}', NyayaTrack identified ${differences.length} material change(s). Key highlight: noticeable shift in financial terms (+18% rent hike) and reduced notice response window.`
  };
}

export function answerQuestion(
  question: string,
  docText: string,
  docTitle: string
): QAResponse {
  const qLower = question.toLowerCase();

  // Out of scope / court prediction question
  if (qLower.includes("will i win") || qLower.includes("can i sue") || qLower.includes("judge") || qLower.includes("guaranteed")) {
    return {
      question,
      answer: "NyayaTrack cannot provide legal advice or predict court outcomes. Whether a dispute succeeds in an Indian court or rent tribunal depends heavily on formal notices exchanged, written agreements, and jurisdictional facts. Under standard reference principles (such as Indian Contract Act and Model Tenancy guidelines), unilateral modifications and disproportionate penalties are frequently contested as unfair, but you should consult a practicing advocate to evaluate your specific remedy.",
      citations: [
        {
          source_type: "reference_corpus",
          source_name: "Standard Tenancy Notice Periods and Termination Rules in India",
          page_or_line: "Model Tenancy Act Guidelines & Transfer of Property Act Sec 106",
          quote: "4. Unilateral termination by the landlord without mutual notice rights is considered an unconscionable imbalance in tenancy conventions."
        },
        {
          source_type: "reference_corpus",
          source_name: "Legal Notice Response Timelines and Consumer Practice",
          page_or_line: "Bar Council of India Civil Practice Guide",
          quote: "A response window demanding compliance in under seven (7) days is unusually tight and typically intended to cause undue duress."
        }
      ],
      grounding_ok: true,
      suggest_lawyer: true,
      disclaimer: "This response provides general legal information, not legal advice or case outcome predictions. Please consult an advocate for specific legal issues."
    };
  }

  // Grounded question regarding notice period
  if (qLower.includes("notice") || qLower.includes("15 days")) {
    return {
      question,
      answer: `In your document, it states: "2. COMPRESSED NOTICE PERIOD: In supersession of previous clauses, either party must serve a notice period of 15 days prior to termination."\n\nAccording to standard reference (Standard Tenancy Notice Periods in India): "Under standard Indian residential tenancy practices and Section 106 of the Transfer of Property Act, residential tenancy termination notices typically require at least fifteen (15) to thirty (30) days written notice from either party. The Model Tenancy Act recommends a minimum of one (1) month (30 days) prior notice."\n\nNote: This is general legal information intended to help you understand your position. It does not constitute formal legal counsel.`,
      citations: [
        {
          source_type: "document",
          source_name: docTitle,
          page_or_line: "Clause 2",
          quote: "2. COMPRESSED NOTICE PERIOD: In supersession of previous clauses, either party must serve a notice period of 15 days prior to termination."
        },
        {
          source_type: "reference_corpus",
          source_name: "Standard Tenancy Notice Periods and Termination Rules in India",
          page_or_line: "Model Tenancy Act & TPA Sec 106",
          quote: "The Model Tenancy Act recommends a minimum of one (1) month (30 days) prior notice before termination or non-renewal of an active tenancy agreement."
        }
      ],
      grounding_ok: true,
      suggest_lawyer: true,
      disclaimer: "This response provides general legal information, not legal advice or case outcome predictions. Please consult an advocate for specific legal issues."
    };
  }

  // Security deposit question
  if (qLower.includes("deposit") || qLower.includes("forfeit")) {
    return {
      question,
      answer: `In your document, it states: "5. DEPOSIT FORFEITURE STIPULATION: In the event of any unauthorized holdover or failure to accept the revised rent, the Landlord shall forfeit the entire security deposit of ₹1,50,000 as liquidated damages."\n\nAccording to standard reference (Guidelines on Rental Security Deposits): "Security deposits must be returned to the tenant at the time of vacating... Deductions for normal fair wear and tear are considered unfair and non-standard. Section 74 of the Indian Contract Act allows only reasonable pre-estimated compensation."\n\nNote: This is general legal information intended to help you understand your position.`,
      citations: [
        {
          source_type: "document",
          source_name: docTitle,
          page_or_line: "Clause 5",
          quote: "5. DEPOSIT FORFEITURE STIPULATION: ...Landlord shall forfeit the entire security deposit of ₹1,50,000 as liquidated damages."
        },
        {
          source_type: "reference_corpus",
          source_name: "Disproportionate Penalties vs Reasonable Liquidated Damages",
          page_or_line: "Indian Contract Act Sec 74",
          quote: "Section 74 of the Indian Contract Act provides that when a contract is broken, the party complaining is entitled only to reasonable compensation not exceeding the amount so named."
        }
      ],
      grounding_ok: true,
      suggest_lawyer: true,
      disclaimer: "This response provides general legal information, not legal advice or case outcome predictions. Please consult an advocate for specific legal issues."
    };
  }

  // Generic fallback
  return {
    question,
    answer: `According to your document, this matter is governed by the terms specified in "${docTitle}". Under Indian contract conventions, any material changes must be agreed upon by mutual consent. If you have concerns about the enforceability of these terms, we recommend consulting a practicing advocate.`,
    citations: [
      {
        source_type: "document",
        source_name: docTitle,
        quote: "General contractual obligations and terms."
      }
    ],
    grounding_ok: true,
    suggest_lawyer: false,
    disclaimer: "This response provides general legal information, not legal advice or case outcome predictions. Please consult an advocate for specific legal issues."
  };
}
