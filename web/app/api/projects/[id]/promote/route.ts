import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function extractNumericId(value: string) {
  const match = value.match(/^PLT-(\d+)$/);
  return match ? Number(match[1]) : null;
}

function formatPlantId(num: number) {
  return `PLT-${String(num).padStart(6, "0")}`;
}

async function generateNextPlantId(db: Awaited<ReturnType<typeof getDb>>) {
  const rows = await db.all<{ plant_id: string }[]>(
    `SELECT plant_id FROM plants WHERE plant_id LIKE 'PLT-%'`
  );

  let maxId = 0;

  for (const row of rows) {
    const parsed = extractNumericId(row.plant_id);
    if (parsed !== null && parsed > maxId) {
      maxId = parsed;
    }
  }

  return formatPlantId(maxId + 1);
}

function safe(val: any) {
  return val === undefined ? null : val;
}

async function getTableColumns(
  db: Awaited<ReturnType<typeof getDb>>,
  tableName: "company_project_links" | "company_plant_links"
) {
  const rows = await db.all<{ name: string }[]>(
    `PRAGMA table_info(${tableName})`
  );
  return new Set(rows.map((row) => row.name));
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;

  if (!projectId) {
    return NextResponse.json(
      { error: "Missing project ID" },
      { status: 400 }
    );
  }

  const db = await getDb();

  try {
    const project = await db.get(
      "SELECT * FROM projects WHERE project_id = ?",
      [projectId]
    );

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const existingPromotedPlant = await db.get(
      "SELECT plant_id FROM plants WHERE promoted_from_project_id = ?",
      [projectId]
    );

    if (existingPromotedPlant) {
      return NextResponse.json(
        {
          error: "This project has already been promoted to a plant",
          plant_id: existingPromotedPlant.plant_id,
        },
        { status: 409 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const promotedPlantName =
      typeof body?.plant_name === "string" && body.plant_name.trim() !== ""
        ? body.plant_name.trim()
        : project.project_name;

    const safePlantId = await generateNextPlantId(db);
    const promotedAt = new Date().toISOString();

    await db.exec("BEGIN TRANSACTION");

    await db.run(
      `
      INSERT INTO plants (
        plant_id,
        plant_name,
        project_group,
        other_name,
        owner_operator,
        developer,
        location_text,
        country,
        region,
        wb_region,
        potential_min_mw,
        potential_max_mw,
        installed_capacity_mw,
        capacity_running_mw,
        gross_production_gwh,
        start_dev_year,
        cod,
        resource_type,
        resource_temp_c,
        project_phase,
        phase_historical,
        field_name,
        wells_total,
        wells_prod_active,
        wells_reinj_active,
        wells_inactive_standby,
        wells_other_exploration,
        well_depth_prod_m,
        temp_prod_well_c,
        flow_rate_ls,
        number_of_unit,
        plant_technology,
        turbine_supplier,
        epc_suppliers,
        investor,
        ppa_usd_kwh,
        total_investment_cost,
        notes,
        location_x,
        location_y,
        website_information,
        date_created,
        date_edited,
        edited_description,
        research_status,
        promoted_from_project_id,
        promoted_at
      )
      VALUES (${Array(47).fill("?").join(",")})
      `,
      [
        safePlantId,
        promotedPlantName,
        safe(project.project_group),
        safe(project.other_name),
        safe(project.owner_operator),
        safe(project.developer),
        safe(project.location_text),
        safe(project.country),
        safe(project.region),
        safe(project.wb_region),
        safe(project.potential_min_mw),
        safe(project.potential_max_mw),
        safe(project.installed_capacity_mw),
        safe(project.capacity_running_mw),
        safe(project.gross_production_gwh),
        safe(project.start_dev_year),
        safe(project.cod),
        safe(project.resource_type),
        safe(project.resource_temp_c),
        "Operational",
        safe(project.project_phase),
        safe(project.field_name),
        safe(project.wells_total),
        safe(project.wells_prod_active),
        safe(project.wells_reinj_active),
        safe(project.wells_inactive_standby),
        safe(project.wells_other_exploration),
        safe(project.well_depth_prod_m),
        safe(project.temp_prod_well_c),
        safe(project.flow_rate_ls),
        safe(project.number_of_unit),
        safe(project.plant_technology),
        safe(project.turbine_supplier),
        safe(project.epc_suppliers),
        safe(project.investor),
        safe(project.ppa_usd_kwh),
        safe(project.total_investment_cost),
        safe(project.notes),
        safe(project.location_x),
        safe(project.location_y),
        safe(project.website_information),
        safe(project.date_created),
        safe(project.date_edited),
        safe(project.edited_description),
        safe(project.research_status),
        project.project_id,
        promotedAt,
      ]
    );

    // Copy linked companies from project -> plant
    const projectLinkColumns = await getTableColumns(db, "company_project_links");
    const plantLinkColumns = await getTableColumns(db, "company_plant_links");

    const selectableProjectColumns = [
      "company_id",
      "role",
      "role_detail",
      "ownership_share",
      "is_primary",
      "notes",
    ].filter((col) => projectLinkColumns.has(col));

    const canCopyLinks =
      projectLinkColumns.has("company_id") &&
      projectLinkColumns.has("role") &&
      plantLinkColumns.has("plant_id") &&
      plantLinkColumns.has("company_id") &&
      plantLinkColumns.has("role");

    if (canCopyLinks) {
      const projectCompanyLinks = await db.all<any[]>(
        `
        SELECT ${selectableProjectColumns.join(", ")}
        FROM company_project_links
        WHERE project_id = ?
        `,
        [projectId]
      );

      for (const link of projectCompanyLinks) {
        const selectedRole = String(link.role || "").trim();

        if (!link.company_id || !selectedRole) {
          continue;
        }

        const existingPlantLink = await db.get(
          `
          SELECT 1
          FROM company_plant_links
          WHERE plant_id = ?
            AND company_id = ?
            AND role = ?
          `,
          [safePlantId, link.company_id, selectedRole]
        );

        if (existingPlantLink) {
          continue;
        }

        const insertColumns = ["plant_id", "company_id", "role"];
        const insertValues: any[] = [safePlantId, link.company_id, selectedRole];

        if (
          projectLinkColumns.has("role_detail") &&
          plantLinkColumns.has("role_detail")
        ) {
          insertColumns.push("role_detail");
          insertValues.push(safe(link.role_detail));
        }

        if (
          projectLinkColumns.has("ownership_share") &&
          plantLinkColumns.has("ownership_share")
        ) {
          insertColumns.push("ownership_share");
          insertValues.push(safe(link.ownership_share));
        }

        if (
          projectLinkColumns.has("is_primary") &&
          plantLinkColumns.has("is_primary")
        ) {
          insertColumns.push("is_primary");
          insertValues.push(link.is_primary ? 1 : 0);
        }

        if (projectLinkColumns.has("notes") && plantLinkColumns.has("notes")) {
          insertColumns.push("notes");
          insertValues.push(safe(link.notes));
        }

        await db.run(
          `
          INSERT INTO company_plant_links (${insertColumns.join(", ")})
          VALUES (${insertColumns.map(() => "?").join(", ")})
          `,
          insertValues
        );
      }
    }

    await db.run(
      `
      UPDATE projects
      SET
        is_promoted_to_plant = 1,
        promoted_plant_id = ?,
        promoted_at = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE project_id = ?
      `,
      [safePlantId, promotedAt, projectId]
    );

    await db.exec("COMMIT");

    return NextResponse.json({
      success: true,
      plant_id: safePlantId,
    });
  } catch (error: any) {
    try {
      await db.exec("ROLLBACK");
    } catch {}

    console.error("Promotion error:", error);

    return NextResponse.json(
      {
        error: "Failed to promote project to plant",
        details: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}