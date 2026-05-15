import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();

    const plants = await db.all(`
      SELECT
        plant_id,
        plant_name,
        country
      FROM plants
      ORDER BY plant_name ASC
    `);

    return NextResponse.json(plants);
  } catch (error) {
    console.error("GET /api/plants/options error:", error);

    return NextResponse.json(
      { error: "Failed to fetch plant options" },
      { status: 500 }
    );
  }
}