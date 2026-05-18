import { NextResponse } from "next/server";
import { canReview } from "@/lib/auth/roles";
import {
  getSourceReferenceData,
  updateSourceCredibilityStatus,
} from "@/lib/services/sources";
import { getCurrentSourceUser } from "@/lib/sources/source-api";

function readStatusCode(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "";
  }

  const value = (body as Record<string, unknown>).credibility_status_code;
  return typeof value === "string" ? value.trim() : "";
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentSourceUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    if (!canReview(user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const requestedStatus = readStatusCode(await req.json());

    if (!requestedStatus) {
      return NextResponse.json(
        { success: false, error: "Source credibility status is required." },
        { status: 400 }
      );
    }

    const referenceData = await getSourceReferenceData();
    const validStatus = referenceData.credibilityStatuses.some(
      (status) => status.code === requestedStatus && status.is_active
    );

    if (!validStatus) {
      return NextResponse.json(
        { success: false, error: "Invalid source credibility status." },
        { status: 400 }
      );
    }

    const source = await updateSourceCredibilityStatus({
      sourceId: id,
      credibilityStatusCode: requestedStatus,
      reviewedByUserId: user.id,
    });

    if (!source) {
      return NextResponse.json(
        { success: false, error: "Source not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, source });
  } catch (error) {
    console.error("PostgreSQL source status update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update source credibility status." },
      { status: 500 }
    );
  }
}
