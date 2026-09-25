import { NextResponse } from "next/server";
import { processIntakeText } from "@/lib/engine";
import { saveDocument } from "@/lib/store";
import { extractText } from "unpdf";
import { getGeminiApiKey, generateAiSummaryAndHindi, extractStructuredFieldsWithGemini, sanitizeDocumentContent } from "@/lib/ai";

const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".txt", ".md"];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const title = (formData.get("title") as string) || "Uploaded Document";
    let rawText = (formData.get("raw_text") as string) || "";
    const customApiKey = (formData.get("api_key") as string) || request.headers.get("x-gemini-key") || undefined;

    const file = formData.get("file") as File | null;
    let originalFilename: string | undefined = undefined;

    if (file && !rawText) {
      originalFilename = file.name;
      const fileName = (file.name || "").toLowerCase();
      const fileType = file.type || "";

      // Validate allowed file types (SEC-3 defense)
      const hasAllowedExt = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
      if (!hasAllowedExt && fileType && !fileType.startsWith("text/") && !fileType.startsWith("application/pdf") && !fileType.startsWith("image/")) {
        return NextResponse.json(
          { detail: "Unsupported file type. Please upload a PDF, image (.png, .jpg, .webp), or text document." },
          { status: 400 }
        );
      }

      if (fileType.includes("pdf") || fileName.endsWith(".pdf")) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdfResult = await extractText(new Uint8Array(arrayBuffer));
          rawText = Array.isArray(pdfResult.text) ? pdfResult.text.join("\n") : (pdfResult.text || "");
        } catch (pdfErr) {
          console.error("PDF parsing error:", pdfErr);
          return NextResponse.json(
            { detail: "Failed to extract text from PDF. The document may be password-protected or contain only scanned images." },
            { status: 400 }
          );
        }
      } else {
        rawText = await file.text();
      }
    }

    if (!rawText || rawText.trim().length < 10) {
      return NextResponse.json(
        { detail: "Please provide valid text or a legible document with readable text." },
        { status: 400 }
      );
    }

    // Sanitize document text before processing to neutralize injection attempts
    const sanitizedText = sanitizeDocumentContent(rawText);

    // Initial baseline extraction
    const docRecord = processIntakeText(sanitizedText, title);
    if (originalFilename) {
      docRecord.filename = originalFilename;
    }

    // Gemini-powered structured extraction & bilingual summary enrichment if API key available
    const apiKey = getGeminiApiKey(customApiKey);
    if (apiKey) {
      try {
        // 1. LLM Structured Entity Extraction with strict anti-hallucination quote check
        const aiExtracted = await extractStructuredFieldsWithGemini(
          sanitizedText,
          docRecord.extraction.document_type,
          apiKey
        );
        if (aiExtracted) {
          if (aiExtracted.parties && aiExtracted.parties.length > 0) {
            docRecord.extraction.parties = aiExtracted.parties;
          }
          if (aiExtracted.amounts && aiExtracted.amounts.length > 0) {
            // Keep verified AI amounts alongside any unique deterministic ones
            docRecord.extraction.amounts = aiExtracted.amounts;
          }
          if (aiExtracted.key_dates && aiExtracted.key_dates.length > 0) {
            docRecord.extraction.key_dates = aiExtracted.key_dates;
          }
          if (aiExtracted.obligations && aiExtracted.obligations.length > 0) {
            docRecord.extraction.obligations = aiExtracted.obligations;
          }
        }

        // 2. High-fidelity bilingual summary and Hindi translation
        const aiResult = await generateAiSummaryAndHindi(
          title,
          docRecord.extraction.document_type,
          sanitizedText,
          docRecord.extraction.parties,
          docRecord.extraction.amounts,
          apiKey
        );
        if (aiResult) {
          if (aiResult.summary_en) docRecord.extraction.raw_summary = aiResult.summary_en;
          if (aiResult.summary_hi) docRecord.extraction.summary_hi = aiResult.summary_hi;
        }
      } catch (aiErr) {
        console.warn("AI extraction/summary generation error:", aiErr);
      }
    }

    saveDocument(docRecord);

    return NextResponse.json(docRecord);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to intake document";
    return NextResponse.json(
      { detail: errorMsg },
      { status: 500 }
    );
  }
}
