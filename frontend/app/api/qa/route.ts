import { NextResponse } from "next/server";
import { getDocumentById } from "@/lib/store";
import { answerQuestionWithAI } from "@/lib/engine";

export async function POST(request: Request) {
  try {
    const { document_id, question, api_key } = await request.json();
    const doc = getDocumentById(document_id);

    if (!doc) {
      return NextResponse.json(
        { detail: "Document not found" },
        { status: 404 }
      );
    }

    const headerApiKey = request.headers.get("x-gemini-key") || undefined;
    const customKey = api_key || headerApiKey;

    const qaResponse = await answerQuestionWithAI(
      question,
      doc.content_text,
      doc.title,
      customKey
    );

    return NextResponse.json(qaResponse);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to process Q&A";
    return NextResponse.json(
      { detail: errorMsg },
      { status: 500 }
    );
  }
}
