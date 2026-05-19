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

const COUNTRY_TAG_ALIASES = new Map(
  [
    ["argentina", "Argentina"],
    ["australia", "Australia"],
    ["austria", "Austria"],
    ["bolivia", "Bolivia"],
    ["canada", "Canada"],
    ["chile", "Chile"],
    ["china", "China"],
    ["colombia", "Colombia"],
    ["costa-rica", "Costa Rica"],
    ["croatia", "Croatia"],
    ["denmark", "Denmark"],
    ["djibouti", "Djibouti"],
    ["ecuador", "Ecuador"],
    ["el-salvador", "El Salvador"],
    ["ethiopia", "Ethiopia"],
    ["finland", "Finland"],
    ["france", "France"],
    ["germany", "Germany"],
    ["greece", "Greece"],
    ["guatemala", "Guatemala"],
    ["hungary", "Hungary"],
    ["iceland", "Iceland"],
    ["india", "India"],
    ["indonesia", "Indonesia"],
    ["ireland", "Ireland"],
    ["italy", "Italy"],
    ["japan", "Japan"],
    ["kenya", "Kenya"],
    ["mexico", "Mexico"],
    ["netherlands", "Netherlands"],
    ["new-zealand", "New Zealand"],
    ["nicaragua", "Nicaragua"],
    ["philippines", "Philippines"],
    ["poland", "Poland"],
    ["portugal", "Portugal"],
    ["romania", "Romania"],
    ["russia", "Russia"],
    ["slovakia", "Slovakia"],
    ["spain", "Spain"],
    ["switzerland", "Switzerland"],
    ["taiwan", "Taiwan"],
    ["tanzania", "Tanzania"],
    ["turkey", "Turkey"],
    ["turkiye", "Türkiye"],
    ["uk", "United Kingdom"],
    ["united-kingdom", "United Kingdom"],
    ["united-states", "United States"],
    ["usa", "United States"],
    ["us", "United States"],
  ].sort((a, b) => a[0].localeCompare(b[0]))
);

