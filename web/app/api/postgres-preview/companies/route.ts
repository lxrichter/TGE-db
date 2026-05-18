import { NextResponse } from "next/server";
import { canCreateDraft, canReview } from "@/lib/auth/roles";
import {
  createPostgresPreviewCompany,
  listPostgresPreviewCompanies,
} from "@/lib/postgres-preview";
import {
  getCurrentPostgresPreviewUser,
  parseCompanyMutationInput,
} from "@/lib/postgres-preview/entity-api";

export async function GET() {
  try {
    const companies = await listPostgresPreviewCompanies();
    return NextResponse.json({ success: true, companies });
  } catch (error) {
    console.error("PostgreSQL preview companies error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load PostgreSQL preview companies." },
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

    const company = await createPostgresPreviewCompany(parsed.input);
    return NextResponse.json({ success: true, company }, { status: 201 });
  } catch (error) {
    console.error("PostgreSQL preview company create error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create PostgreSQL preview company." },
      { status: 500 }
    );
  }
}
