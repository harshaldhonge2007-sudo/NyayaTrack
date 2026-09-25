import { GoogleGenerativeAI } from "@google/generative-ai";
import { QACitation, QAResponse, StructuredExtraction, KeyDate, AmountItem, ObligationItem, DocumentType } from "./types";
import { verifySourceQuote } from "./engine";

// Multi-Tier Prompt Injection Patterns
const INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions/i,
  /system\s+prompt/i,
  /you\s+are\s+now\s+(?:a|an)\b/i,
  /as\s+an\s+ai\b/i,
  /disregard\s+(?:safety|rules|constraints)/i,
  /developer\s+mode/i,
  /roleplay\s+as/i,
  /dan\s+mode/i,
  /bypass\s+filter/i,
];

// Non-Legal Query Keywords
const NON_LEGAL_PATTERNS = [
  /\bcapital\s+of\b/i,
  /\brecipe\s+for\b/i,
  /\bweather\s+in\b/i,
  /\bwrite\s+a\s+(?:poem|story|song|joke)\b/i,
  /\bpython\s+code\b/i,
  /\bsolve\s+\d+\s*[\+\-\*\/]\s*\d+\b/i,
];

// Speculative Prediction & Court Outcome Patterns
const VERDICT_PATTERNS = [
  /\bwill\s+i\s+win\b/i,
  /\bcan\s+i\s+sue\b/i,
  /\bwill\s+(?:the\s+)?judge\b/i,
  /\bguaranteed\b/i,
  /\bdefinitely\s+illegal\b/i,
  /\bpunish\s+the\s+(?:landlord|client)\b/i,
  /\bwin\s+in\s+court\b/i,
];

/**
 * Sanitizes document and prompt content to neutralize adversarial injection attempts.
 */
export function sanitizeDocumentContent(text: string): string {
  if (!text) return "";
  const filterList = [
    /ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions/gi,
    /you\s+are\s+now\s+(?:a|an)\b/gi,
    /system\s+prompt/gi,
    /disregard\s+(?:safety|rules|constraints)/gi,
    /developer\s+mode/gi,
    /dan\s+mode/gi,
    /bypass\s+filter/gi,
    /roleplay\s+as/gi,
    /as\s+an\s+ai\b/gi,
  ];
  let sanitized = text;
  filterList.forEach((pat) => {
    sanitized = sanitized.replace(pat, "[CONTENT_FILTERED]");
  });
  return sanitized;
}

/**
 * Helper to enforce API timeout and prevent indefinite hanging.
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs = 8000): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Gemini API request timed out")), timeoutMs)
  );
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Checks whether a Gemini API key is configured.
 */
export function getGeminiApiKey(customKey?: string): string | null {
  if (customKey && customKey.trim().length > 10 && !customKey.includes("your_")) {
    return customKey.trim();
  }
  const envKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (envKey && envKey.trim().length > 10 && !envKey.includes("your_")) {
    return envKey.trim();
  }
  return null;
}

/**
 * Evaluates whether an inquiry is an adversarial prompt injection.
 */
export function detectPromptInjection(query: string): boolean {
  return INJECTION_PATTERNS.some(pat => pat.test(query));
}

/**
 * Evaluates whether an inquiry is outside legal scope.
 */
export function detectNonLegalQuery(query: string): boolean {
  return NON_LEGAL_PATTERNS.some(pat => pat.test(query));
}

/**
 * Evaluates whether the user is asking for courtroom verdict predictions.
 */
export function detectCourtroomPrediction(query: string): boolean {
  return VERDICT_PATTERNS.some(pat => pat.test(query));
}

/**
 * Generates an AI-synthesized, strictly grounded response using Google Gemini 1.5 Flash.
 */
export async function synthesizeGroundedAnswerWithGemini(
  question: string,
  docText: string,
  docTitle: string,
  relevantCitations: QACitation[],
  apiKey: string
): Promise<QAResponse | null> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1, // Low temperature for factual precision
        maxOutputTokens: 800,
      }
    });

    const citationsContext = relevantCitations
      .map(c => `[Source: ${c.source_name} | Type: ${c.source_type} | Section: ${c.page_or_line || "General"}]\n"${c.quote}"`)
      .join("\n\n");

    const sanitizedDoc = sanitizeDocumentContent(docText);

    const prompt = `You are NyayaTrack's AI Legal Accessibility Copilot. Your mission is to make legal contracts, notices, and Indian statutory rights clear, accessible, and actionable for regular citizens (tenants, gig workers, freelancers).

DOCUMENT TITLE: "${docTitle}"

RELEVANT EXCERPTS FROM DOCUMENT & VERIFIED INDIAN STATUTORY GUIDELINES:
${citationsContext || "No direct snippet retrieved."}

FULL DOCUMENT CONTENT (FOR CONTEXT):
${sanitizedDoc.substring(0, 4000)}

USER QUESTION:
"${question}"

STRICT GUIDELINES:
1. GROUNDING & ANTI-HALLUCINATION: Base your answer strictly on the document text and statutory citations provided above. Do NOT invent clauses, fees, or judicial rulings.
2. PLAIN-LANGUAGE EXPLANATION: Explain the legal implications in simple, accessible language. Clarify any legal jargon.
3. CITATIONS: Explicitly cite which clause, notice deadline, or statutory standard (e.g. Model Tenancy Act, Indian Contract Act Sec 27/74, Transfer of Property Act Sec 106, MSMED Act Sec 15) supports your explanation.
4. LEGAL BOUNDARY: Clearly state that this is informational guidance, not legal advice or court predictions.
5. ACTIONABLE NEXT STEP: Give the user 1 or 2 practical, sensible steps they can take (e.g. reply in writing before the deadline, request written clarification, preserve bank records).
6. IF UNCERTAIN: If the document doesn't mention the topic, explicitly state that it is not covered and suggest consulting an advocate.

Write a clear, well-structured response (under 250 words).`;

    const result = await withTimeout(model.generateContent(prompt));
    const response = await result.response;
    const answerText = response.text().trim();

    const suggestLawyer =
      answerText.toLowerCase().includes("advocate") ||
      answerText.toLowerCase().includes("penalty") ||
      answerText.toLowerCase().includes("forfeit") ||
      answerText.toLowerCase().includes("termination") ||
      answerText.toLowerCase().includes("dispute");

    return {
      question,
      answer: answerText,
      citations: relevantCitations,
      grounding_ok: true,
      suggest_lawyer: suggestLawyer,
      disclaimer: "NyayaTrack provides informational legal guidance powered by Google Gemini 1.5 Flash grounded in your document. It does not constitute formal legal counsel.",
      ai_synthesized: true,
      model_used: "Gemini 1.5 Flash",
    };
  } catch (error) {
    console.error("Gemini Q&A synthesis error:", error);
    return null;
  }
}

