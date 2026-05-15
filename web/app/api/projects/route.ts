import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { shouldSetPendingReview, type UserRole } from "@/lib/auth/roles";

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
      const num = Number(trimmed);
      return Number.isNaN(num) ? null : num;
    }

    return trimmed;
  }

  if (numericFields.has(field) && typeof value === "number") {
    return Number.isNaN(value) ? null : value;
  }

  return value;
}

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

async function generateNextProjectId() {
  const db = await getDb();

  const row = await db.get<{ max_num: number | null }>(`
    SELECT MAX(CAST(SUBSTR(project_id, 6) AS INTEGER)) AS max_num
    FROM projects
    WHERE project_id LIKE 'PROJ-%'
  `);

  const nextNum = (row?.max_num ?? 0) + 1;
  return `PROJ-${String(nextNum).padStart(6, "0")}`;
}

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();

    const { searchParams } = new URL(req.url);
    const view = (searchParams.get("view") || "active").toLowerCase();

    let whereClause = "";

    if (view === "promoted") {
      whereClause = `
        WHERE COALESCE(p.is_promoted_to_plant, 0) = 1
          OR NULLIF(TRIM(p.promoted_plant_id), '') IS NOT NULL
      `;
    } else if (view === "active") {
      whereClause = `
        WHERE COALESCE(p.is_promoted_to_plant, 0) != 1
          AND NULLIF(TRIM(p.promoted_plant_id), '') IS NULL
      `;
    } else {
      whereClause = "";
    }

    const projects = await db.all(`
      SELECT
        p.project_id,
        p.project_name,
        p.country,
        p.region,
        p.owner_operator,
        p.installed_capacity_mw,
        p.potential_min_mw,
        p.project_phase,
        p.plant_technology,
        p.research_status,
        p.review_status,
        p.is_promoted_to_plant,
        p.promoted_plant_id,
        p.promoted_at,
        p.location_x,
        p.location_y,
        p.website_information,
        p.created_by_user_id,
        p.last_updated_by_user_id,
        p.approved_by_user_id,
        p.created_at,
        p.updated_at,

        u_created.name AS created_by_name,
        u_updated.name AS last_updated_by_name,
        u_approved.name AS approved_by_name

      FROM projects p

      LEFT JOIN users u_created
        ON u_created.user_id = p.created_by_user_id

      LEFT JOIN users u_updated
        ON u_updated.user_id = p.last_updated_by_user_id

      LEFT JOIN users u_approved
        ON u_approved.user_id = p.approved_by_user_id

      ${whereClause}

      ORDER BY p.project_name ASC
    `);

    return NextResponse.json(Array.isArray(projects) ? projects : []);
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const body = await req.json();
    const project_id = await generateNextProjectId();

    const now = new Date().toISOString();
    const reviewStatus = shouldSetPendingReview(user.role)
      ? "pending_review"
      : "approved";

    await db.run(
      `
      INSERT INTO projects (
        project_id,
        project_name,
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
        is_promoted_to_plant,
        promoted_plant_id,
        promoted_at,
        created_at,
        updated_at
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, NULL, NULL,
        0, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      `,
      [
        project_id,
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
        now,
        now,
        normalizeValue("edited_description", body.edited_description),
        normalizeValue("research_status", body.research_status),
        user.id,
        user.id,
        reviewStatus,
      ]
    );

    const project = await db.get(
      `SELECT * FROM projects WHERE project_id = ?`,
      [project_id]
    );

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}