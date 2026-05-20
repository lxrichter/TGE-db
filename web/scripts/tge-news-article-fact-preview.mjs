#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";
import * as XLSX from "xlsx";

const { Pool } = pg;

const DEFAULT_OUT_DIR = path.resolve(
  process.cwd(),
  "../source-data/tge-news-article-fact-preview"
);
const DEFAULT_SITE_URL = "https://www.thinkgeoenergy.com";
const EXTRACTION_METHOD = "local_markdown_regex_v1";
const CLOSED_STATUSES = new Set(["confirmed", "rejected", "superseded"]);
const MAX_SNIPPET_LENGTH = 260;
const REVIEW_SAMPLE_MODES = new Set(["mixed", "top"]);
const REVIEW_COLUMNS = [
  "review_decision",
  "review_note",
  "source_reference",
  "article_title",
  "article_url",
  "review_sample_bucket",
  "published_date",
  "fact_type_code",
  "field_name",
  "entity_type",
  "entity_label",
  "extracted_value",
  "normalized_value",
  "unit_code",
  "confidence_score",
  "fact_status_code",
  "fact_reason",
  "evidence_snippet",
  "archive_file_path",
  "fact_key",
];

const COUNTRY_ALIASES = new Map(
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
    ["turkiye", "Turkiye"],
    ["uk", "United Kingdom"],
    ["united-kingdom", "United Kingdom"],
    ["united-states", "United States"],
    ["usa", "United States"],
    ["us", "United States"],
  ].sort((a, b) => a[0].localeCompare(b[0]))
);

const GENERIC_TAGS = new Set([
  "binary",
  "byregion",
  "conference",
  "cooling",
  "development",
  "direct-use",
  "district-heating",
  "drilling",
  "education",
  "egs",
  "electricity",
  "energy",
  "event",
  "events",
  "exploration",
  "featured",
  "finance",
  "financing",
  "funding",
  "general",
  "geothermal",
  "geothermal-energy",
  "global",
  "greenhouse",
  "heat",
  "heating",
  "industry",
  "interview",
  "investment",
  "job",
  "jobs",
  "lithium",
  "market",
  "mineral",
  "northamerica",
  "orc",
  "podcast",
  "power",
  "power-plant",
  "project",
  "research",
  "sponsored",
  "steam",
  "tender",
  "technology",
  "thinkgeoenergy",
  "utility",
  "webinar",
]);

const DIRECT_USE_CATEGORY_PATTERNS = [
  {
    code: "district_heating",
    label: "District heating",
    pattern: /\b(district heating|heating network|heat network)\b/i,
  },
  {
    code: "district_cooling",
    label: "District cooling",
    pattern: /\b(district cooling|cooling network)\b/i,
  },
  {
    code: "greenhouse",
    label: "Greenhouse",
    pattern: /\b(greenhouse|greenhouses|horticulture)\b/i,
  },
  {
    code: "heat_pump",
    label: "Heat pump",
    pattern: /\b(heat pump|large-scale heat pump|geothermal heat pump)\b/i,
  },
  {
    code: "industrial_heat",
    label: "Industrial heat",
    pattern: /\b(industrial heat|process heat|industrial heating)\b/i,
  },
  {
    code: "agriculture",
    label: "Agriculture",
    pattern: /\b(agriculture|agricultural|aquaculture|fish farm)\b/i,
  },
];

const STATUS_PATTERNS = [
  {
    code: "exploration_license",
    label: "Exploration license",
    pattern: /\b(exploration licen[sc]e|geothermal licen[sc]e|exploration permit)\b/i,
    titleOnly: true,
  },
  {
    code: "construction_start",
    label: "Construction start",
    pattern: /\b(breaks ground|groundbreaking|starts construction|construction starts|under construction)\b/i,
  },
  {
    code: "drilling_start",
    label: "Drilling activity",
    pattern: /\b(starts drilling|drilling starts|spudded|drilling campaign|drilling contract)\b/i,
  },
  {
    code: "ppa_offtake",
    label: "PPA / offtake",
    pattern: /\b(power purchase agreement|PPA|offtake agreement|offtaker)\b/i,
    titleOnly: true,
  },
  {
    code: "proposal",
    label: "Proposal / call",
    pattern: /\b(call for proposals|proposal|proposed)\b/i,
    titleOnly: true,
  },
  {
    code: "public_funding_grant",
    label: "Public funding / grant",
    pattern: /\b(public funding|state funding|government funding|grant|subsidy|funding support|eu funding|moderni[sz]ation fund|incentive program)\b/i,
  },
  {
    code: "financing_investment_raise",
    label: "Financing / investment raise",
    pattern: /\b(raises|raised|financing round|funding round|investment round|capital raise|equity investment|series [a-z])\b/i,
  },
  {
    code: "contract_award",
    label: "Contract award",
    pattern: /\b(awarded?[^.]{0,70}contract|contract[^.]{0,50}awarded?|supply contract|drilling contract|epc contract)\b/i,
  },
  {
    code: "license_permit_award",
    label: "License / permit award",
    pattern: /\b(awarded?[^.]{0,70}(licen[sc]e|permit|lease)|secures?[^.]{0,70}(licen[sc]e|permit|lease)|wins?[^.]{0,70}(licen[sc]e|permit|lease)|lease sale)\b/i,
    titleOnly: true,
  },
  {
    code: "policy_tariff",
    label: "Policy / tariff",
    pattern: /\b(feed-in tariff|FiT|tariff|incentive|policy support|policy direction|government policy|support mechanism)\b/i,
  },
];

