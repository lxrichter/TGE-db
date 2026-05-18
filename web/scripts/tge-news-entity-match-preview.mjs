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
  "../source-data/tge-news-entity-match-preview"
);

const GENERIC_ENTITY_TERMS = new Set([
  "africa",
  "analysis",
  "award",
  "awards",
  "binary",
  "company",
  "conference",
  "development",
  "direct use",
  "district heating",
  "drilling",
  "energy",
  "event",
  "events",
  "exploration",
  "finance",
  "funding",
  "general",
  "geothermal",
  "geothermal energy",
  "geothermal power",
  "greenhouse",
  "heat",
  "heating",
  "industry",
  "investment",
  "lithium",
  "market",
  "news",
  "plant",
  "power",
  "power plant",
  "project",
  "projects",
  "research",
  "sample",
  "technology",
  "tender",
  "utility",
  "webinar",
]);

const COUNTRY_SYNONYMS = new Map([
  ["Türkiye", ["turkey", "turkiye", "türkiye"]],
  ["United Kingdom", ["uk", "united kingdom", "britain", "great britain"]],
  ["United States", ["us", "usa", "u s", "united states", "united states of america"]],
  ["New Zealand", ["new zealand", "new-zealand"]],
  ["Costa Rica", ["costa rica", "costa-rica"]],
  ["El Salvador", ["el salvador", "el-salvador"]],
]);

function parseArgs(argv) {
  const args = {
    articleIndex: process.env.TGE_NEWS_ARTICLE_INDEX || DEFAULT_ARTICLE_INDEX,
    entitiesJson: process.env.TGE_NEWS_ENTITIES_JSON || "",
    out: process.env.TGE_NEWS_MATCH_OUT || DEFAULT_OUT_DIR,
    fromPostgres: false,
    threshold: 0.72,
    limit: 2000,
    articleLimit: 0,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--article-index" && next) {
      args.articleIndex = path.resolve(next);
      index += 1;
    } else if (arg === "--entities-json" && next) {
      args.entitiesJson = path.resolve(next);
      index += 1;
    } else if (arg === "--out" && next) {
      args.out = path.resolve(next);
      index += 1;
    } else if (arg === "--from-postgres") {
      args.fromPostgres = true;
    } else if (arg === "--threshold" && next) {
      args.threshold = Math.min(Math.max(Number(next) || 0.72, 0), 1);
      index += 1;
    } else if (arg === "--limit" && next) {
      args.limit = Math.max(Number(next) || 0, 0);
      index += 1;
    } else if (arg === "--article-limit" && next) {
      args.articleLimit = Math.max(Number(next) || 0, 0);
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
  npm run tge-news:match -- --entities-json ./entities.json
  railway run --service Postgres -- npm run tge-news:match -- --from-postgres

Options:
  --article-index <file>  Article metadata NDJSON from tge-news:preview.
  --entities-json <file>  Local entity JSON file for projects/assets/companies.
  --from-postgres         Read entity names from PostgreSQL using DATABASE_URL.
  --out <dir>             Output directory. Defaults to ../source-data/tge-news-entity-match-preview.
  --threshold <0-1>       Minimum confidence. Defaults to 0.72.
  --limit <n>             Max candidate rows to write. Defaults to 2000.
  --article-limit <n>     Process only first n article rows for quick tests.

Privacy:
  The script reads local article metadata only. It does not read article body
  text, does not write to PostgreSQL, and writes local ignored preview outputs.
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

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function slugify(value) {
  return normalizeText(value).replace(/\s+/g, "-");
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function parseAliasList(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(parseAliasList);
  }

  return String(value)
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isAcronym(value) {
  const compact = String(value || "").replace(/[^A-Za-z0-9]/g, "");
  return compact.length >= 3 && compact.length <= 8 && compact === compact.toUpperCase();
}

function isUsefulAlias(value) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return false;
  }

  if (GENERIC_ENTITY_TERMS.has(normalized)) {
    return false;
  }

  if (normalized.length >= 4) {
    return true;
  }

  return isAcronym(value);
}

function buildEntityAliases(entity) {
  return uniq(
    [
      entity.name,
      entity.label,
      entity.short_name,
      entity.legal_name,
      entity.group_name,
      entity.project_group,
      entity.plant_group,
      entity.field_name,
      ...parseAliasList(entity.aliases),
      ...parseAliasList(entity.other_name),
    ]
      .map((item) => String(item || "").trim())
      .filter(isUsefulAlias)
  );
}

function normalizeEntity(raw) {
  const entityType = raw.entity_type || raw.type;
  const entityId = raw.entity_id || raw.id;
  const name = raw.name || raw.label;
  const aliases = buildEntityAliases(raw);

  if (!entityType || !entityId || !name || aliases.length === 0) {
    return null;
  }

  return {
    entity_type: entityType,
    entity_id: entityId,
    name,
    country: raw.country || null,
    use_type: raw.use_type || raw.primary_use_type_code || null,
    aliases,
    normalized_aliases: aliases.map((alias) => ({
      original: alias,
      text: normalizeText(alias),
      slug: slugify(alias),
      is_acronym: isAcronym(alias),
    })),
  };
}

async function loadArticles(articleIndexPath, articleLimit) {
  const text = await fs.readFile(articleIndexPath, "utf8");
  const lines = text.split(/\r?\n/).filter(Boolean);
  const limitedLines = articleLimit > 0 ? lines.slice(0, articleLimit) : lines;

  return limitedLines.map((line) => JSON.parse(line));
}

async function loadEntitiesFromJson(filePath) {
  const parsed = JSON.parse(await fs.readFile(filePath, "utf8"));
  const rows = Array.isArray(parsed) ? parsed : parsed.entities;

  if (!Array.isArray(rows)) {
    throw new Error("Entity JSON must be an array or an object with an entities array.");
  }

  return rows.map(normalizeEntity).filter(Boolean);
}

async function loadEntitiesFromPostgres() {
  const databaseUrl = getDatabaseUrl();
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    ssl: getSslConfig(databaseUrl),
  });

  try {
    const result = await pool.query(`
      SELECT *
      FROM (
        SELECT
          'project'::text AS entity_type,
          project_id::text AS entity_id,
          project_name AS name,
          country,
          primary_use_type_code AS use_type,
          project_name_short AS short_name,
          NULL::text AS legal_name,
          project_group,
          NULL::text AS plant_group,
          field_name,
          other_name,
          NULL::text AS group_name
        FROM projects

        UNION ALL

        SELECT
          'operating_asset'::text AS entity_type,
          operating_asset_id::text AS entity_id,
          asset_name AS name,
          country,
          primary_use_type_code AS use_type,
          asset_name_short AS short_name,
          NULL::text AS legal_name,
          NULL::text AS project_group,
          project_group AS plant_group,
          field_name,
          other_name,
          NULL::text AS group_name
        FROM operating_assets

        UNION ALL

        SELECT
          'company'::text AS entity_type,
          company_id::text AS entity_id,
          company_name AS name,
          headquarters_country AS country,
          NULL::text AS use_type,
          company_name_short AS short_name,
          company_legal_name AS legal_name,
          NULL::text AS project_group,
          NULL::text AS plant_group,
          NULL::text AS field_name,
          NULL::text AS other_name,
          company_group_name AS group_name
        FROM companies
      ) entities
      ORDER BY entity_type, name
    `);

    return result.rows.map(normalizeEntity).filter(Boolean);
  } finally {
    await pool.end();
  }
}

