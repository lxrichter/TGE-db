import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { getDb } from "@/lib/db";
import {
  canApproveRecord,
  type UserRole,
} from "@/lib/auth/roles";

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
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const db = await getDb();

    const plant = await db.get(
      `
      SELECT
        p.plant_id,
        p.plant_name,
        p.review_status,
        p.created_by_user_id,
        p.last_updated_by_user_id,
        uc.role AS created_by_role,
        uu.role AS last_updated_by_role
      FROM plants p
      LEFT JOIN users uc
        ON uc.user_id = p.created_by_user_id
      LEFT JOIN users uu
        ON uu.user_id = p.last_updated_by_user_id
      WHERE p.plant_id = ?
      `,
      [id]
    );

    if (!plant) {
      return NextResponse.json(
        { error: "Plant not found" },
        { status: 404 }
      );
    }

    const allowed = canApproveRecord({
      role: user.role,
      currentUserId: user.id,
      createdByUserId: plant.created_by_user_id,
      lastUpdatedByUserId: plant.last_updated_by_user_id,
      createdByRole: plant.created_by_role as UserRole | null,
      lastUpdatedByRole: plant.last_updated_by_role as UserRole | null,
    });

    if (!allowed) {
      return NextResponse.json(
        { error: "You are not allowed to approve this plant" },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();

    await db.run(
      `
      UPDATE plants
      SET
        review_status = 'approved',
        approved_by_user_id = ?,
        approved_at = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE plant_id = ?
      `,
      [user.id, now, id]
    );

    const updated = await db.get(
      `
      SELECT
        p.*,
        uc.name AS created_by_name,
        uu.name AS last_updated_by_name,
        ua.name AS approved_by_name
      FROM plants p
      LEFT JOIN users uc
        ON uc.user_id = p.created_by_user_id
      LEFT JOIN users uu
        ON uu.user_id = p.last_updated_by_user_id
      LEFT JOIN users ua
        ON ua.user_id = p.approved_by_user_id
      WHERE p.plant_id = ?
      `,
      [id]
    );

    return NextResponse.json({
      success: true,
      plant: updated,
    });
  } catch (error) {
    console.error("POST /api/plants/[id]/approve error:", error);

    return NextResponse.json(
      { error: "Failed to approve plant" },
      { status: 500 }
    );
  }
}