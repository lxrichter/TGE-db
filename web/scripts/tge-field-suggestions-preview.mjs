#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Pool } = pg;

const DEFAULT_OUT_DIR = path.resolve(process.cwd(), "../source-data/field-suggestion-preview");
const CLOSED_STATUSES = new Set(["confirmed", "rejected", "superseded"]);

function parseArgs(argv) {
  const args = {
    out: process.env.TGE_FIELD_SUGGESTION_OUT || DEFAULT_OUT_DIR,
    execute: false,
    limit: 250,
    batchSize: 500,
    minConfidence: 0.78,
    matchStatuses: ["suggested_high_confidence", "confirmed"],
    generatedBy: "field_suggestion_metadata_v1",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--out" && next) {
      args.out = path.resolve(next);
      index += 1;
    } else if (arg === "--execute") {
      args.execute = true;
    } else if (arg === "--limit" && next) {
      args.limit = Math.max(Number(next) || 0, 0);
      index += 1;
    } else if (arg === "--batch-size" && next) {
      args.batchSize = Math.min(Math.max(Number(next) || 500, 1), 5000);
      index += 1;
    } else if (arg === "--min-confidence" && next) {
      args.minConfidence = Math.min(Math.max(Number(next) || 0.78, 0), 1);
      index += 1;
    } else if (arg === "--match-statuses" && next) {
      args.matchStatuses = next
        .split(",")
        .map((status) => status.trim())
        .filter(Boolean);
      index += 1;
    } else if (arg === "--generated-by" && next) {
      args.generatedBy = next.trim() || "field_suggestion_metadata_v1";
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
  railway run --service Postgres -- npm run field-suggestions:preview -- --limit 100
  railway run --service Postgres -- npm run field-suggestions:preview -- --limit 100 --execute

Options:
  --execute                    Write rows to field_suggestion_candidates. Default is dry-run only.
  --out <dir>                  Output directory. Defaults to ../source-data/field-suggestion-preview.
  --limit <n>                  Max suggestions to preview/write. Defaults to 250. Use 0 for unlimited.
  --batch-size <n>             PostgreSQL write batch size. Defaults to 500.
  --min-confidence <0-1>       Minimum source match confidence. Defaults to 0.78.
  --match-statuses <codes>     Comma-separated match statuses to use.
                               Defaults to suggested_high_confidence,confirmed.
  --generated-by <code>        Generator label. Defaults to field_suggestion_metadata_v1.

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
    "confidence_score",
    "suggestion_status_code",
    "suggestion_reason",
    "source_reference",
    "source_title",
    "source_type_code",
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

async function listFieldSuggestionCandidates(pool, args) {
  const result = await pool.query(
    `
    WITH matched_sources AS (
      SELECT
        c.match_candidate_id::text,
        c.confirmed_entity_source_id::text,
        c.source_id::text,
        c.entity_type,
        c.entity_id::text,
        c.entity_label,
        c.confidence_score::float8 AS match_confidence,
        c.match_status_code,
        c.match_reason,
        s.source_reference,
        s.title AS source_title,
        s.url AS source_url,
        s.source_type_code,
        s.content_type_code,
        s.country AS source_country,
        s.visibility_code,
        NULLIF(s.metadata_json->>'inferred_use_type', '') AS inferred_use_type
      FROM source_entity_match_candidates c
      JOIN sources s ON s.source_id = c.source_id
      WHERE c.entity_id IS NOT NULL
        AND c.entity_type = ANY($2::text[])
        AND c.match_status_code = ANY($3::text[])
        AND c.confidence_score >= $1::numeric
    ),
    normalized_matched_sources AS (
      SELECT
        *,
        CASE lower(inferred_use_type)
          WHEN 'power' THEN 'power'
          WHEN 'direct_use' THEN 'direct_use'
          WHEN 'direct-use' THEN 'direct_use'
          WHEN 'direct use' THEN 'direct_use'
          WHEN 'hybrid' THEN 'hybrid'
          WHEN 'hybrid_mineral' THEN 'hybrid'
          WHEN 'mineral' THEN 'mineral_extraction'
          WHEN 'mineral_extraction' THEN 'mineral_extraction'
          ELSE NULL
        END AS suggested_use_type_code
      FROM matched_sources
    ),
    use_type_matches AS (
      SELECT *
      FROM normalized_matched_sources
      WHERE inferred_use_type IS NOT NULL
        AND lower(inferred_use_type) <> 'unknown'
    ),
    capacity_matches AS (
      SELECT
        *,
        regexp_match(
          COALESCE(source_title, ''),
          '([0-9]+(?:[\\.,][0-9]+)?)\\s*[- ]?\\s*(MWth|MWe|MW)\\b',
          'i'
        ) AS capacity_match
      FROM normalized_matched_sources
    ),
    capacity_signals AS (
      SELECT
        *,
        replace(capacity_match[1], ',', '.')::numeric AS suggested_capacity_value,
        CASE
          WHEN lower(capacity_match[2]) = 'mwth' THEN 'thermal_capacity_mwth'
          WHEN lower(capacity_match[2]) = 'mwe' THEN 'electric_capacity_mwe'
          WHEN suggested_use_type_code = 'direct_use' THEN 'thermal_capacity_mwth'
          ELSE 'electric_capacity_mwe'
        END AS suggested_capacity_field,
        CASE
          WHEN lower(capacity_match[2]) = 'mwth' THEN 'MWth'
          WHEN lower(capacity_match[2]) = 'mwe' THEN 'MWe'
          WHEN suggested_use_type_code = 'direct_use' THEN 'MWth'
          ELSE 'MWe'
        END AS suggested_capacity_unit,
        CASE
          WHEN lower(capacity_match[2]) IN ('mwth', 'mwe')
            THEN least(0.84, match_confidence * 0.88)
          ELSE least(0.78, match_confidence * 0.78)
        END AS capacity_confidence
      FROM capacity_matches
      WHERE capacity_match IS NOT NULL
    ),
    project_country AS (
      SELECT
        concat('source-meta-country:', m.source_id, ':project:', p.project_id) AS suggestion_key,
        'project' AS entity_type,
        p.project_id::text,
        NULL::text AS operating_asset_id,
        NULL::text AS company_id,
        p.project_name AS entity_label,
        'country' AS field_name,
        p.country AS current_value,
        m.source_country AS suggested_value,
        jsonb_build_object('value', m.source_country) AS normalized_value,
        NULL::text AS unit_code,
        m.source_id,
        m.match_candidate_id AS source_entity_match_candidate_id,
        m.confirmed_entity_source_id AS linked_entity_source_id,
        NULL::text AS evidence_note,
        m.match_confidence AS confidence_score,
        'Source country metadata from matched source candidate; current field is empty.' AS suggestion_reason,
        jsonb_build_object(
          'suggested_from', 'source_metadata_country',
          'source_reference', m.source_reference,
          'source_title', m.source_title,
          'source_url', m.source_url,
          'source_type_code', m.source_type_code,
          'content_type_code', m.content_type_code,
          'source_match_status_code', m.match_status_code,
          'source_match_confidence', m.match_confidence,
          'source_match_reason', m.match_reason,
          'body_text_read', false,
          'entity_fields_updated', false,
          'entity_source_link_created', false
        ) AS suggestion_metadata,
        m.source_reference,
        m.source_title,
        m.source_type_code,
        m.match_status_code AS source_match_status_code
      FROM matched_sources m
      JOIN projects p ON m.entity_type = 'project' AND p.project_id = m.entity_id::uuid
      WHERE NULLIF(BTRIM(m.source_country), '') IS NOT NULL
        AND NULLIF(BTRIM(p.country), '') IS NULL
    ),
    asset_country AS (
      SELECT
        concat('source-meta-country:', m.source_id, ':operating_asset:', a.operating_asset_id) AS suggestion_key,
        'operating_asset' AS entity_type,
        NULL::text AS project_id,
        a.operating_asset_id::text,
        NULL::text AS company_id,
        a.asset_name AS entity_label,
        'country' AS field_name,
        a.country AS current_value,
        m.source_country AS suggested_value,
        jsonb_build_object('value', m.source_country) AS normalized_value,
        NULL::text AS unit_code,
        m.source_id,
        m.match_candidate_id AS source_entity_match_candidate_id,
        m.confirmed_entity_source_id AS linked_entity_source_id,
        NULL::text AS evidence_note,
        m.match_confidence AS confidence_score,
        'Source country metadata from matched source candidate; current field is empty.' AS suggestion_reason,
        jsonb_build_object(
          'suggested_from', 'source_metadata_country',
          'source_reference', m.source_reference,
          'source_title', m.source_title,
          'source_url', m.source_url,
          'source_type_code', m.source_type_code,
          'content_type_code', m.content_type_code,
          'source_match_status_code', m.match_status_code,
          'source_match_confidence', m.match_confidence,
          'source_match_reason', m.match_reason,
          'body_text_read', false,
          'entity_fields_updated', false,
          'entity_source_link_created', false
        ) AS suggestion_metadata,
        m.source_reference,
        m.source_title,
        m.source_type_code,
        m.match_status_code AS source_match_status_code
      FROM matched_sources m
      JOIN operating_assets a ON m.entity_type = 'operating_asset' AND a.operating_asset_id = m.entity_id::uuid
      WHERE NULLIF(BTRIM(m.source_country), '') IS NOT NULL
        AND NULLIF(BTRIM(a.country), '') IS NULL
    ),
    project_use_type AS (
      SELECT
        concat('source-meta-use-type:', m.source_id, ':project:', p.project_id) AS suggestion_key,
        'project' AS entity_type,
        p.project_id::text,
        NULL::text AS operating_asset_id,
        NULL::text AS company_id,
        p.project_name AS entity_label,
        'primary_use_type_code' AS field_name,
        p.primary_use_type_code AS current_value,
        m.suggested_use_type_code AS suggested_value,
        jsonb_build_object(
          'code', m.suggested_use_type_code,
          'source_metadata_value', m.inferred_use_type
        ) AS normalized_value,
        NULL::text AS unit_code,
        m.source_id,
        m.match_candidate_id AS source_entity_match_candidate_id,
        m.confirmed_entity_source_id AS linked_entity_source_id,
        NULL::text AS evidence_note,
        least(0.95, m.match_confidence * 0.9) AS confidence_score,
        'Article/source metadata suggests a geothermal use type; current use type is unknown or empty.' AS suggestion_reason,
        jsonb_build_object(
          'suggested_from', 'source_metadata_inferred_use_type',
          'source_reference', m.source_reference,
          'source_title', m.source_title,
          'source_url', m.source_url,
          'source_type_code', m.source_type_code,
          'content_type_code', m.content_type_code,
          'inferred_use_type', m.inferred_use_type,
          'source_match_status_code', m.match_status_code,
          'source_match_confidence', m.match_confidence,
          'source_match_reason', m.match_reason,
          'body_text_read', false,
          'entity_fields_updated', false,
          'entity_source_link_created', false
        ) AS suggestion_metadata,
        m.source_reference,
        m.source_title,
        m.source_type_code,
        m.match_status_code AS source_match_status_code
      FROM use_type_matches m
      JOIN ref_geothermal_use_types r ON r.code = m.suggested_use_type_code
      JOIN projects p ON m.entity_type = 'project' AND p.project_id = m.entity_id::uuid
      WHERE COALESCE(NULLIF(BTRIM(p.primary_use_type_code), ''), 'unknown') = 'unknown'
        AND m.suggested_use_type_code <> 'unknown'
    ),
    asset_use_type AS (
      SELECT
        concat('source-meta-use-type:', m.source_id, ':operating_asset:', a.operating_asset_id) AS suggestion_key,
        'operating_asset' AS entity_type,
        NULL::text AS project_id,
        a.operating_asset_id::text,
        NULL::text AS company_id,
        a.asset_name AS entity_label,
        'primary_use_type_code' AS field_name,
        a.primary_use_type_code AS current_value,
        m.suggested_use_type_code AS suggested_value,
        jsonb_build_object(
          'code', m.suggested_use_type_code,
          'source_metadata_value', m.inferred_use_type
        ) AS normalized_value,
        NULL::text AS unit_code,
        m.source_id,
        m.match_candidate_id AS source_entity_match_candidate_id,
        m.confirmed_entity_source_id AS linked_entity_source_id,
        NULL::text AS evidence_note,
        least(0.95, m.match_confidence * 0.9) AS confidence_score,
        'Article/source metadata suggests a geothermal use type; current use type is unknown or empty.' AS suggestion_reason,
        jsonb_build_object(
          'suggested_from', 'source_metadata_inferred_use_type',
          'source_reference', m.source_reference,
          'source_title', m.source_title,
          'source_url', m.source_url,
          'source_type_code', m.source_type_code,
          'content_type_code', m.content_type_code,
          'inferred_use_type', m.inferred_use_type,
          'source_match_status_code', m.match_status_code,
          'source_match_confidence', m.match_confidence,
          'source_match_reason', m.match_reason,
          'body_text_read', false,
          'entity_fields_updated', false,
          'entity_source_link_created', false
        ) AS suggestion_metadata,
        m.source_reference,
        m.source_title,
        m.source_type_code,
        m.match_status_code AS source_match_status_code
      FROM use_type_matches m
      JOIN ref_geothermal_use_types r ON r.code = m.suggested_use_type_code
      JOIN operating_assets a ON m.entity_type = 'operating_asset' AND a.operating_asset_id = m.entity_id::uuid
      WHERE COALESCE(NULLIF(BTRIM(a.primary_use_type_code), ''), 'unknown') = 'unknown'
        AND m.suggested_use_type_code <> 'unknown'
    ),
    project_title_capacity AS (
      SELECT
        concat('source-title-capacity:', m.source_id, ':project:', p.project_id, ':', m.suggested_capacity_field) AS suggestion_key,
        'project' AS entity_type,
        p.project_id::text,
        NULL::text AS operating_asset_id,
        NULL::text AS company_id,
        p.project_name AS entity_label,
        m.suggested_capacity_field AS field_name,
        CASE
          WHEN m.suggested_capacity_field = 'thermal_capacity_mwth'
            THEN p.thermal_capacity_mwth::text
          ELSE p.electric_capacity_mwe::text
        END AS current_value,
        m.suggested_capacity_value::text AS suggested_value,
        jsonb_build_object(
          'value', m.suggested_capacity_value,
          'unit', m.suggested_capacity_unit,
          'field', m.suggested_capacity_field,
          'source_title_capacity_token', concat(m.capacity_match[1], ' ', m.capacity_match[2])
        ) AS normalized_value,
        m.suggested_capacity_unit AS unit_code,
        m.source_id,
        m.match_candidate_id AS source_entity_match_candidate_id,
        m.confirmed_entity_source_id AS linked_entity_source_id,
        NULL::text AS evidence_note,
        m.capacity_confidence AS confidence_score,
        'Matched source title contains a capacity signal; the project has no structured capacity values yet.' AS suggestion_reason,
        jsonb_build_object(
          'suggested_from', 'source_title_capacity_signal',
          'source_reference', m.source_reference,
          'source_title', m.source_title,
          'source_url', m.source_url,
          'source_type_code', m.source_type_code,
          'content_type_code', m.content_type_code,
          'capacity_token', concat(m.capacity_match[1], ' ', m.capacity_match[2]),
          'source_match_status_code', m.match_status_code,
          'source_match_confidence', m.match_confidence,
          'source_match_reason', m.match_reason,
          'body_text_read', false,
          'entity_fields_updated', false,
          'entity_source_link_created', false
        ) AS suggestion_metadata,
        m.source_reference,
        m.source_title,
        m.source_type_code,
        m.match_status_code AS source_match_status_code
      FROM capacity_signals m
      JOIN projects p ON m.entity_type = 'project' AND p.project_id = m.entity_id::uuid
      WHERE p.potential_min_mwe IS NULL
        AND p.potential_max_mwe IS NULL
        AND p.electric_capacity_mwe IS NULL
        AND p.thermal_capacity_mwth IS NULL
    ),
    asset_title_capacity AS (
      SELECT
        concat('source-title-capacity:', m.source_id, ':operating_asset:', a.operating_asset_id, ':', m.suggested_capacity_field) AS suggestion_key,
        'operating_asset' AS entity_type,
        NULL::text AS project_id,
        a.operating_asset_id::text,
        NULL::text AS company_id,
        a.asset_name AS entity_label,
        m.suggested_capacity_field AS field_name,
        CASE
          WHEN m.suggested_capacity_field = 'thermal_capacity_mwth'
            THEN a.thermal_capacity_mwth::text
          ELSE a.electric_capacity_mwe::text
        END AS current_value,
        m.suggested_capacity_value::text AS suggested_value,
        jsonb_build_object(
          'value', m.suggested_capacity_value,
          'unit', m.suggested_capacity_unit,
          'field', m.suggested_capacity_field,
          'source_title_capacity_token', concat(m.capacity_match[1], ' ', m.capacity_match[2])
        ) AS normalized_value,
        m.suggested_capacity_unit AS unit_code,
        m.source_id,
        m.match_candidate_id AS source_entity_match_candidate_id,
        m.confirmed_entity_source_id AS linked_entity_source_id,
        NULL::text AS evidence_note,
        m.capacity_confidence AS confidence_score,
        'Matched source title contains a capacity signal; the plant has no structured capacity values yet.' AS suggestion_reason,
        jsonb_build_object(
          'suggested_from', 'source_title_capacity_signal',
          'source_reference', m.source_reference,
          'source_title', m.source_title,
          'source_url', m.source_url,
          'source_type_code', m.source_type_code,
          'content_type_code', m.content_type_code,
          'capacity_token', concat(m.capacity_match[1], ' ', m.capacity_match[2]),
          'source_match_status_code', m.match_status_code,
          'source_match_confidence', m.match_confidence,
          'source_match_reason', m.match_reason,
          'body_text_read', false,
          'entity_fields_updated', false,
          'entity_source_link_created', false
        ) AS suggestion_metadata,
        m.source_reference,
        m.source_title,
        m.source_type_code,
        m.match_status_code AS source_match_status_code
      FROM capacity_signals m
      JOIN operating_assets a ON m.entity_type = 'operating_asset' AND a.operating_asset_id = m.entity_id::uuid
      WHERE a.potential_min_mwe IS NULL
        AND a.potential_max_mwe IS NULL
        AND a.electric_capacity_mwe IS NULL
        AND a.electric_capacity_running_mwe IS NULL
        AND a.thermal_capacity_mwth IS NULL
    ),
    company_website AS (
      SELECT
        concat('source-company-website:', m.source_id, ':company:', c.company_id) AS suggestion_key,
        'company' AS entity_type,
        NULL::text AS project_id,
        NULL::text AS operating_asset_id,
        c.company_id::text,
        c.company_name AS entity_label,
        'website_url' AS field_name,
        c.website_url AS current_value,
        m.source_url AS suggested_value,
        jsonb_build_object('url', m.source_url) AS normalized_value,
        NULL::text AS unit_code,
        m.source_id,
        m.match_candidate_id AS source_entity_match_candidate_id,
        m.confirmed_entity_source_id AS linked_entity_source_id,
        NULL::text AS evidence_note,
        m.match_confidence AS confidence_score,
        'Matched source is a company website; current company website is empty or different.' AS suggestion_reason,
        jsonb_build_object(
          'suggested_from', 'company_website_source_url',
          'source_reference', m.source_reference,
          'source_title', m.source_title,
          'source_url', m.source_url,
          'source_type_code', m.source_type_code,
          'source_match_status_code', m.match_status_code,
          'source_match_confidence', m.match_confidence,
          'source_match_reason', m.match_reason,
          'body_text_read', false,
          'entity_fields_updated', false,
          'entity_source_link_created', false
        ) AS suggestion_metadata,
        m.source_reference,
        m.source_title,
        m.source_type_code,
        m.match_status_code AS source_match_status_code
      FROM matched_sources m
      JOIN companies c ON m.entity_type = 'company' AND c.company_id = m.entity_id::uuid
      WHERE m.source_type_code = 'company_website'
        AND NULLIF(BTRIM(m.source_url), '') IS NOT NULL
        AND (
          NULLIF(BTRIM(c.website_url), '') IS NULL
          OR lower(BTRIM(c.website_url)) <> lower(BTRIM(m.source_url))
        )
    )
    SELECT *
    FROM (
      SELECT * FROM project_country
      UNION ALL
      SELECT * FROM asset_country
      UNION ALL
      SELECT * FROM project_use_type
      UNION ALL
      SELECT * FROM asset_use_type
      UNION ALL
      SELECT * FROM project_title_capacity
      UNION ALL
      SELECT * FROM asset_title_capacity
      UNION ALL
      SELECT * FROM company_website
    ) suggestions
    ORDER BY confidence_score DESC, entity_type, entity_label, field_name, source_reference
    LIMIT NULLIF($4::int, 0)
    `,
    [
      args.minConfidence,
      ["project", "operating_asset", "company"],
      args.matchStatuses,
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
    matchStatuses,
    sourceMetadata,
    matchedSourceMetadata,
    fieldOpportunities,
    existingSuggestions,
  ] =
    await Promise.all([
      pool.query(
        `
        SELECT match_status_code, entity_type, COUNT(*)::int AS count
        FROM source_entity_match_candidates
        GROUP BY match_status_code, entity_type
        ORDER BY match_status_code, entity_type
        `
      ),
      pool.query(
        `
        SELECT
          COUNT(*)::int AS total_sources,
          COUNT(*) FILTER (
            WHERE country IS NOT NULL AND BTRIM(country) <> ''
          )::int AS sources_with_country,
          COUNT(*) FILTER (
            WHERE NULLIF(metadata_json->>'inferred_use_type', '') IS NOT NULL
              AND metadata_json->>'inferred_use_type' <> 'unknown'
          )::int AS sources_with_inferred_use_type,
          COUNT(*) FILTER (
            WHERE source_type_code = 'company_website'
              AND url IS NOT NULL
              AND BTRIM(url) <> ''
          )::int AS company_website_sources
        FROM sources
        `
      ),
      pool.query(
        `
        SELECT
          COUNT(*)::int AS matched_sources,
          COUNT(*) FILTER (
            WHERE s.country IS NOT NULL AND BTRIM(s.country) <> ''
          )::int AS matched_sources_with_country,
          COUNT(*) FILTER (
            WHERE NULLIF(s.metadata_json->>'inferred_use_type', '') IS NOT NULL
              AND s.metadata_json->>'inferred_use_type' <> 'unknown'
          )::int AS matched_sources_with_inferred_use_type,
          COUNT(*) FILTER (
            WHERE s.source_type_code = 'company_website'
              AND s.url IS NOT NULL
              AND BTRIM(s.url) <> ''
          )::int AS matched_company_website_sources
        FROM source_entity_match_candidates c
        JOIN sources s ON s.source_id = c.source_id
        WHERE c.entity_id IS NOT NULL
          AND c.entity_type = ANY($2::text[])
          AND c.match_status_code = ANY($3::text[])
          AND c.confidence_score >= $1::numeric
        `,
        [
          args.minConfidence,
          ["project", "operating_asset", "company"],
          args.matchStatuses,
        ]
      ),
      pool.query(
        `
        WITH matched_sources AS (
          SELECT
            c.match_candidate_id,
            c.source_id,
            c.entity_type,
            c.entity_id,
            c.confidence_score::float8 AS match_confidence,
            c.match_status_code,
            s.title AS source_title,
            s.source_type_code,
            s.url AS source_url,
            s.country AS source_country,
            NULLIF(s.metadata_json->>'inferred_use_type', '') AS inferred_use_type
          FROM source_entity_match_candidates c
          JOIN sources s ON s.source_id = c.source_id
          WHERE c.entity_id IS NOT NULL
            AND c.entity_type = ANY($2::text[])
            AND c.match_status_code = ANY($3::text[])
            AND c.confidence_score >= $1::numeric
        ),
        normalized_matches AS (
          SELECT
            *,
            CASE lower(inferred_use_type)
              WHEN 'power' THEN 'power'
              WHEN 'direct_use' THEN 'direct_use'
              WHEN 'direct-use' THEN 'direct_use'
              WHEN 'direct use' THEN 'direct_use'
              WHEN 'hybrid' THEN 'hybrid'
              WHEN 'hybrid_mineral' THEN 'hybrid'
              WHEN 'mineral' THEN 'mineral_extraction'
              WHEN 'mineral_extraction' THEN 'mineral_extraction'
              ELSE NULL
            END AS suggested_use_type_code,
            regexp_match(
              COALESCE(source_title, ''),
              '([0-9]+(?:[\\.,][0-9]+)?)\\s*[- ]?\\s*(MWth|MWe|MW)\\b',
              'i'
            ) AS capacity_match
          FROM matched_sources
        )
        SELECT
          COUNT(*)::int AS matched_sources,
          COUNT(*) FILTER (
            WHERE m.entity_type = 'project'
              AND NULLIF(BTRIM(m.source_country), '') IS NOT NULL
          )::int AS project_matches_with_source_country,
          COUNT(*) FILTER (
            WHERE m.entity_type = 'project'
              AND NULLIF(BTRIM(m.source_country), '') IS NOT NULL
              AND NULLIF(BTRIM(p.country), '') IS NULL
          )::int AS project_country_empty_opportunities,
          COUNT(*) FILTER (
            WHERE m.entity_type = 'project'
              AND NULLIF(BTRIM(m.source_country), '') IS NOT NULL
              AND NULLIF(BTRIM(p.country), '') IS NOT NULL
          )::int AS project_country_already_filled,
          COUNT(*) FILTER (
            WHERE m.entity_type = 'operating_asset'
              AND NULLIF(BTRIM(m.source_country), '') IS NOT NULL
          )::int AS asset_matches_with_source_country,
          COUNT(*) FILTER (
            WHERE m.entity_type = 'operating_asset'
              AND NULLIF(BTRIM(m.source_country), '') IS NOT NULL
              AND NULLIF(BTRIM(a.country), '') IS NULL
          )::int AS asset_country_empty_opportunities,
          COUNT(*) FILTER (
            WHERE m.entity_type = 'operating_asset'
              AND NULLIF(BTRIM(m.source_country), '') IS NOT NULL
              AND NULLIF(BTRIM(a.country), '') IS NOT NULL
          )::int AS asset_country_already_filled,
          COUNT(*) FILTER (
            WHERE m.entity_type = 'project'
              AND m.suggested_use_type_code IS NOT NULL
          )::int AS project_matches_with_use_type_signal,
          COUNT(*) FILTER (
            WHERE m.entity_type = 'project'
              AND m.suggested_use_type_code IS NOT NULL
              AND COALESCE(NULLIF(BTRIM(p.primary_use_type_code), ''), 'unknown') = 'unknown'
          )::int AS project_use_type_unknown_opportunities,
          COUNT(*) FILTER (
            WHERE m.entity_type = 'project'
              AND m.suggested_use_type_code IS NOT NULL
              AND COALESCE(NULLIF(BTRIM(p.primary_use_type_code), ''), 'unknown') <> 'unknown'
          )::int AS project_use_type_already_filled,
          COUNT(*) FILTER (
            WHERE m.entity_type = 'operating_asset'
              AND m.suggested_use_type_code IS NOT NULL
          )::int AS asset_matches_with_use_type_signal,
          COUNT(*) FILTER (
            WHERE m.entity_type = 'operating_asset'
              AND m.suggested_use_type_code IS NOT NULL
              AND COALESCE(NULLIF(BTRIM(a.primary_use_type_code), ''), 'unknown') = 'unknown'
          )::int AS asset_use_type_unknown_opportunities,
          COUNT(*) FILTER (
            WHERE m.entity_type = 'operating_asset'
              AND m.suggested_use_type_code IS NOT NULL
              AND COALESCE(NULLIF(BTRIM(a.primary_use_type_code), ''), 'unknown') <> 'unknown'
          )::int AS asset_use_type_already_filled,
          COUNT(*) FILTER (
            WHERE m.entity_type = 'project'
              AND m.capacity_match IS NOT NULL
          )::int AS project_matches_with_title_capacity_signal,
          COUNT(*) FILTER (
            WHERE m.entity_type = 'project'
              AND m.capacity_match IS NOT NULL
              AND p.potential_min_mwe IS NULL
              AND p.potential_max_mwe IS NULL
              AND p.electric_capacity_mwe IS NULL
              AND p.thermal_capacity_mwth IS NULL
          )::int AS project_capacity_empty_opportunities,
          COUNT(*) FILTER (
            WHERE m.entity_type = 'project'
              AND m.capacity_match IS NOT NULL
              AND (
                p.potential_min_mwe IS NOT NULL
                OR p.potential_max_mwe IS NOT NULL
                OR p.electric_capacity_mwe IS NOT NULL
                OR p.thermal_capacity_mwth IS NOT NULL
              )
          )::int AS project_capacity_already_filled,
          COUNT(*) FILTER (
            WHERE m.entity_type = 'operating_asset'
              AND m.capacity_match IS NOT NULL
          )::int AS asset_matches_with_title_capacity_signal,
          COUNT(*) FILTER (
            WHERE m.entity_type = 'operating_asset'
              AND m.capacity_match IS NOT NULL
              AND a.potential_min_mwe IS NULL
              AND a.potential_max_mwe IS NULL
              AND a.electric_capacity_mwe IS NULL
              AND a.electric_capacity_running_mwe IS NULL
              AND a.thermal_capacity_mwth IS NULL
          )::int AS asset_capacity_empty_opportunities,
          COUNT(*) FILTER (
            WHERE m.entity_type = 'operating_asset'
              AND m.capacity_match IS NOT NULL
              AND (
                a.potential_min_mwe IS NOT NULL
                OR a.potential_max_mwe IS NOT NULL
                OR a.electric_capacity_mwe IS NOT NULL
                OR a.electric_capacity_running_mwe IS NOT NULL
                OR a.thermal_capacity_mwth IS NOT NULL
              )
          )::int AS asset_capacity_already_filled,
          COUNT(*) FILTER (
            WHERE m.entity_type = 'company'
              AND m.source_type_code = 'company_website'
              AND NULLIF(BTRIM(m.source_url), '') IS NOT NULL
          )::int AS company_website_source_matches,
          COUNT(*) FILTER (
            WHERE m.entity_type = 'company'
              AND m.source_type_code = 'company_website'
              AND NULLIF(BTRIM(m.source_url), '') IS NOT NULL
              AND (
                NULLIF(BTRIM(c.website_url), '') IS NULL
                OR lower(BTRIM(c.website_url)) <> lower(BTRIM(m.source_url))
              )
          )::int AS company_website_opportunities
        FROM normalized_matches m
        LEFT JOIN projects p
          ON m.entity_type = 'project' AND p.project_id = m.entity_id
        LEFT JOIN operating_assets a
          ON m.entity_type = 'operating_asset' AND a.operating_asset_id = m.entity_id
        LEFT JOIN companies c
          ON m.entity_type = 'company' AND c.company_id = m.entity_id
        `,
        [
          args.minConfidence,
          ["project", "operating_asset", "company"],
          args.matchStatuses,
        ]
      ),
      pool.query(
        `
        SELECT suggestion_status_code, entity_type, field_name, COUNT(*)::int AS count
        FROM field_suggestion_candidates
        GROUP BY suggestion_status_code, entity_type, field_name
        ORDER BY suggestion_status_code, entity_type, field_name
        `
      ),
    ]);

  return {
    source_match_candidates_by_status: matchStatuses.rows,
    source_metadata: sourceMetadata.rows[0],
    matched_source_metadata_for_current_filters: matchedSourceMetadata.rows[0],
    field_opportunity_diagnostics: fieldOpportunities.rows[0],
    existing_field_suggestions_by_status: existingSuggestions.rows,
  };
}

async function writePreviewFiles(args, candidates, summary) {
  await fs.mkdir(args.out, { recursive: true });
  await fs.writeFile(
    path.join(args.out, "field_suggestion_preview.csv"),
    toCsv(candidates),
    "utf8"
  );
  await fs.writeFile(
    path.join(args.out, "field_suggestion_summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8"
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const databaseUrl = getDatabaseUrl();
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 3,
    ssl: getSslConfig(databaseUrl),
  });

  try {
    const candidates = await listFieldSuggestionCandidates(pool, args);
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
      min_confidence: args.minConfidence,
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
