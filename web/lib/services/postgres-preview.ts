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
  source_url: string | null;
  source_reference: string | null;
  source_type_code: string;
  source_type_label: string | null;
  source_published_date: string | null;
  visibility_code: string;
  credibility_status_code: string;
  evidence_type: string | null;
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
    persistentIssues: number;
  };
  queues: PostgresResearchOpsQueue[];
  persistentIssues: PostgresResearchOpsIssue[];
  recentEdits: PostgresResearchOpsRecentEdit[];
};

export type PostgresFieldSuggestionSummary = {
  total: number;
  open: number;
  confirmedUnapplied: number;
  applyReady: number;
  applied: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  confirmed: number;
  rejected: number;
  superseded: number;
};

export type PostgresFieldSuggestionCandidate = {
  field_suggestion_candidate_id: string;
  entity_type: PostgresReviewEntityType;
  entity_id: string;
  entity_name: string;
  country: string | null;
  field_name: string;
  current_value: string | null;
  suggested_value: string;
  source_id: string | null;
  source_title: string | null;
  source_reference: string | null;
  confidence_score: number;
  suggestion_status_code: string;
  suggestion_status_label: string | null;
  suggestion_reason: string | null;
  generated_by: string;
  generated_at: string;
  applied_at: string | null;
  applied_audit_event_id: string | null;
  updated_at: string;
};

export type PostgresFieldSuggestionAction =
  | "confirm"
  | "reject"
  | "needs_review"
  | "apply";

export type PostgresFieldSuggestionBulkResult = {
  requested: number;
  updated: number;
  applied?: number;
  skipped?: number;
};

export type PostgresResearchOpsIssueType = PostgresReferenceOption & {
  severity: ResearchOpsQueueSeverity;
  description: string | null;
};

export type PostgresResearchOpsIssueStatus = PostgresReferenceOption & {
  description: string | null;
  is_open: boolean;
};

export type PostgresAssignableUser = {
  user_id: string;
  name: string;
  email: string;
  role_code: string;
};

export type PostgresResearchOpsIssueReferenceData = {
  issueTypes: PostgresResearchOpsIssueType[];
  issueStatuses: PostgresResearchOpsIssueStatus[];
  assignableUsers: PostgresAssignableUser[];
};

export type PostgresResearchOpsIssueEntityType =
  | "project"
  | "operating_asset"
  | "company"
  | "source";

export type PostgresResearchOpsIssue = {
  research_ops_issue_id: string;
  issue_type_code: string;
  issue_type_label: string;
  issue_status_code: string;
  issue_status_label: string;
  severity: ResearchOpsQueueSeverity;
  entity_type: PostgresResearchOpsIssueEntityType;
  entity_id: string;
  legacy_id: string | null;
  name: string;
  country: string | null;
  linked_field: string | null;
  title: string;
  description: string | null;
  assigned_to_user_id: string | null;
  assigned_to_name: string | null;
  created_by_name: string | null;
  resolved_by_name: string | null;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

export type PostgresResearchOpsIssueMutationInput = {
  entityType: PostgresResearchOpsIssueEntityType;
  entityId: string;
  issueTypeCode: string;
  title: string;
  description?: string | null;
  linkedField?: string | null;
  assignToUserId?: string | null;
  actorUserId?: string | null;
};

export type PostgresResearchOpsIssueStatusUpdateInput = {
  issueId: string;
  issueStatusCode: string;
  actorUserId?: string | null;
  eventNote?: string | null;
  assignToUserId?: string | null;
  clearAssignment?: boolean;
};

export type PostgresReviewEntityType = "project" | "operating_asset" | "company";

export type PostgresReviewStatusUpdateInput = {
  entityType: PostgresReviewEntityType;
  entityId: string;
  reviewStatusCode: string;
  actorUserId?: string | null;
  eventNote?: string | null;
};

export type PostgresReviewStatusUpdateResult = {
  entity_type: PostgresReviewEntityType;
  entity_id: string;
  previous_review_status_code: string;
  next_review_status_code: string;
  updated_at: string;
};

export type PostgresAuditEvent = {
  audit_event_id: string;
  entity_type: PostgresReviewEntityType;
  entity_id: string;
  event_type: string;
  previous_review_status_code: string | null;
  next_review_status_code: string | null;
  actor_name: string | null;
  actor_email: string | null;
  event_note: string | null;
  changed_fields: unknown;
  created_at: string;
};

export type PostgresPromotedOperatingAsset = {
  operating_asset_id: string;
  legacy_plant_id: string | null;
  asset_name: string;
  country: string | null;
  review_status_code: string;
  link_type: string;
  created_at: string;
};

export type PostgresProjectPromotionResult = {
  operatingAsset: PostgresPreviewOperatingAssetDetail;
  created: boolean;
  copiedSourceLinks: number;
  copiedCompanyLinks: number;
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

type FieldSuggestionSummaryRow = {
  total: number | bigint;
  open: number | bigint;
  confirmed_unapplied: number | bigint;
  apply_ready: number | bigint;
  applied: number | bigint;
  high_confidence: number | bigint;
  medium_confidence: number | bigint;
  low_confidence: number | bigint;
  confirmed: number | bigint;
  rejected: number | bigint;
  superseded: number | bigint;
};

type FieldSuggestionCandidateRow = Omit<
  PostgresFieldSuggestionCandidate,
  "confidence_score" | "generated_at" | "applied_at" | "updated_at"
> & {
  confidence_score: number | string;
  generated_at: string | Date;
  applied_at: string | Date | null;
  updated_at: string | Date;
};

type FieldSuggestionCandidateUpdateRow = {
  field_suggestion_candidate_id: string;
};

type FieldSuggestionApplyFieldConfig = {
  fieldCast: "numeric" | "int";
  valueType: "decimal" | "year";
};

type FieldSuggestionApplyTarget = {
  tableName: "projects" | "operating_assets";
  idColumn: "project_id" | "operating_asset_id";
  fields: Record<string, FieldSuggestionApplyFieldConfig>;
};

type FieldSuggestionApplyCandidateRow = {
  field_suggestion_candidate_id: string;
  entity_type: string;
  field_name: string;
  suggested_value: string;
  normalized_value: unknown;
  suggestion_reason: string | null;
  source_id: string | null;
  source_reference: string | null;
  confidence_score: number | string;
  generated_by: string;
};

type FieldSuggestionApplyUpdateRow = {
  field_suggestion_candidate_id: string;
  applied_audit_event_id: string | null;
};

type ReviewStatusUpdateRow = Omit<
  PostgresReviewStatusUpdateResult,
  "updated_at"
> & {
  updated_at: string | Date;
};

type AuditEventRow = Omit<PostgresAuditEvent, "created_at"> & {
  created_at: string | Date;
};

type PromotedOperatingAssetRow = Omit<
  PostgresPromotedOperatingAsset,
  "created_at"
> & {
  created_at: string | Date;
};

const fieldSuggestionApplyTargets: Record<string, FieldSuggestionApplyTarget> = {
  project: {
    tableName: "projects",
    idColumn: "project_id",
    fields: {
      electric_capacity_mwe: { fieldCast: "numeric", valueType: "decimal" },
      thermal_capacity_mwth: { fieldCast: "numeric", valueType: "decimal" },
      target_cod_year: { fieldCast: "int", valueType: "year" },
    },
  },
  operating_asset: {
    tableName: "operating_assets",
    idColumn: "operating_asset_id",
    fields: {
      electric_capacity_mwe: { fieldCast: "numeric", valueType: "decimal" },
      thermal_capacity_mwth: { fieldCast: "numeric", valueType: "decimal" },
    },
  },
};

type ResearchOpsIssueRow = Omit<
  PostgresResearchOpsIssue,
  "created_at" | "updated_at" | "resolved_at"
> & {
  created_at: string | Date;
  updated_at: string | Date;
  resolved_at: string | Date | null;
};

type PostgresEntitySourceLinkRow = Omit<
  PostgresEntitySourceLink,
  "created_at" | "updated_at" | "source_published_date"
> & {
  source_published_date: string | Date | null;
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

function toNumber(value: number | bigint | string | null | undefined) {
  return Number(value ?? 0);
}

function isMissingRelationError(error: unknown, relationName: string) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes(`relation "${relationName}" does not exist`) ||
    message.includes(`relation ${relationName} does not exist`)
  );
}

type PostgresPreviewListOptions = {
  limit?: number;
  offset?: number;
};

function normalizePreviewListOptions(
  options: number | PostgresPreviewListOptions = 25
) {
  if (typeof options === "number") {
    return {
      limit: options,
      offset: 0,
    };
  }

  return {
    limit: options.limit ?? 25,
    offset: options.offset ?? 0,
  };
}

export async function listPostgresPreviewProjects(
  options: number | PostgresPreviewListOptions = 25
): Promise<PostgresPreviewProject[]> {
  const { limit, offset } = normalizePreviewListOptions(options);
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
    skip: offset,
  });

  return rows.map((row) => ({
    ...row,
    electric_capacity_mwe: toNullableNumber(row.electric_capacity_mwe),
    thermal_capacity_mwth: toNullableNumber(row.thermal_capacity_mwth),
    annual_heat_supply_gwhth: toNullableNumber(row.annual_heat_supply_gwhth),
  }));
}

