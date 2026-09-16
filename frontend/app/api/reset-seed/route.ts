import { NextResponse } from "next/server";
import { resetStore, getDocuments } from "@/lib/store";

export async function POST() {
  resetStore();
  return NextResponse.json({
    message: "Database reset to seeded state successfully",
    count: getDocuments().length
  });
}
