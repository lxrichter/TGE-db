import { getPrismaClient } from "@/lib/db/prisma";

export type SourceReferenceOption = {
  code: string;
  label: string;
  description?: string | null;
  sort_order: number;
  is_active: boolean;
};

export type SourceListParams = {
  limit?: number;
  search?: string;
  sourceType?: string;
  visibility?: string;
  status?: string;
  linkState?: "linked" | "unlinked";
  duplicate?: boolean;
  quality?: "weak_outdated_rejected";
};

export type SourceMatchCandidateListParams = {
  limit?: number;
  offset?: number;
  search?: string;
  sourceId?: string;
  status?: string;
  entityType?: string;
  entityId?: string;
  flagged?: boolean;
  openOnly?: boolean;
};

export type SourceListItem = {
  source_id: string;
  source_type_code: string;
  source_type_label: string | null;
  title: string | null;
  url: string | null;
  source_reference: string | null;
  publisher: string | null;
  author_organization: string | null;
  country: string | null;
  visibility_code: string;
  visibility_label: string | null;
  credibility_status_code: string;
  credibility_status_label: string | null;
  duplicate_source_flag: boolean;
  published_date: string | null;
  accessed_at: string | null;
  created_at: string;
  updated_at: string;
  added_by_name: string | null;
  reviewed_by_name: string | null;
  linked_entity_count: number;
};

export type SourceLink = {
  entity_source_id: string;
  source_id: string;
  entity_type: "project" | "operating_asset" | "company";
  entity_id: string;
  entity_name: string;
  legacy_id: string | null;
  country: string | null;
  evidence_type: string | null;
  evidence_note: string | null;
  linked_field: string | null;
  claim_text: string | null;
  extracted_value: string | null;
  confidence_status_code: string;
  is_primary_evidence: boolean;
  created_at: string;
  updated_at: string;
};

export type SourceMatchCandidateItem = {
  match_candidate_id: string;
  match_key: string;
  source_id: string;
  entity_type: string;
  entity_id: string | null;
  entity_key: string | null;
  entity_label: string;
  matched_alias: string | null;
  confidence_score: number;
  match_status_code: string;
  match_status_label: string | null;
  match_reason: string | null;
  generated_by: string;
  generated_at: string;
  reviewed_by_user_id: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  confirmed_entity_source_id: string | null;
  created_at: string;
  updated_at: string;
  source_title: string | null;
  source_url: string | null;
  source_reference: string | null;
  source_country: string | null;
  source_published_date: string | null;
  source_type_code: string;
  source_type_label: string | null;
  source_credibility_status_code: string;
  source_credibility_status_label: string | null;
  entity_country: string | null;
  entity_use_type: string | null;
  article_country_candidates: string[];
  review_flags: string[];
  source_candidate_count: number;
  source_open_candidate_count: number;
  confirmed_article_fact_count: number;
  suggestion_relevant_fact_count: number;
};

export type SourceMatchCandidateSummary = {
  total: number;
  open: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  flaggedForReview: number;
  confirmed: number;
  rejected: number;
};

export type SourceMatchCandidateStatusOption = SourceReferenceOption & {
  is_open: boolean;
};

export type SourceMatchCandidateAction = "confirm" | "reject" | "needs_review";

export type SourceMatchCandidateBulkResult = {
  requested: number;
  updated: number;
  confirmedLinksCreatedOrReused: number;
};

export type SourceDetail = SourceListItem & {
  notes: string | null;
  language_code: string | null;
  extracted_summary: string | null;
  relevant_excerpt: string | null;
  attachment_url: string | null;
  reviewed_at: string | null;
  links: SourceLink[];
};

export type SourceReferenceData = {
  sourceTypes: SourceReferenceOption[];
  visibilityLevels: SourceReferenceOption[];
  credibilityStatuses: Array<
    SourceReferenceOption & {
      is_export_eligible: boolean;
    }
  >;
};

export type SourceOperationalSummary = {
  total: number;
  credible: number;
  needsReview: number;
  weakOutdatedRejected: number;
  tgeArticles: number;
  restrictedVisibility: number;
  duplicateFlagged: number;
  unlinkedSources: number;
  linkedEvidence: number;
};

export type SourceLinkTargetOption = {
  entity_type: SourceLink["entity_type"];
  entity_id: string;
  label: string;
  legacy_id: string | null;
  country: string | null;
};

export type SourceFormReferenceData = SourceReferenceData & {
  confidenceStatuses: SourceReferenceOption[];
  linkTargets: SourceLinkTargetOption[];
};

export type SourceMutationInput = {
  source_type_code: string;
  title?: string | null;
  url?: string | null;
  source_reference?: string | null;
  publisher?: string | null;
  author_organization?: string | null;
  country?: string | null;
  language_code?: string | null;
  visibility_code: string;
  credibility_status_code: string;
  published_date?: string | null;
  accessed_at?: string | null;
  notes?: string | null;
  extracted_summary?: string | null;
  relevant_excerpt?: string | null;
  attachment_url?: string | null;
  duplicate_source_flag?: boolean;
};

export type SourceLinkMutationInput = {
  source_id: string;
  entity_type: SourceLink["entity_type"];
  entity_id: string;
  evidence_type?: string | null;
  evidence_note?: string | null;
  confidence_status_code: string;
  linked_field?: string | null;
  claim_text?: string | null;
  extracted_value?: string | null;
  is_primary_evidence?: boolean;
  reviewedByUserId?: string | null;
};

type SourceListRow = Omit<
  SourceListItem,
  "published_date" | "accessed_at" | "created_at" | "updated_at"