export async function listPostgresPreviewOperatingAssets(
  options: number | PostgresPreviewListOptions = 25
): Promise<PostgresPreviewOperatingAsset[]> {
  const { limit, offset } = normalizePreviewListOptions(options);
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
    skip: offset,
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
  options: number | PostgresPreviewListOptions = 25
): Promise<PostgresPreviewCompany[]> {
  const { limit, offset } = normalizePreviewListOptions(options);
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
    skip: offset,
  });
}

function cleanOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function isUuid(value: string | null | undefined) {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value
      )
  );
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

function getReviewEntityConfig(entityType: PostgresReviewEntityType) {
  if (entityType === "project") {
    return {
      tableName: "projects",
      idColumn: "project_id",
      entityType: "project" as const,
    };
  }

  if (entityType === "operating_asset") {
    return {
      tableName: "operating_assets",
      idColumn: "operating_asset_id",
      entityType: "operating_asset" as const,
    };
  }

  return {
    tableName: "companies",
    idColumn: "company_id",
    entityType: "company" as const,
  };
}

export async function updatePostgresReviewStatus(
  input: PostgresReviewStatusUpdateInput
): Promise<PostgresReviewStatusUpdateResult | null> {
  const config = getReviewEntityConfig(input.entityType);
  const normalizedActorUserId = isUuid(input.actorUserId)
    ? input.actorUserId
    : null;
  const eventNote = cleanOptionalText(input.eventNote);

  const rows = await getPrismaClient().$queryRawUnsafe<ReviewStatusUpdateRow[]>(
    `
    WITH current_record AS (
      SELECT ${config.idColumn}, review_status_code
      FROM ${config.tableName}
      WHERE ${config.idColumn} = $1::uuid
      LIMIT 1
    ),
    actor AS (
      SELECT user_id
      FROM app_users
      WHERE user_id = $3::uuid
      LIMIT 1
    ),
    updated_record AS (
      UPDATE ${config.tableName} target
      SET
        review_status_code = $2,
        last_updated_by_user_id = COALESCE(
          (SELECT user_id FROM actor),
          target.last_updated_by_user_id
        ),
        approved_by_user_id = CASE
          WHEN $2 IN ('approved', 'export_ready')
            THEN COALESCE(
              (SELECT user_id FROM actor),
              target.approved_by_user_id
            )
          ELSE target.approved_by_user_id
        END,
        approved_at = CASE
          WHEN $2 IN ('approved', 'export_ready')
            THEN COALESCE(target.approved_at, now())
          ELSE target.approved_at
        END,
        export_ready_at = CASE
          WHEN $2 = 'export_ready'
            THEN COALESCE(target.export_ready_at, now())
          ELSE target.export_ready_at
        END,
        updated_at = now()
      FROM current_record
      WHERE target.${config.idColumn} = current_record.${config.idColumn}
      RETURNING
        target.${config.idColumn}::text AS entity_id,
        current_record.review_status_code AS previous_review_status_code,
        target.review_status_code AS next_review_status_code,
        target.updated_at
    ),
    audit AS (
      INSERT INTO audit_events (
        entity_type,
        entity_id,
        event_type,
        previous_review_status_code,
        next_review_status_code,
        actor_user_id,
        event_note,
        changed_fields
      )
      SELECT
        $4,
        entity_id::uuid,
        'review_status_change',
        previous_review_status_code,
        next_review_status_code,
        (SELECT user_id FROM actor),
        $5,
        jsonb_build_object(
          'review_status_code',
          jsonb_build_array(previous_review_status_code, next_review_status_code)
        )
      FROM updated_record
      WHERE previous_review_status_code IS DISTINCT FROM next_review_status_code
      RETURNING audit_event_id
    )
    SELECT
      $4::text AS entity_type,
      entity_id,
      previous_review_status_code,
      next_review_status_code,
      updated_at
    FROM updated_record
    `,
    input.entityId,
    input.reviewStatusCode,
    normalizedActorUserId,
    config.entityType,
    eventNote
  );

  if (!rows[0]) {
    return null;
  }

  return {
    ...rows[0],
    entity_type: config.entityType,
    updated_at: normalizeTimestamp(rows[0].updated_at),
  };
}

