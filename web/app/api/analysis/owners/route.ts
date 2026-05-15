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
        ROUND(SUM(
          CASE
            WHEN p.installed_capacity_mw IS NOT NULL
             AND cpl.ownership_share IS NOT NULL
            THEN p.installed_capacity_mw * cpl.ownership_share / 100.0
            ELSE 0
          END
        ), 2) AS attributed_mw,
        ROUND(SUM(
          CASE
            WHEN cpl.ownership_share IS NOT NULL
            THEN cpl.ownership_share
            ELSE 0
          END
        ), 2) AS summed_ownership_share
      FROM company_plant_links cpl
      INNER JOIN companies c
        ON c.company_id = cpl.company_id
      INNER JOIN plants p
        ON p.plant_id = cpl.plant_id
      WHERE TRIM(COALESCE(cpl.role, '')) = 'Owner'
        AND p.installed_capacity_mw IS NOT NULL
      GROUP BY c.company_id, c.company_name
      HAVING attributed_mw > 0
      ORDER BY attributed_mw DESC, c.company_name ASC
    `);

    return NextResponse.json({
      rows: rows.map((row: any, index: number) => ({
        rank: index + 1,
        company_id: row.company_id,
        company_name: row.company_name || row.company_id,
        plant_count: Number(row.plant_count || 0),
        attributed_mw: Number(row.attributed_mw || 0),
        summed_ownership_share: Number(row.summed_ownership_share || 0),
      })),
    });
  } catch (error) {
    console.error("Error in /api/analysis/owners:", error);
    return NextResponse.json(
      { error: "Failed to load owner analysis." },
      { status: 500 }
    );
  }
}