> & {
  published_date: string | Date | null;
  accessed_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type SourceDetailRow = Omit<
  SourceDetail,
  "published_date" | "accessed_at" | "created_at" | "updated_at" | "reviewed_at" | "links"
> & {
  published_date: string | Date | null;
  accessed_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
  reviewed_at: string | Date | null;
};

type SourceLinkRow = Omit<SourceLink, "created_at" | "updated_at"> & {
  created_at: string | Date;
  updated_at: string | Date;
};

type SourceMatchCandidateRow = Omit<
  SourceMatchCandidateItem,
  | "confidence_score"
  | "generated_at"
  | "reviewed_at"
  | "created_at"
  | "updated_at"
  | "source_published_date"
> & {
  confidence_score: string | number;
  generated_at: string | Date;
  reviewed_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
  source_published_date: string | Date | null;
  article_country_candidates: unknown;
  review_flags: unknown;
};

type SourceMatchCandidateSummaryRow = {
  total: number | bigint;
  open: number | bigint;
  high_confidence: number | bigint;
  medium_confidence: number | bigint;
  low_confidence: number | bigint;
  flagged_for_review: number | bigint;
  confirmed: number | bigint;
  rejected: number | bigint;
};

type SourceMatchCandidateStatusRow = SourceMatchCandidateStatusOption;

type SourceMatchCandidateUpdateRow = {
  match_candidate_id: string;
  confirmed_entity_source_id: string | null;
};

type SourceLinkTargetRow = SourceLinkTargetOption;

type SourceIdRow = {
  source_id: string;
};

type SourceGovernanceComparisonRow = {
  source_type_code: string | null;
  title: string | null;
  url: string | null;
  source_reference: string | null;
  publisher: string | null;
  author_organization: string | null;
  country: string | null;
  language_code: string | null;
  visibility_code: string | null;
  credibility_status_code: string | null;
  published_date: string | Date | null;
  accessed_at: string | Date | null;
  extracted_summary: string | null;
  relevant_excerpt: string | null;
  attachment_url: string | null;
  duplicate_source_flag: boolean | null;
};

type SourceLinkIdRow = {
  entity_source_id: string;
};

type DeletedSourceLinkRow = {
  source_id: string;
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

function cleanOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function cleanRequiredText(value: string | null | undefined, fallback: string) {
  return cleanOptionalText(value) || fallback;
}

function normalizeSourceComparisonValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value).trim();
}

function normalizeDateInput(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, 10);
}

function normalizeTimestampInput(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

async function getSourceGovernanceComparison(
  sourceId: string
): Promise<SourceGovernanceComparisonRow | null> {
  const rows = await getPrismaClient().$queryRawUnsafe<
    SourceGovernanceComparisonRow[]
  >(
    `
    SELECT
      source_type_code,
      title,
      url,
      source_reference,
      publisher,
      author_organization,
      country,
      language_code,
      visibility_code,
      credibility_status_code,
      published_date,
      accessed_at,
      extracted_summary,
      relevant_excerpt,
      attachment_url,
      duplicate_source_flag
    FROM sources
    WHERE source_id = $1::uuid
    LIMIT 1
    `,
    sourceId
  );

  return rows[0] ?? null;
}

function sourceGovernanceFieldsChanged(
  current: SourceGovernanceComparisonRow | null,
  input: SourceMutationInput
) {
  if (!current) {
    return false;
  }

  const nextValues: Record<keyof SourceGovernanceComparisonRow, unknown> = {
    source_type_code: cleanRequiredText(input.source_type_code, "web"),
    title: cleanOptionalText(input.title),
    url: cleanOptionalText(input.url),
    source_reference: cleanOptionalText(input.source_reference),
    publisher: cleanOptionalText(input.publisher),
    author_organization: cleanOptionalText(input.author_organization),
    country: cleanOptionalText(input.country),
    language_code: cleanOptionalText(input.language_code),
    visibility_code: cleanRequiredText(input.visibility_code, "public"),
    credibility_status_code: current.credibility_status_code,
    published_date: normalizeDateInput(input.published_date),
    accessed_at: normalizeTimestampInput(input.accessed_at),
    extracted_summary: cleanOptionalText(input.extracted_summary),
    relevant_excerpt: cleanOptionalText(input.relevant_excerpt),
    attachment_url: cleanOptionalText(input.attachment_url),
    duplicate_source_flag: Boolean(input.duplicate_source_flag),
  };

  return (
    normalizeSourceComparisonValue(current.source_type_code) !==
      normalizeSourceComparisonValue(nextValues.source_type_code) ||
    normalizeSourceComparisonValue(current.title) !==
      normalizeSourceComparisonValue(nextValues.title) ||
    normalizeSourceComparisonValue(current.url) !==
      normalizeSourceComparisonValue(nextValues.url) ||
    normalizeSourceComparisonValue(current.source_reference) !==
      normalizeSourceComparisonValue(nextValues.source_reference) ||
    normalizeSourceComparisonValue(current.publisher) !==
      normalizeSourceComparisonValue(nextValues.publisher) ||
    normalizeSourceComparisonValue(current.author_organization) !==
      normalizeSourceComparisonValue(nextValues.author_organization) ||
    normalizeSourceComparisonValue(current.country) !==
      normalizeSourceComparisonValue(nextValues.country) ||
    normalizeSourceComparisonValue(current.language_code) !==
      normalizeSourceComparisonValue(nextValues.language_code) ||
    normalizeSourceComparisonValue(current.visibility_code) !==
      normalizeSourceComparisonValue(nextValues.visibility_code) ||
    normalizeSourceComparisonValue(
      current.published_date
        ? normalizeRequiredTimestamp(current.published_date).slice(0, 10)
        : null
    ) !== normalizeSourceComparisonValue(nextValues.published_date) ||
    normalizeSourceComparisonValue(normalizeTimestamp(current.accessed_at)) !==
      normalizeSourceComparisonValue(nextValues.accessed_at) ||
    normalizeSourceComparisonValue(current.extracted_summary) !==
      normalizeSourceComparisonValue(nextValues.extracted_summary) ||
    normalizeSourceComparisonValue(current.relevant_excerpt) !==
      normalizeSourceComparisonValue(nextValues.relevant_excerpt) ||
    normalizeSourceComparisonValue(current.attachment_url) !==
      normalizeSourceComparisonValue(nextValues.attachment_url) ||
    normalizeSourceComparisonValue(current.duplicate_source_flag) !==
      normalizeSourceComparisonValue(nextValues.duplicate_source_flag)
  );
}

function deriveUpdatedSourceCredibilityStatus(
  current: SourceGovernanceComparisonRow | null,
  requestedStatus: string,
  governedFieldsChanged: boolean
) {
  const currentStatus = current?.credibility_status_code || "needs_review";

  if (
    governedFieldsChanged &&
    currentStatus !== "needs_review" &&
    requestedStatus === currentStatus
  ) {
    return "needs_review";
  }

  return requestedStatus;
}

function toSourceListItem(row: SourceListRow): SourceListItem {
  return {
    ...row,
    published_date: row.published_date
      ? normalizeRequiredTimestamp(row.published_date).slice(0, 10)
      : null,
    accessed_at: normalizeTimestamp(row.accessed_at),
    created_at: normalizeRequiredTimestamp(row.created_at),
    updated_at: normalizeRequiredTimestamp(row.updated_at),
  };
}

function toSourceLink(row: SourceLinkRow): SourceLink {
  return {
    ...row,
    created_at: normalizeRequiredTimestamp(row.created_at),
    updated_at: normalizeRequiredTimestamp(row.updated_at),
  };
}

function toSourceMatchCandidate(
  row: SourceMatchCandidateRow
): SourceMatchCandidateItem {
  return {
    ...row,
    confidence_score: Number(row.confidence_score),
    generated_at: normalizeRequiredTimestamp(row.generated_at),
    reviewed_at: normalizeTimestamp(row.reviewed_at),
    created_at: normalizeRequiredTimestamp(row.created_at),
    updated_at: normalizeRequiredTimestamp(row.updated_at),
    source_published_date: row.source_published_date
      ? normalizeRequiredTimestamp(row.source_published_date).slice(0, 10)
      : null,
    article_country_candidates: toStringArray(row.article_country_candidates),
    review_flags: toStringArray(row.review_flags),
  };
}

function toNumber(value: number | bigint) {
  return Number(value);
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return toStringArray(parsed);
    } catch {
      return value ? [value] : [];
    }
  }

  return [];
}

