import { queryPostgres } from "@/lib/postgres";

export type PostgresPreviewSummary = {
  projectCount: number;
  operatingAssetCount: number;
  companyCount: number;
  directUseComponentCount: number;
  companyProjectLinkCount: number;
  companyAssetLinkCount: number;
};

export type PostgresPreviewProject = {
  project_id: string;
  legacy_project_id: string | null;
  project_name: string;
  primary_use_type_code: string;
  lifecycle_phase_code: string;
  country: string | null;
  region: string | null;
  electric_capacity_mwe: number | null;
  thermal_capacity_mwth: number | null;
  annual_heat_supply_gwhth: number | null;
  review_status_code: string;
  research_status: string | null;
};

export type PostgresPreviewOperatingAsset = {
  operating_asset_id: string;
  legacy_plant_id: string | null;
  asset_name: string;
  primary_use_type_code: string;
  lifecycle_phase_code: string;
  country: string | null;
  region: string | null;
  electric_capacity_mwe: number | null;
  electric_capacity_running_mwe: number | null;
  thermal_capacity_mwth: number | null;
  annual_power_generation_gwhe: number | null;
  annual_heat_supply_gwhth: number | null;
  review_status_code: string;
  research_status: string | null;
};

export type PostgresPreviewCompany = {
  company_id: string;
  legacy_company_id: string | null;
  company_name: string;
  entity_type_code: string | null;
  company_type_primary_code: string | null;
  headquarters_country: string | null;
  geothermal_focus: string | null;
  review_status_code: string;
  research_status: string | null;
};

export type ResearchOpsQueueSeverity = "critical" | "important" | "workflow";

export type ResearchOpsQueueKey =
  | "needs_source"
  | "missing_country"
  | "missing_lifecycle"
  | "missing_use_type"
  | "missing_company_link"
  | "missing_coordinates"
  | "missing_capacity"
  | "needs_approval"
  | "needs_update"
  | "direct_use_classification"
  | "suspected_duplicates";

export type PostgresResearchOpsQueueItem = {
  queue_key: ResearchOpsQueueKey;
  entity_type: "project" | "operating_asset" | "company";
  entity_id: string;
  legacy_id: string | null;
  name: string;
  country: string | null;
  primary_use_type_code: string | null;
  lifecycle_phase_code: string | null;
  review_status_code: string | null;
  issue_label: string;
  updated_at: string;
};

export type PostgresResearchOpsQueue = {
  key: ResearchOpsQueueKey;
  title: string;
  severity: ResearchOpsQueueSeverity;
  description: string;
  count: number;
  items: PostgresResearchOpsQueueItem[];
};

export type PostgresResearchOpsRecentEdit = {
  entity_type: "project" | "operating_asset" | "company";
  entity_id: string;
  legacy_id: string | null;
  name: string;
  country: string | null;
  primary_use_type_code: string | null;
  lifecycle_phase_code: string | null;
  review_status_code: string | null;
  updated_at: string;
};

export type PostgresResearchOpsDashboard = {
  generatedAt: string;
  totals: {
    openIssues: number;
    criticalIssues: number;
    importantIssues: number;
    workflowIssues: number;
  };
  queues: PostgresResearchOpsQueue[];
  recentEdits: PostgresResearchOpsRecentEdit[];
};

type CountRow = {
  count: number;
};

type QueueDefinition = {
  key: ResearchOpsQueueKey;
  title: string;
  severity: ResearchOpsQueueSeverity;
  description: string;
  sql: string;
};

type QueueItemRow = Omit<PostgresResearchOpsQueueItem, "updated_at"> & {
  updated_at: string | Date;
  total_count: number;
};

type RecentEditRow = Omit<PostgresResearchOpsRecentEdit, "updated_at"> & {
  updated_at: string | Date;
};

