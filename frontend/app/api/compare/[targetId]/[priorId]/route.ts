import { NextResponse } from "next/server";
import { getDocumentById } from "@/lib/store";
import { compareDocs } from "@/lib/engine";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ targetId: string; priorId: string }> }
) {
  const { targetId, priorId } = await params;
  const target = getDocumentById(targetId);
  const prior = getDocumentById(priorId);

  if (!target || !prior) {
    return NextResponse.json(
      { detail: "One or both documents not found for comparison" },
      { status: 404 }
    );
  }

  const result = compareDocs(target, prior);
  return NextResponse.json(result);
}