function buildSourceWhere(params: SourceListParams) {
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (params.search?.trim()) {
    values.push(`%${params.search.trim().toLowerCase()}%`);
    clauses.push(`
      LOWER(
        COALESCE(s.title, '') || ' ' ||
        COALESCE(s.url, '') || ' ' ||
        COALESCE(s.source_reference, '') || ' ' ||
        COALESCE(s.publisher, '') || ' ' ||
        COALESCE(s.author_organization, '') || ' ' ||
        COALESCE(s.country, '')
      ) LIKE $${values.length}
    `);
  }

  if (params.sourceType?.trim()) {
    values.push(params.sourceType.trim());
    clauses.push(`s.source_type_code = $${values.length}`);
  }

  if (params.visibility?.trim()) {
    values.push(params.visibility.trim());
    clauses.push(`s.visibility_code = $${values.length}`);
  }

  if (params.status?.trim()) {
    values.push(params.status.trim());
    clauses.push(`s.credibility_status_code = $${values.length}`);
  }

  if (params.quality === "weak_outdated_rejected") {
    clauses.push(`
      s.credibility_status_code IN ('weak', 'outdated', 'rejected')
    `);
  }

  if (params.duplicate) {
    clauses.push(`s.duplicate_source_flag = TRUE`);
  }

  if (params.linkState === "linked") {
    clauses.push(`
      EXISTS (
        SELECT 1
        FROM entity_sources es
        WHERE es.source_id = s.source_id
      )
    `);
  }

  if (params.linkState === "unlinked") {
    clauses.push(`
      NOT EXISTS (
        SELECT 1
        FROM entity_sources es
        WHERE es.source_id = s.source_id
      )
    `);
  }

  return {
    whereSql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    values,
  };
}

function buildSourceMatchCandidateWhere(
  params: SourceMatchCandidateListParams
) {
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (params.search?.trim()) {
    values.push(`%${params.search.trim().toLowerCase()}%`);
    clauses.push(`
      LOWER(
        COALESCE(s.title, '') || ' ' ||
        COALESCE(s.url, '') || ' ' ||
        COALESCE(s.source_reference, '') || ' ' ||
        COALESCE(c.entity_label, '') || ' ' ||
        COALESCE(c.matched_alias, '') || ' ' ||
        COALESCE(c.match_reason, '') || ' ' ||
        COALESCE(c.match_metadata::text, '')
      ) LIKE $${values.length}
    `);
  }

  if (params.sourceId?.trim() && isUuid(params.sourceId.trim())) {
    values.push(params.sourceId.trim());
    clauses.push(`c.source_id = $${values.length}::uuid`);
  }

  if (params.status?.trim()) {
    values.push(params.status.trim());
    clauses.push(`c.match_status_code = $${values.length}`);
  }

  if (params.openOnly) {
    clauses.push(`c.match_status_code NOT IN ('confirmed', 'rejected')`);
  }

  if (params.entityType?.trim()) {
    values.push(params.entityType.trim());
    clauses.push(`c.entity_type = $${values.length}`);
  }

  if (params.entityId?.trim() && isUuid(params.entityId.trim())) {
    values.push(params.entityId.trim());
    clauses.push(`c.entity_id = $${values.length}::uuid`);
  }

  if (params.flagged) {
    clauses.push(`
      c.match_metadata ? 'review_flags'
      AND jsonb_typeof(c.match_metadata->'review_flags') = 'array'
      AND jsonb_array_length(c.match_metadata->'review_flags') > 0
    `);
  }

  return {
    whereSql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    values,
  };
}

export async function listSources(
  params: SourceListParams = {}
): Promise<SourceListItem[]> {
  const limit = Math.min(Math.max(params.limit ?? 50, 1), 200);
  const { whereSql, values } = buildSourceWhere(params);
  const limitPlaceholder = values.length + 1;

  const rows = await getPrismaClient().$queryRawUnsafe<SourceListRow[]>(
    `
    SELECT
      s.source_id::text,
      s.source_type_code,
      st.label AS source_type_label,
      s.title,
      s.url,
      s.source_reference,
      s.publisher,
      s.author_organization,
      s.country,
      s.visibility_code,
      visibility.label AS visibility_label,
      s.credibility_status_code,
      status.label AS credibility_status_label,
      s.duplicate_source_flag,
      s.published_date,
      s.accessed_at,
      s.created_at,
      s.updated_at,
      added_by.name AS added_by_name,
      reviewed_by.name AS reviewed_by_name,
      COUNT(es.entity_source_id)::int AS linked_entity_count
    FROM sources s
    LEFT JOIN ref_source_types st
      ON st.code = s.source_type_code
    LEFT JOIN ref_source_visibility_levels visibility
      ON visibility.code = s.visibility_code
    LEFT JOIN ref_source_statuses status
      ON status.code = s.credibility_status_code
    LEFT JOIN app_users added_by
      ON added_by.user_id = s.added_by_user_id
    LEFT JOIN app_users reviewed_by
      ON reviewed_by.user_id = s.reviewed_by_user_id
    LEFT JOIN entity_sources es
      ON es.source_id = s.source_id
    ${whereSql}
    GROUP BY
      s.source_id,
      st.label,
      visibility.label,
      status.label,
      added_by.name,
      reviewed_by.name
    ORDER BY s.updated_at DESC NULLS LAST, s.created_at DESC, s.title ASC NULLS LAST
    LIMIT $${limitPlaceholder}
    `,
    ...values,
    limit
  );

  return rows.map(toSourceListItem);
}