const researchOpsQueueDefinitions: QueueDefinition[] = [
  {
    key: "needs_source",
    title: "Needs Source",
    severity: "critical",
    description: "Records without linked source/evidence records.",
    sql: `
      SELECT
        'needs_source'::text AS queue_key,
        'project'::text AS entity_type,
        p.project_id::text AS entity_id,
        p.legacy_project_id AS legacy_id,
        p.project_name AS name,
        p.country,
        p.primary_use_type_code,
        p.lifecycle_phase_code,
        p.review_status_code,
        'No linked evidence source'::text AS issue_label,
        p.updated_at
      FROM projects p
      WHERE NOT EXISTS (
        SELECT 1 FROM entity_sources es WHERE es.project_id = p.project_id
      )

      UNION ALL

      SELECT
        'needs_source'::text AS queue_key,
        'operating_asset'::text AS entity_type,
        a.operating_asset_id::text AS entity_id,
        a.legacy_plant_id AS legacy_id,
        a.asset_name AS name,
        a.country,
        a.primary_use_type_code,
        a.lifecycle_phase_code,
        a.review_status_code,
        'No linked evidence source'::text AS issue_label,
        a.updated_at
      FROM operating_assets a
      WHERE NOT EXISTS (
        SELECT 1 FROM entity_sources es WHERE es.operating_asset_id = a.operating_asset_id
      )

      UNION ALL

      SELECT
        'needs_source'::text AS queue_key,
        'company'::text AS entity_type,
        c.company_id::text AS entity_id,
        c.legacy_company_id AS legacy_id,
        c.company_name AS name,
        c.headquarters_country AS country,
        c.company_type_primary_code AS primary_use_type_code,
        NULL::text AS lifecycle_phase_code,
        c.review_status_code,
        'No linked evidence source'::text AS issue_label,
        c.updated_at
      FROM companies c
      WHERE NOT EXISTS (
        SELECT 1 FROM entity_sources es WHERE es.company_id = c.company_id
      )
    `,
  },
  {
    key: "missing_country",
    title: "Missing Country",
    severity: "critical",
    description: "Project and operating asset records missing a country.",
    sql: `
      SELECT
        'missing_country'::text AS queue_key,
        'project'::text AS entity_type,
        p.project_id::text AS entity_id,
        p.legacy_project_id AS legacy_id,
        p.project_name AS name,
        p.country,
        p.primary_use_type_code,
        p.lifecycle_phase_code,
        p.review_status_code,
        'Country is empty'::text AS issue_label,
        p.updated_at
      FROM projects p
      WHERE NULLIF(TRIM(COALESCE(p.country, '')), '') IS NULL

      UNION ALL

      SELECT
        'missing_country'::text AS queue_key,
        'operating_asset'::text AS entity_type,
        a.operating_asset_id::text AS entity_id,
        a.legacy_plant_id AS legacy_id,
        a.asset_name AS name,
        a.country,
        a.primary_use_type_code,
        a.lifecycle_phase_code,
        a.review_status_code,
        'Country is empty'::text AS issue_label,
        a.updated_at
      FROM operating_assets a
      WHERE NULLIF(TRIM(COALESCE(a.country, '')), '') IS NULL
    `,
  },
  {
    key: "missing_lifecycle",
    title: "Missing Lifecycle / Status",
    severity: "critical",
    description: "Project and asset records still using unknown lifecycle placeholders.",
    sql: `
      SELECT
        'missing_lifecycle'::text AS queue_key,
        'project'::text AS entity_type,
        p.project_id::text AS entity_id,
        p.legacy_project_id AS legacy_id,
        p.project_name AS name,
        p.country,
        p.primary_use_type_code,
        p.lifecycle_phase_code,
        p.review_status_code,
        'Lifecycle phase needs classification'::text AS issue_label,
        p.updated_at
      FROM projects p
      WHERE p.lifecycle_phase_code IS NULL
        OR p.lifecycle_phase_code IN ('unknown', 'prospect_tbd')

      UNION ALL

      SELECT
        'missing_lifecycle'::text AS queue_key,
        'operating_asset'::text AS entity_type,
        a.operating_asset_id::text AS entity_id,
        a.legacy_plant_id AS legacy_id,
        a.asset_name AS name,
        a.country,
        a.primary_use_type_code,
        a.lifecycle_phase_code,
        a.review_status_code,
        'Operating status needs classification'::text AS issue_label,
        a.updated_at
      FROM operating_assets a
      WHERE a.lifecycle_phase_code IS NULL
        OR a.lifecycle_phase_code = 'unknown'
    `,
  },
  {
    key: "missing_use_type",
    title: "Missing Use Type / Category",
    severity: "critical",
    description: "Project and asset records without power/direct-use/hybrid classification.",
    sql: `
      SELECT
        'missing_use_type'::text AS queue_key,
        'project'::text AS entity_type,
        p.project_id::text AS entity_id,
        p.legacy_project_id AS legacy_id,
        p.project_name AS name,
        p.country,
        p.primary_use_type_code,
        p.lifecycle_phase_code,
        p.review_status_code,
        'Geothermal use type is unknown'::text AS issue_label,
        p.updated_at
      FROM projects p
      WHERE p.primary_use_type_code IS NULL
        OR p.primary_use_type_code = 'unknown'

      UNION ALL

      SELECT
        'missing_use_type'::text AS queue_key,
        'operating_asset'::text AS entity_type,
        a.operating_asset_id::text AS entity_id,
        a.legacy_plant_id AS legacy_id,
        a.asset_name AS name,
        a.country,
        a.primary_use_type_code,
        a.lifecycle_phase_code,
        a.review_status_code,
        'Geothermal use type is unknown'::text AS issue_label,
        a.updated_at
      FROM operating_assets a
      WHERE a.primary_use_type_code IS NULL
        OR a.primary_use_type_code = 'unknown'
    `,
  },
  {
    key: "missing_company_link",
    title: "Missing Company Link",
    severity: "important",
    description: "Project and asset records without structured company-role links.",
    sql: `
      SELECT
        'missing_company_link'::text AS queue_key,
        'project'::text AS entity_type,
        p.project_id::text AS entity_id,
        p.legacy_project_id AS legacy_id,
        p.project_name AS name,
        p.country,
        p.primary_use_type_code,
        p.lifecycle_phase_code,
        p.review_status_code,
        'No linked company role'::text AS issue_label,
        p.updated_at
      FROM projects p
      WHERE NOT EXISTS (
        SELECT 1 FROM company_project_links cpl WHERE cpl.project_id = p.project_id
      )

      UNION ALL

      SELECT
        'missing_company_link'::text AS queue_key,
        'operating_asset'::text AS entity_type,
        a.operating_asset_id::text AS entity_id,
        a.legacy_plant_id AS legacy_id,
        a.asset_name AS name,
        a.country,
        a.primary_use_type_code,
        a.lifecycle_phase_code,
        a.review_status_code,
        'No linked company role'::text AS issue_label,
        a.updated_at
      FROM operating_assets a
      WHERE NOT EXISTS (
        SELECT 1
        FROM company_operating_asset_links coal
        WHERE coal.operating_asset_id = a.operating_asset_id
      )
    `,
  },
  {
    key: "missing_coordinates",
    title: "Missing Coordinates",
    severity: "important",
    description: "Project and asset records that cannot be mapped yet.",
    sql: `
      SELECT
        'missing_coordinates'::text AS queue_key,
        'project'::text AS entity_type,
        p.project_id::text AS entity_id,
        p.legacy_project_id AS legacy_id,
        p.project_name AS name,
        p.country,
        p.primary_use_type_code,
        p.lifecycle_phase_code,
        p.review_status_code,
        'Latitude or longitude missing'::text AS issue_label,
        p.updated_at
      FROM projects p
      WHERE p.latitude IS NULL OR p.longitude IS NULL

      UNION ALL

      SELECT
        'missing_coordinates'::text AS queue_key,
        'operating_asset'::text AS entity_type,
        a.operating_asset_id::text AS entity_id,
        a.legacy_plant_id AS legacy_id,
        a.asset_name AS name,
        a.country,
        a.primary_use_type_code,
        a.lifecycle_phase_code,
        a.review_status_code,
        'Latitude or longitude missing'::text AS issue_label,
        a.updated_at
      FROM operating_assets a
      WHERE a.latitude IS NULL OR a.longitude IS NULL
    `,
  },
  {
    key: "missing_capacity",
    title: "Missing Capacity / Output",
    severity: "important",
    description: "Project and asset records without any structured capacity or output value.",
    sql: `
      SELECT
        'missing_capacity'::text AS queue_key,
        'project'::text AS entity_type,
        p.project_id::text AS entity_id,
        p.legacy_project_id AS legacy_id,
        p.project_name AS name,
        p.country,
        p.primary_use_type_code,
        p.lifecycle_phase_code,
        p.review_status_code,
        'No structured capacity or output value'::text AS issue_label,
        p.updated_at
      FROM projects p
      WHERE p.potential_min_mwe IS NULL
        AND p.potential_max_mwe IS NULL
        AND p.electric_capacity_mwe IS NULL
        AND p.electric_capacity_running_mwe IS NULL
        AND p.thermal_capacity_mwth IS NULL
        AND p.installed_heat_pump_capacity_mwth IS NULL
        AND p.geothermal_resource_capacity_mwth IS NULL
        AND p.annual_power_generation_gwhe IS NULL
        AND p.annual_heat_supply_gwhth IS NULL
        AND p.annual_cooling_supply_gwhc IS NULL

      UNION ALL

      SELECT
        'missing_capacity'::text AS queue_key,
        'operating_asset'::text AS entity_type,
        a.operating_asset_id::text AS entity_id,
        a.legacy_plant_id AS legacy_id,
        a.asset_name AS name,
        a.country,
        a.primary_use_type_code,
        a.lifecycle_phase_code,
        a.review_status_code,
        'No structured capacity or output value'::text AS issue_label,
        a.updated_at
      FROM operating_assets a
      WHERE a.potential_min_mwe IS NULL
        AND a.potential_max_mwe IS NULL
        AND a.electric_capacity_mwe IS NULL
        AND a.electric_capacity_running_mwe IS NULL
        AND a.thermal_capacity_mwth IS NULL
        AND a.installed_heat_pump_capacity_mwth IS NULL
        AND a.geothermal_resource_capacity_mwth IS NULL
        AND a.annual_power_generation_gwhe IS NULL
        AND a.annual_heat_supply_gwhth IS NULL
        AND a.annual_cooling_supply_gwhc IS NULL
    `,
  },
  {
    key: "needs_approval",
    title: "Needs Approval",
    severity: "workflow",
    description: "Draft or validation records waiting for editor review.",
    sql: `
      SELECT
        'needs_approval'::text AS queue_key,
        'project'::text AS entity_type,
        p.project_id::text AS entity_id,
        p.legacy_project_id AS legacy_id,
        p.project_name AS name,
        p.country,
        p.primary_use_type_code,
        p.lifecycle_phase_code,
        p.review_status_code,
        'Draft or validation state'::text AS issue_label,
        p.updated_at
      FROM projects p
      WHERE p.review_status_code IN ('draft', 'validation')

      UNION ALL

      SELECT
        'needs_approval'::text AS queue_key,
        'operating_asset'::text AS entity_type,
        a.operating_asset_id::text AS entity_id,
        a.legacy_plant_id AS legacy_id,
        a.asset_name AS name,
        a.country,
        a.primary_use_type_code,
        a.lifecycle_phase_code,
        a.review_status_code,
        'Draft or validation state'::text AS issue_label,
        a.updated_at
      FROM operating_assets a
      WHERE a.review_status_code IN ('draft', 'validation')

      UNION ALL

      SELECT
        'needs_approval'::text AS queue_key,
        'company'::text AS entity_type,
        c.company_id::text AS entity_id,
        c.legacy_company_id AS legacy_id,
        c.company_name AS name,
        c.headquarters_country AS country,
        c.company_type_primary_code AS primary_use_type_code,
        NULL::text AS lifecycle_phase_code,
        c.review_status_code,
        'Draft or validation state'::text AS issue_label,
        c.updated_at
      FROM companies c
      WHERE c.review_status_code IN ('draft', 'validation')
    `,
  },
  {
    key: "needs_update",
    title: "Needs Update",
    severity: "workflow",
    description: "Previously reviewed records that need re-checking after edits or staleness.",
    sql: `
      SELECT
        'needs_update'::text AS queue_key,
        'project'::text AS entity_type,
        p.project_id::text AS entity_id,
        p.legacy_project_id AS legacy_id,
        p.project_name AS name,
        p.country,
        p.primary_use_type_code,
        p.lifecycle_phase_code,
        p.review_status_code,
        'Review status is needs_update'::text AS issue_label,
        p.updated_at
      FROM projects p
      WHERE p.review_status_code = 'needs_update'

      UNION ALL

      SELECT
        'needs_update'::text AS queue_key,
        'operating_asset'::text AS entity_type,
        a.operating_asset_id::text AS entity_id,
        a.legacy_plant_id AS legacy_id,
        a.asset_name AS name,
        a.country,
        a.primary_use_type_code,
        a.lifecycle_phase_code,
        a.review_status_code,
        'Review status is needs_update'::text AS issue_label,
        a.updated_at
      FROM operating_assets a
      WHERE a.review_status_code = 'needs_update'

      UNION ALL

      SELECT
        'needs_update'::text AS queue_key,
        'company'::text AS entity_type,
        c.company_id::text AS entity_id,
        c.legacy_company_id AS legacy_id,
        c.company_name AS name,
        c.headquarters_country AS country,
        c.company_type_primary_code AS primary_use_type_code,
        NULL::text AS lifecycle_phase_code,
        c.review_status_code,
        'Review status is needs_update'::text AS issue_label,
        c.updated_at
      FROM companies c
      WHERE c.review_status_code = 'needs_update'
    `,
  },
  {
    key: "direct_use_classification",
    title: "Direct-Use Classification",
    severity: "important",
    description: "Direct-use or hybrid records missing structured direct-use categories.",
    sql: `
      SELECT
        'direct_use_classification'::text AS queue_key,
        'project'::text AS entity_type,
        p.project_id::text AS entity_id,
        p.legacy_project_id AS legacy_id,
        p.project_name AS name,
        p.country,
        p.primary_use_type_code,
        p.lifecycle_phase_code,
        p.review_status_code,
        'Direct-use category missing'::text AS issue_label,
        p.updated_at
      FROM projects p
      WHERE p.primary_use_type_code IN ('direct_use', 'hybrid')
        AND NOT EXISTS (
          SELECT 1
          FROM asset_use_components auc
          WHERE auc.project_id = p.project_id
            AND auc.direct_use_category_code IS NOT NULL
        )

      UNION ALL

      SELECT
        'direct_use_classification'::text AS queue_key,
        'operating_asset'::text AS entity_type,
        a.operating_asset_id::text AS entity_id,
        a.legacy_plant_id AS legacy_id,
        a.asset_name AS name,
        a.country,
        a.primary_use_type_code,
        a.lifecycle_phase_code,
        a.review_status_code,
        'Direct-use category missing'::text AS issue_label,
        a.updated_at
      FROM operating_assets a
      WHERE a.primary_use_type_code IN ('direct_use', 'hybrid')
        AND NOT EXISTS (
          SELECT 1
          FROM asset_use_components auc
          WHERE auc.operating_asset_id = a.operating_asset_id
            AND auc.direct_use_category_code IS NOT NULL
        )
    `,
  },
  {
    key: "suspected_duplicates",
    title: "Suspected Duplicates",
    severity: "important",
    description: "Records with duplicate normalized names in the same country or company name.",
    sql: `
      WITH project_duplicates AS (
        SELECT
          LOWER(COALESCE(NULLIF(project_name_clean, ''), project_name)) AS duplicate_name,
          COALESCE(country, '') AS duplicate_country
        FROM projects
        GROUP BY 1, 2
        HAVING COUNT(*) > 1
      ),
      asset_duplicates AS (
        SELECT
          LOWER(COALESCE(NULLIF(asset_name_clean, ''), asset_name)) AS duplicate_name,
          COALESCE(country, '') AS duplicate_country
        FROM operating_assets
        GROUP BY 1, 2
        HAVING COUNT(*) > 1
      ),
      company_duplicates AS (
        SELECT LOWER(COALESCE(NULLIF(company_name_clean, ''), company_name)) AS duplicate_name
        FROM companies
        GROUP BY 1
        HAVING COUNT(*) > 1
      )

      SELECT
        'suspected_duplicates'::text AS queue_key,
        'project'::text AS entity_type,
        p.project_id::text AS entity_id,
        p.legacy_project_id AS legacy_id,
        p.project_name AS name,
        p.country,
        p.primary_use_type_code,
        p.lifecycle_phase_code,
        p.review_status_code,
        'Same normalized project name and country'::text AS issue_label,
        p.updated_at
      FROM projects p
      JOIN project_duplicates d
        ON d.duplicate_name = LOWER(COALESCE(NULLIF(p.project_name_clean, ''), p.project_name))
        AND d.duplicate_country = COALESCE(p.country, '')

      UNION ALL

      SELECT
        'suspected_duplicates'::text AS queue_key,
        'operating_asset'::text AS entity_type,
        a.operating_asset_id::text AS entity_id,
        a.legacy_plant_id AS legacy_id,
        a.asset_name AS name,
        a.country,
        a.primary_use_type_code,
        a.lifecycle_phase_code,
        a.review_status_code,
        'Same normalized asset name and country'::text AS issue_label,
        a.updated_at
      FROM operating_assets a
      JOIN asset_duplicates d
        ON d.duplicate_name = LOWER(COALESCE(NULLIF(a.asset_name_clean, ''), a.asset_name))
        AND d.duplicate_country = COALESCE(a.country, '')

      UNION ALL

      SELECT
        'suspected_duplicates'::text AS queue_key,
        'company'::text AS entity_type,
        c.company_id::text AS entity_id,
        c.legacy_company_id AS legacy_id,
        c.company_name AS name,
        c.headquarters_country AS country,
        c.company_type_primary_code AS primary_use_type_code,
        NULL::text AS lifecycle_phase_code,
        c.review_status_code,
        'Same normalized company name'::text AS issue_label,
        c.updated_at
      FROM companies c
      JOIN company_duplicates d
        ON d.duplicate_name = LOWER(COALESCE(NULLIF(c.company_name_clean, ''), c.company_name))
    `,
  },
];

