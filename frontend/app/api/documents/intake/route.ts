import { NextResponse } from "next/server";
import { processIntakeText } from "@/lib/engine";
import { saveDocument } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const title = (formData.get("title") as string) || "Uploaded Document";
    let rawText = (formData.get("raw_text") as string) || "";

    const file = formData.get("file") as File | null;
    if (file && !rawText) {
      rawText = await file.text();
    }

    if (!rawText || rawText.trim().length < 10) {
      return NextResponse.json(
        { detail: "Please provide valid text or a legible document." },
        { status: 400 }
      );
    }

    const docRecord = processIntakeText(rawText, title);
    saveDocument(docRecord);

    return NextResponse.json(docRecord);
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || "Failed to intake document" },
      { status: 500 }
    );
  }
}
