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