export async function getPostgresPreviewSummary(): Promise<PostgresPreviewSummary> {
  const [
    projects,
    operatingAssets,
    companies,
    directUseComponents,
    companyProjectLinks,
    companyAssetLinks,
  ] = await Promise.all([
    queryPostgres<CountRow>("SELECT COUNT(*)::int AS count FROM projects"),
    queryPostgres<CountRow>("SELECT COUNT(*)::int AS count FROM operating_assets"),
    queryPostgres<CountRow>("SELECT COUNT(*)::int AS count FROM companies"),
    queryPostgres<CountRow>("SELECT COUNT(*)::int AS count FROM asset_use_components"),
    queryPostgres<CountRow>("SELECT COUNT(*)::int AS count FROM company_project_links"),
    queryPostgres<CountRow>("SELECT COUNT(*)::int AS count FROM company_operating_asset_links"),
  ]);

  return {
    projectCount: projects.rows[0]?.count ?? 0,
    operatingAssetCount: operatingAssets.rows[0]?.count ?? 0,
    companyCount: companies.rows[0]?.count ?? 0,
    directUseComponentCount: directUseComponents.rows[0]?.count ?? 0,
    companyProjectLinkCount: companyProjectLinks.rows[0]?.count ?? 0,
    companyAssetLinkCount: companyAssetLinks.rows[0]?.count ?? 0,
  };
}

