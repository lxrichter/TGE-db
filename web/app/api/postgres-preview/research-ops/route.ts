import { NextResponse } from "next/server";
import { getPostgresResearchOpsDashboard } from "@/lib/postgres-preview";

export async function GET() {
  try {
    const dashboard = await getPostgresResearchOpsDashboard(100);
    return NextResponse.json({ success: true, dashboard });
  } catch (error) {
    console.error("PostgreSQL research ops preview error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load PostgreSQL research ops preview." },
      { status: 500 }
    );
  }
}
