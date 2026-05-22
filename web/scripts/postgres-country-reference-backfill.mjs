#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Pool } = pg;

const DEFAULT_OUT_DIR = path.resolve(
  process.cwd(),
  "../source-data/country-reference-backfill"
);

const ENTITY_CONFIGS = {
  project: {
    label: "projects",
    tableName: "projects",
    idColumn: "project_id",
    nameColumn: "project_name",
    countryIdColumn: "country_id",
    countryColumn: "country",
    regionColumn: "region",
    wbRegionColumn: "wb_region",
  },
  operating_asset: {
    label: "plants",
    tableName: "operating_assets",
    idColumn: "operating_asset_id",
    nameColumn: "asset_name",
    countryIdColumn: "country_id",
    countryColumn: "country",
    regionColumn: "region",
    wbRegionColumn: "wb_region",
  },
  company: {
    label: "companies",
    tableName: "companies",
    idColumn: "company_id",
    nameColumn: "company_name",
    countryIdColumn: "headquarters_country_id",
    countryColumn: "headquarters_country",
    regionColumn: "region",
    wbRegionColumn: "wb_region",
  },
};

function parseArgs(argv) {
  const args = {
    out: process.env.TGE_COUNTRY_BACKFILL_OUT || DEFAULT_OUT_DIR,
    execute: false,
    allowRemoteDb: false,
    entity: "all",
    limit: 0,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--out" && next) {
      args.out = path.resolve(next);
      index += 1;
    } else if (arg === "--execute") {
      args.execute = true;
    } else if (arg === "--allow-remote-db") {
      args.allowRemoteDb = true;
    } else if (arg === "--entity" && next) {
      args.entity = next.trim();
      index += 1;
    } else if (arg === "--limit" && next) {
      args.limit = Math.max(Number(next) || 0, 0);
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (args.entity !== "all" && !ENTITY_CONFIGS[args.entity]) {
    throw new Error(
      `Unsupported --entity value "${args.entity}". Use all, project, operating_asset, or company.`
    );
  }

  return args;
}

function printHelp() {
  console.log(`
Usage:
  npm run postgres:countries:backfill
  DATABASE_URL="postgresql://localhost:5432/tge_local" npm run postgres:countries:backfill -- --execute

Options:
  --execute          Apply canonical country references. Default is dry-run only.
  --allow-remote-db  Allow --execute against a non-local DATABASE_URL.
  --entity <type>    all, project, operating_asset, or company. Defaults to all.
  --limit <n>        Max rows per entity type to inspect. Defaults to 0 / unlimited.
  --out <dir>        Output directory. Defaults to ../source-data/country-reference-backfill.

Safety:
  Dry-run writes CSV and JSON review files only.
  Execute mode is blocked for remote databases unless --allow-remote-db is passed.
  The script only updates country_id, country display text, TGE region, and WB region.
  It does not approve records, create sources, or change review status.
`);
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_PUBLIC_URL or DATABASE_URL is not configured.");
  }

  return databaseUrl;
}

function isLocalDatabaseUrl(databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  } catch {
    return false;
  }
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

