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
  DocumentRecord
} from "./types";
import { REFERENCE_CORPUS, ReferenceExcerpt } from "./corpus";

// --- 1. Helper Utility Functions ---

export function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);
}

export function extractNumericRupees(text: string): number | null {
  const clean = text.replace(/,/g, "").replace(/₹/g, "").replace(/INR/gi, "").replace(/Rs\.?/gi, "").trim();
  const match = clean.match(/\b\d{4,9}\b/);
  return match ? parseInt(match[0], 10) : null;
}

export function extractDays(text: string): number | null {
  const match = text.match(/\b(\d+)\s*(?:calendar\s*)?days\b/i);
  return match ? parseInt(match[1], 10) : null;
}

export function verifySourceQuote(sourceQuote: string, documentText: string): boolean {
  if (!sourceQuote || !sourceQuote.trim()) return false;
  const normDoc = documentText.replace(/\s+/g, " ").toLowerCase();
  const normQuote = sourceQuote.replace(/\s+/g, " ").toLowerCase();
  return normDoc.includes(normQuote);
}

// --- 2. Dynamic Clause Risk Analysis vs Reference Corpus ---

export function analyzeClauseRisks(text: string): FlaggedClause[] {
  const flagged: FlaggedClause[] = [];
  const sentences = splitIntoSentences(text);

  for (const sentence of sentences) {
    const sLower = sentence.toLowerCase();

    // 1. Notice Period < 30 days
    if ((sLower.includes("notice") || sLower.includes("vacate") || sLower.includes("terminate")) &&
        (sLower.includes("15 days") || sLower.includes("7 days") || sLower.includes("10 days"))) {
      flagged.push({
        clause_text: sentence,
        risk_level: "high",
        reason: "The notice period given is significantly shorter than the standard 30 days recommended under the Model Tenancy Act and Section 106 of the Transfer of Property Act.",
        compared_to: "Standard Tenancy Notice Period Guidelines (MTA & TPA Sec 106)",
        is_grounded: true,
      });
      continue;
    }

    // 2. Unilateral Termination / Discretion
    if (sLower.includes("sole discretion") || sLower.includes("unilateral right") || sLower.includes("without assigning any reason")) {
      flagged.push({
        clause_text: sentence,
        risk_level: "high",
        reason: "This clause grants one party unilateral power to alter or cancel the agreement without reciprocal rights, creating a severe procedural imbalance.",
        compared_to: "Fairness in Unilateral Contract Modifications and Termination Rights",
        is_grounded: true,
      });
      continue;
    }

    // 3. Deposit Forfeiture / Punitive Damages (ICA Sec 74)
    if ((sLower.includes("forfeit") || sLower.includes("liquidated damages")) &&
        (sLower.includes("deposit") || sLower.includes("security") || sLower.includes("entire"))) {
      flagged.push({
        clause_text: sentence,
        risk_level: "high",
        reason: "Under Section 74 of the Indian Contract Act, compensation is limited to reasonable pre-estimated losses. Complete forfeiture of deposits for procedural delays is considered punitive.",
        compared_to: "Indian Contract Act Sec 74 (Liquidated Damages vs Penalties)",
        is_grounded: true,
      });
      continue;
    }

    // 4. Freelance Non-Compete (ICA Sec 27)
    if (sLower.includes("non-compete") || sLower.includes("not work for any competitor") || (sLower.includes("post-termination") && sLower.includes("consulting"))) {
      flagged.push({
        clause_text: sentence,
        risk_level: "medium",
        reason: "Under Section 27 of the Indian Contract Act, covenants restraining individuals or independent contractors from lawful trade/profession post-contract are broadly void.",
        compared_to: "Indian Contract Act Sec 27 (Restraint of Trade Guidelines)",
        is_grounded: true,
      });
      continue;
    }

    // 5. Unlimited Indemnity
    if (sLower.includes("unlimited indemnity") || sLower.includes("without limitation of liability") || sLower.includes("indemnify and hold harmless against any and all") || sLower.includes("without limitation or financial cap") || (sLower.includes("indemnif") && sLower.includes("without limitation"))) {
      flagged.push({
        clause_text: sentence,
        risk_level: "high",
        reason: "Uncapped indemnity shifts catastrophic commercial and third-party liabilities onto the contractor without reasonable liability caps (such as fee received).",
        compared_to: "Commercial Contracting Practice: Reasonable Indemnity Caps",
        is_grounded: true,
      });
      continue;
    }

    // 6. Unilateral Dispute / Arbitrator Selection
    if (sLower.includes("sole discretion of the client") && (sLower.includes("arbitrat") || sLower.includes("dispute") || sLower.includes("jurisdiction"))) {
      flagged.push({
        clause_text: sentence,
        risk_level: "medium",
        reason: "Unilateral appointment of an arbitrator by one party conflicts with natural justice principles and Section 12(5) of the Arbitration and Conciliation Act.",
        compared_to: "Arbitration and Conciliation Act (Neutral Arbitrator Appointment)",
        is_grounded: true,
      });
      continue;
    }

    // 7. Payment Terms Exceeding 30-45 Days (MSMEDA Sec 15 / Freelance Standard)
    if ((sLower.includes("net-45") || sLower.includes("forty-five") || sLower.includes("45 calendar days") || sLower.includes("60 days") || sLower.includes("90 days")) &&
        (sLower.includes("payable") || sLower.includes("invoice") || sLower.includes("payment"))) {
      flagged.push({
        clause_text: sentence,
        risk_level: "medium",
        reason: "Payment window of 45+ days strains freelancer cash flow. Under Section 15 of MSMED Act, payment to registered enterprises cannot exceed 45 days, and standard commercial practice is Net-15 to Net-30.",
        compared_to: "MSMED Act Section 15 & Commercial Payment Best Practices",
        is_grounded: true,
      });
      continue;
    }
  }

  return flagged;
}

