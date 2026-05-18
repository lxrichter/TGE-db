import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { normalizeUserRole, type UserRole } from "@/lib/auth/roles";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

type AuthDbUser = {
  user_id: string;
  name: string;
  email: string;
  password_hash: string | null;
  role: UserRole | string | null;
  is_active: boolean | number | string;
};

type SessionUserWithRole = {
  id?: string;
  role?: UserRole | string | null;
};

function isActiveUser(value: boolean | number | string) {
  return value === 1 || value === true || value === "1";
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = normalizeEmail(credentials.email);
        const password = credentials.password;

        const db = await getDb();

        const user = await db.get<AuthDbUser>(
          `
          SELECT user_id, name, email, password_hash, role, is_active
          FROM users
          WHERE LOWER(TRIM(email)) = ?
          LIMIT 1
          `,
          [email]
        );

        if (!user) {
          return null;
        }

        if (!isActiveUser(user.is_active)) {
          return null;
        }

        const role = normalizeUserRole(user.role);

        if (!role) {
          return null;
        }

        if (!user.password_hash || typeof user.password_hash !== "string") {
          return null;
        }

        const valid = await bcrypt.compare(password, user.password_hash);

        if (!valid) {
          return null;
        }

        return {
          id: String(user.user_id),
          name: user.name,
          email: user.email,
          role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const roleUser = user as SessionUserWithRole;
        token.id = roleUser.id;
        token.role = normalizeUserRole(roleUser.role);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const roleUser = session.user as SessionUserWithRole;
        roleUser.id = typeof token.id === "string" ? token.id : undefined;
        roleUser.role =
          typeof token.role === "string" ? normalizeUserRole(token.role) : null;
      }
      return session;
    },
    async redirect({ baseUrl }) {
      return `${baseUrl}/projects`;
    },
  },
};