export async function getSourceOperationalSummary(
  params: SourceListParams = {}
): Promise<SourceOperationalSummary> {
  const { whereSql, values } = buildSourceWhere(params);
  const rows = await getPrismaClient().$queryRawUnsafe<
    Array<{
      total: number;
      credible: number;
      needs_review: number;
      weak_outdated_rejected: number;
      tge_articles: number;
      restricted_visibility: number;
      duplicate_flagged: number;
      unlinked_sources: number;
      linked_evidence: number;
    }>
  >(
    `
    WITH filtered_sources AS (
      SELECT
        s.source_id,
        s.source_type_code,
        s.visibility_code,
        s.credibility_status_code,
        s.duplicate_source_flag
      FROM sources s
      ${whereSql}
    ),
    source_links AS (
      SELECT
        es.source_id,
        COUNT(*)::int AS link_count
      FROM entity_sources es
      INNER JOIN filtered_sources fs
        ON fs.source_id = es.source_id
      GROUP BY es.source_id
    )
    SELECT
      COUNT(fs.source_id)::int AS total,
      COUNT(*) FILTER (WHERE fs.credibility_status_code = 'credible')::int AS credible,
      COUNT(*) FILTER (WHERE fs.credibility_status_code = 'needs_review')::int AS needs_review,
      COUNT(*) FILTER (
        WHERE fs.credibility_status_code IN ('weak', 'outdated', 'rejected')
      )::int AS weak_outdated_rejected,
      COUNT(*) FILTER (WHERE fs.source_type_code = 'tge_article')::int AS tge_articles,
      COUNT(*) FILTER (
        WHERE fs.visibility_code IN (
          'internal_only',
          'client_confidential',
          'not_for_publication',
          'stakeholder_confirmation'
        )
      )::int AS restricted_visibility,
      COUNT(*) FILTER (WHERE fs.duplicate_source_flag = TRUE)::int AS duplicate_flagged,
      COUNT(*) FILTER (WHERE COALESCE(sl.link_count, 0) = 0)::int AS unlinked_sources,
      COALESCE(SUM(COALESCE(sl.link_count, 0)), 0)::int AS linked_evidence
    FROM filtered_sources fs
    LEFT JOIN source_links sl
      ON sl.source_id = fs.source_id
    `,
    ...values
  );
  const row = rows[0];

  return {
    total: toNumber(row?.total ?? 0),
    credible: toNumber(row?.credible ?? 0),
    needsReview: toNumber(row?.needs_review ?? 0),
    weakOutdatedRejected: toNumber(row?.weak_outdated_rejected ?? 0),
    tgeArticles: toNumber(row?.tge_articles ?? 0),
    restrictedVisibility: toNumber(row?.restricted_visibility ?? 0),
    duplicateFlagged: toNumber(row?.duplicate_flagged ?? 0),
    unlinkedSources: toNumber(row?.unlinked_sources ?? 0),
    linkedEvidence: toNumber(row?.linked_evidence ?? 0),
  };
}

export async function listSourceMatchCandidates(
  params: SourceMatchCandidateListParams = {}
): Promise<SourceMatchCandidateItem[]> {
  const limit = Math.min(Math.max(params.limit ?? 100, 1), 500);
  const offset = Math.max(params.offset ?? 0, 0);
  const { whereSql, values } = buildSourceMatchCandidateWhere(params);
  const limitPlaceholder = values.length + 1;
  const offsetPlaceholder = values.length + 2;

  const rows = await getPrismaClient().$queryRawUnsafe<
    SourceMatchCandidateRow[]
  >(
    `
    SELECT
      c.match_candidate_id::text,
      c.match_key,
      c.source_id::text,
      c.entity_type,
      c.entity_id::text,
      c.entity_key,
      c.entity_label,
      c.matched_alias,
      c.confidence_score::float8 AS confidence_score,
      c.match_status_code,
      ms.label AS match_status_label,
      c.match_reason,
      c.generated_by,
      c.generated_at,
      c.reviewed_by_user_id::text,
      reviewer.name AS reviewed_by_name,
      c.reviewed_at,
      c.confirmed_entity_source_id::text,
      c.created_at,
      c.updated_at,
      s.title AS source_title,
      s.url AS source_url,
      s.source_reference,
      s.country AS source_country,
      s.published_date AS source_published_date,
      s.source_type_code,
      st.label AS source_type_label,
      s.credibility_status_code AS source_credibility_status_code,
      ss.label AS source_credibility_status_label,
      c.match_metadata->>'entity_country' AS entity_country,
      c.match_metadata->>'entity_use_type' AS entity_use_type,
      COALESCE(c.match_metadata->'article_country_candidates', '[]'::jsonb) AS article_country_candidates,
      COALESCE(c.match_metadata->'review_flags', '[]'::jsonb) AS review_flags,
      COALESCE(match_counts.source_candidate_count, 0)::int AS source_candidate_count,
      COALESCE(match_counts.source_open_candidate_count, 0)::int AS source_open_candidate_count,
      COALESCE(fact_counts.confirmed_article_fact_count, 0)::int AS confirmed_article_fact_count,
      COALESCE(fact_counts.suggestion_relevant_fact_count, 0)::int AS suggestion_relevant_fact_count
    FROM source_entity_match_candidates c
    INNER JOIN sources s
      ON s.source_id = c.source_id
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS source_candidate_count,
        COUNT(*) FILTER (
          WHERE source_entity_match_candidates.match_status_code NOT IN ('confirmed', 'rejected')
        )::int AS source_open_candidate_count
      FROM source_entity_match_candidates
      WHERE source_entity_match_candidates.source_id = c.source_id
    ) match_counts ON TRUE
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*) FILTER (
          WHERE article_fact_candidates.fact_status_code = 'confirmed'
        )::int AS confirmed_article_fact_count,
        COUNT(*) FILTER (
          WHERE article_fact_candidates.fact_status_code = 'confirmed'
            AND article_fact_candidates.field_name IN (
              'electric_capacity_mwe',
              'thermal_capacity_mwth',
              'capacity_mw_unspecified',
              'target_cod_year'
            )
        )::int AS suggestion_relevant_fact_count
      FROM article_fact_candidates
      WHERE article_fact_candidates.source_id = c.source_id
    ) fact_counts ON TRUE
    LEFT JOIN ref_source_match_statuses ms
      ON ms.code = c.match_status_code
    LEFT JOIN ref_source_types st
      ON st.code = s.source_type_code
    LEFT JOIN ref_source_statuses ss
      ON ss.code = s.credibility_status_code
    LEFT JOIN app_users reviewer
      ON reviewer.user_id = c.reviewed_by_user_id
    ${whereSql}
    ORDER BY
      CASE c.match_status_code
        WHEN 'suggested_high_confidence' THEN 1
        WHEN 'suggested_medium_confidence' THEN 2
        WHEN 'suggested_low_confidence' THEN 3
        WHEN 'needs_review' THEN 4
        WHEN 'confirmed' THEN 8
        WHEN 'rejected' THEN 9
        ELSE 7
      END,
      c.confidence_score DESC,
      c.generated_at DESC
    LIMIT $${limitPlaceholder}
    OFFSET $${offsetPlaceholder}
    `,
    ...values,
    limit,
    offset
  );

  return rows.map(toSourceMatchCandidate);
}

