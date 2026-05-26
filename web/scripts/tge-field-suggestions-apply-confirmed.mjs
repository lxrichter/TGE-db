#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Pool } = pg;

const DEFAULT_OUT_DIR = path.resolve(
  process.cwd(),
  "../source-data/field-suggestion-apply"
);

const FIELD_CONFIGS = {
  project: {
    tableName: "projects",
    idColumn: "project_id",
    labelColumn: "project_name",
    countryColumn: "country",
    fields: {
      electric_capacity_mwe: { cast: "numeric", valueType: "decimal" },
      thermal_capacity_mwth: { cast: "numeric", valueType: "decimal" },
      target_cod_year: { cast: "int", valueType: "year" },
    },
  },
  operating_asset: {
    tableName: "operating_assets",
    idColumn: "operating_asset_id",
    labelColumn: "asset_name",
    countryColumn: "country",
    fields: {
      electric_capacity_mwe: { cast: "numeric", valueType: "decimal" },
      thermal_capacity_mwth: { cast: "numeric", valueType: "decimal" },
    },
  },
};

function parseArgs(argv) {
  const args = {
    out: process.env.TGE_FIELD_SUGGESTION_APPLY_OUT || DEFAULT_OUT_DIR,
    execute: false,
    allowRemoteDb: false,
    limit: 100,
    actorUserId: process.env.TGE_APPLY_ACTOR_USER_ID || "",
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
    } else if (arg === "--limit" && next) {
      args.limit = Math.max(Number(next) || 0, 0);
      index += 1;
    } else if (arg === "--actor-user-id" && next) {
      args.actorUserId = next.trim();
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`
Usage:
  npm run field-suggestions:apply
  DATABASE_URL="postgresql://localhost:5432/tge_local" npm run field-suggestions:apply -- --execute

Options:
  --execute             Apply confirmed suggestions. Default is dry-run only.
  --allow-remote-db     Allow --execute against a non-local DATABASE_URL.
  --out <dir>           Output directory. Defaults to ../source-data/field-suggestion-apply.
  --limit <n>           Max confirmed suggestions to inspect/apply. Defaults to 100. Use 0 for unlimited.
  --actor-user-id <id>  Optional app_users.user_id recorded on audit events.

Safety:
  Only confirmed, unapplied field_suggestion_candidates are eligible.
  Only whitelisted project and plant fields are supported.
  A target field is updated only if it is still empty.
  Execute mode writes audit_events and marks applied_at; it does not approve
  records, export records, or create new source links.
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

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function toCsv(rows) {
  const columns = [
    "field_suggestion_candidate_id",
    "decision",
    "entity_type",
    "entity_name",
    "country",
    "field_name",
    "current_db_value",
    "suggested_value",
    "confidence_score",
    "source_reference",
    "source_title",
    "reason",
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

function parseSuggestedValue(row) {
  const config = FIELD_CONFIGS[row.entity_type]?.fields[row.field_name];

  if (!config) {
    return { value: null, reason: "unsupported_field" };
  }

  if (config.valueType === "year") {
    const normalizedYear = Number(row.normalized_value?.year);
    const textYear = Number(String(row.suggested_value || "").trim());
    const year = Number.isInteger(normalizedYear) ? normalizedYear : textYear;

    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      return { value: null, reason: "invalid_year" };
    }

    return { value: year, reason: null };
  }

  const normalizedValue = Number(row.normalized_value?.value);
  const textValue = Number(String(row.suggested_value || "").replace(/,/g, ""));
  const value = Number.isFinite(normalizedValue) ? normalizedValue : textValue;

  if (!Number.isFinite(value)) {
    return { value: null, reason: "invalid_decimal" };
  }

  return { value, reason: null };
}

function evaluateCandidate(row) {
  const parsed = parseSuggestedValue(row);

  if (parsed.reason) {
    return {
      ...row,
      parsed_value: null,
      decision: "skip_invalid_value",
      reason: parsed.reason,
    };
  }

  if (row.current_db_value !== null && String(row.current_db_value).trim() !== "") {
    return {
      ...row,
      parsed_value: parsed.value,
      decision: "skip_target_already_has_value",
      reason: "target_field_not_empty",
    };
  }

  return {
    ...row,
    parsed_value: parsed.value,
    decision: "apply_ready",
    reason: "confirmed_suggestion_target_empty",
  };
}

function buildCandidateSelectSql(limit) {
  const selects = [];

  for (const [entityType, entityConfig] of Object.entries(FIELD_CONFIGS)) {
    for (const fieldName of Object.keys(entityConfig.fields)) {
      selects.push(`
        SELECT
          f.field_suggestion_candidate_id::text,
          f.entity_type,
          f.${entityConfig.idColumn}::text AS entity_id,
          target.${entityConfig.labelColumn} AS entity_name,
          target.${entityConfig.countryColumn} AS country,
          f.field_name,
          target.${fieldName}::text AS current_db_value,
          f.current_value AS suggestion_current_value,
          f.suggested_value,
          f.normalized_value,
          f.source_id::text,
          s.title AS source_title,
          s.source_reference,
          f.confidence_score::float8 AS confidence_score,
          f.suggestion_reason,
          f.generated_by,
          f.reviewed_at,
          target.review_status_code AS current_review_status_code
        FROM field_suggestion_candidates f
        INNER JOIN ${entityConfig.tableName} target
          ON target.${entityConfig.idColumn} = f.${entityConfig.idColumn}
        LEFT JOIN sources s
          ON s.source_id = f.source_id
        WHERE f.entity_type = '${entityType}'
          AND f.field_name = '${fieldName}'
          AND f.suggestion_status_code = 'confirmed'
          AND f.applied_at IS NULL
      `);
    }
  }

  const limitSql = limit > 0 ? `LIMIT ${Number(limit)}` : "";

  return `
    SELECT *
    FROM (
      ${selects.join("\nUNION ALL\n")}
    ) candidates
    ORDER BY confidence_score DESC, entity_type, entity_name, field_name
    ${limitSql}
  `;
}

async function listApplyCandidates(pool, args) {
  const result = await pool.query(buildCandidateSelectSql(args.limit));
  return result.rows.map(evaluateCandidate);
}

async function getDiagnostics(pool) {
  const result = await pool.query(`
    SELECT
      suggestion_status_code,
      entity_type,
      field_name,
      COUNT(*)::int AS count,
      COUNT(*) FILTER (WHERE applied_at IS NOT NULL)::int AS applied_count
    FROM field_suggestion_candidates
    GROUP BY suggestion_status_code, entity_type, field_name
    ORDER BY suggestion_status_code, entity_type, field_name
  `);

  return result.rows;
}

function applySqlFor(row) {
  const entityConfig = FIELD_CONFIGS[row.entity_type];
  const fieldConfig = entityConfig?.fields[row.field_name];

  if (!entityConfig || !fieldConfig) {
    throw new Error(`Unsupported field suggestion target: ${row.entity_type}.${row.field_name}`);
  }

  return `
    WITH actor AS (
      SELECT user_id
      FROM app_users
      WHERE user_id = $4::uuid
      LIMIT 1
    ),
    candidate AS (
      SELECT *
      FROM field_suggestion_candidates
      WHERE field_suggestion_candidate_id = $1::uuid
        AND entity_type = $5
        AND field_name = $6
        AND suggestion_status_code = 'confirmed'
        AND applied_at IS NULL
      FOR UPDATE
    ),
    current_record AS (
      SELECT
        target.${entityConfig.idColumn},
        target.${row.field_name}::text AS previous_value,
        target.review_status_code AS previous_review_status_code
      FROM ${entityConfig.tableName} target
      INNER JOIN candidate
        ON candidate.${entityConfig.idColumn} = target.${entityConfig.idColumn}
      WHERE target.${row.field_name} IS NULL
      FOR UPDATE
    ),
    updated_record AS (
      UPDATE ${entityConfig.tableName} target
      SET
        ${row.field_name} = $2::${fieldConfig.cast},
        review_status_code = CASE
          WHEN current_record.previous_review_status_code IN ('approved', 'export_ready')
            THEN 'needs_update'
          ELSE target.review_status_code
        END,
        last_updated_by_user_id = COALESCE(
          (SELECT user_id FROM actor),
          target.last_updated_by_user_id
        ),
        updated_at = now()
      FROM current_record
      WHERE target.${entityConfig.idColumn} = current_record.${entityConfig.idColumn}
      RETURNING
        target.${entityConfig.idColumn}::text AS entity_id,
        current_record.previous_value,
        target.${row.field_name}::text AS next_value,
        current_record.previous_review_status_code,
        target.review_status_code AS next_review_status_code
    ),
    audit AS (
      INSERT INTO audit_events (
        entity_type,
        entity_id,
        event_type,
        previous_review_status_code,
        next_review_status_code,
        actor_user_id,
        event_note,
        changed_fields
      )
      SELECT
        $5,
        entity_id::uuid,
        'field_suggestion_applied',
        previous_review_status_code,
        next_review_status_code,
        (SELECT user_id FROM actor),
        $3,
        jsonb_build_object(
          'field_name', $6::text,
          'previous_value', previous_value,
          'next_value', next_value,
          'field_suggestion_candidate_id', $1::text,
          'source_id', candidate.source_id::text,
          'confidence_score', candidate.confidence_score::text,
          'generated_by', candidate.generated_by
        )
      FROM updated_record
      CROSS JOIN candidate
      RETURNING audit_event_id
    )
    UPDATE field_suggestion_candidates f
    SET
      applied_at = now(),
      applied_audit_event_id = (SELECT audit_event_id FROM audit),
      updated_at = now()
    WHERE f.field_suggestion_candidate_id = $1::uuid
      AND EXISTS (SELECT 1 FROM audit)
    RETURNING
      f.field_suggestion_candidate_id::text,
      f.applied_audit_event_id::text
  `;
}

async function applyCandidate(client, row, actorUserId) {
  const sql = applySqlFor(row);
  const eventNote = [
    "Applied confirmed field suggestion.",
    row.source_reference ? `Source: ${row.source_reference}.` : "",
    row.suggestion_reason ? `Reason: ${row.suggestion_reason}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const result = await client.query(sql, [
    row.field_suggestion_candidate_id,
    row.parsed_value,
    eventNote,
    actorUserId || null,
    row.entity_type,
    row.field_name,
  ]);

  return result.rows[0] ?? null;
}

async function applyCandidates(pool, candidates, actorUserId) {
  const client = await pool.connect();
  const stats = {
    attempted: candidates.length,
    applied: 0,
    skipped: 0,
  };

  try {
    await client.query("BEGIN");

    for (const candidate of candidates) {
      if (candidate.decision !== "apply_ready") {
        stats.skipped += 1;
        continue;
      }

      const row = await applyCandidate(client, candidate, actorUserId);

      if (row) {
        stats.applied += 1;
      } else {
        stats.skipped += 1;
      }
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

async function writePreviewFiles(args, candidates, summary) {
  await fs.mkdir(args.out, { recursive: true });
  await fs.writeFile(
    path.join(args.out, "field_suggestion_apply_preview.csv"),
    toCsv(candidates),
    "utf8"
  );
  await fs.writeFile(
    path.join(args.out, "field_suggestion_apply_summary.json"),
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
    const candidates = await listApplyCandidates(pool, args);
    const applyReady = candidates.filter((candidate) => candidate.decision === "apply_ready");
    const diagnostics = await getDiagnostics(pool);
    const writeStats = args.execute
      ? await applyCandidates(pool, candidates, args.actorUserId)
      : null;
    const summary = {
      generated_at: new Date().toISOString(),
      mode: args.execute ? "execute" : "dry_run",
      output_directory: args.out,
      limit: args.limit,
      safety: {
        confirmed_suggestions_only: true,
        supported_fields_only: true,
        applies_only_empty_target_fields: true,
        audit_events_written: args.execute,
        entity_fields_updated: args.execute,
        entity_source_links_created: false,
        approval_or_export_status_granted: false,
      },
      counts: {
        candidates: candidates.length,
        apply_ready: applyReady.length,
        by_decision: countBy(candidates, "decision"),
        by_entity_type: countBy(candidates, "entity_type"),
        by_field_name: countBy(candidates, "field_name"),
      },
      diagnostics,
      write_stats: writeStats,
      sample: candidates.slice(0, 10),
    };

    await writePreviewFiles(args, candidates, summary);

    console.log(
      JSON.stringify(
        {
          mode: summary.mode,
          candidates: summary.counts.candidates,
          apply_ready: summary.counts.apply_ready,
          by_decision: summary.counts.by_decision,
          by_entity_type: summary.counts.by_entity_type,
          by_field_name: summary.counts.by_field_name,
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
