import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_PUBLIC_URL or DATABASE_URL is not configured.");
  }

  return databaseUrl;
}

function getSslConfig(databaseUrl) {
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

const databaseUrl = getDatabaseUrl();
const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  ssl: getSslConfig(databaseUrl),
});

const seedPath = path.resolve(__dirname, "../../database/postgres/seed_staging.sql");
const seedSql = await fs.readFile(seedPath, "utf8");

try {
  await pool.query(seedSql);
  console.log("PostgreSQL staging seed applied");
} finally {
  await pool.end();
}
