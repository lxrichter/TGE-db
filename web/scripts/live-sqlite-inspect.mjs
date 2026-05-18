#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const DEFAULT_OUT_DIR = path.resolve(
  process.cwd(),
  "../source-data/live-sqlite-inspection"
);

const SENSITIVE_COLUMN_PATTERNS = [
  /password/i,
  /hash/i,
  /token/i,
  /secret/i,
  /email/i,
  /phone/i,
  /note/i,
  /comment/i,
  /client/i,
  /confidential/i,
  /internal/i,
];

function parseArgs(argv) {
  const args = {
    db: process.env.LIVE_SQLITE_DB || "",
    out: process.env.LIVE_SQLITE_INSPECTION_OUT || DEFAULT_OUT_DIR,
    profileValues: false,
    tables: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--db" && next) {
      args.db = next;
      index += 1;
    } else if (arg === "--out" && next) {
      args.out = next;
      index += 1;
    } else if (arg === "--table" && next) {
      args.tables.push(next);
      index += 1;
    } else if (arg === "--profile-values") {
      args.profileValues = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return {
    ...args,
    db: args.db ? path.resolve(args.db) : "",
    out: path.resolve(args.out),
    tables: args.tables.map((table) => table.trim()).filter(Boolean),
  };
}

function printHelp() {
  console.log(`
Usage:
  npm run sqlite:inspect -- --db "../shared/data/tge.db"
  npm run sqlite:inspect -- --db "/path/to/live-export.db" --profile-values

Options:
  --db <file>          SQLite database copy to inspect. Required.
  --out <dir>          Output directory. Defaults to ../source-data/live-sqlite-inspection.
  --table <name>       Restrict inspection to a table. Can be repeated.
  --profile-values     Add safe aggregate value metrics: null/blank counts,
                       distinct counts, and text length ranges. No raw row
                       values are written.

Privacy:
  This command opens the SQLite file read-only. It writes schema, row counts,
  column metadata, indexes, foreign keys, and optional aggregate metrics only.
  It does not write row samples, source text, user details, notes, or article
  body text.
`);
}

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function csvValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function toCsv(headers, rows) {
  return [
    headers.map(csvValue).join(","),
    ...rows.map((row) => headers.map((header) => csvValue(row[header])).join(",")),
  ].join("\n");
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeCsv(filePath, headers, rows) {
  await fs.writeFile(filePath, `${toCsv(headers, rows)}\n`, "utf8");
}

async function openReadOnlyDatabase(dbPath) {
  return open({
    filename: dbPath,
    driver: sqlite3.Database,
    mode: sqlite3.OPEN_READONLY,
  });
}

async function all(db, sql, params = []) {
  return db.all(sql, params);
}

async function get(db, sql, params = []) {
  return db.get(sql, params);
}

async function scalar(db, sql, params = []) {
  const row = await get(db, sql, params);

  if (!row) {
    return null;
  }

  return Object.values(row)[0] ?? null;
}

async function getObjects(db) {
  return all(
    db,
    `
    SELECT type, name, tbl_name, sql
    FROM sqlite_master
    WHERE type IN ('table', 'view', 'index', 'trigger')
      AND name NOT LIKE 'sqlite_%'
    ORDER BY type, name
    `
  );
}

async function getTables(db) {
  return all(
    db,
    `
    SELECT name, sql
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
    ORDER BY name
    `
  );
}

async function getViews(db) {
  return all(
    db,
    `
    SELECT name, sql
    FROM sqlite_master
    WHERE type = 'view'
      AND name NOT LIKE 'sqlite_%'
    ORDER BY name
    `
  );
}

async function getTableInfo(db, tableName) {
  return all(db, `PRAGMA table_info(${quoteIdentifier(tableName)})`);
}

async function getForeignKeys(db, tableName) {
  return all(db, `PRAGMA foreign_key_list(${quoteIdentifier(tableName)})`);
}

async function getIndexes(db, tableName) {
  const indexes = await all(db, `PRAGMA index_list(${quoteIdentifier(tableName)})`);
  const rows = [];

  for (const index of indexes) {
    const columns = await all(
      db,
      `PRAGMA index_info(${quoteIdentifier(index.name)})`
    );

    rows.push({
      table_name: tableName,
      index_name: index.name,
      unique: Number(index.unique || 0),
      origin: index.origin || "",
      partial: Number(index.partial || 0),
      columns: columns.map((column) => column.name).filter(Boolean).join("|"),
    });
  }

  return rows;
}

async function getForeignKeyCheckSummary(db) {
  return all(
    db,
    `
    SELECT
      "table" AS table_name,
      parent AS referenced_table,
      fkid AS foreign_key_id,
      COUNT(*) AS violation_count
    FROM pragma_foreign_key_check
    GROUP BY "table", parent, fkid
    ORDER BY violation_count DESC, table_name ASC, referenced_table ASC, foreign_key_id ASC
    `
  );
}

async function getRowCount(db, tableName) {
  return Number(
    (await scalar(db, `SELECT COUNT(*) AS row_count FROM ${quoteIdentifier(tableName)}`)) ||
      0
  );
}

function isSensitiveColumn(columnName) {
  return SENSITIVE_COLUMN_PATTERNS.some((pattern) => pattern.test(columnName));
}

async function getSafeValueProfile(db, tableName, columnName) {
  const tableSql = quoteIdentifier(tableName);
  const columnSql = quoteIdentifier(columnName);

  return get(
    db,
    `
    SELECT
      COUNT(*) AS row_count,
      SUM(
        CASE
          WHEN ${columnSql} IS NULL
            OR TRIM(CAST(${columnSql} AS TEXT)) = ''
          THEN 1 ELSE 0
        END
      ) AS null_or_blank_count,
      COUNT(DISTINCT
        CASE
          WHEN ${columnSql} IS NOT NULL
            AND TRIM(CAST(${columnSql} AS TEXT)) <> ''
          THEN TRIM(CAST(${columnSql} AS TEXT))
        END
      ) AS distinct_non_blank_count,
      MIN(
        CASE
          WHEN ${columnSql} IS NOT NULL
            AND TRIM(CAST(${columnSql} AS TEXT)) <> ''
          THEN LENGTH(TRIM(CAST(${columnSql} AS TEXT)))
        END
      ) AS min_text_length,
      MAX(
        CASE
          WHEN ${columnSql} IS NOT NULL
            AND TRIM(CAST(${columnSql} AS TEXT)) <> ''
          THEN LENGTH(TRIM(CAST(${columnSql} AS TEXT)))
        END
      ) AS max_text_length
    FROM ${tableSql}
    `
  );
}

function buildSchemaSql(objects) {
  const statements = objects
    .filter((object) => object.sql)
    .map((object) => `${object.sql.trim()};`);

  return `${statements.join("\n\n")}\n`;
}

function filterTables(tables, requestedTables) {
  if (requestedTables.length === 0) {
    return tables;
  }

  const requested = new Set(requestedTables);
  return tables.filter((table) => requested.has(table.name));
}

async function inspect(args) {
  if (!args.db) {
    throw new Error("--db is required. Run with --help for usage.");
  }

  await fs.access(args.db);
  await fs.mkdir(args.out, { recursive: true });

  const dbStats = await fs.stat(args.db);
  const db = await openReadOnlyDatabase(args.db);

  try {
    const generatedAt = new Date().toISOString();
    const sqliteVersion = await scalar(db, "SELECT sqlite_version() AS version");
    const quickCheckRows = await all(db, "PRAGMA quick_check");
    const objects = await getObjects(db);
    const views = await getViews(db);
    const tables = filterTables(await getTables(db), args.tables);
    const availableTableNames = new Set((await getTables(db)).map((table) => table.name));
    const missingRequestedTables = args.tables.filter(
      (tableName) => !availableTableNames.has(tableName)
    );

    if (missingRequestedTables.length > 0) {
      throw new Error(
        `Requested table(s) not found: ${missingRequestedTables.join(", ")}`
      );
    }

    const tableRows = [];
    const columnRows = [];
    const foreignKeyRows = [];
    const foreignKeyCheckRows = await getForeignKeyCheckSummary(db);
    const indexRows = [];
    const valueProfileRows = [];
    const sensitiveColumnRows = [];
    const foreignKeyViolationCount = foreignKeyCheckRows.reduce(
      (sum, row) => sum + Number(row.violation_count || 0),
      0
    );

    for (const table of tables) {
      const columns = await getTableInfo(db, table.name);
      const rowCount = await getRowCount(db, table.name);

      tableRows.push({
        table_name: table.name,
        row_count: rowCount,
        column_count: columns.length,
      });

      for (const column of columns) {
        const sensitiveFlag = isSensitiveColumn(column.name);

        columnRows.push({
          table_name: table.name,
          column_id: column.cid,
          column_name: column.name,
          data_type: column.type || "",
          not_null: Number(column.notnull || 0),
          default_value_present: column.dflt_value === null ? 0 : 1,
          primary_key_position: Number(column.pk || 0),
          sensitive_name_warning: sensitiveFlag ? 1 : 0,
        });

        if (sensitiveFlag) {
          sensitiveColumnRows.push({
            table_name: table.name,
            column_name: column.name,
            reason: "Column name suggests sensitive/internal content; no row values were exported.",
          });
        }

        if (args.profileValues) {
          const profile = await getSafeValueProfile(db, table.name, column.name);

          valueProfileRows.push({
            table_name: table.name,
            column_name: column.name,
            row_count: Number(profile?.row_count || 0),
            null_or_blank_count: Number(profile?.null_or_blank_count || 0),
            distinct_non_blank_count: Number(profile?.distinct_non_blank_count || 0),
            min_text_length:
              profile?.min_text_length === null || profile?.min_text_length === undefined
                ? ""
                : Number(profile.min_text_length),
            max_text_length:
              profile?.max_text_length === null || profile?.max_text_length === undefined
                ? ""
                : Number(profile.max_text_length),
          });
        }
      }

      foreignKeyRows.push(
        ...(await getForeignKeys(db, table.name)).map((foreignKey) => ({
          table_name: table.name,
          foreign_key_id: foreignKey.id,
          sequence: foreignKey.seq,
          referenced_table: foreignKey.table,
          from_column: foreignKey.from,
          to_column: foreignKey.to,
          on_update: foreignKey.on_update,
          on_delete: foreignKey.on_delete,
          match: foreignKey.match,
        }))
      );

      indexRows.push(...(await getIndexes(db, table.name)));
    }

    const summary = {
      generated_at: generatedAt,
      database_file: args.db,
      database_file_name: path.basename(args.db),
      database_size_bytes: dbStats.size,
      sqlite_version: sqliteVersion,
      quick_check: quickCheckRows,
      inspected_table_count: tables.length,
      view_count: views.length,
      object_count: objects.length,
      foreign_key_violation_count: foreignKeyViolationCount,
      profile_values_enabled: args.profileValues,
      privacy_note:
        "No raw row values, row samples, source text, notes, user details, or article body text are written by this script.",
      output_files: [
        "summary.json",
        "tables.csv",
        "columns.csv",
        "foreign_keys.csv",
        "foreign_key_check.csv",
        "indexes.csv",
        "schema.sql",
        "sensitive_columns.csv",
        ...(args.profileValues ? ["value_profiles.csv"] : []),
      ],
    };

    await writeJson(path.join(args.out, "summary.json"), summary);
    await writeCsv(path.join(args.out, "tables.csv"), [
      "table_name",
      "row_count",
      "column_count",
    ], tableRows);
    await writeCsv(path.join(args.out, "columns.csv"), [
      "table_name",
      "column_id",
      "column_name",
      "data_type",
      "not_null",
      "default_value_present",
      "primary_key_position",
      "sensitive_name_warning",
    ], columnRows);
    await writeCsv(path.join(args.out, "foreign_keys.csv"), [
      "table_name",
      "foreign_key_id",
      "sequence",
      "referenced_table",
      "from_column",
      "to_column",
      "on_update",
      "on_delete",
      "match",
    ], foreignKeyRows);
    await writeCsv(path.join(args.out, "foreign_key_check.csv"), [
      "table_name",
      "referenced_table",
      "foreign_key_id",
      "violation_count",
    ], foreignKeyCheckRows);
    await writeCsv(path.join(args.out, "indexes.csv"), [
      "table_name",
      "index_name",
      "unique",
      "origin",
      "partial",
      "columns",
    ], indexRows);
    await writeCsv(path.join(args.out, "sensitive_columns.csv"), [
      "table_name",
      "column_name",
      "reason",
    ], sensitiveColumnRows);
    await fs.writeFile(path.join(args.out, "schema.sql"), buildSchemaSql(objects), "utf8");

    if (args.profileValues) {
      await writeCsv(path.join(args.out, "value_profiles.csv"), [
        "table_name",
        "column_name",
        "row_count",
        "null_or_blank_count",
        "distinct_non_blank_count",
        "min_text_length",
        "max_text_length",
      ], valueProfileRows);
    }

    console.log(`Inspected ${tables.length} table(s) from ${args.db}`);
    console.log(`Wrote safe SQLite inspection files to ${args.out}`);

    if (foreignKeyViolationCount > 0) {
      console.log(`Found ${foreignKeyViolationCount} aggregate foreign-key check issue(s).`);
    }

    if (!args.profileValues) {
      console.log("Tip: add --profile-values for aggregate null/distinct/length metrics.");
    }
  } finally {
    await db.close();
  }
}

try {
  const args = parseArgs(process.argv.slice(2));
  await inspect(args);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