function parseArgs(argv) {
  const args = {
    root: process.env.TGE_NEWS_MD_ROOT || "",
    out: process.env.TGE_ARTICLE_FACT_OUT || DEFAULT_OUT_DIR,
    siteUrl: process.env.TGE_NEWS_SITE_URL || DEFAULT_SITE_URL,
    execute: false,
    limit: 0,
    years: new Set(),
    bodyCharLimit: 12000,
    maxFactsPerArticle: 25,
    minConfidence: 0.5,
    batchSize: 500,
    factTypes: new Set(),
    skipEntitySignals: false,
    reviewSamplePerType: 25,
    reviewSampleMode: "mixed",
    maxExecuteRows: 5000,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--root" && next) {
      args.root = next;
      index += 1;
    } else if (arg === "--out" && next) {
      args.out = path.resolve(next);
      index += 1;
    } else if (arg === "--site-url" && next) {
      args.siteUrl = next.replace(/\/$/, "");
      index += 1;
    } else if (arg === "--execute") {
      args.execute = true;
    } else if (arg === "--limit" && next) {
      args.limit = Math.max(Number(next) || 0, 0);
      index += 1;
    } else if (arg === "--years" && next) {
      args.years = new Set(
        next
          .split(",")
          .map((year) => year.trim())
          .filter(Boolean)
      );
      index += 1;
    } else if (arg === "--body-char-limit" && next) {
      args.bodyCharLimit = Math.max(Number(next) || 0, 0);
      index += 1;
    } else if (arg === "--max-facts-per-article" && next) {
      args.maxFactsPerArticle = Math.max(Number(next) || 0, 0);
      index += 1;
    } else if (arg === "--min-confidence" && next) {
      args.minConfidence = Math.min(Math.max(Number(next) || 0.5, 0), 1);
      index += 1;
    } else if (arg === "--batch-size" && next) {
      args.batchSize = Math.min(Math.max(Number(next) || 500, 1), 5000);
      index += 1;
    } else if (arg === "--fact-types" && next) {
      args.factTypes = new Set(
        next
          .split(",")
          .map((type) => type.trim())
          .filter(Boolean)
      );
      index += 1;
    } else if (arg === "--skip-entity-signals") {
      args.skipEntitySignals = true;
    } else if (arg === "--review-sample-per-type" && next) {
      args.reviewSamplePerType = Math.max(Number(next) || 0, 0);
      index += 1;
    } else if (arg === "--review-sample-mode" && next) {
      args.reviewSampleMode = REVIEW_SAMPLE_MODES.has(next) ? next : "mixed";
      index += 1;
    } else if (arg === "--max-execute-rows" && next) {
      args.maxExecuteRows = Math.max(Number(next) || 0, 0);
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
  npm run tge-news:facts -- --root "/path/to/tge_news_md_canonical" --limit 100
  railway run --service Postgres -- npm run tge-news:facts -- --root "/path/to/archive" --execute

Options:
  --root <dir>                 Markdown archive root. Can also use TGE_NEWS_MD_ROOT.
  --out <dir>                  Output directory. Defaults to ../source-data/tge-news-article-fact-preview.
  --site-url <url>             Public article base URL. Defaults to https://www.thinkgeoenergy.com.
  --execute                    Write candidates to article_fact_candidates. Default is dry-run only.
  --limit <n>                  Process only first n markdown files. Defaults to all.
  --years <list>               Optional comma-separated year filter, e.g. 2024,2025.
  --body-char-limit <n>        Local scan limit per article body. Defaults to 12000.
  --max-facts-per-article <n>  Maximum extracted candidate facts per article. Defaults to 25.
  --min-confidence <0-1>       Minimum confidence for output/write. Defaults to 0.5.
  --batch-size <n>             PostgreSQL write batch size. Defaults to 500.
  --fact-types <list>          Optional comma-separated fact types to output/write.
  --skip-entity-signals        Exclude broad non-generic tag/entity signals.
  --review-sample-per-type <n> Write n review rows per fact type. Defaults to 25.
  --review-sample-mode <mode>  Review sample mode: mixed or top. Defaults to mixed.
  --max-execute-rows <n>       Safety cap for --execute. Defaults to 5000.

Privacy:
  This script is local-only by default, makes no network calls, does not call an
  AI model, and never writes full article body text to output files or PostgreSQL.
  Output snippets are capped at ${MAX_SNIPPET_LENGTH} characters.
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

async function walkMarkdownFiles(root) {
  const results = [];

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        results.push(fullPath);
      }
    }
  }

  await walk(root);
  return results.sort((a, b) => a.localeCompare(b));
}

function stripQuotes(value) {
  return value.trim().replace(/^["']|["']$/g, "");
}

function parseFrontmatterValue(value) {
  const trimmed = value.trim();
  return trimmed ? stripQuotes(trimmed) : "";
}

function parseFrontmatter(markdown) {
  if (!markdown.startsWith("---")) {
    return { frontmatter: {}, body: markdown };
  }

  const endIndex = markdown.indexOf("\n---", 3);

  if (endIndex === -1) {
    return { frontmatter: {}, body: markdown };
  }

  const frontmatterText = markdown.slice(3, endIndex).trim();
  const body = markdown.slice(endIndex + 4).trimStart();
  const frontmatter = {};
  let currentListKey = "";

  for (const rawLine of frontmatterText.split(/\r?\n/)) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      continue;
    }

    const listMatch = line.match(/^\s*-\s+(.+)$/);

    if (listMatch && currentListKey) {
      frontmatter[currentListKey].push(stripQuotes(listMatch[1]));
      continue;
    }

    const keyValueMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);

    if (!keyValueMatch) {
      continue;
    }

    const [, key, value] = keyValueMatch;

    if (value.trim()) {
      frontmatter[key] = parseFrontmatterValue(value);
      currentListKey = "";
    } else {
      frontmatter[key] = [];
      currentListKey = key;
    }
  }

  return { frontmatter, body };
}

