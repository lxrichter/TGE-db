import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import pg from "pg";

export const CORE_SQLITE_TABLES = [
  "companies",
  "company_plant_links",
  "company_project_links",
  "company_relationships",
  "company_roles",
  "plants",
  "projects",
  "ref_company_roles",
  "ref_company_type_primary",
  "ref_company_type_secondary",
  "users",
];

export const PRIMARY_KEYS = {
  companies: "company_id",
  company_plant_links: "company_plant_link_id",
  company_project_links: "company_project_link_id",
  company_relationships: "company_relationship_id",
  company_roles: "company_role_id",
  plants: "plant_id",
  projects: "project_id",
  ref_company_roles: "role_id",
  ref_company_type_primary: "type_name",
  ref_company_type_secondary: "type_name",
  users: "user_id",
};

const { Pool } = pg;

export function parseCommonArgs(argv, defaults = {}) {
  const args = {
    db: process.env.LIVE_SQLITE_DB || "",
    out: defaults.out || path.resolve(process.cwd(), "../source-data/live-sqlite-migration"),
    runLabel: defaults.runLabel || "",
    runId: "",
    execute: false,
    resetRun: false,
    resetTarget: false,
    writeResults: false,
    batchSize: 500,
    ensureSchema: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--db" && next) {
      args.db = path.resolve(next);
      index += 1;
    } else if (arg === "--out" && next) {
      args.out = path.resolve(next);
      index += 1;
    } else if (arg === "--run-label" && next) {
      args.runLabel = next.trim();
      index += 1;
    } else if (arg === "--run-id" && next) {
      args.runId = next.trim();
      index += 1;
    } else if (arg === "--batch-size" && next) {
      args.batchSize = Math.min(Math.max(Number(next) || 500, 1), 2000);
      index += 1;
    } else if (arg === "--execute") {
      args.execute = true;
    } else if (arg === "--reset-run") {
      args.resetRun = true;
    } else if (arg === "--reset-target") {
      args.resetTarget = true;
    } else if (arg === "--write-results") {
      args.writeResults = true;
    } else if (arg === "--no-ensure-schema") {
      args.ensureSchema = false;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    }
  }

  return args;
}

export function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_PUBLIC_URL or DATABASE_URL is not configured.");
  }

  return databaseUrl;
}

export function getSslConfig(databaseUrl) {
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

export function createPool() {
  const databaseUrl = getDatabaseUrl();

  return new Pool({
    connectionString: databaseUrl,
    max: 3,
    ssl: getSslConfig(databaseUrl),
  });
}

export async function ensureMigrationSchema(client) {
  const migrationPath = path.resolve(
    process.cwd(),
    "prisma/migrations/20260518000600_live_sqlite_migration_staging/migration.sql"
  );
  const sql = await fs.readFile(migrationPath, "utf8");
  await client.query(sql);
}

export async function openSqliteReadOnly(dbPath) {
  return open({
    filename: dbPath,
    driver: sqlite3.Database,
    mode: sqlite3.OPEN_READONLY,
  });
}

export async function sqliteTables(db) {
  const rows = await db.all(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `);

  return rows.map((row) => row.name);
}

export function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export async function sqliteRows(db, tableName) {
  return db.all(`SELECT * FROM ${quoteIdentifier(tableName)}`);
}

export async function sqliteTableCounts(db, tables) {
  const counts = {};

  for (const table of tables) {
    const row = await db.get(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(table)}`);
    counts[table] = Number(row?.count || 0);
  }

  return counts;
}

export async function sha256File(filePath) {
  const file = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(file).digest("hex");
}

export function defaultRunLabel(dbPath) {
  const fileName = path.basename(dbPath).replace(/\.(db|sqlite|sqlite3)$/i, "");
  return `${fileName}_${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`;
}

export function cleanString(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();
  return text || null;
}

