#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Pool } = pg;

const DEFAULT_ARTICLE_INDEX = path.resolve(
  process.cwd(),
  "../source-data/tge-news-archive-preview/article_index_preview.ndjson"
);
const DEFAULT_OUT_DIR = path.resolve(
  process.cwd(),
  "../source-data/tge-news-archive-import"
);

const REQUIRED_SOURCE_COLUMNS = [
  "wordpress_post_id",
  "source_slug",
  "content_type_code",
  "import_source_code",
  "site_code",
  "archive_file_path",
  "metadata_json",
  "last_synced_at",
];

function parseArgs(argv) {
  const args = {
    articleIndex: process.env.TGE_NEWS_ARTICLE_INDEX || DEFAULT_ARTICLE_INDEX,
    out: process.env.TGE_NEWS_IMPORT_OUT || DEFAULT_OUT_DIR,
    execute: false,
    limit: 0,
    batchSize: 500,
    importSource: "markdown_archive",
    siteCode: "thinkgeoenergy",
    languageCode: "en",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--article-index" && next) {
      args.articleIndex = path.resolve(next);
      index += 1;
    } else if (arg === "--out" && next) {
      args.out = path.resolve(next);
      index += 1;
    } else if (arg === "--limit" && next) {
      args.limit = Math.max(Number(next) || 0, 0);
      index += 1;
    } else if (arg === "--batch-size" && next) {
      args.batchSize = Math.min(Math.max(Number(next) || 500, 1), 2000);
      index += 1;
    } else if (arg === "--import-source" && next) {
      args.importSource = next.trim() || "markdown_archive";
      index += 1;
    } else if (arg === "--site-code" && next) {
      args.siteCode = next.trim() || "thinkgeoenergy";
      index += 1;
    } else if (arg === "--language-code" && next) {
      args.languageCode = next.trim() || "en";
      index += 1;
    } else if (arg === "--execute") {
      args.execute = true;
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
  npm run tge-news:import -- --limit 25
  railway run --service Postgres -- npm run tge-news:import -- --execute

Options:
  --article-index <file>  Article metadata NDJSON from tge-news:preview.
  --out <dir>             Local ignored output directory.
  --limit <n>             Import/check only first n article rows. Defaults to all.
  --batch-size <n>        PostgreSQL write batch size. Defaults to 500.
  --import-source <code>  Defaults to markdown_archive.
  --site-code <code>      Defaults to thinkgeoenergy.
  --language-code <code>  Defaults to en.
  --execute               Write to PostgreSQL. Without this, the command is dry-run only.

Privacy:
  This command imports article metadata only. It does not read or store full
  article body text. It writes PostgreSQL only when --execute is provided.
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

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    return null;
  }

  return databaseUrl;
}

function requireDatabaseUrl() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error("DATABASE_PUBLIC_URL or DATABASE_URL is required with --execute.");
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

function createPool(databaseUrl) {
  return new Pool({
    connectionString: databaseUrl,
    max: 3,
    ssl: getSslConfig(databaseUrl),
  });
}

async function loadArticles(articleIndexPath, limit) {
  const text = await fs.readFile(articleIndexPath, "utf8");
  const lines = text.split(/\r?\n/).filter(Boolean);
  const limitedLines = limit > 0 ? lines.slice(0, limit) : lines;

  return limitedLines.map((line) => JSON.parse(line));
}

function normalizeList(value) {
  return Array.isArray(value)
    ? value.map(String).map((item) => item.trim()).filter(Boolean)
    : [];
}

function includesAny(values, terms) {
  const normalized = new Set(values.map((value) => value.toLowerCase()));
  return terms.some((term) => normalized.has(term));
}

function inferContentType(article) {
  const categories = normalizeList(article.categories).map((value) =>
    value.toLowerCase()
  );
  const tags = normalizeList(article.tags).map((value) => value.toLowerCase());
  const combined = [...categories, ...tags];
  const title = String(article.title || "").toLowerCase();

  if (includesAny(combined, ["jobs", "job", "job-posting"]) || title.includes("job")) {
    return "job_posting";
  }

  if (includesAny(combined, ["podcast"])) {
    return "podcast";
  }

  if (
    includesAny(combined, ["events", "event", "webinar", "conference"]) ||
    title.includes("webinar")
  ) {
    return "event";
  }

  if (includesAny(combined, ["sponsored", "sponsored-content"])) {
    return "sponsored_content";
  }

  if (includesAny(combined, ["opinion", "commentary"])) {
    return "opinion_commentary";
  }

  return "news_article";
}