function countryTokens(country) {
  if (!country) {
    return [];
  }

  return uniq([
    normalizeText(country),
    slugify(country),
    ...(COUNTRY_SYNONYMS.get(country) || []),
  ]).filter(Boolean);
}

function articleHaystack(article) {
  const tags = Array.isArray(article.tags) ? article.tags : [];
  const categories = Array.isArray(article.categories) ? article.categories : [];
  const title = normalizeText(article.title);
  const slug = normalizeText(article.slug);
  const tagText = normalizeText(tags.join(" "));
  const categoryText = normalizeText(categories.join(" "));
  const tagSlugs = new Set(tags.map((tag) => slugify(tag)));

  return {
    title,
    slug,
    tags: tagText,
    categories: categoryText,
    combined: `${title} ${slug} ${tagText} ${categoryText}`,
    tagSlugs,
  };
}

function includesPhrase(haystack, phrase) {
  if (!haystack || !phrase) {
    return false;
  }

  return ` ${haystack} `.includes(` ${phrase} `);
}

function hasCountrySignal(articleText, country) {
  return countryTokens(country).some(
    (token) =>
      includesPhrase(articleText.title, token) ||
      includesPhrase(articleText.slug, token) ||
      includesPhrase(articleText.tags, token)
  );
}

function hasUseTypeSignal(article, entity) {
  if (!article.inferred_use_type || !entity.use_type) {
    return false;
  }

  if (article.inferred_use_type === "hybrid") {
    return entity.use_type === "power" || entity.use_type === "direct_use";
  }

  if (article.inferred_use_type === "hybrid_mineral") {
    return ["power", "direct_use", "mineral"].includes(entity.use_type);
  }

  return article.inferred_use_type === entity.use_type;
}