export async function listPostgresPreviewProjects(
  limit = 25
): Promise<PostgresPreviewProject[]> {
  const result = await queryPostgres<PostgresPreviewProject>(
    `
    SELECT
      project_id,
      legacy_project_id,
      project_name,
      primary_use_type_code,
      lifecycle_phase_code,
      country,
      region,
      electric_capacity_mwe,
      thermal_capacity_mwth,
      annual_heat_supply_gwhth,
      review_status_code,
      research_status
    FROM projects
    ORDER BY created_at DESC, project_name ASC
    LIMIT $1
    `,
    [limit]
  );

  return result.rows;
}

export async function listPostgresPreviewOperatingAssets(
  limit = 25
): Promise<PostgresPreviewOperatingAsset[]> {
  const result = await queryPostgres<PostgresPreviewOperatingAsset>(
    `
    SELECT
      operating_asset_id,
      legacy_plant_id,
      asset_name,
      primary_use_type_code,
      lifecycle_phase_code,
      country,
      region,
      electric_capacity_mwe,
      electric_capacity_running_mwe,
      thermal_capacity_mwth,
      annual_power_generation_gwhe,
      annual_heat_supply_gwhth,
      review_status_code,
      research_status
    FROM operating_assets
    ORDER BY created_at DESC, asset_name ASC
    LIMIT $1
    `,
    [limit]
  );

  return result.rows;
}