function buildMetadataJson(article) {
  return {
    categories: normalizeList(article.categories),
    tags: normalizeList(article.tags),
    inferred_use_type: article.inferred_use_type || "unknown",
    relative_path: article.relative_path || null,
    link_count: Number(article.link_count || 0),
    internal_tge_link_count: Number(article.internal_tge_link_count || 0),
    source_link_count: Number(article.source_link_count || 0),
    word_count: Number(article.word_count || 0),
    source_reference_strategy: "TGE-MD-{YYYY-MM-DD-slug}",
    body_text_stored: false,
  };
}

function normalizeArticleForImport(article, args) {
  const sourceReference = String(article.source_reference || "").trim();
  const title = String(article.title || "").trim();
  const url = String(article.url || "").trim();
  const slug = String(article.slug || "").trim();
  const publishedDate = String(article.published_date || "").slice(0, 10);
  const contentType = inferContentType(article);
  const metadata = buildMetadataJson(article);

  if (!sourceReference || !title || !url || !publishedDate || !slug) {
    return null;
  }

  return {
    wordpress_post_id: article.wordpress_post_id || null,
    source_reference: sourceReference,
    title,
    url,
    published_date: publishedDate,
    source_slug: slug,
    content_type_code: contentType,
    import_source_code: args.importSource,
    site_code: args.siteCode,
    archive_file_path: article.relative_path || null,
    language_code: args.languageCode,
    metadata_json: metadata,
  };
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

async function getMissingSourceColumns(pool) {
  const result = await pool.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sources'
      AND column_name = ANY($1::text[])
    `,
    [REQUIRED_SOURCE_COLUMNS]
  );
  const existing = new Set(result.rows.map((row) => row.column_name));
  return REQUIRED_SOURCE_COLUMNS.filter((column) => !existing.has(column));
}

async function getExistingArticleCounts(pool, importSource) {
  const result = await pool.query(
    `
    SELECT
      COUNT(*)::int AS total_tge_articles,
      COUNT(*) FILTER (WHERE import_source_code = $1)::int AS matching_import_source,
      COUNT(*) FILTER (WHERE source_reference LIKE 'TGE-MD-%')::int AS markdown_reference_count
    FROM sources
    WHERE source_type_code = 'tge_article'
    `,
    [importSource]
  );

  return result.rows[0];
}

async function upsertArticle(pool, article) {
  const result = await pool.query(
    `
    WITH existing AS (
      SELECT source_id
      FROM sources
      WHERE (
          $1::bigint IS NOT NULL
          AND wordpress_post_id = $1::bigint
        )
        OR source_reference = $2
        OR url = $3
      ORDER BY
        CASE
          WHEN $1::bigint IS NOT NULL AND wordpress_post_id = $1::bigint THEN 1
          WHEN source_reference = $2 THEN 2
          WHEN url = $3 THEN 3
          ELSE 4
        END,
        updated_at DESC NULLS LAST,
        created_at DESC
      LIMIT 1
    ),
    updated AS (
      UPDATE sources
      SET
        source_type_code = 'tge_article',
        title = $4,
        url = $3,
        source_reference = $2,
        publisher = 'ThinkGeoEnergy',
        author_organization = COALESCE(author_organization, 'ThinkGeoEnergy'),
        published_date = $5::date,
        accessed_at = COALESCE(accessed_at, now()),
        language_code = $12,
        visibility_code = 'public',
        wordpress_post_id = $1::bigint,
        source_slug = $6,
        content_type_code = $7,
        import_source_code = $8,
        site_code = $9,
        archive_file_path = $10,
        metadata_json = $11::jsonb,
        last_synced_at = now(),
        updated_at = now()
      WHERE source_id = (SELECT source_id FROM existing)
      RETURNING source_id::text, false AS inserted
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
        language_code,
        visibility_code,
        credibility_status_code,
        wordpress_post_id,
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
        $4,
        $3,
        $2,
        'ThinkGeoEnergy',
        'ThinkGeoEnergy',
        $5::date,
        now(),
        $12,
        'public',
        'needs_review',
        $1::bigint,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11::jsonb,
        now()
      WHERE NOT EXISTS (SELECT 1 FROM updated)
      RETURNING source_id::text, true AS inserted
    )
    SELECT * FROM updated
    UNION ALL
    SELECT * FROM inserted
    `,
    [
      article.wordpress_post_id,
      article.source_reference,
      article.url,
      article.title,
      article.published_date,
      article.source_slug,
      article.content_type_code,
      article.import_source_code,
      article.site_code,
      article.archive_file_path,
      JSON.stringify(article.metadata_json),
      article.language_code,
    ]
  );

  return result.rows[0];
}

async function importArticles(pool, articles, batchSize) {
  const stats = {
    inserted: 0,
    updated: 0,
  };

  for (let index = 0; index < articles.length; index += batchSize) {
    const batch = articles.slice(index, index + batchSize);
    await pool.query("BEGIN");

    try {
      for (const article of batch) {
        const result = await upsertArticle(pool, article);

        if (result?.inserted) {
          stats.inserted += 1;
        } else {
          stats.updated += 1;
        }
      }

      await pool.query("COMMIT");
      console.log(
        `Imported batch ${Math.floor(index / batchSize) + 1}: ${Math.min(
          index + batchSize,
          articles.length
        )}/${articles.length}`
      );
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  }

  return stats;
}

async function writeSummary(args, summary) {
  await fs.mkdir(args.out, { recursive: true });
  await fs.writeFile(
    path.join(args.out, "article_import_summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!(await pathExists(args.articleIndex))) {
    throw new Error(`Article index does not exist: ${args.articleIndex}`);
  }

  const rawArticles = await loadArticles(args.articleIndex, args.limit);
  const articles = rawArticles
    .map((article) => normalizeArticleForImport(article, args))
    .filter(Boolean);
  const skipped = rawArticles.length - articles.length;
  const databaseUrl = args.execute ? requireDatabaseUrl() : getDatabaseUrl();
  let pool = null;
  let existingCounts = null;
  let missingColumns = [];
  let importStats = null;

  if (databaseUrl) {
    pool = createPool(databaseUrl);
    missingColumns = await getMissingSourceColumns(pool);

    if (missingColumns.length) {
      throw new Error(
        `Missing source metadata columns. Run migrations first: ${missingColumns.join(
          ", "
        )}`
      );
    }

    existingCounts = await getExistingArticleCounts(pool, args.importSource);
  }

  if (args.execute) {
    importStats = await importArticles(pool, articles, args.batchSize);
    existingCounts = await getExistingArticleCounts(pool, args.importSource);
  }

  if (pool) {
    await pool.end();
  }

  const summary = {
    generated_at: new Date().toISOString(),
    mode: args.execute ? "execute" : "dry_run",
    article_index: args.articleIndex,
    output_directory: args.out,
    privacy: {
      metadata_only: true,
      body_text_read: false,
      body_text_stored: false,
      writes_to_postgres: args.execute,
      output_directory_is_gitignored: "source-data/ is ignored by repo .gitignore",
    },
    import_options: {
      import_source_code: args.importSource,
      site_code: args.siteCode,
      language_code: args.languageCode,
      limit: args.limit || null,
      batch_size: args.batchSize,
    },
    counts: {
      article_rows_read: rawArticles.length,
      valid_article_rows: articles.length,
      skipped_invalid_rows: skipped,
      by_content_type: countBy(articles, "content_type_code"),
      existing_postgres_counts: existingCounts,
      import_stats: importStats,
    },
    sample_articles: articles.slice(0, 20).map((article) => ({
      source_reference: article.source_reference,
      title: article.title,
      url: article.url,
      published_date: article.published_date,
      source_slug: article.source_slug,
      content_type_code: article.content_type_code,
      archive_file_path: article.archive_file_path,
    })),
  };

  await writeSummary(args, summary);

  console.log(`Mode: ${summary.mode}`);
  console.log(`Rows read: ${rawArticles.length}`);
  console.log(`Valid metadata rows: ${articles.length}`);
  console.log(`Skipped invalid rows: ${skipped}`);

  if (importStats) {
    console.log(`Inserted: ${importStats.inserted}`);
    console.log(`Updated: ${importStats.updated}`);
  } else {
    console.log("Dry-run only. Add --execute to write to PostgreSQL.");
  }

  console.log(`Summary: ${path.join(args.out, "article_import_summary.json")}`);
  console.log("No article body text read or stored.");
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
