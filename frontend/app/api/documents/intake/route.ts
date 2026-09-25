import { NextResponse } from "next/server";
import { processIntakeText } from "@/lib/engine";
import { saveDocument } from "@/lib/store";
import { extractText } from "unpdf";
import { getGeminiApiKey, generateAiSummaryAndHindi } from "@/lib/ai";

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

    const docRecord = processIntakeText(rawText, title);
    if (originalFilename) {
      docRecord.filename = originalFilename;
    }

    // Attempt Gemini-powered bilingual summary enrichment if API key available
    const apiKey = getGeminiApiKey(customApiKey);
    if (apiKey) {
      try {
        const aiResult = await generateAiSummaryAndHindi(
          title,
          docRecord.extraction.document_type,
          rawText,
          docRecord.extraction.parties,
          docRecord.extraction.amounts,
          apiKey
        );
        if (aiResult) {
          if (aiResult.summary_en) docRecord.extraction.raw_summary = aiResult.summary_en;
          if (aiResult.summary_hi) docRecord.extraction.summary_hi = aiResult.summary_hi;
        }
      } catch (aiErr) {
        console.warn("AI summary generation error:", aiErr);
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
