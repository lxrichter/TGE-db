import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();

    const companies = await db.all(`
      SELECT
        company_id,
        company_name,
        headquarters_country
      FROM companies
      ORDER BY company_name ASC
    `);

    return NextResponse.json(companies);
  } catch (error) {
    console.error("GET /api/companies/options error:", error);

    return NextResponse.json(
      { error: "Failed to fetch company options" },
      { status: 500 }
    );
  }
}