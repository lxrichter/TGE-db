#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  CORE_SQLITE_TABLES,
  PRIMARY_KEYS,
  cleanString,
  createPool,
  defaultRunLabel,
  ensureMigrationSchema,
  insertRows,
  openSqliteReadOnly,
  parseCommonArgs,
  sha256File,
  sqliteRows,
  sqliteTableCounts,
  sqliteTables,
  writeJson,
} from "./live-sqlite-migration-utils.mjs";

function printHelp() {
  console.log(`
Usage:
  npm run live-sqlite:stage -- --db "../migration/live_exports/2026-05-18/tge_live_20260518_213034.db"
  railway run --service Postgres -- npm run live-sqlite:stage -- --db "../migration/live_exports/2026-05-18/tge_live_20260518_213034.db" --execute --reset-run

Options:
  --db <file>          Local copied SQLite database. Required.
  --run-label <label>  Stable migration run label. Defaults from DB filename and timestamp.
  --out <dir>          Local ignored output directory.
  --batch-size <n>     PostgreSQL write batch size. Defaults to 500.
  --execute            Write raw rows into PostgreSQL staging. Without this, only a local plan is written.
  --reset-run          Delete any existing staging run with the same run label before importing.
  --no-ensure-schema   Do not apply the idempotent staging-table SQL before import.

Privacy:
  Dry-run mode writes counts and metadata only. Execute mode uploads raw copied
  SQLite rows into PostgreSQL staging tables for controlled migration testing.
`);
}

function legacyPrimaryKey(tableName, row) {
  const primaryKeyColumn = PRIMARY_KEYS[tableName];
  return cleanString(row[primaryKeyColumn]);
}

async function buildPlan(dbPath) {
  await fs.access(dbPath);
  const stats = await fs.stat(dbPath);
  const db = await openSqliteReadOnly(dbPath);

  try {
    const tables = await sqliteTables(db);
    const selectedTables = CORE_SQLITE_TABLES.filter((table) => tables.includes(table));
    const missingExpectedTables = CORE_SQLITE_TABLES.filter((table) => !tables.includes(table));
    const tableCounts = await sqliteTableCounts(db, selectedTables);

    return {
      database_file: dbPath,
      database_file_name: path.basename(dbPath),
      database_size_bytes: stats.size,
      database_sha256: await sha256File(dbPath),
      selected_tables: selectedTables,
      missing_expected_tables: missingExpectedTables,
      table_counts: tableCounts,
      total_rows: Object.values(tableCounts).reduce((sum, count) => sum + count, 0),
    };
  } finally {
    await db.close();
  }
}

async function writeDryRunPlan(args, plan) {
  await writeJson(path.join(args.out, "staging_import_plan.json"), {
    generated_at: new Date().toISOString(),
    execute: false,
    run_label: args.runLabel,
    plan,
    next_execute_command:
      `railway run --service Postgres -- npm run live-sqlite:stage -- --db "${plan.database_file}" --run-label "${args.runLabel}" --execute --reset-run`,
  });
}

async function importToPostgres(args, plan) {
  const pool = createPool();
  const client = await pool.connect();
  const db = await openSqliteReadOnly(args.db);

  try {
    await client.query("BEGIN");

    if (args.ensureSchema) {
      await ensureMigrationSchema(client);
    }

    if (args.resetRun) {
      await client.query(
        "DELETE FROM live_sqlite_migration_runs WHERE run_label = $1",
        [args.runLabel]
      );
    }

    const runResult = await client.query(
      `
      INSERT INTO live_sqlite_migration_runs (
        run_label,
        source_database_file_name,
        source_database_size_bytes,
        source_database_sha256,
        source_table_counts,
        status,
        import_started_at,
        notes
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, 'importing', now(), $6)
      ON CONFLICT (run_label) DO UPDATE SET
        source_database_file_name = EXCLUDED.source_database_file_name,
        source_database_size_bytes = EXCLUDED.source_database_size_bytes,
        source_database_sha256 = EXCLUDED.source_database_sha256,
        source_table_counts = EXCLUDED.source_table_counts,
        status = 'importing',
        import_started_at = now(),
        updated_at = now()
      RETURNING run_id
      `,
      [
        args.runLabel,
        plan.database_file_name,
        plan.database_size_bytes,
        plan.database_sha256,
        JSON.stringify(plan.table_counts),
        "Imported from copied Hetzner SQLite backup into raw staging.",
      ]
    );
    const runId = runResult.rows[0].run_id;

    await client.query("DELETE FROM live_sqlite_raw_rows WHERE run_id = $1", [runId]);

    const importedCounts = {};

    for (const tableName of plan.selected_tables) {
      const rows = await sqliteRows(db, tableName);
      importedCounts[tableName] = rows.length;

      const stagingRows = rows.map((row, index) => ({
        run_id: runId,
        source_table: tableName,
        source_row_number: index + 1,
        legacy_primary_key: legacyPrimaryKey(tableName, row),
        row_data: JSON.stringify(row),
      }));

      await insertRows(
        client,
        "live_sqlite_raw_rows",
        ["run_id", "source_table", "source_row_number", "legacy_primary_key", "row_data"],
        stagingRows,
        {
          batchSize: args.batchSize,
          conflictColumns: ["run_id", "source_table", "source_row_number"],
        }
      );
    }

    await client.query(
      `
      UPDATE live_sqlite_migration_runs
      SET status = 'staged',
          import_completed_at = now(),
          updated_at = now()
      WHERE run_id = $1
      `,
      [runId]
    );

    await client.query("COMMIT");

    await writeJson(path.join(args.out, "staging_import_result.json"), {
      generated_at: new Date().toISOString(),
      execute: true,
      run_id: runId,
      run_label: args.runLabel,
      imported_counts: importedCounts,
    });

    console.log(`Imported live SQLite raw rows into PostgreSQL staging run ${args.runLabel}`);
    console.log(`Run ID: ${runId}`);
    for (const [tableName, count] of Object.entries(importedCounts)) {
      console.log(`- ${tableName}: ${count}`);
    }
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await db.close();
    client.release();
    await pool.end();
  }
}

const args = parseCommonArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

try {
  if (!args.db) {
    throw new Error("--db is required.");
  }

  if (!args.runLabel) {
    args.runLabel = defaultRunLabel(args.db);
  }

  const plan = await buildPlan(args.db);

  if (!args.execute) {
    await writeDryRunPlan(args, plan);
    console.log(`Prepared staging import dry-run plan for ${plan.database_file_name}`);
    console.log(`Run label: ${args.runLabel}`);
    console.log(`Rows planned: ${plan.total_rows}`);
    console.log(`Wrote ${path.join(args.out, "staging_import_plan.json")}`);
  } else {
    await importToPostgres(args, plan);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
