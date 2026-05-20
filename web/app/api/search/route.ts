import { NextRequest, NextResponse } from "next/server";
import { searchGlobalRecords } from "@/lib/services/global-search";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") || "";
  const limitParam = Number(request.nextUrl.searchParams.get("limit") || 12);
  const limit = Number.isFinite(limitParam) ? limitParam : 12;

  try {
    const results = await searchGlobalRecords({ query, limit });

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Global PostgreSQL search error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search PostgreSQL staging records." },
      { status: 500 }
    );
  }
}