export async function listPostgresAuditEventsForEntity(
  entityType: PostgresReviewEntityType,
  entityId: string,
  limit = 20
): Promise<PostgresAuditEvent[]> {
  if (!isUuid(entityId)) {
    return [];
  }

  const rows = await getPrismaClient().$queryRawUnsafe<AuditEventRow[]>(
    `
    SELECT
      audit.audit_event_id::text,
      audit.entity_type,
      audit.entity_id::text,
      audit.event_type,
      audit.previous_review_status_code,
      audit.next_review_status_code,
      actor.name AS actor_name,
      actor.email AS actor_email,
      audit.event_note,
      audit.changed_fields,
      audit.created_at
    FROM audit_events audit
    LEFT JOIN app_users actor
      ON actor.user_id = audit.actor_user_id
    WHERE audit.entity_type = $1
      AND audit.entity_id = $2::uuid
    ORDER BY audit.created_at DESC
    LIMIT $3
    `,
    entityType,
    entityId,
    Math.min(Math.max(limit, 1), 100)
  );

  return rows.map(toAuditEvent);
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

function buildPromotionNotes({
  projectId,
  projectName,
  existingNotes,
  promotionNote,
}: {
  projectId: string;
  projectName: string;
  existingNotes?: string | null;
  promotionNote?: string | null;
}) {
  const generatedNote = `Promoted from PostgreSQL staging project ${projectName} (${projectId}).`;
  return [existingNotes, generatedNote, cleanOptionalText(promotionNote)]
    .filter(Boolean)
    .join("\n\n");
}

export async function listPostgresPromotedOperatingAssets(
  projectId: string
): Promise<PostgresPromotedOperatingAsset[]> {
  const rows = await getPrismaClient().$queryRawUnsafe<
    PromotedOperatingAssetRow[]
  >(
    `
    SELECT
      a.operating_asset_id::text,
      a.legacy_plant_id,
      a.asset_name,
      a.country,
      a.review_status_code,
      poal.link_type,
      poal.created_at
    FROM project_operating_asset_links poal
    INNER JOIN operating_assets a
      ON a.operating_asset_id = poal.operating_asset_id
    WHERE poal.project_id = $1::uuid
    ORDER BY poal.created_at DESC, a.asset_name ASC
    `,
    projectId
  );

  return rows.map((row) => ({
    ...row,
    created_at: normalizeTimestamp(row.created_at),
  }));
}

export async function promotePostgresProjectToOperatingAsset({
  projectId,
  actorUserId,
  promotionNote,
}: {
  projectId: string;
  actorUserId?: string | null;
  promotionNote?: string | null;
}): Promise<PostgresProjectPromotionResult | null> {
  const prisma = getPrismaClient();
  const normalizedActorUserId = isUuid(actorUserId) ? actorUserId : null;

  const result = await prisma.$transaction(async (tx) => {
    const existingAsset = await tx.operating_assets.findFirst({
      select: { operating_asset_id: true },
      where: { promoted_from_project_id: projectId },
      orderBy: { promoted_at: "desc" },
    });

    if (existingAsset) {
      return {
        operatingAssetId: existingAsset.operating_asset_id,
        created: false,
        copiedSourceLinks: 0,
        copiedCompanyLinks: 0,
      };
    }

    const project = await tx.projects.findUnique({
      where: { project_id: projectId },
    });

    if (!project) {
      return null;
    }

    const asset = await tx.operating_assets.create({
      data: {
        asset_name: project.project_name,
        asset_name_short: project.project_name_short,
        asset_name_clean:
          project.project_name_clean || normalizeEntityNameClean(project.project_name),
        project_group: project.project_group,
        other_name: project.other_name,
        primary_use_type_code: project.primary_use_type_code,
        lifecycle_phase_code: "operating",
        location_text: project.location_text,
        country: project.country,
        region: project.region,
        wb_region: project.wb_region,
        latitude: project.latitude,
        longitude: project.longitude,
        field_name: project.field_name,
        resource_type: project.resource_type,
        resource_temp_c: project.resource_temp_c,
        potential_min_mwe: project.potential_min_mwe,
        potential_max_mwe: project.potential_max_mwe,
        electric_capacity_mwe: project.electric_capacity_mwe,
        electric_capacity_running_mwe: project.electric_capacity_running_mwe,
        thermal_capacity_mwth: project.thermal_capacity_mwth,
        installed_heat_pump_capacity_mwth:
          project.installed_heat_pump_capacity_mwth,
        geothermal_resource_capacity_mwth:
          project.geothermal_resource_capacity_mwth,
        annual_power_generation_gwhe: project.annual_power_generation_gwhe,
        annual_heat_supply_gwhth: project.annual_heat_supply_gwhth,
        annual_cooling_supply_gwhc: project.annual_cooling_supply_gwhc,
        capacity_estimate_status_code: project.capacity_estimate_status_code,
        output_estimate_status_code: project.output_estimate_status_code,
        start_dev_year: project.start_dev_year,
        cod_year: project.target_cod_year,
        cod_month: project.target_cod_month,
        cod_raw: project.cod_raw,
        wells_total: project.wells_total,
        wells_prod_active: project.wells_prod_active,
        wells_reinj_active: project.wells_reinj_active,
        wells_inactive_standby: project.wells_inactive_standby,
        wells_other_exploration: project.wells_other_exploration,
        well_depth_prod_m: project.well_depth_prod_m,
        temp_prod_well_c: project.temp_prod_well_c,
        flow_rate_ls: project.flow_rate_ls,
        plant_technology: project.plant_technology,
        turbine_supplier: project.turbine_supplier,
        epc_suppliers: project.epc_suppliers,
        ppa_usd_kwh: project.ppa_usd_kwh,
        total_investment_cost: project.total_investment_cost,
        promoted_from_project_id: project.project_id,
        promoted_at: new Date(),
        website_information: project.website_information,
        source_evidence_note: project.source_evidence_note,
        notes: buildPromotionNotes({
          projectId: project.project_id,
          projectName: project.project_name,
          existingNotes: project.notes,
          promotionNote,
        }),
        internal_comments: project.internal_comments,
        review_status_code: "validation",
        research_status: "promoted_from_project",
      },
      select: { operating_asset_id: true },
    });

    await tx.$executeRawUnsafe(
      `
      INSERT INTO project_operating_asset_links (
        project_id,
        operating_asset_id,
        link_type,
        notes
      )
      VALUES ($1::uuid, $2::uuid, 'promotion', $3)
      ON CONFLICT (project_id, operating_asset_id, link_type)
      DO UPDATE SET notes = EXCLUDED.notes
      `,
      project.project_id,
      asset.operating_asset_id,
      cleanOptionalText(promotionNote)
    );

    const copiedSourceLinks = await tx.$executeRawUnsafe(
      `
      INSERT INTO entity_sources (
        source_id,
        operating_asset_id,
        evidence_type,
        evidence_note,
        confidence_status_code,
        linked_field,
        claim_text,
        extracted_value,
        is_primary_evidence
      )
      SELECT
        es.source_id,
        $2::uuid,
        es.evidence_type,
        es.evidence_note,
        es.confidence_status_code,
        es.linked_field,
        es.claim_text,
        es.extracted_value,
        es.is_primary_evidence
      FROM entity_sources es
      WHERE es.project_id = $1::uuid
        AND NOT EXISTS (
          SELECT 1
          FROM entity_sources existing
          WHERE existing.source_id = es.source_id
            AND existing.operating_asset_id = $2::uuid
        )
      `,
      project.project_id,
      asset.operating_asset_id
    );

    const copiedCompanyLinks = await tx.$executeRawUnsafe(
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
      SELECT
        cpl.company_id,
        $2::uuid,
        cpl.role_code,
        cpl.role_detail,
        cpl.ownership_share,
        cpl.is_primary,
        cpl.notes
      FROM company_project_links cpl
      WHERE cpl.project_id = $1::uuid
      ON CONFLICT (company_id, operating_asset_id, role_code)
      DO UPDATE SET
        role_detail = EXCLUDED.role_detail,
        ownership_share = EXCLUDED.ownership_share,
        is_primary = EXCLUDED.is_primary,
        notes = EXCLUDED.notes,
        updated_at = now()
      `,
      project.project_id,
      asset.operating_asset_id
    );

    await tx.$executeRawUnsafe(
      `
      WITH actor AS (
        SELECT user_id
        FROM app_users
        WHERE user_id = $3::uuid
        LIMIT 1
      )
      INSERT INTO audit_events (
        entity_type,
        entity_id,
        event_type,
        actor_user_id,
        event_note,
        changed_fields
      )
      VALUES (
        'project',
        $1::uuid,
        'project_promoted_to_operating_asset',
        (SELECT user_id FROM actor),
        $4,
        jsonb_build_object('operating_asset_id', $2::text)
      )
      `,
      project.project_id,
      asset.operating_asset_id,
      normalizedActorUserId,
      cleanOptionalText(promotionNote)
    );

    return {
      operatingAssetId: asset.operating_asset_id,
      created: true,
      copiedSourceLinks,
      copiedCompanyLinks,
    };
  });

  if (!result) {
    return null;
  }

  const operatingAsset = await getPostgresPreviewOperatingAssetById(
    result.operatingAssetId
  );

  if (!operatingAsset) {
    throw new Error("Promoted operating asset could not be reloaded.");
  }

  return {
    operatingAsset,
    created: result.created,
    copiedSourceLinks: result.copiedSourceLinks,
    copiedCompanyLinks: result.copiedCompanyLinks,
  };
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

function toResearchOpsIssue(row: ResearchOpsIssueRow): PostgresResearchOpsIssue {
  return {
    ...row,
    created_at: normalizeTimestamp(row.created_at),
    updated_at: normalizeTimestamp(row.updated_at),
    resolved_at: row.resolved_at ? normalizeTimestamp(row.resolved_at) : null,
  };
}

function toFieldSuggestionCandidate(
  row: FieldSuggestionCandidateRow
): PostgresFieldSuggestionCandidate {
  return {
    ...row,
    confidence_score: Number(row.confidence_score),
    generated_at: normalizeTimestamp(row.generated_at),
    applied_at: row.applied_at ? normalizeTimestamp(row.applied_at) : null,
    updated_at: normalizeTimestamp(row.updated_at),
  };
}

function toAuditEvent(row: AuditEventRow): PostgresAuditEvent {
  return {
    ...row,
    created_at: normalizeTimestamp(row.created_at),
  };
}

function entityColumnForResearchIssue(
  entityType: PostgresResearchOpsIssueEntityType
) {
  if (entityType === "project") {
    return "project_id";
  }

  if (entityType === "operating_asset") {
    return "operating_asset_id";
  }

  if (entityType === "company") {
    return "company_id";
  }

  return "source_id";
}

function toEntitySourceLink(
  row: PostgresEntitySourceLinkRow
): PostgresEntitySourceLink {
  return {
    ...row,
    source_published_date: row.source_published_date
      ? normalizeTimestamp(row.source_published_date).slice(0, 10)
      : null,
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
      s.url AS source_url,
      s.source_reference,
      s.source_type_code,
      st.label AS source_type_label,
      s.published_date AS source_published_date,
      s.visibility_code,
      s.credibility_status_code,
      es.evidence_type,
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

export async function getPostgresResearchOpsIssueReferenceData(): Promise<PostgresResearchOpsIssueReferenceData> {
  const [issueTypes, issueStatuses, assignableUsers] = await Promise.all([
    getPrismaClient().$queryRawUnsafe<PostgresResearchOpsIssueType[]>(
      `
      SELECT
        code,
        label,
        severity,
        description,
        sort_order,
        is_active
      FROM ref_research_issue_types
      ORDER BY sort_order ASC, label ASC
      `
    ),
    getPrismaClient().$queryRawUnsafe<PostgresResearchOpsIssueStatus[]>(
      `
      SELECT
        code,
        label,
        description,
        is_open,
        sort_order,
        is_active
      FROM ref_research_issue_statuses
      ORDER BY sort_order ASC, label ASC
      `
    ),
    getPrismaClient().$queryRawUnsafe<PostgresAssignableUser[]>(
      `
      SELECT
        user_id::text,
        name,
        email::text,
        role_code
      FROM app_users
      WHERE is_active = TRUE
      ORDER BY name ASC, email ASC
      `
    ),
  ]);

  return { issueTypes, issueStatuses, assignableUsers };
}

export async function listPostgresResearchOpsIssues(
  limit = 50,
  openOnly = true
): Promise<PostgresResearchOpsIssue[]> {
  const rows = await getPrismaClient().$queryRawUnsafe<ResearchOpsIssueRow[]>(
    `
    SELECT
      i.research_ops_issue_id::text,
      i.issue_type_code,
      it.label AS issue_type_label,
      i.issue_status_code,
      ist.label AS issue_status_label,
      i.severity,
      i.entity_type,
      COALESCE(
        i.project_id,
        i.operating_asset_id,
        i.company_id,
        i.source_id
      )::text AS entity_id,
      COALESCE(
        p.legacy_project_id,
        a.legacy_plant_id,
        c.legacy_company_id,
        s.source_reference
      ) AS legacy_id,
      COALESCE(
        p.project_name,
        a.asset_name,
        c.company_name,
        NULLIF(s.title, ''),
        NULLIF(s.url, ''),
        s.source_id::text
      ) AS name,
      COALESCE(
        p.country,
        a.country,
        c.headquarters_country,
        s.country
      ) AS country,
      i.linked_field,
      i.title,
      i.description,
      i.assigned_to_user_id::text,
      assignee.name AS assigned_to_name,
      creator.name AS created_by_name,
      resolver.name AS resolved_by_name,
      i.resolution_note,
      i.created_at,
      i.updated_at,
      i.resolved_at
    FROM research_ops_issues i
    INNER JOIN ref_research_issue_types it
      ON it.code = i.issue_type_code
    INNER JOIN ref_research_issue_statuses ist
      ON ist.code = i.issue_status_code
    LEFT JOIN projects p
      ON p.project_id = i.project_id
    LEFT JOIN operating_assets a
      ON a.operating_asset_id = i.operating_asset_id
    LEFT JOIN companies c
      ON c.company_id = i.company_id
    LEFT JOIN sources s
      ON s.source_id = i.source_id
    LEFT JOIN app_users assignee
      ON assignee.user_id = i.assigned_to_user_id
    LEFT JOIN app_users creator
      ON creator.user_id = i.created_by_user_id
    LEFT JOIN app_users resolver
      ON resolver.user_id = i.resolved_by_user_id
    WHERE ($2::boolean = FALSE OR ist.is_open = TRUE)
    ORDER BY i.updated_at DESC, i.created_at DESC
    LIMIT $1
    `,
    limit,
    openOnly
  );

  return rows.map(toResearchOpsIssue);
}

export async function listPostgresResearchOpsIssuesForEntity(
  entityType: PostgresResearchOpsIssueEntityType,
  entityId: string,
  limit = 20
): Promise<PostgresResearchOpsIssue[]> {
  const entityColumn = entityColumnForResearchIssue(entityType);
  const rows = await getPrismaClient().$queryRawUnsafe<ResearchOpsIssueRow[]>(
    `
    SELECT
      i.research_ops_issue_id::text,
      i.issue_type_code,
      it.label AS issue_type_label,
      i.issue_status_code,
      ist.label AS issue_status_label,
      i.severity,
      i.entity_type,
      COALESCE(
        i.project_id,
        i.operating_asset_id,
        i.company_id,
        i.source_id
      )::text AS entity_id,
      COALESCE(
        p.legacy_project_id,
        a.legacy_plant_id,
        c.legacy_company_id,
        s.source_reference
      ) AS legacy_id,
      COALESCE(
        p.project_name,
        a.asset_name,
        c.company_name,
        NULLIF(s.title, ''),
        NULLIF(s.url, ''),
        s.source_id::text
      ) AS name,
      COALESCE(
        p.country,
        a.country,
        c.headquarters_country,
        s.country
      ) AS country,
      i.linked_field,
      i.title,
      i.description,
      i.assigned_to_user_id::text,
      assignee.name AS assigned_to_name,
      creator.name AS created_by_name,
      resolver.name AS resolved_by_name,
      i.resolution_note,
      i.created_at,
      i.updated_at,
      i.resolved_at
    FROM research_ops_issues i
    INNER JOIN ref_research_issue_types it
      ON it.code = i.issue_type_code
    INNER JOIN ref_research_issue_statuses ist
      ON ist.code = i.issue_status_code
    LEFT JOIN projects p
      ON p.project_id = i.project_id
    LEFT JOIN operating_assets a
      ON a.operating_asset_id = i.operating_asset_id
    LEFT JOIN companies c
      ON c.company_id = i.company_id
    LEFT JOIN sources s
      ON s.source_id = i.source_id
    LEFT JOIN app_users assignee
      ON assignee.user_id = i.assigned_to_user_id
    LEFT JOIN app_users creator
      ON creator.user_id = i.created_by_user_id
    LEFT JOIN app_users resolver
      ON resolver.user_id = i.resolved_by_user_id
    WHERE ist.is_open = TRUE
      AND i.entity_type = $1
      AND i.${entityColumn} = $2::uuid
    ORDER BY i.updated_at DESC, i.created_at DESC
    LIMIT $3
    `,
    entityType,
    entityId,
    limit
  );

  return rows.map(toResearchOpsIssue);
}

async function researchIssueEntityExists(
  entityType: PostgresResearchOpsIssueEntityType,
  entityId: string
) {
  const table =
    entityType === "project"
      ? "projects"
      : entityType === "operating_asset"
        ? "operating_assets"
        : entityType === "company"
          ? "companies"
          : "sources";
  const column =
    entityType === "project"
      ? "project_id"
      : entityType === "operating_asset"
        ? "operating_asset_id"
        : entityType === "company"
          ? "company_id"
          : "source_id";

  const rows = await getPrismaClient().$queryRawUnsafe<Array<{ exists: boolean }>>(
    `SELECT EXISTS (SELECT 1 FROM ${table} WHERE ${column} = $1::uuid)`,
    entityId
  );

  return Boolean(rows[0]?.exists);
}

export async function createPostgresResearchOpsIssue(
  input: PostgresResearchOpsIssueMutationInput
): Promise<PostgresResearchOpsIssue | null> {
  if (!isUuid(input.entityId)) {
    return null;
  }

  const entityExists = await researchIssueEntityExists(
    input.entityType,
    input.entityId
  );

  if (!entityExists) {
    return null;
  }

  const prisma = getPrismaClient();
  const entityColumn = entityColumnForResearchIssue(input.entityType);
  const normalizedActorUserId = isUuid(input.actorUserId)
    ? input.actorUserId
    : null;
  const normalizedAssignToUserId = isUuid(input.assignToUserId)
    ? input.assignToUserId
    : null;

  const createdRows = await prisma.$queryRawUnsafe<
    Array<{ research_ops_issue_id: string }>
  >(
    `
    WITH issue_type AS (
      SELECT code, severity
      FROM ref_research_issue_types
      WHERE code = $1
        AND is_active = TRUE
      LIMIT 1
    ),
    actor AS (
      SELECT user_id
      FROM app_users
      WHERE user_id = $7::uuid
      LIMIT 1
    ),
    assignee AS (
      SELECT user_id
      FROM app_users
      WHERE user_id = $8::uuid
      LIMIT 1
    )
    INSERT INTO research_ops_issues (
      issue_type_code,
      severity,
      entity_type,
      ${entityColumn},
      linked_field,
      title,
      description,
      created_by_user_id,
      assigned_to_user_id
    )
    SELECT
      issue_type.code,
      issue_type.severity,
      $2,
      $3::uuid,
      $4,
      $5,
      $6,
      (SELECT user_id FROM actor),
      (SELECT user_id FROM assignee)
    FROM issue_type
    RETURNING research_ops_issue_id::text
    `,
    input.issueTypeCode,
    input.entityType,
    input.entityId,
    cleanOptionalText(input.linkedField),
    input.title,
    cleanOptionalText(input.description),
    normalizedActorUserId,
    normalizedAssignToUserId
  );

  const issueId = createdRows[0]?.research_ops_issue_id;

  if (!issueId) {
    return null;
  }

  await prisma.$executeRawUnsafe(
    `
    WITH actor AS (
      SELECT user_id
      FROM app_users
      WHERE user_id = $2::uuid
      LIMIT 1
    ),
    assignee AS (
      SELECT user_id
      FROM app_users
      WHERE user_id = $3::uuid
      LIMIT 1
    )
    INSERT INTO research_ops_issue_events (
      research_ops_issue_id,
      event_type,
      actor_user_id,
      next_status_code,
      next_assigned_to_user_id,
      event_note,
      changed_fields
    )
    VALUES (
      $1::uuid,
      'issue_created',
      (SELECT user_id FROM actor),
      'open',
      (SELECT user_id FROM assignee),
      $4,
      jsonb_build_object('issue_type_code', $5::text, 'entity_type', $6::text)
    )
    `,
    issueId,
    normalizedActorUserId,
    normalizedAssignToUserId,
    cleanOptionalText(input.description),
    input.issueTypeCode,
    input.entityType
  );

  const issues = await listPostgresResearchOpsIssues(100, false);
  return issues.find((issue) => issue.research_ops_issue_id === issueId) ?? null;
}

export async function updatePostgresResearchOpsIssueStatus(
  input: PostgresResearchOpsIssueStatusUpdateInput
): Promise<PostgresResearchOpsIssue | null> {
  if (!isUuid(input.issueId)) {
    return null;
  }

  const prisma = getPrismaClient();
  const normalizedActorUserId = isUuid(input.actorUserId)
    ? input.actorUserId
    : null;
  const normalizedAssignToUserId = isUuid(input.assignToUserId)
    ? input.assignToUserId
    : null;
  const shouldAssignUser = Boolean(normalizedAssignToUserId);
  const shouldClearAssignment = Boolean(input.clearAssignment);
  const existingRows = await prisma.$queryRawUnsafe<
    Array<{ issue_status_code: string; assigned_to_user_id: string | null }>
  >(
    `
    SELECT issue_status_code, assigned_to_user_id::text
    FROM research_ops_issues
    WHERE research_ops_issue_id = $1::uuid
    LIMIT 1
    `,
    input.issueId
  );
  const existing = existingRows[0];

  if (!existing) {
    return null;
  }

  const updatedRows = await prisma.$queryRawUnsafe<
    Array<{
      research_ops_issue_id: string;
      issue_status_code: string;
      resolved_at: string | Date | null;
    }>
  >(
    `
    WITH next_status AS (
      SELECT code, is_open
      FROM ref_research_issue_statuses
      WHERE code = $2
        AND is_active = TRUE
      LIMIT 1
    ),
    actor AS (
      SELECT user_id
      FROM app_users
      WHERE user_id = $3::uuid
      LIMIT 1
    ),
    assignee AS (
      SELECT user_id
      FROM app_users
      WHERE user_id = $7::uuid
      LIMIT 1
    )
    UPDATE research_ops_issues i
    SET
      issue_status_code = next_status.code,
      assigned_to_user_id = CASE
        WHEN $5::boolean THEN (SELECT user_id FROM assignee)
        WHEN $6::boolean THEN NULL
        ELSE i.assigned_to_user_id
      END,
      updated_at = now(),
      resolved_at = CASE WHEN next_status.is_open THEN NULL ELSE now() END,
      resolved_by_user_id = CASE
        WHEN next_status.is_open THEN NULL
        ELSE (SELECT user_id FROM actor)
      END,
      resolution_note = CASE WHEN next_status.is_open THEN NULL ELSE $4::text END
    FROM next_status
    WHERE i.research_ops_issue_id = $1::uuid
    RETURNING
      i.research_ops_issue_id::text,
      i.issue_status_code,
      i.resolved_at
    `,
    input.issueId,
    input.issueStatusCode,
    normalizedActorUserId,
    cleanOptionalText(input.eventNote),
    shouldAssignUser,
    shouldClearAssignment,
    normalizedAssignToUserId
  );

  if (!updatedRows[0]) {
    return null;
  }

  const assignmentChanged =
    shouldClearAssignment ||
    (shouldAssignUser && existing.assigned_to_user_id !== normalizedAssignToUserId);
  const statusChanged = existing.issue_status_code !== input.issueStatusCode;
  const nextAssignedToUserId = shouldClearAssignment
    ? null
    : shouldAssignUser
      ? normalizedAssignToUserId
      : existing.assigned_to_user_id;

  await prisma.$executeRawUnsafe(
    `
    WITH actor AS (
      SELECT user_id
      FROM app_users
      WHERE user_id = $3::uuid
      LIMIT 1
    )
    INSERT INTO research_ops_issue_events (
      research_ops_issue_id,
      event_type,
      actor_user_id,
      previous_status_code,
      next_status_code,
      previous_assigned_to_user_id,
      next_assigned_to_user_id,
      event_note,
      changed_fields
    )
    VALUES (
      $1::uuid,
      $7,
      (SELECT user_id FROM actor),
      $2,
      $4,
      $5::uuid,
      $8::uuid,
      $6,
      jsonb_build_object(
        'issue_status_code', $4::text,
        'assigned_to_user_id', $8::text
      )
    )
    `,
    input.issueId,
    existing.issue_status_code,
    normalizedActorUserId,
    input.issueStatusCode,
    existing.assigned_to_user_id,
    cleanOptionalText(input.eventNote),
    statusChanged
      ? "issue_status_changed"
      : assignmentChanged
        ? "issue_assignment_changed"
        : "issue_touched",
    nextAssignedToUserId
  );

  const issues = await listPostgresResearchOpsIssues(100, false);
  return (
    issues.find((issue) => issue.research_ops_issue_id === input.issueId) ?? null
  );
}

export async function getPostgresFieldSuggestionSummary(): Promise<PostgresFieldSuggestionSummary> {
  try {
    const rows = await getPrismaClient().$queryRawUnsafe<
      FieldSuggestionSummaryRow[]
    >(
      `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (
          WHERE f.suggestion_status_code NOT IN ('confirmed', 'rejected', 'superseded')
        )::int AS open,
        COUNT(*) FILTER (
          WHERE f.suggestion_status_code = 'confirmed'
            AND f.applied_at IS NULL
        )::int AS confirmed_unapplied,
        COUNT(*) FILTER (
          WHERE f.suggestion_status_code = 'confirmed'
            AND f.applied_at IS NULL
            AND (
              (
                f.entity_type = 'project'
                AND f.field_name = 'electric_capacity_mwe'
                AND EXISTS (
                  SELECT 1
                  FROM projects p
                  WHERE p.project_id = f.project_id
                    AND p.electric_capacity_mwe IS NULL
                )
              )
              OR (
                f.entity_type = 'project'
                AND f.field_name = 'thermal_capacity_mwth'
                AND EXISTS (
                  SELECT 1
                  FROM projects p
                  WHERE p.project_id = f.project_id
                    AND p.thermal_capacity_mwth IS NULL
                )
              )
              OR (
                f.entity_type = 'project'
                AND f.field_name = 'target_cod_year'
                AND EXISTS (
                  SELECT 1
                  FROM projects p
                  WHERE p.project_id = f.project_id
                    AND p.target_cod_year IS NULL
                )
              )
              OR (
                f.entity_type = 'operating_asset'
                AND f.field_name = 'electric_capacity_mwe'
                AND EXISTS (
                  SELECT 1
                  FROM operating_assets a
                  WHERE a.operating_asset_id = f.operating_asset_id
                    AND a.electric_capacity_mwe IS NULL
                )
              )
              OR (
                f.entity_type = 'operating_asset'
                AND f.field_name = 'thermal_capacity_mwth'
                AND EXISTS (
                  SELECT 1
                  FROM operating_assets a
                  WHERE a.operating_asset_id = f.operating_asset_id
                    AND a.thermal_capacity_mwth IS NULL
                )
              )
            )
        )::int AS apply_ready,
        COUNT(*) FILTER (
          WHERE f.applied_at IS NOT NULL
        )::int AS applied,
        COUNT(*) FILTER (
          WHERE f.suggestion_status_code = 'suggested_high_confidence'
        )::int AS high_confidence,
        COUNT(*) FILTER (
          WHERE f.suggestion_status_code = 'suggested_medium_confidence'
        )::int AS medium_confidence,
        COUNT(*) FILTER (
          WHERE f.suggestion_status_code = 'suggested_low_confidence'
        )::int AS low_confidence,
        COUNT(*) FILTER (
          WHERE f.suggestion_status_code = 'confirmed'
        )::int AS confirmed,
        COUNT(*) FILTER (
          WHERE f.suggestion_status_code = 'rejected'
        )::int AS rejected,
        COUNT(*) FILTER (
          WHERE f.suggestion_status_code = 'superseded'
        )::int AS superseded
      FROM field_suggestion_candidates f
      `
    );
    const row = rows[0];

    return {
      total: toNumber(row?.total),
      open: toNumber(row?.open),
      confirmedUnapplied: toNumber(row?.confirmed_unapplied),
      applyReady: toNumber(row?.apply_ready),
      applied: toNumber(row?.applied),
      highConfidence: toNumber(row?.high_confidence),
      mediumConfidence: toNumber(row?.medium_confidence),
      lowConfidence: toNumber(row?.low_confidence),
      confirmed: toNumber(row?.confirmed),
      rejected: toNumber(row?.rejected),
      superseded: toNumber(row?.superseded),
    };
  } catch (error) {
    if (isMissingRelationError(error, "field_suggestion_candidates")) {
      return {
        total: 0,
        open: 0,
        confirmedUnapplied: 0,
        applyReady: 0,
        applied: 0,
        highConfidence: 0,
        mediumConfidence: 0,
        lowConfidence: 0,
        confirmed: 0,
        rejected: 0,
        superseded: 0,
      };
    }

    throw error;
  }
}

export async function listPostgresFieldSuggestionCandidates(
  limit = 12
): Promise<PostgresFieldSuggestionCandidate[]> {
  try {
    const rows = await getPrismaClient().$queryRawUnsafe<
      FieldSuggestionCandidateRow[]
    >(
      `
      SELECT
        f.field_suggestion_candidate_id::text,
        f.entity_type,
        COALESCE(
          f.project_id,
          f.operating_asset_id,
          f.company_id
        )::text AS entity_id,
        COALESCE(
          p.project_name,
          a.asset_name,
          c.company_name,
          'Unknown record'
        ) AS entity_name,
        COALESCE(
          p.country,
          a.country,
          c.headquarters_country
        ) AS country,
        f.field_name,
        f.current_value,
        f.suggested_value,
        f.source_id::text,
        s.title AS source_title,
        s.source_reference,
        f.confidence_score::float8 AS confidence_score,
        f.suggestion_status_code,
        status.label AS suggestion_status_label,
        f.suggestion_reason,
        f.generated_by,
        f.generated_at,
        f.applied_at,
        f.applied_audit_event_id::text,
        f.updated_at
      FROM field_suggestion_candidates f
      LEFT JOIN projects p
        ON p.project_id = f.project_id
      LEFT JOIN operating_assets a
        ON a.operating_asset_id = f.operating_asset_id
      LEFT JOIN companies c
        ON c.company_id = f.company_id
      LEFT JOIN sources s
        ON s.source_id = f.source_id
      LEFT JOIN ref_field_suggestion_statuses status
        ON status.code = f.suggestion_status_code
      ORDER BY
        CASE f.suggestion_status_code
          WHEN 'suggested_high_confidence' THEN 1
          WHEN 'suggested_medium_confidence' THEN 2
          WHEN 'suggested_low_confidence' THEN 3
          WHEN 'needs_review' THEN 4
          WHEN 'confirmed' THEN 8
          WHEN 'rejected' THEN 9
          WHEN 'superseded' THEN 10
          ELSE 7
        END,
        f.confidence_score DESC,
        f.generated_at DESC
      LIMIT $1
      `,
      Math.min(Math.max(limit, 1), 100)
    );

    return rows.map(toFieldSuggestionCandidate);
  } catch (error) {
    if (isMissingRelationError(error, "field_suggestion_candidates")) {
      return [];
    }

    throw error;
  }
}

function fieldSuggestionEntityColumn(entityType: PostgresReviewEntityType) {
  if (entityType === "project") {
    return "project_id";
  }

  if (entityType === "operating_asset") {
    return "operating_asset_id";
  }

  return "company_id";
}

export async function listPostgresFieldSuggestionCandidatesForEntity(
  entityType: PostgresReviewEntityType,
  entityId: string,
  limit = 25
): Promise<PostgresFieldSuggestionCandidate[]> {
  if (!isUuid(entityId)) {
    return [];
  }

  const entityColumn = fieldSuggestionEntityColumn(entityType);

  try {
    const rows = await getPrismaClient().$queryRawUnsafe<
      FieldSuggestionCandidateRow[]
    >(
      `
      SELECT
        f.field_suggestion_candidate_id::text,
        f.entity_type,
        COALESCE(
          f.project_id,
          f.operating_asset_id,
          f.company_id
        )::text AS entity_id,
        COALESCE(
          p.project_name,
          a.asset_name,
          c.company_name,
          'Unknown record'
        ) AS entity_name,
        COALESCE(
          p.country,
          a.country,
          c.headquarters_country
        ) AS country,
        f.field_name,
        f.current_value,
        f.suggested_value,
        f.source_id::text,
        s.title AS source_title,
        s.source_reference,
        f.confidence_score::float8 AS confidence_score,
        f.suggestion_status_code,
        status.label AS suggestion_status_label,
        f.suggestion_reason,
        f.generated_by,
        f.generated_at,
        f.applied_at,
        f.applied_audit_event_id::text,
        f.updated_at
      FROM field_suggestion_candidates f
      LEFT JOIN projects p
        ON p.project_id = f.project_id
      LEFT JOIN operating_assets a
        ON a.operating_asset_id = f.operating_asset_id
      LEFT JOIN companies c
        ON c.company_id = f.company_id
      LEFT JOIN sources s
        ON s.source_id = f.source_id
      LEFT JOIN ref_field_suggestion_statuses status
        ON status.code = f.suggestion_status_code
      WHERE f.entity_type = $1
        AND f.${entityColumn} = $2::uuid
      ORDER BY
        CASE f.suggestion_status_code
          WHEN 'suggested_high_confidence' THEN 1
          WHEN 'suggested_medium_confidence' THEN 2
          WHEN 'suggested_low_confidence' THEN 3
          WHEN 'needs_review' THEN 4
          WHEN 'confirmed' THEN 8
          WHEN 'rejected' THEN 9
          WHEN 'superseded' THEN 10
          ELSE 7
        END,
        f.confidence_score DESC,
        f.generated_at DESC
      LIMIT $3
      `,
      entityType,
      entityId,
      Math.min(Math.max(limit, 1), 100)
    );

    return rows.map(toFieldSuggestionCandidate);
  } catch (error) {
    if (isMissingRelationError(error, "field_suggestion_candidates")) {
      return [];
    }

    throw error;
  }
}

export async function listPostgresFieldSuggestionCandidatesForSource(
  sourceId: string,
  limit = 25
): Promise<PostgresFieldSuggestionCandidate[]> {
  if (!isUuid(sourceId)) {
    return [];
  }

  try {
    const rows = await getPrismaClient().$queryRawUnsafe<
      FieldSuggestionCandidateRow[]
    >(
      `
      SELECT
        f.field_suggestion_candidate_id::text,
        f.entity_type,
        COALESCE(
          f.project_id,
          f.operating_asset_id,
          f.company_id
        )::text AS entity_id,
        COALESCE(
          p.project_name,
          a.asset_name,
          c.company_name,
          'Unknown record'
        ) AS entity_name,
        COALESCE(
          p.country,
          a.country,
          c.headquarters_country
        ) AS country,
        f.field_name,
        f.current_value,
        f.suggested_value,
        f.source_id::text,
        s.title AS source_title,
        s.source_reference,
        f.confidence_score::float8 AS confidence_score,
        f.suggestion_status_code,
        status.label AS suggestion_status_label,
        f.suggestion_reason,
        f.generated_by,
        f.generated_at,
        f.applied_at,
        f.applied_audit_event_id::text,
        f.updated_at
      FROM field_suggestion_candidates f
      LEFT JOIN projects p
        ON p.project_id = f.project_id
      LEFT JOIN operating_assets a
        ON a.operating_asset_id = f.operating_asset_id
      LEFT JOIN companies c
        ON c.company_id = f.company_id
      LEFT JOIN sources s
        ON s.source_id = f.source_id
      LEFT JOIN ref_field_suggestion_statuses status
        ON status.code = f.suggestion_status_code
      WHERE f.source_id = $1::uuid
      ORDER BY
        CASE f.suggestion_status_code
          WHEN 'suggested_high_confidence' THEN 1
          WHEN 'suggested_medium_confidence' THEN 2
          WHEN 'suggested_low_confidence' THEN 3
          WHEN 'needs_review' THEN 4
          WHEN 'confirmed' THEN 8
          WHEN 'rejected' THEN 9
          WHEN 'superseded' THEN 10
          ELSE 7
        END,
        f.confidence_score DESC,
        f.generated_at DESC
      LIMIT $2
      `,
      sourceId,
      Math.min(Math.max(limit, 1), 100)
    );

    return rows.map(toFieldSuggestionCandidate);
  } catch (error) {
    if (isMissingRelationError(error, "field_suggestion_candidates")) {
      return [];
    }

    throw error;
  }
}

async function setPostgresFieldSuggestionCandidateStatus(
  candidateId: string,
  statusCode: "confirmed" | "rejected" | "needs_review",
  actorUserId?: string | null
): Promise<FieldSuggestionCandidateUpdateRow | null> {
  const normalizedActorUserId = isUuid(actorUserId) ? actorUserId : null;
  const rows = await getPrismaClient().$queryRawUnsafe<
    FieldSuggestionCandidateUpdateRow[]
  >(
    `
    WITH reviewer AS (
      SELECT user_id
      FROM app_users
      WHERE user_id = $3::uuid
      LIMIT 1
    )
    UPDATE field_suggestion_candidates f
    SET
      suggestion_status_code = $2,
      reviewed_by_user_id = CASE
        WHEN $2 IN ('confirmed', 'rejected')
          THEN COALESCE((SELECT user_id FROM reviewer), f.reviewed_by_user_id)
        ELSE NULL
      END,
      reviewed_at = CASE
        WHEN $2 IN ('confirmed', 'rejected') THEN now()
        ELSE NULL
      END,
      updated_at = now()
    WHERE f.field_suggestion_candidate_id = $1::uuid
      AND f.applied_at IS NULL
      AND f.suggestion_status_code != 'superseded'
      AND f.suggestion_status_code != $2
    RETURNING f.field_suggestion_candidate_id::text
    `,
    candidateId,
    statusCode,
    normalizedActorUserId
  );

  return rows[0] ?? null;
}

function asNormalizedValueRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, "").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseSuggestedFieldValue(
  row: FieldSuggestionApplyCandidateRow,
  fieldConfig: FieldSuggestionApplyFieldConfig
) {
  const normalizedValue = asNormalizedValueRecord(row.normalized_value);

  if (fieldConfig.valueType === "year") {
    const normalizedYear = parseFiniteNumber(normalizedValue.year);
    const textYear = parseFiniteNumber(row.suggested_value);
    const year = normalizedYear ?? textYear;

    if (year === null || !Number.isInteger(year) || year < 1900 || year > 2100) {
      return null;
    }

    return year;
  }

  return (
    parseFiniteNumber(normalizedValue.value) ??
    parseFiniteNumber(row.suggested_value)
  );
}

async function applyPostgresFieldSuggestionCandidate(
  candidateId: string,
  actorUserId?: string | null
): Promise<FieldSuggestionApplyUpdateRow | null> {
  const candidateRows = await getPrismaClient().$queryRawUnsafe<
    FieldSuggestionApplyCandidateRow[]
  >(
    `
    SELECT
      f.field_suggestion_candidate_id::text,
      f.entity_type,
      f.field_name,
      f.suggested_value,
      f.normalized_value,
      f.suggestion_reason,
      f.source_id::text,
      s.source_reference,
      f.confidence_score::float8 AS confidence_score,
      f.generated_by
    FROM field_suggestion_candidates f
    LEFT JOIN sources s
      ON s.source_id = f.source_id
    WHERE f.field_suggestion_candidate_id = $1::uuid
      AND f.suggestion_status_code = 'confirmed'
      AND f.applied_at IS NULL
    LIMIT 1
    `,
    candidateId
  );
  const candidate = candidateRows[0];

  if (!candidate) {
    return null;
  }

  const targetConfig = fieldSuggestionApplyTargets[candidate.entity_type];
  const fieldConfig = targetConfig?.fields[candidate.field_name];

  if (!targetConfig || !fieldConfig) {
    return null;
  }

  const parsedValue = parseSuggestedFieldValue(candidate, fieldConfig);

  if (parsedValue === null) {
    return null;
  }

  const normalizedActorUserId = isUuid(actorUserId) ? actorUserId : null;
  const eventNote = [
    "Applied confirmed field suggestion.",
    candidate.source_reference ? `Source: ${candidate.source_reference}.` : "",
    candidate.suggestion_reason ? `Reason: ${candidate.suggestion_reason}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const rows = await getPrismaClient().$queryRawUnsafe<
    FieldSuggestionApplyUpdateRow[]
  >(
    `
    WITH actor AS (
      SELECT user_id
      FROM app_users
      WHERE user_id = $4::uuid
      LIMIT 1
    ),
    candidate AS (
      SELECT *
      FROM field_suggestion_candidates
      WHERE field_suggestion_candidate_id = $1::uuid
        AND entity_type = $5
        AND field_name = $6
        AND suggestion_status_code = 'confirmed'
        AND applied_at IS NULL
      FOR UPDATE
    ),
    current_record AS (
      SELECT
        target.${targetConfig.idColumn},
        target.${candidate.field_name}::text AS previous_value,
        target.review_status_code AS previous_review_status_code
      FROM ${targetConfig.tableName} target
      INNER JOIN candidate
        ON candidate.${targetConfig.idColumn} = target.${targetConfig.idColumn}
      WHERE target.${candidate.field_name} IS NULL
      FOR UPDATE
    ),
    updated_record AS (
      UPDATE ${targetConfig.tableName} target
      SET
        ${candidate.field_name} = $2::${fieldConfig.fieldCast},
        review_status_code = CASE
          WHEN current_record.previous_review_status_code IN ('approved', 'export_ready')
            THEN 'needs_update'
          ELSE target.review_status_code
        END,
        last_updated_by_user_id = COALESCE(
          (SELECT user_id FROM actor),
          target.last_updated_by_user_id
        ),
        updated_at = now()
      FROM current_record
      WHERE target.${targetConfig.idColumn} = current_record.${targetConfig.idColumn}
      RETURNING
        target.${targetConfig.idColumn}::text AS entity_id,
        current_record.previous_value,
        target.${candidate.field_name}::text AS next_value,
        current_record.previous_review_status_code,
        target.review_status_code AS next_review_status_code
    ),
    audit AS (
      INSERT INTO audit_events (
        entity_type,
        entity_id,
        event_type,
        previous_review_status_code,
        next_review_status_code,
        actor_user_id,
        event_note,
        changed_fields
      )
      SELECT
        $5,
        entity_id::uuid,
        'field_suggestion_applied',
        previous_review_status_code,
        next_review_status_code,
        (SELECT user_id FROM actor),
        $3,
        jsonb_build_object(
          'field_name', $6::text,
          'previous_value', previous_value,
          'next_value', next_value,
          'field_suggestion_candidate_id', $1::text,
          'source_id', candidate.source_id::text,
          'confidence_score', candidate.confidence_score::text,
          'generated_by', candidate.generated_by
        )
      FROM updated_record
      CROSS JOIN candidate
      RETURNING audit_event_id
    )
    UPDATE field_suggestion_candidates f
    SET
      applied_at = now(),
      applied_audit_event_id = (SELECT audit_event_id FROM audit),
      updated_at = now()
    WHERE f.field_suggestion_candidate_id = $1::uuid
      AND EXISTS (SELECT 1 FROM audit)
    RETURNING
      f.field_suggestion_candidate_id::text,
      f.applied_audit_event_id::text
    `,
    candidateId,
    parsedValue,
    cleanOptionalText(eventNote),
    normalizedActorUserId,
    candidate.entity_type,
    candidate.field_name
  );

  return rows[0] ?? null;
}

export async function updatePostgresFieldSuggestionCandidates({
  candidateIds,
  action,
  actorUserId,
}: {
  candidateIds: string[];
  action: PostgresFieldSuggestionAction;
  actorUserId?: string | null;
}): Promise<PostgresFieldSuggestionBulkResult> {
  const validCandidateIds = [...new Set(candidateIds.filter(isUuid))];
  const result: PostgresFieldSuggestionBulkResult = {
    requested: validCandidateIds.length,
    updated: 0,
  };

  if (action === "apply") {
    result.applied = 0;
    result.skipped = 0;

    try {
      for (const candidateId of validCandidateIds) {
        const row = await applyPostgresFieldSuggestionCandidate(
          candidateId,
          actorUserId
        );

        if (row) {
          result.applied += 1;
          result.updated += 1;
        } else {
          result.skipped += 1;
        }
      }
    } catch (error) {
      if (isMissingRelationError(error, "field_suggestion_candidates")) {
        return result;
      }

      throw error;
    }

    return result;
  }

  const statusCode =
    action === "confirm"
      ? "confirmed"
      : action === "reject"
        ? "rejected"
        : "needs_review";

  try {
    for (const candidateId of validCandidateIds) {
      const row = await setPostgresFieldSuggestionCandidateStatus(
        candidateId,
        statusCode,
        actorUserId
      );

      if (row) {
        result.updated += 1;
      }
    }
  } catch (error) {
    if (isMissingRelationError(error, "field_suggestion_candidates")) {
      return result;
    }

    throw error;
  }

  return result;
}

export async function getPostgresResearchOpsDashboard(
  itemLimit = 50
): Promise<PostgresResearchOpsDashboard> {
  const [queues, persistentIssues, recentEdits] = await Promise.all([
    Promise.all(
      researchOpsQueueDefinitions.map((definition) =>
        loadResearchOpsQueue(definition, itemLimit)
      )
    ),
    listPostgresResearchOpsIssues(50),
    listPostgresResearchOpsRecentEdits(20),
  ]);
  const generatedIssueCount = queues.reduce((sum, queue) => sum + queue.count, 0);

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      openIssues: generatedIssueCount + persistentIssues.length,
      criticalIssues: queues
        .filter((queue) => queue.severity === "critical")
        .reduce((sum, queue) => sum + queue.count, 0) +
        persistentIssues.filter((issue) => issue.severity === "critical").length,
      importantIssues: queues
        .filter((queue) => queue.severity === "important")
        .reduce((sum, queue) => sum + queue.count, 0) +
        persistentIssues.filter((issue) => issue.severity === "important").length,
      workflowIssues: queues
        .filter((queue) => queue.severity === "workflow")
        .reduce((sum, queue) => sum + queue.count, 0) +
        persistentIssues.filter((issue) => issue.severity === "workflow").length,
      persistentIssues: persistentIssues.length,
    },
    queues,
    persistentIssues,
    recentEdits,
  };
}
