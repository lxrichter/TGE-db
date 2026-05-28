import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OPERATOR_ROLES = ["Operator", "Operator Power", "Operator Steam"];

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();

    const rows = await db.all(`
      WITH operator_links AS (
        SELECT DISTINCT
          cpl.company_id,
          cpl.plant_id
        FROM company_plant_links cpl
        INNER JOIN plants p
          ON p.plant_id = cpl.plant_id
        WHERE TRIM(COALESCE(cpl.role, '')) IN (${OPERATOR_ROLES.map(
          () => "?"
        ).join(", ")})
          AND p.installed_capacity_mw IS NOT NULL
      )
      SELECT
        c.company_id,
        c.company_name,
        COUNT(DISTINCT operator_links.plant_id) AS plant_count,
        ROUND(SUM(COALESCE(p.installed_capacity_mw, 0)), 2) AS operated_mw
      FROM operator_links
      INNER JOIN companies c
        ON c.company_id = operator_links.company_id
      INNER JOIN plants p
        ON p.plant_id = operator_links.plant_id
      GROUP BY c.company_id, c.company_name
      HAVING operated_mw > 0
      ORDER BY operated_mw DESC, c.company_name ASC
    `, OPERATOR_ROLES);

    const summary = await db.get(`
      SELECT
        COUNT(*) AS operator_link_count,
        COUNT(DISTINCT cpl.plant_id) AS linked_plant_count,
        SUM(CASE WHEN p.installed_capacity_mw IS NULL THEN 1 ELSE 0 END) AS links_missing_installed_mw,
        COUNT(DISTINCT CASE
          WHEN p.installed_capacity_mw IS NOT NULL
          THEN cpl.plant_id
        END) AS included_plant_count
      FROM company_plant_links cpl
      INNER JOIN plants p
        ON p.plant_id = cpl.plant_id
      WHERE TRIM(COALESCE(cpl.role, '')) IN (${OPERATOR_ROLES.map(
        () => "?"
      ).join(", ")})
    `, OPERATOR_ROLES);

    return NextResponse.json({
      summary: {
        roles_counted: OPERATOR_ROLES,
        operator_link_count: Number(summary?.operator_link_count || 0),
        linked_plant_count: Number(summary?.linked_plant_count || 0),
        links_missing_installed_mw: Number(summary?.links_missing_installed_mw || 0),
        included_plant_count: Number(summary?.included_plant_count || 0),
      },
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
