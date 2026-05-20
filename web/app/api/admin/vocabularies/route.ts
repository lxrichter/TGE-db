import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { canManageVocabularies } from "@/lib/auth/roles";
import {
  createVocabularyItem,
  listVocabularyGroups,
  updateVocabularyItem,
} from "@/lib/services/admin-vocabularies";

function getRole(session: unknown) {
  return (session as { user?: { role?: string | null } } | null)?.user?.role;
}

async function requireVocabularyAccess() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  if (!canManageVocabularies(getRole(session))) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return { ok: true as const };
}

export async function GET() {
  const access = await requireVocabularyAccess();

  if (!access.ok) {
    return access.response;
  }

  try {
    return NextResponse.json({
      success: true,
      groups: await listVocabularyGroups(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load controlled vocabularies.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const access = await requireVocabularyAccess();

  if (!access.ok) {
    return access.response;
  }

  try {
    const item = await createVocabularyItem(await req.json());
    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create vocabulary item.",
      },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const access = await requireVocabularyAccess();

  if (!access.ok) {
    return access.response;
  }

  try {
    const item = await updateVocabularyItem(await req.json());
    return NextResponse.json({ success: true, item });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update vocabulary item.",
      },
      { status: 400 }
    );
  }
}
