import { NextResponse } from "next/server";
import { getDocumentById } from "@/lib/store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = getDocumentById(id);
  if (!doc) {
    return NextResponse.json({ detail: "Document not found" }, { status: 404 });
  }
  return NextResponse.json(doc);
}