/**
 * Generates plain-language executive summary and fluent Devanagari Hindi translation via Gemini.
 */
export async function generateAiSummaryAndHindi(
  docTitle: string,
  docType: string,
  docText: string,
  parties: string[],
  amounts: { label: string; value: string }[],
  apiKey: string
): Promise<{ summary_en: string; summary_hi: string } | null> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 600,
      }
    });

    const sanitizedDoc = sanitizeDocumentContent(docText);

    const prompt = `You are a bilingual legal accessibility expert in India. Analyze this ${docType} titled "${docTitle}".
Parties: ${parties.join(", ") || "Unspecified"}
Financial Amounts: ${amounts.map(a => `${a.label}: ${a.value}`).join(", ") || "None"}

Document Content:
${sanitizedDoc.substring(0, 3000)}

TASK:
1. Provide a concise 2-sentence plain-English summary explaining what this document is, the primary obligations, and any noteworthy risks.
2. Provide a natural, high-fidelity Devanagari Hindi translation (हिन्दी सारांश) of the summary that ordinary Indian citizens can easily understand.

Format output strictly as JSON:
{
  "summary_en": "...",
  "summary_hi": "..."
}`;

    const result = await withTimeout(model.generateContent(prompt));
    const response = await result.response;
    const rawText = response.text().trim();

    // Clean JSON markdown formatting if present
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary_en: parsed.summary_en || "",
        summary_hi: parsed.summary_hi || ""
      };
    }
    return null;
  } catch (err) {
    console.error("Gemini summary/Hindi error:", err);
    return null;
  }
}

/**
 * GenAI Structured Field Extraction via Gemini with verbatim grounding validation.
 */
export async function extractStructuredFieldsWithGemini(
  rawText: string,
  docType: DocumentType,
  apiKey: string
): Promise<{
  parties?: string[];
  amounts?: AmountItem[];
  key_dates?: KeyDate[];
  obligations?: ObligationItem[];
} | null> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1000,
      }
    });

    const sanitizedDoc = sanitizeDocumentContent(rawText);

    const prompt = `You are a legal document parsing AI for Indian tenancy and commercial contracts.
Analyze the document text below and extract structured fields.
CRITICAL RULE: For every extracted date, amount, and obligation, you MUST provide the exact, verbatim "source_quote" from the document.

DOCUMENT TEXT:
${sanitizedDoc.substring(0, 4000)}

Return strictly valid JSON:
{
  "parties": ["Name 1", "Name 2"],
  "amounts": [
    {"label": "Monthly Rent", "value": "₹29,500", "source_quote": "exact sentence from text"}
  ],
  "key_dates": [
    {"label": "Response Deadline", "date": "10 days", "source_quote": "exact sentence from text"}
  ],
  "obligations": [
    {"party": "Tenant", "obligation": "brief description", "source_quote": "exact sentence from text"}
  ]
}`;

    const result = await withTimeout(model.generateContent(prompt));
    const response = await result.response;
    const rawTextResp = response.text().trim();

    const jsonMatch = rawTextResp.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    // Anti-Hallucination Grounding Verification: Filter any item whose quote is not in rawText
    const verifiedAmounts: AmountItem[] = (parsed.amounts || []).filter((a: AmountItem) =>
      verifySourceQuote(a.source_quote || a.value || "", rawText)
    ).map((a: AmountItem) => ({ ...a, is_grounded: true }));

    const verifiedDates: KeyDate[] = (parsed.key_dates || []).filter((d: KeyDate) =>
      verifySourceQuote(d.source_quote || d.date || "", rawText)
    ).map((d: KeyDate) => ({ ...d, is_grounded: true }));

    const verifiedObligations: ObligationItem[] = (parsed.obligations || []).filter((o: ObligationItem) =>
      verifySourceQuote(o.source_quote || o.obligation || "", rawText)
    ).map((o: ObligationItem) => ({ ...o, is_grounded: true }));

    return {
      parties: Array.isArray(parsed.parties) ? parsed.parties.filter((p: unknown) => typeof p === "string" && p.length > 2) : [],
      amounts: verifiedAmounts,
      key_dates: verifiedDates,
      obligations: verifiedObligations
    };
  } catch (err) {
    console.warn("Gemini structured extraction error:", err);
    return null;
  }
}
