import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

type NewsItem = {
  title: string;
  url: string;
  date: string;
  excerpt: string;
  meta: string;
  score: number;
  publishedTs: number;
};

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function stripCompanySuffixes(value: string) {
  return cleanText(
    value
      .replace(/\btechnologies\b/gi, "")
      .replace(/\btechnology\b/gi, "")
      .replace(/\benergy\b/gi, "")
      .replace(/\bpower\b/gi, "")
      .replace(/\binc\b\.?/gi, "")
      .replace(/\bcorp\b\.?/gi, "")
      .replace(/\bcorporation\b/gi, "")
      .replace(/\bgroup\b/gi, "")
      .replace(/\bltd\b\.?/gi, "")
      .replace(/\bllc\b/gi, "")
      .replace(/\bag\b/gi, "")
      .replace(/\bgmbh\b/gi, "")
      .replace(/\bs\.a\.\b/gi, "")
      .replace(/\bsa\b/gi, "")
  );
}

function formatDate(value: string) {
  const parsed = parseDateToTimestamp(value);
  if (!parsed) return value;

  const date = new Date(parsed);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const day = String(date.getUTCDate());
  const month = months[date.getUTCMonth()];
  const year = String(date.getUTCFullYear());

  return `${day} ${month} ${year}`;
}

function removeLeadingDateFromTitle(title: string) {
  return title.replace(
    /^\s*\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\s*/i,
    ""
  ).trim();
}

function parseDateToTimestamp(value: string) {
  const text = cleanText(value);
  if (!text) return 0;

  const direct = Date.parse(text);
  if (!Number.isNaN(direct)) return direct;

  const match = text.match(
    /\b(\d{1,2})\s(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s(\d{4})\b/i
  );

  if (!match) return 0;

  const months: Record<string, number> = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };

  const parts = text.split(" ");
  if (parts.length < 3) return 0;

  const day = Number(parts[0]);
  const month = months[parts[1].toLowerCase()];
  const year = Number(parts[2]);

  if (Number.isNaN(day) || month === undefined || Number.isNaN(year)) return 0;

  return Date.UTC(year, month, day);
}

function extractDateFromText(text: string) {
  const match = cleanText(text).match(
    /\b\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\b/i
  );

  return match ? match[0] : "";
}

function buildAliasList(values: string[]) {
  const aliases = new Set<string>();

  for (const raw of values) {
    const value = cleanText(raw);
    if (!value) continue;

    aliases.add(value);

    const stripped = stripCompanySuffixes(value);
    if (stripped && stripped.length >= 3) aliases.add(stripped);

    const firstWord = value.split(/\s+/)[0]?.trim();
    if (firstWord && firstWord.length >= 3) aliases.add(firstWord);

    const strippedFirst = stripped.split(/\s+/)[0]?.trim();
    if (strippedFirst && strippedFirst.length >= 3) aliases.add(strippedFirst);
  }

  return Array.from(aliases);
}

function scoreItem(
  item: Omit<NewsItem, "score" | "publishedTs"> & { publishedTs: number },
  {
    aliases,
    country,
  }: {
    aliases: string[];
    country: string;
  }
) {
  const fullText = `${item.title} ${item.excerpt} ${item.meta}`.toLowerCase();

  let score = 0;

  for (const alias of aliases) {
    const normalized = alias.toLowerCase();
    if (!normalized) continue;

    if (item.title.toLowerCase().includes(normalized)) {
      score += normalized.split(" ").length > 1 ? 8 : 5;
    }

    if (fullText.includes(normalized)) {
      score += normalized.split(" ").length > 1 ? 5 : 3;
    }
  }

  if (country && fullText.includes(country.toLowerCase())) {
    score += 1;
  }

  return score;
}

