import { NextResponse } from "next/server";
import { canEdit, canReview } from "@/lib/auth/roles";
import {
  getPostgresEntityFormReferenceData,
  PostgresApprovalReadinessError,
  updatePostgresReviewStatus,
  type PostgresReviewEntityType,
} from "@/lib/postgres-preview";
import {
  getSourceReferenceData,
  updateSourceCredibilityStatus,
} from "@/lib/services/sources";
import { getCurrentPostgresPreviewUser } from "@/lib/postgres-preview/entity-api";

type StatusPayload = {
  entity_type?: unknown;
  entity_id?: unknown;
  status_code?: unknown;
  event_note?: unknown;
};

const reviewEntityTypes = new Set(["project", "operating_asset", "company"]);
const editorOnlyReviewStatuses = new Set(["approved", "export_ready", "archived"]);
const editorOnlySourceStatuses = new Set(["credible", "weak", "outdated", "rejected"]);

function asPayload(body: unknown): StatusPayload | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  return body as StatusPayload;
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanOptionalString(value: unknown) {
  return cleanString(value) || null;
}

function isReviewEntityType(value: string): value is PostgresReviewEntityType {
  return reviewEntityTypes.has(value);
}

export async function PATCH(req: Request) {
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
        { success: false, error: "Invalid status update payload." },
        { status: 400 }
      );
    }

    const entityType = cleanString(payload.entity_type);
    const entityId = cleanString(payload.entity_id);
    const statusCode = cleanString(payload.status_code);
    const eventNote = cleanOptionalString(payload.event_note);

    if (!entityType || !entityId || !statusCode) {
      return NextResponse.json(
        { success: false, error: "Entity type, entity ID, and status are required." },
        { status: 400 }
      );
    }

    if (entityType === "source") {
      if (editorOnlySourceStatuses.has(statusCode) && !canReview(user.role)) {
        return NextResponse.json(
          { success: false, error: "Only editors can set reviewed source states." },
          { status: 403 }
        );
      }

      const sourceReferenceData = await getSourceReferenceData();
      const validSourceStatus = sourceReferenceData.credibilityStatuses.some(
        (status) => status.code === statusCode && status.is_active
      );

      if (!validSourceStatus) {
        return NextResponse.json(
          { success: false, error: "Invalid source credibility status." },
          { status: 400 }
        );
      }

      const source = await updateSourceCredibilityStatus({
        sourceId: entityId,
        credibilityStatusCode: statusCode,
        reviewedByUserId: user.id,
      });

      if (!source) {
        return NextResponse.json(
          { success: false, error: "Source not found." },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        status: {
          entity_type: "source",
          entity_id: source.source_id,
          previous_review_status_code: null,
          next_review_status_code: source.credibility_status_code,
          updated_at: source.updated_at,
          event_note: eventNote,
        },
      });
    }

    if (!isReviewEntityType(entityType)) {
      return NextResponse.json(
        { success: false, error: "Invalid entity type for status update." },
        { status: 400 }
      );
    }

    if (editorOnlyReviewStatuses.has(statusCode) && !canReview(user.role)) {
      return NextResponse.json(
        { success: false, error: "Only editors can approve or archive records." },
        { status: 403 }
      );
    }

    const referenceData = await getPostgresEntityFormReferenceData();
    const validReviewStatus = referenceData.reviewStatuses.some(
      (status) => status.code === statusCode && status.is_active
    );

    if (!validReviewStatus) {
      return NextResponse.json(
        { success: false, error: "Invalid review status." },
        { status: 400 }
      );
    }

    const status = await updatePostgresReviewStatus({
      entityType,
      entityId,
      reviewStatusCode: statusCode,
      actorUserId: user.id,
      eventNote,
    });

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Record not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("PostgreSQL research ops status update error:", error);
    if (error instanceof PostgresApprovalReadinessError) {
      return NextResponse.json(
        { success: false, error: error.message, issues: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update PostgreSQL workflow status." },
      { status: 500 }
    );
  }
}
