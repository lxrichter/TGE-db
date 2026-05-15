import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validateAssetLinkPayload } from "@/lib/validation/assetLinks";

function makeLinkId() {
  return `CPL-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function normalizeOwnershipShare(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0 || parsed > 100) return null;

  return parsed;
}

export async function POST(req: Request) {
  try {
    const db = await getDb();
    const body = await req.json();

    const company_id = body.company_id?.trim() || "";
    const project_id = body.project_id?.trim() || "";
    const role = body.role?.trim() || "";
    const role_detail = body.role_detail?.trim() || null;
    const is_primary = body.is_primary ? 1 : 0;
    const notes = body.notes?.trim() || null;
    const ownership_share = normalizeOwnershipShare(body.ownership_share);
    const ownershipShareRaw =
      body.ownership_share === undefined || body.ownership_share === null
        ? ""
        : String(body.ownership_share).trim();

    const validationError = validateAssetLinkPayload({
      assetLabel: "project",
      assetId: project_id,
      role,
      ownershipShare: ownershipShareRaw,
    });

    if (!company_id) {
      return NextResponse.json(
        { error: "company_id is required" },
        { status: 400 }
      );
    }

    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    const company = await db.get(
      `SELECT company_id, company_name FROM companies WHERE company_id = ?`,
      [company_id]
    );

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    const project = await db.get(
      `SELECT project_id, project_name FROM projects WHERE project_id = ?`,
      [project_id]
    );

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const existing = await db.get(
      `
      SELECT company_project_link_id
      FROM company_project_links
      WHERE company_id = ?
        AND project_id = ?
        AND LOWER(role) = LOWER(?)
      `,
      [company_id, project_id, role]
    );

    if (existing) {
      return NextResponse.json(
        { error: "This company-project-role link already exists" },
        { status: 409 }
      );
    }

    const company_project_link_id = makeLinkId();

    await db.run(
      `
      INSERT INTO company_project_links (
        company_project_link_id,
        company_id,
        project_id,
        role,
        role_detail,
        is_primary,
        notes,
        ownership_share,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [
        company_project_link_id,
        company_id,
        project_id,
        role,
        role_detail,
        is_primary,
        notes,
        ownership_share,
      ]
    );

    const created = await db.get(
      `
      SELECT
        cpl.company_project_link_id,
        cpl.company_id,
        c.company_name,
        cpl.project_id,
        cpl.role,
        cpl.role_detail,
        cpl.is_primary,
        cpl.notes,
        cpl.ownership_share,
        p.project_name
      FROM company_project_links cpl
      LEFT JOIN projects p
        ON cpl.project_id = p.project_id
      LEFT JOIN companies c
        ON cpl.company_id = c.company_id
      WHERE cpl.company_project_link_id = ?
      `,
      [company_project_link_id]
    );

    return NextResponse.json({
      success: true,
      link: created,
    });
  } catch (error) {
    console.error("POST /api/company-project-links error:", error);

    return NextResponse.json(
      { error: "Failed to create company-project link" },
      { status: 500 }
    );
  }
}