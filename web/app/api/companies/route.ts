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

async function generateNextCompanyId() {
  const db = await getDb();

  const row = await db.get<{ max_num: number | null }>(`
    SELECT MAX(CAST(SUBSTR(company_id, 5) AS INTEGER)) AS max_num
    FROM companies
    WHERE company_id LIKE 'COM-%'
  `);

  const nextNum = (row?.max_num ?? 0) + 1;
  return `COM-${String(nextNum).padStart(6, "0")}`;
}

export async function GET() {
  try {
    const db = await getDb();

    const companies = await db.all(`
      SELECT
        c.company_id,
        c.company_name,
        c.company_type_primary,
        c.secondary_types,
        c.headquarters_country,
        c.company_group_name,
        COALESCE(c.consolidation_method, c.group_inclusion_type) AS consolidation_method,
        c.group_reporting_weight,
        c.research_status,
        c.review_status,
        c.website_url,
        c.linkedin_url,
        c.parent_company_id,
        c.ultimate_parent_company_id,
        c.created_by_user_id,
        c.last_updated_by_user_id,
        c.approved_by_user_id,
        c.created_at,
        c.updated_at,

        u_created.name AS created_by_name,
        u_updated.name AS last_updated_by_name,
        u_approved.name AS approved_by_name,

        (
          SELECT COUNT(*)
          FROM company_relationships cr
          WHERE cr.company_id_from = c.company_id
            OR cr.company_id_to = c.company_id
        ) AS related_companies_count,

        (
          SELECT COUNT(*)
          FROM company_project_links cpl
          WHERE cpl.company_id = c.company_id
        ) AS linked_projects_count,

        (
          SELECT COUNT(*)
          FROM company_plant_links cpl2
          WHERE cpl2.company_id = c.company_id
        ) AS linked_plants_count

      FROM companies c

      LEFT JOIN users u_created
        ON u_created.user_id = c.created_by_user_id

      LEFT JOIN users u_updated
        ON u_updated.user_id = c.last_updated_by_user_id

      LEFT JOIN users u_approved
        ON u_approved.user_id = c.approved_by_user_id

      ORDER BY c.company_name ASC
      LIMIT 1000
    `);

    return NextResponse.json(companies);
  } catch (error) {
    console.error("GET /api/companies error:", error);

    return NextResponse.json(
      { error: "Failed to fetch companies" },
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
    const company_id = await generateNextCompanyId();

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
      INSERT INTO companies (
        company_id,
        company_name,
        company_name_short,
        company_legal_name,
        company_name_clean,
        website_url,
        linkedin_url,
        entity_type,
        company_type_primary,
        secondary_types,
        ownership_type,
        is_spv,
        is_active_company,
        company_status,
        parent_company_id,
        ultimate_parent_company_id,
        company_group_name,
        consolidation_method,
        group_inclusion_type,
        group_reporting_weight,
        is_group_parent,
        is_operating_entity,
        headquarters_city,
        headquarters_country,
        region,
        wb_region,
        geothermal_focus,
        technology_focus,
        service_scope_summary,
        operating_markets_summary,
        research_status,
        date_created,
        date_edited,
        notes,
        information,
        internal_comments,
        review_status,
        edited_description,
        created_by_user_id,
        last_updated_by_user_id,
        approved_by_user_id,
        approved_at,
        created_at,
        updated_at
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      `,
      [
        company_id,
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
        0,
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
        dateOnly,
        normalizeValue("notes", body.notes),
        normalizeValue("information", body.information),
        normalizeValue("internal_comments", body.internal_comments),
        reviewStatus,
        normalizeValue("edited_description", body.edited_description) ??
          "Initial company record created",
        user.id,
        user.id,
        reviewStatus === "approved" ? user.id : null,
        reviewStatus === "approved" ? now : null,
      ]
    );

    const company = await db.get(
      `SELECT * FROM companies WHERE company_id = ?`,
      [company_id]
    );

    return NextResponse.json({
      success: true,
      company,
      company_id,
    });
  } catch (error) {
    console.error("POST /api/companies error:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}