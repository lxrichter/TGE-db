#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Pool } = pg;

const DEFAULT_OUT_DIR = path.resolve(
  process.cwd(),
  "../source-data/article-fact-field-suggestions"
);
const CLOSED_STATUSES = new Set(["confirmed", "rejected", "superseded"]);

function parseArgs(argv) {
  const args = {
    out: process.env.TGE_ARTICLE_FACT_FIELD_SUGGESTION_OUT || DEFAULT_OUT_DIR,
    execute: false,
    allowRemoteDb: false,
    limit: 250,
    batchSize: 500,
    minFactConfidence: 0.72,
    minMatchConfidence: 0.78,
    factStatuses: ["confirmed"],
    matchStatuses: ["confirmed"],
    generatedBy: "article_fact_field_suggestion_v1",
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
    } else if (arg === "--batch-size" && next) {
      args.batchSize = Math.min(Math.max(Number(next) || 500, 1), 5000);
      index += 1;
    } else if (arg === "--min-fact-confidence" && next) {
      args.minFactConfidence = Math.min(Math.max(Number(next) || 0.72, 0), 1);
      index += 1;
    } else if (arg === "--min-match-confidence" && next) {
      args.minMatchConfidence = Math.min(Math.max(Number(next) || 0.78, 0), 1);
      index += 1;
    } else if (arg === "--fact-statuses" && next) {
      args.factStatuses = parseList(next);
      index += 1;
    } else if (arg === "--match-statuses" && next) {
      args.matchStatuses = parseList(next);
      index += 1;
    } else if (arg === "--generated-by" && next) {
      args.generatedBy = next.trim() || "article_fact_field_suggestion_v1";
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (args.factStatuses.length === 0) {
    throw new Error("--fact-statuses must include at least one status.");
  }

  if (args.matchStatuses.length === 0) {
    throw new Error("--match-statuses must include at least one status.");
  }

  return args;
}

function parseList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function printHelp() {
  console.log(`
Usage:
  npm run tge-news:fact-field-suggestions
  DATABASE_URL="postgresql://localhost:5432/tge_local" npm run tge-news:fact-field-suggestions -- --execute

Options:
  --execute                    Write rows to field_suggestion_candidates. Default is dry-run only.
  --allow-remote-db            Allow --execute against a non-local DATABASE_URL.
  --out <dir>                  Output directory. Defaults to ../source-data/article-fact-field-suggestions.
  --limit <n>                  Max suggestions to preview/write. Defaults to 250. Use 0 for unlimited.
  --batch-size <n>             PostgreSQL write batch size. Defaults to 500.
  --min-fact-confidence <0-1>  Minimum article fact confidence. Defaults to 0.72.
  --min-match-confidence <0-1> Minimum source/entity match confidence. Defaults to 0.78.
  --fact-statuses <codes>      Comma-separated article fact statuses. Defaults to confirmed.
  --match-statuses <codes>     Comma-separated source/entity match statuses. Defaults to confirmed.
  --generated-by <code>        Generator label. Defaults to article_fact_field_suggestion_v1.

Safety:
  This script is deterministic. It does not call an AI model, does not read
  article body text, does not create entity_sources links, and never updates
  project, operating asset, or company fields. With --execute it writes only
  reviewable rows in field_suggestion_candidates.
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

function statusForConfidence(confidence) {
  if (confidence >= 0.86) {
    return "suggested_high_confidence";
  }

  if (confidence >= 0.72) {
    return "suggested_medium_confidence";
  }

  if (confidence >= 0.55) {
    return "suggested_low_confidence";
  }

  return "needs_review";
}

function roundConfidence(value) {
  return Number(Math.min(Math.max(Number(value) || 0, 0), 1).toFixed(5));
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
    "suggestion_key",
    "entity_type",
    "entity_label",
    "field_name",
    "current_value",
    "suggested_value",
    "unit_code",
    "confidence_score",
    "suggestion_status_code",
    "suggestion_reason",
    "source_reference",
    "source_title",
    "article_fact_key",
    "source_match_status_code",
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

function normalizeCandidate(row) {
  const confidence = roundConfidence(row.confidence_score);

  return {
    ...row,
    confidence_score: confidence,
    suggestion_status_code: statusForConfidence(confidence),
  };
}

async function listArticleFactFieldSuggestions(pool, args) {
  const result = await pool.query(
    `
    WITH eligible_facts AS (
      SELECT
        af.article_fact_candidate_id::text,
        af.fact_key,
        af.source_id::text,
        af.source_reference,
        af.fact_type_code,
        af.field_name AS fact_field_name,
        af.extracted_value,
        af.normalized_value,
        af.unit_code AS fact_unit_code,
        af.evidence_snippet,
        af.confidence_score::float8 AS fact_confidence,
        af.fact_reason,
        s.title AS source_title,
        s.url AS source_url,
        s.source_type_code,
        s.content_type_code,
        CASE
          WHEN NULLIF(af.normalized_value->>'value', '') ~ '^[0-9]+(\\.[0-9]+)?$'
            THEN (af.normalized_value->>'value')::numeric
          ELSE NULL
        END AS numeric_value,
        CASE
          WHEN NULLIF(af.normalized_value->>'year', '') ~ '^[0-9]{4}$'
            THEN (af.normalized_value->>'year')::int
          ELSE NULL
        END AS year_value
      FROM article_fact_candidates af
      JOIN sources s
        ON s.source_id = af.source_id
      WHERE af.fact_status_code = ANY($1::text[])
        AND af.confidence_score >= $2::numeric
        AND af.source_id IS NOT NULL
    ),
    matched_facts AS (
      SELECT
        f.*,
        m.match_candidate_id::text,
        m.confirmed_entity_source_id::text,
        m.entity_type,
        m.entity_id::text,
        m.entity_label,
        m.confidence_score::float8 AS match_confidence,
        m.match_status_code,
        m.match_reason,
        least(0.95, (f.fact_confidence * 0.65) + (m.confidence_score::float8 * 0.35)) AS combined_confidence,
        jsonb_build_object(
          'suggested_from', 'confirmed_article_fact',
          'article_fact_candidate_id', f.article_fact_candidate_id,
          'fact_key', f.fact_key,
          'fact_type_code', f.fact_type_code,
          'fact_field_name', f.fact_field_name,
          'fact_reason', f.fact_reason,
          'source_reference', f.source_reference,
          'source_title', f.source_title,
          'source_url', f.source_url,
          'source_type_code', f.source_type_code,
          'content_type_code', f.content_type_code,
          'source_match_candidate_id', m.match_candidate_id::text,
          'source_match_status_code', m.match_status_code,
          'source_match_reason', m.match_reason,
          'article_fact_confidence', f.fact_confidence,
          'source_match_confidence', m.confidence_score::float8,
          'body_text_read', false,
          'entity_fields_updated', false,
          'entity_source_link_created', false
        ) AS article_fact_metadata
      FROM eligible_facts f
      JOIN source_entity_match_candidates m
        ON m.source_id = f.source_id::uuid
      WHERE m.entity_id IS NOT NULL
        AND m.entity_type = ANY($3::text[])
        AND m.match_status_code = ANY($4::text[])
        AND m.confidence_score >= $5::numeric
    ),
    project_electric_capacity AS (
      SELECT
        concat('article-fact:', f.article_fact_candidate_id, ':match:', f.match_candidate_id, ':field:electric_capacity_mwe') AS suggestion_key,
        'project' AS entity_type,
        p.project_id::text,
        NULL::text AS operating_asset_id,
        NULL::text AS company_id,
        p.project_name AS entity_label,
        'electric_capacity_mwe' AS field_name,
        p.electric_capacity_mwe::text AS current_value,
        f.numeric_value::text AS suggested_value,
        jsonb_build_object(
          'value', f.numeric_value,
          'unit', 'MWe',
          'article_fact_candidate_id', f.article_fact_candidate_id,
          'fact_key', f.fact_key,
          'fact_field_name', f.fact_field_name
        ) AS normalized_value,
        'MWe' AS unit_code,
        f.source_id,
        f.match_candidate_id AS source_entity_match_candidate_id,
        f.confirmed_entity_source_id AS linked_entity_source_id,
        f.evidence_snippet AS evidence_note,
        f.combined_confidence AS confidence_score,
        'Confirmed article fact suggests electric capacity for a matched project with no electric capacity recorded.' AS suggestion_reason,
        f.article_fact_metadata AS suggestion_metadata,
        f.source_reference,
        f.source_title,
        f.source_type_code,
        f.fact_key AS article_fact_key,
        f.match_status_code AS source_match_status_code
      FROM matched_facts f
      JOIN projects p
        ON f.entity_type = 'project' AND p.project_id = f.entity_id::uuid
      WHERE f.fact_field_name = 'electric_capacity_mwe'
        AND f.numeric_value IS NOT NULL
        AND p.electric_capacity_mwe IS NULL
    ),
    project_thermal_capacity AS (
      SELECT
        concat('article-fact:', f.article_fact_candidate_id, ':match:', f.match_candidate_id, ':field:thermal_capacity_mwth') AS suggestion_key,
        'project' AS entity_type,
        p.project_id::text,
        NULL::text AS operating_asset_id,
        NULL::text AS company_id,
        p.project_name AS entity_label,
        'thermal_capacity_mwth' AS field_name,
        p.thermal_capacity_mwth::text AS current_value,
        f.numeric_value::text AS suggested_value,
        jsonb_build_object(
          'value', f.numeric_value,
          'unit', 'MWth',
          'article_fact_candidate_id', f.article_fact_candidate_id,
          'fact_key', f.fact_key,
          'fact_field_name', f.fact_field_name
        ) AS normalized_value,
        'MWth' AS unit_code,
        f.source_id,
        f.match_candidate_id AS source_entity_match_candidate_id,
        f.confirmed_entity_source_id AS linked_entity_source_id,
        f.evidence_snippet AS evidence_note,
        f.combined_confidence AS confidence_score,
        'Confirmed article fact suggests thermal capacity for a matched project with no thermal capacity recorded.' AS suggestion_reason,
        f.article_fact_metadata AS suggestion_metadata,
        f.source_reference,
        f.source_title,
        f.source_type_code,
        f.fact_key AS article_fact_key,
        f.match_status_code AS source_match_status_code
      FROM matched_facts f
      JOIN projects p
        ON f.entity_type = 'project' AND p.project_id = f.entity_id::uuid
      WHERE f.fact_field_name = 'thermal_capacity_mwth'
        AND f.numeric_value IS NOT NULL
        AND p.thermal_capacity_mwth IS NULL
    ),
    project_unspecified_capacity AS (
      SELECT
        concat(
          'article-fact:',
          f.article_fact_candidate_id,
          ':match:',
          f.match_candidate_id,
          ':field:',
          CASE
            WHEN p.primary_use_type_code = 'direct_use' THEN 'thermal_capacity_mwth'
            ELSE 'electric_capacity_mwe'
          END
        ) AS suggestion_key,
        'project' AS entity_type,
        p.project_id::text,
        NULL::text AS operating_asset_id,
        NULL::text AS company_id,
        p.project_name AS entity_label,
        CASE
          WHEN p.primary_use_type_code = 'direct_use' THEN 'thermal_capacity_mwth'
          ELSE 'electric_capacity_mwe'
        END AS field_name,
        CASE
          WHEN p.primary_use_type_code = 'direct_use' THEN p.thermal_capacity_mwth::text
          ELSE p.electric_capacity_mwe::text
        END AS current_value,
        f.numeric_value::text AS suggested_value,
        jsonb_build_object(
          'value', f.numeric_value,
          'unit', CASE WHEN p.primary_use_type_code = 'direct_use' THEN 'MWth' ELSE 'MWe' END,
          'article_fact_candidate_id', f.article_fact_candidate_id,
          'fact_key', f.fact_key,
          'fact_field_name', f.fact_field_name,
          'capacity_inferred_from_use_type', COALESCE(p.primary_use_type_code, 'unknown')
        ) AS normalized_value,
        CASE WHEN p.primary_use_type_code = 'direct_use' THEN 'MWth' ELSE 'MWe' END AS unit_code,
        f.source_id,
        f.match_candidate_id AS source_entity_match_candidate_id,
        f.confirmed_entity_source_id AS linked_entity_source_id,
        f.evidence_snippet AS evidence_note,
        least(0.82, f.combined_confidence * 0.9) AS confidence_score,
        'Confirmed article fact contains an unspecified MW capacity; target capacity field is inferred from project use type.' AS suggestion_reason,
        f.article_fact_metadata AS suggestion_metadata,
        f.source_reference,
        f.source_title,
        f.source_type_code,
        f.fact_key AS article_fact_key,
        f.match_status_code AS source_match_status_code
      FROM matched_facts f
      JOIN projects p
        ON f.entity_type = 'project' AND p.project_id = f.entity_id::uuid
      WHERE f.fact_field_name = 'capacity_mw_unspecified'
        AND f.numeric_value IS NOT NULL
        AND (
          (p.primary_use_type_code = 'direct_use' AND p.thermal_capacity_mwth IS NULL)
          OR (COALESCE(p.primary_use_type_code, '') <> 'direct_use' AND p.electric_capacity_mwe IS NULL)
        )
    ),
    project_cod_year AS (
      SELECT
        concat('article-fact:', f.article_fact_candidate_id, ':match:', f.match_candidate_id, ':field:target_cod_year') AS suggestion_key,
        'project' AS entity_type,
        p.project_id::text,
        NULL::text AS operating_asset_id,
        NULL::text AS company_id,
        p.project_name AS entity_label,
        'target_cod_year' AS field_name,
        p.target_cod_year::text AS current_value,
        f.year_value::text AS suggested_value,
        jsonb_build_object(
          'year', f.year_value,
          'article_fact_candidate_id', f.article_fact_candidate_id,
          'fact_key', f.fact_key,
          'fact_field_name', f.fact_field_name
        ) AS normalized_value,
        NULL::text AS unit_code,
        f.source_id,
        f.match_candidate_id AS source_entity_match_candidate_id,
        f.confirmed_entity_source_id AS linked_entity_source_id,
        f.evidence_snippet AS evidence_note,
        f.combined_confidence AS confidence_score,
        'Confirmed article fact suggests a target COD year for a matched project with no target COD year recorded.' AS suggestion_reason,
        f.article_fact_metadata AS suggestion_metadata,
        f.source_reference,
        f.source_title,
        f.source_type_code,
        f.fact_key AS article_fact_key,
        f.match_status_code AS source_match_status_code
      FROM matched_facts f
      JOIN projects p
        ON f.entity_type = 'project' AND p.project_id = f.entity_id::uuid
      WHERE f.fact_field_name = 'target_cod_year'
        AND f.year_value IS NOT NULL
        AND p.target_cod_year IS NULL
    ),
    asset_electric_capacity AS (
      SELECT
        concat('article-fact:', f.article_fact_candidate_id, ':match:', f.match_candidate_id, ':field:electric_capacity_mwe') AS suggestion_key,
        'operating_asset' AS entity_type,
        NULL::text AS project_id,
        a.operating_asset_id::text,
        NULL::text AS company_id,
        a.asset_name AS entity_label,
        'electric_capacity_mwe' AS field_name,
        a.electric_capacity_mwe::text AS current_value,
        f.numeric_value::text AS suggested_value,
        jsonb_build_object(
          'value', f.numeric_value,
          'unit', 'MWe',
          'article_fact_candidate_id', f.article_fact_candidate_id,
          'fact_key', f.fact_key,
          'fact_field_name', f.fact_field_name
        ) AS normalized_value,
        'MWe' AS unit_code,
        f.source_id,
        f.match_candidate_id AS source_entity_match_candidate_id,
        f.confirmed_entity_source_id AS linked_entity_source_id,
        f.evidence_snippet AS evidence_note,
        f.combined_confidence AS confidence_score,
        'Confirmed article fact suggests electric capacity for a matched plant/facility with no electric capacity recorded.' AS suggestion_reason,
        f.article_fact_metadata AS suggestion_metadata,
        f.source_reference,
        f.source_title,
        f.source_type_code,
        f.fact_key AS article_fact_key,
        f.match_status_code AS source_match_status_code
      FROM matched_facts f
      JOIN operating_assets a
        ON f.entity_type = 'operating_asset' AND a.operating_asset_id = f.entity_id::uuid
      WHERE f.fact_field_name = 'electric_capacity_mwe'
        AND f.numeric_value IS NOT NULL
        AND a.electric_capacity_mwe IS NULL
    ),
    asset_thermal_capacity AS (
      SELECT
        concat('article-fact:', f.article_fact_candidate_id, ':match:', f.match_candidate_id, ':field:thermal_capacity_mwth') AS suggestion_key,
        'operating_asset' AS entity_type,
        NULL::text AS project_id,
        a.operating_asset_id::text,
        NULL::text AS company_id,
        a.asset_name AS entity_label,
        'thermal_capacity_mwth' AS field_name,
        a.thermal_capacity_mwth::text AS current_value,
        f.numeric_value::text AS suggested_value,
        jsonb_build_object(
          'value', f.numeric_value,
          'unit', 'MWth',
          'article_fact_candidate_id', f.article_fact_candidate_id,
          'fact_key', f.fact_key,
          'fact_field_name', f.fact_field_name
        ) AS normalized_value,
        'MWth' AS unit_code,
        f.source_id,
        f.match_candidate_id AS source_entity_match_candidate_id,
        f.confirmed_entity_source_id AS linked_entity_source_id,
        f.evidence_snippet AS evidence_note,
        f.combined_confidence AS confidence_score,
        'Confirmed article fact suggests thermal capacity for a matched plant/facility with no thermal capacity recorded.' AS suggestion_reason,
        f.article_fact_metadata AS suggestion_metadata,
        f.source_reference,
        f.source_title,
        f.source_type_code,
        f.fact_key AS article_fact_key,
        f.match_status_code AS source_match_status_code
      FROM matched_facts f
      JOIN operating_assets a
        ON f.entity_type = 'operating_asset' AND a.operating_asset_id = f.entity_id::uuid
      WHERE f.fact_field_name = 'thermal_capacity_mwth'
        AND f.numeric_value IS NOT NULL
        AND a.thermal_capacity_mwth IS NULL
    ),
    asset_unspecified_capacity AS (
      SELECT
        concat(
          'article-fact:',
          f.article_fact_candidate_id,
          ':match:',
          f.match_candidate_id,
          ':field:',
          CASE
            WHEN a.primary_use_type_code = 'direct_use' THEN 'thermal_capacity_mwth'
            ELSE 'electric_capacity_mwe'
          END
        ) AS suggestion_key,
        'operating_asset' AS entity_type,
        NULL::text AS project_id,
        a.operating_asset_id::text,
        NULL::text AS company_id,
        a.asset_name AS entity_label,
        CASE
          WHEN a.primary_use_type_code = 'direct_use' THEN 'thermal_capacity_mwth'
          ELSE 'electric_capacity_mwe'
        END AS field_name,
        CASE
          WHEN a.primary_use_type_code = 'direct_use' THEN a.thermal_capacity_mwth::text
          ELSE a.electric_capacity_mwe::text
        END AS current_value,
        f.numeric_value::text AS suggested_value,
        jsonb_build_object(
          'value', f.numeric_value,
          'unit', CASE WHEN a.primary_use_type_code = 'direct_use' THEN 'MWth' ELSE 'MWe' END,
          'article_fact_candidate_id', f.article_fact_candidate_id,
          'fact_key', f.fact_key,
          'fact_field_name', f.fact_field_name,
          'capacity_inferred_from_use_type', COALESCE(a.primary_use_type_code, 'unknown')
        ) AS normalized_value,
        CASE WHEN a.primary_use_type_code = 'direct_use' THEN 'MWth' ELSE 'MWe' END AS unit_code,
        f.source_id,
        f.match_candidate_id AS source_entity_match_candidate_id,
        f.confirmed_entity_source_id AS linked_entity_source_id,
        f.evidence_snippet AS evidence_note,
        least(0.82, f.combined_confidence * 0.9) AS confidence_score,
        'Confirmed article fact contains an unspecified MW capacity; target capacity field is inferred from plant/facility use type.' AS suggestion_reason,
        f.article_fact_metadata AS suggestion_metadata,
        f.source_reference,
        f.source_title,
        f.source_type_code,
        f.fact_key AS article_fact_key,
        f.match_status_code AS source_match_status_code
      FROM matched_facts f
      JOIN operating_assets a
        ON f.entity_type = 'operating_asset' AND a.operating_asset_id = f.entity_id::uuid
      WHERE f.fact_field_name = 'capacity_mw_unspecified'
        AND f.numeric_value IS NOT NULL
        AND (
          (a.primary_use_type_code = 'direct_use' AND a.thermal_capacity_mwth IS NULL)
          OR (COALESCE(a.primary_use_type_code, '') <> 'direct_use' AND a.electric_capacity_mwe IS NULL)
        )
    )
    SELECT *
    FROM (
      SELECT * FROM project_electric_capacity
      UNION ALL
      SELECT * FROM project_thermal_capacity
      UNION ALL
      SELECT * FROM project_unspecified_capacity
      UNION ALL
      SELECT * FROM project_cod_year
      UNION ALL
      SELECT * FROM asset_electric_capacity
      UNION ALL
      SELECT * FROM asset_thermal_capacity
      UNION ALL
      SELECT * FROM asset_unspecified_capacity
    ) suggestions
    ORDER BY confidence_score DESC, entity_type, entity_label, field_name, source_reference
    LIMIT NULLIF($6::int, 0)
    `,
    [
      args.factStatuses,
      args.minFactConfidence,
      ["project", "operating_asset"],
      args.matchStatuses,
      args.minMatchConfidence,
      args.limit,
    ]
  );

  return result.rows.map(normalizeCandidate);
}

async function writeCandidateBatch(pool, rows, generatedBy) {
  const payload = rows.map((row) => ({
    suggestion_key: row.suggestion_key,
    entity_type: row.entity_type,
    project_id: row.project_id,
    operating_asset_id: row.operating_asset_id,
    company_id: row.company_id,
    field_name: row.field_name,
    current_value: row.current_value,
    suggested_value: row.suggested_value,
    normalized_value: row.normalized_value || {},
    unit_code: row.unit_code,
    source_id: row.source_id,
    source_entity_match_candidate_id: row.source_entity_match_candidate_id,
    linked_entity_source_id: row.linked_entity_source_id,
    evidence_note: row.evidence_note,
    confidence_score: row.confidence_score,
    suggestion_status_code: row.suggestion_status_code,
    suggestion_reason: row.suggestion_reason,
    suggestion_metadata: row.suggestion_metadata || {},
    generated_by: generatedBy,
  }));

  const result = await pool.query(
    `
    INSERT INTO field_suggestion_candidates (
      suggestion_key,
      entity_type,
      project_id,
      operating_asset_id,
      company_id,
      field_name,
      current_value,
      suggested_value,
      normalized_value,
      unit_code,
      source_id,
      source_entity_match_candidate_id,
      linked_entity_source_id,
      evidence_note,
      confidence_score,
      suggestion_status_code,
      suggestion_reason,
      suggestion_metadata,
      generated_by
    )
    SELECT
      data.suggestion_key,
      data.entity_type,
      data.project_id,
      data.operating_asset_id,
      data.company_id,
      data.field_name,
      data.current_value,
      data.suggested_value,
      COALESCE(data.normalized_value, '{}'::jsonb),
      data.unit_code,
      data.source_id,
      data.source_entity_match_candidate_id,
      data.linked_entity_source_id,
      data.evidence_note,
      data.confidence_score,
      data.suggestion_status_code,
      data.suggestion_reason,
      COALESCE(data.suggestion_metadata, '{}'::jsonb),
      data.generated_by
    FROM jsonb_to_recordset($1::jsonb) AS data(
      suggestion_key text,
      entity_type text,
      project_id uuid,
      operating_asset_id uuid,
      company_id uuid,
      field_name text,
      current_value text,
      suggested_value text,
      normalized_value jsonb,
      unit_code text,
      source_id uuid,
      source_entity_match_candidate_id uuid,
      linked_entity_source_id uuid,
      evidence_note text,
      confidence_score numeric,
      suggestion_status_code text,
      suggestion_reason text,
      suggestion_metadata jsonb,
      generated_by text
    )
    ON CONFLICT (suggestion_key) DO UPDATE
    SET
      current_value = CASE
        WHEN field_suggestion_candidates.suggestion_status_code = ANY($2::text[])
          THEN field_suggestion_candidates.current_value
        ELSE EXCLUDED.current_value
      END,
      suggested_value = CASE
        WHEN field_suggestion_candidates.suggestion_status_code = ANY($2::text[])
          THEN field_suggestion_candidates.suggested_value
        ELSE EXCLUDED.suggested_value
      END,
      normalized_value = CASE
        WHEN field_suggestion_candidates.suggestion_status_code = ANY($2::text[])
          THEN field_suggestion_candidates.normalized_value
        ELSE EXCLUDED.normalized_value
      END,
      source_id = CASE
        WHEN field_suggestion_candidates.suggestion_status_code = ANY($2::text[])
          THEN field_suggestion_candidates.source_id
        ELSE EXCLUDED.source_id
      END,
      source_entity_match_candidate_id = CASE
        WHEN field_suggestion_candidates.suggestion_status_code = ANY($2::text[])
          THEN field_suggestion_candidates.source_entity_match_candidate_id
        ELSE EXCLUDED.source_entity_match_candidate_id
      END,
      linked_entity_source_id = CASE
        WHEN field_suggestion_candidates.suggestion_status_code = ANY($2::text[])
          THEN field_suggestion_candidates.linked_entity_source_id
        ELSE EXCLUDED.linked_entity_source_id
      END,
      confidence_score = CASE
        WHEN field_suggestion_candidates.suggestion_status_code = ANY($2::text[])
          THEN field_suggestion_candidates.confidence_score
        ELSE EXCLUDED.confidence_score
      END,
      suggestion_status_code = CASE
        WHEN field_suggestion_candidates.suggestion_status_code = ANY($2::text[])
          THEN field_suggestion_candidates.suggestion_status_code
        ELSE EXCLUDED.suggestion_status_code
      END,
      suggestion_reason = CASE
        WHEN field_suggestion_candidates.suggestion_status_code = ANY($2::text[])
          THEN field_suggestion_candidates.suggestion_reason
        ELSE EXCLUDED.suggestion_reason
      END,
      suggestion_metadata = CASE
        WHEN field_suggestion_candidates.suggestion_status_code = ANY($2::text[])
          THEN field_suggestion_candidates.suggestion_metadata
        ELSE EXCLUDED.suggestion_metadata
      END,
      generated_by = CASE
        WHEN field_suggestion_candidates.suggestion_status_code = ANY($2::text[])
          THEN field_suggestion_candidates.generated_by
        ELSE EXCLUDED.generated_by
      END,
      updated_at = CASE
        WHEN field_suggestion_candidates.suggestion_status_code = ANY($2::text[])
          THEN field_suggestion_candidates.updated_at
        ELSE now()
      END
    RETURNING (xmax = 0) AS inserted
    `,
    [JSON.stringify(payload), [...CLOSED_STATUSES]]
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

async function writeCandidatesToPostgres({ pool, candidates, batchSize, generatedBy }) {
  const stats = {
    inserted: 0,
    updated: 0,
    attempted: candidates.length,
  };

  for (let index = 0; index < candidates.length; index += batchSize) {
    const batch = candidates.slice(index, index + batchSize);
    const batchStats = await writeCandidateBatch(pool, batch, generatedBy);
    stats.inserted += batchStats.inserted;
    stats.updated += batchStats.updated;
  }

  return stats;
}

async function getDiagnostics(pool, args) {
  const [
    articleFacts,
    matchedFacts,
    existingSuggestions,
  ] = await Promise.all([
    pool.query(
      `
      SELECT fact_status_code, fact_type_code, field_name, COUNT(*)::int AS count
      FROM article_fact_candidates
      GROUP BY fact_status_code, fact_type_code, field_name
      ORDER BY fact_status_code, fact_type_code, field_name
      `
    ),
    pool.query(
      `
      SELECT
        m.match_status_code,
        m.entity_type,
        af.field_name,
        COUNT(*)::int AS count
      FROM article_fact_candidates af
      JOIN source_entity_match_candidates m
        ON m.source_id = af.source_id
      WHERE af.fact_status_code = ANY($1::text[])
        AND af.confidence_score >= $2::numeric
        AND m.match_status_code = ANY($3::text[])
        AND m.confidence_score >= $4::numeric
        AND m.entity_id IS NOT NULL
        AND m.entity_type = ANY($5::text[])
      GROUP BY m.match_status_code, m.entity_type, af.field_name
      ORDER BY m.match_status_code, m.entity_type, af.field_name
      `,
      [
        args.factStatuses,
        args.minFactConfidence,
        args.matchStatuses,
        args.minMatchConfidence,
        ["project", "operating_asset"],
      ]
    ),
    pool.query(
      `
      SELECT suggestion_status_code, entity_type, field_name, generated_by, COUNT(*)::int AS count
      FROM field_suggestion_candidates
      GROUP BY suggestion_status_code, entity_type, field_name, generated_by
      ORDER BY suggestion_status_code, entity_type, field_name, generated_by
      `
    ),
  ]);

  return {
    article_facts_by_status_type_field: articleFacts.rows,
    matched_article_facts_for_current_filters: matchedFacts.rows,
    existing_field_suggestions_by_status: existingSuggestions.rows,
  };
}

async function writePreviewFiles(args, candidates, summary) {
  await fs.mkdir(args.out, { recursive: true });
  await fs.writeFile(
    path.join(args.out, "article_fact_field_suggestion_preview.csv"),
    toCsv(candidates),
    "utf8"
  );
  await fs.writeFile(
    path.join(args.out, "article_fact_field_suggestion_summary.json"),
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
    const candidates = await listArticleFactFieldSuggestions(pool, args);
    const diagnostics = await getDiagnostics(pool, args);
    const writeStats = args.execute
      ? await writeCandidatesToPostgres({
          pool,
          candidates,
          batchSize: args.batchSize,
          generatedBy: args.generatedBy,
        })
      : null;
    const summary = {
      generated_at: new Date().toISOString(),
      mode: args.execute ? "execute" : "dry_run",
      output_directory: args.out,
      min_fact_confidence: args.minFactConfidence,
      min_match_confidence: args.minMatchConfidence,
      fact_statuses: args.factStatuses,
      match_statuses: args.matchStatuses,
      limit: args.limit,
      generated_by: args.generatedBy,
      safety: {
        deterministic: true,
        ai_model_called: false,
        article_body_text_read: false,
        entity_fields_updated: false,
        entity_source_links_created: false,
        writes_only_field_suggestion_candidates: args.execute,
      },
      counts: {
        suggestions: candidates.length,
        by_entity_type: countBy(candidates, "entity_type"),
        by_field_name: countBy(candidates, "field_name"),
        by_status: countBy(candidates, "suggestion_status_code"),
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
          suggestions: summary.counts.suggestions,
          by_entity_type: summary.counts.by_entity_type,
          by_field_name: summary.counts.by_field_name,
          by_status: summary.counts.by_status,
          diagnostics: summary.diagnostics,
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
