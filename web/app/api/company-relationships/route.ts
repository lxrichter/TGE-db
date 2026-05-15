import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function makeRelationshipId() {
  return `CR-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function normalizeOwnershipPercentage(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0 || parsed > 100) return null;

  return parsed;
}

function normalizeRelationshipType(value: string) {
  return value
    .toLowerCase()
    .replace(/[/_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function relationshipRequiresOwnershipPercentage(relationshipType: string) {
  const normalized = normalizeRelationshipType(relationshipType);

  return (
    normalized.includes("owner") ||
    normalized.includes("ownership") ||
    normalized.includes("shareholder") ||
    normalized.includes("investor") ||
    normalized.includes("stake") ||
    normalized.includes("joint venture") ||
    normalized.includes("joint venture partner") ||
    normalized.includes("equity")
  );
}

function validateRelationshipPayload(input: {
  company_id_from: string;
  company_id_to: string;
  relationship_type: string;
  ownershipPercentageRaw: string;
}) {
  if (!input.company_id_from) {
    return "Source company is required.";
  }

  if (!input.company_id_to) {
    return "Related company is required.";
  }

  if (input.company_id_from === input.company_id_to) {
    return "A company cannot have a relationship to itself.";
  }

  if (!input.relationship_type) {
    return "Relationship type is required.";
  }

  if (
    input.ownershipPercentageRaw !== "" &&
    normalizeOwnershipPercentage(input.ownershipPercentageRaw) === null
  ) {
    return "Ownership Percentage must be a number between 0 and 100.";
  }

  if (
    relationshipRequiresOwnershipPercentage(input.relationship_type) &&
    input.ownershipPercentageRaw === ""
  ) {
    return "Ownership Percentage is required for ownership, shareholder, investor, stake, equity, or joint venture relationships.";
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const db = await getDb();
    const body = await req.json();

    const company_id_from = body.company_id_from?.trim() || "";
    const company_id_to = body.company_id_to?.trim() || "";
    const relationship_type = body.relationship_type?.trim() || "";
    const ownershipPercentageRaw =
      body.ownership_percentage === undefined || body.ownership_percentage === null
        ? ""
        : String(body.ownership_percentage).trim();
    const ownership_percentage = normalizeOwnershipPercentage(
      body.ownership_percentage
    );
    const is_current =
      body.is_current === undefined || body.is_current === null
        ? 1
        : body.is_current
        ? 1
        : 0;
    const notes = body.notes?.trim() || null;

    const validationError = validateRelationshipPayload({
      company_id_from,
      company_id_to,
      relationship_type,
      ownershipPercentageRaw,
    });

    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    const companyFrom = await db.get(
      `SELECT company_id, company_name FROM companies WHERE company_id = ?`,
      [company_id_from]
    );

    if (!companyFrom) {
      return NextResponse.json(
        { error: "Source company not found" },
        { status: 404 }
      );
    }

    const companyTo = await db.get(
      `SELECT company_id, company_name FROM companies WHERE company_id = ?`,
      [company_id_to]
    );

    if (!companyTo) {
      return NextResponse.json(
        { error: "Related company not found" },
        { status: 404 }
      );
    }

    const existing = await db.get(
      `
      SELECT company_relationship_id
      FROM company_relationships
      WHERE company_id_from = ?
        AND company_id_to = ?
        AND LOWER(relationship_type) = LOWER(?)
      `,
      [company_id_from, company_id_to, relationship_type]
    );

    if (existing) {
      return NextResponse.json(
        { error: "This company relationship already exists" },
        { status: 409 }
      );
    }

    const company_relationship_id = makeRelationshipId();

    await db.run(
      `
      INSERT INTO company_relationships (
        company_relationship_id,
        company_id_from,
        company_id_to,
        relationship_type,
        ownership_percentage,
        is_current,
        notes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [
        company_relationship_id,
        company_id_from,
        company_id_to,
        relationship_type,
        ownership_percentage,
        is_current,
        notes,
      ]
    );

    const created = await db.get(
      `
      SELECT
        cr.company_relationship_id,
        cr.company_id_from,
        cr.company_id_to,
        cr.relationship_type,
        cr.ownership_percentage,
        cr.is_current,
        cr.notes,
        cfrom.company_name AS company_name_from,
        cto.company_name AS company_name_to
      FROM company_relationships cr
      LEFT JOIN companies cfrom
        ON cr.company_id_from = cfrom.company_id
      LEFT JOIN companies cto
        ON cr.company_id_to = cto.company_id
      WHERE cr.company_relationship_id = ?
      `,
      [company_relationship_id]
    );

    return NextResponse.json({
      success: true,
      relationship: created,
    });
  } catch (error) {
    console.error("POST /api/company-relationships error:", error);

    return NextResponse.json(
      { error: "Failed to create company relationship" },
      { status: 500 }
    );
  }
}