function getSlugFromFile(filePath) {
  const basename = path.basename(filePath, ".md");
  return basename.replace(/^\d{4}-\d{2}-\d{2}-/, "");
}

function getDateFromFilename(filePath) {
  const match = path.basename(filePath).match(/^(\d{4}-\d{2}-\d{2})-/);
  return match?.[1] ?? null;
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function getSnippet(text, index, matchLength) {
  const start = Math.max(index - 110, 0);
  const end = Math.min(index + matchLength + 110, text.length);
  return normalizeWhitespace(text.slice(start, end)).slice(0, MAX_SNIPPET_LENGTH);
}

function titleCaseTag(tag) {
  return tag
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferUseType(tags, title, bodyScan) {
  const combined = `${tags.join(" ")} ${title} ${bodyScan}`.toLowerCase();
  const directUse = /\b(direct-use|direct use|district heating|district cooling|heat pump|greenhouse|industrial heat|heating network)\b/.test(
    combined
  );
  const power = /\b(power plant|electricity|mwe|orc|binary|flash|turbine|grid)\b/.test(
    combined
  );
  const mineral = /\b(lithium|mineral|critical mineral|brine)\b/.test(combined);

  if (mineral && (power || directUse)) return "hybrid_mineral";
  if (power && directUse) return "hybrid";
  if (mineral) return "mineral";
  if (directUse) return "direct_use";
  if (power) return "power";
  return "unknown";
}

function normalizeNumericText(value) {
  const text = String(value || "").trim().replace(/\s/g, "");

  if (!text) {
    return Number.NaN;
  }

  if (text.includes(".") && text.includes(",")) {
    return Number(text.replace(/,/g, ""));
  }

  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(text)) {
    return Number(text.replace(/,/g, ""));
  }

  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(text)) {
    return Number(text.replace(/\./g, "").replace(",", "."));
  }

  if (text.includes(",")) {
    return Number(text.replace(",", "."));
  }

  return Number(text);
}

function normalizeCapacity(value, unit) {
  const raw = normalizeNumericText(value);

  if (!Number.isFinite(raw) || raw <= 0) {
    return null;
  }

  const unitLower = unit.toLowerCase();
  const isKw = unitLower.startsWith("kw");
  const normalizedValue = isKw ? raw / 1000 : raw;

  if (normalizedValue > 5000) {
    return null;
  }

  if (unitLower.includes("th")) {
    return {
      value: Number(normalizedValue.toFixed(3)),
      unit: "MWth",
      field: "thermal_capacity_mwth",
    };
  }

  if (unitLower.includes("e")) {
    return {
      value: Number(normalizedValue.toFixed(3)),
      unit: "MWe",
      field: "electric_capacity_mwe",
    };
  }

  return {
    value: Number(normalizedValue.toFixed(3)),
    unit: "MW",
    field: "capacity_mw_unspecified",
  };
}

function getArticleYear(article) {
  const match = String(article.published_date || article.relative_path || "").match(
    /\b(20[0-4][0-9])\b/
  );

  return match ? Number(match[1]) : null;
}

function isEventArticle(article) {
  const titleSlug = [article.title, article.slug].join(" ").toLowerCase();
  const metadata = [...(article.tags || []), ...(article.categories || [])].map(
    (item) => String(item).toLowerCase()
  );

  return /\b(conference|summit|webinar|save the date|call for abstracts|call for papers)\b/.test(
    titleSlug
  ) || metadata.some((item) =>
    ["event", "events", "conference", "webinar", "job", "jobs"].includes(item)
  );
}

function hasStrictCodContext(snippet) {
  return /\b(expected|scheduled|planned|target|targeted|aims?|set|due|will|to)\b.{0,70}\b(COD|commercial operation|operations?|commissioning|commissioned|online|start(?:s|ed)? operation|begin(?:s)? operation)\b/i.test(
    snippet
  ) || /\b(COD|commercial operation(?:s)? date|commercial operations?|commissioning|commissioned|online|start(?:s|ed)? operation|begin(?:s)? operation)\b.{0,70}\b(expected|scheduled|planned|target|targeted|due|by|in)\b/i.test(
    snippet
  );
}

function hasHistoricalCodContext(snippet, year, article) {
  const articleYear = getArticleYear(article);

  if (articleYear && Number(year) < articleYear) {
    return true;
  }

  return /\b(back in|first four units|first plant|had already|expanded in|history|historical)\b/i.test(
    snippet
  );
}

function hasMacroCodContext(snippet) {
  return /\b(per year|market target|national|country|worldwide|globally|strategy|policy|aim of commissioning|pace of implementation|support mechanism)\b/i.test(
    snippet
  );
}

function hasPolicyThresholdCapacityContext(snippet) {
  return /\b(threshold|minimal importance|tariff|feed-in tariff|rate|rates|kWh|per kWh)\b/i.test(
    snippet
  );
}

function normalizeMoney(rawValue, scale) {
  const number = Number(String(rawValue).replace(/,/g, ""));

  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }

  const scaleLower = String(scale || "").toLowerCase();
  const multiplier =
    scaleLower === "bn" || scaleLower === "billion"
      ? 1_000_000_000
      : scaleLower === "m" || scaleLower === "million"
        ? 1_000_000
        : 1;

  return Math.round(number * multiplier);
}

function roundConfidence(value) {
  return Number(Math.min(Math.max(value, 0), 1).toFixed(5));
}

