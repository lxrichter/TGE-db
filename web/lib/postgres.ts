import { Pool, type PoolConfig, type QueryResult, type QueryResultRow } from "pg";

declare global {
  var tgePostgresPool: Pool | undefined;
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

function createPool() {
  const databaseUrl = getDatabaseUrl();

  return new Pool({
    connectionString: databaseUrl,
    max: Number(process.env.DATABASE_POOL_MAX || 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: getSslConfig(databaseUrl),
  });
}

export function getPostgresPool() {
  if (!globalThis.tgePostgresPool) {
    globalThis.tgePostgresPool = createPool();
  }

  return globalThis.tgePostgresPool;
}

export async function queryPostgres<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: unknown[]
): Promise<QueryResult<T>> {
  return getPostgresPool().query<T>(text, values);
}

export async function closePostgresPool() {
  if (globalThis.tgePostgresPool) {
    await globalThis.tgePostgresPool.end();
    globalThis.tgePostgresPool = undefined;
  }
}
