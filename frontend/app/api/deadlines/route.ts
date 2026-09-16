import { NextResponse } from "next/server";
import { getAllDeadlines } from "@/lib/store";

export async function GET() {
  const deadlines = getAllDeadlines();
  return NextResponse.json(deadlines);
}
