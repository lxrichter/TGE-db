import { load } from "cheerio";
import { getPrismaClient } from "@/lib/db/prisma";
import {
  createSource,
  createSourceLink,
  getSourceById,
  listSourceLinks,
  type SourceDetail,
  type SourceLink,
  type SourceLinkMutationInput,
} from "@/lib/services/sources";

const DEFAULT_TGE_ARTICLE_API_BASE_URL =
  "https://www.thinkgeoenergy.com/wp-json/wp/v2";

const ARTICLE_FIELDS = [
  "id",
  "date",
  "modified",
  "slug",
  "link",
  "title",
  "excerpt",
].join(",");

export type TgeArticleSearchResult = {
  wordpress_id: number;
  source_reference: string;
  title: string;
  url: string;
  slug: string | null;
  published_at: string | null;
  modified_at: string | null;
  excerpt: string | null;
};

type WordPressRenderedField = {
  rendered?: unknown;
};

type WordPressArticle = {
  id?: unknown;
  date?: unknown;
  modified?: unknown;
  slug?: unknown;
  link?: unknown;
  title?: WordPressRenderedField;
  excerpt?: WordPressRenderedField;
};

type SourceIdRow = {
  source_id: string;
};

function getTgeArticleApiBaseUrl() {
  return (
    process.env.TGE_ARTICLE_API_BASE_URL?.replace(/\/$/, "") ||
    DEFAULT_TGE_ARTICLE_API_BASE_URL
  );
}

function htmlToText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const text = load(value).text().replace(/\s+/g, " ").trim();
  return text || null;
}

