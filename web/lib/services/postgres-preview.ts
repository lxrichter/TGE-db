import { getPrismaClient } from "@/lib/db/prisma";

type NullableNumeric = number | string | { toNumber: () => number } | null;

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

export type PostgresEntitySourceLink = {
  entity_source_id: string;
  source_id: string;
  source_title: string | null;
  source_reference: string | null;
  source_type_label: string | null;
  visibility_code: string;
  credibility_status_code: string;
  linked_field: string | null;
  claim_text: string | null;
  extracted_value: string | null;
  confidence_status_code: string;
  is_primary_evidence: boolean;
  created_at: string;
  updated_at: string;
};

export type PostgresPreviewProjectDetail = PostgresPreviewProject & {
  project_group: string | null;
  location_text: string | null;
  wb_region: string | null;
  latitude: number | null;
  longitude: number | null;
  resource_type: string | null;
  resource_temp_c: number | null;
  potential_min_mwe: number | null;
  potential_max_mwe: number | null;
  annual_power_generation_gwhe: number | null;
  annual_cooling_supply_gwhc: number | null;
  capacity_estimate_status_code: string;
  output_estimate_status_code: string;
  start_dev_year: number | null;
  target_cod_year: number | null;
  target_cod_month: number | null;
  cod_raw: string | null;
  plant_technology: string | null;
  turbine_supplier: string | null;
  notes: string | null;
  source_count: number;
  created_at: string;
  updated_at: string;
  sources: PostgresEntitySourceLink[];
};

export type PostgresPreviewOperatingAssetDetail = PostgresPreviewOperatingAsset & {
  project_group: string | null;
  location_text: string | null;
  wb_region: string | null;
  latitude: number | null;
  longitude: number | null;
  resource_type: string | null;
  resource_temp_c: number | null;
  potential_min_mwe: number | null;
  potential_max_mwe: number | null;
  annual_cooling_supply_gwhc: number | null;
  capacity_estimate_status_code: string;
  output_estimate_status_code: string;
  start_dev_year: number | null;
  cod_year: number | null;
  cod_month: number | null;
  cod_raw: string | null;
  number_of_units: string | null;
  plant_technology: string | null;
  turbine_supplier: string | null;
  promoted_from_project_id: string | null;
  notes: string | null;
  source_count: number;
  created_at: string;
  updated_at: string;
  sources: PostgresEntitySourceLink[];
};

export type PostgresPreviewCompanyDetail = PostgresPreviewCompany & {
  company_name_short: string | null;
  company_legal_name: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  ownership_type: string | null;
  company_status: string | null;
  headquarters_city: string | null;
  region: string | null;
  wb_region: string | null;
  technology_focus: string | null;
  service_scope_summary: string | null;
  operating_markets_summary: string | null;
  notes: string | null;
  source_count: number;
  created_at: string;
  updated_at: string;
  sources: PostgresEntitySourceLink[];
};

export type PostgresReferenceOption = {
  code: string;
  label: string;
  sort_order: number;
  is_active: boolean;
};

export type PostgresEntityFormReferenceData = {
  useTypes: PostgresReferenceOption[];
  lifecyclePhases: Array<
    PostgresReferenceOption & {
      is_operating: boolean;
    }
  >;
  reviewStatuses: Array<
    PostgresReferenceOption & {
      is_terminal: boolean;
    }
  >;
  estimateStatuses: PostgresReferenceOption[];
  companyEntityTypes: PostgresReferenceOption[];
  companyPrimaryTypes: PostgresReferenceOption[];
};

export type PostgresProjectMutationInput = {
  project_name: string;
  project_group?: string | null;
  primary_use_type_code: string;
  lifecycle_phase_code: string;
  location_text?: string | null;
  country?: string | null;
  region?: string | null;
  wb_region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  resource_type?: string | null;
  resource_temp_c?: number | null;
  potential_min_mwe?: number | null;
  potential_max_mwe?: number | null;
  electric_capacity_mwe?: number | null;
  thermal_capacity_mwth?: number | null;
  annual_power_generation_gwhe?: number | null;
  annual_heat_supply_gwhth?: number | null;
  annual_cooling_supply_gwhc?: number | null;
  capacity_estimate_status_code: string;
  output_estimate_status_code: string;
  start_dev_year?: number | null;
  target_cod_year?: number | null;
  target_cod_month?: number | null;
  cod_raw?: string | null;
  plant_technology?: string | null;
  turbine_supplier?: string | null;
  review_status_code: string;
  research_status?: string | null;
  notes?: string | null;
};

export type PostgresOperatingAssetMutationInput = {
  asset_name: string;
  project_group?: string | null;
  primary_use_type_code: string;
  lifecycle_phase_code: string;
  location_text?: string | null;
  country?: string | null;
  region?: string | null;
  wb_region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  resource_type?: string | null;
  resource_temp_c?: number | null;
  potential_min_mwe?: number | null;
  potential_max_mwe?: number | null;
  electric_capacity_mwe?: number | null;
  electric_capacity_running_mwe?: number | null;
  thermal_capacity_mwth?: number | null;
  annual_power_generation_gwhe?: number | null;
  annual_heat_supply_gwhth?: number | null;
  annual_cooling_supply_gwhc?: number | null;
  capacity_estimate_status_code: string;
  output_estimate_status_code: string;
  start_dev_year?: number | null;
  cod_year?: number | null;
  cod_month?: number | null;
  cod_raw?: string | null;
  number_of_units?: string | null;
  plant_technology?: string | null;
  turbine_supplier?: string | null;
  review_status_code: string;
  research_status?: string | null;
  notes?: string | null;
};

export type PostgresCompanyMutationInput = {
  company_name: string;
  company_name_short?: string | null;
  company_legal_name?: string | null;
  website_url?: string | null;
  linkedin_url?: string | null;
  entity_type_code?: string | null;
  company_type_primary_code?: string | null;
  ownership_type?: string | null;
  company_status?: string | null;
  headquarters_city?: string | null;
  headquarters_country?: string | null;
  region?: string | null;
  wb_region?: string | null;
  geothermal_focus?: string | null;
  technology_focus?: string | null;
  service_scope_summary?: string | null;
  operating_markets_summary?: string | null;
  review_status_code: string;
  research_status?: string | null;
  notes?: string | null;
};

export type PostgresCompanyOption = {
  company_id: string;
  company_name: string;
  legacy_company_id: string | null;
  headquarters_country: string | null;
};

export type PostgresProjectOption = {
  project_id: string;
  project_name: string;
  legacy_project_id: string | null;
  country: string | null;
};

export type PostgresOperatingAssetOption = {
  operating_asset_id: string;
  asset_name: string;
  legacy_plant_id: string | null;
  country: string | null;
};

export type PostgresCompanyRelationshipReferenceData = {
  companyRoles: Array<
    PostgresReferenceOption & {
      role_group: string;
      description: string | null;
    }
  >;
  relationshipTypes: PostgresReferenceOption[];
  companies: PostgresCompanyOption[];
  projects: PostgresProjectOption[];
  operatingAssets: PostgresOperatingAssetOption[];
};

