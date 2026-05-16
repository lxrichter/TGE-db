import { NextResponse } from "next/server";
import { listPostgresPreviewOperatingAssets } from "@/lib/postgres-preview";

export async function GET() {
  try {
    const operatingAssets = await listPostgresPreviewOperatingAssets();
    return NextResponse.json({ success: true, operatingAssets });
  } catch (error) {
    console.error("PostgreSQL preview operating assets error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load PostgreSQL preview operating assets.",
      },
      { status: 500 }
    );
  }
}
