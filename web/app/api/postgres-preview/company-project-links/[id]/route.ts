import { NextResponse } from "next/server";
import { canEdit } from "@/lib/auth/roles";
import { deletePostgresCompanyProjectLink } from "@/lib/postgres-preview";
import { getCurrentPostgresPreviewUser } from "@/lib/postgres-preview/entity-api";

export async function DELETE(
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
    const deleted = await deletePostgresCompanyProjectLink(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Company-project link not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PostgreSQL company-project link delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete company-project link." },
      { status: 500 }
    );
  }
}