function hashKey(parts) {
  return crypto
    .createHash("sha1")
    .update(parts.map((part) => String(part ?? "")).join("|"))
    .digest("hex")
    .slice(0, 20);
}

function buildFact({ article, factType, fieldName, extractedValue, normalizedValue, unitCode, snippet, confidence, reason, metadata, entityType, entityLabel }) {
  const factKey = `article-fact:${hashKey([
    article.source_reference,
    factType,
    fieldName,
    extractedValue,
    snippet,
  ])}`;

  return {
    fact_key: factKey,
    source_reference: article.source_reference,
    archive_file_path: article.relative_path,
    published_date: article.published_date,
    fact_type_code: factType,
    entity_type: entityType || null,
    entity_label: entityLabel || null,
    field_name: fieldName || null,
    extracted_value: String(extractedValue),
    normalized_value: normalizedValue || {},
    unit_code: unitCode || null,
    evidence_snippet: snippet || null,
    confidence_score: roundConfidence(confidence),
    fact_status_code: "suggested",
    fact_reason: reason,
    extraction_method: EXTRACTION_METHOD,
    extraction_metadata: {
      ...metadata,
      title: article.title,
      slug: article.slug,
      url: article.url,
      body_text_stored: false,
      article_body_exported: false,
      entity_fields_updated: false,
    },
  };
}

function pushUnique(facts, seenKeys, fact, maxFactsPerArticle, minConfidence) {
  if (facts.length >= maxFactsPerArticle) {
    return;
  }

  if (fact.confidence_score < minConfidence || seenKeys.has(fact.fact_key)) {
    return;
  }

  seenKeys.add(fact.fact_key);
  facts.push(fact);
}

function extractCountryAndEntitySignals(article, tags, minConfidence, maxFactsPerArticle) {
  const facts = [];
  const seenKeys = new Set();
  const titleSlug = `${article.title} ${article.slug}`.toLowerCase();

  for (const tag of tags) {
    const country = COUNTRY_ALIASES.get(tag);

    if (!country) {
      continue;
    }

    pushUnique(
      facts,
      seenKeys,
      buildFact({
        article,
        factType: "country_signal",
        fieldName: "country",
        extractedValue: country,
        normalizedValue: { country },
        snippet: article.title,
        confidence: titleSlug.includes(country.toLowerCase()) ? 0.92 : 0.78,
        reason: "Country tag or slug signal in article metadata.",
        metadata: { tag, signal_source: "metadata_tag" },
      }),
      maxFactsPerArticle,
      minConfidence
    );
  }

  for (const tag of tags) {
    if (
      GENERIC_TAGS.has(tag) ||
      COUNTRY_ALIASES.has(tag) ||
      tag.length < 4 ||
      facts.length >= maxFactsPerArticle
    ) {
      continue;
    }

    const label = titleCaseTag(tag);
    pushUnique(
      facts,
      seenKeys,
      buildFact({
        article,
        factType: "entity_signal",
        fieldName: null,
        extractedValue: label,
        normalizedValue: { tag, label },
        snippet: article.title,
        confidence: titleSlug.includes(label.toLowerCase()) ? 0.72 : 0.56,
        reason: "Non-generic article tag may indicate a project, company, market, or technology entity.",
        metadata: { tag, signal_source: "metadata_tag" },
        entityLabel: label,
      }),
      maxFactsPerArticle,
      minConfidence
    );
  }

  return facts;
}

function extractCapacitySignals(article, scanText, titleLength, minConfidence, maxFactsPerArticle) {
  const facts = [];
  const seenKeys = new Set();
  const pattern = /\b(\d{1,3}(?:[,\s]\d{3})+(?:\.\d+)?|\d{1,5}(?:[\.,]\d+)?)\s*(?:-| )?\s*(MWth|MWe|MW|kWth|kWe|kW)\b/gi;
  let match;

  while ((match = pattern.exec(scanText)) !== null) {
    const capacity = normalizeCapacity(match[1], match[2]);

    if (!capacity) {
      continue;
    }

    const inTitle = match.index < titleLength;
    const snippet = getSnippet(scanText, match.index, match[0].length);

    if (!inTitle && isEventArticle(article)) {
      continue;
    }

    if (hasPolicyThresholdCapacityContext(snippet)) {
      continue;
    }

    const field =
      capacity.field !== "capacity_mw_unspecified"
        ? capacity.field
        : article.inferred_use_type === "direct_use"
          ? "thermal_capacity_mwth"
          : article.inferred_use_type === "power"
            ? "electric_capacity_mwe"
            : "capacity_mw_unspecified";
    const unit =
      capacity.unit !== "MW"
        ? capacity.unit
        : field === "thermal_capacity_mwth"
          ? "MWth"
          : field === "electric_capacity_mwe"
            ? "MWe"
            : "MW";

    pushUnique(
      facts,
      seenKeys,
      buildFact({
        article,
        factType: "capacity_signal",
        fieldName: field,
        extractedValue: `${capacity.value} ${unit}`,
        normalizedValue: {
          value: capacity.value,
          unit,
          raw_unit: match[2],
          raw_value: match[1],
        },
        unitCode: unit,
        snippet,
        confidence: inTitle ? 0.82 : 0.66,
        reason: "Capacity-like value detected in article title/body scan.",
        metadata: {
          signal_source: inTitle ? "title" : "body_scan",
          inferred_use_type: article.inferred_use_type,
        },
      }),
      maxFactsPerArticle,
      minConfidence
    );
  }

  return facts;
}

