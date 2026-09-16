import { NextResponse } from "next/server";
import { getDocumentById } from "@/lib/store";
import { answerQuestion } from "@/lib/engine";

export async function POST(request: Request) {
  try {
    const { document_id, question } = await request.json();
    const doc = getDocumentById(document_id);

    if (!doc) {
      return NextResponse.json(
        { detail: "Document not found" },
        { status: 404 }
      );
    }

    const qaResponse = answerQuestion(question, doc.content_text, doc.title);
    return NextResponse.json(qaResponse);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to process Q&A";
    return NextResponse.json(
      { detail: errorMsg },
      { status: 500 }
    );
  }
}