export async function countSourceMatchCandidates(
  params: SourceMatchCandidateListParams = {}
): Promise<number> {
  const { whereSql, values } = buildSourceMatchCandidateWhere(params);
  const rows = await getPrismaClient().$queryRawUnsafe<
    Array<{ count: number | bigint }>
  >(
    `
    SELECT COUNT(*)::int AS count
    FROM source_entity_match_candidates c
    INNER JOIN sources s
      ON s.source_id = c.source_id
    ${whereSql}
    `,
    ...values
  );

  return toNumber(rows[0]?.count ?? 0);
}

export async function getSourceMatchCandidateSummary(): Promise<SourceMatchCandidateSummary> {
  const rows = await getPrismaClient().$queryRawUnsafe<
    SourceMatchCandidateSummaryRow[]
  >(
    `
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (
        WHERE match_status_code NOT IN ('confirmed', 'rejected')
      )::int AS open,
      COUNT(*) FILTER (
        WHERE match_status_code = 'suggested_high_confidence'
      )::int AS high_confidence,
      COUNT(*) FILTER (
        WHERE match_status_code = 'suggested_medium_confidence'
      )::int AS medium_confidence,
      COUNT(*) FILTER (
        WHERE match_status_code = 'suggested_low_confidence'
      )::int AS low_confidence,
      COUNT(*) FILTER (
        WHERE match_metadata ? 'review_flags'
          AND jsonb_typeof(match_metadata->'review_flags') = 'array'
          AND jsonb_array_length(match_metadata->'review_flags') > 0
      )::int AS flagged_for_review,
      COUNT(*) FILTER (
        WHERE match_status_code = 'confirmed'
      )::int AS confirmed,
      COUNT(*) FILTER (
        WHERE match_status_code = 'rejected'
      )::int AS rejected
    FROM source_entity_match_candidates
    `
  );
  const row = rows[0];

  return {
    total: toNumber(row?.total ?? 0),
    open: toNumber(row?.open ?? 0),
    highConfidence: toNumber(row?.high_confidence ?? 0),
    mediumConfidence: toNumber(row?.medium_confidence ?? 0),
    lowConfidence: toNumber(row?.low_confidence ?? 0),
    flaggedForReview: toNumber(row?.flagged_for_review ?? 0),
    confirmed: toNumber(row?.confirmed ?? 0),
    rejected: toNumber(row?.rejected ?? 0),
  };
}

export async function listSourceMatchStatusOptions(): Promise<
  SourceMatchCandidateStatusOption[]
> {
  const rows = await getPrismaClient().$queryRawUnsafe<
    SourceMatchCandidateStatusRow[]
  >(
    `
    SELECT code, label, description, is_open, sort_order, is_active
    FROM ref_source_match_statuses
    WHERE is_active = TRUE
    ORDER BY sort_order ASC, label ASC
    `
  );

  return rows;
}

export async function getSourceById(
  sourceId: string
): Promise<SourceDetail | null> {
  const rows = await getPrismaClient().$queryRawUnsafe<SourceDetailRow[]>(
    `
    SELECT
      s.source_id::text,
      s.source_type_code,
      st.label AS source_type_label,
      s.title,
      s.url,
      s.source_reference,
      s.publisher,
      s.author_organization,
      s.country,
      s.visibility_code,
      visibility.label AS visibility_label,
      s.credibility_status_code,
      status.label AS credibility_status_label,
      s.duplicate_source_flag,
      s.published_date,
      s.accessed_at,
      s.created_at,
      s.updated_at,
      s.notes,
      s.language_code,
      s.extracted_summary,
      s.relevant_excerpt,
      s.attachment_url,
      s.reviewed_at,
      added_by.name AS added_by_name,
      reviewed_by.name AS reviewed_by_name,
      COUNT(es.entity_source_id)::int AS linked_entity_count
    FROM sources s
    LEFT JOIN ref_source_types st
      ON st.code = s.source_type_code
    LEFT JOIN ref_source_visibility_levels visibility
      ON visibility.code = s.visibility_code
    LEFT JOIN ref_source_statuses status
      ON status.code = s.credibility_status_code
    LEFT JOIN app_users added_by
      ON added_by.user_id = s.added_by_user_id
    LEFT JOIN app_users reviewed_by
      ON reviewed_by.user_id = s.reviewed_by_user_id
    LEFT JOIN entity_sources es
      ON es.source_id = s.source_id
    WHERE s.source_id = $1::uuid
    GROUP BY
      s.source_id,
      st.label,
      visibility.label,
      status.label,
      added_by.name,
      reviewed_by.name
    LIMIT 1
    `,
    sourceId
  );

  const row = rows[0];

  if (!row) {
    return null;
  }

  const links = await listSourceLinks(sourceId);

  return {
    ...toSourceListItem(row),
    notes: row.notes,
    language_code: row.language_code,
    extracted_summary: row.extracted_summary,
    relevant_excerpt: row.relevant_excerpt,
    attachment_url: row.attachment_url,
    reviewed_at: normalizeTimestamp(row.reviewed_at),
    links,
  };
}