function parseArgs(argv) {
  const args = {
    articleIndex: process.env.TGE_NEWS_ARTICLE_INDEX || DEFAULT_ARTICLE_INDEX,
    entitiesJson: process.env.TGE_NEWS_ENTITIES_JSON || "",
    out: process.env.TGE_NEWS_MATCH_OUT || DEFAULT_OUT_DIR,
    fromPostgres: false,
    writeCandidates: false,
    demoteCountryConflicts: false,
    threshold: 0.55,
    limit: 5000,
    articleLimit: 0,
    candidateBatchSize: 1000,
    generatedBy: "tge_news_matcher",
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
    } else if (arg === "--write-candidates") {
      args.writeCandidates = true;
    } else if (arg === "--demote-country-conflicts") {
      args.demoteCountryConflicts = true;
    } else if (arg === "--threshold" && next) {
      args.threshold = Math.min(Math.max(Number(next) || 0.55, 0), 1);
      index += 1;
    } else if (arg === "--limit" && next) {
      args.limit = Math.max(Number(next) || 0, 0);
      index += 1;
    } else if (arg === "--article-limit" && next) {
      args.articleLimit = Math.max(Number(next) || 0, 0);
      index += 1;
    } else if (arg === "--candidate-batch-size" && next) {
      args.candidateBatchSize = Math.min(Math.max(Number(next) || 1000, 1), 5000);
      index += 1;
    } else if (arg === "--generated-by" && next) {
      args.generatedBy = next.trim() || "tge_news_matcher";
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
  --write-candidates      Write candidates to source_entity_match_candidates. Requires --from-postgres.
  --demote-country-conflicts
                           Demote open project/asset candidates when source country conflicts with entity country.
  --out <dir>             Output directory. Defaults to ../source-data/tge-news-entity-match-preview.
  --threshold <0-1>       Minimum confidence. Defaults to 0.55.
  --limit <n>             Max candidate rows to write. Defaults to 5000. Use 0 for unlimited.
  --article-limit <n>     Process only first n article rows for quick tests.
  --candidate-batch-size  PostgreSQL candidate write batch size. Defaults to 1000.
  --generated-by <code>   Candidate generator label. Defaults to tge_news_matcher.

Privacy:
  The script reads local article metadata only. It does not read article body
  text, does not create entity_sources links, and writes local ignored preview
  outputs. PostgreSQL candidate writes happen only with --write-candidates.
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

async function loadEntitiesFromPostgres(pool) {
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

function articleCountryCandidates(article) {
  const tags = Array.isArray(article.tags) ? article.tags : [];

  return uniq(
    tags
      .map((tag) => COUNTRY_TAG_ALIASES.get(slugify(tag)))
      .filter(Boolean)
  ).sort((a, b) => a.localeCompare(b));
}

function countryMatches(left, right) {
  const leftTokens = new Set(countryTokens(left));
  const rightTokens = countryTokens(right);

  return rightTokens.some((token) => leftTokens.has(token));
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

function hasCountryCandidateMatch(countryCandidates, country) {
  return countryCandidates.some((candidate) => countryMatches(candidate, country));
}

function hasCountryCandidateConflict(articleText, countryCandidates, entity) {
  if (entity.entity_type === "company" || !entity.country || countryCandidates.length === 0) {
    return false;
  }

  if (hasCountryCandidateMatch(countryCandidates, entity.country)) {
    return false;
  }

  return !hasCountrySignal(articleText, entity.country);
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

function scoreAlias(article, articleText, entity, alias) {
  let confidence = 0;
  const reasons = [];
  const reviewFlags = [];
  const countryCandidates = articleCountryCandidates(article);

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
  } else if (hasCountryCandidateConflict(articleText, countryCandidates, entity)) {
    confidence -= 0.25;
    reasons.push("article country conflicts with entity country");
    reviewFlags.push("country_conflict");
  }

  if (hasUseTypeSignal(article, entity)) {
    confidence += 0.04;
    reasons.push("use-type signal");
  }

  return {
    confidence: Math.min(Math.max(confidence, 0), 0.98),
    reasons,
    review_flags: reviewFlags,
    article_country_candidates: countryCandidates,
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
      const confidence = Number(best.confidence.toFixed(2));
      rows.push({
        source_reference: article.source_reference,
        article_title: article.title,
        article_date: article.published_date,
        article_url: article.url,
        article_use_type: article.inferred_use_type,
        entity_type: entity.entity_type,
        entity_id: entity.entity_id,
        entity_key: slugify(entity.name),
        entity_name: entity.name,
        entity_country: entity.country,
        entity_use_type: entity.use_type,
        matched_alias: best.alias,
        article_country_candidates: best.article_country_candidates,
        review_flags: best.review_flags,
        confidence,
        match_status_code: statusForConfidence(confidence),
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
    "entity_key",
    "entity_name",
    "entity_country",
    "entity_use_type",
    "matched_alias",
    "article_country_candidates",
    "review_flags",
    "confidence",
    "match_status_code",
    "reason",
  ];
  const lines = [columns.join(",")];

  for (const row of rows) {
    lines.push(columns.map((column) => csvEscape(row[column])).join(","));
  }

  return `${lines.join("\n")}\n`;
}

function makeMatchKey(row) {
  return [
    row.source_reference,
    row.entity_type,
    row.entity_id || row.entity_key || slugify(row.entity_name),
  ].join(":");
}

async function loadSourceIdMap(pool, sourceReferences) {
  const map = new Map();
  const uniqueReferences = [...new Set(sourceReferences.filter(Boolean))];
  const batchSize = 5000;

  for (let index = 0; index < uniqueReferences.length; index += batchSize) {
    const batch = uniqueReferences.slice(index, index + batchSize);
    const result = await pool.query(
      `
      SELECT source_reference, source_id::text
      FROM sources
      WHERE source_reference = ANY($1::text[])
      `,
      [batch]
    );

    for (const row of result.rows) {
      map.set(row.source_reference, row.source_id);
    }
  }

  return map;
}

function buildCandidateMetadata(row) {
  return {
    article_title: row.article_title,
    article_url: row.article_url,
    article_date: row.article_date,
    article_use_type: row.article_use_type,
    article_country_candidates: row.article_country_candidates,
    entity_country: row.entity_country,
    entity_use_type: row.entity_use_type,
    matched_alias: row.matched_alias,
    review_flags: row.review_flags,
    body_text_read: false,
    creates_entity_source_link: false,
  };
}

async function writeCandidateBatch(pool, rows, generatedBy) {
  const payload = rows.map((row) => ({
    match_key: row.match_key,
    source_id: row.source_id,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    entity_key: row.entity_key,
    entity_label: row.entity_name,
    matched_alias: row.matched_alias,
    confidence_score: row.confidence,
    match_status_code: row.match_status_code,
    match_reason: row.reason,
    match_metadata: buildCandidateMetadata(row),
    generated_by: generatedBy,
  }));
  const result = await pool.query(
    `
    INSERT INTO source_entity_match_candidates (
      match_key,
      source_id,
      entity_type,
      entity_id,
      entity_key,
      entity_label,
      matched_alias,
      confidence_score,
      match_status_code,
      match_reason,
      match_metadata,
      generated_by
    )
    SELECT
      data.match_key,
      data.source_id,
      data.entity_type,
      data.entity_id,
      data.entity_key,
      data.entity_label,
      data.matched_alias,
      data.confidence_score,
      data.match_status_code,
      data.match_reason,
      COALESCE(data.match_metadata, '{}'::jsonb),
      data.generated_by
    FROM jsonb_to_recordset($1::jsonb) AS data(
      match_key text,
      source_id uuid,
      entity_type text,
      entity_id uuid,
      entity_key text,
      entity_label text,
      matched_alias text,
      confidence_score numeric,
      match_status_code text,
      match_reason text,
      match_metadata jsonb,
      generated_by text
    )
    ON CONFLICT (match_key) DO UPDATE
    SET
      entity_label = EXCLUDED.entity_label,
      entity_key = EXCLUDED.entity_key,
      matched_alias = EXCLUDED.matched_alias,
      confidence_score = EXCLUDED.confidence_score,
      match_status_code = CASE
        WHEN source_entity_match_candidates.match_status_code IN ('confirmed', 'rejected')
          THEN source_entity_match_candidates.match_status_code
        ELSE EXCLUDED.match_status_code
      END,
      match_reason = EXCLUDED.match_reason,
      match_metadata = EXCLUDED.match_metadata,
      generated_by = EXCLUDED.generated_by,
      updated_at = now()
    RETURNING (xmax = 0) AS inserted
    `,
    [JSON.stringify(payload)]
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
  const sourceMap = await loadSourceIdMap(
    pool,
    candidates.map((candidate) => candidate.source_reference)
  );
  const writableRows = [];
  let skippedMissingSource = 0;

  for (const candidate of candidates) {
    const sourceId = sourceMap.get(candidate.source_reference);

    if (!sourceId) {
      skippedMissingSource += 1;
      continue;
    }

    writableRows.push({
      ...candidate,
      source_id: sourceId,
      match_key: makeMatchKey(candidate),
    });
  }

  const stats = {
    inserted: 0,
    updated: 0,
    skipped_missing_source: skippedMissingSource,
    attempted: writableRows.length,
  };

  for (let index = 0; index < writableRows.length; index += batchSize) {
    const batch = writableRows.slice(index, index + batchSize);
    const batchStats = await writeCandidateBatch(pool, batch, generatedBy);
    stats.inserted += batchStats.inserted;
    stats.updated += batchStats.updated;
  }

  return stats;
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

function countFlags(rows, key) {
  const counts = new Map();

  for (const row of rows) {
    const flags = Array.isArray(row[key]) ? row[key] : [];

    for (const flag of flags) {
      counts.set(flag, (counts.get(flag) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .map(([value, count]) => ({ value, count }));
}

async function demoteCountryConflictingCandidates(pool) {
  const result = await pool.query(
    `
    WITH candidate_entities AS (
      SELECT
        c.match_candidate_id,
        s.country AS source_country,
        COALESCE(p.country, a.country) AS entity_country
      FROM source_entity_match_candidates c
      JOIN sources s ON s.source_id = c.source_id
      LEFT JOIN projects p
        ON c.entity_type = 'project'
        AND p.project_id = c.entity_id
      LEFT JOIN operating_assets a
        ON c.entity_type = 'operating_asset'
        AND a.operating_asset_id = c.entity_id
      WHERE c.entity_type IN ('project', 'operating_asset')
        AND c.match_status_code NOT IN ('confirmed', 'rejected')
        AND s.country IS NOT NULL
        AND BTRIM(s.country) <> ''
        AND COALESCE(p.country, a.country) IS NOT NULL
        AND BTRIM(COALESCE(p.country, a.country)) <> ''
    ),
    conflicts AS (
      SELECT *
      FROM candidate_entities
      WHERE regexp_replace(
          replace(replace(lower(BTRIM(source_country)), 'türkiye', 'turkey'), '&', 'and'),
          '[^a-z0-9]+',
          '',
          'g'
        ) <> regexp_replace(
          replace(replace(lower(BTRIM(entity_country)), 'türkiye', 'turkey'), '&', 'and'),
          '[^a-z0-9]+',
          '',
          'g'
        )
    )
    UPDATE source_entity_match_candidates c
    SET
      confidence_score = LEAST(c.confidence_score, 0.55000::numeric),
      match_status_code = 'suggested_low_confidence',
      match_reason = CASE
        WHEN c.match_reason ILIKE '%country conflict review flag%' THEN c.match_reason
        WHEN c.match_reason IS NULL OR BTRIM(c.match_reason) = '' THEN 'country conflict review flag'
        ELSE concat(c.match_reason, '; country conflict review flag')
      END,
      match_metadata = COALESCE(c.match_metadata, '{}'::jsonb) || jsonb_build_object(
        'review_flags',
        jsonb_build_array('country_conflict'),
        'source_country',
        conflicts.source_country,
        'entity_country',
        conflicts.entity_country,
        'country_conflict_demoted_at',
        now()
      ),
      updated_at = now()
    FROM conflicts
    WHERE c.match_candidate_id = conflicts.match_candidate_id
    RETURNING c.match_candidate_id
    `
  );

  return {
    demoted_country_conflicts: result.rowCount,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!(await pathExists(args.articleIndex))) {
    throw new Error(`Article index does not exist: ${args.articleIndex}`);
  }

  if (!args.fromPostgres && !args.entitiesJson) {
    throw new Error("Use --entities-json or --from-postgres.");
  }

  if (args.writeCandidates && !args.fromPostgres) {
    throw new Error("--write-candidates requires --from-postgres.");
  }

  if (args.demoteCountryConflicts && !args.fromPostgres) {
    throw new Error("--demote-country-conflicts requires --from-postgres.");
  }

  let pool = null;
  let entities;

  if (args.fromPostgres) {
    const databaseUrl = getDatabaseUrl();
    pool = new Pool({
      connectionString: databaseUrl,
      max: 3,
      ssl: getSslConfig(databaseUrl),
    });
    entities = await loadEntitiesFromPostgres(pool);
  } else {
    entities = await loadEntitiesFromJson(args.entitiesJson);
  }

  const articles = await loadArticles(args.articleIndex, args.articleLimit);

  const candidates = matchArticlesToEntities({
    articles,
    entities,
    threshold: args.threshold,
    limit: args.limit,
  });
  const candidateWriteStats = args.writeCandidates
    ? await writeCandidatesToPostgres({
        pool,
        candidates,
        batchSize: args.candidateBatchSize,
        generatedBy: args.generatedBy,
      })
    : null;
  const countryConflictDemotionStats =
    args.demoteCountryConflicts && pool
      ? await demoteCountryConflictingCandidates(pool)
      : null;

  if (pool) {
    await pool.end();
  }

  const summary = {
    generated_at: new Date().toISOString(),
    article_index: args.articleIndex,
    output_directory: args.out,
    entity_source: args.fromPostgres ? "postgres_read_only" : args.entitiesJson,
    privacy: {
      local_article_metadata_only: true,
      article_body_text_read: false,
      creates_entity_source_links: false,
      writes_to_postgres: args.writeCandidates,
      writes_match_candidates: args.writeCandidates,
      output_directory_is_gitignored: "source-data/ is ignored by repo .gitignore",
    },
    thresholds: {
      minimum_confidence: args.threshold,
      row_limit: args.limit,
      article_limit: args.articleLimit || null,
      candidate_batch_size: args.candidateBatchSize,
      generated_by: args.generatedBy,
      demote_country_conflicts: args.demoteCountryConflicts,
    },
    counts: {
      articles_read: articles.length,
      entities_read: entities.length,
      candidate_matches: candidates.length,
      candidates_by_entity_type: countBy(candidates, "entity_type"),
      candidates_by_confidence: countBy(candidates, "confidence"),
      candidates_by_status: countBy(candidates, "match_status_code"),
      candidates_by_review_flag: countFlags(candidates, "review_flags"),
      candidate_write_stats: candidateWriteStats,
      country_conflict_demotion_stats: countryConflictDemotionStats,
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
  if (candidateWriteStats) {
    console.log(`Candidate rows inserted: ${candidateWriteStats.inserted}`);
    console.log(`Candidate rows updated: ${candidateWriteStats.updated}`);
    console.log(
      `Candidate rows skipped missing source: ${candidateWriteStats.skipped_missing_source}`
    );
  } else {
    console.log("Candidate write skipped. Add --write-candidates to persist review rows.");
  }
  if (countryConflictDemotionStats) {
    console.log(
      `Country-conflict candidates demoted: ${countryConflictDemotionStats.demoted_country_conflicts}`
    );
  }
  console.log(`Output: ${args.out}`);
  console.log("No article body text read. No entity_sources links created.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
