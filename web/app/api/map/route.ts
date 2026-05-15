import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();

    const plantGroups = await db.all(`
      SELECT
        COALESCE(NULLIF(project_group, ''), plant_name) AS group_name,
        MIN(plant_id) AS representative_id,
        country,
        region,
        AVG(CAST(location_x AS REAL)) AS latitude,
        AVG(CAST(location_y AS REAL)) AS longitude,
        COUNT(*) AS record_count,
        SUM(COALESCE(installed_capacity_mw, 0)) AS total_capacity_mw,
        MAX(project_phase) AS phase,
        'plant' AS type
      FROM plants
      WHERE location_x IS NOT NULL
        AND location_y IS NOT NULL
        AND TRIM(CAST(location_x AS TEXT)) != ''
        AND TRIM(CAST(location_y AS TEXT)) != ''
      GROUP BY COALESCE(NULLIF(project_group, ''), plant_name), country, region
      ORDER BY group_name ASC
    `);

    const projectGroups = await db.all(`
      SELECT
        COALESCE(NULLIF(project_group, ''), project_name) AS group_name,
        MIN(project_id) AS representative_id,
        country,
        region,
        AVG(CAST(location_x AS REAL)) AS latitude,
        AVG(CAST(location_y AS REAL)) AS longitude,
        COUNT(*) AS record_count,
        SUM(COALESCE(installed_capacity_mw, 0)) AS total_capacity_mw,
        MIN(COALESCE(potential_min_mw, 0)) AS potential_min_mw,
        MAX(project_phase) AS phase,
        'project' AS type
      FROM projects
      WHERE location_x IS NOT NULL
        AND location_y IS NOT NULL
        AND TRIM(CAST(location_x AS TEXT)) != ''
        AND TRIM(CAST(location_y AS TEXT)) != ''
      GROUP BY COALESCE(NULLIF(project_group, ''), project_name), country, region
      ORDER BY group_name ASC
    `);

    return NextResponse.json({
      plants: plantGroups,
      projects: projectGroups,
    });
  } catch (error) {
    console.error("GET /api/map error:", error);

    return NextResponse.json(
      {
        plants: [],
        projects: [],
        error: "Failed to load map data",
      },
      { status: 500 }
    );
  }
}