function classifyMoneySignal(snippet) {
  if (/\b(lease sale|parcel|lease|licen[sc]e|permit)\b/i.test(snippet)) {
    return {
      factType: "license_lease_sale_amount_signal",
      fieldName: "license_or_lease_sale_amount",
      reason: "Currency amount detected near license, permit, or lease sale language.",
    };
  }

  if (/\b(contract|awarded|supply agreement|supply contract|drilling contract|epc)\b/i.test(snippet)) {
    return {
      factType: "contract_award_amount_signal",
      fieldName: "contract_value",
      reason: "Currency amount detected near contract award language.",
    };
  }

  if (/\b(loan|debt financing|credit facility|credit line|debt facility)\b/i.test(snippet)) {
    return {
      factType: "debt_loan_amount_signal",
      fieldName: "debt_or_loan_amount",
      reason: "Currency amount detected near debt or loan financing language.",
    };
  }

  if (/\b(raises|raised|series [a-z]|financing round|funding round|investment round|investment|equity|capital raise|venture)\b/i.test(snippet)) {
    return {
      factType: "financing_investment_amount_signal",
      fieldName: "financing_or_investment_amount",
      reason: "Currency amount detected near financing or investment language.",
    };
  }

  if (/\b(grant|public funding|state funding|government funding|subsidy|funding support|incentive|eu funding|moderni[sz]ation fund)\b/i.test(snippet)) {
    return {
      factType: "public_funding_grant_amount_signal",
      fieldName: "public_funding_or_grant_amount",
      reason: "Currency amount detected near public funding or grant language.",
    };
  }

  if (/\b(funding|financing|secures)\b/i.test(snippet)) {
    return {
      factType: "funding_amount_signal",
      fieldName: "funding_or_investment_amount",
      reason: "Currency amount detected near broad funding or financing language.",
    };
  }

  return null;
}