export async function listPostgresPreviewCompanies(
  limit = 25
): Promise<PostgresPreviewCompany[]> {
  const result = await queryPostgres<PostgresPreviewCompany>(
    `
    SELECT
      company_id,
      legacy_company_id,
      company_name,
      entity_type_code,
      company_type_primary_code,
      headquarters_country,
      geothermal_focus,
      review_status_code,
      research_status
    FROM companies
    ORDER BY created_at DESC, company_name ASC
    LIMIT $1
    `,
    [limit]
  );

  return result.rows;
}

function normalizeTimestamp(value: string | Date) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function toResearchOpsQueueItem(row: QueueItemRow): PostgresResearchOpsQueueItem {
  return {
    queue_key: row.queue_key,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    legacy_id: row.legacy_id,
    name: row.name,
    country: row.country,
    primary_use_type_code: row.primary_use_type_code,
    lifecycle_phase_code: row.lifecycle_phase_code,
    review_status_code: row.review_status_code,
    issue_label: row.issue_label,
    updated_at: normalizeTimestamp(row.updated_at),
  };
}

function toRecentEdit(row: RecentEditRow): PostgresResearchOpsRecentEdit {
  return {
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    legacy_id: row.legacy_id,
    name: row.name,
    country: row.country,
    primary_use_type_code: row.primary_use_type_code,
    lifecycle_phase_code: row.lifecycle_phase_code,
    review_status_code: row.review_status_code,
    updated_at: normalizeTimestamp(row.updated_at),
  };
}

