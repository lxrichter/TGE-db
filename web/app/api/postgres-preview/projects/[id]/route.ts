import { NextResponse } from "next/server";
import { canEdit, canReview } from "@/lib/auth/roles";
import {
  getPostgresPreviewProjectById,
  PostgresApprovalReadinessError,
  updatePostgresPreviewProject,
} from "@/lib/postgres-preview";
import {
  getCurrentPostgresPreviewUser,
  parseProjectMutationInput,
} from "@/lib/postgres-preview/entity-api";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const project = await getPostgresPreviewProjectById(id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("PostgreSQL preview project detail error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load PostgreSQL preview project." },
      { status: 500 }
    );
  }
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

    const { id } = await context.params;
    const parsed = await parseProjectMutationInput(
      await req.json(),
      canReview(user.role)
    );

    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const project = await updatePostgresPreviewProject(id, parsed.input, user.id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("PostgreSQL preview project update error:", error);
    if (error instanceof PostgresApprovalReadinessError) {
      return NextResponse.json(
        { success: false, error: error.message, issues: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update PostgreSQL preview project." },
      { status: 500 }
    );
  }
}
