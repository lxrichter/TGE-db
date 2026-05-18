import { NextResponse } from "next/server";
import { canCreateDraft, canReview } from "@/lib/auth/roles";
import {
  createPostgresPreviewOperatingAsset,
  listPostgresPreviewOperatingAssets,
} from "@/lib/postgres-preview";
import {
  getCurrentPostgresPreviewUser,
  parseOperatingAssetMutationInput,
} from "@/lib/postgres-preview/entity-api";

export async function GET() {
  try {
    const operatingAssets = await listPostgresPreviewOperatingAssets();
    return NextResponse.json({ success: true, operatingAssets });
  } catch (error) {
    console.error("PostgreSQL preview operating assets error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load PostgreSQL preview operating assets.",
      },
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

    const parsed = await parseOperatingAssetMutationInput(
      await req.json(),
      canReview(user.role)
    );

    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const operatingAsset = await createPostgresPreviewOperatingAsset(parsed.input);
    return NextResponse.json(
      { success: true, operatingAsset },
      { status: 201 }
    );
  } catch (error) {
    console.error("PostgreSQL preview operating asset create error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create PostgreSQL preview operating asset.",
      },
      { status: 500 }
    );
  }
}
