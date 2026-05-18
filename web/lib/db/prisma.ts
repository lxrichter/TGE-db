import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  type PrismaClient as TgePrismaClient,
} from "@/prisma/generated/client/client";
import type { PoolConfig } from "pg";

declare global {
  var tgePrismaClient: TgePrismaClient | undefined;
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

  if (!databaseUrl || databaseUrl.trim() === "") {
    throw new Error("DATABASE_PUBLIC_URL or DATABASE_URL is not configured.");
  }

  return databaseUrl;
}

function getSslConfig(databaseUrl: string): PoolConfig["ssl"] {
  const sslMode = process.env.DATABASE_SSL || process.env.PGSSLMODE;

  if (sslMode === "false" || sslMode === "disable") {
    return false;
  }

  if (sslMode === "true" || sslMode === "require") {
    return { rejectUnauthorized: false };
  }

  if (databaseUrl.includes("railway.internal") || databaseUrl.includes("rlwy.net")) {
    return { rejectUnauthorized: false };
  }

  return false;
}

function createPrismaClient() {
  const databaseUrl = getDatabaseUrl();
  const poolConfig: PoolConfig = {
    connectionString: databaseUrl,
    max: Number(process.env.DATABASE_POOL_MAX || 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: getSslConfig(databaseUrl),
  };

  return new PrismaClient({
    adapter: new PrismaPg(poolConfig),
  });
}

export function getPrismaClient() {
  if (!globalThis.tgePrismaClient) {
    globalThis.tgePrismaClient = createPrismaClient();
  }

  return globalThis.tgePrismaClient;
}

export async function closePrismaClient() {
  if (globalThis.tgePrismaClient) {
    await globalThis.tgePrismaClient.$disconnect();
    globalThis.tgePrismaClient = undefined;
  }
}
