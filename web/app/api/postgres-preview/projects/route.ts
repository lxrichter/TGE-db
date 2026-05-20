import { NextResponse } from "next/server";
import { canCreateDraft, canReview } from "@/lib/auth/roles";
import {
  createPostgresPreviewProject,
  listPostgresPreviewProjects,
  PostgresApprovalReadinessError,
} from "@/lib/postgres-preview";
import {
  getCurrentPostgresPreviewUser,
  parseProjectMutationInput,
} from "@/lib/postgres-preview/entity-api";

export async function GET() {
  try {
    const projects = await listPostgresPreviewProjects();
    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error("PostgreSQL preview projects error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load PostgreSQL preview projects." },
      { status: 500 }
    );
  }
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

    if (!canCreateDraft(user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions." },
        { status: 403 }
      );
    }

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

    const project = await createPostgresPreviewProject(parsed.input);
    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    console.error("PostgreSQL preview project create error:", error);
    if (error instanceof PostgresApprovalReadinessError) {
      return NextResponse.json(
        { success: false, error: error.message, issues: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create PostgreSQL preview project." },
      { status: 500 }
    );
  }
}
