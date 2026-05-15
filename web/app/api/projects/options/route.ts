import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();

    const projects = await db.all(`
      SELECT
        project_id,
        project_name,
        country
      FROM projects
      ORDER BY project_name ASC
    `);

    return NextResponse.json(projects);
  } catch (error) {
    console.error("GET /api/projects/options error:", error);

    return NextResponse.json(
      { error: "Failed to fetch project options" },
      { status: 500 }
    );
  }
}