import { getPrismaClient } from "@/lib/db/prisma";

export type ArticleFactCandidateListParams = {
  limit?: number;
  offset?: number;
  search?: string;
  sourceId?: string;
  status?: string;
  factType?: string;
  fieldName?: string;
  openOnly?: boolean;
};

export type ArticleFactCandidateItem = {
  article_fact_candidate_id: string;
  fact_key: string;
  source_id: string | null;
  source_reference: string;
  archive_file_path: string | null;
  published_date: string | null;
  fact_type_code: string;
  entity_type: string | null;
  entity_label: string | null;
  field_name: string | null;
  extracted_value: string;
  normalized_value: unknown;
  unit_code: string | null;
  evidence_snippet: string | null;
  confidence_score: number;
  fact_status_code: string;
  fact_status_label: string | null;
  fact_reason: string | null;
  extraction_method: string;
  generated_at: string;
  reviewed_by_user_id: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  source_title: string | null;
  source_url: string | null;
  article_title: string | null;
  article_url: string | null;
  review_decision: string | null;
  review_note: string | null;
  review_sample_bucket: string | null;
};

export type ArticleFactCandidateSummary = {
  total: number;
  open: number;
  suggested: number;
  needsReview: number;
  confirmed: number;
  rejected: number;
  withEntitySignal: number;
  withSourceRecord: number;
};

export type ArticleFactCandidateStatusOption = {
  code: string;
  label: string;
  description: string | null;
  is_open: boolean;
  sort_order: number;
  is_active: boolean;
};

export type ArticleFactCandidateFacetOption = {
  code: string;
  label: string;
  count: number;
};

export type ArticleFactCandidateFacets = {
  factTypes: ArticleFactCandidateFacetOption[];
  fieldNames: ArticleFactCandidateFacetOption[];
};

export type ArticleFactCandidateAction = "confirm" | "reject" | "needs_review";

export type ArticleFactCandidateBulkResult = {
  requested: number;
  updated: number;
};

type ArticleFactCandidateRow = Omit<
  ArticleFactCandidateItem,
  | "published_date"
  | "confidence_score"
  | "generated_at"
  | "reviewed_at"
  | "created_at"
  | "updated_at"
