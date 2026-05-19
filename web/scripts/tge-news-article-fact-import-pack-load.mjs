#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const DEFAULT_INPUT = path.resolve(
  "..",
  "source-data",
  "tge-news-article-fact-import-pack",
  "article_fact_candidates_reviewed_import.ndjson"
);
const CLOSED_STATUSES = new Set(["confirmed", "rejected", "superseded"]);
const REQUIRED_FIELDS = [
  "fact_key",
  "source_reference",
  "fact_type_code",
  "extracted_value",
  "confidence_score",
  "fact_status_code",
  "extraction_method",
];

function parseArgs(argv) {
  const args = {
    input: process.env.TGE_ARTICLE_FACT_IMPORT_PACK_INPUT || DEFAULT_INPUT,
    execute: false,
    batchSize: 500,
    allowNonConfirmed: false,
    allowRemoteDb: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--input" && next) {
      args.input = path.resolve(next);
      index += 1;
    } else if (arg === "--batch-size" && next) {
      args.batchSize = Number(next);
      index += 1;
    } else if (arg === "--execute") {
      args.execute = true;
    } else if (arg === "--allow-non-confirmed") {
      args.allowNonConfirmed = true;
    } else if (arg === "--allow-remote-db") {
      args.allowRemoteDb = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  args.input = path.resolve(args.input);

  if (!Number.isInteger(args.batchSize) || args.batchSize < 1) {
    throw new Error("--batch-size must be a positive integer.");
  }

  return args;
}

function printHelp() {
  console.log(`
Usage:
  npm run tge-news:fact-import-load -- --input "../source-data/.../article_fact_candidates_reviewed_import.ndjson"

Options:
  --input <file>            Import pack NDJSON file.
  --batch-size <number>     Insert batch size. Default: 500.
  --execute                 Write rows to article_fact_candidates. Default is dry-run only.
  --allow-non-confirmed     Allow non-confirmed rows during --execute.
  --allow-remote-db         Allow --execute against a non-local DATABASE_URL.

Safety:
  Dry-run by default. Execute mode requires DATABASE_URL or DATABASE_PUBLIC_URL.
  Execute mode writes only article_fact_candidates and blocks non-local database
  URLs unless --allow-remote-db is supplied.
`);
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readNdjson(input) {
  const text = await fs.readFile(input, "utf8");
  const rows = [];
  const lines = text.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (!line) {
      continue;
    }

    try {
      rows.push(JSON.parse(line));
    } catch (error) {
      throw new Error(`Invalid JSON on line ${index + 1}: ${error.message}`);
    }
  }

  return rows;
}

function countBy(rows, key) {
  const counts = new Map();

  for (const row of rows) {
    const value = row[key] || "unknown";
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  return Object.fromEntries(
    [...counts.entries()].sort(([a], [b]) => String(a).localeCompare(String(b)))
  );
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateRows(rows, args) {
  const errors = [];
  const seenFactKeys = new Set();

  rows.forEach((row, index) => {
    const rowNumber = index + 1;

    for (const field of REQUIRED_FIELDS) {
      if (row[field] === null || row[field] === undefined || row[field] === "") {
        errors.push({ row: rowNumber, fact_key: row.fact_key, issue: `missing_${field}` });
      }
    }

    if (row.fact_key) {
      if (seenFactKeys.has(row.fact_key)) {
        errors.push({
          row: rowNumber,
          fact_key: row.fact_key,
          issue: "duplicate_fact_key",
        });
      }

      seenFactKeys.add(row.fact_key);
    }

    const confidenceScore = Number(row.confidence_score);
    if (
      !Number.isFinite(confidenceScore) ||
      confidenceScore < 0 ||
      confidenceScore > 1
    ) {
      errors.push({
        row: rowNumber,
        fact_key: row.fact_key,
        issue: "invalid_confidence_score",
        value: row.confidence_score,
      });
    }

    if (!args.allowNonConfirmed && row.fact_status_code !== "confirmed") {
      errors.push({
        row: rowNumber,
        fact_key: row.fact_key,
        issue: "non_confirmed_row_requires_allow_non_confirmed",
        value: row.fact_status_code,
      });
    }

    if (row.evidence_snippet && String(row.evidence_snippet).length > 500) {
      errors.push({
        row: rowNumber,
        fact_key: row.fact_key,
        issue: "evidence_snippet_too_long",
        length: String(row.evidence_snippet).length,
      });
    }

    if (!isPlainObject(row.normalized_value)) {
      errors.push({
        row: rowNumber,
        fact_key: row.fact_key,
        issue: "normalized_value_not_object",
      });
    }

    if (!isPlainObject(row.extraction_metadata)) {
      errors.push({
        row: rowNumber,
        fact_key: row.fact_key,
        issue: "extraction_metadata_not_object",
      });
    }
  });

  return errors;
}

function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL || "";
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

function dbRows(rows) {
  return rows.map((row) => ({
    fact_key: row.fact_key,
    source_reference: row.source_reference,
    archive_file_path: row.archive_file_path || null,
    published_date: row.published_date || null,
    fact_type_code: row.fact_type_code,
    entity_type: row.entity_type || null,
    entity_label: row.entity_label || null,
    field_name: row.field_name || null,
    extracted_value: row.extracted_value,
    normalized_value: row.normalized_value || {},
    unit_code: row.unit_code || null,
    evidence_snippet: row.evidence_snippet || null,
    confidence_score: Number(row.confidence_score),
    fact_status_code: row.fact_status_code,
    fact_reason: row.fact_reason || null,
    extraction_method: row.extraction_method || "local_markdown_regex_v1",
    extraction_metadata: row.extraction_metadata || {},
  }));
}

async function writeBatch(pool, rows) {
  const result = await pool.query(
    `
    INSERT INTO article_fact_candidates (
      fact_key,
      source_id,
      source_reference,
      archive_file_path,
      published_date,
      fact_type_code,
      entity_type,
      entity_label,
      field_name,
      extracted_value,
      normalized_value,
      unit_code,
      evidence_snippet,
      confidence_score,
      fact_status_code,
      fact_reason,
      extraction_method,
      extraction_metadata,
      reviewed_at
    )
    SELECT
      data.fact_key,
      s.source_id,
      data.source_reference,
      data.archive_file_path,
      data.published_date,
      data.fact_type_code,
      data.entity_type,
      data.entity_label,
      data.field_name,
      data.extracted_value,
      COALESCE(data.normalized_value, '{}'::jsonb),
      data.unit_code,
      data.evidence_snippet,
      data.confidence_score,
      data.fact_status_code,
      data.fact_reason,
      data.extraction_method,
      COALESCE(data.extraction_metadata, '{}'::jsonb),
      CASE WHEN data.fact_status_code = ANY($3::text[]) THEN now() ELSE NULL END
    FROM jsonb_to_recordset($1::jsonb) AS data(
      fact_key text,
      source_reference text,
      archive_file_path text,
      published_date date,
      fact_type_code text,
      entity_type text,
      entity_label text,
      field_name text,
      extracted_value text,
      normalized_value jsonb,
      unit_code text,
      evidence_snippet text,
      confidence_score numeric,
      fact_status_code text,
      fact_reason text,
      extraction_method text,
      extraction_metadata jsonb
    )
    LEFT JOIN sources s
      ON s.source_reference = data.source_reference
    ON CONFLICT (fact_key) DO UPDATE
    SET
      source_id = COALESCE(article_fact_candidates.source_id, EXCLUDED.source_id),
      archive_file_path = EXCLUDED.archive_file_path,
      published_date = EXCLUDED.published_date,
      extracted_value = CASE
        WHEN article_fact_candidates.fact_status_code = ANY($2::text[])
          THEN article_fact_candidates.extracted_value
        ELSE EXCLUDED.extracted_value
      END,
      normalized_value = CASE
        WHEN article_fact_candidates.fact_status_code = ANY($2::text[])
          THEN article_fact_candidates.normalized_value
        ELSE EXCLUDED.normalized_value
      END,
      evidence_snippet = CASE
        WHEN article_fact_candidates.fact_status_code = ANY($2::text[])
          THEN article_fact_candidates.evidence_snippet
        ELSE EXCLUDED.evidence_snippet
      END,
      confidence_score = CASE
        WHEN article_fact_candidates.fact_status_code = ANY($2::text[])
          THEN article_fact_candidates.confidence_score
        ELSE EXCLUDED.confidence_score
      END,
      fact_status_code = CASE
        WHEN article_fact_candidates.fact_status_code = ANY($2::text[])
          THEN article_fact_candidates.fact_status_code
        ELSE EXCLUDED.fact_status_code
      END,
      fact_reason = CASE
        WHEN article_fact_candidates.fact_status_code = ANY($2::text[])
          THEN article_fact_candidates.fact_reason
        ELSE EXCLUDED.fact_reason
      END,
      extraction_metadata = CASE
        WHEN article_fact_candidates.fact_status_code = ANY($2::text[])
          THEN article_fact_candidates.extraction_metadata
        ELSE EXCLUDED.extraction_metadata
      END,
      reviewed_at = CASE
        WHEN article_fact_candidates.fact_status_code = ANY($2::text[])
          THEN article_fact_candidates.reviewed_at
        ELSE EXCLUDED.reviewed_at
      END,
      updated_at = CASE
        WHEN article_fact_candidates.fact_status_code = ANY($2::text[])
          THEN article_fact_candidates.updated_at
        ELSE now()
      END
    RETURNING (xmax = 0) AS inserted
    `,
    [JSON.stringify(rows), [...CLOSED_STATUSES], ["confirmed", "rejected"]]
  );

  return result.rows.reduce(
    (acc, row) => {
      if (row.inserted) {
        acc.inserted += 1;
      } else {
        acc.updated += 1;
      }

      return acc;
    },
    { inserted: 0, updated: 0 }
  );
}

async function writeRows(databaseUrl, rows, batchSize) {
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: getSslConfig(databaseUrl),
  });
  const stats = {
    attempted: rows.length,
    inserted: 0,
    updated: 0,
  };

  try {
    for (let index = 0; index < rows.length; index += batchSize) {
      const batch = rows.slice(index, index + batchSize);
      const batchStats = await writeBatch(pool, batch);
      stats.inserted += batchStats.inserted;
      stats.updated += batchStats.updated;
    }
  } finally {
    await pool.end();
  }

  return stats;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!(await pathExists(args.input))) {
    throw new Error(`Input file does not exist: ${args.input}`);
  }

  const rows = dbRows(await readNdjson(args.input));
  const validationErrors = validateRows(rows, args);

  if (validationErrors.length) {
    console.log(
      JSON.stringify(
        {
          passed: false,
          execute: args.execute,
          input_file: args.input,
          rows: rows.length,
          errors: validationErrors.slice(0, 50),
          error_count: validationErrors.length,
          privacy: {
            local_only: true,
            database_writes: false,
            full_article_body_output: false,
          },
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  let writeStats = null;
  let databaseUrl = "";

  if (args.execute) {
    databaseUrl = getDatabaseUrl();

    if (!databaseUrl) {
      throw new Error("--execute requires DATABASE_URL or DATABASE_PUBLIC_URL.");
    }

    if (!args.allowRemoteDb && !isLocalDatabaseUrl(databaseUrl)) {
      throw new Error(
        "--execute is blocked for non-local database URLs. Use a local PostgreSQL DATABASE_URL or explicitly pass --allow-remote-db."
      );
    }

    writeStats = await writeRows(databaseUrl, rows, args.batchSize);
  }

  console.log(
    JSON.stringify(
      {
        passed: true,
        mode: args.execute ? "execute" : "dry_run",
        input_file: args.input,
        rows: rows.length,
        batch_size: args.batchSize,
        by_fact_status: countBy(rows, "fact_status_code"),
        by_fact_type: countBy(rows, "fact_type_code"),
        write_stats: writeStats,
        database: args.execute
          ? {
              local_url: isLocalDatabaseUrl(databaseUrl),
              remote_allowed: args.allowRemoteDb,
            }
          : null,
        privacy: {
          local_only: !args.allowRemoteDb,
          database_writes: args.execute,
          full_article_body_output: false,
        },
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