function scoreAlias(article, articleText, entity, alias) {
  let confidence = 0;
  const reasons = [];

  if (alias.text.length < 3) {
    return null;
  }

  if (includesPhrase(articleText.title, alias.text)) {
    confidence = Math.max(confidence, 0.86);
    reasons.push("alias in title");
  }

  if (includesPhrase(articleText.slug, alias.text)) {
    confidence = Math.max(confidence, 0.84);
    reasons.push("alias in slug");
  }

  if (articleText.tagSlugs.has(alias.slug)) {
    confidence = Math.max(confidence, 0.78);
    reasons.push("alias tag");
  }

  if (!confidence && !alias.is_acronym) {
    const tokens = alias.text
      .split(" ")
      .filter((token) => token.length >= 4 && !GENERIC_ENTITY_TERMS.has(token));

    if (tokens.length >= 2 && tokens.every((token) => articleText.combined.includes(token))) {
      confidence = Math.max(confidence, 0.62);
      reasons.push("alias tokens in article metadata");
    }
  }

  if (!confidence) {
    return null;
  }

  if (hasCountrySignal(articleText, entity.country)) {
    confidence += 0.08;
    reasons.push("country signal");
  }

  if (hasUseTypeSignal(article, entity)) {
    confidence += 0.04;
    reasons.push("use-type signal");
  }

  return {
    confidence: Math.min(confidence, 0.98),
    reasons,
  };
}

function matchArticlesToEntities({ articles, entities, threshold, limit }) {
  const rows = [];
  const seen = new Set();

  for (const article of articles) {
    const articleText = articleHaystack(article);

    for (const entity of entities) {
      let best = null;

      for (const alias of entity.normalized_aliases) {
        const score = scoreAlias(article, articleText, entity, alias);

        if (!score) {
          continue;
        }

        if (!best || score.confidence > best.confidence) {
          best = {
            ...score,
            alias: alias.original,
          };
        }
      }

      if (!best || best.confidence < threshold) {
        continue;
      }

      const key = `${article.source_reference}:${entity.entity_type}:${entity.entity_id}`;

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      rows.push({
        source_reference: article.source_reference,
        article_title: article.title,
        article_date: article.published_date,
        article_url: article.url,
        article_use_type: article.inferred_use_type,
        entity_type: entity.entity_type,
        entity_id: entity.entity_id,
        entity_name: entity.name,
        entity_country: entity.country,
        entity_use_type: entity.use_type,
        matched_alias: best.alias,
        confidence: Number(best.confidence.toFixed(2)),
        reason: best.reasons.join("; "),
      });

      if (limit > 0 && rows.length >= limit) {
        return rows;
      }
    }
  }

  return rows;
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
    "source_reference",
    "article_title",
    "article_date",
    "article_url",
    "article_use_type",
    "entity_type",
    "entity_id",
    "entity_name",
    "entity_country",
    "entity_use_type",
    "matched_alias",
    "confidence",
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

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!(await pathExists(args.articleIndex))) {
    throw new Error(`Article index does not exist: ${args.articleIndex}`);
  }

  if (!args.fromPostgres && !args.entitiesJson) {
    throw new Error("Use --entities-json or --from-postgres.");
  }

  const [articles, entities] = await Promise.all([
    loadArticles(args.articleIndex, args.articleLimit),
    args.fromPostgres
      ? loadEntitiesFromPostgres()
      : loadEntitiesFromJson(args.entitiesJson),
  ]);

  const candidates = matchArticlesToEntities({
    articles,
    entities,
    threshold: args.threshold,
    limit: args.limit,
  });

  const summary = {
    generated_at: new Date().toISOString(),
    article_index: args.articleIndex,
    output_directory: args.out,
    entity_source: args.fromPostgres ? "postgres_read_only" : args.entitiesJson,
    privacy: {
      local_article_metadata_only: true,
      article_body_text_read: false,
      writes_to_postgres: false,
      output_directory_is_gitignored: "source-data/ is ignored by repo .gitignore",
    },
    thresholds: {
      minimum_confidence: args.threshold,
      row_limit: args.limit,
      article_limit: args.articleLimit || null,
    },
    counts: {
      articles_read: articles.length,
      entities_read: entities.length,
      candidate_matches: candidates.length,
      candidates_by_entity_type: countBy(candidates, "entity_type"),
      candidates_by_confidence: countBy(candidates, "confidence"),
    },
    sample_candidates: candidates.slice(0, 25),
  };

  await fs.mkdir(args.out, { recursive: true });
  await fs.writeFile(
    path.join(args.out, "entity_match_summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`
  );
  await fs.writeFile(
    path.join(args.out, "entity_match_candidates.csv"),
    toCsv(candidates)
  );

  console.log(`Articles read: ${articles.length}`);
  console.log(`Entities read: ${entities.length}`);
  console.log(`Candidate matches: ${candidates.length}`);
  console.log(`Output: ${args.out}`);
  console.log("No article body text read. PostgreSQL mode is read-only.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