async function confirmSourceMatchCandidate(
  candidateId: string,
  actorUserId?: string | null
): Promise<SourceMatchCandidateUpdateRow | null> {
  const normalizedActorUserId = isUuid(actorUserId) ? actorUserId : null;
  const rows = await getPrismaClient().$queryRawUnsafe<
    SourceMatchCandidateUpdateRow[]
  >(
    `
    WITH reviewer AS (
      SELECT user_id
      FROM app_users
      WHERE user_id = $2::uuid
      LIMIT 1
    ),
    candidate AS (
      SELECT *
      FROM source_entity_match_candidates
      WHERE match_candidate_id = $1::uuid
        AND entity_type IN ('project', 'operating_asset', 'company')
        AND entity_id IS NOT NULL
        AND match_status_code NOT IN ('confirmed', 'rejected')
        AND NOT (
          match_metadata ? 'review_flags'
          AND jsonb_typeof(match_metadata->'review_flags') = 'array'
          AND jsonb_array_length(match_metadata->'review_flags') > 0
        )
      FOR UPDATE
    ),
    existing AS (
      SELECT es.entity_source_id
      FROM entity_sources es
      INNER JOIN candidate c
        ON c.source_id = es.source_id
      WHERE
        (c.entity_type = 'project' AND es.project_id = c.entity_id)
        OR (c.entity_type = 'operating_asset' AND es.operating_asset_id = c.entity_id)
        OR (c.entity_type = 'company' AND es.company_id = c.entity_id)
      LIMIT 1
    ),
    inserted AS (
      INSERT INTO entity_sources (
        source_id,
        project_id,
        operating_asset_id,
        company_id,
        evidence_type,
        evidence_note,
        confidence_status_code,
        reviewed_by_user_id,
        reviewed_at
      )
      SELECT
        c.source_id,
        CASE WHEN c.entity_type = 'project' THEN c.entity_id ELSE NULL END,
        CASE WHEN c.entity_type = 'operating_asset' THEN c.entity_id ELSE NULL END,
        CASE WHEN c.entity_type = 'company' THEN c.entity_id ELSE NULL END,
        'tge_article_match',
        CONCAT(
          'Confirmed automated article match',
          CASE
            WHEN c.match_reason IS NULL OR c.match_reason = '' THEN ''
            ELSE CONCAT(': ', c.match_reason)
          END
        ),
        'reported',
        (SELECT user_id FROM reviewer),
        now()
      FROM candidate c
      WHERE NOT EXISTS (SELECT 1 FROM existing)
      RETURNING entity_source_id
    ),
    chosen AS (
      SELECT entity_source_id FROM inserted
      UNION ALL
      SELECT entity_source_id FROM existing
      LIMIT 1
    )
    UPDATE source_entity_match_candidates c
    SET
      match_status_code = 'confirmed',
      reviewed_by_user_id = COALESCE((SELECT user_id FROM reviewer), c.reviewed_by_user_id),
      reviewed_at = now(),
      confirmed_entity_source_id = (SELECT entity_source_id FROM chosen),
      updated_at = now()
    WHERE c.match_candidate_id = $1::uuid
      AND EXISTS (SELECT 1 FROM candidate)
    RETURNING
      c.match_candidate_id::text,
      c.confirmed_entity_source_id::text
    `,
    candidateId,
    normalizedActorUserId
  );

  return rows[0] ?? null;
}

async function setSourceMatchCandidateStatus(
  candidateId: string,
  statusCode: "rejected" | "needs_review",
  actorUserId?: string | null
): Promise<SourceMatchCandidateUpdateRow | null> {
  const normalizedActorUserId = isUuid(actorUserId) ? actorUserId : null;
  const rows = await getPrismaClient().$queryRawUnsafe<
    SourceMatchCandidateUpdateRow[]
  >(
    `
    WITH reviewer AS (
      SELECT user_id
      FROM app_users
      WHERE user_id = $3::uuid
      LIMIT 1
    )
    UPDATE source_entity_match_candidates c
    SET
      match_status_code = $2,
      reviewed_by_user_id = CASE
        WHEN $2 = 'rejected'
          THEN COALESCE((SELECT user_id FROM reviewer), c.reviewed_by_user_id)
        ELSE NULL
      END,
      reviewed_at = CASE WHEN $2 = 'rejected' THEN now() ELSE NULL END,
      confirmed_entity_source_id = CASE
        WHEN $2 = 'rejected' THEN NULL
        ELSE c.confirmed_entity_source_id
      END,
      updated_at = now()
    WHERE c.match_candidate_id = $1::uuid
      AND c.match_status_code != 'confirmed'
    RETURNING
      c.match_candidate_id::text,
      c.confirmed_entity_source_id::text
    `,
    candidateId,
    statusCode,
    normalizedActorUserId
  );

  return rows[0] ?? null;
}

export async function updateSourceMatchCandidates({
  candidateIds,
  action,
  actorUserId,
}: {
  candidateIds: string[];
  action: SourceMatchCandidateAction;
  actorUserId?: string | null;
}): Promise<SourceMatchCandidateBulkResult> {
  const validCandidateIds = [...new Set(candidateIds.filter(isUuid))];
  const result: SourceMatchCandidateBulkResult = {
    requested: validCandidateIds.length,
    updated: 0,
    confirmedLinksCreatedOrReused: 0,
  };

  for (const candidateId of validCandidateIds) {
    const row =
      action === "confirm"
        ? await confirmSourceMatchCandidate(candidateId, actorUserId)
        : await setSourceMatchCandidateStatus(
            candidateId,
            action === "reject" ? "rejected" : "needs_review",
            actorUserId
          );

    if (row) {
      result.updated += 1;

      if (row.confirmed_entity_source_id) {
        result.confirmedLinksCreatedOrReused += 1;
      }
    }
  }

  return result;
}

