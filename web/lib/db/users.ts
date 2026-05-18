import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import {
  normalizeUserRole,
  type CanonicalUserRole,
  type UserRole,
} from "@/lib/auth/roles";

export type DbUser = {
  user_id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: number;
  created_at: string;
};

export type SafeUser = {
  user_id: string;
  name: string;
  email: string;
  role: CanonicalUserRole;
  is_active: number;
  created_at: string;
};

export async function getUserSummary() {
  const db = await getDb();

  const total = await db.get(`SELECT COUNT(*) as count FROM users`);
  const active = await db.get(
    `SELECT COUNT(*) as count FROM users WHERE is_active = 1`
  );
  const admins = await db.get(
    `SELECT COUNT(*) as count
     FROM users
     WHERE role IN ('admin', 'administrator') AND is_active = 1`
  );
  const editors = await db.get(
    `SELECT COUNT(*) as count
     FROM users
     WHERE role IN ('editor', 'senior_editor', 'reviewer', 'editor_export', 'editor_plus', 'editor+') AND is_active = 1`
  );
  const researchers = await db.get(
    `SELECT COUNT(*) as count
     FROM users
     WHERE role IN ('researcher', 'viewer', 'analyst') AND is_active = 1`
  );

  return {
    total: total?.count || 0,
    active: active?.count || 0,
    admins: admins?.count || 0,
    editors: editors?.count || 0,
    researchers: researchers?.count || 0,
  };
}

export async function listUsers(): Promise<SafeUser[]> {
  const db = await getDb();

  const users = await db.all<DbUser[]>(
    `
    SELECT user_id, name, email, role, is_active, created_at
    FROM users
    ORDER BY is_active DESC, created_at DESC, name ASC
    `
  );

  return users.map((user) => ({
    ...user,
    role: normalizeUserRole(user.role) ?? "researcher",
  }));
}

export async function getUserByEmail(
  email: string
): Promise<DbUser | undefined> {
  const db = await getDb();

  const user = await db.get<DbUser>(
    `
    SELECT user_id, name, email, password_hash, role, is_active, created_at
    FROM users
    WHERE lower(email) = lower(?)
    LIMIT 1
    `,
    email
  );

  return user;
}

export async function getUserById(
  userId: string
): Promise<DbUser | undefined> {
  const db = await getDb();

  const user = await db.get<DbUser>(
    `
    SELECT user_id, name, email, password_hash, role, is_active, created_at
    FROM users
    WHERE user_id = ?
    LIMIT 1
    `,
    userId
  );

  return user;
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<SafeUser> {
  const db = await getDb();

  const existing = await getUserByEmail(input.email);

  if (existing) {
    throw new Error("A user with this email already exists.");
  }

  const userId = randomUUID();
  const passwordHash = await bcrypt.hash(input.password, 10);
  const role = normalizeUserRole(input.role);

  if (!role) {
    throw new Error("Invalid user role.");
  }

  await db.run(
    `
    INSERT INTO users (
      user_id,
      name,
      email,
      password_hash,
      role,
      is_active
    )
    VALUES (?, ?, ?, ?, ?, 1)
    `,
    userId,
    input.name.trim(),
    input.email.trim().toLowerCase(),
    passwordHash,
    role
  );

  const created = await db.get<SafeUser>(
    `
    SELECT user_id, name, email, role, is_active, created_at
    FROM users
    WHERE user_id = ?
    `,
    userId
  );

  if (!created) {
    throw new Error("User was created but could not be reloaded.");
  }

  return {
    ...created,
    role: normalizeUserRole(created.role) ?? "researcher",
  };
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<void> {
  const db = await getDb();
  const normalizedRole = normalizeUserRole(role);

  if (!normalizedRole) {
    throw new Error("Invalid user role.");
  }

  await db.run(
    `
    UPDATE users
    SET role = ?
    WHERE user_id = ?
    `,
    normalizedRole,
    userId
  );
}

export async function updateUserDetails(input: {
  userId: string;
  name: string;
  role: UserRole;
  password?: string;
}): Promise<void> {
  const db = await getDb();

  const cleanName = input.name.trim();
  const role = normalizeUserRole(input.role);

  if (!cleanName) {
    throw new Error("Name cannot be empty.");
  }

  if (!role) {
    throw new Error("Invalid user role.");
  }

  if (input.password && input.password.trim().length > 0) {
    const passwordHash = await bcrypt.hash(input.password.trim(), 10);

    await db.run(
      `
      UPDATE users
      SET name = ?, role = ?, password_hash = ?
      WHERE user_id = ?
      `,
      cleanName,
      role,
      passwordHash,
      input.userId
    );
  } else {
    await db.run(
      `
      UPDATE users
      SET name = ?, role = ?
      WHERE user_id = ?
      `,
      cleanName,
      role,
      input.userId
    );
  }
}

export async function deactivateUser(userId: string): Promise<void> {
  const db = await getDb();

  await db.run(
    `
    UPDATE users
    SET is_active = 0
    WHERE user_id = ?
    `,
    userId
  );
}
