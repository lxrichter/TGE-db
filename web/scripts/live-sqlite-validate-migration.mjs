#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import {
  createPool,
  ensureMigrationSchema,
  findRun,
  insertRows,
  parseCommonArgs,
  writeJson,
} from "./live-sqlite-migration-utils.mjs";

function printHelp() {
  console.log(`
Usage:
  railway run --service Postgres -- npm run live-sqlite:validate -- --run-label "tge_live_20260518_213034"
  railway run --service Postgres -- npm run live-sqlite:validate -- --run-label "tge_live_20260518_213034" --write-results

Options:
  --run-label <label>  Migration run label. Defaults to latest run.
  --run-id <uuid>      Migration run id. Overrides run label.
  --out <dir>          Local ignored output directory.
  --write-results      Persist validation result rows into PostgreSQL.
  --no-ensure-schema   Do not apply the idempotent staging-table SQL first.

Validation reads PostgreSQL staging/final tables only. It does not import or
transform data.
`);
}

async function scalar(client, sql, params = []) {
  const result = await client.query(sql, params);
  return Number(Object.values(result.rows[0] || {})[0] || 0);
}

function statusFor(expected, actual) {
  return expected === actual ? "pass" : "fail";
}

function makeCheck(checkCode, checkLabel, expectedCount, actualCount, details = {}) {
  return {
    check_code: checkCode,
    check_label: checkLabel,
    expected_count: expectedCount,
    actual_count: actualCount,
    status: statusFor(expectedCount, actualCount),
    details,
  };
}

async function rawCount(client, runId, tableName) {
  return scalar(
    client,
    "SELECT COUNT(*)::int FROM live_sqlite_raw_rows WHERE run_id = $1 AND source_table = $2",
    [runId, tableName]
  );
}

async function validationChecks(client, run) {
  const runId = run.run_id;
  const checks = [];

  const rawProjects = await rawCount(client, runId, "projects");
  const rawPlants = await rawCount(client, runId, "plants");
  const rawCompanies = await rawCount(client, runId, "companies");
  const rawProjectLinks = await rawCount(client, runId, "company_project_links");
  const rawPlantLinks = await rawCount(client, runId, "company_plant_links");
  const rawRelationships = await rawCount(client, runId, "company_relationships");
  const rawRoleProfiles = await rawCount(client, runId, "company_roles");

  checks.push(makeCheck(
    "projects_legacy_count",
    "Projects imported by legacy ID",
    rawProjects,
    await scalar(client, `
      SELECT COUNT(*)::int
      FROM projects
      WHERE legacy_project_id IN (
        SELECT legacy_primary_key
        FROM live_sqlite_raw_rows
        WHERE run_id = $1 AND source_table = 'projects'
      )
    `, [runId])
  ));

  checks.push(makeCheck(
    "operating_assets_legacy_count",
    "Plants imported as operating assets by legacy ID",
    rawPlants,
    await scalar(client, `
      SELECT COUNT(*)::int
      FROM operating_assets
      WHERE legacy_plant_id IN (
        SELECT legacy_primary_key
        FROM live_sqlite_raw_rows
        WHERE run_id = $1 AND source_table = 'plants'
      )
    `, [runId])
  ));

  checks.push(makeCheck(
    "companies_legacy_count",
    "Companies imported by legacy ID",
    rawCompanies,
    await scalar(client, `
      SELECT COUNT(*)::int
      FROM companies
      WHERE legacy_company_id IN (
        SELECT legacy_primary_key
        FROM live_sqlite_raw_rows
        WHERE run_id = $1 AND source_table = 'companies'
      )
    `, [runId])
  ));

  checks.push(makeCheck(
    "company_project_links_count",
    "Company-project links imported",
    rawProjectLinks,
    await scalar(client, `
      SELECT COUNT(*)::int
      FROM company_project_links
      WHERE legacy_company_project_link_id IN (
        SELECT legacy_primary_key
        FROM live_sqlite_raw_rows
        WHERE run_id = $1
          AND source_table = 'company_project_links'
          AND legacy_primary_key IS NOT NULL
      )
    `, [runId])
  ));

  const blankPlantLinkIds = await scalar(client, `
    SELECT COUNT(*)::int
    FROM live_sqlite_raw_rows
    WHERE run_id = $1
      AND source_table = 'company_plant_links'
      AND legacy_primary_key IS NULL
  `, [runId]);

  checks.push(makeCheck(
    "company_asset_links_nonblank_legacy_count",
    "Company-asset links imported for nonblank legacy IDs",
    rawPlantLinks - blankPlantLinkIds,
    await scalar(client, `
      SELECT COUNT(*)::int
      FROM company_operating_asset_links
      WHERE legacy_company_plant_link_id IN (
        SELECT legacy_primary_key
        FROM live_sqlite_raw_rows
        WHERE run_id = $1
          AND source_table = 'company_plant_links'
          AND legacy_primary_key IS NOT NULL
      )
    `, [runId]),
    { blank_legacy_link_ids: blankPlantLinkIds }
  ));

  checks.push(makeCheck(
    "company_relationships_count",
    "Company relationships imported",
    rawRelationships,
    await scalar(client, `
      SELECT COUNT(*)::int
      FROM company_relationships
      WHERE legacy_company_relationship_id IN (
        SELECT legacy_primary_key
        FROM live_sqlite_raw_rows
        WHERE run_id = $1 AND source_table = 'company_relationships'
      )
    `, [runId])
  ));

  checks.push(makeCheck(
    "company_role_profiles_count",
    "Company role profiles imported",
    rawRoleProfiles,
    await scalar(client, `
      SELECT COUNT(*)::int
      FROM company_role_profiles
      WHERE legacy_company_role_id IN (
        SELECT legacy_primary_key
        FROM live_sqlite_raw_rows
        WHERE run_id = $1 AND source_table = 'company_roles'
      )
    `, [runId])
  ));

  const orphanChecks = [
    {
      code: "orphan_company_project_links",
      label: "No orphan company-project links",
      sql: `
        SELECT COUNT(*)::int
        FROM company_project_links link
        LEFT JOIN companies company ON company.company_id = link.company_id
        LEFT JOIN projects project ON project.project_id = link.project_id
        WHERE company.company_id IS NULL OR project.project_id IS NULL
      `,
    },
    {
      code: "orphan_company_asset_links",
      label: "No orphan company-asset links",
      sql: `
        SELECT COUNT(*)::int
        FROM company_operating_asset_links link
        LEFT JOIN companies company ON company.company_id = link.company_id
        LEFT JOIN operating_assets asset ON asset.operating_asset_id = link.operating_asset_id
        WHERE company.company_id IS NULL OR asset.operating_asset_id IS NULL
      `,
    },
    {
      code: "orphan_company_relationships",
      label: "No orphan company relationships",
      sql: `
        SELECT COUNT(*)::int
        FROM company_relationships relationship
        LEFT JOIN companies company_from ON company_from.company_id = relationship.company_id_from
        LEFT JOIN companies company_to ON company_to.company_id = relationship.company_id_to
        WHERE company_from.company_id IS NULL OR company_to.company_id IS NULL
      `,
    },
  ];

  for (const check of orphanChecks) {
    checks.push(makeCheck(check.code, check.label, 0, await scalar(client, check.sql)));
  }

  const warningCounts = await client.query(
    `
    SELECT warning_code, COUNT(*)::int AS count
    FROM live_sqlite_migration_warnings
    WHERE run_id = $1
    GROUP BY warning_code
    ORDER BY count DESC, warning_code ASC
    `,
    [runId]
  );

  return {
    checks,
    warning_counts: warningCounts.rows,
    failed_checks: checks.filter((check) => check.status !== "pass"),
  };
}