export async function listSourceLinks(sourceId: string): Promise<SourceLink[]> {
  const rows = await getPrismaClient().$queryRawUnsafe<SourceLinkRow[]>(
    `
    SELECT
      es.entity_source_id::text,
      es.source_id::text,
      CASE
        WHEN es.project_id IS NOT NULL THEN 'project'
        WHEN es.operating_asset_id IS NOT NULL THEN 'operating_asset'
        ELSE 'company'
      END::text AS entity_type,
      COALESCE(es.project_id, es.operating_asset_id, es.company_id)::text AS entity_id,
      COALESCE(p.project_name, a.asset_name, c.company_name) AS entity_name,
      COALESCE(p.legacy_project_id, a.legacy_plant_id, c.legacy_company_id) AS legacy_id,
      COALESCE(p.country, a.country, c.headquarters_country) AS country,
      es.evidence_type,
      es.evidence_note,
      es.linked_field,
      es.claim_text,
      es.extracted_value,
      es.confidence_status_code,
      es.is_primary_evidence,
      es.created_at,
      es.updated_at
    FROM entity_sources es
    LEFT JOIN projects p
      ON p.project_id = es.project_id
    LEFT JOIN operating_assets a
      ON a.operating_asset_id = es.operating_asset_id
    LEFT JOIN companies c
      ON c.company_id = es.company_id
    WHERE es.source_id = $1::uuid
    ORDER BY es.created_at DESC, entity_name ASC
    `,
    sourceId
  );

  return rows.map(toSourceLink);
}

export async function createSource(
  input: SourceMutationInput,
  actorUserId?: string | null
): Promise<SourceDetail> {
  const normalizedActorUserId = isUuid(actorUserId) ? actorUserId : null;
  const rows = await getPrismaClient().$queryRawUnsafe<SourceIdRow[]>(
    `
    WITH actor AS (
      SELECT user_id
      FROM app_users
      WHERE user_id = $18::uuid
      LIMIT 1
    )
    INSERT INTO sources (
      source_type_code,
      title,
      url,
      source_reference,
      publisher,
      author_organization,
      country,
      language_code,
      visibility_code,
      credibility_status_code,
      published_date,
      accessed_at,
      notes,
      extracted_summary,
      relevant_excerpt,
      attachment_url,
      duplicate_source_flag,
      added_by_user_id,
      reviewed_by_user_id,
      reviewed_at
    )
    VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11::date,
      $12::timestamptz, $13, $14, $15, $16,
      $17,
      (SELECT user_id FROM actor),
      CASE WHEN $10 != 'needs_review' THEN (SELECT user_id FROM actor) ELSE NULL END,
      CASE WHEN $10 != 'needs_review' THEN now() ELSE NULL END
    )
    RETURNING source_id::text
    `,
    cleanRequiredText(input.source_type_code, "web"),
    cleanOptionalText(input.title),
    cleanOptionalText(input.url),
    cleanOptionalText(input.source_reference),
    cleanOptionalText(input.publisher),
    cleanOptionalText(input.author_organization),
    cleanOptionalText(input.country),
    cleanOptionalText(input.language_code),
    cleanRequiredText(input.visibility_code, "public"),
    cleanRequiredText(input.credibility_status_code, "needs_review"),
    normalizeDateInput(input.published_date),
    normalizeTimestampInput(input.accessed_at),
    cleanOptionalText(input.notes),
    cleanOptionalText(input.extracted_summary),
    cleanOptionalText(input.relevant_excerpt),
    cleanOptionalText(input.attachment_url),
    Boolean(input.duplicate_source_flag),
    normalizedActorUserId
  );

  const source = await getSourceById(rows[0].source_id);

  if (!source) {
    throw new Error("Created source could not be reloaded.");
  }

  return source;
}

export async function updateSource(
  sourceId: string,
  input: SourceMutationInput,
  actorUserId?: string | null
): Promise<SourceDetail | null> {
  const currentSource = await getSourceGovernanceComparison(sourceId);
  const governedFieldsChanged = sourceGovernanceFieldsChanged(
    currentSource,
    input
  );
  const credibilityStatusCode = deriveUpdatedSourceCredibilityStatus(
    currentSource,
    cleanRequiredText(input.credibility_status_code, "needs_review"),
    governedFieldsChanged
  );
  const normalizedActorUserId = isUuid(actorUserId) ? actorUserId : null;
  const rows = await getPrismaClient().$queryRawUnsafe<SourceIdRow[]>(
    `
    WITH reviewer AS (
      SELECT user_id
      FROM app_users
      WHERE user_id = $19::uuid
      LIMIT 1
    )
    UPDATE sources
    SET
      source_type_code = $2,
      title = $3,
      url = $4,
      source_reference = $5,
      publisher = $6,
      author_organization = $7,
      country = $8,
      language_code = $9,
      visibility_code = $10,
      credibility_status_code = $11,
      published_date = $12::date,
      accessed_at = $13::timestamptz,
      notes = $14,
      extracted_summary = $15,
      relevant_excerpt = $16,
      attachment_url = $17,
      duplicate_source_flag = $18,
      reviewed_at = CASE WHEN $11 != 'needs_review' THEN now() ELSE NULL END,
      reviewed_by_user_id = CASE
        WHEN $11 != 'needs_review'
          THEN COALESCE((SELECT user_id FROM reviewer), reviewed_by_user_id)
        ELSE NULL
      END,
      updated_at = now()
    WHERE source_id = $1::uuid
    RETURNING source_id::text
    `,
    sourceId,
    cleanRequiredText(input.source_type_code, "web"),
    cleanOptionalText(input.title),
    cleanOptionalText(input.url),
    cleanOptionalText(input.source_reference),
    cleanOptionalText(input.publisher),
    cleanOptionalText(input.author_organization),
    cleanOptionalText(input.country),
    cleanOptionalText(input.language_code),
    cleanRequiredText(input.visibility_code, "public"),
    credibilityStatusCode,
    normalizeDateInput(input.published_date),
    normalizeTimestampInput(input.accessed_at),
    cleanOptionalText(input.notes),
    cleanOptionalText(input.extracted_summary),
    cleanOptionalText(input.relevant_excerpt),
    cleanOptionalText(input.attachment_url),
    Boolean(input.duplicate_source_flag),
    normalizedActorUserId
  );

  if (!rows[0]) {
    return null;
  }

  return getSourceById(rows[0].source_id);
}