> & {
  published_date: string | Date | null;
  confidence_score: string | number;
  generated_at: string | Date;
  reviewed_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type ArticleFactCandidateSummaryRow = {
  total: number | bigint;
  open: number | bigint;
  suggested: number | bigint;
  needs_review: number | bigint;
  confirmed: number | bigint;
  rejected: number | bigint;
  with_entity_signal: number | bigint;
  with_source_record: number | bigint;
};

type ArticleFactCandidateFacetRow = {
  code: string;
  label: string;
  count: number | bigint;
};

type ArticleFactCandidateUpdateRow = {
  article_fact_candidate_id: string;
};

function isUuid(value: string | null | undefined) {
  return Boolean(
    value?.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  );
}

function normalizeTimestamp(value: string | Date | null) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function normalizeRequiredTimestamp(value: string | Date) {
  return normalizeTimestamp(value) ?? new Date(0).toISOString();
}

function toNumber(value: number | bigint) {
  return Number(value);
}

function toArticleFactCandidate(
  row: ArticleFactCandidateRow
): ArticleFactCandidateItem {
  return {
    ...row,
    published_date: row.published_date
      ? normalizeRequiredTimestamp(row.published_date).slice(0, 10)
      : null,
    confidence_score: Number(row.confidence_score),
    generated_at: normalizeRequiredTimestamp(row.generated_at),
    reviewed_at: normalizeTimestamp(row.reviewed_at),
    created_at: normalizeRequiredTimestamp(row.created_at),
    updated_at: normalizeRequiredTimestamp(row.updated_at),
  };
}

function buildArticleFactCandidateWhere(
  params: ArticleFactCandidateListParams
) {
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (params.search?.trim()) {
    values.push(`%${params.search.trim().toLowerCase()}%`);
    clauses.push(`
      LOWER(
        COALESCE(af.source_reference, '') || ' ' ||
        COALESCE(af.fact_type_code, '') || ' ' ||
        COALESCE(af.field_name, '') || ' ' ||
        COALESCE(af.entity_label, '') || ' ' ||
        COALESCE(af.extracted_value, '') || ' ' ||
        COALESCE(af.fact_reason, '') || ' ' ||
        COALESCE(af.evidence_snippet, '') || ' ' ||
        COALESCE(s.title, '') || ' ' ||
        COALESCE(s.url, '') || ' ' ||
        COALESCE(af.extraction_metadata->>'title', '') || ' ' ||
        COALESCE(af.extraction_metadata->>'url', '')
      ) LIKE $${values.length}
    `);
  }

  if (params.sourceId?.trim() && isUuid(params.sourceId.trim())) {
    values.push(params.sourceId.trim());
    clauses.push(`af.source_id = $${values.length}::uuid`);
  }

  if (params.status?.trim()) {
    values.push(params.status.trim());
    clauses.push(`af.fact_status_code = $${values.length}`);
  }

  if (params.openOnly) {
    clauses.push(`af.fact_status_code NOT IN ('confirmed', 'rejected', 'superseded')`);
  }

  if (params.factType?.trim()) {
    values.push(params.factType.trim());
    clauses.push(`af.fact_type_code = $${values.length}`);
  }

  if (params.fieldName?.trim()) {
    values.push(params.fieldName.trim());
    clauses.push(`af.field_name = $${values.length}`);
  }

  return {
    whereSql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    values,
  };
}

export async function listArticleFactCandidates(
  params: ArticleFactCandidateListParams = {}
): Promise<ArticleFactCandidateItem[]> {
  const limit = Math.min(Math.max(params.limit ?? 100, 1), 200);
  const offset = Math.max(params.offset ?? 0, 0);
  const { whereSql, values } = buildArticleFactCandidateWhere(params);
  const limitPlaceholder = values.length + 1;
  const offsetPlaceholder = values.length + 2;
  const rows = await getPrismaClient().$queryRawUnsafe<
    ArticleFactCandidateRow[]
  >(
    `
    SELECT
      af.article_fact_candidate_id::text,
      af.fact_key,
      af.source_id::text,
      af.source_reference,
      af.archive_file_path,
      af.published_date,
      af.fact_type_code,
      af.entity_type,
      af.entity_label,
      af.field_name,
      af.extracted_value,
      af.normalized_value,
      af.unit_code,
      af.evidence_snippet,
      af.confidence_score::float8 AS confidence_score,
      af.fact_status_code,
      status.label AS fact_status_label,
      af.fact_reason,
      af.extraction_method,
      af.generated_at,
      af.reviewed_by_user_id::text,
      reviewer.name AS reviewed_by_name,
      af.reviewed_at,
      af.created_at,
      af.updated_at,
      s.title AS source_title,
      s.url AS source_url,
      af.extraction_metadata->>'title' AS article_title,
      af.extraction_metadata->>'url' AS article_url,
      af.extraction_metadata->>'review_decision' AS review_decision,
      af.extraction_metadata->>'review_note' AS review_note,
      af.extraction_metadata->>'review_sample_bucket' AS review_sample_bucket
    FROM article_fact_candidates af
    LEFT JOIN sources s
      ON s.source_id = af.source_id
    LEFT JOIN ref_article_fact_candidate_statuses status
      ON status.code = af.fact_status_code
    LEFT JOIN app_users reviewer
      ON reviewer.user_id = af.reviewed_by_user_id
    ${whereSql}
    ORDER BY
      CASE af.fact_status_code
        WHEN 'suggested' THEN 1
        WHEN 'needs_review' THEN 2
        WHEN 'confirmed' THEN 7
        WHEN 'rejected' THEN 8
        WHEN 'superseded' THEN 9
        ELSE 6
      END,
      af.confidence_score DESC,
      af.generated_at DESC
    LIMIT $${limitPlaceholder}
    OFFSET $${offsetPlaceholder}
    `,
    ...values,
    limit,
    offset
  );

  return rows.map(toArticleFactCandidate);
}

export async function countArticleFactCandidates(
  params: ArticleFactCandidateListParams = {}
): Promise<number> {
  const { whereSql, values } = buildArticleFactCandidateWhere(params);
  const rows = await getPrismaClient().$queryRawUnsafe<
    Array<{ count: number | bigint }>
  >(
    `
    SELECT COUNT(*)::int AS count
    FROM article_fact_candidates af
    LEFT JOIN sources s
      ON s.source_id = af.source_id
    ${whereSql}
    `,
    ...values
  );

  return toNumber(rows[0]?.count ?? 0);
}

export async function getArticleFactCandidateSummary(): Promise<ArticleFactCandidateSummary> {
  const rows = await getPrismaClient().$queryRawUnsafe<
    ArticleFactCandidateSummaryRow[]
  >(
    `
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (
        WHERE fact_status_code NOT IN ('confirmed', 'rejected', 'superseded')
      )::int AS open,
      COUNT(*) FILTER (
        WHERE fact_status_code = 'suggested'
      )::int AS suggested,
      COUNT(*) FILTER (
        WHERE fact_status_code = 'needs_review'
      )::int AS needs_review,
      COUNT(*) FILTER (
        WHERE fact_status_code = 'confirmed'
      )::int AS confirmed,
      COUNT(*) FILTER (
        WHERE fact_status_code = 'rejected'
      )::int AS rejected,
      COUNT(*) FILTER (
        WHERE entity_label IS NOT NULL AND btrim(entity_label) <> ''
      )::int AS with_entity_signal,
      COUNT(*) FILTER (
        WHERE source_id IS NOT NULL
      )::int AS with_source_record
    FROM article_fact_candidates
    `
  );
  const row = rows[0];

  return {
    total: toNumber(row?.total ?? 0),
    open: toNumber(row?.open ?? 0),
    suggested: toNumber(row?.suggested ?? 0),
    needsReview: toNumber(row?.needs_review ?? 0),
    confirmed: toNumber(row?.confirmed ?? 0),
    rejected: toNumber(row?.rejected ?? 0),
    withEntitySignal: toNumber(row?.with_entity_signal ?? 0),
    withSourceRecord: toNumber(row?.with_source_record ?? 0),
  };
}

export async function listArticleFactCandidateStatusOptions(): Promise<
  ArticleFactCandidateStatusOption[]
> {
  return getPrismaClient().$queryRawUnsafe<ArticleFactCandidateStatusOption[]>(
    `
    SELECT code, label, description, is_open, sort_order, is_active
    FROM ref_article_fact_candidate_statuses
    WHERE is_active = TRUE
    ORDER BY sort_order ASC, label ASC
    `
  );
}

export async function getArticleFactCandidateFacets(): Promise<ArticleFactCandidateFacets> {
  const [factTypes, fieldNames] = await Promise.all([
    getPrismaClient().$queryRawUnsafe<ArticleFactCandidateFacetRow[]>(
      `
      SELECT
        fact_type_code AS code,
        replace(initcap(replace(fact_type_code, '_', ' ')), 'Cod', 'COD') AS label,
        COUNT(*)::int AS count
      FROM article_fact_candidates
      GROUP BY fact_type_code
      ORDER BY count DESC, fact_type_code ASC
      `
    ),
    getPrismaClient().$queryRawUnsafe<ArticleFactCandidateFacetRow[]>(
      `
      SELECT
        field_name AS code,
        replace(initcap(replace(field_name, '_', ' ')), 'Mw', 'MW') AS label,
        COUNT(*)::int AS count
      FROM article_fact_candidates
      WHERE field_name IS NOT NULL
      GROUP BY field_name
      ORDER BY count DESC, field_name ASC
      `
    ),
  ]);

  return {
    factTypes: factTypes.map((row) => ({
      ...row,
      count: toNumber(row.count),
    })),
    fieldNames: fieldNames.map((row) => ({
      ...row,
      count: toNumber(row.count),
    })),
  };
}

export async function updateArticleFactCandidates({
  candidateIds,
  action,
  actorUserId,
}: {
  candidateIds: string[];
  action: ArticleFactCandidateAction;
  actorUserId?: string | null;
}): Promise<ArticleFactCandidateBulkResult> {
  const validCandidateIds = [...new Set(candidateIds.filter(isUuid))];
  const result: ArticleFactCandidateBulkResult = {
    requested: validCandidateIds.length,
    updated: 0,
  };

  if (validCandidateIds.length === 0) {
    return result;
  }

  const statusCode =
    action === "confirm"
      ? "confirmed"
      : action === "reject"
        ? "rejected"
        : "needs_review";
  const normalizedActorUserId = isUuid(actorUserId) ? actorUserId : null;
  const rows = await getPrismaClient().$queryRawUnsafe<
    ArticleFactCandidateUpdateRow[]
  >(
    `
    WITH reviewer AS (
      SELECT user_id
      FROM app_users
      WHERE user_id = $3::uuid
      LIMIT 1
    )
    UPDATE article_fact_candidates af
    SET
      fact_status_code = $2,
      reviewed_by_user_id = CASE
        WHEN $2 IN ('confirmed', 'rejected')
          THEN COALESCE((SELECT user_id FROM reviewer), af.reviewed_by_user_id)
        ELSE NULL
      END,
      reviewed_at = CASE WHEN $2 IN ('confirmed', 'rejected') THEN now() ELSE NULL END,
      updated_at = now()
    WHERE af.article_fact_candidate_id = ANY($1::uuid[])
      AND af.fact_status_code != 'superseded'
    RETURNING af.article_fact_candidate_id::text
    `,
    validCandidateIds,
    statusCode,
    normalizedActorUserId
  );

  return {
    requested: validCandidateIds.length,
    updated: rows.length,
  };
}
