import { NextResponse } from "next/server";
import { listPostgresPreviewCompanies } from "@/lib/postgres-preview";

export async function GET() {
  try {
    const companies = await listPostgresPreviewCompanies();
    return NextResponse.json({ success: true, companies });
  } catch (error) {
    console.error("PostgreSQL preview companies error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load PostgreSQL preview companies." },
      { status: 500 }
    );
  }
}