export async function updateSourceCredibilityStatus({
  sourceId,
  credibilityStatusCode,
  reviewedByUserId,
}: {
  sourceId: string;
  credibilityStatusCode: string;
  reviewedByUserId?: string | null;
}): Promise<SourceDetail | null> {
  const normalizedReviewerId = isUuid(reviewedByUserId)
    ? reviewedByUserId
    : null;
  const rows = await getPrismaClient().$queryRawUnsafe<SourceIdRow[]>(
    `
    WITH reviewer AS (
      SELECT user_id
      FROM app_users
      WHERE user_id = $3::uuid
      LIMIT 1
    )
    UPDATE sources
    SET
      credibility_status_code = $2,
      reviewed_at = CASE WHEN $2 != 'needs_review' THEN now() ELSE NULL END,
      reviewed_by_user_id = CASE
        WHEN $2 != 'needs_review'
          THEN COALESCE((SELECT user_id FROM reviewer), reviewed_by_user_id)
        ELSE NULL
      END,
      updated_at = now()
    WHERE source_id = $1::uuid
    RETURNING source_id::text
    `,
    sourceId,
    credibilityStatusCode,
    normalizedReviewerId
  );

  if (!rows[0]) {
    return null;
  }

  return getSourceById(rows[0].source_id);
}

export async function listSourceLinkTargetOptions(): Promise<
  SourceLinkTargetOption[]
> {
  const rows = await getPrismaClient().$queryRawUnsafe<SourceLinkTargetRow[]>(
    `
    SELECT *
    FROM (
      SELECT
        'project'::text AS entity_type,
        p.project_id::text AS entity_id,
        p.project_name AS label,
        p.legacy_project_id AS legacy_id,
        p.country
      FROM projects p

      UNION ALL

      SELECT
        'operating_asset'::text AS entity_type,
        a.operating_asset_id::text AS entity_id,
        a.asset_name AS label,
        a.legacy_plant_id AS legacy_id,
        a.country
      FROM operating_assets a

      UNION ALL

      SELECT
        'company'::text AS entity_type,
        c.company_id::text AS entity_id,
        c.company_name AS label,
        c.legacy_company_id AS legacy_id,
        c.headquarters_country AS country
      FROM companies c
    ) targets
    ORDER BY entity_type ASC, label ASC
    `
  );

  return rows;
}

export async function getSourceFormReferenceData(): Promise<SourceFormReferenceData> {
  const prisma = getPrismaClient();
  const [referenceData, confidenceStatuses, linkTargets] = await Promise.all([
    getSourceReferenceData(),
    prisma.ref_estimate_statuses.findMany({
      where: { is_active: true },
      orderBy: [{ sort_order: "asc" }, { label: "asc" }],
    }),
    listSourceLinkTargetOptions(),
  ]);

  return {
    ...referenceData,
    confidenceStatuses,
    linkTargets,
  };
}

export async function createSourceLink(
  input: SourceLinkMutationInput
): Promise<SourceLink | null> {
  const normalizedReviewerId = isUuid(input.reviewedByUserId)
    ? input.reviewedByUserId
    : null;
  const targetColumn =
    input.entity_type === "project"
      ? "project_id"
      : input.entity_type === "operating_asset"
        ? "operating_asset_id"
        : input.entity_type === "company"
          ? "company_id"
          : null;

  if (!targetColumn) {
    throw new Error("Invalid source link entity type.");
  }

  const rows = await getPrismaClient().$queryRawUnsafe<SourceLinkIdRow[]>(
    `
    WITH reviewer AS (
      SELECT user_id
      FROM app_users
      WHERE user_id = $10::uuid
      LIMIT 1
    )
    INSERT INTO entity_sources (
      source_id,
      ${targetColumn},
      evidence_type,
      evidence_note,
      confidence_status_code,
      linked_field,
      claim_text,
      extracted_value,
      is_primary_evidence,
      reviewed_by_user_id,
      reviewed_at
    )
    VALUES (
      $1::uuid,
      $2::uuid,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9,
      CASE WHEN $5 != 'unknown' THEN (SELECT user_id FROM reviewer) ELSE NULL END,
      CASE WHEN $5 != 'unknown' THEN now() ELSE NULL END
    )
    RETURNING entity_source_id::text
    `,
    input.source_id,
    input.entity_id,
    cleanOptionalText(input.evidence_type),
    cleanOptionalText(input.evidence_note),
    cleanRequiredText(input.confidence_status_code, "unknown"),
    cleanOptionalText(input.linked_field),
    cleanOptionalText(input.claim_text),
    cleanOptionalText(input.extracted_value),
    Boolean(input.is_primary_evidence),
    normalizedReviewerId
  );

  const links = await listSourceLinks(input.source_id);
  return links.find((link) => link.entity_source_id === rows[0].entity_source_id) ?? null;
}

export async function deleteSourceLink(
  entitySourceId: string
): Promise<string | null> {
  const rows = await getPrismaClient().$queryRawUnsafe<DeletedSourceLinkRow[]>(
    `
    DELETE FROM entity_sources
    WHERE entity_source_id = $1::uuid
    RETURNING source_id::text
    `,
    entitySourceId
  );

  return rows[0]?.source_id ?? null;
}

export async function getSourceReferenceData(): Promise<SourceReferenceData> {
  const prisma = getPrismaClient();
  const [sourceTypes, visibilityLevels, credibilityStatuses] = await Promise.all([
    prisma.ref_source_types.findMany({
      where: { is_active: true },
      orderBy: [{ sort_order: "asc" }, { label: "asc" }],
    }),
    prisma.ref_source_visibility_levels.findMany({
      where: { is_active: true },
      orderBy: [{ sort_order: "asc" }, { label: "asc" }],
    }),
    prisma.ref_source_statuses.findMany({
      where: { is_active: true },
      orderBy: [{ sort_order: "asc" }, { label: "asc" }],
    }),
  ]);

  return {
    sourceTypes,
    visibilityLevels,
    credibilityStatuses,
  };
}
