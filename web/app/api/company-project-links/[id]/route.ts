import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validateAssetLinkPayload } from "@/lib/validation/assetLinks";

function normalizeOwnershipShare(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0 || parsed > 100) return null;

  return parsed;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const body = await req.json();

    const existing = await db.get(
      `
      SELECT company_project_link_id, company_id
      FROM company_project_links
      WHERE company_project_link_id = ?
      `,
      [id]
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Project link not found" },
        { status: 404 }
      );
    }

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

    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    const project = await db.get(
      `SELECT project_id FROM projects WHERE project_id = ?`,
      [project_id]
    );

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const duplicate = await db.get(
      `
      SELECT company_project_link_id
      FROM company_project_links
      WHERE company_id = ?
        AND project_id = ?
        AND LOWER(role) = LOWER(?)
        AND company_project_link_id <> ?
      `,
      [existing.company_id, project_id, role, id]
    );

    if (duplicate) {
      return NextResponse.json(
        { error: "This company-project-role link already exists" },
        { status: 409 }
      );
    }

    await db.run(
      `
      UPDATE company_project_links
      SET
        project_id = ?,
        role = ?,
        role_detail = ?,
        is_primary = ?,
        notes = ?,
        ownership_share = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE company_project_link_id = ?
      `,
      [
        project_id,
        role,
        role_detail,
        is_primary,
        notes,
        ownership_share,
        id,
      ]
    );

    const updated = await db.get(
      `
      SELECT
        cpl.company_project_link_id,
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
      WHERE cpl.company_project_link_id = ?
      `,
      [id]
    );

    return NextResponse.json({
      success: true,
      link: updated,
    });
  } catch (error) {
    console.error("PUT /api/company-project-links/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update company-project link" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();

    const existing = await db.get(
      `SELECT company_project_link_id FROM company_project_links WHERE company_project_link_id = ?`,
      [id]
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Link not found" },
        { status: 404 }
      );
    }

    await db.run(
      `DELETE FROM company_project_links WHERE company_project_link_id = ?`,
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/company-project-links/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete company-project link" },
      { status: 500 }
    );
  }
}