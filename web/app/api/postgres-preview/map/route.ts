import { NextResponse } from "next/server";
import { listPostgresPreviewMapGroups } from "@/lib/postgres-preview";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await listPostgresPreviewMapGroups();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PostgreSQL preview map error:", error);

    return NextResponse.json(
      {
        plants: [],
        projects: [],
        error: "Failed to load PostgreSQL preview map data",
      },
      { status: 500 }
    );
  }
}
