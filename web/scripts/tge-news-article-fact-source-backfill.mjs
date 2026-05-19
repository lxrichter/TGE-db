#!/usr/bin/env node

import pg from "pg";

const { Pool } = pg;

const DEFAULT_STATUSES = ["confirmed"];

function parseArgs(argv) {
  const args = {
    execute: false,
    allowRemoteDb: false,
    statuses: DEFAULT_STATUSES,
    limit: 0,
    batchSize: 250,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--statuses" && next) {
      args.statuses = next
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      index += 1;
    } else if (arg === "--limit" && next) {
      args.limit = Math.max(Number(next) || 0, 0);
      index += 1;
    } else if (arg === "--batch-size" && next) {
      args.batchSize = Math.min(Math.max(Number(next) || 250, 1), 1000);
      index += 1;
    } else if (arg === "--execute") {
      args.execute = true;
    } else if (arg === "--allow-remote-db") {
      args.allowRemoteDb = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (args.statuses.length === 0) {
    throw new Error("--statuses must include at least one status.");
  }

  return args;
}

function printHelp() {
  console.log(`
Usage:
  npm run tge-news:fact-source-backfill
  DATABASE_URL="postgresql://localhost:5432/tge_local" npm run tge-news:fact-source-backfill -- --execute

Options:
  --statuses <list>      Article fact statuses to backfill. Default: confirmed.
  --limit <n>            Limit source rows processed. Defaults to all.
  --batch-size <n>       PostgreSQL write batch size. Default: 250.
  --execute              Write sources and relink fact candidates. Default is dry-run only.
  --allow-remote-db      Allow --execute against a non-local DATABASE_URL.

Safety:
  Metadata only. No full article body text. No entity_sources creation.
  No project, plant/facility, company, approval, or export-ready updates.
  Execute mode blocks non-local database URLs unless --allow-remote-db is supplied.
`);
}

function getDatabaseUrl() {
  return process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL || "";
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

function createPool(databaseUrl) {
  return new Pool({
    connectionString: databaseUrl,
    max: 3,
    ssl: getSslConfig(databaseUrl),
  });
}

async function listCandidateArticleSources(pool, args) {
  const limitSql = args.limit > 0 ? `LIMIT ${Number(args.limit)}` : "";
  const result = await pool.query(
    `
    SELECT
      af.source_reference,
      MAX(NULLIF(af.archive_file_path, '')) AS archive_file_path,
      MIN(af.published_date) AS published_date,
      COALESCE(
        MAX(NULLIF(af.extraction_metadata->>'title', '')),
        MAX(NULLIF(af.source_reference, ''))
      ) AS title,
      MAX(NULLIF(af.extraction_metadata->>'url', '')) AS url,
      COUNT(*)::int AS fact_count,
      COUNT(*) FILTER (WHERE af.source_id IS NULL)::int AS unlinked_fact_count,
      MAX(s.source_id)::text AS existing_source_id
    FROM article_fact_candidates af
    LEFT JOIN sources s
      ON s.source_reference = af.source_reference
    WHERE af.fact_status_code = ANY($1::text[])
      AND af.source_reference IS NOT NULL
      AND btrim(af.source_reference) <> ''
    GROUP BY af.source_reference
    ORDER BY fact_count DESC, af.source_reference ASC
    ${limitSql}
    `,
    [args.statuses]
  );

  return result.rows.map((row) => ({
    source_reference: row.source_reference,
    archive_file_path: row.archive_file_path || null,
    published_date: row.published_date
      ? new Date(row.published_date).toISOString().slice(0, 10)
      : null,
    title: row.title || row.source_reference,
    url: row.url || null,
    fact_count: Number(row.fact_count || 0),
    unlinked_fact_count: Number(row.unlinked_fact_count || 0),
    existing_source_id: row.existing_source_id || null,
  }));
}

async function getCurrentCounts(pool) {
  const result = await pool.query(
    `
    SELECT
      (SELECT COUNT(*)::int FROM sources WHERE source_type_code = 'tge_article') AS tge_article_sources,
      (SELECT COUNT(*)::int FROM article_fact_candidates WHERE source_id IS NOT NULL) AS facts_with_source_id,
      (SELECT COUNT(*)::int FROM article_fact_candidates WHERE source_id IS NULL) AS facts_without_source_id
    `
  );

  return result.rows[0];
}

function metadataForSource(row) {
  return {
    import_path: "article_fact_candidate_backfill",
    source_reference_strategy: "TGE-MD-{YYYY-MM-DD-slug}",
    archive_file_path: row.archive_file_path,
    reviewed_fact_count: row.fact_count,
    body_text_stored: false,
    article_body_exported: false,
    entity_fields_updated: false,
    entity_sources_created: false,
  };
}

async function upsertSourceBatch(pool, rows) {
  const payload = rows.map((row) => ({
    source_reference: row.source_reference,
    title: row.title,
    url: row.url,
    published_date: row.published_date,
    archive_file_path: row.archive_file_path,
    metadata_json: metadataForSource(row),
  }));
  const result = await pool.query(
    `
    WITH input AS (
      SELECT *
      FROM jsonb_to_recordset($1::jsonb) AS data(
        source_reference text,
        title text,
        url text,
        published_date date,
        archive_file_path text,
        metadata_json jsonb
      )
    ),
    existing AS (
      SELECT DISTINCT ON (i.source_reference)
        i.source_reference,
        s.source_id
      FROM input i
      JOIN sources s
        ON s.source_reference = i.source_reference
          OR (i.url IS NOT NULL AND s.url = i.url)
      ORDER BY i.source_reference, s.updated_at DESC NULLS LAST, s.created_at DESC
    ),
    updated AS (
      UPDATE sources s
      SET
        source_type_code = 'tge_article',
        title = COALESCE(i.title, s.title),
        url = COALESCE(i.url, s.url),
        source_reference = i.source_reference,
        publisher = 'ThinkGeoEnergy',
        author_organization = COALESCE(s.author_organization, 'ThinkGeoEnergy'),
        published_date = COALESCE(i.published_date, s.published_date),
        accessed_at = COALESCE(s.accessed_at, now()),
        visibility_code = 'public',
        credibility_status_code = COALESCE(s.credibility_status_code, 'needs_review'),
        source_slug = COALESCE(s.source_slug, replace(regexp_replace(i.source_reference, '^TGE-MD-', ''), ' ', '-')),
        content_type_code = COALESCE(s.content_type_code, 'news_article'),
        import_source_code = COALESCE(s.import_source_code, 'article_fact_candidate_backfill'),
        site_code = COALESCE(s.site_code, 'thinkgeoenergy'),
        archive_file_path = COALESCE(i.archive_file_path, s.archive_file_path),
        metadata_json = COALESCE(s.metadata_json, '{}'::jsonb) || COALESCE(i.metadata_json, '{}'::jsonb),
        last_synced_at = now(),
        updated_at = now()
      FROM input i
      JOIN existing e
        ON e.source_reference = i.source_reference
      WHERE s.source_id = e.source_id
      RETURNING s.source_id::text, s.source_reference, false AS inserted
    ),
    inserted AS (
      INSERT INTO sources (
        source_type_code,
        title,
        url,
        source_reference,
        publisher,
        author_organization,
        published_date,
        accessed_at,
        visibility_code,
        credibility_status_code,
        source_slug,
        content_type_code,
        import_source_code,
        site_code,
        archive_file_path,
        metadata_json,
        last_synced_at
      )
      SELECT
        'tge_article',
        i.title,
        i.url,
        i.source_reference,
        'ThinkGeoEnergy',
        'ThinkGeoEnergy',
        i.published_date,
        now(),
        'public',
        'needs_review',
        replace(regexp_replace(i.source_reference, '^TGE-MD-', ''), ' ', '-'),
        'news_article',
        'article_fact_candidate_backfill',
        'thinkgeoenergy',
        i.archive_file_path,
        COALESCE(i.metadata_json, '{}'::jsonb),
        now()
      FROM input i
      WHERE NOT EXISTS (
        SELECT 1
        FROM existing e
        WHERE e.source_reference = i.source_reference
      )
      RETURNING source_id::text, source_reference, true AS inserted
    )
    SELECT * FROM updated
    UNION ALL
    SELECT * FROM inserted
    `,
    [JSON.stringify(payload)]
  );

  return result.rows;
}

async function relinkFactBatch(pool, sourceReferences) {
  const result = await pool.query(
    `
    UPDATE article_fact_candidates af
    SET
      source_id = s.source_id,
      updated_at = now()
    FROM sources s
    WHERE af.source_reference = s.source_reference
      AND af.source_reference = ANY($1::text[])
      AND af.source_id IS DISTINCT FROM s.source_id
    RETURNING af.article_fact_candidate_id
    `,
    [sourceReferences]
  );

  return result.rowCount || 0;
}

async function executeBackfill(pool, rows, batchSize) {
  const stats = {
    inserted_sources: 0,
    updated_sources: 0,
    relinked_fact_candidates: 0,
  };

  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    await pool.query("BEGIN");

    try {
      const sourceRows = await upsertSourceBatch(pool, batch);
      stats.inserted_sources += sourceRows.filter((row) => row.inserted).length;
      stats.updated_sources += sourceRows.filter((row) => !row.inserted).length;
      stats.relinked_fact_candidates += await relinkFactBatch(
        pool,
        batch.map((row) => row.source_reference)
      );
      await pool.query("COMMIT");
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  }

  return stats;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error("DATABASE_PUBLIC_URL or DATABASE_URL is required.");
  }

  if (args.execute && !args.allowRemoteDb && !isLocalDatabaseUrl(databaseUrl)) {
    throw new Error(
      "--execute is blocked for non-local database URLs. Use a local PostgreSQL DATABASE_URL or explicitly pass --allow-remote-db."
    );
  }

  const pool = createPool(databaseUrl);

  try {
    const beforeCounts = await getCurrentCounts(pool);
    const rows = await listCandidateArticleSources(pool, args);
    const missingSourceRows = rows.filter((row) => !row.existing_source_id);
    const unlinkedFactRows = rows.filter((row) => row.unlinked_fact_count > 0);
    const writeStats = args.execute
      ? await executeBackfill(pool, rows, args.batchSize)
      : null;
    const afterCounts = args.execute ? await getCurrentCounts(pool) : null;
    const summary = {
      mode: args.execute ? "execute" : "dry_run",
      statuses: args.statuses,
      candidate_source_rows: rows.length,
      source_rows_missing_before: missingSourceRows.length,
      source_rows_existing_before: rows.length - missingSourceRows.length,
      fact_source_groups_with_unlinked_facts: unlinkedFactRows.length,
      reviewed_fact_candidates_represented: rows.reduce(
        (sum, row) => sum + row.fact_count,
        0
      ),
      before_counts: beforeCounts,
      after_counts: afterCounts,
      write_stats: writeStats,
      database: {
        local_url: isLocalDatabaseUrl(databaseUrl),
        remote_allowed: args.allowRemoteDb,
      },
      privacy: {
        metadata_only: true,
        body_text_read: false,
        body_text_stored: false,
        database_writes: args.execute,
        entity_sources_created: false,
        entity_fields_updated: false,
      },
      sample_sources: rows.slice(0, 10),
    };

    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
