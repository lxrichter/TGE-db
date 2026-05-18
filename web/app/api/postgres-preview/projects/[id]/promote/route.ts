import { NextResponse } from "next/server";
import { canPromoteProject } from "@/lib/auth/roles";
import { promotePostgresProjectToOperatingAsset } from "@/lib/postgres-preview";
import { getCurrentPostgresPreviewUser } from "@/lib/postgres-preview/entity-api";

function readPromotionNote(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const value = (body as Record<string, unknown>).promotion_note;
  return typeof value === "string" ? value.trim() || null : null;
}

export async function POST(
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

    if (!canPromoteProject(user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const promotion = await promotePostgresProjectToOperatingAsset({
      projectId: id,
      actorUserId: user.id,
      promotionNote: readPromotionNote(await req.json().catch(() => null)),
    });

    if (!promotion) {
      return NextResponse.json(
        { success: false, error: "Project not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, promotion });
  } catch (error) {
    console.error("PostgreSQL project promotion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to promote PostgreSQL project." },
      { status: 500 }
    );
  }
}
