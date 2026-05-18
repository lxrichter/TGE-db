import { NextResponse } from "next/server";
import { canEdit } from "@/lib/auth/roles";
import { updatePostgresResearchOpsIssueStatus } from "@/lib/postgres-preview";
import { getCurrentPostgresPreviewUser } from "@/lib/postgres-preview/entity-api";

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

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params;
    const issueStatusCode = cleanString(payload.issue_status_code);

    if (!issueStatusCode) {
      return NextResponse.json(
        { success: false, error: "Issue status is required." },
        { status: 400 }
      );
    }

    const issue = await updatePostgresResearchOpsIssueStatus({
      issueId: id,
      issueStatusCode,
      actorUserId: user.id,
      eventNote: cleanOptionalString(payload.event_note),
    });

    if (!issue) {
      return NextResponse.json(
        { success: false, error: "Research issue not found or invalid." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, issue });
  } catch (error) {
    console.error("PostgreSQL research issue update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update PostgreSQL research issue." },
      { status: 500 }
    );
  }
}