async function loadResearchOpsQueue(
  definition: QueueDefinition,
  limit: number
): Promise<PostgresResearchOpsQueue> {
  const result = await queryPostgres<QueueItemRow>(
    `
    WITH queue AS (
      ${definition.sql}
    )
    SELECT
      queue_key,
      entity_type,
      entity_id,
      legacy_id,
      name,
      country,
      primary_use_type_code,
      lifecycle_phase_code,
      review_status_code,
      issue_label,
      updated_at,
      (COUNT(*) OVER())::int AS total_count
    FROM queue
    ORDER BY updated_at DESC NULLS LAST, name ASC
    LIMIT $1
    `,
    [limit]
  );

  return {
    key: definition.key,
    title: definition.title,
    severity: definition.severity,
    description: definition.description,
    count: result.rows[0]?.total_count ?? 0,
    items: result.rows.map(toResearchOpsQueueItem),
  };
}

export async function listPostgresResearchOpsRecentEdits(
  limit = 12
): Promise<PostgresResearchOpsRecentEdit[]> {
  const result = await queryPostgres<RecentEditRow>(
    `
    SELECT
      entity_type,
      entity_id,
      legacy_id,
      name,
      country,
      primary_use_type_code,
      lifecycle_phase_code,
      review_status_code,
      updated_at
    FROM (
      SELECT
        'project'::text AS entity_type,
        p.project_id::text AS entity_id,
        p.legacy_project_id AS legacy_id,
        p.project_name AS name,
        p.country,
        p.primary_use_type_code,
        p.lifecycle_phase_code,
        p.review_status_code,
        p.updated_at
      FROM projects p

      UNION ALL

      SELECT
        'operating_asset'::text AS entity_type,
        a.operating_asset_id::text AS entity_id,
        a.legacy_plant_id AS legacy_id,
        a.asset_name AS name,
        a.country,
        a.primary_use_type_code,
        a.lifecycle_phase_code,
        a.review_status_code,
        a.updated_at
      FROM operating_assets a

      UNION ALL

      SELECT
        'company'::text AS entity_type,
        c.company_id::text AS entity_id,
        c.legacy_company_id AS legacy_id,
        c.company_name AS name,
        c.headquarters_country AS country,
        c.company_type_primary_code AS primary_use_type_code,
        NULL::text AS lifecycle_phase_code,
        c.review_status_code,
        c.updated_at
      FROM companies c
    ) records
    ORDER BY updated_at DESC NULLS LAST, name ASC
    LIMIT $1
    `,
    [limit]
  );

  return result.rows.map(toRecentEdit);
}

export async function getPostgresResearchOpsDashboard(
  itemLimit = 8
): Promise<PostgresResearchOpsDashboard> {
  const [queues, recentEdits] = await Promise.all([
    Promise.all(
      researchOpsQueueDefinitions.map((definition) =>
        loadResearchOpsQueue(definition, itemLimit)
      )
    ),
    listPostgresResearchOpsRecentEdits(12),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      openIssues: queues.reduce((sum, queue) => sum + queue.count, 0),
      criticalIssues: queues
        .filter((queue) => queue.severity === "critical")
        .reduce((sum, queue) => sum + queue.count, 0),
      importantIssues: queues
        .filter((queue) => queue.severity === "important")
        .reduce((sum, queue) => sum + queue.count, 0),
      workflowIssues: queues
        .filter((queue) => queue.severity === "workflow")
        .reduce((sum, queue) => sum + queue.count, 0),
    },
    queues,
    recentEdits,
  };
}