function normalizeCountry(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function addAlias(aliasMap, alias, country, reason = "alias") {
  const key = normalizeCountry(alias);

  if (!key || aliasMap.has(key)) {
    return;
  }

  aliasMap.set(key, { country, reason });
}

function buildCountryAliasMap(countries) {
  const aliasMap = new Map();
  const byIso3 = new Map(countries.map((country) => [country.iso3, country]));
  const byName = new Map(countries.map((country) => [country.country_name, country]));

  for (const country of countries) {
    addAlias(aliasMap, country.country_name, country, "exact_country_name");
    addAlias(aliasMap, country.iso3, country, "iso3");
  }

  const aliases = [
    ["Turkey", "Türkiye"],
    ["Turkiye", "Türkiye"],
    ["USA", "United States"],
    ["US", "United States"],
    ["U.S.", "United States"],
    ["U.S.A.", "United States"],
    ["United States of America", "United States"],
    ["UK", "United Kingdom"],
    ["U.K.", "United Kingdom"],
    ["Great Britain", "United Kingdom"],
    ["Britain", "United Kingdom"],
    ["Russian Federation", "Russia"],
    ["Republic of Korea", "South Korea"],
    ["Korea Republic", "South Korea"],
    ["Korea, Rep.", "South Korea"],
    ["South Korea", "South Korea"],
    ["Lao PDR", "Laos"],
    ["Lao People's Democratic Republic", "Laos"],
    ["Iran, Islamic Rep.", "Iran"],
    ["Islamic Republic of Iran", "Iran"],
    ["Venezuela, RB", "Venezuela"],
    ["Congo DRC", "Congo (DRC)"],
    ["Democratic Republic of Congo", "Congo (DRC)"],
    ["Democratic Republic of the Congo", "Congo (DRC)"],
    ["DR Congo", "Congo (DRC)"],
    ["Republic of Congo", "Congo, Rep."],
    ["Congo Republic", "Congo, Rep."],
    ["Egypt, Arab Rep.", "Egypt"],
    ["Czechia", "Czech Republic"],
    ["Slovakia", "Slovak Republic"],
    ["Saint Kitts and Nevis", "St. Kitts & Nevis"],
    ["Saint Lucia", "St. Lucia"],
    ["Saint Vincent and the Grenadines", "St. Vincent & the Grenadines"],
    ["Reunion", "La Réunion"],
    ["Réunion", "La Réunion"],
    ["Bonaire Sint Eustatius and Saba", "Caribbean Netherlands"],
    ["Bonaire, Sint Eustatius and Saba", "Caribbean Netherlands"],
    ["Northern Marianas", "Northern Mariana Islands"],
    ["Commonwealth of the Northern Mariana Islands", "Northern Mariana Islands"],
    ["CNMI", "Northern Mariana Islands"],
  ];

  for (const [alias, countryName] of aliases) {
    const country = byName.get(countryName) || byIso3.get(countryName);

    if (country) {
      addAlias(aliasMap, alias, country, "curated_alias");
    }
  }

  return aliasMap;
}

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function toCsv(rows) {
  const columns = [
    "decision",
    "entity_type",
    "entity_id",
    "entity_name",
    "current_country_id",
    "current_country",
    "current_tge_region",
    "current_wb_region",
    "matched_country_id",
    "matched_country",
    "matched_iso3",
    "matched_tge_region",
    "matched_wb_region",
    "match_reason",
  ];
  const lines = [columns.join(",")];

  for (const row of rows) {
    lines.push(columns.map((column) => csvEscape(row[column])).join(","));
  }

  return `${lines.join("\n")}\n`;
}

function countBy(rows, key) {
  const counts = new Map();

  for (const row of rows) {
    const value = row[key] || "unknown";
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .map(([value, count]) => ({ value, count }));
}

async function loadCountries(pool) {
  const result = await pool.query(`
    SELECT
      country_id::text,
      country_name,
      iso3,
      wb_region,
      tge_region
    FROM countries_reference
    WHERE is_active = TRUE
    ORDER BY country_name ASC
  `);

  return result.rows;
}

async function listEntityRows(pool, entityType, limit) {
  const config = ENTITY_CONFIGS[entityType];
  const limitSql = limit > 0 ? `LIMIT ${Number(limit)}` : "";
  const result = await pool.query(`
    SELECT
      '${entityType}'::text AS entity_type,
      ${config.idColumn}::text AS entity_id,
      ${config.nameColumn}::text AS entity_name,
      ${config.countryIdColumn}::text AS current_country_id,
      ${config.countryColumn}::text AS current_country,
      ${config.regionColumn}::text AS current_tge_region,
      ${config.wbRegionColumn}::text AS current_wb_region
    FROM ${config.tableName}
    WHERE ${config.countryColumn} IS NOT NULL
      AND trim(${config.countryColumn}) <> ''
    ORDER BY ${config.nameColumn} ASC
    ${limitSql}
  `);

  return result.rows;
}

function evaluateRow(row, aliasMap) {
  const normalizedCountry = normalizeCountry(row.current_country);
  const match = aliasMap.get(normalizedCountry);

  if (!match) {
    return {
      ...row,
      decision: "unmatched",
      matched_country_id: "",
      matched_country: "",
      matched_iso3: "",
      matched_tge_region: "",
      matched_wb_region: "",
      match_reason: "no_country_reference_match",
    };
  }

  const country = match.country;
  const alreadyNormalized =
    row.current_country_id === country.country_id &&
    row.current_country === country.country_name &&
    row.current_tge_region === country.tge_region &&
    row.current_wb_region === country.wb_region;

  return {
    ...row,
    decision: alreadyNormalized ? "already_normalized" : "update_ready",
    matched_country_id: country.country_id,
    matched_country: country.country_name,
    matched_iso3: country.iso3,
    matched_tge_region: country.tge_region,
    matched_wb_region: country.wb_region,
    match_reason: match.reason,
  };
}

async function applyUpdates(pool, rows) {
  const client = await pool.connect();
  const stats = { updated: 0 };

  try {
    await client.query("BEGIN");

    for (const row of rows) {
      if (row.decision !== "update_ready") {
        continue;
      }

      const config = ENTITY_CONFIGS[row.entity_type];
      await client.query(
        `
        UPDATE ${config.tableName}
        SET
          ${config.countryIdColumn} = $2::uuid,
          ${config.countryColumn} = $3,
          ${config.regionColumn} = $4,
          ${config.wbRegionColumn} = $5
        WHERE ${config.idColumn} = $1::uuid
        `,
        [
          row.entity_id,
          row.matched_country_id,
          row.matched_country,
          row.matched_tge_region,
          row.matched_wb_region,
        ]
      );
      stats.updated += 1;
    }

    await client.query("COMMIT");
    return stats;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function writePreviewFiles(args, rows, unmatched, summary) {
  await fs.mkdir(args.out, { recursive: true });
  await fs.writeFile(
    path.join(args.out, "country_reference_backfill_preview.csv"),
    toCsv(rows),
    "utf8"
  );
  await fs.writeFile(
    path.join(args.out, "country_reference_unmatched.csv"),
    toCsv(unmatched),
    "utf8"
  );
  await fs.writeFile(
    path.join(args.out, "country_reference_backfill_summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8"
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const databaseUrl = getDatabaseUrl();

  if (args.execute && !args.allowRemoteDb && !isLocalDatabaseUrl(databaseUrl)) {
    throw new Error(
      "--execute is blocked for non-local database URLs. Use a local PostgreSQL DATABASE_URL or explicitly pass --allow-remote-db."
    );
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 3,
    ssl: getSslConfig(databaseUrl),
  });

  try {
    const countries = await loadCountries(pool);
    const aliasMap = buildCountryAliasMap(countries);
    const entityTypes =
      args.entity === "all" ? Object.keys(ENTITY_CONFIGS) : [args.entity];
    const evaluatedRows = [];

    for (const entityType of entityTypes) {
      const rows = await listEntityRows(pool, entityType, args.limit);
      evaluatedRows.push(
        ...rows.map((row) => evaluateRow(row, aliasMap))
      );
    }

    const updateReady = evaluatedRows.filter(
      (row) => row.decision === "update_ready"
    );
    const unmatched = evaluatedRows.filter((row) => row.decision === "unmatched");
    const writeStats = args.execute ? await applyUpdates(pool, evaluatedRows) : null;

    const summary = {
      generated_at: new Date().toISOString(),
      mode: args.execute ? "execute" : "dry_run",
      output_directory: args.out,
      entity: args.entity,
      limit_per_entity: args.limit,
      country_reference_count: countries.length,
      safety: {
        writes_enabled: args.execute,
        remote_execute_allowed: args.allowRemoteDb,
        updates_country_reference_fields_only: true,
        review_status_unchanged: true,
        sources_unchanged: true,
      },
      counts: {
        inspected: evaluatedRows.length,
        update_ready: updateReady.length,
        unmatched: unmatched.length,
        by_decision: countBy(evaluatedRows, "decision"),
        by_entity_type: countBy(evaluatedRows, "entity_type"),
        unmatched_by_country: countBy(unmatched, "current_country"),
        update_ready_by_entity_type: countBy(updateReady, "entity_type"),
      },
      write_stats: writeStats,
      samples: {
        update_ready: updateReady.slice(0, 10),
        unmatched: unmatched.slice(0, 25),
      },
    };

    await writePreviewFiles(args, evaluatedRows, unmatched, summary);

    console.log(
      JSON.stringify(
        {
          mode: summary.mode,
          inspected: summary.counts.inspected,
          update_ready: summary.counts.update_ready,
          unmatched: summary.counts.unmatched,
          by_decision: summary.counts.by_decision,
          by_entity_type: summary.counts.by_entity_type,
          write_stats: summary.write_stats,
          output_directory: summary.output_directory,
          safety: summary.safety,
        },
        null,
        2
      )
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
