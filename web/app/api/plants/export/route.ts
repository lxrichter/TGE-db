import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { getDb } from "@/lib/db";
import { canExport, type UserRole } from "@/lib/auth/roles";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = ((session.user as { role?: UserRole } | undefined)?.role ??
      null) as UserRole | null;

    if (!canExport(role)) {
      return NextResponse.json(
        { error: "Forbidden: export requires Editor+ or Administrator" },
        { status: 403 }
      );
    }

    const db = await getDb();

    const rows = await db.all(`
      SELECT
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

        installed_capacity_mw,
        capacity_running_mw,
        potential_min_mw,
        potential_max_mw,
        gross_production_gwh,

        cod,
        start_dev_year,

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
        review_status
      FROM plants
      ORDER BY plant_name ASC
    `);

    return NextResponse.json({ rows });
  } catch (error) {
    console.error("GET /api/plants/export error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Failed to export plants: ${error.message}`
            : "Failed to export plants",
      },
      { status: 500 }
    );
  }
}