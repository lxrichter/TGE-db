import { NextResponse } from "next/server";
import { canEdit, canReview } from "@/lib/auth/roles";
import {
  getPostgresPreviewCompanyById,
  updatePostgresPreviewCompany,
} from "@/lib/postgres-preview";
import {
  getCurrentPostgresPreviewUser,
  parseCompanyMutationInput,
} from "@/lib/postgres-preview/entity-api";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const company = await getPostgresPreviewCompanyById(id);

    if (!company) {
      return NextResponse.json(
        { success: false, error: "Company not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, company });
  } catch (error) {
    console.error("PostgreSQL preview company detail error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load PostgreSQL preview company." },
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
    const parsed = await parseCompanyMutationInput(
      await req.json(),
      canReview(user.role)
    );

    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const company = await updatePostgresPreviewCompany(id, parsed.input);

    if (!company) {
      return NextResponse.json(
        { success: false, error: "Company not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, company });
  } catch (error) {
    console.error("PostgreSQL preview company update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update PostgreSQL preview company." },
      { status: 500 }
    );
  }
}