async function fetchSearchResults(query: string) {
  const searchUrl = `https://www.thinkgeoenergy.com/?s=${encodeURIComponent(query)}`;

  const response = await fetch(searchUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ThinkGeoEnergy search for: ${query}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const results: Array<Omit<NewsItem, "score">> = [];
  const seen = new Set<string>();

  const articleSelectors = [
    "article",
    ".post",
    ".search .post",
    ".search-results article",
    "main article",
  ];

  const articleNodes = $(articleSelectors.join(","));

  articleNodes.each((_, el) => {
    const node = $(el);

    const titleAnchor =
      node.find("h1 a, h2 a, h3 a, .entry-title a, .post-title a").first();

    const href = titleAnchor.attr("href");
    let title = cleanText(titleAnchor.text());

    if (!href || !title) return;
    if (!href.startsWith("https://www.thinkgeoenergy.com/")) return;
    if (href.includes("/category/")) return;
    if (href.includes("?s=")) return;
    if (seen.has(href)) return;

    const timeText =
      cleanText(node.find("time").first().text()) ||
      cleanText(node.find(".entry-date, .posted-on, .post-date").first().text()) ||
      extractDateFromText(node.text());

    const date = timeText ? formatDate(timeText) : "";
    const publishedTs = timeText ? parseDateToTimestamp(timeText) : 0;

    title = removeLeadingDateFromTitle(title);

    const excerpt =
      cleanText(
        node.find(".entry-summary, .excerpt, .post-excerpt, p").first().text()
      ) || "";

    seen.add(href);

    results.push({
      title,
      url: href,
      date,
      excerpt: excerpt.slice(0, 240),
      meta: date,
      publishedTs,
    });
  });

  if (results.length > 0) {
    return results;
  }

  $("a").each((_, el) => {
    const href = $(el).attr("href");
    let title = cleanText($(el).text());

    if (!href || !title) return;
    if (!href.startsWith("https://www.thinkgeoenergy.com/")) return;
    if (href.includes("/category/")) return;
    if (href.includes("?s=")) return;
    if (title.length < 12) return;
    if (seen.has(href)) return;

    const nearbyText = cleanText($(el).closest("article, div, li").text());
    const rawDate = extractDateFromText(nearbyText);
    const date = rawDate ? formatDate(rawDate) : "";
    const publishedTs = rawDate ? parseDateToTimestamp(rawDate) : 0;

    title = removeLeadingDateFromTitle(title);

    let excerpt = nearbyText.replace(title, "").trim();
    excerpt = excerpt.replace(/\bSHARE\b/gi, "").trim();
    if (rawDate) {
      const rawDateRegex = new RegExp(
        rawDate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "ig"
      );
      excerpt = excerpt.replace(rawDateRegex, "").trim();
    }

    seen.add(href);

    results.push({
      title,
      url: href,
      date,
      excerpt: excerpt.slice(0, 240),
      meta: date,
      publishedTs,
    });
  });

  return results;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const name = cleanText(searchParams.get("name") || "");
  const group = cleanText(searchParams.get("group") || "");
  const country = cleanText(searchParams.get("country") || "");
  const owner = cleanText(searchParams.get("owner") || "");
  const aliasesParam = cleanText(searchParams.get("aliases") || "");

  const aliasValues = aliasesParam
    ? aliasesParam
        .split("|")
        .map((v) => cleanText(v))
        .filter(Boolean)
    : [];

  const aliases = buildAliasList([
    name,
    group,
    owner,
    ...aliasValues,
  ]);

  const queries = Array.from(
    new Set(
      [
        name,
        group,
        owner,
        ...aliases,
        name && country ? `${name} ${country}` : "",
        group && country ? `${group} ${country}` : "",
        aliases[0] && country ? `${aliases[0]} ${country}` : "",
      ].filter(Boolean)
    )
  ).slice(0, 8);

  const allResults: Array<Omit<NewsItem, "score">> = [];

  for (const query of queries) {
    try {
      const items = await fetchSearchResults(query);
      allResults.push(...items);
    } catch (error) {
      console.error(`Related news search failed for query "${query}"`, error);
    }
  }

  const deduped = Array.from(
    new Map(allResults.map((item) => [item.url, item])).values()
  );

  const scored = deduped
    .map((item) => ({
      ...item,
      score: scoreItem(item, { aliases, country }),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      const dateDiff = (b.publishedTs || 0) - (a.publishedTs || 0);
      if (dateDiff !== 0) return dateDiff;
      return b.score - a.score;
    })
    .slice(0, 8)
    .map(({ publishedTs, ...item }) => item);

  return NextResponse.json(scored);
}