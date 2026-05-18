import { NextResponse } from "next/server";
import { canCreateDraft } from "@/lib/auth/roles";
import { createSourceLink } from "@/lib/services/sources";
import {
  getCurrentSourceUser,
  parseSourceLinkMutationInput,
} from "@/lib/sources/source-api";

export async function POST(req: Request) {
  try {
    const user = await getCurrentSourceUser();

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

    const parsed = await parseSourceLinkMutationInput(await req.json());

    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const link = await createSourceLink({
      ...parsed.input,
      reviewedByUserId: user.id,
    });
    return NextResponse.json({ success: true, link }, { status: 201 });
  } catch (error) {
    console.error("PostgreSQL source link create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create PostgreSQL source link." },
      { status: 500 }
    );
  }
}
