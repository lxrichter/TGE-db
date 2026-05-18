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

type SourceLinkTargetRow = SourceLinkTargetOption;

type SourceIdRow = {
  source_id: string;
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
