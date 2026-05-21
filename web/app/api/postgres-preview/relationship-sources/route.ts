import { NextResponse } from "next/server";
import { canEdit } from "@/lib/auth/roles";
import { createPostgresRelationshipSource } from "@/lib/postgres-preview";
import { getCurrentPostgresPreviewUser } from "@/lib/postgres-preview/entity-api";
import { parseRelationshipSourceMutationInput } from "@/lib/postgres-preview/relationships-api";

export async function POST(req: Request) {
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

    const parsed = await parseRelationshipSourceMutationInput(await req.json());

    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const relationshipSource = await createPostgresRelationshipSource({
      ...parsed.input,
      reviewedByUserId: user.id,
    });

    if (!relationshipSource) {
      return NextResponse.json(
        { success: false, error: "Failed to link relationship evidence." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, relationshipSource },
      { status: 201 }
    );
  } catch (error) {
    console.error("PostgreSQL relationship-source create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create relationship evidence link." },
      { status: 500 }
    );
  }
}
