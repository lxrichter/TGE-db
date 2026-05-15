import { NextResponse } from "next/server";
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
      SELECT company_plant_link_id, company_id
      FROM company_plant_links
      WHERE company_plant_link_id = ?
      `,
      [id]
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Plant link not found" },
        { status: 404 }
      );
    }

    const plant_id = body.plant_id?.trim() || "";
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
      assetLabel: "plant",
      assetId: plant_id,
      role,
      ownershipShare: ownershipShareRaw,
    });

    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    const plant = await db.get(
      `SELECT plant_id FROM plants WHERE plant_id = ?`,
      [plant_id]
    );

    if (!plant) {
      return NextResponse.json(
        { error: "Plant not found" },
        { status: 404 }
      );
    }

    const duplicate = await db.get(
      `
      SELECT company_plant_link_id
      FROM company_plant_links
      WHERE company_id = ?
        AND plant_id = ?
        AND LOWER(role) = LOWER(?)
        AND company_plant_link_id <> ?
      `,
      [existing.company_id, plant_id, role, id]
    );

    if (duplicate) {
      return NextResponse.json(
        { error: "This company-plant-role link already exists" },
        { status: 409 }
      );
    }

    await db.run(
      `
      UPDATE company_plant_links
      SET
        plant_id = ?,
        role = ?,
        role_detail = ?,
        is_primary = ?,
        notes = ?,
        ownership_share = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE company_plant_link_id = ?
      `,
      [
        plant_id,
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
        cpl.company_plant_link_id,
        cpl.plant_id,
        cpl.role,
        cpl.role_detail,
        cpl.is_primary,
        cpl.notes,
        cpl.ownership_share,
        p.plant_name
      FROM company_plant_links cpl
      LEFT JOIN plants p
        ON cpl.plant_id = p.plant_id
      WHERE cpl.company_plant_link_id = ?
      `,
      [id]
    );

    return NextResponse.json({
      success: true,
      link: updated,
    });
  } catch (error) {
    console.error("PUT /api/company-plant-links/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update plant link" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();

    const existing = await db.get(
      `SELECT company_plant_link_id FROM company_plant_links WHERE company_plant_link_id = ?`,
      [id]
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Plant link not found" },
        { status: 404 }
      );
    }

    await db.run(
      `DELETE FROM company_plant_links WHERE company_plant_link_id = ?`,
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/company-plant-links/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete plant link" },
      { status: 500 }
    );
  }
}