function normalizeText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeDateTime(value: unknown) {
  const text = normalizeText(value);

  if (!text) {
    return null;
  }

  const parsed = new Date(text);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function normalizeArticle(article: WordPressArticle): TgeArticleSearchResult | null {
  const wordpressId =
    typeof article.id === "number" ? article.id : Number(article.id);
  const url = normalizeText(article.link);
  const title = htmlToText(article.title?.rendered);

  if (!Number.isFinite(wordpressId) || wordpressId <= 0 || !url || !title) {
    return null;
  }

  return {
    wordpress_id: wordpressId,
    source_reference: `TGE-WP-${wordpressId}`,
    title,
    url,
    slug: normalizeText(article.slug),
    published_at: normalizeDateTime(article.date),
    modified_at: normalizeDateTime(article.modified),
    excerpt: htmlToText(article.excerpt?.rendered),
  };
}

function normalizeLimit(limit: number | null | undefined) {
  const numericLimit = Number(limit ?? 8);

  if (!Number.isFinite(numericLimit)) {
    return 8;
  }

  return Math.min(Math.max(Math.trunc(numericLimit), 1), 20);
}

async function fetchTgeArticles(path: string, params: URLSearchParams) {
  const url = `${getTgeArticleApiBaseUrl()}${path}?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`ThinkGeoEnergy article API returned ${res.status}.`);
  }

  return res.json();
}

export async function searchTgeArticles({
  search,
  limit,
}: {
  search?: string | null;
  limit?: number | null;
}): Promise<TgeArticleSearchResult[]> {
  const params = new URLSearchParams({
    _fields: ARTICLE_FIELDS,
    per_page: String(normalizeLimit(limit)),
  });
  const trimmedSearch = search?.trim();

  if (trimmedSearch) {
    params.set("search", trimmedSearch);
    params.set("orderby", "relevance");
  } else {
    params.set("orderby", "date");
    params.set("order", "desc");
  }

  const articles = await fetchTgeArticles("/posts", params);

  if (!Array.isArray(articles)) {
    return [];
  }

  return articles
    .map((article) => normalizeArticle(article as WordPressArticle))
    .filter((article): article is TgeArticleSearchResult => Boolean(article));
}

export async function getTgeArticleByWordPressId(
  wordpressId: number
): Promise<TgeArticleSearchResult | null> {
  if (!Number.isFinite(wordpressId) || wordpressId <= 0) {
    return null;
  }

  const params = new URLSearchParams({
    _fields: ARTICLE_FIELDS,
  });
  const article = await fetchTgeArticles(`/posts/${Math.trunc(wordpressId)}`, params);

  return normalizeArticle(article as WordPressArticle);
}

async function findExistingTgeSource(article: TgeArticleSearchResult) {
  const rows = await getPrismaClient().$queryRawUnsafe<SourceIdRow[]>(
    `
    SELECT source_id::text
    FROM sources
    WHERE source_reference = $1
       OR url = $2
    ORDER BY
      CASE
        WHEN source_reference = $1 THEN 1
        WHEN source_type_code = 'tge_article' THEN 2
        ELSE 3
      END,
      updated_at DESC NULLS LAST,
      created_at DESC
    LIMIT 1
    `,
    article.source_reference,
    article.url
  );

  return rows[0]?.source_id ?? null;
}

export async function upsertTgeArticleSource({
  article,
  actorUserId,
}: {
  article: TgeArticleSearchResult;
  actorUserId?: string | null;
}): Promise<{ source: SourceDetail; created: boolean }> {
  const existingSourceId = await findExistingTgeSource(article);
  const publishedDate = article.published_at?.slice(0, 10) ?? null;

  if (!existingSourceId) {
    const source = await createSource(
      {
        source_type_code: "tge_article",
        title: article.title,
        url: article.url,
        source_reference: article.source_reference,
        publisher: "ThinkGeoEnergy",
        author_organization: "ThinkGeoEnergy",
        visibility_code: "public",
        credibility_status_code: "needs_review",
        published_date: publishedDate,
        accessed_at: new Date().toISOString(),
        extracted_summary: article.excerpt,
        relevant_excerpt: article.excerpt,
      },
      actorUserId
    );

    return { source, created: true };
  }

  await getPrismaClient().$executeRawUnsafe(
    `
    UPDATE sources
    SET
      source_type_code = 'tge_article',
      title = $2,
      url = $3,
      source_reference = $4,
      publisher = COALESCE(publisher, 'ThinkGeoEnergy'),
      author_organization = COALESCE(author_organization, 'ThinkGeoEnergy'),
      visibility_code = COALESCE(visibility_code, 'public'),
      published_date = COALESCE(published_date, $5::date),
      accessed_at = COALESCE(accessed_at, now()),
      extracted_summary = COALESCE(extracted_summary, $6),
      relevant_excerpt = COALESCE(relevant_excerpt, $6),
      updated_at = now()
    WHERE source_id = $1::uuid
    `,
    existingSourceId,
    article.title,
    article.url,
    article.source_reference,
    publishedDate,
    article.excerpt
  );

  const source = await getSourceById(existingSourceId);

  if (!source) {
    throw new Error("Imported ThinkGeoEnergy source could not be reloaded.");
  }

  return { source, created: false };
}

function getTargetColumn(entityType: SourceLink["entity_type"]) {
  if (entityType === "project") {
    return "project_id";
  }

  if (entityType === "operating_asset") {
    return "operating_asset_id";
  }

  if (entityType === "company") {
    return "company_id";
  }

  return null;
}

export async function createSourceLinkIfMissing(
  input: SourceLinkMutationInput
): Promise<{ link: SourceLink | null; created: boolean }> {
  const targetColumn = getTargetColumn(input.entity_type);

  if (!targetColumn) {
    throw new Error("Invalid source link entity type.");
  }

  const existingRows = await getPrismaClient().$queryRawUnsafe<
    Array<{ entity_source_id: string }>
  >(
    `
    SELECT entity_source_id::text
    FROM entity_sources
    WHERE source_id = $1::uuid
      AND ${targetColumn} = $2::uuid
    ORDER BY created_at DESC
    LIMIT 1
    `,
    input.source_id,
    input.entity_id
  );

  if (existingRows[0]) {
    const links = await listSourceLinks(input.source_id);
    return {
      link:
        links.find(
          (link) => link.entity_source_id === existingRows[0].entity_source_id
        ) ?? null,
      created: false,
    };
  }

  const link = await createSourceLink(input);
  return { link, created: true };
}