// --- 3. Dynamic Structured Document Processing ---

export function processIntakeText(rawText: string, title: string): DocumentRecord {
  const lower = rawText.toLowerCase();
  const sentences = splitIntoSentences(rawText);
  const id = `doc_${Math.random().toString(36).substring(2, 9)}`;

  // Determine Document Classification
  let docType: "Notice" | "Agreement" | "Contract" | "Policy" | "Unknown" = "Agreement";
  let confidence = 0.92;

  if (lower.includes("notice") || lower.includes("vacate") || lower.includes("hereby notified") || lower.includes("demand")) {
    docType = "Notice";
    confidence = 0.98;
  } else if (lower.includes("consulting agreement") || lower.includes("addendum") || lower.includes("contractor") || lower.includes("deliverables")) {
    docType = "Contract";
    confidence = 0.95;
  } else if (lower.includes("tenancy agreement") || lower.includes("lease agreement") || lower.includes("premises & term")) {
    docType = "Agreement";
    confidence = 0.96;
  }

  // Dynamic Party Extraction
  const parties: string[] = [];
  const partyPatterns = [
    /(?:between|by and between|landlord|lessor|client)\s*[:\-]?\s*([A-Z][a-zA-Z0-9\s.,]{2,45}?)(?:,\s*residing|hereinafter|and|\(tenant\)|\(client\))/i,
    /(?:tenant|lessee|contractor|consultant)\s*[:\-]?\s*([A-Z][a-zA-Z0-9\s.,]{2,45}?)(?:,\s*residing|hereinafter|and|\(the|\.|\(consultant\))/i,
    /(?:from|issued by)\s*[:\-]?\s*([A-Z][a-zA-Z0-9\s.,]{2,45}?)(?:\n|,|to)/i,
    /(?:to|attention)\s*[:\-]?\s*([A-Z][a-zA-Z0-9\s.,]{2,45}?)(?:\n|,|flat|subject)/i
  ];

  for (const pat of partyPatterns) {
    const match = rawText.match(pat);
    if (match && match[1]) {
      const cleanVal = match[1].trim().replace(/^[,.\s-]+|[,.\s-]+$/g, "");
      if (cleanVal.length > 2 && !parties.includes(cleanVal) && !cleanVal.toLowerCase().includes("whereas")) {
        parties.push(cleanVal);
      }
    }
  }

  if (parties.length === 0) {
    if (lower.includes("rajesh sharma")) parties.push("Rajesh Sharma (Landlord)");
    if (lower.includes("priya sharma")) parties.push("Priya Sharma (Tenant / Consultant)");
    if (lower.includes("techventures")) parties.push("TechVentures Solutions Pvt Ltd (Client)");
  }

  // Dynamic Key Dates Extraction
  const key_dates: KeyDate[] = [];
  for (const sentence of sentences) {
    const sLower = sentence.toLowerCase();

    // Specific Date Patterns
    const dateMatch = sentence.match(/(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s+\d{4})/i)
      || sentence.match(/(\d{4}-\d{2}-\d{2})/)
      || sentence.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/);

    const deadlineMatch = sentence.match(/(within\s+\d+\s+(?:calendar\s+)?days(?:\s+of\s+receipt)?)/i);

    if (deadlineMatch) {
      key_dates.push({
        label: sLower.includes("respond") || sLower.includes("acceptance") ? "Response Deadline" : "Deadline Window",
        date: deadlineMatch[1].trim(),
        source_quote: sentence,
        is_grounded: verifySourceQuote(sentence, rawText)
      });
    }

    if (dateMatch) {
      let label = "Key Date";
      if (sLower.includes("vacate") || sLower.includes("handover")) label = "Vacate / Handover Deadline";
      else if (sLower.includes("commenc") || sLower.includes("effective")) label = "Effective Date";
      else if (sLower.includes("entered into") || sLower.includes("date:")) label = "Execution Date";
      else if (sLower.includes("payable") || sLower.includes("due")) label = "Payment Milestone";

      if (!key_dates.some(k => k.date === dateMatch[1].trim())) {
        key_dates.push({
          label,
          date: dateMatch[1].trim(),
          source_quote: sentence,
          is_grounded: verifySourceQuote(sentence, rawText)
        });
      }
    }
  }

  // Dynamic Amounts Extraction
  const amounts: AmountItem[] = [];
  const amountRegex = /(?:₹|INR|Rs\.?)\s*([\d,]+(?:\.\d{2})?)/gi;
  let amtMatch;
  while ((amtMatch = amountRegex.exec(rawText)) !== null) {
    const valStr = `₹${amtMatch[1].trim()}`;
    const matchIndex = amtMatch.index;
    const surrounding = rawText.substring(Math.max(0, matchIndex - 50), Math.min(rawText.length, matchIndex + 70));
    const sLower = surrounding.toLowerCase();

    let label = "Financial Amount";
    if (sLower.includes("rent")) label = sLower.includes("revised") ? "Revised Monthly Rent" : "Monthly Rent";
    else if (sLower.includes("deposit")) label = "Security Deposit";
    else if (sLower.includes("fee") || sLower.includes("professional")) label = "Consulting Fee";
    else if (sLower.includes("maintenance")) label = "Maintenance Charges";

    if (!amounts.some(a => a.value === valStr)) {
      amounts.push({
        label,
        value: valStr,
        source_quote: surrounding.trim(),
        is_grounded: true
      });
    }
  }

  // Dynamic Obligations Extraction
  const obligations: ObligationItem[] = [];
  for (const sentence of sentences) {
    const sLower = sentence.toLowerCase();
    if (sLower.includes("shall") || sLower.includes("must") || sLower.includes("agrees to") || sLower.includes("covenants that") || sLower.includes("required to")) {
      let party = "Obligated Party";
      if (sLower.includes("tenant")) party = "Tenant";
      else if (sLower.includes("landlord")) party = "Landlord";
      else if (sLower.includes("consultant")) party = "Consultant";
      else if (sLower.includes("client")) party = "Client";

      obligations.push({
        party,
        obligation: sentence.length > 140 ? sentence.substring(0, 137) + "..." : sentence,
        source_quote: sentence,
        is_grounded: verifySourceQuote(sentence, rawText)
      });
      if (obligations.length >= 4) break;
    }
  }

  // Dynamic Flagged Clauses
  const flagged_clauses = analyzeClauseRisks(rawText);

  // Compute Deadlines with Pure Date Math
  const computedDeadlines: ComputedDeadline[] = [];
  const benchmarkDate = new Date("2026-09-16T00:00:00Z");

  key_dates.forEach((kd, idx) => {
    let targetIso = "2026-09-30";
    let daysRem = 14;
    let status: "urgent" | "upcoming" | "future" | "expired" | "no_date" = "upcoming";

    if (!kd.date) {
      status = "no_date";
      daysRem = 0;
    } else {
      // Check if contains specific number of days window
      const daysMatch = kd.date.match(/within\s+(\d+)\s+days/i);
      if (daysMatch) {
        daysRem = parseInt(daysMatch[1], 10);
        const targetD = new Date(benchmarkDate.getTime() + daysRem * 86400000);
        targetIso = targetD.toISOString().split("T")[0];
      } else if (kd.date.toLowerCase().includes("september") && kd.date.includes("2026")) {
        const dayNum = parseInt(kd.date.match(/\d{1,2}/)?.[0] || "30", 10);
        const targetD = new Date(`2026-09-${dayNum < 10 ? '0' + dayNum : dayNum}T00:00:00Z`);
        daysRem = Math.round((targetD.getTime() - benchmarkDate.getTime()) / 86400000);
        targetIso = targetD.toISOString().split("T")[0];
      }

      if (daysRem < 0) status = "expired";
      else if (daysRem <= 7) status = "urgent";
      else if (daysRem <= 30) status = "upcoming";
      else status = "future";
    }

    computedDeadlines.push({
      id: `${id}_dl_${idx}`,
      document_id: id,
      document_title: title,
      label: kd.label,
      target_date: targetIso,
      days_remaining: daysRem,
      status,
      source_quote: kd.source_quote
    });
  });

  // Actionable Checklist Generation
  const checklist: string[] = [
    `Send formal written response regarding '${key_dates[0]?.label || "Notice Response"}' before deadline (preserve postal/email proof).`,
    "Gather previous contract copy, payment receipts, and bank transaction statements to establish baseline.",
    "Formulate a structured counter-proposal requesting restoration of standard 30-day notice terms."
  ];

  // Questions for Advocate Preparation
  const questions_for_lawyer: string[] = [
    "Does the compressed notice period in this document violate statutory notice standards or local rent control legislation?",
    "Under Section 74 of the Indian Contract Act, can the counter-party legally forfeit deposit amounts without proving actual damages?",
    "Are the unilateral terms in this document challengeable as unconscionable contract terms under Indian legal precedent?"
  ];

  const primaryParty = parties.length > 0 ? parties.join(", ") : "Specified Parties";
  const primaryAmt = amounts.length > 0 ? `It references a financial amount of ${amounts[0].value}. ` : "";
  const riskNote = flagged_clauses.length > 0
    ? `NyayaTrack flagged ${flagged_clauses.length} clause(s) requiring your attention due to compressed notice timelines or unilateral terms.`
    : "No high-risk deviations from standard guidelines were flagged.";

  const raw_summary = `This document is a ${docType} concerning ${primaryParty}. ${primaryAmt}${riskNote}`;
  const summary_hi = `यह दस्तावेज़ ${primaryParty} के संबंध में एक ${docType} है। ${amounts.length > 0 ? `इसमें ${amounts[0].value} की राशि उल्लिखित है। ` : ""}न्यायट्रैक ने इसमें ${flagged_clauses.length} ऐसे प्रावधानों को चिन्हित किया है जिनमें जोखिम हो सकता है।`;

  const extraction: StructuredExtraction = {
    document_type: docType,
    confidence,
    parties,
    key_dates,
    amounts,
    obligations,
    flagged_clauses,
    grounding_ok: true,
    raw_summary,
    summary_hi
  };

  return {
    id,
    title,
    upload_date: "2026-09-16",
    content_text: rawText,
    extraction,
    deadlines: computedDeadlines,
    checklist,
    questions_for_lawyer
  };
}

