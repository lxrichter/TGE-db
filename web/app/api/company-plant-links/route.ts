import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validateAssetLinkPayload } from "@/lib/validation/assetLinks";

function makeLinkId() {
  return `CPLANT-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
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

    const plant = await db.get(
      `SELECT plant_id, plant_name FROM plants WHERE plant_id = ?`,
      [plant_id]
    );

    if (!plant) {
      return NextResponse.json(
        { error: "Plant not found" },
        { status: 404 }
      );
    }

    const existing = await db.get(
      `
      SELECT company_plant_link_id
      FROM company_plant_links
      WHERE company_id = ?
        AND plant_id = ?
        AND LOWER(role) = LOWER(?)
      `,
      [company_id, plant_id, role]
    );

    if (existing) {
      return NextResponse.json(
        { error: "This company-plant-role link already exists" },
        { status: 409 }
      );
    }

    const company_plant_link_id = makeLinkId();

    await db.run(
      `
      INSERT INTO company_plant_links (
        company_plant_link_id,
        company_id,
        plant_id,
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
        company_plant_link_id,
        company_id,
        plant_id,
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
        cpl.company_plant_link_id,
        cpl.company_id,
        c.company_name,
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
      LEFT JOIN companies c
        ON cpl.company_id = c.company_id
      WHERE cpl.company_plant_link_id = ?
      `,
      [company_plant_link_id]
    );

    return NextResponse.json({
      success: true,
      link: created,
    });
  } catch (error) {
    console.error("POST /api/company-plant-links error:", error);

    return NextResponse.json(
      { error: "Failed to create company-plant link" },
      { status: 500 }
    );
  }
}