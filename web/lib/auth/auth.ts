import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isActiveUser(value: any) {
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

        const user = await db.get(
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
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
    async redirect({ baseUrl }) {
      return `${baseUrl}/projects`;
    },
  },
};