import { NextResponse } from "next/server";
import { canViewInternalRecords } from "@/lib/auth/roles";
import { searchTgeArticles } from "@/lib/services/tge-articles";
import { getCurrentSourceUser } from "@/lib/sources/source-api";

export async function GET(req: Request) {
  try {
    const user = await getCurrentSourceUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    if (!canViewInternalRecords(user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limitParam = Number(searchParams.get("limit") || 8);
    const articles = await searchTgeArticles({
      search: searchParams.get("search"),
      limit: Number.isFinite(limitParam) ? limitParam : 8,
    });

    return NextResponse.json({ success: true, articles });
  } catch (error) {
    console.error("ThinkGeoEnergy article search error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search ThinkGeoEnergy articles." },
      { status: 500 }
    );
  }
}