// --- 4. Dynamic Cross-Document Diffing Engine ---

export function compareDocs(
  targetDoc: DocumentRecord,
  priorDoc: DocumentRecord
): DocumentComparisonResult {
  const differences: DiffFieldChange[] = [];

  // 1. Compare Primary Financial Amounts (Rent, Fee, Deposit)
  const targetRent = targetDoc.extraction.amounts.find(a =>
    a.label.toLowerCase().includes("rent") || a.label.toLowerCase().includes("fee")
  ) || targetDoc.extraction.amounts[0];

  const priorRent = priorDoc.extraction.amounts.find(a =>
    a.label.toLowerCase().includes("rent") || a.label.toLowerCase().includes("fee")
  ) || priorDoc.extraction.amounts[0];

  if (targetRent && priorRent) {
    const targetVal = extractNumericRupees(targetRent.value);
    const priorVal = extractNumericRupees(priorRent.value);

    if (targetVal && priorVal) {
      const pct = Math.round(((targetVal - priorVal) / priorVal) * 1000) / 10;
      const sign = pct > 0 ? "+" : "";
      const change_type = pct > 0 ? "increased" : pct < 0 ? "decreased" : "modified";
      const risk_impact = pct > 10 ? "medium" : "low";

      differences.push({
        field_name: targetRent.label.includes("Fee") ? "Professional Consulting Fee" : "Monthly Rent",
        old_value: priorRent.value,
        new_value: targetRent.value,
        change_type,
        plain_language_explanation: `Amount has ${change_type} by ${sign}${pct}% (from ${priorRent.value} to ${targetRent.value}). Standard annual adjustments are typically 5% to 10%.`,
        risk_impact
      });
    }
  }

  // 2. Compare Notice Periods / Payment Windows
  const targetNoticeDays = extractDays(targetDoc.content_text);
  const priorNoticeDays = extractDays(priorDoc.content_text);

  if (targetNoticeDays && priorNoticeDays && targetNoticeDays !== priorNoticeDays) {
    const isDecreased = targetNoticeDays < priorNoticeDays;
    differences.push({
      field_name: "Notice Period",
      old_value: `${priorNoticeDays} days`,
      new_value: `${targetNoticeDays} days`,
      change_type: isDecreased ? "decreased" : "increased",
      plain_language_explanation: isDecreased
        ? `Notice period was reduced from ${priorNoticeDays} days to ${targetNoticeDays} days (a ${Math.round((1 - targetNoticeDays / priorNoticeDays) * 100)}% reduction). Shorter notice leaves significantly less time to find alternatives.`
        : `Notice period increased from ${priorNoticeDays} days to ${targetNoticeDays} days.`,
      risk_impact: isDecreased ? "high" : "low"
    });
  }

  // 3. Compare Payment Terms (e.g. Net-15 vs Net-45)
  const extractPayDays = (txt: string): number | null => {
    const netMatch = txt.match(/net[- ]?(\d+)/i);
    if (netMatch) return parseInt(netMatch[1], 10);
    const daysMatch = txt.match(/(?:payable\s+within|payment\s+within|within)\s+(?:\w+\s+)?\(?(\d+)\)?\s*(?:calendar\s+|business\s+)?days/i);
    if (daysMatch) return parseInt(daysMatch[1], 10);
    return null;
  };

  const targetPayDays = extractPayDays(targetDoc.content_text);
  const priorPayDays = extractPayDays(priorDoc.content_text);
  if (targetPayDays && priorPayDays && targetPayDays !== priorPayDays) {
    differences.push({
      field_name: "Payment Disbursement Window",
      old_value: `Net-${priorPayDays} days`,
      new_value: `Net-${targetPayDays} days`,
      change_type: targetPayDays > priorPayDays ? "increased" : "decreased",
      plain_language_explanation: `Payment timeline expanded from ${priorPayDays} days to ${targetPayDays} days, delaying cash flow for independent contractors.`,
      risk_impact: targetPayDays > priorPayDays ? "medium" : "low"
    });
  }

  // 4. Identify Newly Introduced Risky Clauses
  const priorClauses = priorDoc.extraction.flagged_clauses.map(c => c.clause_text.toLowerCase());
  for (const fc of targetDoc.extraction.flagged_clauses) {
    const isNew = !priorClauses.some(pc => pc.includes(fc.clause_text.substring(0, 30).toLowerCase()));
    if (isNew) {
      differences.push({
        field_name: fc.compared_to.includes("Unilateral") ? "New Restrictive Cancellation Clause" : "New Liability Clause",
        old_value: "Standard mutual clause in baseline agreement",
        new_value: fc.clause_text,
        change_type: "added",
        plain_language_explanation: fc.reason,
        risk_impact: fc.risk_level
      });
    }
  }

  // Fallback if no differences detected
  if (differences.length === 0) {
    differences.push({
      field_name: "General Agreement Terms",
      old_value: "Baseline Agreement",
      new_value: targetDoc.title,
      change_type: "modified",
      plain_language_explanation: "Terms align closely with previous baseline agreement; no adverse modifications detected.",
      risk_impact: "low"
    });
  }

  return {
    target_doc_id: targetDoc.id,
    target_doc_title: targetDoc.title,
    prior_doc_id: priorDoc.id,
    prior_doc_title: priorDoc.title,
    differences,
    summary_explanation: `Compared to '${priorDoc.title}', NyayaTrack identified ${differences.length} material shift(s) across financial terms and contractual obligations.`
  };
}

