import { NextResponse } from "next/server";
import { canEdit } from "@/lib/auth/roles";
import { createPostgresCompanyOperatingAssetLink } from "@/lib/postgres-preview";
import { getCurrentPostgresPreviewUser } from "@/lib/postgres-preview/entity-api";
import { parseCompanyOperatingAssetLinkMutationInput } from "@/lib/postgres-preview/relationships-api";

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

    const parsed = await parseCompanyOperatingAssetLinkMutationInput(
      await req.json()
    );

    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const link = await createPostgresCompanyOperatingAssetLink(parsed.input);
    return NextResponse.json({ success: true, link }, { status: 201 });
  } catch (error) {
    console.error("PostgreSQL company-asset link create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create company-asset link." },
      { status: 500 }
    );
  }
}
