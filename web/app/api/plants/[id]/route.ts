import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { shouldSetPendingReview } from "@/lib/auth/roles";

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
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const db = await getDb();

    const plant = await db.get(
      `
      SELECT
        p.*,
        uc.name AS created_by_name,
        uu.name AS last_updated_by_name,
        ua.name AS approved_by_name
      FROM plants p
      LEFT JOIN users uc
        ON uc.user_id = p.created_by_user_id
      LEFT JOIN users uu
        ON uu.user_id = p.last_updated_by_user_id
      LEFT JOIN users ua
        ON ua.user_id = p.approved_by_user_id
      WHERE p.plant_id = ?
      `,
      [id]
    );

    if (!plant) {
      return NextResponse.json(
        { error: "Plant not found", requested_id: id },
        { status: 404 }
      );
    }

    const companyLinks = await db.all(
      `
      SELECT
        cpl.company_plant_link_id,
        cpl.company_id,
        c.company_name,
        cpl.role,
        cpl.role_detail,
        cpl.ownership_share,
        cpl.is_primary,
        cpl.notes
      FROM company_plant_links cpl
      LEFT JOIN companies c
        ON cpl.company_id = c.company_id
      WHERE cpl.plant_id = ?
      ORDER BY cpl.is_primary DESC, c.company_name ASC
      `,
      [id]
    );

    return NextResponse.json({
      ...plant,
      company_links: companyLinks,
    });
  } catch (error) {
    console.error("GET /api/plants/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to fetch plant" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as {
      id: string;
      role: import("@/lib/auth/roles").UserRole;
    } | null;

    if (!user?.id || !user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const db = await getDb();
    const body = await req.json();

    const existing = await db.get(
      `SELECT plant_id FROM plants WHERE plant_id = ?`,
      [id]
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Plant not found" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const shouldReview = shouldSetPendingReview(user.role);

    const values = [
      normalizeValue("plant_name", body.plant_name),
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
      normalizeValue("edited_description", body.edited_description),
      normalizeValue("research_status", body.research_status),
      user.id,
      shouldReview ? "pending_review" : "approved",
      shouldReview ? null : user.id,
      shouldReview ? null : now,
      id,
    ];

    await db.run(
      `
      UPDATE plants
      SET
        plant_name = ?,
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
        date_edited = ?,
        edited_description = ?,
        research_status = ?,
        last_updated_by_user_id = ?,
        review_status = ?,
        approved_by_user_id = ?,
        approved_at = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE plant_id = ?
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
      FROM plants p
      LEFT JOIN users uc
        ON uc.user_id = p.created_by_user_id
      LEFT JOIN users uu
        ON uu.user_id = p.last_updated_by_user_id
      LEFT JOIN users ua
        ON ua.user_id = p.approved_by_user_id
      WHERE p.plant_id = ?
      `,
      [id]
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/plants/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to update plant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const db = await getDb();

  try {
    const { id } = await context.params;

    const plant = await db.get(
      `SELECT plant_id, plant_name, promoted_from_project_id FROM plants WHERE plant_id = ?`,
      [id]
    );

    if (!plant) {
      return NextResponse.json(
        { error: "Plant not found" },
        { status: 404 }
      );
    }

    if (plant.promoted_from_project_id) {
      return NextResponse.json(
        {
          error: `Cannot delete plant ${plant.plant_name || id}. It was created from project ${plant.promoted_from_project_id}.`,
        },
        { status: 409 }
      );
    }

    await db.exec("BEGIN TRANSACTION");

    await db.run(`DELETE FROM company_plant_links WHERE plant_id = ?`, [id]);
    await db.run(`DELETE FROM plants WHERE plant_id = ?`, [id]);

    await db.exec("COMMIT");

    return NextResponse.json({
      success: true,
      deleted_id: id,
    });
  } catch (error) {
    await db.exec("ROLLBACK").catch(() => {});
    console.error("DELETE /api/plants/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to delete plant" },
      { status: 500 }
    );
  }
}