export type PostgresCompanyProjectLink = {
  company_project_link_id: string;
  company_id: string;
  company_name: string;
  legacy_company_id: string | null;
  project_id: string;
  project_name: string;
  legacy_project_id: string | null;
  country: string | null;
  role_code: string;
  role_label: string | null;
  role_group: string | null;
  role_detail: string | null;
  ownership_share: number | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PostgresCompanyOperatingAssetLink = {
  company_operating_asset_link_id: string;
  company_id: string;
  company_name: string;
  legacy_company_id: string | null;
  operating_asset_id: string;
  asset_name: string;
  legacy_plant_id: string | null;
  country: string | null;
  role_code: string;
  role_label: string | null;
  role_group: string | null;
  role_detail: string | null;
  ownership_share: number | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PostgresCompanyRelationship = {
  company_relationship_id: string;
  company_id_from: string;
  company_name_from: string;
  company_id_to: string;
  company_name_to: string;
  relationship_type_code: string;
  relationship_type_label: string | null;
  ownership_percentage: number | null;
  is_current: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PostgresCompanyProjectLinkMutationInput = {
  company_id: string;
  project_id: string;
  role_code: string;
  role_detail?: string | null;
  ownership_share?: number | null;
  is_primary?: boolean;
  notes?: string | null;
};

export type PostgresCompanyOperatingAssetLinkMutationInput = {
  company_id: string;
  operating_asset_id: string;
  role_code: string;
  role_detail?: string | null;
  ownership_share?: number | null;
  is_primary?: boolean;
  notes?: string | null;
};

export type PostgresCompanyRelationshipMutationInput = {
  company_id_from: string;
  company_id_to: string;
  relationship_type_code: string;
  ownership_percentage?: number | null;
  is_current?: boolean;
  notes?: string | null;
};

export type ResearchOpsQueueSeverity = "critical" | "important" | "workflow";

export type ResearchOpsQueueKey =
  | "needs_source"
  | "source_needs_review"
  | "weak_or_outdated_source"
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
  entity_type: "project" | "operating_asset" | "company" | "source";
  entity_id: string;
  legacy_id: string | null;
  name: string;
  country: string | null;
  primary_use_type_code: string | null;
  lifecycle_phase_code: string | null;
  review_status_code: string | null;
  issue_label: string;
  last_updated_by_name: string | null;
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
  entity_type: "project" | "operating_asset" | "company" | "source";
  entity_id: string;
  legacy_id: string | null;
  name: string;
  country: string | null;
  primary_use_type_code: string | null;
  lifecycle_phase_code: string | null;
  review_status_code: string | null;
  last_updated_by_name: string | null;
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

type PostgresEntitySourceLinkRow = Omit<
  PostgresEntitySourceLink,
  "created_at" | "updated_at"
> & {
  created_at: string | Date;
  updated_at: string | Date;
};

type ProjectDetailRow = Omit<
  PostgresPreviewProjectDetail,
  | "electric_capacity_mwe"
  | "thermal_capacity_mwth"
  | "annual_heat_supply_gwhth"
  | "latitude"
  | "longitude"
  | "resource_temp_c"
  | "potential_min_mwe"
  | "potential_max_mwe"
  | "annual_power_generation_gwhe"
  | "annual_cooling_supply_gwhc"
  | "created_at"
  | "updated_at"
  | "sources"
> & {
  electric_capacity_mwe: NullableNumeric;
  thermal_capacity_mwth: NullableNumeric;
  annual_heat_supply_gwhth: NullableNumeric;
  latitude: NullableNumeric;
  longitude: NullableNumeric;
  resource_temp_c: NullableNumeric;
  potential_min_mwe: NullableNumeric;
  potential_max_mwe: NullableNumeric;
  annual_power_generation_gwhe: NullableNumeric;
  annual_cooling_supply_gwhc: NullableNumeric;
  created_at: string | Date;
  updated_at: string | Date;
};

type OperatingAssetDetailRow = Omit<
  PostgresPreviewOperatingAssetDetail,
  | "electric_capacity_mwe"
  | "electric_capacity_running_mwe"
  | "thermal_capacity_mwth"
  | "annual_power_generation_gwhe"
  | "annual_heat_supply_gwhth"
  | "latitude"
  | "longitude"
  | "resource_temp_c"
  | "potential_min_mwe"
  | "potential_max_mwe"
  | "annual_cooling_supply_gwhc"
  | "created_at"
  | "updated_at"
  | "sources"
> & {
  electric_capacity_mwe: NullableNumeric;
  electric_capacity_running_mwe: NullableNumeric;
  thermal_capacity_mwth: NullableNumeric;
  annual_power_generation_gwhe: NullableNumeric;
  annual_heat_supply_gwhth: NullableNumeric;
  latitude: NullableNumeric;
  longitude: NullableNumeric;
  resource_temp_c: NullableNumeric;
  potential_min_mwe: NullableNumeric;
  potential_max_mwe: NullableNumeric;
  annual_cooling_supply_gwhc: NullableNumeric;
  created_at: string | Date;
  updated_at: string | Date;
};

type CompanyDetailRow = Omit<
  PostgresPreviewCompanyDetail,
  "created_at" | "updated_at" | "sources"
> & {
  created_at: string | Date;
  updated_at: string | Date;
};

type CompanyProjectLinkRow = Omit<
  PostgresCompanyProjectLink,
  "ownership_share" | "created_at" | "updated_at"
> & {
  ownership_share: NullableNumeric;
  created_at: string | Date;
  updated_at: string | Date;
};

type CompanyOperatingAssetLinkRow = Omit<
  PostgresCompanyOperatingAssetLink,
  "ownership_share" | "created_at" | "updated_at"
> & {
  ownership_share: NullableNumeric;
  created_at: string | Date;
  updated_at: string | Date;
};

type CompanyRelationshipRow = Omit<
  PostgresCompanyRelationship,
  "ownership_percentage" | "created_at" | "updated_at"
> & {
  ownership_percentage: NullableNumeric;
  created_at: string | Date;
  updated_at: string | Date;
};

type CompanyProjectLinkIdRow = {
  company_project_link_id: string;
};

type CompanyOperatingAssetLinkIdRow = {
  company_operating_asset_link_id: string;
};

type CompanyRelationshipIdRow = {
  company_relationship_id: string;
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
    key: "source_needs_review",
    title: "Source Needs Review",
    severity: "workflow",
    description: "Source records added to the evidence backbone but not yet validated.",
    sql: `
      SELECT
        'source_needs_review'::text AS queue_key,
        'source'::text AS entity_type,
        s.source_id::text AS entity_id,
        s.source_reference AS legacy_id,
        COALESCE(NULLIF(s.title, ''), NULLIF(s.url, ''), s.source_id::text) AS name,
        s.country,
        s.source_type_code AS primary_use_type_code,
        NULL::text AS lifecycle_phase_code,
        s.credibility_status_code AS review_status_code,
        'Source credibility status is needs_review'::text AS issue_label,
        s.updated_at
      FROM sources s
      WHERE s.credibility_status_code = 'needs_review'
    `,
  },
  {
    key: "weak_or_outdated_source",
    title: "Weak / Outdated Source",
    severity: "important",
    description: "Source records marked weak, outdated, rejected, or duplicate-suspected.",
    sql: `
      SELECT
        'weak_or_outdated_source'::text AS queue_key,
        'source'::text AS entity_type,
        s.source_id::text AS entity_id,
        s.source_reference AS legacy_id,
        COALESCE(NULLIF(s.title, ''), NULLIF(s.url, ''), s.source_id::text) AS name,
        s.country,
        s.source_type_code AS primary_use_type_code,
        NULL::text AS lifecycle_phase_code,
        s.credibility_status_code AS review_status_code,
        CASE
          WHEN s.duplicate_source_flag THEN 'Source duplicate flag is set'
          ELSE 'Source credibility status is ' || s.credibility_status_code
        END::text AS issue_label,
        s.updated_at
      FROM sources s
      WHERE s.credibility_status_code IN ('weak', 'outdated', 'rejected')
        OR s.duplicate_source_flag = TRUE
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
  const prisma = getPrismaClient();
  const [
    projectCount,
    operatingAssetCount,
    companyCount,
    directUseComponentCount,
    companyProjectLinkCount,
    companyAssetLinkCount,
  ] = await prisma.$transaction([
    prisma.projects.count(),
    prisma.operating_assets.count(),
    prisma.companies.count(),
    prisma.asset_use_components.count(),
    prisma.company_project_links.count(),
    prisma.company_operating_asset_links.count(),
  ]);

  return {
    projectCount,
    operatingAssetCount,
    companyCount,
    directUseComponentCount,
    companyProjectLinkCount,
    companyAssetLinkCount,
  };
}

function toNullableNumber(value: NullableNumeric): number | null {
  if (value === null) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return value.toNumber();
}

export async function listPostgresPreviewProjects(
  limit = 25
): Promise<PostgresPreviewProject[]> {
  const rows = await getPrismaClient().projects.findMany({
    select: {
      project_id: true,
      legacy_project_id: true,
      project_name: true,
      primary_use_type_code: true,
      lifecycle_phase_code: true,
      country: true,
      region: true,
      electric_capacity_mwe: true,
      thermal_capacity_mwth: true,
      annual_heat_supply_gwhth: true,
      review_status_code: true,
      research_status: true,
    },
    orderBy: [{ created_at: "desc" }, { project_name: "asc" }],
    take: limit,
  });

  return rows.map((row) => ({
    ...row,
    electric_capacity_mwe: toNullableNumber(row.electric_capacity_mwe),
    thermal_capacity_mwth: toNullableNumber(row.thermal_capacity_mwth),
    annual_heat_supply_gwhth: toNullableNumber(row.annual_heat_supply_gwhth),
  }));
}

export async function listPostgresPreviewOperatingAssets(
  limit = 25
): Promise<PostgresPreviewOperatingAsset[]> {
  const rows = await getPrismaClient().operating_assets.findMany({
    select: {
      operating_asset_id: true,
      legacy_plant_id: true,
      asset_name: true,
      primary_use_type_code: true,
      lifecycle_phase_code: true,
      country: true,
      region: true,
      electric_capacity_mwe: true,
      electric_capacity_running_mwe: true,
      thermal_capacity_mwth: true,
      annual_power_generation_gwhe: true,
      annual_heat_supply_gwhth: true,
      review_status_code: true,
      research_status: true,
    },
    orderBy: [{ created_at: "desc" }, { asset_name: "asc" }],
    take: limit,
  });

  return rows.map((row) => ({
    ...row,
    electric_capacity_mwe: toNullableNumber(row.electric_capacity_mwe),
    electric_capacity_running_mwe: toNullableNumber(
      row.electric_capacity_running_mwe
    ),
    thermal_capacity_mwth: toNullableNumber(row.thermal_capacity_mwth),
    annual_power_generation_gwhe: toNullableNumber(
      row.annual_power_generation_gwhe
    ),
    annual_heat_supply_gwhth: toNullableNumber(row.annual_heat_supply_gwhth),
  }));
}

export async function listPostgresPreviewCompanies(
  limit = 25
): Promise<PostgresPreviewCompany[]> {
  return getPrismaClient().companies.findMany({
    select: {
      company_id: true,
      legacy_company_id: true,
      company_name: true,
      entity_type_code: true,
      company_type_primary_code: true,
      headquarters_country: true,
      geothermal_focus: true,
      review_status_code: true,
      research_status: true,
    },
    orderBy: [{ created_at: "desc" }, { company_name: "asc" }],
    take: limit,
  });
}

function cleanOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function normalizeEntityNameClean(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isApprovedStatus(status: string) {
  return status === "approved" || status === "export_ready";
}

function getReviewTimestampFields(reviewStatusCode: string) {
  if (!isApprovedStatus(reviewStatusCode)) {
    return {};
  }

  return {
    approved_at: new Date(),
    export_ready_at: reviewStatusCode === "export_ready" ? new Date() : undefined,
  };
}

function getPreservedReviewTimestampFields(
  reviewStatusCode: string,
  existing: { approved_at: Date | null; export_ready_at: Date | null }
) {
  if (!isApprovedStatus(reviewStatusCode)) {
    return {};
  }

  return {
    approved_at: existing.approved_at ?? new Date(),
    export_ready_at:
      reviewStatusCode === "export_ready"
        ? existing.export_ready_at ?? new Date()
        : existing.export_ready_at,
  };
}

function deriveUpdatedReviewStatus(current: string, requested: string) {
  if (
    isApprovedStatus(current) &&
    (requested === "draft" || requested === "validation")
  ) {
    return "needs_update";
  }

  return requested;
}

export async function getPostgresEntityFormReferenceData(): Promise<PostgresEntityFormReferenceData> {
  const prisma = getPrismaClient();
  const [
    useTypes,
    lifecyclePhases,
    reviewStatuses,
    estimateStatuses,
    companyEntityTypes,
    companyPrimaryTypes,
  ] = await Promise.all([
    prisma.ref_geothermal_use_types.findMany({
      select: { code: true, label: true, sort_order: true, is_active: true },
      where: { is_active: true },
      orderBy: [{ sort_order: "asc" }, { label: "asc" }],
    }),
    prisma.ref_lifecycle_phases.findMany({
      select: {
        code: true,
        label: true,
        sort_order: true,
        is_active: true,
        is_operating: true,
      },
      where: { is_active: true },
      orderBy: [{ sort_order: "asc" }, { label: "asc" }],
    }),
    prisma.ref_review_statuses.findMany({
      select: {
        code: true,
        label: true,
        sort_order: true,
        is_active: true,
        is_terminal: true,
      },
      where: { is_active: true },
      orderBy: [{ sort_order: "asc" }, { label: "asc" }],
    }),
    prisma.ref_estimate_statuses.findMany({
      select: { code: true, label: true, sort_order: true, is_active: true },
      where: { is_active: true },
      orderBy: [{ sort_order: "asc" }, { label: "asc" }],
    }),
    prisma.ref_company_entity_types.findMany({
      select: { code: true, label: true, sort_order: true, is_active: true },
      where: { is_active: true },
      orderBy: [{ sort_order: "asc" }, { label: "asc" }],
    }),
    prisma.ref_company_primary_types.findMany({
      select: { code: true, label: true, sort_order: true, is_active: true },
      where: { is_active: true },
      orderBy: [{ sort_order: "asc" }, { label: "asc" }],
    }),
  ]);

  return {
    useTypes,
    lifecyclePhases,
    reviewStatuses,
    estimateStatuses,
    companyEntityTypes,
    companyPrimaryTypes,
  };
}

export async function getPostgresCompanyRelationshipReferenceData(
  limit = 500
): Promise<PostgresCompanyRelationshipReferenceData> {
  const prisma = getPrismaClient();
  const [
    companyRoles,
    relationshipTypes,
    companies,
    projects,
    operatingAssets,
  ] = await Promise.all([
    prisma.ref_company_roles.findMany({
      select: {
        code: true,
        label: true,
        role_group: true,
        description: true,
        sort_order: true,
        is_active: true,
      },
      where: { is_active: true },
      orderBy: [{ sort_order: "asc" }, { label: "asc" }],
    }),
    prisma.ref_company_relationship_types.findMany({
      select: { code: true, label: true, sort_order: true, is_active: true },
      where: { is_active: true },
      orderBy: [{ sort_order: "asc" }, { label: "asc" }],
    }),
    prisma.companies.findMany({
      select: {
        company_id: true,
        company_name: true,
        legacy_company_id: true,
        headquarters_country: true,
      },
      orderBy: [{ company_name: "asc" }],
      take: limit,
    }),
    prisma.projects.findMany({
      select: {
        project_id: true,
        project_name: true,
        legacy_project_id: true,
        country: true,
      },
      orderBy: [{ project_name: "asc" }],
      take: limit,
    }),
    prisma.operating_assets.findMany({
      select: {
        operating_asset_id: true,
        asset_name: true,
        legacy_plant_id: true,
        country: true,
      },
      orderBy: [{ asset_name: "asc" }],
      take: limit,
    }),
  ]);

  return {
    companyRoles,
    relationshipTypes,
    companies,
    projects,
    operatingAssets,
  };
}

function toCompanyProjectLink(
  row: CompanyProjectLinkRow
): PostgresCompanyProjectLink {
  return {
    ...row,
    ownership_share: toNullableNumber(row.ownership_share),
    created_at: normalizeTimestamp(row.created_at),
    updated_at: normalizeTimestamp(row.updated_at),
  };
}

function toCompanyOperatingAssetLink(
  row: CompanyOperatingAssetLinkRow
): PostgresCompanyOperatingAssetLink {
  return {
    ...row,
    ownership_share: toNullableNumber(row.ownership_share),
    created_at: normalizeTimestamp(row.created_at),
    updated_at: normalizeTimestamp(row.updated_at),
  };
}

function toCompanyRelationship(
  row: CompanyRelationshipRow
): PostgresCompanyRelationship {
  return {
    ...row,
    ownership_percentage: toNullableNumber(row.ownership_percentage),
    created_at: normalizeTimestamp(row.created_at),
    updated_at: normalizeTimestamp(row.updated_at),
  };
}

async function getPostgresCompanyProjectLinkById(
  companyProjectLinkId: string
): Promise<PostgresCompanyProjectLink | null> {
  const rows = await getPrismaClient().$queryRawUnsafe<CompanyProjectLinkRow[]>(
    `
    SELECT
      cpl.company_project_link_id::text,
      cpl.company_id::text,
      c.company_name,
      c.legacy_company_id,
      cpl.project_id::text,
      p.project_name,
      p.legacy_project_id,
      p.country,
      cpl.role_code,
      role.label AS role_label,
      role.role_group,
      cpl.role_detail,
      cpl.ownership_share,
      cpl.is_primary,
      cpl.notes,
      cpl.created_at,
      cpl.updated_at
    FROM company_project_links cpl
    INNER JOIN companies c
      ON c.company_id = cpl.company_id
    INNER JOIN projects p
      ON p.project_id = cpl.project_id
    LEFT JOIN ref_company_roles role
      ON role.code = cpl.role_code
    WHERE cpl.company_project_link_id = $1::uuid
    LIMIT 1
    `,
    companyProjectLinkId
  );

  return rows[0] ? toCompanyProjectLink(rows[0]) : null;
}

async function getPostgresCompanyOperatingAssetLinkById(
  companyOperatingAssetLinkId: string
): Promise<PostgresCompanyOperatingAssetLink | null> {
  const rows = await getPrismaClient().$queryRawUnsafe<
    CompanyOperatingAssetLinkRow[]
  >(
    `
    SELECT
      coal.company_operating_asset_link_id::text,
      coal.company_id::text,
      c.company_name,
      c.legacy_company_id,
      coal.operating_asset_id::text,
      a.asset_name,
      a.legacy_plant_id,
      a.country,
      coal.role_code,
      role.label AS role_label,
      role.role_group,
      coal.role_detail,
      coal.ownership_share,
      coal.is_primary,
      coal.notes,
      coal.created_at,
      coal.updated_at
    FROM company_operating_asset_links coal
    INNER JOIN companies c
      ON c.company_id = coal.company_id
    INNER JOIN operating_assets a
      ON a.operating_asset_id = coal.operating_asset_id
    LEFT JOIN ref_company_roles role
      ON role.code = coal.role_code
    WHERE coal.company_operating_asset_link_id = $1::uuid
    LIMIT 1
    `,
    companyOperatingAssetLinkId
  );

  return rows[0] ? toCompanyOperatingAssetLink(rows[0]) : null;
}

async function getPostgresCompanyRelationshipById(
  companyRelationshipId: string
): Promise<PostgresCompanyRelationship | null> {
  const rows = await getPrismaClient().$queryRawUnsafe<CompanyRelationshipRow[]>(
    `
    SELECT
      cr.company_relationship_id::text,
      cr.company_id_from::text,
      cfrom.company_name AS company_name_from,
      cr.company_id_to::text,
      cto.company_name AS company_name_to,
      cr.relationship_type_code,
      rt.label AS relationship_type_label,
      cr.ownership_percentage,
      cr.is_current,
      cr.notes,
      cr.created_at,
      cr.updated_at
    FROM company_relationships cr
    INNER JOIN companies cfrom
      ON cfrom.company_id = cr.company_id_from
    INNER JOIN companies cto
      ON cto.company_id = cr.company_id_to
    LEFT JOIN ref_company_relationship_types rt
      ON rt.code = cr.relationship_type_code
    WHERE cr.company_relationship_id = $1::uuid
    LIMIT 1
    `,
    companyRelationshipId
  );

  return rows[0] ? toCompanyRelationship(rows[0]) : null;
}

export async function listPostgresProjectCompanyLinks(
  projectId: string
): Promise<PostgresCompanyProjectLink[]> {
  const rows = await getPrismaClient().$queryRawUnsafe<CompanyProjectLinkRow[]>(
    `
    SELECT
      cpl.company_project_link_id::text,
      cpl.company_id::text,
      c.company_name,
      c.legacy_company_id,
      cpl.project_id::text,
      p.project_name,
      p.legacy_project_id,
      p.country,
      cpl.role_code,
      role.label AS role_label,
      role.role_group,
      cpl.role_detail,
      cpl.ownership_share,
      cpl.is_primary,
      cpl.notes,
      cpl.created_at,
      cpl.updated_at
    FROM company_project_links cpl
    INNER JOIN companies c
      ON c.company_id = cpl.company_id
    INNER JOIN projects p
      ON p.project_id = cpl.project_id
    LEFT JOIN ref_company_roles role
      ON role.code = cpl.role_code
    WHERE cpl.project_id = $1::uuid
    ORDER BY cpl.is_primary DESC, role.sort_order ASC NULLS LAST, c.company_name ASC
    `,
    projectId
  );

  return rows.map(toCompanyProjectLink);
}

export async function listPostgresCompanyProjectLinks(
  companyId: string
): Promise<PostgresCompanyProjectLink[]> {
  const rows = await getPrismaClient().$queryRawUnsafe<CompanyProjectLinkRow[]>(
    `
    SELECT
      cpl.company_project_link_id::text,
      cpl.company_id::text,
      c.company_name,
      c.legacy_company_id,
      cpl.project_id::text,
      p.project_name,
      p.legacy_project_id,
      p.country,
      cpl.role_code,
      role.label AS role_label,
      role.role_group,
      cpl.role_detail,
      cpl.ownership_share,
      cpl.is_primary,
      cpl.notes,
      cpl.created_at,
      cpl.updated_at
    FROM company_project_links cpl
    INNER JOIN companies c
      ON c.company_id = cpl.company_id
    INNER JOIN projects p
      ON p.project_id = cpl.project_id
    LEFT JOIN ref_company_roles role
      ON role.code = cpl.role_code
    WHERE cpl.company_id = $1::uuid
    ORDER BY cpl.is_primary DESC, p.project_name ASC, role.sort_order ASC NULLS LAST
    `,
    companyId
  );

  return rows.map(toCompanyProjectLink);
}

export async function listPostgresOperatingAssetCompanyLinks(
  operatingAssetId: string
): Promise<PostgresCompanyOperatingAssetLink[]> {
  const rows = await getPrismaClient().$queryRawUnsafe<
    CompanyOperatingAssetLinkRow[]
  >(
    `
    SELECT
      coal.company_operating_asset_link_id::text,
      coal.company_id::text,
      c.company_name,
      c.legacy_company_id,
      coal.operating_asset_id::text,
      a.asset_name,
      a.legacy_plant_id,
      a.country,
      coal.role_code,
      role.label AS role_label,
      role.role_group,
      coal.role_detail,
      coal.ownership_share,
      coal.is_primary,
      coal.notes,
      coal.created_at,
      coal.updated_at
    FROM company_operating_asset_links coal
    INNER JOIN companies c
      ON c.company_id = coal.company_id
    INNER JOIN operating_assets a
      ON a.operating_asset_id = coal.operating_asset_id
    LEFT JOIN ref_company_roles role
      ON role.code = coal.role_code
    WHERE coal.operating_asset_id = $1::uuid
    ORDER BY coal.is_primary DESC, role.sort_order ASC NULLS LAST, c.company_name ASC
    `,
    operatingAssetId
  );

  return rows.map(toCompanyOperatingAssetLink);
}

export async function listPostgresCompanyOperatingAssetLinks(
  companyId: string
): Promise<PostgresCompanyOperatingAssetLink[]> {
  const rows = await getPrismaClient().$queryRawUnsafe<
    CompanyOperatingAssetLinkRow[]
  >(
    `
    SELECT
      coal.company_operating_asset_link_id::text,
      coal.company_id::text,
      c.company_name,
      c.legacy_company_id,
      coal.operating_asset_id::text,
      a.asset_name,
      a.legacy_plant_id,
      a.country,
      coal.role_code,
      role.label AS role_label,
      role.role_group,
      coal.role_detail,
      coal.ownership_share,
      coal.is_primary,
      coal.notes,
      coal.created_at,
      coal.updated_at
    FROM company_operating_asset_links coal
    INNER JOIN companies c
      ON c.company_id = coal.company_id
    INNER JOIN operating_assets a
      ON a.operating_asset_id = coal.operating_asset_id
    LEFT JOIN ref_company_roles role
      ON role.code = coal.role_code
    WHERE coal.company_id = $1::uuid
    ORDER BY coal.is_primary DESC, a.asset_name ASC, role.sort_order ASC NULLS LAST
    `,
    companyId
  );

  return rows.map(toCompanyOperatingAssetLink);
}

export async function listPostgresCompanyRelationships(
  companyId: string
): Promise<PostgresCompanyRelationship[]> {
  const rows = await getPrismaClient().$queryRawUnsafe<CompanyRelationshipRow[]>(
    `
    SELECT
      cr.company_relationship_id::text,
      cr.company_id_from::text,
      cfrom.company_name AS company_name_from,
      cr.company_id_to::text,
      cto.company_name AS company_name_to,
      cr.relationship_type_code,
      rt.label AS relationship_type_label,
      cr.ownership_percentage,
      cr.is_current,
      cr.notes,
      cr.created_at,
      cr.updated_at
    FROM company_relationships cr
    INNER JOIN companies cfrom
      ON cfrom.company_id = cr.company_id_from
    INNER JOIN companies cto
      ON cto.company_id = cr.company_id_to
    LEFT JOIN ref_company_relationship_types rt
      ON rt.code = cr.relationship_type_code
    WHERE cr.company_id_from = $1::uuid
       OR cr.company_id_to = $1::uuid
    ORDER BY cr.is_current DESC, cr.updated_at DESC, cfrom.company_name ASC
    `,
    companyId
  );

  return rows.map(toCompanyRelationship);
}

export async function createPostgresCompanyProjectLink(
  input: PostgresCompanyProjectLinkMutationInput
): Promise<PostgresCompanyProjectLink> {
  const rows = await getPrismaClient().$queryRawUnsafe<CompanyProjectLinkIdRow[]>(
    `
    INSERT INTO company_project_links (
      company_id,
      project_id,
      role_code,
      role_detail,
      ownership_share,
      is_primary,
      notes
    )
    VALUES ($1::uuid, $2::uuid, $3, $4, $5::numeric, $6, $7)
    ON CONFLICT (company_id, project_id, role_code)
    DO UPDATE SET
      role_detail = EXCLUDED.role_detail,
      ownership_share = EXCLUDED.ownership_share,
      is_primary = EXCLUDED.is_primary,
      notes = EXCLUDED.notes,
      updated_at = now()
    RETURNING company_project_link_id::text
    `,
    input.company_id,
    input.project_id,
    input.role_code,
    cleanOptionalText(input.role_detail),
    input.ownership_share ?? null,
    Boolean(input.is_primary),
    cleanOptionalText(input.notes)
  );

  const link = await getPostgresCompanyProjectLinkById(
    rows[0].company_project_link_id
  );

  if (!link) {
    throw new Error("Created company-project link could not be reloaded.");
  }

  return link;
}

export async function createPostgresCompanyOperatingAssetLink(
  input: PostgresCompanyOperatingAssetLinkMutationInput
): Promise<PostgresCompanyOperatingAssetLink> {
  const rows = await getPrismaClient().$queryRawUnsafe<
    CompanyOperatingAssetLinkIdRow[]
  >(
    `
    INSERT INTO company_operating_asset_links (
      company_id,
      operating_asset_id,
      role_code,
      role_detail,
      ownership_share,
      is_primary,
      notes
    )
    VALUES ($1::uuid, $2::uuid, $3, $4, $5::numeric, $6, $7)
    ON CONFLICT (company_id, operating_asset_id, role_code)
    DO UPDATE SET
      role_detail = EXCLUDED.role_detail,
      ownership_share = EXCLUDED.ownership_share,
      is_primary = EXCLUDED.is_primary,
      notes = EXCLUDED.notes,
      updated_at = now()
    RETURNING company_operating_asset_link_id::text
    `,
    input.company_id,
    input.operating_asset_id,
    input.role_code,
    cleanOptionalText(input.role_detail),
    input.ownership_share ?? null,
    Boolean(input.is_primary),
    cleanOptionalText(input.notes)
  );

  const link = await getPostgresCompanyOperatingAssetLinkById(
    rows[0].company_operating_asset_link_id
  );

  if (!link) {
    throw new Error("Created company-asset link could not be reloaded.");
  }

  return link;
}

export async function createPostgresCompanyRelationship(
  input: PostgresCompanyRelationshipMutationInput
): Promise<PostgresCompanyRelationship> {
  const existingRows = await getPrismaClient().$queryRawUnsafe<
    CompanyRelationshipIdRow[]
  >(
    `
    SELECT company_relationship_id::text
    FROM company_relationships
    WHERE company_id_from = $1::uuid
      AND company_id_to = $2::uuid
      AND relationship_type_code = $3
    LIMIT 1
    `,
    input.company_id_from,
    input.company_id_to,
    input.relationship_type_code
  );

  if (existingRows[0]) {
    await getPrismaClient().$queryRawUnsafe(
      `
      UPDATE company_relationships
      SET
        ownership_percentage = $2::numeric,
        is_current = $3,
        notes = $4,
        updated_at = now()
      WHERE company_relationship_id = $1::uuid
      `,
      existingRows[0].company_relationship_id,
      input.ownership_percentage ?? null,
      input.is_current ?? true,
      cleanOptionalText(input.notes)
    );

    const relationship = await getPostgresCompanyRelationshipById(
      existingRows[0].company_relationship_id
    );

    if (!relationship) {
      throw new Error("Updated company relationship could not be reloaded.");
    }

    return relationship;
  }

  const rows = await getPrismaClient().$queryRawUnsafe<CompanyRelationshipIdRow[]>(
    `
    INSERT INTO company_relationships (
      company_id_from,
      company_id_to,
      relationship_type_code,
      ownership_percentage,
      is_current,
      notes
    )
    VALUES ($1::uuid, $2::uuid, $3, $4::numeric, $5, $6)
    RETURNING company_relationship_id::text
    `,
    input.company_id_from,
    input.company_id_to,
    input.relationship_type_code,
    input.ownership_percentage ?? null,
    input.is_current ?? true,
    cleanOptionalText(input.notes)
  );

  const relationship = await getPostgresCompanyRelationshipById(
    rows[0].company_relationship_id
  );

  if (!relationship) {
    throw new Error("Created company relationship could not be reloaded.");
  }

  return relationship;
}

export async function deletePostgresCompanyProjectLink(
  companyProjectLinkId: string
) {
  const result = await getPrismaClient().company_project_links.deleteMany({
    where: { company_project_link_id: companyProjectLinkId },
  });

  return result.count > 0;
}

export async function deletePostgresCompanyOperatingAssetLink(
  companyOperatingAssetLinkId: string
) {
  const result = await getPrismaClient().company_operating_asset_links.deleteMany({
    where: { company_operating_asset_link_id: companyOperatingAssetLinkId },
  });

  return result.count > 0;
}

export async function deletePostgresCompanyRelationship(
  companyRelationshipId: string
) {
  const result = await getPrismaClient().company_relationships.deleteMany({
    where: { company_relationship_id: companyRelationshipId },
  });

  return result.count > 0;
}

export async function createPostgresPreviewProject(
  input: PostgresProjectMutationInput
): Promise<PostgresPreviewProjectDetail> {
  const project = await getPrismaClient().projects.create({
    data: {
      project_name: input.project_name,
      project_name_clean: normalizeEntityNameClean(input.project_name),
      project_group: cleanOptionalText(input.project_group),
      primary_use_type_code: input.primary_use_type_code,
      lifecycle_phase_code: input.lifecycle_phase_code,
      location_text: cleanOptionalText(input.location_text),
      country: cleanOptionalText(input.country),
      region: cleanOptionalText(input.region),
      wb_region: cleanOptionalText(input.wb_region),
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      resource_type: cleanOptionalText(input.resource_type),
      resource_temp_c: input.resource_temp_c ?? null,
      potential_min_mwe: input.potential_min_mwe ?? null,
      potential_max_mwe: input.potential_max_mwe ?? null,
      electric_capacity_mwe: input.electric_capacity_mwe ?? null,
      thermal_capacity_mwth: input.thermal_capacity_mwth ?? null,
      annual_power_generation_gwhe: input.annual_power_generation_gwhe ?? null,
      annual_heat_supply_gwhth: input.annual_heat_supply_gwhth ?? null,
      annual_cooling_supply_gwhc: input.annual_cooling_supply_gwhc ?? null,
      capacity_estimate_status_code: input.capacity_estimate_status_code,
      output_estimate_status_code: input.output_estimate_status_code,
      start_dev_year: input.start_dev_year ?? null,
      target_cod_year: input.target_cod_year ?? null,
      target_cod_month: input.target_cod_month ?? null,
      cod_raw: cleanOptionalText(input.cod_raw),
      plant_technology: cleanOptionalText(input.plant_technology),
      turbine_supplier: cleanOptionalText(input.turbine_supplier),
      review_status_code: input.review_status_code,
      research_status: cleanOptionalText(input.research_status),
      notes: cleanOptionalText(input.notes),
      ...getReviewTimestampFields(input.review_status_code),
    },
    select: { project_id: true },
  });

  const detail = await getPostgresPreviewProjectById(project.project_id);

  if (!detail) {
    throw new Error("Created project could not be reloaded.");
  }

  return detail;
}

export async function updatePostgresPreviewProject(
  projectId: string,
  input: PostgresProjectMutationInput
): Promise<PostgresPreviewProjectDetail | null> {
  const prisma = getPrismaClient();
  const existing = await prisma.projects.findUnique({
    select: {
      review_status_code: true,
      approved_at: true,
      export_ready_at: true,
    },
    where: { project_id: projectId },
  });

  if (!existing) {
    return null;
  }

  const reviewStatus = deriveUpdatedReviewStatus(
    existing.review_status_code,
    input.review_status_code
  );

  await prisma.projects.update({
    where: { project_id: projectId },
    data: {
      project_name: input.project_name,
      project_name_clean: normalizeEntityNameClean(input.project_name),
      project_group: cleanOptionalText(input.project_group),
      primary_use_type_code: input.primary_use_type_code,
      lifecycle_phase_code: input.lifecycle_phase_code,
      location_text: cleanOptionalText(input.location_text),
      country: cleanOptionalText(input.country),
      region: cleanOptionalText(input.region),
      wb_region: cleanOptionalText(input.wb_region),
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      resource_type: cleanOptionalText(input.resource_type),
      resource_temp_c: input.resource_temp_c ?? null,
      potential_min_mwe: input.potential_min_mwe ?? null,
      potential_max_mwe: input.potential_max_mwe ?? null,
      electric_capacity_mwe: input.electric_capacity_mwe ?? null,
      thermal_capacity_mwth: input.thermal_capacity_mwth ?? null,
      annual_power_generation_gwhe: input.annual_power_generation_gwhe ?? null,
      annual_heat_supply_gwhth: input.annual_heat_supply_gwhth ?? null,
      annual_cooling_supply_gwhc: input.annual_cooling_supply_gwhc ?? null,
      capacity_estimate_status_code: input.capacity_estimate_status_code,
      output_estimate_status_code: input.output_estimate_status_code,
      start_dev_year: input.start_dev_year ?? null,
      target_cod_year: input.target_cod_year ?? null,
      target_cod_month: input.target_cod_month ?? null,
      cod_raw: cleanOptionalText(input.cod_raw),
      plant_technology: cleanOptionalText(input.plant_technology),
      turbine_supplier: cleanOptionalText(input.turbine_supplier),
      review_status_code: reviewStatus,
      research_status: cleanOptionalText(input.research_status),
      notes: cleanOptionalText(input.notes),
      updated_at: new Date(),
      ...getPreservedReviewTimestampFields(reviewStatus, existing),
    },
  });

  return getPostgresPreviewProjectById(projectId);
}

export async function createPostgresPreviewOperatingAsset(
  input: PostgresOperatingAssetMutationInput
): Promise<PostgresPreviewOperatingAssetDetail> {
  const asset = await getPrismaClient().operating_assets.create({
    data: {
      asset_name: input.asset_name,
      asset_name_clean: normalizeEntityNameClean(input.asset_name),
      project_group: cleanOptionalText(input.project_group),
      primary_use_type_code: input.primary_use_type_code,
      lifecycle_phase_code: input.lifecycle_phase_code,
      location_text: cleanOptionalText(input.location_text),
      country: cleanOptionalText(input.country),
      region: cleanOptionalText(input.region),
      wb_region: cleanOptionalText(input.wb_region),
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      resource_type: cleanOptionalText(input.resource_type),
      resource_temp_c: input.resource_temp_c ?? null,
      potential_min_mwe: input.potential_min_mwe ?? null,
      potential_max_mwe: input.potential_max_mwe ?? null,
      electric_capacity_mwe: input.electric_capacity_mwe ?? null,
      electric_capacity_running_mwe: input.electric_capacity_running_mwe ?? null,
      thermal_capacity_mwth: input.thermal_capacity_mwth ?? null,
      annual_power_generation_gwhe: input.annual_power_generation_gwhe ?? null,
      annual_heat_supply_gwhth: input.annual_heat_supply_gwhth ?? null,
      annual_cooling_supply_gwhc: input.annual_cooling_supply_gwhc ?? null,
      capacity_estimate_status_code: input.capacity_estimate_status_code,
      output_estimate_status_code: input.output_estimate_status_code,
      start_dev_year: input.start_dev_year ?? null,
      cod_year: input.cod_year ?? null,
      cod_month: input.cod_month ?? null,
      cod_raw: cleanOptionalText(input.cod_raw),
      number_of_units: cleanOptionalText(input.number_of_units),
      plant_technology: cleanOptionalText(input.plant_technology),
      turbine_supplier: cleanOptionalText(input.turbine_supplier),
      review_status_code: input.review_status_code,
      research_status: cleanOptionalText(input.research_status),
      notes: cleanOptionalText(input.notes),
      ...getReviewTimestampFields(input.review_status_code),
    },
    select: { operating_asset_id: true },
  });

  const detail = await getPostgresPreviewOperatingAssetById(
    asset.operating_asset_id
  );

  if (!detail) {
    throw new Error("Created operating asset could not be reloaded.");
  }

  return detail;
}

export async function updatePostgresPreviewOperatingAsset(
  operatingAssetId: string,
  input: PostgresOperatingAssetMutationInput
): Promise<PostgresPreviewOperatingAssetDetail | null> {
  const prisma = getPrismaClient();
  const existing = await prisma.operating_assets.findUnique({
    select: {
      review_status_code: true,
      approved_at: true,
      export_ready_at: true,
    },
    where: { operating_asset_id: operatingAssetId },
  });

  if (!existing) {
    return null;
  }

  const reviewStatus = deriveUpdatedReviewStatus(
    existing.review_status_code,
    input.review_status_code
  );

  await prisma.operating_assets.update({
    where: { operating_asset_id: operatingAssetId },
    data: {
      asset_name: input.asset_name,
      asset_name_clean: normalizeEntityNameClean(input.asset_name),
      project_group: cleanOptionalText(input.project_group),
      primary_use_type_code: input.primary_use_type_code,
      lifecycle_phase_code: input.lifecycle_phase_code,
      location_text: cleanOptionalText(input.location_text),
      country: cleanOptionalText(input.country),
      region: cleanOptionalText(input.region),
      wb_region: cleanOptionalText(input.wb_region),
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      resource_type: cleanOptionalText(input.resource_type),
      resource_temp_c: input.resource_temp_c ?? null,
      potential_min_mwe: input.potential_min_mwe ?? null,
      potential_max_mwe: input.potential_max_mwe ?? null,
      electric_capacity_mwe: input.electric_capacity_mwe ?? null,
      electric_capacity_running_mwe: input.electric_capacity_running_mwe ?? null,
      thermal_capacity_mwth: input.thermal_capacity_mwth ?? null,
      annual_power_generation_gwhe: input.annual_power_generation_gwhe ?? null,
      annual_heat_supply_gwhth: input.annual_heat_supply_gwhth ?? null,
      annual_cooling_supply_gwhc: input.annual_cooling_supply_gwhc ?? null,
      capacity_estimate_status_code: input.capacity_estimate_status_code,
      output_estimate_status_code: input.output_estimate_status_code,
      start_dev_year: input.start_dev_year ?? null,
      cod_year: input.cod_year ?? null,
      cod_month: input.cod_month ?? null,
      cod_raw: cleanOptionalText(input.cod_raw),
      number_of_units: cleanOptionalText(input.number_of_units),
      plant_technology: cleanOptionalText(input.plant_technology),
      turbine_supplier: cleanOptionalText(input.turbine_supplier),
      review_status_code: reviewStatus,
      research_status: cleanOptionalText(input.research_status),
      notes: cleanOptionalText(input.notes),
      updated_at: new Date(),
      ...getPreservedReviewTimestampFields(reviewStatus, existing),
    },
  });

  return getPostgresPreviewOperatingAssetById(operatingAssetId);
}

export async function createPostgresPreviewCompany(
  input: PostgresCompanyMutationInput
): Promise<PostgresPreviewCompanyDetail> {
  const company = await getPrismaClient().companies.create({
    data: {
      company_name: input.company_name,
      company_name_clean: normalizeEntityNameClean(input.company_name),
      company_name_short: cleanOptionalText(input.company_name_short),
      company_legal_name: cleanOptionalText(input.company_legal_name),
      website_url: cleanOptionalText(input.website_url),
      linkedin_url: cleanOptionalText(input.linkedin_url),
      entity_type_code: cleanOptionalText(input.entity_type_code),
      company_type_primary_code: cleanOptionalText(input.company_type_primary_code),
      ownership_type: cleanOptionalText(input.ownership_type),
      company_status: cleanOptionalText(input.company_status),
      headquarters_city: cleanOptionalText(input.headquarters_city),
      headquarters_country: cleanOptionalText(input.headquarters_country),
      region: cleanOptionalText(input.region),
      wb_region: cleanOptionalText(input.wb_region),
      geothermal_focus: cleanOptionalText(input.geothermal_focus),
      technology_focus: cleanOptionalText(input.technology_focus),
      service_scope_summary: cleanOptionalText(input.service_scope_summary),
      operating_markets_summary: cleanOptionalText(input.operating_markets_summary),
      review_status_code: input.review_status_code,
      research_status: cleanOptionalText(input.research_status),
      notes: cleanOptionalText(input.notes),
      ...getReviewTimestampFields(input.review_status_code),
    },
    select: { company_id: true },
  });

  const detail = await getPostgresPreviewCompanyById(company.company_id);

  if (!detail) {
    throw new Error("Created company could not be reloaded.");
  }

  return detail;
}

export async function updatePostgresPreviewCompany(
  companyId: string,
  input: PostgresCompanyMutationInput
): Promise<PostgresPreviewCompanyDetail | null> {
  const prisma = getPrismaClient();
  const existing = await prisma.companies.findUnique({
    select: {
      review_status_code: true,
      approved_at: true,
      export_ready_at: true,
    },
    where: { company_id: companyId },
  });

  if (!existing) {
    return null;
  }

  const reviewStatus = deriveUpdatedReviewStatus(
    existing.review_status_code,
    input.review_status_code
  );

  await prisma.companies.update({
    where: { company_id: companyId },
    data: {
      company_name: input.company_name,
      company_name_clean: normalizeEntityNameClean(input.company_name),
      company_name_short: cleanOptionalText(input.company_name_short),
      company_legal_name: cleanOptionalText(input.company_legal_name),
      website_url: cleanOptionalText(input.website_url),
      linkedin_url: cleanOptionalText(input.linkedin_url),
      entity_type_code: cleanOptionalText(input.entity_type_code),
      company_type_primary_code: cleanOptionalText(input.company_type_primary_code),
      ownership_type: cleanOptionalText(input.ownership_type),
      company_status: cleanOptionalText(input.company_status),
      headquarters_city: cleanOptionalText(input.headquarters_city),
      headquarters_country: cleanOptionalText(input.headquarters_country),
      region: cleanOptionalText(input.region),
      wb_region: cleanOptionalText(input.wb_region),
      geothermal_focus: cleanOptionalText(input.geothermal_focus),
      technology_focus: cleanOptionalText(input.technology_focus),
      service_scope_summary: cleanOptionalText(input.service_scope_summary),
      operating_markets_summary: cleanOptionalText(input.operating_markets_summary),
      review_status_code: reviewStatus,
      research_status: cleanOptionalText(input.research_status),
      notes: cleanOptionalText(input.notes),
      updated_at: new Date(),
      ...getPreservedReviewTimestampFields(reviewStatus, existing),
    },
  });

  return getPostgresPreviewCompanyById(companyId);
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
    last_updated_by_name: row.last_updated_by_name,
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
    last_updated_by_name: row.last_updated_by_name,
    updated_at: normalizeTimestamp(row.updated_at),
  };
}

function toEntitySourceLink(
  row: PostgresEntitySourceLinkRow
): PostgresEntitySourceLink {
  return {
    ...row,
    created_at: normalizeTimestamp(row.created_at),
    updated_at: normalizeTimestamp(row.updated_at),
  };
}

export async function listPostgresEntitySourceLinks(
  entityType: "project" | "operating_asset" | "company",
  entityId: string
): Promise<PostgresEntitySourceLink[]> {
  const whereColumn =
    entityType === "project"
      ? "es.project_id"
      : entityType === "operating_asset"
        ? "es.operating_asset_id"
        : "es.company_id";

  const rows = await getPrismaClient().$queryRawUnsafe<
    PostgresEntitySourceLinkRow[]
  >(
    `
    SELECT
      es.entity_source_id::text,
      es.source_id::text,
      s.title AS source_title,
      s.source_reference,
      st.label AS source_type_label,
      s.visibility_code,
      s.credibility_status_code,
      es.linked_field,
      es.claim_text,
      es.extracted_value,
      es.confidence_status_code,
      es.is_primary_evidence,
      es.created_at,
      es.updated_at
    FROM entity_sources es
    INNER JOIN sources s
      ON s.source_id = es.source_id
    LEFT JOIN ref_source_types st
      ON st.code = s.source_type_code
    WHERE ${whereColumn} = $1::uuid
    ORDER BY
      es.is_primary_evidence DESC,
      s.credibility_status_code ASC,
      es.updated_at DESC
    `,
    entityId
  );

  return rows.map(toEntitySourceLink);
}

export async function getPostgresPreviewProjectById(
  projectId: string
): Promise<PostgresPreviewProjectDetail | null> {
  const rows = await getPrismaClient().$queryRawUnsafe<ProjectDetailRow[]>(
    `
    SELECT
      p.project_id::text,
      p.legacy_project_id,
      p.project_name,
      p.project_group,
      p.primary_use_type_code,
      p.lifecycle_phase_code,
      p.location_text,
      p.country,
      p.region,
      p.wb_region,
      p.latitude,
      p.longitude,
      p.resource_type,
      p.resource_temp_c,
      p.potential_min_mwe,
      p.potential_max_mwe,
      p.electric_capacity_mwe,
      p.thermal_capacity_mwth,
      p.annual_power_generation_gwhe,
      p.annual_heat_supply_gwhth,
      p.annual_cooling_supply_gwhc,
      p.capacity_estimate_status_code,
      p.output_estimate_status_code,
      p.start_dev_year,
      p.target_cod_year,
      p.target_cod_month,
      p.cod_raw,
      p.plant_technology,
      p.turbine_supplier,
      p.review_status_code,
      p.research_status,
      p.notes,
      (
        SELECT COUNT(*)::int
        FROM entity_sources es
        WHERE es.project_id = p.project_id
      ) AS source_count,
      p.created_at,
      p.updated_at
    FROM projects p
    WHERE p.project_id = $1::uuid
    LIMIT 1
    `,
    projectId
  );

  const row = rows[0];

  if (!row) {
    return null;
  }

  const sources = await listPostgresEntitySourceLinks("project", projectId);

  return {
    ...row,
    latitude: toNullableNumber(row.latitude),
    longitude: toNullableNumber(row.longitude),
    resource_temp_c: toNullableNumber(row.resource_temp_c),
    potential_min_mwe: toNullableNumber(row.potential_min_mwe),
    potential_max_mwe: toNullableNumber(row.potential_max_mwe),
    electric_capacity_mwe: toNullableNumber(row.electric_capacity_mwe),
    thermal_capacity_mwth: toNullableNumber(row.thermal_capacity_mwth),
    annual_power_generation_gwhe: toNullableNumber(row.annual_power_generation_gwhe),
    annual_heat_supply_gwhth: toNullableNumber(row.annual_heat_supply_gwhth),
    annual_cooling_supply_gwhc: toNullableNumber(row.annual_cooling_supply_gwhc),
    created_at: normalizeTimestamp(row.created_at),
    updated_at: normalizeTimestamp(row.updated_at),
    sources,
  };
}

export async function getPostgresPreviewOperatingAssetById(
  operatingAssetId: string
): Promise<PostgresPreviewOperatingAssetDetail | null> {
  const rows = await getPrismaClient().$queryRawUnsafe<OperatingAssetDetailRow[]>(
    `
    SELECT
      a.operating_asset_id::text,
      a.legacy_plant_id,
      a.asset_name,
      a.project_group,
      a.primary_use_type_code,
      a.lifecycle_phase_code,
      a.location_text,
      a.country,
      a.region,
      a.wb_region,
      a.latitude,
      a.longitude,
      a.resource_type,
      a.resource_temp_c,
      a.potential_min_mwe,
      a.potential_max_mwe,
      a.electric_capacity_mwe,
      a.electric_capacity_running_mwe,
      a.thermal_capacity_mwth,
      a.annual_power_generation_gwhe,
      a.annual_heat_supply_gwhth,
      a.annual_cooling_supply_gwhc,
      a.capacity_estimate_status_code,
      a.output_estimate_status_code,
      a.start_dev_year,
      a.cod_year,
      a.cod_month,
      a.cod_raw,
      a.number_of_units,
      a.plant_technology,
      a.turbine_supplier,
      a.promoted_from_project_id::text,
      a.review_status_code,
      a.research_status,
      a.notes,
      (
        SELECT COUNT(*)::int
        FROM entity_sources es
        WHERE es.operating_asset_id = a.operating_asset_id
      ) AS source_count,
      a.created_at,
      a.updated_at
    FROM operating_assets a
    WHERE a.operating_asset_id = $1::uuid
    LIMIT 1
    `,
    operatingAssetId
  );

  const row = rows[0];

  if (!row) {
    return null;
  }

  const sources = await listPostgresEntitySourceLinks(
    "operating_asset",
    operatingAssetId
  );

  return {
    ...row,
    latitude: toNullableNumber(row.latitude),
    longitude: toNullableNumber(row.longitude),
    resource_temp_c: toNullableNumber(row.resource_temp_c),
    potential_min_mwe: toNullableNumber(row.potential_min_mwe),
    potential_max_mwe: toNullableNumber(row.potential_max_mwe),
    electric_capacity_mwe: toNullableNumber(row.electric_capacity_mwe),
    electric_capacity_running_mwe: toNullableNumber(
      row.electric_capacity_running_mwe
    ),
    thermal_capacity_mwth: toNullableNumber(row.thermal_capacity_mwth),
    annual_power_generation_gwhe: toNullableNumber(row.annual_power_generation_gwhe),
    annual_heat_supply_gwhth: toNullableNumber(row.annual_heat_supply_gwhth),
    annual_cooling_supply_gwhc: toNullableNumber(row.annual_cooling_supply_gwhc),
    created_at: normalizeTimestamp(row.created_at),
    updated_at: normalizeTimestamp(row.updated_at),
    sources,
  };
}

export async function getPostgresPreviewCompanyById(
  companyId: string
): Promise<PostgresPreviewCompanyDetail | null> {
  const rows = await getPrismaClient().$queryRawUnsafe<CompanyDetailRow[]>(
    `
    SELECT
      c.company_id::text,
      c.legacy_company_id,
      c.company_name,
      c.company_name_short,
      c.company_legal_name,
      c.website_url,
      c.linkedin_url,
      c.entity_type_code,
      c.company_type_primary_code,
      c.ownership_type,
      c.company_status,
      c.headquarters_city,
      c.headquarters_country,
      c.region,
      c.wb_region,
      c.geothermal_focus,
      c.technology_focus,
      c.service_scope_summary,
      c.operating_markets_summary,
      c.review_status_code,
      c.research_status,
      c.notes,
      (
        SELECT COUNT(*)::int
        FROM entity_sources es
        WHERE es.company_id = c.company_id
      ) AS source_count,
      c.created_at,
      c.updated_at
    FROM companies c
    WHERE c.company_id = $1::uuid
    LIMIT 1
    `,
    companyId
  );

  const row = rows[0];

  if (!row) {
    return null;
  }

  const sources = await listPostgresEntitySourceLinks("company", companyId);

  return {
    ...row,
    created_at: normalizeTimestamp(row.created_at),
    updated_at: normalizeTimestamp(row.updated_at),
    sources,
  };
}

async function loadResearchOpsQueue(
  definition: QueueDefinition,
  limit: number
): Promise<PostgresResearchOpsQueue> {
  const rows = await getPrismaClient().$queryRawUnsafe<QueueItemRow[]>(
    `
    WITH queue AS (
      ${definition.sql}
    ),
    hydrated AS (
      SELECT
        queue.*,
        updater.name AS last_updated_by_name
      FROM queue
      LEFT JOIN projects p_user
        ON queue.entity_type = 'project'
        AND queue.entity_id::uuid = p_user.project_id
      LEFT JOIN operating_assets a_user
        ON queue.entity_type = 'operating_asset'
        AND queue.entity_id::uuid = a_user.operating_asset_id
      LEFT JOIN companies c_user
        ON queue.entity_type = 'company'
        AND queue.entity_id::uuid = c_user.company_id
      LEFT JOIN sources s_user
        ON queue.entity_type = 'source'
        AND queue.entity_id::uuid = s_user.source_id
      LEFT JOIN app_users updater
        ON updater.user_id = COALESCE(
          p_user.last_updated_by_user_id,
          a_user.last_updated_by_user_id,
          c_user.last_updated_by_user_id,
          s_user.reviewed_by_user_id,
          s_user.added_by_user_id
        )
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
      last_updated_by_name,
      updated_at,
      (COUNT(*) OVER())::int AS total_count
    FROM hydrated
    ORDER BY updated_at DESC NULLS LAST, name ASC
    LIMIT $1
    `,
    limit
  );

  return {
    key: definition.key,
    title: definition.title,
    severity: definition.severity,
    description: definition.description,
    count: rows[0]?.total_count ?? 0,
    items: rows.map(toResearchOpsQueueItem),
  };
}

export async function listPostgresResearchOpsRecentEdits(
  limit = 12
): Promise<PostgresResearchOpsRecentEdit[]> {
  const rows = await getPrismaClient().$queryRawUnsafe<RecentEditRow[]>(
    `
    SELECT
      records.entity_type,
      records.entity_id,
      records.legacy_id,
      records.name,
      records.country,
      records.primary_use_type_code,
      records.lifecycle_phase_code,
      records.review_status_code,
      updater.name AS last_updated_by_name,
      records.updated_at
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
        p.last_updated_by_user_id,
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
        a.last_updated_by_user_id,
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
        c.last_updated_by_user_id,
        c.updated_at
      FROM companies c

      UNION ALL

      SELECT
        'source'::text AS entity_type,
        s.source_id::text AS entity_id,
        s.source_reference AS legacy_id,
        COALESCE(NULLIF(s.title, ''), NULLIF(s.url, ''), s.source_id::text) AS name,
        s.country,
        s.source_type_code AS primary_use_type_code,
        NULL::text AS lifecycle_phase_code,
        s.credibility_status_code AS review_status_code,
        COALESCE(s.reviewed_by_user_id, s.added_by_user_id) AS last_updated_by_user_id,
        s.updated_at
      FROM sources s
    ) records
    LEFT JOIN app_users updater
      ON updater.user_id = records.last_updated_by_user_id
    ORDER BY records.updated_at DESC NULLS LAST, records.name ASC
    LIMIT $1
    `,
    limit
  );

  return rows.map(toRecentEdit);
}

export async function getPostgresResearchOpsDashboard(
  itemLimit = 50
): Promise<PostgresResearchOpsDashboard> {
  const [queues, recentEdits] = await Promise.all([
    Promise.all(
      researchOpsQueueDefinitions.map((definition) =>
        loadResearchOpsQueue(definition, itemLimit)
      )
    ),
    listPostgresResearchOpsRecentEdits(20),
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
