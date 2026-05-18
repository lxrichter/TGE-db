import { NextResponse } from "next/server";
import { listSources } from "@/lib/services/sources";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = Number(searchParams.get("limit") || 50);

    const sources = await listSources({
      limit: Number.isFinite(limitParam) ? limitParam : 50,
      search: searchParams.get("search") || undefined,
      sourceType: searchParams.get("sourceType") || undefined,
      visibility: searchParams.get("visibility") || undefined,
      status: searchParams.get("status") || undefined,
    });

    return NextResponse.json({ success: true, sources });
  } catch (error) {
    console.error("PostgreSQL sources list error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load PostgreSQL sources." },
      { status: 500 }
    );
  }
}
