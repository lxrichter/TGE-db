import { NextResponse } from "next/server";
import { getPostgresPreviewSummary } from "@/lib/postgres-preview";

export async function GET() {
  try {
    const summary = await getPostgresPreviewSummary();
    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("PostgreSQL preview summary error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load PostgreSQL preview summary." },
      { status: 500 }
    );
  }
}
