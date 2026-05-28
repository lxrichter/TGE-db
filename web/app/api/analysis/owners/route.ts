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
      WITH owner_links AS (
        SELECT
          cpl.company_id,
          cpl.plant_id,
          SUM(COALESCE(cpl.ownership_share, 0)) AS ownership_share,
          MAX(p.installed_capacity_mw) AS installed_capacity_mw
        FROM company_plant_links cpl
        INNER JOIN plants p
          ON p.plant_id = cpl.plant_id
        WHERE TRIM(COALESCE(cpl.role, '')) = 'Owner'
          AND p.installed_capacity_mw IS NOT NULL
          AND cpl.ownership_share IS NOT NULL
        GROUP BY cpl.company_id, cpl.plant_id
      )
      SELECT
        c.company_id,
        c.company_name,
        COUNT(DISTINCT owner_links.plant_id) AS plant_count,
        ROUND(SUM(owner_links.installed_capacity_mw * owner_links.ownership_share / 100.0), 2) AS attributed_mw,
        ROUND(SUM(owner_links.ownership_share), 2) AS summed_ownership_share
      FROM owner_links
      INNER JOIN companies c
        ON c.company_id = owner_links.company_id
      GROUP BY c.company_id, c.company_name
      HAVING attributed_mw > 0
      ORDER BY attributed_mw DESC, c.company_name ASC
    `);

    const summary = await db.get(`
      SELECT
        COUNT(*) AS owner_link_count,
        SUM(CASE WHEN cpl.ownership_share IS NOT NULL THEN 1 ELSE 0 END) AS links_with_ownership_share,
        SUM(CASE WHEN cpl.ownership_share IS NULL THEN 1 ELSE 0 END) AS links_missing_ownership_share,
        SUM(CASE WHEN p.installed_capacity_mw IS NULL THEN 1 ELSE 0 END) AS links_missing_installed_mw,
        COUNT(DISTINCT CASE
          WHEN cpl.ownership_share IS NOT NULL
           AND p.installed_capacity_mw IS NOT NULL
          THEN cpl.plant_id
        END) AS included_plant_count
      FROM company_plant_links cpl
      INNER JOIN plants p
        ON p.plant_id = cpl.plant_id
      WHERE TRIM(COALESCE(cpl.role, '')) = 'Owner'
    `);

    return NextResponse.json({
      summary: {
        roles_counted: ["Owner"],
        owner_link_count: Number(summary?.owner_link_count || 0),
        links_with_ownership_share: Number(summary?.links_with_ownership_share || 0),
        links_missing_ownership_share: Number(
          summary?.links_missing_ownership_share || 0
        ),
        links_missing_installed_mw: Number(summary?.links_missing_installed_mw || 0),
        included_plant_count: Number(summary?.included_plant_count || 0),
      },
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
