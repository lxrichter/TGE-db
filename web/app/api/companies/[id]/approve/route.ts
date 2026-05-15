import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { type UserRole } from "@/lib/auth/roles";

type SessionUser = {
  id: string;
  role: UserRole;
};

async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as Partial<SessionUser> | undefined;

  if (!user?.id || !user?.role) {
    return null;
  }

  return {
    id: user.id,
    role: user.role,
  };
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await getDb();

    const existing = await db.get(
      `SELECT company_id, review_status FROM companies WHERE company_id = ?`,
      [id]
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    const approvedAt = new Date().toISOString();

    await db.run(
      `
      UPDATE companies
      SET
        review_status = 'Approved',
        approved_by_user_id = ?,
        approved_at = ?,
        date_edited = COALESCE(date_edited, ?),
        updated_at = CURRENT_TIMESTAMP
      WHERE company_id = ?
      `,
      [user.id, approvedAt, approvedAt.slice(0, 10), id]
    );

    const company = await db.get(
      `
      SELECT
        c.*,
        u1.name AS created_by_name,
        u2.name AS last_updated_by_name,
        u3.name AS approved_by_name
      FROM companies c
      LEFT JOIN users u1 ON c.created_by_user_id = u1.user_id
      LEFT JOIN users u2 ON c.last_updated_by_user_id = u2.user_id
      LEFT JOIN users u3 ON c.approved_by_user_id = u3.user_id
      WHERE c.company_id = ?
      `,
      [id]
    );

    return NextResponse.json({ success: true, company });
  } catch (error) {
    console.error("POST /api/companies/[id]/approve error:", error);
    return NextResponse.json(
      { error: "Failed to approve company" },
      { status: 500 }
    );
  }
}