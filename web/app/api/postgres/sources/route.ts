import { NextResponse } from "next/server";
import { canCreateDraft, canReview } from "@/lib/auth/roles";
import { createSource, listSources } from "@/lib/services/sources";
import {
  getCurrentSourceUser,
  parseSourceMutationInput,
} from "@/lib/sources/source-api";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = Number(searchParams.get("limit") || 50);

    const sources = await listSources({
      limit: Number.isFinite(limitParam) ? limitParam : 50,
      search: searchParams.get("search") || undefined,
      sourceType: searchParams.get("sourceType") || undefined,
      visibility: searchParams.get("visibility") || undefined,
      status: searchParams.get("status") || undefined,
    });

    return NextResponse.json({ success: true, sources });
  } catch (error) {
    console.error("PostgreSQL sources list error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load PostgreSQL sources." },
      { status: 500 }
    );
  }
}

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

    const source = await createSource(parsed.input, user.id);
    return NextResponse.json({ success: true, source }, { status: 201 });
  } catch (error) {
    console.error("PostgreSQL source create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create PostgreSQL source." },
      { status: 500 }
    );
  }
}