export function normalizeName(value) {
  const text = cleanString(value);

  if (!text) {
    return null;
  }

  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function parseBoolean(value, defaultValue = false) {
  const text = cleanString(value);

  if (!text) {
    return defaultValue;
  }

  if (["1", "true", "yes", "y"].includes(text.toLowerCase())) {
    return true;
  }

  if (["0", "false", "no", "n"].includes(text.toLowerCase())) {
    return false;
  }

  return defaultValue;
}

export function parseStrictNumber(value) {
  const text = cleanString(value);

  if (!text) {
    return null;
  }

  const normalized = text.replace(/,/g, "");

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export function parseYearMonth(value) {
  const text = cleanString(value);

  if (!text) {
    return { year: null, month: null, raw: null };
  }

  const yearMatch = text.match(/\b(19\d{2}|20\d{2}|2100)\b/);
  const monthMatch = text.match(/\b(?:19\d{2}|20\d{2}|2100)[-/](0?[1-9]|1[0-2])\b/);

  return {
    year: yearMatch ? Number(yearMatch[1]) : null,
    month: monthMatch ? Number(monthMatch[1]) : null,
    raw: text,
  };
}

export function parseTimestamp(value) {
  const text = cleanString(value);

  if (!text) {
    return null;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function chunk(values, size) {
  const chunks = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

export async function insertRows(client, tableName, columns, rows, options = {}) {
  if (rows.length === 0) {
    return 0;
  }

  const {
    batchSize = 500,
    conflictColumns = [],
    updateColumns = columns.filter((column) => !conflictColumns.includes(column)),
  } = options;

  let inserted = 0;

  for (const batch of chunk(rows, batchSize)) {
    const values = [];
    const tuples = batch.map((row, rowIndex) => {
      const placeholders = columns.map((column, columnIndex) => {
        values.push(row[column] === undefined ? null : row[column]);
        return `$${rowIndex * columns.length + columnIndex + 1}`;
      });

      return `(${placeholders.join(", ")})`;
    });

    const conflictSql =
      conflictColumns.length > 0
        ? `ON CONFLICT (${conflictColumns.map(quoteIdentifier).join(", ")}) DO UPDATE SET ${updateColumns
            .map((column) => `${quoteIdentifier(column)} = EXCLUDED.${quoteIdentifier(column)}`)
            .join(", ")}`
        : "";

    await client.query(`
      INSERT INTO ${quoteIdentifier(tableName)}
        (${columns.map(quoteIdentifier).join(", ")})
      VALUES ${tuples.join(", ")}
      ${conflictSql}
    `, values);
    inserted += batch.length;
  }

  return inserted;
}

export async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function warningCounter(warnings) {
  return warnings.reduce((counts, warning) => {
    counts[warning.warning_code] = (counts[warning.warning_code] || 0) + 1;
    return counts;
  }, {});
}

export async function insertWarnings(client, runId, warnings, batchSize = 500) {
  const rows = warnings.map((warning) => ({
    run_id: runId,
    severity: warning.severity || "warning",
    warning_code: warning.warning_code,
    source_table: warning.source_table || null,
    legacy_primary_key: warning.legacy_primary_key || null,
    field_name: warning.field_name || null,
    warning_note: warning.warning_note || null,
    details: JSON.stringify(warning.details || {}),
  }));

  return insertRows(
    client,
    "live_sqlite_migration_warnings",
    [
      "run_id",
      "severity",
      "warning_code",
      "source_table",
      "legacy_primary_key",
      "field_name",
      "warning_note",
      "details",
    ],
    rows,
    { batchSize }
  );
}

export async function findRun(client, { runId, runLabel }) {
  if (runId) {
    const result = await client.query(
      "SELECT * FROM live_sqlite_migration_runs WHERE run_id = $1",
      [runId]
    );
    return result.rows[0] || null;
  }

  if (runLabel) {
    const result = await client.query(
      "SELECT * FROM live_sqlite_migration_runs WHERE run_label = $1",
      [runLabel]
    );
    return result.rows[0] || null;
  }

  const result = await client.query(`
    SELECT *
    FROM live_sqlite_migration_runs
    ORDER BY created_at DESC
    LIMIT 1
  `);
  return result.rows[0] || null;
}

export async function rawRowsByTable(client, runId, tableName) {
  const result = await client.query(
    `
    SELECT legacy_primary_key, row_data
    FROM live_sqlite_raw_rows
    WHERE run_id = $1
      AND source_table = $2
    ORDER BY source_row_number
    `,
    [runId, tableName]
  );

  return result.rows.map((row) => ({
    legacy_primary_key: row.legacy_primary_key,
    row_data: row.row_data,
  }));
}
