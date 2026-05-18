#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DEFAULT_SITE_URL = "https://www.thinkgeoenergy.com";
const DEFAULT_OUT_DIR = path.resolve(process.cwd(), "../source-data/tge-news-archive-preview");

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
    ["turkiye", "Türkiye"],
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
  "doublet",
  "drilling",
  "education",
  "egs",
  "electricity",
  "energy",
  "europemiddleeast",
  "event",
  "events",
  "exploration",
  "exploration-drilling",
  "featured",
  "finance",
  "financing",
  "funding",
  "general",
  "geothermal",
  "geothermal-energy",
  "geothermie",
  "global",
  "greenhouse",
  "heat",
  "heating",
  "heating-network",
  "hydrothermal",
  "industry",
  "interview",
  "investment",
  "job",
  "jobs",
  "legislation",
  "lithium",
  "market",
  "mineral",
  "next-generation-geothermal",
  "northamerica",
  "orc",
  "organic-rankine-cycle",
  "panas-bumi",
  "podcast",
  "power",
  "power-plant",
  "potential",
  "project",
  "projects_research",
  "renewables",
  "research",
  "sponsored",
  "steam",
  "tender",
  "technology",
  "thinkgeoenergy",
  "utility",
  "webinar",
]);

const DIRECT_USE_HINTS = [
  "direct-use",
  "district-heating",
  "district-cooling",
  "heating-network",
  "heat-pump",
  "greenhouse",
  "agriculture",
  "industrial-heat",
  "cooling",
  "thermal-network",
];

const POWER_HINTS = [
  "power-plant",
  "electricity",
  "mwe",
  "orc",
  "organic-rankine-cycle",
  "turbine",
  "binary",
  "flash",
  "grid",
];

const MINERAL_HINTS = [
  "lithium",
  "mineral",
  "critical-mineral",
  "critical-minerals",
  "brine-mining",
];

function parseArgs(argv) {
  const args = {
    root: process.env.TGE_NEWS_MD_ROOT || "",
    out: process.env.TGE_NEWS_PREVIEW_OUT || DEFAULT_OUT_DIR,
    siteUrl: process.env.TGE_NEWS_SITE_URL || DEFAULT_SITE_URL,
    sample: 25,
    candidateLimit: 500,
    limit: 0,
    years: new Set(),
    includeBodyExcerpt: false,
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
    } else if (arg === "--sample" && next) {
      args.sample = Math.max(Number(next) || 0, 0);
      index += 1;
    } else if (arg === "--candidate-limit" && next) {
      args.candidateLimit = Math.max(Number(next) || 0, 0);
      index += 1;
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
    } else if (arg === "--include-body-excerpt") {
      args.includeBodyExcerpt = true;
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
  npm run tge-news:preview -- --root "/path/to/tge_news_md_canonical"

Options:
  --root <dir>             Markdown archive root. Can also use TGE_NEWS_MD_ROOT.
  --out <dir>              Output directory. Defaults to ../source-data/tge-news-archive-preview.
  --site-url <url>         Public article base URL. Defaults to https://www.thinkgeoenergy.com.
  --sample <n>             Number of sample article metadata rows in summary.json. Defaults to 25.
  --candidate-limit <n>    Max candidate rows written to candidate_links_preview.csv. Defaults to 500.
  --limit <n>              Process only first n markdown files for quick tests. Defaults to all.
  --years <list>           Optional comma-separated year filter, e.g. 2024,2025.
  --include-body-excerpt   Include first 500 chars of body text in local metadata output.

Privacy:
  The script is local-only, does not call network APIs, and does not write body
  text unless --include-body-excerpt is set.
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

  if (!trimmed) {
    return "";
  }

  return stripQuotes(trimmed);
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

function extractMarkdownLinks(body) {
  const links = [];
  const linkPattern = /\[([^\]]+)]\((https?:\/\/[^)\s]+)\)/g;
  let match;

  while ((match = linkPattern.exec(body)) !== null) {
    links.push({
      label: match[1].replace(/\s+/g, " ").trim(),
      url: match[2],
    });
  }

  return links;
}

