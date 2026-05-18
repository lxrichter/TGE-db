import { NextResponse } from "next/server";
import { canReview } from "@/lib/auth/roles";
import {
  updateSourceMatchCandidates,
  type SourceMatchCandidateAction,
} from "@/lib/services/sources";
import { getCurrentSourceUser } from "@/lib/sources/source-api";

function asRecord(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  return body as Record<string, unknown>;
}

function parseAction(value: unknown): SourceMatchCandidateAction | null {
  if (value === "confirm" || value === "reject" || value === "needs_review") {
    return value;
  }

  return null;
}

function parseCandidateIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export async function PATCH(req: Request) {
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

    const body = asRecord(await req.json());
    const action = parseAction(body?.action);
    const candidateIds = parseCandidateIds(body?.candidateIds);

    if (!action || candidateIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Select candidates and a valid action." },
        { status: 400 }
      );
    }

    const result = await updateSourceMatchCandidates({
      candidateIds,
      action,
      actorUserId: user.id,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("PostgreSQL source match candidate update error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update PostgreSQL source match candidates.",
      },
      { status: 500 }
    );
  }
}
