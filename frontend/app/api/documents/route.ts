import { NextResponse } from "next/server";
import { getDocuments } from "@/lib/store";

export async function GET() {
  const docs = getDocuments();
  return NextResponse.json(docs);
}
