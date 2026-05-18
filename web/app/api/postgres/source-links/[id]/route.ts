import { NextResponse } from "next/server";
import { canEdit } from "@/lib/auth/roles";
import { deleteSourceLink } from "@/lib/services/sources";
import { getCurrentSourceUser } from "@/lib/sources/source-api";

export async function DELETE(
  _req: Request,
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

    if (!canEdit(user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const sourceId = await deleteSourceLink(id);

    if (!sourceId) {
      return NextResponse.json(
        { success: false, error: "Source link not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, source_id: sourceId });
  } catch (error) {
    console.error("PostgreSQL source link delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete PostgreSQL source link." },
      { status: 500 }
    );
  }
}
