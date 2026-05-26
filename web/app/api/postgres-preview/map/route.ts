import { NextRequest, NextResponse } from "next/server";
import { listPostgresPreviewMapGroups } from "@/lib/postgres-preview";

export const dynamic = "force-dynamic";

function cleanParam(value: string | null) {
  return value?.trim() || undefined;
}

export async function GET(request: NextRequest) {
  try {
    const data = await listPostgresPreviewMapGroups({
      country: cleanParam(request.nextUrl.searchParams.get("country")),
      tgeRegion: cleanParam(request.nextUrl.searchParams.get("tge_region")),
      wbRegion: cleanParam(request.nextUrl.searchParams.get("wb_region")),
    });

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
