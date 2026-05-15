import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { shouldSetPendingReview, type UserRole } from "@/lib/auth/roles";

type SessionUser = {
  id: string;
  role: UserRole;
};

async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as Partial<SessionUser> | undefined;

  if (!user?.id || !user?.role) {
    return null;
  }

  return {
    id: user.id,
    role: user.role,
  };
}

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

const numericFields = new Set([
  "potential_min_mw",
  "potential_max_mw",
  "installed_capacity_mw",
  "capacity_running_mw",
  "gross_production_gwh",
  "resource_temp_c",
  "wells_total",
  "wells_prod_active",
  "wells_reinj_active",
  "wells_inactive_standby",
  "wells_other_exploration",
  "well_depth_prod_m",
  "temp_prod_well_c",
  "flow_rate_ls",
  "location_x",
  "location_y",
]);

function normalizeValue(field: string, value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed === "") return null;

    if (numericFields.has(field)) {
      const parsed = Number(trimmed);
      return Number.isNaN(parsed) ? null : parsed;
    }

    return trimmed;
  }

  if (typeof value === "number" && numericFields.has(field)) {
    return Number.isNaN(value) ? null : value;
  }

  return value;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "Missing project ID" },
      { status: 400 }
    );
  }

  const db = await getDb();

  try {
    const project = await db.get(
      `
      SELECT
        p.*,
        uc.name AS created_by_name,
        uu.name AS last_updated_by_name,
        ua.name AS approved_by_name
      FROM projects p
      LEFT JOIN users uc
        ON uc.user_id = p.created_by_user_id
      LEFT JOIN users uu
        ON uu.user_id = p.last_updated_by_user_id
      LEFT JOIN users ua
        ON ua.user_id = p.approved_by_user_id
      WHERE p.project_id = ?
      `,
      [id]
    );

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const companyLinks = await db.all(
      `
      SELECT
        cpl.company_project_link_id,
        cpl.company_id,
        c.company_name,
        cpl.role,
        cpl.role_detail,
        cpl.ownership_share,
        cpl.is_primary,
        cpl.notes
      FROM company_project_links cpl
      LEFT JOIN companies c
        ON cpl.company_id = c.company_id
      WHERE cpl.project_id = ?
      ORDER BY cpl.is_primary DESC, c.company_name ASC
      `,
      [id]
    );

    return NextResponse.json({
      ...project,
      company_links: companyLinks,
    });
  } catch (err: any) {
    console.error("GET PROJECT ERROR:", err);

    return NextResponse.json(
      { error: "Failed to load project", details: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "Missing project ID" },
      { status: 400 }
    );
  }

  const db = await getDb();

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const existing = await db.get(
      `SELECT project_id FROM projects WHERE project_id = ?`,
      [id]
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const reviewStatus = shouldSetPendingReview(user.role)
      ? "pending_review"
      : "approved";

    const values = [
      normalizeValue("project_name", body.project_name),
      normalizeValue("project_group", body.project_group),
      normalizeValue("other_name", body.other_name),
      normalizeValue("owner_operator", body.owner_operator),
      normalizeValue("developer", body.developer),
      normalizeValue("location_text", body.location_text),
      normalizeValue("country", body.country),
      normalizeValue("region", body.region),
      normalizeValue("wb_region", body.wb_region),
      normalizeValue("potential_min_mw", body.potential_min_mw),
      normalizeValue("potential_max_mw", body.potential_max_mw),
      normalizeValue("installed_capacity_mw", body.installed_capacity_mw),
      normalizeValue("capacity_running_mw", body.capacity_running_mw),
      normalizeValue("gross_production_gwh", body.gross_production_gwh),
      normalizeValue("start_dev_year", body.start_dev_year),
      normalizeValue("cod", body.cod),
      normalizeValue("resource_type", body.resource_type),
      normalizeValue("resource_temp_c", body.resource_temp_c),
      normalizeValue("project_phase", body.project_phase),
      normalizeValue("phase_historical", body.phase_historical),
      normalizeValue("field_name", body.field_name),
      normalizeValue("wells_total", body.wells_total),
      normalizeValue("wells_prod_active", body.wells_prod_active),
      normalizeValue("wells_reinj_active", body.wells_reinj_active),
      normalizeValue("wells_inactive_standby", body.wells_inactive_standby),
      normalizeValue("wells_other_exploration", body.wells_other_exploration),
      normalizeValue("well_depth_prod_m", body.well_depth_prod_m),
      normalizeValue("temp_prod_well_c", body.temp_prod_well_c),
      normalizeValue("flow_rate_ls", body.flow_rate_ls),
      normalizeValue("number_of_unit", body.number_of_unit),
      normalizeValue("plant_technology", body.plant_technology),
      normalizeValue("turbine_supplier", body.turbine_supplier),
      normalizeValue("epc_suppliers", body.epc_suppliers),
      normalizeValue("investor", body.investor),
      normalizeValue("ppa_usd_kwh", body.ppa_usd_kwh),
      normalizeValue("total_investment_cost", body.total_investment_cost),
      normalizeValue("notes", body.notes),
      normalizeValue("location_x", body.location_x),
      normalizeValue("location_y", body.location_y),
      normalizeValue("website_information", body.website_information),
      normalizeValue("edited_description", body.edited_description),
      normalizeValue("research_status", body.research_status),
      user.id,
      reviewStatus,
      reviewStatus === "approved" ? user.id : null,
      reviewStatus === "approved" ? now : null,
      now,
      id,
    ];

    await db.run(
      `
      UPDATE projects
      SET
        project_name = ?,
        project_group = ?,
        other_name = ?,
        owner_operator = ?,
        developer = ?,
        location_text = ?,
        country = ?,
        region = ?,
        wb_region = ?,
        potential_min_mw = ?,
        potential_max_mw = ?,
        installed_capacity_mw = ?,
        capacity_running_mw = ?,
        gross_production_gwh = ?,
        start_dev_year = ?,
        cod = ?,
        resource_type = ?,
        resource_temp_c = ?,
        project_phase = ?,
        phase_historical = ?,
        field_name = ?,
        wells_total = ?,
        wells_prod_active = ?,
        wells_reinj_active = ?,
        wells_inactive_standby = ?,
        wells_other_exploration = ?,
        well_depth_prod_m = ?,
        temp_prod_well_c = ?,
        flow_rate_ls = ?,
        number_of_unit = ?,
        plant_technology = ?,
        turbine_supplier = ?,
        epc_suppliers = ?,
        investor = ?,
        ppa_usd_kwh = ?,
        total_investment_cost = ?,
        notes = ?,
        location_x = ?,
        location_y = ?,
        website_information = ?,
        edited_description = ?,
        research_status = ?,
        last_updated_by_user_id = ?,
        review_status = ?,
        approved_by_user_id = ?,
        approved_at = ?,
        date_edited = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE project_id = ?
      `,
      values
    );

    const updated = await db.get(
      `
      SELECT
        p.*,
        uc.name AS created_by_name,
        uu.name AS last_updated_by_name,
        ua.name AS approved_by_name
      FROM projects p
      LEFT JOIN users uc
        ON uc.user_id = p.created_by_user_id
      LEFT JOIN users uu
        ON uu.user_id = p.last_updated_by_user_id
      LEFT JOIN users ua
        ON ua.user_id = p.approved_by_user_id
      WHERE p.project_id = ?
      `,
      [id]
    );

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PUT PROJECT ERROR:", err);

    return NextResponse.json(
      { error: "Failed to update project", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;

  if (!projectId) {
    return NextResponse.json({ error: "Missing project ID" }, { status: 400 });
  }

  const db = await getDb();

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await db.get(
      "SELECT * FROM projects WHERE project_id = ?",
      [projectId]
    );

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const existing = await db.get(
      "SELECT plant_id FROM plants WHERE promoted_from_project_id = ?",
      [projectId]
    );

    if (existing) {
      return NextResponse.json(
        {
          error: "Already promoted",
          plant_id: existing.plant_id,
        },
        { status: 409 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const plantName =
      typeof body?.plant_name === "string" && body.plant_name.trim()
        ? body.plant_name.trim()
        : project.project_name;

    const plantId = await generateNextPlantId(db);
    const promotedAt = new Date().toISOString();
    const reviewStatus = shouldSetPendingReview(user.role)
      ? "pending_review"
      : "approved";

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
        created_by_user_id,
        last_updated_by_user_id,
        review_status,
        approved_by_user_id,
        approved_at,
        promoted_from_project_id,
        promoted_at,
        created_at,
        updated_at
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      `,
      [
        plantId,
        plantName,
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
        promotedAt,
        promotedAt,
        body?.edited_description?.trim() || `Promoted from project ${projectId}`,
        safe(project.research_status),
        user.id,
        user.id,
        reviewStatus,
        reviewStatus === "approved" ? user.id : null,
        reviewStatus === "approved" ? promotedAt : null,
        project.project_id,
        promotedAt,
      ]
    );

    await db.run(
      `
      UPDATE projects
      SET
        is_promoted_to_plant = 1,
        promoted_plant_id = ?,
        promoted_at = ?,
        last_updated_by_user_id = ?,
        review_status = ?,
        approved_by_user_id = ?,
        approved_at = ?,
        date_edited = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE project_id = ?
      `,
      [
        plantId,
        promotedAt,
        user.id,
        reviewStatus,
        reviewStatus === "approved" ? user.id : null,
        reviewStatus === "approved" ? promotedAt : null,
        promotedAt,
        projectId,
      ]
    );

    await db.exec("COMMIT");

    return NextResponse.json({
      success: true,
      plant_id: plantId,
    });
  } catch (err: any) {
    await db.exec("ROLLBACK").catch(() => {});
    console.error("PROMOTION ERROR:", err);

    return NextResponse.json(
      {
        error: "Promotion failed",
        details: err?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "Missing project ID" },
      { status: 400 }
    );
  }

  const db = await getDb();

  try {
    const existing = await db.get(
      `
      SELECT
        project_id,
        project_name,
        is_promoted_to_plant,
        promoted_plant_id
      FROM projects
      WHERE project_id = ?
      `,
      [id]
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (
      Number(existing.is_promoted_to_plant || 0) === 1 &&
      existing.promoted_plant_id
    ) {
      return NextResponse.json(
        {
          error:
            "This project cannot be deleted because it has already been promoted to a plant. Handle the linked plant first.",
        },
        { status: 409 }
      );
    }

    await db.exec("BEGIN TRANSACTION");

    await db.run(`DELETE FROM company_project_links WHERE project_id = ?`, [id]);
    await db.run(`DELETE FROM projects WHERE project_id = ?`, [id]);

    await db.exec("COMMIT");

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully.",
    });
  } catch (err: any) {
    await db.exec("ROLLBACK").catch(() => {});
    console.error("DELETE PROJECT ERROR:", err);

    return NextResponse.json(
      {
        error: err?.message || "Failed to delete project",
      },
      { status: 500 }
    );
  }
}