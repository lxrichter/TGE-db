import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { shouldSetPendingReview, type UserRole } from "@/lib/auth/roles";

const integerFields = new Set([
  "is_active_company",
  "is_group_parent",
  "is_operating_entity",
  "is_spv",
]);

function normalizeValue(field: string, value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (Array.isArray(value)) {
    if (field === "company_type_secondary" || field === "secondary_types") {
      const cleaned = value.map((v) => String(v).trim()).filter(Boolean);
      return cleaned.length ? JSON.stringify(cleaned) : null;
    }
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return null;

    if (integerFields.has(field)) {
      if (trimmed === "1" || trimmed.toLowerCase() === "true") return 1;
      if (trimmed === "0" || trimmed.toLowerCase() === "false") return 0;
      return null;
    }

    if (field === "group_reporting_weight") {
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return trimmed;
  }

  if (typeof value === "boolean" && integerFields.has(field)) {
    return value ? 1 : 0;
  }

  if (typeof value === "number") {
    if (integerFields.has(field)) {
      return value ? 1 : 0;
    }

    if (field === "group_reporting_weight") {
      return Number.isFinite(value) ? value : null;
    }
  }

  return value;
}

function parseSecondaryTypes(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(String).map((s) => s.trim()).filter(Boolean);
  }

  try {
    const parsed = JSON.parse(String(value));
    if (Array.isArray(parsed)) {
      return parsed.map(String).map((s) => s.trim()).filter(Boolean);
    }
  } catch {
    // fall through
  }

  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
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

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const db = await getDb();

    const companyRow = await db.get(
      `
      SELECT
        c.*,
        parent.company_name AS parent_company_name,
        ultimate.company_name AS ultimate_parent_company_name,
        uc.name AS created_by_name,
        uu.name AS last_updated_by_name,
        ua.name AS approved_by_name
      FROM companies c
      LEFT JOIN companies parent
        ON parent.company_id = c.parent_company_id
      LEFT JOIN companies ultimate
        ON ultimate.company_id = c.ultimate_parent_company_id
      LEFT JOIN users uc
        ON uc.user_id = c.created_by_user_id
      LEFT JOIN users uu
        ON uu.user_id = c.last_updated_by_user_id
      LEFT JOIN users ua
        ON ua.user_id = c.approved_by_user_id
      WHERE c.company_id = ?
      `,
      [id]
    );

    if (!companyRow) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    const company = {
      ...companyRow,
      secondary_types: parseSecondaryTypes(companyRow.secondary_types),
    };

    const roles = await db.all(
      `
      SELECT
        company_role_id,
        role_type,
        role_subtype,
        role_scope,
        role_status,
        notes
      FROM company_roles
      WHERE company_id = ?
      ORDER BY role_type ASC, role_subtype ASC
      `,
      [id]
    );

    const project_links = await db.all(
      `
      SELECT
        cpl.company_project_link_id,
        cpl.project_id,
        p.project_name,
        cpl.role,
        cpl.role_detail,
        cpl.is_primary,
        cpl.notes,
        cpl.ownership_share
      FROM company_project_links cpl
      LEFT JOIN projects p
        ON p.project_id = cpl.project_id
      WHERE cpl.company_id = ?
      ORDER BY cpl.is_primary DESC, p.project_name ASC
      `,
      [id]
    );

    const plant_links = await db.all(
      `
      SELECT
        cpl.company_plant_link_id,
        cpl.plant_id,
        p.plant_name,
        cpl.role,
        cpl.role_detail,
        cpl.is_primary,
        cpl.notes,
        cpl.ownership_share
      FROM company_plant_links cpl
      LEFT JOIN plants p
        ON p.plant_id = cpl.plant_id
      WHERE cpl.company_id = ?
      ORDER BY cpl.is_primary DESC, p.plant_name ASC
      `,
      [id]
    );

    const relationships_outgoing = await db.all(
      `
      SELECT
        cr.company_relationship_id,
        cr.relationship_type,
        cr.ownership_percentage,
        cr.is_current,
        cr.notes,
        cr.company_id_to AS related_company_id,
        c.company_name AS related_company_name
      FROM company_relationships cr
      LEFT JOIN companies c
        ON c.company_id = cr.company_id_to
      WHERE cr.company_id_from = ?
      ORDER BY c.company_name ASC
      `,
      [id]
    );

    const relationships_incoming = await db.all(
      `
      SELECT
        cr.company_relationship_id,
        cr.relationship_type,
        cr.ownership_percentage,
        cr.is_current,
        cr.notes,
        cr.company_id_from AS related_company_id,
        c.company_name AS related_company_name
      FROM company_relationships cr
      LEFT JOIN companies c
        ON c.company_id = cr.company_id_from
      WHERE cr.company_id_to = ?
      ORDER BY c.company_name ASC
      `,
      [id]
    );

    return NextResponse.json({
      company,
      roles,
      project_links,
      plant_links,
      relationships_outgoing,
      relationships_incoming,
    });
  } catch (error) {
    console.error("GET /api/companies/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to fetch company" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user?.id || !user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const db = await getDb();
    const body = await req.json();

    const existing = await db.get(
      `SELECT company_id FROM companies WHERE company_id = ?`,
      [id]
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const dateOnly = now.slice(0, 10);
    const reviewStatus = shouldSetPendingReview(user.role)
      ? "pending_review"
      : "approved";

    const normalizedParentCompanyId = normalizeValue(
      "parent_company_id",
      body.parent_company_id
    );

    const normalizedUltimateParentCompanyId = normalizeValue(
      "ultimate_parent_company_id",
      body.ultimate_parent_company_id
    );

    const normalizedSecondaryTypes =
      normalizeValue(
        "secondary_types",
        body.secondary_types ?? body.company_type_secondary
      ) ?? null;

    const normalizedConsolidationMethod =
      normalizeValue(
        "consolidation_method",
        body.consolidation_method ?? body.group_inclusion_type
      ) ?? "Full";

    const is_group_parent = normalizedParentCompanyId ? 0 : 1;

    await db.run(
      `
      UPDATE companies
      SET
        company_name = ?,
        company_name_short = ?,
        company_legal_name = ?,
        company_name_clean = ?,
        website_url = ?,
        linkedin_url = ?,
        entity_type = ?,
        company_type_primary = ?,
        secondary_types = ?,
        ownership_type = ?,
        is_spv = ?,
        is_active_company = ?,
        company_status = ?,
        parent_company_id = ?,
        ultimate_parent_company_id = ?,
        company_group_name = ?,
        consolidation_method = ?,
        group_inclusion_type = ?,
        group_reporting_weight = ?,
        is_group_parent = ?,
        headquarters_city = ?,
        headquarters_country = ?,
        region = ?,
        wb_region = ?,
        geothermal_focus = ?,
        technology_focus = ?,
        service_scope_summary = ?,
        operating_markets_summary = ?,
        research_status = ?,
        date_edited = ?,
        notes = ?,
        information = ?,
        internal_comments = ?,
        edited_description = ?,
        last_updated_by_user_id = ?,
        review_status = ?,
        approved_by_user_id = ?,
        approved_at = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE company_id = ?
      `,
      [
        normalizeValue("company_name", body.company_name),
        normalizeValue("company_name_short", body.company_name_short),
        normalizeValue("company_legal_name", body.company_legal_name),
        normalizeValue("company_name_clean", body.company_name_clean),
        normalizeValue("website_url", body.website_url),
        normalizeValue("linkedin_url", body.linkedin_url),
        normalizeValue("entity_type", body.entity_type),
        normalizeValue("company_type_primary", body.company_type_primary),
        normalizedSecondaryTypes,
        normalizeValue("ownership_type", body.ownership_type),
        normalizeValue("is_spv", body.is_spv) ?? 0,
        normalizeValue("is_active_company", body.is_active_company) ?? 1,
        normalizeValue("company_status", body.company_status),
        normalizedParentCompanyId,
        normalizedUltimateParentCompanyId,
        normalizeValue("company_group_name", body.company_group_name),
        normalizedConsolidationMethod,
        normalizeValue("group_inclusion_type", body.group_inclusion_type) ??
          normalizedConsolidationMethod,
        normalizeValue("group_reporting_weight", body.group_reporting_weight) ?? 1.0,
        is_group_parent,
        normalizeValue("headquarters_city", body.headquarters_city),
        normalizeValue("headquarters_country", body.headquarters_country),
        normalizeValue("region", body.region),
        normalizeValue("wb_region", body.wb_region),
        normalizeValue("geothermal_focus", body.geothermal_focus),
        normalizeValue("technology_focus", body.technology_focus),
        normalizeValue("service_scope_summary", body.service_scope_summary),
        normalizeValue("operating_markets_summary", body.operating_markets_summary),
        normalizeValue("research_status", body.research_status) ?? "Need Info",
        dateOnly,
        normalizeValue("notes", body.notes),
        normalizeValue("information", body.information),
        normalizeValue("internal_comments", body.internal_comments),
        normalizeValue("edited_description", body.edited_description),
        user.id,
        reviewStatus,
        reviewStatus === "approved" ? user.id : null,
        reviewStatus === "approved" ? now : null,
        id,
      ]
    );

    const updated = await db.get(
      `
      SELECT
        c.*,
        parent.company_name AS parent_company_name,
        ultimate.company_name AS ultimate_parent_company_name,
        uc.name AS created_by_name,
        uu.name AS last_updated_by_name,
        ua.name AS approved_by_name
      FROM companies c
      LEFT JOIN companies parent
        ON parent.company_id = c.parent_company_id
      LEFT JOIN companies ultimate
        ON ultimate.company_id = c.ultimate_parent_company_id
      LEFT JOIN users uc
        ON uc.user_id = c.created_by_user_id
      LEFT JOIN users uu
        ON uu.user_id = c.last_updated_by_user_id
      LEFT JOIN users ua
        ON ua.user_id = c.approved_by_user_id
      WHERE c.company_id = ?
      `,
      [id]
    );

    return NextResponse.json({
      success: true,
      company: {
        ...updated,
        secondary_types: parseSecondaryTypes(updated?.secondary_types),
      },
    });
  } catch (error) {
    console.error("PUT /api/companies/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to update company" },
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

    const company = await db.get(
      `SELECT company_id, company_name FROM companies WHERE company_id = ?`,
      [id]
    );

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    await db.exec("BEGIN TRANSACTION");

    await db.run(`DELETE FROM company_roles WHERE company_id = ?`, [id]);
    await db.run(`DELETE FROM company_project_links WHERE company_id = ?`, [id]);
    await db.run(`DELETE FROM company_plant_links WHERE company_id = ?`, [id]);
    await db.run(
      `DELETE FROM company_relationships WHERE company_id_from = ? OR company_id_to = ?`,
      [id, id]
    );

    await db.run(
      `UPDATE companies SET parent_company_id = NULL WHERE parent_company_id = ?`,
      [id]
    );
    await db.run(
      `UPDATE companies SET ultimate_parent_company_id = NULL WHERE ultimate_parent_company_id = ?`,
      [id]
    );

    await db.run(`DELETE FROM companies WHERE company_id = ?`, [id]);

    await db.exec("COMMIT");

    return NextResponse.json({
      success: true,
      deleted_id: id,
    });
  } catch (error) {
    await db.exec("ROLLBACK").catch(() => {});
    console.error("DELETE /api/companies/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}