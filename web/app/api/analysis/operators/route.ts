import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();

    const rows = await db.all(`
      SELECT
        c.company_id,
        c.company_name,
        COUNT(DISTINCT p.plant_id) AS plant_count,
        ROUND(SUM(COALESCE(p.installed_capacity_mw, 0)), 2) AS operated_mw
      FROM company_plant_links cpl
      INNER JOIN companies c
        ON c.company_id = cpl.company_id
      INNER JOIN plants p
        ON p.plant_id = cpl.plant_id
      WHERE TRIM(COALESCE(cpl.role, '')) = 'Operator'
        AND p.installed_capacity_mw IS NOT NULL
      GROUP BY c.company_id, c.company_name
      HAVING operated_mw > 0
      ORDER BY operated_mw DESC, c.company_name ASC
    `);

    return NextResponse.json({
      rows: rows.map((row: any, index: number) => ({
        rank: index + 1,
        company_id: row.company_id,
        company_name: row.company_name || row.company_id,
        plant_count: Number(row.plant_count || 0),
        operated_mw: Number(row.operated_mw || 0),
      })),
    });
  } catch (error) {
    console.error("Error in /api/analysis/operators:", error);
    return NextResponse.json(
      { error: "Failed to load operator analysis." },
      { status: 500 }
    );
  }
}