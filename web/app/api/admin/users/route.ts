import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/auth";
import { canManageUsers, type UserRole } from "@/lib/auth/roles";
import {
  createUser,
  deactivateUser,
  getUserById,
  listUsers,
  updateUserDetails,
  updateUserRole,
} from "@/lib/db/users";

function isValidRole(role: string): role is UserRole {
  return (
    role === "viewer" ||
    role === "editor" ||
    role === "editor_export" ||
    role === "administrator"
  );
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string | null }).role;

  if (!canManageUsers(role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await listUsers();
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string | null }).role;

  if (!canManageUsers(role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, password, role: newRole } = body ?? {};

  if (!name || !email || !password || !newRole) {
    return NextResponse.json(
      { error: "Name, email, password, and role are required." },
      { status: 400 }
    );
  }

  if (!isValidRole(newRole)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  try {
    const user = await createUser({
      name,
      email,
      password,
      role: newRole,
    });

    return NextResponse.json({ user });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create user.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string | null }).role;

  if (!canManageUsers(role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, role: nextRole, name, password, mode } = body ?? {};

  if (!userId) {
    return NextResponse.json(
      { error: "User ID is required." },
      { status: 400 }
    );
  }

  if (mode === "edit") {
    if (!name || !nextRole) {
      return NextResponse.json(
        { error: "Name and role are required." },
        { status: 400 }
      );
    }

    if (!isValidRole(nextRole)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    try {
      await updateUserDetails({
        userId,
        name,
        role: nextRole,
        password,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not update user.";

      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (!nextRole) {
    return NextResponse.json(
      { error: "Role is required." },
      { status: 400 }
    );
  }

  if (!isValidRole(nextRole)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  await updateUserRole(userId, nextRole);

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string | null }).role;
  const sessionEmail = session.user.email;

  if (!canManageUsers(role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { userId } = body ?? {};

  if (!userId) {
    return NextResponse.json(
      { error: "User ID is required." },
      { status: 400 }
    );
  }

  const targetUser = await getUserById(userId);

  if (!targetUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (
    sessionEmail &&
    targetUser.email.toLowerCase() === sessionEmail.toLowerCase()
  ) {
    return NextResponse.json(
      { error: "You cannot deactivate your own account." },
      { status: 400 }
    );
  }

  await deactivateUser(userId);

  return NextResponse.json({ success: true });
}