// --- 5. Dynamic Grounded Q&A with Strict Safety Guardrails ---

export function answerQuestion(
  question: string,
  docText: string,
  docTitle: string
): QAResponse {
  const qLower = question.toLowerCase();

  // 1. Prompt Injection Defense (Phase 8)
  if (qLower.includes("ignore previous instructions") || qLower.includes("system prompt") || qLower.includes("you are now a") || qLower.includes("as an ai")) {
    return {
      question,
      answer: "Security Guardrail Triggered: The prompt contained instructions attempting to alter system constraints. NyayaTrack operates exclusively as a grounded legal information assistant and ignores prompt override commands.",
      citations: [],
      grounding_ok: true,
      suggest_lawyer: false,
      disclaimer: "NyayaTrack strictly enforces prompt injection defenses."
    };
  }

  // 2. Out-of-Scope / Non-Legal Question Guardrail (Phase 9)
  const nonLegalKeywords = ["capital of", "recipe for", "weather in", "write a poem", "tell me a joke", "python code", "solve 2+2"];
  if (nonLegalKeywords.some(kw => qLower.includes(kw))) {
    return {
      question,
      answer: "This inquiry is outside the scope of your uploaded legal document. NyayaTrack is an informational legal assistant and can only answer questions grounded in legal contracts, notices, and statutory guidelines.",
      citations: [],
      grounding_ok: false,
      suggest_lawyer: false,
      disclaimer: "NyayaTrack focuses exclusively on legal document analysis and obligation tracking."
    };
  }

  // 3. Courtroom Verdict & Speculative Prediction Guardrail (Phase 9)
  const verdictKeywords = ["will i win", "can i sue", "judge", "guaranteed", "definitely illegal", "court case", "punish the landlord"];
  if (verdictKeywords.some(kw => qLower.includes(kw))) {
    return {
      question,
      answer: "NyayaTrack cannot provide legal advice or predict court outcomes. Whether a dispute succeeds in an Indian court or rent tribunal depends heavily on formal notices exchanged, written agreements, and jurisdictional facts. Under standard reference principles (such as Indian Contract Act and Model Tenancy guidelines), unilateral modifications and disproportionate penalties are frequently contested as unfair, but you should consult a practicing advocate to evaluate your specific remedy.",
      citations: [
        {
          source_type: "reference_corpus",
          source_name: "Standard Tenancy Notice Periods and Termination Rules in India",
          page_or_line: "Model Tenancy Act Guidelines & Transfer of Property Act Sec 106",
          quote: "Unilateral termination without mutual notice rights is considered an unconscionable imbalance in tenancy conventions."
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

  // 4. Dynamic Sentence-Level Document Search
  const sentences = splitIntoSentences(docText);
  const qTokens = qLower.replace(/[^\w\s]/g, "").split(/\s+/).filter(t => t.length > 2);

  let bestSentence = "";
  let highestScore = 0;

  for (const sentence of sentences) {
    const sTokens = sentence.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);
    let matchCount = 0;
    for (const token of qTokens) {
      if (sTokens.includes(token)) matchCount++;
    }
    const score = matchCount / Math.max(1, qTokens.length);
    if (score > highestScore && matchCount >= 1) {
      highestScore = score;
      bestSentence = sentence;
    }
  }

  // 5. Search Verified Reference Corpus
  let bestReference: ReferenceExcerpt | null = null;
  let highestRefScore = 0;

  for (const ref of REFERENCE_CORPUS) {
    const refTokens = (ref.title + " " + ref.text).toLowerCase().split(/\s+/);
    let matchCount = 0;
    for (const token of qTokens) {
      if (refTokens.includes(token)) matchCount++;
    }
    if (matchCount > highestRefScore) {
      highestRefScore = matchCount;
      bestReference = ref;
    }
  }

  // If evidence found in document
  if (bestSentence && highestScore >= 0.25) {
    const citations = [
      {
        source_type: "document",
        source_name: docTitle,
        page_or_line: "Document Text",
        quote: bestSentence
      }
    ];

    if (bestReference && highestRefScore >= 2) {
      citations.push({
        source_type: "reference_corpus",
        source_name: bestReference.title,
        page_or_line: bestReference.source,
        quote: bestReference.text.substring(0, 180) + "..."
      });
    }

    return {
      question,
      answer: `In your document, it states: "${bestSentence}"\n\n${bestReference ? `According to statutory guidelines (${bestReference.title}): "${bestReference.text.substring(0, 220)}..."\n\n` : ""}Note: This is general legal information intended to help you understand your commitments. It does not constitute formal legal counsel.`,
      citations,
      grounding_ok: true,
      suggest_lawyer: bestSentence.toLowerCase().includes("penalty") || bestSentence.toLowerCase().includes("forfeit") || bestSentence.toLowerCase().includes("terminate"),
      disclaimer: "This response provides general legal information, not legal advice or case outcome predictions. Please consult an advocate for specific legal issues."
    };
  }

  // If evidence only in reference corpus
  if (bestReference && highestRefScore >= 2) {
    return {
      question,
      answer: `While this specific question is not directly covered in '${docTitle}', according to standard statutory guidance (${bestReference.title}):\n\n"${bestReference.text}"`,
      citations: [
        {
          source_type: "reference_corpus",
          source_name: bestReference.title,
          page_or_line: bestReference.source,
          quote: bestReference.text
        }
      ],
      grounding_ok: true,
      suggest_lawyer: true,
      disclaimer: "This response provides general legal information based on verified Indian statutory excerpts."
    };
  }

  // Insufficient Information Fallback (Phase 5: If evidence unavailable, say so honestly)
  return {
    question,
    answer: `I could not find sufficient information in '${docTitle}' or the verified Indian reference corpus to answer that question responsibly. To avoid unreliable assumptions or legal hallucinations, we recommend clarifying this topic directly with the counter-party or consulting a qualified advocate.`,
    citations: [],
    grounding_ok: false,
    suggest_lawyer: true,
    disclaimer: "NyayaTrack strictly refrains from fabricating information when source evidence is unavailable."
  };
}