function extractMoneySignals(article, scanText, titleLength, minConfidence, maxFactsPerArticle) {
  const facts = [];
  const seenKeys = new Set();
  const pattern = /\b(US\$|\$|EUR|USD|GBP|CAD|AUD|CHF|ISK|NOK|DKK|SEK|\u20ac|\u00a3)\s*([0-9]+(?:[,\s][0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*(million|billion|bn|m)?\b/gi;
  let match;

  while ((match = pattern.exec(scanText)) !== null) {
    const snippet = getSnippet(scanText, match.index, match[0].length);
    const classification = classifyMoneySignal(snippet);

    if (!classification) {
      continue;
    }

    const amount = normalizeMoney(match[2].replace(/\s/g, ""), match[3]);

    if (!amount) {
      continue;
    }

    const inTitle = match.index < titleLength;

    if (!inTitle && isEventArticle(article)) {
      continue;
    }

    pushUnique(
      facts,
      seenKeys,
      buildFact({
        article,
        factType: classification.factType,
        fieldName: classification.fieldName,
        extractedValue: normalizeWhitespace(match[0]),
        normalizedValue: {
          amount,
          currency_raw: match[1],
          scale_raw: match[3] || null,
        },
        unitCode: match[1],
        snippet,
        confidence: inTitle ? 0.8 : 0.64,
        reason: classification.reason,
        metadata: { signal_source: inTitle ? "title" : "body_scan" },
      }),
      maxFactsPerArticle,
      minConfidence
    );
  }

  return facts;
}

function extractYearSignals(article, scanText, titleLength, minConfidence, maxFactsPerArticle) {
  const facts = [];
  const seenKeys = new Set();
  const patterns = [
    {
      type: "cod_year_signal",
      field: "target_cod_year",
      pattern: /\b(COD|commercial operation|commissioning|commissioned|online|start(?:s|ed)? operation|begin(?:s)? operation)[^.]{0,90}\b(20[0-4][0-9])\b/gi,
    },
    {
      type: "cod_year_signal",
      field: "target_cod_year",
      pattern: /\b(20[0-4][0-9])\b[^.]{0,90}\b(COD|commercial operation|commissioning|commissioned|online|start(?:s|ed)? operation|begin(?:s)? operation)\b/gi,
      yearGroup: 1,
    },
  ];

  for (const definition of patterns) {
    let match;

    while ((match = definition.pattern.exec(scanText)) !== null) {
      const year = definition.yearGroup ? match[definition.yearGroup] : match[2];
      const inTitle = match.index < titleLength;
      const snippet = getSnippet(scanText, match.index, match[0].length);

      if (!hasStrictCodContext(snippet)) {
        continue;
      }

      if (
        !inTitle &&
        (hasHistoricalCodContext(snippet, year, article) ||
          hasMacroCodContext(snippet))
      ) {
        continue;
      }

      pushUnique(
        facts,
        seenKeys,
        buildFact({
          article,
          factType: definition.type,
          fieldName: definition.field,
          extractedValue: year,
          normalizedValue: { year: Number(year) },
          snippet,
          confidence: inTitle ? 0.78 : 0.62,
          reason: "Forward-looking COD/operation year detected near strict operation timing language.",
          metadata: { signal_source: inTitle ? "title" : "body_scan" },
        }),
        maxFactsPerArticle,
        minConfidence
      );
    }
  }

  return facts;
}

function extractCategoryAndStatusSignals(article, scanText, titleLength, minConfidence, maxFactsPerArticle) {
  const facts = [];
  const seenKeys = new Set();

  for (const item of DIRECT_USE_CATEGORY_PATTERNS) {
    const match = item.pattern.exec(scanText);

    if (!match) {
      continue;
    }

    const inTitle = match.index < titleLength;

    if (!inTitle && isEventArticle(article)) {
      continue;
    }

    pushUnique(
      facts,
      seenKeys,
      buildFact({
        article,
        factType: "direct_use_category_signal",
        fieldName: "direct_use_category",
        extractedValue: item.label,
        normalizedValue: { code: item.code, label: item.label },
        snippet: getSnippet(scanText, match.index, match[0].length),
        confidence: inTitle ? 0.82 : 0.68,
        reason: "Direct-use category language detected.",
        metadata: { signal_source: inTitle ? "title" : "body_scan" },
      }),
      maxFactsPerArticle,
      minConfidence
    );
  }

  for (const item of STATUS_PATTERNS) {
    const match = item.pattern.exec(scanText);

    if (!match) {
      continue;
    }

    const inTitle = match.index < titleLength;

    if (item.titleOnly && !inTitle) {
      continue;
    }

    if (!inTitle && isEventArticle(article)) {
      continue;
    }

    pushUnique(
      facts,
      seenKeys,
      buildFact({
        article,
        factType: "activity_status_signal",
        fieldName: "activity_or_lifecycle_signal",
        extractedValue: item.label,
        normalizedValue: { code: item.code, label: item.label },
        snippet: getSnippet(scanText, match.index, match[0].length),
        confidence: inTitle ? 0.78 : 0.6,
        reason: "Activity/status language detected.",
        metadata: { signal_source: inTitle ? "title" : "body_scan" },
      }),
      maxFactsPerArticle,
      minConfidence
    );
  }

  return facts;
}

function extractFactsForArticle(article, tags, body, args) {
  const bodyScan = body.slice(0, args.bodyCharLimit);
  const titleScan = article.title || "";
  const scanText = `${titleScan}\n${bodyScan}`;
  const titleLength = titleScan.length + 1;
  const facts = [];
  const articleFacts = [
    ...extractCountryAndEntitySignals(
      article,
      tags,
      args.minConfidence,
      args.maxFactsPerArticle
    ),
    ...extractCapacitySignals(
      article,
      scanText,
      titleLength,
      args.minConfidence,
      args.maxFactsPerArticle
    ),
    ...extractMoneySignals(
      article,
      scanText,
      titleLength,
      args.minConfidence,
      args.maxFactsPerArticle
    ),
    ...extractYearSignals(
      article,
      scanText,
      titleLength,
      args.minConfidence,
      args.maxFactsPerArticle
    ),
    ...extractCategoryAndStatusSignals(
      article,
      scanText,
      titleLength,
      args.minConfidence,
      args.maxFactsPerArticle
    ),
  ];
  const seenKeys = new Set();

  for (const fact of articleFacts) {
    pushUnique(
      facts,
      seenKeys,
      fact,
      args.maxFactsPerArticle,
      args.minConfidence
    );
  }

  return facts;
}

function applyFactFilters(facts, args) {
  return facts.filter((fact) => {
    if (args.skipEntitySignals && fact.fact_type_code === "entity_signal") {
      return false;
    }

    if (args.factTypes.size && !args.factTypes.has(fact.fact_type_code)) {
      return false;
    }

    return true;
  });
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

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function toCsv(rows) {
  const columns = [
    "fact_key",
    "source_reference",
    "published_date",
    "fact_type_code",
    "entity_type",
    "entity_label",
    "field_name",
    "extracted_value",
    "unit_code",
    "confidence_score",
    "fact_status_code",
    "fact_reason",
    "evidence_snippet",
  ];
  const lines = [columns.join(",")];

  for (const row of rows) {
    lines.push(columns.map((column) => csvEscape(row[column])).join(","));
  }

  return `${lines.join("\n")}\n`;
}

function sortReviewCandidates(a, b) {
  return (
    Number(b.confidence_score || 0) - Number(a.confidence_score || 0) ||
    String(b.published_date || "").localeCompare(String(a.published_date || "")) ||
    String(a.source_reference || "").localeCompare(String(b.source_reference || "")) ||
    String(a.fact_key || "").localeCompare(String(b.fact_key || ""))
  );
}

function withReviewBucket(row, bucket) {
  return {
    ...row,
    review_sample_bucket: bucket,
  };
}

function selectTopReviewRows(groupRows, samplePerType) {
  return groupRows
    .slice()
    .sort(sortReviewCandidates)
    .slice(0, samplePerType)
    .map((row) => withReviewBucket(row, "top_confidence"));
}

function addSampleRows(selectedRows, selectedKeys, candidateRows, bucket, limit) {
  for (const row of candidateRows) {
    if (selectedRows.length >= limit) {
      return;
    }

    if (selectedKeys.has(row.fact_key)) {
      continue;
    }

    selectedKeys.add(row.fact_key);
    selectedRows.push(withReviewBucket(row, bucket));
  }
}

function selectMixedReviewRows(groupRows, samplePerType) {
  const sortedRows = groupRows.slice().sort(sortReviewCandidates);

  if (sortedRows.length <= samplePerType) {
    return sortedRows.map((row) => withReviewBucket(row, "all_available"));
  }

  const topTarget = Math.max(1, Math.ceil(samplePerType * 0.4));
  const midTarget =
    samplePerType >= 3 ? Math.max(1, Math.floor(samplePerType * 0.3)) : 0;
  const lowTarget = Math.max(0, samplePerType - topTarget - midTarget);
  const selectedRows = [];
  const selectedKeys = new Set();
  const midStart = Math.max(
    0,
    Math.floor(sortedRows.length / 2 - midTarget / 2)
  );

  addSampleRows(
    selectedRows,
    selectedKeys,
    sortedRows.slice(0, topTarget),
    "top_confidence",
    samplePerType
  );
  addSampleRows(
    selectedRows,
    selectedKeys,
    sortedRows.slice(midStart, midStart + midTarget),
    "middle_confidence",
    samplePerType
  );
  addSampleRows(
    selectedRows,
    selectedKeys,
    lowTarget ? sortedRows.slice(-lowTarget) : [],
    "lower_confidence",
    samplePerType
  );
  addSampleRows(
    selectedRows,
    selectedKeys,
    sortedRows,
    "additional_confidence",
    samplePerType
  );

  return selectedRows;
}

function buildReviewSample(rows, samplePerType, sampleMode) {
  if (!samplePerType) {
    return [];
  }

  const groups = new Map();

  for (const row of rows) {
    const key = row.fact_type_code || "unknown";

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(row);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => String(a).localeCompare(String(b)))
    .flatMap(([, groupRows]) => {
      if (sampleMode === "top") {
        return selectTopReviewRows(groupRows, samplePerType);
      }

      return selectMixedReviewRows(groupRows, samplePerType);
    });
}

function formatReviewValue(row, column) {
  if (column === "review_decision" || column === "review_note") {
    return "";
  }

  if (column === "article_title") {
    return row.extraction_metadata?.title || "";
  }

  if (column === "article_url") {
    return row.extraction_metadata?.url || "";
  }

  if (column === "review_sample_bucket") {
    return row.review_sample_bucket || "";
  }

  if (column === "normalized_value") {
    return row.normalized_value ? JSON.stringify(row.normalized_value) : "";
  }

  return row[column];
}

function toReviewCsv(rows) {
  const columns = REVIEW_COLUMNS;
  const lines = [columns.join(",")];

  for (const row of rows) {
    lines.push(
      columns.map((column) => csvEscape(formatReviewValue(row, column))).join(",")
    );
  }

  return `${lines.join("\n")}\n`;
}

function toReviewWorkbookRows(rows) {
  return rows.map((row) =>
    Object.fromEntries(
      REVIEW_COLUMNS.map((column) => [column, formatReviewValue(row, column)])
    )
  );
}

function setWorksheetDefaults(worksheet, columns, rowCount) {
  const widthByColumn = {
    review_decision: 18,
    review_note: 32,
    source_reference: 32,
    article_title: 46,
    article_url: 44,
    review_sample_bucket: 22,
    published_date: 14,
    fact_type_code: 24,
    field_name: 28,
    entity_type: 16,
    entity_label: 28,
    extracted_value: 24,
    normalized_value: 28,
    unit_code: 12,
    confidence_score: 16,
    fact_status_code: 18,
    fact_reason: 42,
    evidence_snippet: 72,
    archive_file_path: 54,
    fact_key: 32,
  };

  worksheet["!cols"] = columns.map((column) => ({
    wch: widthByColumn[column] || 18,
  }));

  if (rowCount > 0) {
    worksheet["!autofilter"] = {
      ref: XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: rowCount, c: columns.length - 1 },
      }),
    };
  }
}

function writeReviewWorkbook(filePath, rows) {
  const workbook = XLSX.utils.book_new();
  const reviewRows = toReviewWorkbookRows(rows);
  const reviewSheet = XLSX.utils.json_to_sheet(reviewRows, {
    header: REVIEW_COLUMNS,
  });
  const decisionRows = [
    {
      review_decision: "accept",
      meaning: "Candidate is useful and supported by the snippet.",
    },
    {
      review_decision: "reject",
      meaning: "Candidate is not useful, wrong, or unsupported.",
    },
    {
      review_decision: "unclear",
      meaning: "Candidate may be useful but needs more context.",
    },
    {
      review_decision: "needs_rule_change",
      meaning: "Candidate reveals a repeated extraction-rule problem.",
    },
  ];
  const decisionSheet = XLSX.utils.json_to_sheet(decisionRows);
  const readmeRows = [
    ["Purpose", "Manual review sample for local article fact candidates."],
    ["Database writes", "None"],
    ["Full article body stored", "No"],
    ["Recommended first pass", "Review 30 to 50 rows across fact types and buckets."],
    ["After review", "Run npm run tge-news:fact-review against the CSV file."],
  ];
  const readmeSheet = XLSX.utils.aoa_to_sheet(readmeRows);

  setWorksheetDefaults(reviewSheet, REVIEW_COLUMNS, reviewRows.length);
  decisionSheet["!cols"] = [{ wch: 22 }, { wch: 64 }];
  readmeSheet["!cols"] = [{ wch: 26 }, { wch: 72 }];

  XLSX.utils.book_append_sheet(workbook, reviewSheet, "Review Sample");
  XLSX.utils.book_append_sheet(workbook, decisionSheet, "Decision Values");
  XLSX.utils.book_append_sheet(workbook, readmeSheet, "README");
  XLSX.writeFile(workbook, filePath, { compression: true });
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

async function writeCandidateBatch(pool, rows) {
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
      extraction_metadata
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
      COALESCE(data.extraction_metadata, '{}'::jsonb)
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
      updated_at = CASE
        WHEN article_fact_candidates.fact_status_code = ANY($2::text[])
          THEN article_fact_candidates.updated_at
        ELSE now()
      END
    RETURNING (xmax = 0) AS inserted
    `,
    [JSON.stringify(rows), [...CLOSED_STATUSES]]
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

async function writeCandidatesToPostgres(pool, rows, batchSize) {
  const stats = {
    attempted: rows.length,
    inserted: 0,
    updated: 0,
  };

  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const batchStats = await writeCandidateBatch(pool, batch);
    stats.inserted += batchStats.inserted;
    stats.updated += batchStats.updated;
  }

  return stats;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.root) {
    console.error("Missing --root or TGE_NEWS_MD_ROOT.");
    printHelp();
    process.exit(1);
  }

  const root = path.resolve(args.root);

  if (!(await pathExists(root))) {
    console.error(`Archive root does not exist: ${root}`);
    process.exit(1);
  }

  const files = await walkMarkdownFiles(root);
  const filteredFiles = files
    .filter((file) => {
      if (!args.years.size) {
        return true;
      }

      const date = getDateFromFilename(file);
      return date ? args.years.has(date.slice(0, 4)) : false;
    })
    .slice(0, args.limit > 0 ? args.limit : undefined);
  const factRows = [];
  const articleRows = [];

  for (const file of filteredFiles) {
    const markdown = await fs.readFile(file, "utf8");
    const { frontmatter, body } = parseFrontmatter(markdown);
    const slug = getSlugFromFile(file);
    const filenameDate = getDateFromFilename(file);
    const title = String(frontmatter.title || "").trim();
    const publishedDate = String(frontmatter.date || filenameDate || "").trim();
    const tags = normalizeList(frontmatter.tags).map((tag) => tag.toLowerCase());
    const categories = normalizeList(frontmatter.categories);
    const bodyScan = body.slice(0, args.bodyCharLimit);
    const article = {
      source_reference: `TGE-MD-${path.basename(file, ".md")}`,
      title,
      published_date: publishedDate || null,
      slug,
      url: `${args.siteUrl}/${slug}/`,
      relative_path: path.relative(root, file),
      inferred_use_type: inferUseType(tags, title, bodyScan),
      categories,
      tags,
    };
    const facts = applyFactFilters(
      extractFactsForArticle(article, tags, body, args),
      args
    );

    articleRows.push({
      source_reference: article.source_reference,
      title,
      published_date: article.published_date,
      slug,
      relative_path: article.relative_path,
      inferred_use_type: article.inferred_use_type,
      extracted_fact_count: facts.length,
    });
    factRows.push(...facts);
  }

  if (
    args.execute &&
    args.maxExecuteRows > 0 &&
    factRows.length > args.maxExecuteRows
  ) {
    throw new Error(
      `Refusing to write ${factRows.length} candidates with --execute. ` +
        `Use --fact-types, --skip-entity-signals, --limit, --years, or raise ` +
        `--max-execute-rows after reviewing the dry run.`
    );
  }

  const writeStats = args.execute
    ? await (async () => {
        const databaseUrl = getDatabaseUrl();
        const pool = new Pool({
          connectionString: databaseUrl,
          max: 3,
          ssl: getSslConfig(databaseUrl),
        });

        try {
          return await writeCandidatesToPostgres(pool, factRows, args.batchSize);
        } finally {
          await pool.end();
        }
      })()
    : null;
  const reviewSampleRows = buildReviewSample(
    factRows,
    args.reviewSamplePerType,
    args.reviewSampleMode
  );

  const summary = {
    generated_at: new Date().toISOString(),
    mode: args.execute ? "execute" : "dry_run",
    archive_root: root,
    output_directory: args.out,
    total_markdown_files_seen: files.length,
    total_markdown_files_processed: filteredFiles.length,
    extraction_method: EXTRACTION_METHOD,
    body_char_limit_scanned_locally: args.bodyCharLimit,
    fact_type_filter: args.factTypes.size ? [...args.factTypes] : null,
    skip_entity_signals: args.skipEntitySignals,
    review_sample_per_type: args.reviewSamplePerType,
    review_sample_mode: args.reviewSampleMode,
    review_sample_rows: reviewSampleRows.length,
    max_execute_rows: args.maxExecuteRows,
    privacy: {
      local_only_default: true,
      network_calls: false,
      ai_model_called: false,
      full_article_body_output: false,
      full_article_body_postgres: false,
      max_evidence_snippet_chars: MAX_SNIPPET_LENGTH,
    },
    counts: {
      facts: factRows.length,
      articles_with_facts: articleRows.filter((row) => row.extracted_fact_count > 0)
        .length,
      by_fact_type: countBy(factRows, "fact_type_code"),
      by_field_name: countBy(factRows, "field_name"),
      by_status: countBy(factRows, "fact_status_code"),
      by_inferred_use_type: countBy(articleRows, "inferred_use_type"),
    },
    write_stats: writeStats,
    sample_facts: factRows.slice(0, 20),
  };

  await fs.mkdir(args.out, { recursive: true });
  await fs.writeFile(
    path.join(args.out, "article_fact_summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8"
  );
  await fs.writeFile(
    path.join(args.out, "article_fact_candidates_preview.ndjson"),
    factRows.map((row) => JSON.stringify(row)).join("\n") + "\n",
    "utf8"
  );
  await fs.writeFile(
    path.join(args.out, "article_fact_candidates_preview.csv"),
    toCsv(factRows),
    "utf8"
  );
  await fs.writeFile(
    path.join(args.out, "article_fact_review_sample.csv"),
    toReviewCsv(reviewSampleRows),
    "utf8"
  );
  writeReviewWorkbook(
    path.join(args.out, "article_fact_review_sample.xlsx"),
    reviewSampleRows
  );
  await fs.writeFile(
    path.join(args.out, "article_fact_article_index.ndjson"),
    articleRows.map((row) => JSON.stringify(row)).join("\n") + "\n",
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        mode: summary.mode,
        processed: summary.total_markdown_files_processed,
        facts: summary.counts.facts,
        articles_with_facts: summary.counts.articles_with_facts,
        by_fact_type: summary.counts.by_fact_type,
        by_field_name: summary.counts.by_field_name,
        review_sample_mode: summary.review_sample_mode,
        review_sample_rows: summary.review_sample_rows,
        write_stats: summary.write_stats,
        output_directory: summary.output_directory,
        privacy: summary.privacy,
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