function extractSourceLinks(body) {
  const links = [];
  const sourceLinePattern = /^Source:\s*(.+)$/gim;
  let match;

  while ((match = sourceLinePattern.exec(body)) !== null) {
    links.push(...extractMarkdownLinks(match[1]));
  }

  return links;
}

function textIncludesLabel(text, label) {
  return text.toLowerCase().includes(label.toLowerCase());
}

function titleCaseTag(tag) {
  return tag
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function classifyUseType(tags, title, body) {
  const combined = `${tags.join(" ")} ${title} ${body.slice(0, 3000)}`.toLowerCase();
  const hasDirectUse = DIRECT_USE_HINTS.some((hint) => combined.includes(hint));
  const hasPower = POWER_HINTS.some((hint) => combined.includes(hint));
  const hasMineral = MINERAL_HINTS.some((hint) => combined.includes(hint));

  if (hasMineral && (hasPower || hasDirectUse)) {
    return "hybrid_mineral";
  }

  if (hasPower && hasDirectUse) {
    return "hybrid";
  }

  if (hasMineral) {
    return "mineral";
  }

  if (hasDirectUse) {
    return "direct_use";
  }

  if (hasPower) {
    return "power";
  }

  return "unknown";
}

function buildCandidateLinks(article, tags, links, candidateLimitRemaining) {
  const candidates = [];
  const titleAndSlug = `${article.title} ${article.slug}`;

  for (const tag of tags) {
    const country = COUNTRY_ALIASES.get(tag);

    if (country) {
      candidates.push({
        source_reference: article.source_reference,
        title: article.title,
        date: article.published_date,
        url: article.url,
        candidate_type: "country",
        candidate_key: tag,
        candidate_label: country,
        confidence: textIncludesLabel(titleAndSlug, country) ? 0.95 : 0.85,
        reason: "country tag",
      });
    }
  }

  for (const tag of tags) {
    if (
      GENERIC_TAGS.has(tag) ||
      COUNTRY_ALIASES.has(tag) ||
      tag.length < 4 ||
      candidates.length >= candidateLimitRemaining
    ) {
      continue;
    }

    const label = titleCaseTag(tag);
    candidates.push({
      source_reference: article.source_reference,
      title: article.title,
      date: article.published_date,
      url: article.url,
      candidate_type: "entity_tag",
      candidate_key: tag,
      candidate_label: label,
      confidence: textIncludesLabel(titleAndSlug, label) ? 0.75 : 0.55,
      reason: "non-generic tag",
    });
  }

  for (const link of links.filter((item) =>
    item.url.includes("thinkgeoenergy.com/")
  )) {
    if (candidates.length >= candidateLimitRemaining) {
      break;
    }

    const linkUrl = new URL(link.url);
    const linkedSlug = linkUrl.pathname.replace(/^\/|\/$/g, "");

    if (!linkedSlug) {
      continue;
    }

    candidates.push({
      source_reference: article.source_reference,
      title: article.title,
      date: article.published_date,
      url: article.url,
      candidate_type: "internal_tge_article",
      candidate_key: linkedSlug,
      candidate_label: link.label,
      confidence: 0.7,
      reason: "internal ThinkGeoEnergy article link",
    });
  }

  return candidates.slice(0, candidateLimitRemaining);
}

function increment(map, key) {
  map.set(key || "unknown", (map.get(key || "unknown") || 0) + 1);
}

function topEntries(map, limit = 40) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
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
    "title",
    "date",
    "url",
    "candidate_type",
    "candidate_key",
    "candidate_label",
    "confidence",
    "reason",
  ];
  const lines = [columns.join(",")];

  for (const row of rows) {
    lines.push(columns.map((column) => csvEscape(row[column])).join(","));
  }

  return `${lines.join("\n")}\n`;
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

  const byYear = new Map();
  const byCategory = new Map();
  const byTag = new Map();
  const byUseType = new Map();
  const slugCounts = new Map();
  const missing = {
    title: 0,
    date: 0,
    categories: 0,
    tags: 0,
    source_links: 0,
  };
  const samples = [];
  const metadataRows = [];
  const candidateRows = [];

  for (const file of filteredFiles) {
    const markdown = await fs.readFile(file, "utf8");
    const { frontmatter, body } = parseFrontmatter(markdown);
    const slug = getSlugFromFile(file);
    const filenameDate = getDateFromFilename(file);
    const title = String(frontmatter.title || "").trim();
    const publishedDate = String(frontmatter.date || filenameDate || "").trim();
    const categories = normalizeList(frontmatter.categories);
    const tags = normalizeList(frontmatter.tags).map((tag) => tag.toLowerCase());
    const links = extractMarkdownLinks(body);
    const sourceLinks = extractSourceLinks(body);
    const year = publishedDate.slice(0, 4) || "unknown";
    const useType = classifyUseType(tags, title, body);
    const sourceReference = `TGE-MD-${path.basename(file, ".md")}`;
    const article = {
      source_reference: sourceReference,
      title,
      published_date: publishedDate || null,
      year,
      slug,
      url: `${args.siteUrl}/${slug}/`,
      relative_path: path.relative(root, file),
      categories,
      tags,
      inferred_use_type: useType,
      link_count: links.length,
      internal_tge_link_count: links.filter((link) =>
        link.url.includes("thinkgeoenergy.com/")
      ).length,
      source_link_count: sourceLinks.length,
      word_count: body.split(/\s+/).filter(Boolean).length,
      body_excerpt: args.includeBodyExcerpt
        ? body.replace(/\s+/g, " ").trim().slice(0, 500)
        : undefined,
    };

    increment(byYear, year);
    increment(byUseType, useType);
    increment(slugCounts, slug);

    if (!title) missing.title += 1;
    if (!publishedDate) missing.date += 1;
    if (!categories.length) missing.categories += 1;
    if (!tags.length) missing.tags += 1;
    if (!sourceLinks.length) missing.source_links += 1;

    for (const category of categories) increment(byCategory, category);
    for (const tag of tags) increment(byTag, tag);

    metadataRows.push(article);

    if (samples.length < args.sample) {
      samples.push(article);
    }

    if (candidateRows.length < args.candidateLimit) {
      candidateRows.push(
        ...buildCandidateLinks(
          article,
          tags,
          links,
          args.candidateLimit - candidateRows.length
        )
      );
    }
  }

  const duplicateSlugs = [...slugCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));

  const summary = {
    generated_at: new Date().toISOString(),
    archive_root: root,
    output_directory: args.out,
    total_markdown_files_seen: files.length,
    total_markdown_files_processed: filteredFiles.length,
    privacy: {
      local_only: true,
      network_calls: false,
      body_text_exported: args.includeBodyExcerpt,
      output_directory_is_gitignored: "source-data/ is ignored by repo .gitignore",
    },
    mapping: {
      source_type_code: "tge_article",
      source_reference: "TGE-MD-{YYYY-MM-DD-slug}",
      title: "frontmatter.title",
      published_date: "frontmatter.date or filename date",
      url: `${args.siteUrl}/{slug}/`,
      tags: "frontmatter.tags",
      categories: "frontmatter.categories",
    },
    missing,
    duplicate_slugs: duplicateSlugs.slice(0, 100),
    counts: {
      by_year: topEntries(byYear, 80),
      by_category: topEntries(byCategory, 80),
      by_tag: topEntries(byTag, 120),
      by_inferred_use_type: topEntries(byUseType, 20),
    },
    samples,
  };

  await fs.mkdir(args.out, { recursive: true });
  await fs.writeFile(
    path.join(args.out, "summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`
  );
  await fs.writeFile(
    path.join(args.out, "article_index_preview.ndjson"),
    metadataRows.map((row) => JSON.stringify(row)).join("\n") + "\n"
  );
  await fs.writeFile(
    path.join(args.out, "candidate_links_preview.csv"),
    toCsv(candidateRows)
  );

  console.log(`Processed ${filteredFiles.length} markdown files.`);
  console.log(`Output: ${args.out}`);
  console.log(`Summary: ${path.join(args.out, "summary.json")}`);
  console.log(
    `Candidate preview rows: ${candidateRows.length} (${path.join(
      args.out,
      "candidate_links_preview.csv"
    )})`
  );
  console.log("No network calls made. Body text was not exported by default.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
