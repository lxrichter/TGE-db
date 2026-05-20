import { getPrismaClient } from "@/lib/db/prisma";

export type GlobalSearchEntityType =
  | "project"
  | "operating_asset"
  | "company"
  | "source"
  | "country";

export type GlobalSearchResult = {
  entity_type: GlobalSearchEntityType;
  entity_id: string;
  title: string;
  subtitle: string | null;
  country: string | null;
  status_code: string | null;
  href: string;
  updated_at: string;
  rank: number;
};

type GlobalSearchRow = Omit<GlobalSearchResult, "href" | "updated_at"> & {
  href: string | null;
  updated_at: string | Date;
};

function normalizeTimestamp(value: string | Date) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function countryHref(country: string) {
  return `/postgres-preview/projects?country=${encodeURIComponent(country)}`;
}

function normalizeGlobalSearchResult(row: GlobalSearchRow): GlobalSearchResult {
  return {
    ...row,
    href: row.href || countryHref(row.entity_id),
    updated_at: normalizeTimestamp(row.updated_at),
  };
}

export async function searchGlobalRecords({
  query,
  limit = 30,
}: {
  query: string;
  limit?: number;
}): Promise<GlobalSearchResult[]> {
  const trimmed = query.trim();

  if (trimmed.length < 2) {
    return [];
  }

  const cappedLimit = Math.min(Math.max(limit, 1), 60);
  const perGroupLimit = Math.min(Math.max(Math.ceil(cappedLimit / 3), 5), 20);
  const rows = await getPrismaClient().$queryRawUnsafe<GlobalSearchRow[]>(
    `
    WITH input AS (
      SELECT
        $1::text AS q,
        ('%' || $1::text || '%') AS pattern
    ),
    project_results AS (
      SELECT
        'project'::text AS entity_type,
        p.project_id::text AS entity_id,
        p.project_name AS title,
        concat_ws(
          ' · ',
          NULLIF(p.country, ''),
          NULLIF(p.lifecycle_phase_code, ''),
          NULLIF(p.primary_use_type_code, '')
        ) AS subtitle,
        p.country,
        p.review_status_code AS status_code,
        ('/postgres-preview/projects/' || p.project_id::text) AS href,
        p.updated_at,
        CASE
          WHEN lower(p.project_name) = lower(input.q) THEN 1
          WHEN p.project_name ILIKE input.pattern THEN 2
          ELSE 5
        END AS rank
      FROM projects p, input
      WHERE p.project_name ILIKE input.pattern
        OR p.project_group ILIKE input.pattern
        OR p.legacy_project_id ILIKE input.pattern
        OR p.country ILIKE input.pattern
        OR p.region ILIKE input.pattern
        OR p.primary_use_type_code ILIKE input.pattern
        OR p.lifecycle_phase_code ILIKE input.pattern
      ORDER BY rank ASC, p.updated_at DESC
      LIMIT $2
    ),
    asset_results AS (
      SELECT
        'operating_asset'::text AS entity_type,
        a.operating_asset_id::text AS entity_id,
        a.asset_name AS title,
        concat_ws(
          ' · ',
          NULLIF(a.country, ''),
          NULLIF(a.lifecycle_phase_code, ''),
          NULLIF(a.primary_use_type_code, '')
        ) AS subtitle,
        a.country,
        a.review_status_code AS status_code,
        ('/postgres-preview/operating-assets/' || a.operating_asset_id::text) AS href,
        a.updated_at,
        CASE
          WHEN lower(a.asset_name) = lower(input.q) THEN 1
          WHEN a.asset_name ILIKE input.pattern THEN 2
          ELSE 5
        END AS rank
      FROM operating_assets a, input
      WHERE a.asset_name ILIKE input.pattern
        OR a.project_group ILIKE input.pattern
        OR a.legacy_plant_id ILIKE input.pattern
        OR a.country ILIKE input.pattern
        OR a.region ILIKE input.pattern
        OR a.primary_use_type_code ILIKE input.pattern
        OR a.lifecycle_phase_code ILIKE input.pattern
      ORDER BY rank ASC, a.updated_at DESC
      LIMIT $2
    ),
    company_results AS (
      SELECT
        'company'::text AS entity_type,
        c.company_id::text AS entity_id,
        c.company_name AS title,
        concat_ws(
          ' · ',
          NULLIF(c.headquarters_country, ''),
          NULLIF(c.company_type_primary_code, ''),
          NULLIF(c.entity_type_code, '')
        ) AS subtitle,
        c.headquarters_country AS country,
        c.review_status_code AS status_code,
        ('/postgres-preview/companies/' || c.company_id::text) AS href,
        c.updated_at,
        CASE
          WHEN lower(c.company_name) = lower(input.q) THEN 1
          WHEN c.company_name ILIKE input.pattern THEN 2
          ELSE 5
        END AS rank
      FROM companies c, input
      WHERE c.company_name ILIKE input.pattern
        OR c.company_name_short ILIKE input.pattern
        OR c.company_legal_name ILIKE input.pattern
        OR c.legacy_company_id ILIKE input.pattern
        OR c.website_url ILIKE input.pattern
        OR c.headquarters_country ILIKE input.pattern
        OR c.company_type_primary_code ILIKE input.pattern
      ORDER BY rank ASC, c.updated_at DESC
      LIMIT $2
    ),
    source_results AS (
      SELECT
        'source'::text AS entity_type,
        s.source_id::text AS entity_id,
        COALESCE(s.title, s.source_reference, s.url, 'Untitled source') AS title,
        concat_ws(
          ' · ',
          NULLIF(s.source_type_code, ''),
          NULLIF(s.country, ''),
          NULLIF(s.publisher, '')
        ) AS subtitle,
        s.country,
        s.credibility_status_code AS status_code,
        ('/sources/' || s.source_id::text) AS href,
        s.updated_at,
        CASE
          WHEN lower(COALESCE(s.title, '')) = lower(input.q) THEN 1
          WHEN s.title ILIKE input.pattern THEN 2
          ELSE 6
        END AS rank
      FROM sources s, input
      WHERE s.title ILIKE input.pattern
        OR s.source_reference ILIKE input.pattern
        OR s.url ILIKE input.pattern
        OR s.publisher ILIKE input.pattern
        OR s.country ILIKE input.pattern
        OR s.source_type_code ILIKE input.pattern
      ORDER BY rank ASC, s.updated_at DESC
      LIMIT $2
    ),
    country_seed AS (
      SELECT country, updated_at FROM projects
      WHERE country IS NOT NULL AND trim(country) <> ''
      UNION ALL
      SELECT country, updated_at FROM operating_assets
      WHERE country IS NOT NULL AND trim(country) <> ''
      UNION ALL
      SELECT headquarters_country AS country, updated_at FROM companies
      WHERE headquarters_country IS NOT NULL AND trim(headquarters_country) <> ''
    ),
    country_results AS (
      SELECT
        'country'::text AS entity_type,
        seed.country AS entity_id,
        seed.country AS title,
        (count(*)::text || ' staging records') AS subtitle,
        seed.country,
        NULL::text AS status_code,
        NULL::text AS href,
        max(seed.updated_at) AS updated_at,
        CASE
          WHEN lower(seed.country) = lower(input.q) THEN 1
          ELSE 3
        END AS rank
      FROM country_seed seed, input
      WHERE seed.country ILIKE input.pattern
      GROUP BY seed.country, input.q
      ORDER BY rank ASC, max(seed.updated_at) DESC
      LIMIT $2
    )
    SELECT *
    FROM (
      SELECT * FROM project_results
      UNION ALL
      SELECT * FROM asset_results
      UNION ALL
      SELECT * FROM company_results
      UNION ALL
      SELECT * FROM source_results
      UNION ALL
      SELECT * FROM country_results
    ) results
    ORDER BY rank ASC, updated_at DESC, title ASC
    LIMIT $3
    `,
    trimmed,
    perGroupLimit,
    cappedLimit
  );

  return rows.map(normalizeGlobalSearchResult);
}