async function writeValidationResults(client, runId, checks) {
  const rows = checks.map((check) => ({
    run_id: runId,
    check_code: check.check_code,
    check_label: check.check_label,
    expected_count: check.expected_count,
    actual_count: check.actual_count,
    status: check.status,
    details: JSON.stringify(check.details || {}),
  }));

  await insertRows(
    client,
    "live_sqlite_migration_validation_results",
    [
      "run_id",
      "check_code",
      "check_label",
      "expected_count",
      "actual_count",
      "status",
      "details",
    ],
    rows,
    {
      conflictColumns: ["run_id", "check_code"],
      updateColumns: ["check_label", "expected_count", "actual_count", "status", "details"],
    }
  );

  await client.query(
    "UPDATE live_sqlite_migration_runs SET validation_completed_at = now(), updated_at = now() WHERE run_id = $1",
    [runId]
  );
}

const args = parseCommonArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const pool = createPool();
const client = await pool.connect();

try {
  if (args.ensureSchema) {
    await ensureMigrationSchema(client);
  }

  const run = await findRun(client, args);

  if (!run) {
    throw new Error("Migration run not found. Run live-sqlite:stage first.");
  }

  const result = await validationChecks(client, run);
  const report = {
    generated_at: new Date().toISOString(),
    run_id: run.run_id,
    run_label: run.run_label,
    status: result.failed_checks.length === 0 ? "pass" : "fail",
    checks: result.checks,
    warning_counts: result.warning_counts,
  };

  if (args.writeResults) {
    await writeValidationResults(client, run.run_id, result.checks);
  }

  await writeJson(path.join(args.out, "validation_result.json"), report);

  console.log(`Validated migration run ${run.run_label}`);
  console.log(`Status: ${report.status}`);
  console.log(`Checks: ${result.checks.length}; failed: ${result.failed_checks.length}`);
  console.log(`Wrote ${path.join(args.out, "validation_result.json")}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
