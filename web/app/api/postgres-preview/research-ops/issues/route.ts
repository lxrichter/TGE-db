import { NextResponse } from "next/server";
import { canEdit } from "@/lib/auth/roles";
import {
  createPostgresResearchOpsIssue,
  type PostgresResearchOpsIssueEntityType,
} from "@/lib/postgres-preview";
import { getCurrentPostgresPreviewUser } from "@/lib/postgres-preview/entity-api";

const entityTypes = new Set(["project", "operating_asset", "company", "source"]);

function asPayload(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  return body as Record<string, unknown>;
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanOptionalString(value: unknown) {
  return cleanString(value) || null;
}

function cleanBoolean(value: unknown) {
  return value === true || value === "true";
}

function isIssueEntityType(
  value: string
): value is PostgresResearchOpsIssueEntityType {
  return entityTypes.has(value);
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentPostgresPreviewUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    if (!canEdit(user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions." },
        { status: 403 }
      );
    }

    const payload = asPayload(await req.json());

    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid research issue payload." },
        { status: 400 }
      );
    }

    const entityType = cleanString(payload.entity_type);
    const entityId = cleanString(payload.entity_id);
    const issueTypeCode = cleanString(payload.issue_type_code);
    const title = cleanString(payload.title);

    if (!isIssueEntityType(entityType)) {
      return NextResponse.json(
        { success: false, error: "Invalid entity type." },
        { status: 400 }
      );
    }

    if (!entityId || !issueTypeCode || !title) {
      return NextResponse.json(
        {
          success: false,
          error: "Entity ID, issue type, and title are required.",
        },
        { status: 400 }
      );
    }

    const issue = await createPostgresResearchOpsIssue({
      entityType,
      entityId,
      issueTypeCode,
      title,
      description: cleanOptionalString(payload.description),
      linkedField: cleanOptionalString(payload.linked_field),
      assignToUserId: cleanBoolean(payload.assign_to_self) ? user.id : null,
      actorUserId: user.id,
    });

    if (!issue) {
      return NextResponse.json(
        { success: false, error: "Could not create research issue." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, issue }, { status: 201 });
  } catch (error) {
    console.error("PostgreSQL research issue create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create PostgreSQL research issue." },
      { status: 500 }
    );
  }
}
