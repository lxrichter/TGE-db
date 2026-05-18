import { NextResponse } from "next/server";
import { canEdit, canReview } from "@/lib/auth/roles";
import { getSourceById, updateSource } from "@/lib/services/sources";
import {
  getCurrentSourceUser,
  parseSourceMutationInput,
} from "@/lib/sources/source-api";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const source = await getSourceById(id);

    if (!source) {
      return NextResponse.json(
        { success: false, error: "Source not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, source });
  } catch (error) {
    console.error("PostgreSQL source detail error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load PostgreSQL source." },
      { status: 500 }
    );
  }
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

    if (!canEdit(user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const parsed = await parseSourceMutationInput(
      await req.json(),
      canReview(user.role)
    );

    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const source = await updateSource(id, parsed.input);

    if (!source) {
      return NextResponse.json(
        { success: false, error: "Source not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, source });
  } catch (error) {
    console.error("PostgreSQL source update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update PostgreSQL source." },
      { status: 500 }
    );
  }
}
