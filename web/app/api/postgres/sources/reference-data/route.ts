import { NextResponse } from "next/server";
import { getSourceReferenceData } from "@/lib/services/sources";

export async function GET() {
  try {
    const referenceData = await getSourceReferenceData();
    return NextResponse.json({ success: true, referenceData });
  } catch (error) {
    console.error("PostgreSQL source reference data error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load PostgreSQL source reference data." },
      { status: 500 }
    );
  }
}
