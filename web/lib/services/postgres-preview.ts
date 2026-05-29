import { getPrismaClient } from "@/lib/db/prisma";
import type { Prisma } from "@/prisma/generated/client/client";

type NullableNumeric = number | string | { toNumber: () => number } | null;

export type PostgresPreviewSummary = {
  projectCount: number;
  operatingAssetCount: number;
  companyCount: number;
  directUseComponentCount: number;
  companyProjectLinkCount: number;
  companyAssetLinkCount: number;
};

export type PostgresCountryMarketSummary = {
  country_id: string | null;
  country: string;
  iso3: string | null;
  tge_region: string | null;
  wb_region: string | null;
  project_count: number;
  active_project_count: number;
  operating_asset_count: number;
  operating_asset_active_count: number;
  company_count: number;
  project_pipeline_mwe: number;
  project_thermal_mwth: number;
  operating_installed_mwe: number;
  operating_running_mwe: number;
  operating_thermal_mwth: number;
  direct_use_project_count: number;
  direct_use_asset_count: number;
  approved_record_count: number;
  draft_record_count: number;
  missing_source_count: number;
  latest_update_at: string;
};

export type PostgresReplacementReadinessEntity = {
  entity_type: "projects" | "operating_assets" | "companies";
  label: string;
  record_count: number;
  approved_or_export_ready_count: number;
  draft_or_validation_count: number;
  needs_update_count: number;
  missing_source_count: number;
  missing_country_count: number;
  canonical_country_linked_count: number;
  missing_country_reference_count: number;
  missing_use_or_status_count: number;
  missing_capacity_count: number;
  missing_company_link_count: number;
  missing_coordinates_count: number;
  open_issue_count: number;
  critical_issue_count: number;
  latest_update_at: string;
};

export type PostgresReplacementMigrationSummary = {
  run_id: string;
  run_label: string;
  status: string;
  source_database_file_name: string | null;
  source_database_size_bytes: number;
  import_completed_at: string | null;
  transform_completed_at: string | null;
  validation_completed_at: string | null;
  created_at: string;
  validation_check_count: number;
  validation_pass_count: number;
  validation_fail_count: number;
  warning_count: number;
  error_warning_count: number;
};

export type PostgresReplacementReadiness = {
  entities: PostgresReplacementReadinessEntity[];
  latestMigrationRun: PostgresReplacementMigrationSummary | null;
};

export type PostgresPreviewMapGroup = {
  group_name: string;
  representative_id: string;
  country: string | null;
  region: string | null;
  wb_region?: string | null;
  latitude: number;
  longitude: number;
  record_count: number;
  total_capacity_mw: number | null;
  potential_min_mw: number | null;
  phase: string | null;
  type: "plant" | "project";
};

export type PostgresPreviewAnalysisBucket = {
  bucket_code: string;
  record_count: number;
  electric_capacity_mwe: number;
  thermal_capacity_mwth: number;
};

export type PostgresPreviewAnalysisSummary = {
  projectLifecycle: PostgresPreviewAnalysisBucket[];
  operatingAssetStatus: PostgresPreviewAnalysisBucket[];
  useTypeBreakdown: PostgresPreviewAnalysisBucket[];
  topCountries: PostgresCountryMarketSummary[];
};

export type PostgresPreviewGeographyFilters = {
  country?: string;
  tgeRegion?: string;
  wbRegion?: string;
};

export type PostgresPreviewProject = {
  project_id: string;
  legacy_project_id: string | null;
  project_name: string;
  primary_use_type_code: string;
  lifecycle_phase_code: string;
  country: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  potential_min_mwe: number | null;
  potential_max_mwe: number | null;
  electric_capacity_mwe: number | null;
  thermal_capacity_mwth: number | null;
  annual_power_generation_gwhe: number | null;
  annual_heat_supply_gwhth: number | null;
  annual_cooling_supply_gwhc: number | null;
  review_status_code: string;
  research_status: string | null;
  source_count: number;
  company_link_count: number;
  open_issue_count: number;
  critical_issue_count: number;
};

export type PostgresPreviewOperatingAsset = {
  operating_asset_id: string;
  legacy_plant_id: string | null;
  asset_name: string;
  primary_use_type_code: string;
  lifecycle_phase_code: string;
  country: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  electric_capacity_mwe: number | null;
  electric_capacity_running_mwe: number | null;
  thermal_capacity_mwth: number | null;
  annual_power_generation_gwhe: number | null;
  annual_heat_supply_gwhth: number | null;
  annual_cooling_supply_gwhc: number | null;
  cod_year: number | null;
  review_status_code: string;
  research_status: string | null;
  source_count: number;
  company_link_count: number;
  open_issue_count: number;
  critical_issue_count: number;
};

export type PostgresPreviewCompany = {
  company_id: string;
  legacy_company_id: string | null;
  company_name: string;
  entity_type_code: string | null;
  company_type_primary_code: string | null;
  headquarters_country: string | null;
  website_url: string | null;
  geothermal_focus: string | null;
  review_status_code: string;
  research_status: string | null;
  source_count: number;
  project_link_count: number;
  operating_asset_link_count: number;
  open_issue_count: number;
  critical_issue_count: number;
};

export type PostgresPreviewProjectListFilters = {
  search?: string;
  country?: string;
  tgeRegion?: string;
  wbRegion?: string;
  countryReferenceIds?: string[];
  reviewStatus?: string;
  useType?: string;
  status?: string;
  missing?: string;
  researchIssueEntityIds?: string[];
};

export type PostgresPreviewOperatingAssetListFilters = {
  search?: string;
  country?: string;
  tgeRegion?: string;
  wbRegion?: string;
  countryReferenceIds?: string[];
  reviewStatus?: string;
  useType?: string;
  status?: string;
  missing?: string;
  researchIssueEntityIds?: string[];
};

export type PostgresPreviewCompanyListFilters = {
  search?: string;
  country?: string;
  tgeRegion?: string;
  wbRegion?: string;
  countryReferenceIds?: string[];
  reviewStatus?: string;
  companyType?: string;
  missing?: string;
  researchIssueEntityIds?: string[];
};

export type PostgresPreviewListFacets = {
  countries: string[];
  tgeRegions: string[];
  wbRegions: string[];
  reviewStatuses: string[];
  useTypes: string[];
  statuses: string[];
  companyTypes: string[];
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
  country_id: string | null;
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
  country_id: string | null;
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
  headquarters_country_id: string | null;
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

export type PostgresCountryReference = {
  country_id: string;
  country_name: string;
  iso3: string;
  wb_region: string;
  tge_region: string;
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
  countries: PostgresCountryReference[];
};

export type PostgresProjectMutationInput = {
  project_name: string;
  project_group?: string | null;
  primary_use_type_code: string;
  lifecycle_phase_code: string;
  location_text?: string | null;
  country_id?: string | null;
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
  country_id?: string | null;
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
  headquarters_country_id?: string | null;
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
  relationship_source_count: number;
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
  relationship_source_count: number;
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
  relationship_source_count: number;
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

export type PostgresRelationshipSourceTargetType =
  | "company_project_link"
  | "company_operating_asset_link"
  | "company_relationship";

export type PostgresRelationshipSourceMutationInput = {
  source_id: string;
  target_type: PostgresRelationshipSourceTargetType;
  target_id: string;
  evidence_type?: string | null;
  linked_field?: string | null;
  claim_text?: string | null;
  extracted_value?: string | null;
  evidence_note?: string | null;
  confidence_status_code: string;
  is_primary_evidence?: boolean;
  reviewedByUserId?: string | null;
};

export type PostgresRelationshipSource = {
  relationship_source_id: string;
  source_id: string;
  target_type: PostgresRelationshipSourceTargetType;
  target_id: string;
  evidence_type: string | null;
  linked_field: string | null;
  claim_text: string | null;
  extracted_value: string | null;
  evidence_note: string | null;
  confidence_status_code: string;
  is_primary_evidence: boolean;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
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
  latest_activity_type: string | null;
  latest_activity_note: string | null;
  latest_changed_field_count: number;
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
  latest_changed_field_count: number | bigint | string | null;
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

type CountryMarketSummaryRow = Omit<
  PostgresCountryMarketSummary,
  "latest_update_at"
> & {
  latest_update_at: string | Date;
};

type ReplacementReadinessEntityRow = Omit<
  PostgresReplacementReadinessEntity,
  "latest_update_at"
> & {
  latest_update_at: string | Date;
};

type ReplacementMigrationSummaryRow = Omit<
  PostgresReplacementMigrationSummary,
  | "import_completed_at"
  | "transform_completed_at"
  | "validation_completed_at"
  | "created_at"
> & {
  import_completed_at: string | Date | null;
  transform_completed_at: string | Date | null;
  validation_completed_at: string | Date | null;
  created_at: string | Date;
};

type PostgresPreviewMapGroupRow = Omit<
  PostgresPreviewMapGroup,
  | "latitude"
  | "longitude"
  | "record_count"
  | "total_capacity_mw"
  | "potential_min_mw"
> & {
  latitude: number | string;
  longitude: number | string;
  record_count: number | bigint | string;
  total_capacity_mw: number | string | null;
  potential_min_mw: number | string | null;
};

type PostgresPreviewAnalysisBucketRow = {
  bucket_group: "project_lifecycle" | "asset_status" | "use_type";
  bucket_code: string | null;
  record_count: number | bigint | string;
  electric_capacity_mwe: number | string | null;
  thermal_capacity_mwth: number | string | null;
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

type RelationshipSourceIdRow = {
  relationship_source_id: string;
};

type RelationshipSourceRow = Omit<
  PostgresRelationshipSource,
  "reviewed_at" | "created_at" | "updated_at"
> & {
  reviewed_at: string | Date | null;
  created_at: string | Date;
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
    description: "Project and plant records missing a country.",
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
    description: "Project and plant records still using unknown lifecycle placeholders.",
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
    description: "Project and plant records without power/direct-use/hybrid classification.",
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
    description: "Project and plant records without structured company-role links.",
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
    description: "Project and plant records that cannot be mapped yet.",
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
    description: "Project and plant records without any structured capacity or output value.",
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

export async function getPostgresReplacementReadiness(): Promise<PostgresReplacementReadiness> {
  const prisma = getPrismaClient();
  const rows = await prisma.$queryRawUnsafe<
    ReplacementReadinessEntityRow[]
  >(`
    WITH open_issues AS (
      SELECT
        entity_type,
        project_id,
        operating_asset_id,
        company_id,
        count(*)::int AS open_issue_count,
        count(*) FILTER (WHERE severity = 'critical')::int AS critical_issue_count
      FROM research_ops_issues
      WHERE issue_status_code NOT IN ('resolved', 'dismissed')
      GROUP BY entity_type, project_id, operating_asset_id, company_id
    )
    SELECT
      'projects'::text AS entity_type,
      'Projects'::text AS label,
      count(*)::int AS record_count,
      count(*) FILTER (
        WHERE p.review_status_code IN ('approved', 'export_ready')
      )::int AS approved_or_export_ready_count,
      count(*) FILTER (
        WHERE p.review_status_code IN ('draft', 'validation')
      )::int AS draft_or_validation_count,
      count(*) FILTER (WHERE p.review_status_code = 'needs_update')::int
        AS needs_update_count,
      count(*) FILTER (
        WHERE NOT EXISTS (
          SELECT 1
          FROM entity_sources es
          WHERE es.project_id = p.project_id
        )
      )::int AS missing_source_count,
      count(*) FILTER (
        WHERE p.country IS NULL OR trim(p.country) = ''
      )::int AS missing_country_count,
      count(*) FILTER (WHERE p.country_id IS NOT NULL)::int
        AS canonical_country_linked_count,
      count(*) FILTER (
        WHERE p.country_id IS NULL
          AND p.country IS NOT NULL
          AND trim(p.country) <> ''
      )::int AS missing_country_reference_count,
      count(*) FILTER (
        WHERE COALESCE(p.primary_use_type_code, '') IN ('', 'unknown')
          OR COALESCE(p.lifecycle_phase_code, '') IN ('', 'unknown')
      )::int AS missing_use_or_status_count,
      count(*) FILTER (
        WHERE p.potential_min_mwe IS NULL
          AND p.potential_max_mwe IS NULL
          AND p.electric_capacity_mwe IS NULL
          AND p.thermal_capacity_mwth IS NULL
          AND p.annual_heat_supply_gwhth IS NULL
          AND p.annual_cooling_supply_gwhc IS NULL
      )::int AS missing_capacity_count,
      count(*) FILTER (
        WHERE NOT EXISTS (
          SELECT 1
          FROM company_project_links cpl
          WHERE cpl.project_id = p.project_id
        )
      )::int AS missing_company_link_count,
      count(*) FILTER (
        WHERE p.latitude IS NULL OR p.longitude IS NULL
      )::int AS missing_coordinates_count,
      COALESCE(sum(oi.open_issue_count), 0)::int AS open_issue_count,
      COALESCE(sum(oi.critical_issue_count), 0)::int AS critical_issue_count,
      COALESCE(max(p.updated_at), '1970-01-01'::timestamp) AS latest_update_at
    FROM projects p
    LEFT JOIN open_issues oi
      ON oi.entity_type = 'project'
      AND oi.project_id = p.project_id

    UNION ALL

    SELECT
      'operating_assets'::text AS entity_type,
      'Plants'::text AS label,
      count(*)::int AS record_count,
      count(*) FILTER (
        WHERE a.review_status_code IN ('approved', 'export_ready')
      )::int AS approved_or_export_ready_count,
      count(*) FILTER (
        WHERE a.review_status_code IN ('draft', 'validation')
      )::int AS draft_or_validation_count,
      count(*) FILTER (WHERE a.review_status_code = 'needs_update')::int
        AS needs_update_count,
      count(*) FILTER (
        WHERE NOT EXISTS (
          SELECT 1
          FROM entity_sources es
          WHERE es.operating_asset_id = a.operating_asset_id
        )
      )::int AS missing_source_count,
      count(*) FILTER (
        WHERE a.country IS NULL OR trim(a.country) = ''
      )::int AS missing_country_count,
      count(*) FILTER (WHERE a.country_id IS NOT NULL)::int
        AS canonical_country_linked_count,
      count(*) FILTER (
        WHERE a.country_id IS NULL
          AND a.country IS NOT NULL
          AND trim(a.country) <> ''
      )::int AS missing_country_reference_count,
      count(*) FILTER (
        WHERE COALESCE(a.primary_use_type_code, '') IN ('', 'unknown')
          OR COALESCE(a.lifecycle_phase_code, '') IN ('', 'unknown')
      )::int AS missing_use_or_status_count,
      count(*) FILTER (
        WHERE a.electric_capacity_mwe IS NULL
          AND a.electric_capacity_running_mwe IS NULL
          AND a.thermal_capacity_mwth IS NULL
          AND a.installed_heat_pump_capacity_mwth IS NULL
          AND a.annual_heat_supply_gwhth IS NULL
          AND a.annual_cooling_supply_gwhc IS NULL
      )::int AS missing_capacity_count,
      count(*) FILTER (
        WHERE NOT EXISTS (
          SELECT 1
          FROM company_operating_asset_links coal
          WHERE coal.operating_asset_id = a.operating_asset_id
        )
      )::int AS missing_company_link_count,
      count(*) FILTER (
        WHERE a.latitude IS NULL OR a.longitude IS NULL
      )::int AS missing_coordinates_count,
      COALESCE(sum(oi.open_issue_count), 0)::int AS open_issue_count,
      COALESCE(sum(oi.critical_issue_count), 0)::int AS critical_issue_count,
      COALESCE(max(a.updated_at), '1970-01-01'::timestamp) AS latest_update_at
    FROM operating_assets a
    LEFT JOIN open_issues oi
      ON oi.entity_type = 'operating_asset'
      AND oi.operating_asset_id = a.operating_asset_id

    UNION ALL

    SELECT
      'companies'::text AS entity_type,
      'Companies'::text AS label,
      count(*)::int AS record_count,
      count(*) FILTER (
        WHERE c.review_status_code IN ('approved', 'export_ready')
      )::int AS approved_or_export_ready_count,
      count(*) FILTER (
        WHERE c.review_status_code IN ('draft', 'validation')
      )::int AS draft_or_validation_count,
      count(*) FILTER (WHERE c.review_status_code = 'needs_update')::int
        AS needs_update_count,
      count(*) FILTER (
        WHERE NOT EXISTS (
          SELECT 1
          FROM entity_sources es
          WHERE es.company_id = c.company_id
        )
      )::int AS missing_source_count,
      count(*) FILTER (
        WHERE c.headquarters_country IS NULL OR trim(c.headquarters_country) = ''
      )::int AS missing_country_count,
      count(*) FILTER (WHERE c.headquarters_country_id IS NOT NULL)::int
        AS canonical_country_linked_count,
      count(*) FILTER (
        WHERE c.headquarters_country_id IS NULL
          AND c.headquarters_country IS NOT NULL
          AND trim(c.headquarters_country) <> ''
      )::int AS missing_country_reference_count,
      count(*) FILTER (
        WHERE COALESCE(c.company_type_primary_code, '') IN ('', 'unknown')
      )::int AS missing_use_or_status_count,
      0::int AS missing_capacity_count,
      count(*) FILTER (
        WHERE NOT EXISTS (
          SELECT 1
          FROM company_project_links cpl
          WHERE cpl.company_id = c.company_id
        )
        AND NOT EXISTS (
          SELECT 1
          FROM company_operating_asset_links coal
          WHERE coal.company_id = c.company_id
        )
        AND NOT EXISTS (
          SELECT 1
          FROM company_relationships cr
          WHERE cr.company_id_from = c.company_id
             OR cr.company_id_to = c.company_id
        )
      )::int AS missing_company_link_count,
      0::int AS missing_coordinates_count,
      COALESCE(sum(oi.open_issue_count), 0)::int AS open_issue_count,
      COALESCE(sum(oi.critical_issue_count), 0)::int AS critical_issue_count,
      COALESCE(max(c.updated_at), '1970-01-01'::timestamp) AS latest_update_at
    FROM companies c
    LEFT JOIN open_issues oi
      ON oi.entity_type = 'company'
      AND oi.company_id = c.company_id
    ORDER BY entity_type
  `);
  const migrationRows = await prisma.$queryRawUnsafe<
    ReplacementMigrationSummaryRow[]
  >(`
    WITH latest_run AS (
      SELECT *
      FROM live_sqlite_migration_runs
      ORDER BY created_at DESC
      LIMIT 1
    )
    SELECT
      latest_run.run_id::text,
      latest_run.run_label,
      latest_run.status,
      latest_run.source_database_file_name,
      COALESCE(latest_run.source_database_size_bytes, 0)::float8
        AS source_database_size_bytes,
      latest_run.import_completed_at,
      latest_run.transform_completed_at,
      latest_run.validation_completed_at,
      latest_run.created_at,
      COALESCE(validation_counts.validation_check_count, 0)::int
        AS validation_check_count,
      COALESCE(validation_counts.validation_pass_count, 0)::int
        AS validation_pass_count,
      COALESCE(validation_counts.validation_fail_count, 0)::int
        AS validation_fail_count,
      COALESCE(warning_counts.warning_count, 0)::int AS warning_count,
      COALESCE(warning_counts.error_warning_count, 0)::int
        AS error_warning_count
    FROM latest_run
    LEFT JOIN LATERAL (
      SELECT
        count(*)::int AS validation_check_count,
        count(*) FILTER (WHERE status = 'pass')::int
          AS validation_pass_count,
        count(*) FILTER (WHERE status <> 'pass')::int
          AS validation_fail_count
      FROM live_sqlite_migration_validation_results vr
      WHERE vr.run_id = latest_run.run_id
    ) validation_counts ON TRUE
    LEFT JOIN LATERAL (
      SELECT
        count(*)::int AS warning_count,
        count(*) FILTER (WHERE severity = 'error')::int
          AS error_warning_count
      FROM live_sqlite_migration_warnings mw
      WHERE mw.run_id = latest_run.run_id
    ) warning_counts ON TRUE
  `);

  return {
    entities: rows.map((row) => ({
      ...row,
      record_count: toNumber(row.record_count),
      approved_or_export_ready_count: toNumber(
        row.approved_or_export_ready_count
      ),
      draft_or_validation_count: toNumber(row.draft_or_validation_count),
      needs_update_count: toNumber(row.needs_update_count),
      missing_source_count: toNumber(row.missing_source_count),
      missing_country_count: toNumber(row.missing_country_count),
      canonical_country_linked_count: toNumber(
        row.canonical_country_linked_count
      ),
      missing_country_reference_count: toNumber(
        row.missing_country_reference_count
      ),
      missing_use_or_status_count: toNumber(row.missing_use_or_status_count),
      missing_capacity_count: toNumber(row.missing_capacity_count),
      missing_company_link_count: toNumber(row.missing_company_link_count),
      missing_coordinates_count: toNumber(row.missing_coordinates_count),
      open_issue_count: toNumber(row.open_issue_count),
      critical_issue_count: toNumber(row.critical_issue_count),
      latest_update_at: normalizeTimestamp(row.latest_update_at),
    })),
    latestMigrationRun: migrationRows[0]
      ? {
          ...migrationRows[0],
          source_database_size_bytes: toNumber(
            migrationRows[0].source_database_size_bytes
          ),
          validation_check_count: toNumber(
            migrationRows[0].validation_check_count
          ),
          validation_pass_count: toNumber(
            migrationRows[0].validation_pass_count
          ),
          validation_fail_count: toNumber(
            migrationRows[0].validation_fail_count
          ),
          warning_count: toNumber(migrationRows[0].warning_count),
          error_warning_count: toNumber(migrationRows[0].error_warning_count),
          import_completed_at: migrationRows[0].import_completed_at
            ? normalizeTimestamp(migrationRows[0].import_completed_at)
            : null,
          transform_completed_at: migrationRows[0].transform_completed_at
            ? normalizeTimestamp(migrationRows[0].transform_completed_at)
            : null,
          validation_completed_at: migrationRows[0].validation_completed_at
            ? normalizeTimestamp(migrationRows[0].validation_completed_at)
            : null,
          created_at: normalizeTimestamp(migrationRows[0].created_at),
        }
      : null,
  };
}

export async function listPostgresCountryMarketSummaries(
  limit = 250,
  filters: PostgresPreviewGeographyFilters = {}
): Promise<PostgresCountryMarketSummary[]> {
  const rows = await getPrismaClient().$queryRawUnsafe<
    CountryMarketSummaryRow[]
  >(
    `
    WITH countries AS (
      SELECT DISTINCT
        country_id,
        country,
        iso3,
        tge_region,
        wb_region
      FROM (
        SELECT
          COALESCE(cr.country_id::text, p.country_id::text) AS country_id,
          COALESCE(cr.country_name, NULLIF(trim(p.country), '')) AS country,
          cr.iso3,
          COALESCE(cr.tge_region, NULLIF(trim(p.region), '')) AS tge_region,
          COALESCE(cr.wb_region, NULLIF(trim(p.wb_region), '')) AS wb_region
        FROM projects p
        LEFT JOIN countries_reference cr
          ON cr.country_id = p.country_id
        UNION ALL
        SELECT
          COALESCE(cr.country_id::text, a.country_id::text) AS country_id,
          COALESCE(cr.country_name, NULLIF(trim(a.country), '')) AS country,
          cr.iso3,
          COALESCE(cr.tge_region, NULLIF(trim(a.region), '')) AS tge_region,
          COALESCE(cr.wb_region, NULLIF(trim(a.wb_region), '')) AS wb_region
        FROM operating_assets a
        LEFT JOIN countries_reference cr
          ON cr.country_id = a.country_id
        UNION ALL
        SELECT
          COALESCE(cr.country_id::text, c.headquarters_country_id::text)
            AS country_id,
          COALESCE(cr.country_name, NULLIF(trim(c.headquarters_country), ''))
            AS country,
          cr.iso3,
          COALESCE(cr.tge_region, NULLIF(trim(c.region), '')) AS tge_region,
          COALESCE(cr.wb_region, NULLIF(trim(c.wb_region), '')) AS wb_region
        FROM companies c
        LEFT JOIN countries_reference cr
          ON cr.country_id = c.headquarters_country_id
      ) seed
      WHERE country IS NOT NULL
    ),
    project_stats AS (
      SELECT
        COALESCE(cr.country_id::text, p.country_id::text) AS country_id,
        COALESCE(cr.country_name, NULLIF(trim(p.country), '')) AS country,
        count(*)::int AS project_count,
        count(*) FILTER (
          WHERE COALESCE(p.lifecycle_phase_code, '') NOT IN ('cancelled', 'archived')
        )::int AS active_project_count,
        sum(COALESCE(p.electric_capacity_mwe, 0))::float8 AS project_pipeline_mwe,
        sum(COALESCE(p.thermal_capacity_mwth, 0))::float8 AS project_thermal_mwth,
        count(*) FILTER (WHERE p.primary_use_type_code = 'direct_use')::int
          AS direct_use_project_count,
        count(*) FILTER (
          WHERE p.review_status_code IN ('approved', 'export_ready')
        )::int AS approved_project_count,
        count(*) FILTER (
          WHERE p.review_status_code IN ('draft', 'validation', 'needs_update')
        )::int AS draft_project_count,
        count(*) FILTER (
          WHERE NOT EXISTS (
            SELECT 1
            FROM entity_sources es
            WHERE es.project_id = p.project_id
          )
        )::int AS project_missing_source_count,
        max(p.updated_at) AS latest_project_update_at
      FROM projects p
      LEFT JOIN countries_reference cr
        ON cr.country_id = p.country_id
      WHERE COALESCE(cr.country_name, NULLIF(trim(p.country), '')) IS NOT NULL
      GROUP BY
        COALESCE(cr.country_id::text, p.country_id::text),
        COALESCE(cr.country_name, NULLIF(trim(p.country), ''))
    ),
    asset_stats AS (
      SELECT
        COALESCE(cr.country_id::text, a.country_id::text) AS country_id,
        COALESCE(cr.country_name, NULLIF(trim(a.country), '')) AS country,
        count(*)::int AS operating_asset_count,
        count(*) FILTER (WHERE a.lifecycle_phase_code = 'operating')::int
          AS operating_asset_active_count,
        sum(COALESCE(a.electric_capacity_mwe, 0))::float8
          AS operating_installed_mwe,
        sum(COALESCE(a.electric_capacity_running_mwe, 0))::float8
          AS operating_running_mwe,
        sum(COALESCE(a.thermal_capacity_mwth, 0))::float8
          AS operating_thermal_mwth,
        count(*) FILTER (WHERE a.primary_use_type_code = 'direct_use')::int
          AS direct_use_asset_count,
        count(*) FILTER (
          WHERE a.review_status_code IN ('approved', 'export_ready')
        )::int AS approved_asset_count,
        count(*) FILTER (
          WHERE a.review_status_code IN ('draft', 'validation', 'needs_update')
        )::int AS draft_asset_count,
        count(*) FILTER (
          WHERE NOT EXISTS (
            SELECT 1
            FROM entity_sources es
            WHERE es.operating_asset_id = a.operating_asset_id
          )
        )::int AS asset_missing_source_count,
        max(a.updated_at) AS latest_asset_update_at
      FROM operating_assets a
      LEFT JOIN countries_reference cr
        ON cr.country_id = a.country_id
      WHERE COALESCE(cr.country_name, NULLIF(trim(a.country), '')) IS NOT NULL
      GROUP BY
        COALESCE(cr.country_id::text, a.country_id::text),
        COALESCE(cr.country_name, NULLIF(trim(a.country), ''))
    ),
    company_stats AS (
      SELECT
        COALESCE(cr.country_id::text, c.headquarters_country_id::text)
          AS country_id,
        COALESCE(cr.country_name, NULLIF(trim(c.headquarters_country), ''))
          AS country,
        count(*)::int AS company_count,
        count(*) FILTER (
          WHERE c.review_status_code IN ('approved', 'export_ready')
        )::int AS approved_company_count,
        count(*) FILTER (
          WHERE c.review_status_code IN ('draft', 'validation', 'needs_update')
        )::int AS draft_company_count,
        count(*) FILTER (
          WHERE NOT EXISTS (
            SELECT 1
            FROM entity_sources es
            WHERE es.company_id = c.company_id
          )
        )::int AS company_missing_source_count,
        max(c.updated_at) AS latest_company_update_at
      FROM companies c
      LEFT JOIN countries_reference cr
        ON cr.country_id = c.headquarters_country_id
      WHERE COALESCE(cr.country_name, NULLIF(trim(c.headquarters_country), ''))
        IS NOT NULL
      GROUP BY
        COALESCE(cr.country_id::text, c.headquarters_country_id::text),
        COALESCE(cr.country_name, NULLIF(trim(c.headquarters_country), ''))
    )
    SELECT
      countries.country_id,
      countries.country,
      countries.iso3,
      countries.tge_region,
      countries.wb_region,
      COALESCE(project_stats.project_count, 0)::int AS project_count,
      COALESCE(project_stats.active_project_count, 0)::int AS active_project_count,
      COALESCE(asset_stats.operating_asset_count, 0)::int
        AS operating_asset_count,
      COALESCE(asset_stats.operating_asset_active_count, 0)::int
        AS operating_asset_active_count,
      COALESCE(company_stats.company_count, 0)::int AS company_count,
      COALESCE(project_stats.project_pipeline_mwe, 0)::float8
        AS project_pipeline_mwe,
      COALESCE(project_stats.project_thermal_mwth, 0)::float8
        AS project_thermal_mwth,
      COALESCE(asset_stats.operating_installed_mwe, 0)::float8
        AS operating_installed_mwe,
      COALESCE(asset_stats.operating_running_mwe, 0)::float8
        AS operating_running_mwe,
      COALESCE(asset_stats.operating_thermal_mwth, 0)::float8
        AS operating_thermal_mwth,
      COALESCE(project_stats.direct_use_project_count, 0)::int
        AS direct_use_project_count,
      COALESCE(asset_stats.direct_use_asset_count, 0)::int
        AS direct_use_asset_count,
      (
        COALESCE(project_stats.approved_project_count, 0) +
        COALESCE(asset_stats.approved_asset_count, 0) +
        COALESCE(company_stats.approved_company_count, 0)
      )::int AS approved_record_count,
      (
        COALESCE(project_stats.draft_project_count, 0) +
        COALESCE(asset_stats.draft_asset_count, 0) +
        COALESCE(company_stats.draft_company_count, 0)
      )::int AS draft_record_count,
      (
        COALESCE(project_stats.project_missing_source_count, 0) +
        COALESCE(asset_stats.asset_missing_source_count, 0) +
        COALESCE(company_stats.company_missing_source_count, 0)
      )::int AS missing_source_count,
      GREATEST(
        COALESCE(project_stats.latest_project_update_at, '1970-01-01'::timestamp),
        COALESCE(asset_stats.latest_asset_update_at, '1970-01-01'::timestamp),
        COALESCE(company_stats.latest_company_update_at, '1970-01-01'::timestamp)
      ) AS latest_update_at
    FROM countries
    LEFT JOIN project_stats
      ON (
        project_stats.country_id IS NOT DISTINCT FROM countries.country_id
        AND project_stats.country = countries.country
      )
    LEFT JOIN asset_stats
      ON (
        asset_stats.country_id IS NOT DISTINCT FROM countries.country_id
        AND asset_stats.country = countries.country
      )
    LEFT JOIN company_stats
      ON (
        company_stats.country_id IS NOT DISTINCT FROM countries.country_id
        AND company_stats.country = countries.country
      )
    ORDER BY
      (
        COALESCE(asset_stats.operating_installed_mwe, 0) +
        COALESCE(project_stats.project_pipeline_mwe, 0)
      ) DESC,
      countries.country ASC
    LIMIT $1
    `,
    Math.min(Math.max(limit, 1), 500)
  );

  const summaries = rows.map((row) => ({
    ...row,
    project_count: toNumber(row.project_count),
    active_project_count: toNumber(row.active_project_count),
    operating_asset_count: toNumber(row.operating_asset_count),
    operating_asset_active_count: toNumber(row.operating_asset_active_count),
    company_count: toNumber(row.company_count),
    project_pipeline_mwe: toNumber(row.project_pipeline_mwe),
    project_thermal_mwth: toNumber(row.project_thermal_mwth),
    operating_installed_mwe: toNumber(row.operating_installed_mwe),
    operating_running_mwe: toNumber(row.operating_running_mwe),
    operating_thermal_mwth: toNumber(row.operating_thermal_mwth),
    direct_use_project_count: toNumber(row.direct_use_project_count),
    direct_use_asset_count: toNumber(row.direct_use_asset_count),
    approved_record_count: toNumber(row.approved_record_count),
    draft_record_count: toNumber(row.draft_record_count),
    missing_source_count: toNumber(row.missing_source_count),
    latest_update_at: normalizeTimestamp(row.latest_update_at),
  }));

  return filterCountryMarketSummaries(summaries, filters);
}

export async function listPostgresPreviewMapGroups(
  filters: PostgresPreviewGeographyFilters = {}
): Promise<{
  plants: PostgresPreviewMapGroup[];
  projects: PostgresPreviewMapGroup[];
}> {
  const geography = geographyFilterPositions(filters);
  const assetWhere = geographySqlWhere({
    filters,
    rowAlias: "a",
    countryColumn: "country",
    regionColumn: "region",
    wbRegionColumn: "wb_region",
    positions: geography.positions,
  });
  const projectWhere = geographySqlWhere({
    filters,
    rowAlias: "p",
    countryColumn: "country",
    regionColumn: "region",
    wbRegionColumn: "wb_region",
    positions: geography.positions,
  });
  const [plants, projects] = await Promise.all([
    getPrismaClient().$queryRawUnsafe<PostgresPreviewMapGroupRow[]>(
      `
      SELECT
        COALESCE(NULLIF(a.project_group, ''), a.asset_name) AS group_name,
        min(a.operating_asset_id)::text AS representative_id,
        COALESCE(cr.country_name, a.country) AS country,
        COALESCE(cr.tge_region, a.region) AS region,
        COALESCE(cr.wb_region, a.wb_region) AS wb_region,
        avg(a.latitude)::float8 AS latitude,
        avg(a.longitude)::float8 AS longitude,
        count(*)::int AS record_count,
        sum(COALESCE(a.electric_capacity_mwe, 0))::float8
          AS total_capacity_mw,
        NULL::float8 AS potential_min_mw,
        max(a.lifecycle_phase_code) AS phase,
        'plant'::text AS type
      FROM operating_assets a
      LEFT JOIN countries_reference cr
        ON cr.country_id = a.country_id
      WHERE a.latitude IS NOT NULL
        AND a.longitude IS NOT NULL
        AND ${assetWhere}
      GROUP BY
        COALESCE(NULLIF(a.project_group, ''), a.asset_name),
        COALESCE(cr.country_name, a.country),
        COALESCE(cr.tge_region, a.region),
        COALESCE(cr.wb_region, a.wb_region)
      ORDER BY group_name ASC
    `,
      ...geography.values
    ),
    getPrismaClient().$queryRawUnsafe<PostgresPreviewMapGroupRow[]>(
      `
      SELECT
        COALESCE(NULLIF(p.project_group, ''), p.project_name) AS group_name,
        min(p.project_id)::text AS representative_id,
        COALESCE(cr.country_name, p.country) AS country,
        COALESCE(cr.tge_region, p.region) AS region,
        COALESCE(cr.wb_region, p.wb_region) AS wb_region,
        avg(p.latitude)::float8 AS latitude,
        avg(p.longitude)::float8 AS longitude,
        count(*)::int AS record_count,
        sum(COALESCE(p.electric_capacity_mwe, 0))::float8
          AS total_capacity_mw,
        min(COALESCE(p.potential_min_mwe, 0))::float8 AS potential_min_mw,
        max(p.lifecycle_phase_code) AS phase,
        'project'::text AS type
      FROM projects p
      LEFT JOIN countries_reference cr
        ON cr.country_id = p.country_id
      WHERE p.latitude IS NOT NULL
        AND p.longitude IS NOT NULL
        AND ${projectWhere}
      GROUP BY
        COALESCE(NULLIF(p.project_group, ''), p.project_name),
        COALESCE(cr.country_name, p.country),
        COALESCE(cr.tge_region, p.region),
        COALESCE(cr.wb_region, p.wb_region)
      ORDER BY group_name ASC
    `,
      ...geography.values
    ),
  ]);

  const normalizeGroup = (
    group: PostgresPreviewMapGroupRow
  ): PostgresPreviewMapGroup => ({
    ...group,
    latitude: toNumber(group.latitude),
    longitude: toNumber(group.longitude),
    record_count: toNumber(group.record_count),
    total_capacity_mw:
      group.total_capacity_mw === null ? null : toNumber(group.total_capacity_mw),
    potential_min_mw:
      group.potential_min_mw === null ? null : toNumber(group.potential_min_mw),
    type: group.type,
  });

  return {
    plants: plants.map(normalizeGroup),
    projects: projects.map(normalizeGroup),
  };
}

export async function getPostgresPreviewAnalysisSummary(
  filters: PostgresPreviewGeographyFilters = {}
): Promise<PostgresPreviewAnalysisSummary> {
  const geography = geographyFilterPositions(filters);
  const projectWhere = geographySqlWhere({
    filters,
    rowAlias: "p",
    countryColumn: "country",
    regionColumn: "region",
    wbRegionColumn: "wb_region",
    positions: geography.positions,
  });
  const assetWhere = geographySqlWhere({
    filters,
    rowAlias: "a",
    countryColumn: "country",
    regionColumn: "region",
    wbRegionColumn: "wb_region",
    positions: geography.positions,
  });
  const rows = await getPrismaClient().$queryRawUnsafe<
    PostgresPreviewAnalysisBucketRow[]
  >(
    `
    WITH project_records AS (
      SELECT
        p.lifecycle_phase_code,
        p.primary_use_type_code,
        p.electric_capacity_mwe,
        p.thermal_capacity_mwth
      FROM projects p
      LEFT JOIN countries_reference cr
        ON cr.country_id = p.country_id
      WHERE ${projectWhere}
    ),
    asset_records AS (
      SELECT
        a.lifecycle_phase_code,
        a.primary_use_type_code,
        a.electric_capacity_mwe,
        a.thermal_capacity_mwth
      FROM operating_assets a
      LEFT JOIN countries_reference cr
        ON cr.country_id = a.country_id
      WHERE ${assetWhere}
    )
    SELECT
      'project_lifecycle'::text AS bucket_group,
      p.lifecycle_phase_code AS bucket_code,
      count(*)::int AS record_count,
      sum(COALESCE(p.electric_capacity_mwe, 0))::float8
        AS electric_capacity_mwe,
      sum(COALESCE(p.thermal_capacity_mwth, 0))::float8
        AS thermal_capacity_mwth
    FROM project_records p
    GROUP BY p.lifecycle_phase_code

    UNION ALL

    SELECT
      'asset_status'::text AS bucket_group,
      a.lifecycle_phase_code AS bucket_code,
      count(*)::int AS record_count,
      sum(COALESCE(a.electric_capacity_mwe, 0))::float8
        AS electric_capacity_mwe,
      sum(COALESCE(a.thermal_capacity_mwth, 0))::float8
        AS thermal_capacity_mwth
    FROM asset_records a
    GROUP BY a.lifecycle_phase_code

    UNION ALL

    SELECT
      'use_type'::text AS bucket_group,
      use_records.primary_use_type_code AS bucket_code,
      count(*)::int AS record_count,
      sum(COALESCE(use_records.electric_capacity_mwe, 0))::float8
        AS electric_capacity_mwe,
      sum(COALESCE(use_records.thermal_capacity_mwth, 0))::float8
        AS thermal_capacity_mwth
    FROM (
      SELECT
        primary_use_type_code,
        electric_capacity_mwe,
        thermal_capacity_mwth
      FROM project_records
      UNION ALL
      SELECT
        primary_use_type_code,
        electric_capacity_mwe,
        thermal_capacity_mwth
      FROM asset_records
    ) use_records
    GROUP BY use_records.primary_use_type_code
  `,
    ...geography.values
  );
  const topCountries = await listPostgresCountryMarketSummaries(
    hasGeographyFilters(filters) ? 500 : 10,
    filters
  );
  const normalizeBucket = (
    row: PostgresPreviewAnalysisBucketRow
  ): PostgresPreviewAnalysisBucket => ({
    bucket_code: row.bucket_code || "unknown",
    record_count: toNumber(row.record_count),
    electric_capacity_mwe:
      row.electric_capacity_mwe === null ? 0 : toNumber(row.electric_capacity_mwe),
    thermal_capacity_mwth:
      row.thermal_capacity_mwth === null ? 0 : toNumber(row.thermal_capacity_mwth),
  });

  const buckets = {
    projectLifecycle: [] as PostgresPreviewAnalysisBucket[],
    operatingAssetStatus: [] as PostgresPreviewAnalysisBucket[],
    useTypeBreakdown: [] as PostgresPreviewAnalysisBucket[],
  };

  for (const row of rows) {
    if (row.bucket_group === "project_lifecycle") {
      buckets.projectLifecycle.push(normalizeBucket(row));
    } else if (row.bucket_group === "asset_status") {
      buckets.operatingAssetStatus.push(normalizeBucket(row));
    } else {
      buckets.useTypeBreakdown.push(normalizeBucket(row));
    }
  }

  const sortByCapacityThenCount = (
    a: PostgresPreviewAnalysisBucket,
    b: PostgresPreviewAnalysisBucket
  ) =>
    b.electric_capacity_mwe - a.electric_capacity_mwe ||
    b.record_count - a.record_count ||
    a.bucket_code.localeCompare(b.bucket_code);

  const projectLifecycleOrder = [
    "prospect_tbd",
    "prospect",
    "tbd",
    "exploration",
    "pre_feasibility",
    "pre-feasibility",
    "feasibility",
    "construction",
    "under_construction",
    "operating",
    "cancelled",
    "suspended",
    "stalled",
  ];

  const sortProjectLifecycle = (
    a: PostgresPreviewAnalysisBucket,
    b: PostgresPreviewAnalysisBucket
  ) => {
    const aIndex = projectLifecycleOrder.indexOf(a.bucket_code);
    const bIndex = projectLifecycleOrder.indexOf(b.bucket_code);

    return (
      (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex) ||
      b.electric_capacity_mwe - a.electric_capacity_mwe ||
      b.record_count - a.record_count ||
      a.bucket_code.localeCompare(b.bucket_code)
    );
  };

  return {
    projectLifecycle: buckets.projectLifecycle.sort(sortProjectLifecycle),
    operatingAssetStatus:
      buckets.operatingAssetStatus.sort(sortByCapacityThenCount),
    useTypeBreakdown: buckets.useTypeBreakdown.sort(sortByCapacityThenCount),
    topCountries,
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

function hasGeographyFilters(filters: PostgresPreviewGeographyFilters = {}) {
  return Boolean(
    cleanFilterValue(filters.country) ||
      cleanFilterValue(filters.tgeRegion) ||
      cleanFilterValue(filters.wbRegion)
  );
}

function geographyFilterPositions(filters: PostgresPreviewGeographyFilters = {}) {
  const values: string[] = [];
  const positions: {
    country?: number;
    tgeRegion?: number;
    wbRegion?: number;
  } = {};
  const country = cleanFilterValue(filters.country);
  const tgeRegion = cleanFilterValue(filters.tgeRegion);
  const wbRegion = cleanFilterValue(filters.wbRegion);

  if (country) {
    values.push(country);
    positions.country = values.length;
  }

  if (tgeRegion) {
    values.push(tgeRegion);
    positions.tgeRegion = values.length;
  }

  if (wbRegion) {
    values.push(wbRegion);
    positions.wbRegion = values.length;
  }

  return { values, positions };
}

function geographySqlWhere({
  filters,
  rowAlias,
  countryColumn,
  regionColumn,
  wbRegionColumn,
  positions,
}: {
  filters: PostgresPreviewGeographyFilters;
  rowAlias: string;
  countryColumn: string;
  regionColumn: string;
  wbRegionColumn: string;
  positions: {
    country?: number;
    tgeRegion?: number;
    wbRegion?: number;
  };
}) {
  const clauses: string[] = [];

  if (cleanFilterValue(filters.country) && positions.country) {
    clauses.push(
      `COALESCE(cr.country_name, NULLIF(trim(${rowAlias}.${countryColumn}), '')) = $${positions.country}`
    );
  }

  if (cleanFilterValue(filters.tgeRegion) && positions.tgeRegion) {
    clauses.push(
      `COALESCE(cr.tge_region, NULLIF(trim(${rowAlias}.${regionColumn}), '')) = $${positions.tgeRegion}`
    );
  }

  if (cleanFilterValue(filters.wbRegion) && positions.wbRegion) {
    clauses.push(
      `COALESCE(cr.wb_region, NULLIF(trim(${rowAlias}.${wbRegionColumn}), '')) = $${positions.wbRegion}`
    );
  }

  return clauses.length > 0 ? clauses.join("\n      AND ") : "TRUE";
}

function filterCountryMarketSummaries(
  rows: PostgresCountryMarketSummary[],
  filters: PostgresPreviewGeographyFilters = {}
) {
  if (!hasGeographyFilters(filters)) {
    return rows;
  }

  const country = cleanFilterValue(filters.country);
  const tgeRegion = cleanFilterValue(filters.tgeRegion);
  const wbRegion = cleanFilterValue(filters.wbRegion);

  return rows.filter(
    (row) =>
      (!country || row.country === country) &&
      (!tgeRegion || row.tge_region === tgeRegion) &&
      (!wbRegion || row.wb_region === wbRegion)
  );
}

type OpenResearchOpsIssueCountRow = {
  entity_id: string;
  open_issue_count: number | bigint | string;
  critical_issue_count: number | bigint | string;
};

type OpenResearchOpsIssueEntityIdRow = {
  entity_id: string;
};

type OpenResearchOpsIssueCounts = {
  open_issue_count: number;
  critical_issue_count: number;
};

async function listOpenResearchOpsIssueCounts({
  entityType,
  entityColumn,
  entityIds,
}: {
  entityType: "project" | "operating_asset" | "company";
  entityColumn: "project_id" | "operating_asset_id" | "company_id";
  entityIds: string[];
}) {
  if (entityIds.length === 0) {
    return new Map<string, OpenResearchOpsIssueCounts>();
  }

  const rows = await getPrismaClient().$queryRawUnsafe<
    OpenResearchOpsIssueCountRow[]
  >(
    `
    SELECT
      i.${entityColumn}::text AS entity_id,
      COUNT(*)::int AS open_issue_count,
      COUNT(*) FILTER (WHERE i.severity = 'critical')::int AS critical_issue_count
    FROM research_ops_issues i
    INNER JOIN ref_research_issue_statuses ist
      ON ist.code = i.issue_status_code
    WHERE
      i.entity_type = $1
      AND i.${entityColumn} = ANY($2::uuid[])
      AND ist.is_open = TRUE
    GROUP BY i.${entityColumn}
    `,
    entityType,
    entityIds
  );

  return new Map(
    rows.map((row) => [
      row.entity_id,
      {
        open_issue_count: toNumber(row.open_issue_count),
        critical_issue_count: toNumber(row.critical_issue_count),
      },
    ])
  );
}

async function listOpenResearchOpsIssueEntityIds({
  entityType,
  entityColumn,
}: {
  entityType: "project" | "operating_asset" | "company";
  entityColumn: "project_id" | "operating_asset_id" | "company_id";
}) {
  const rows = await getPrismaClient().$queryRawUnsafe<
    OpenResearchOpsIssueEntityIdRow[]
  >(
    `
    SELECT DISTINCT i.${entityColumn}::text AS entity_id
    FROM research_ops_issues i
    INNER JOIN ref_research_issue_statuses ist
      ON ist.code = i.issue_status_code
    WHERE
      i.entity_type = $1
      AND i.${entityColumn} IS NOT NULL
      AND ist.is_open = TRUE
    `,
    entityType
  );

  return rows.map((row) => row.entity_id);
}

async function resolveResearchIssueFilter<T extends { missing?: string }>({
  filters,
  entityType,
  entityColumn,
}: {
  filters: T;
  entityType: "project" | "operating_asset" | "company";
  entityColumn: "project_id" | "operating_asset_id" | "company_id";
}): Promise<T & { researchIssueEntityIds?: string[] }> {
  if (cleanFilterValue(filters.missing) !== "research_issue") {
    return filters;
  }

  return {
    ...filters,
    researchIssueEntityIds: await listOpenResearchOpsIssueEntityIds({
      entityType,
      entityColumn,
    }),
  };
}

async function resolveCountryReferenceFilter<
  T extends {
    country?: string;
    tgeRegion?: string;
    wbRegion?: string;
    countryReferenceIds?: string[];
  }
>(filters: T): Promise<T> {
  const country = cleanFilterValue(filters.country);
  const tgeRegion = cleanFilterValue(filters.tgeRegion);
  const wbRegion = cleanFilterValue(filters.wbRegion);

  if (!country && !tgeRegion && !wbRegion) {
    return filters;
  }

  const clauses: string[] = ["is_active = TRUE"];
  const values: string[] = [];

  if (country) {
    values.push(country);
    clauses.push(`country_name = $${values.length}`);
  }

  if (tgeRegion) {
    values.push(tgeRegion);
    clauses.push(`tge_region = $${values.length}`);
  }

  if (wbRegion) {
    values.push(wbRegion);
    clauses.push(`wb_region = $${values.length}`);
  }

  const rows = await getPrismaClient().$queryRawUnsafe<
    Array<{ country_id: string }>
  >(
    `
    SELECT country_id::text
    FROM countries_reference
    WHERE ${clauses.join("\n      AND ")}
    `,
    ...values
  );

  return {
    ...filters,
    countryReferenceIds: rows.map((row) => row.country_id),
  };
}

function openResearchOpsIssueCountsFor(
  counts: Map<string, OpenResearchOpsIssueCounts>,
  entityId: string
) {
  return (
    counts.get(entityId) || {
      open_issue_count: 0,
      critical_issue_count: 0,
    }
  );
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

function cleanFilterValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

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

function missingTextCondition(field: string) {
  return {
    OR: [
      { [field]: null },
      { [field]: "" },
    ],
  };
}

function buildProjectListWhere(
  filters: PostgresPreviewProjectListFilters = {}
): Prisma.projectsWhereInput {
  const search = cleanFilterValue(filters.search);
  const country = cleanFilterValue(filters.country);
  const tgeRegion = cleanFilterValue(filters.tgeRegion);
  const wbRegion = cleanFilterValue(filters.wbRegion);
  const reviewStatus = cleanFilterValue(filters.reviewStatus);
  const useType = cleanFilterValue(filters.useType);
  const status = cleanFilterValue(filters.status);
  const missing = cleanFilterValue(filters.missing);
  const researchIssueEntityIds = filters.researchIssueEntityIds;
  const countryReferenceIds = filters.countryReferenceIds || [];
  const where: Prisma.projectsWhereInput = {};
  const and: Prisma.projectsWhereInput[] = [];

  if (search) {
    and.push({
      OR: [
        { project_name: { contains: search, mode: "insensitive" } },
        { project_group: { contains: search, mode: "insensitive" } },
        { other_name: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
        { region: { contains: search, mode: "insensitive" } },
        { legacy_project_id: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (country || tgeRegion || wbRegion) {
    const fallbackAnd: Prisma.projectsWhereInput[] = [];

    if (country) {
      fallbackAnd.push({ country });
    }

    if (tgeRegion) {
      fallbackAnd.push({ region: tgeRegion });
    }

    if (wbRegion) {
      fallbackAnd.push({ wb_region: wbRegion });
    }

    and.push({
      OR: [
        ...(countryReferenceIds.length > 0
          ? [{ country_id: { in: countryReferenceIds } }]
          : []),
        ...(fallbackAnd.length > 0 ? [{ AND: fallbackAnd }] : []),
      ],
    });
  }

  if (reviewStatus) {
    if (reviewStatus === "draft_or_validation") {
      and.push({ review_status_code: { in: ["draft", "validation"] } });
    } else {
      and.push({ review_status_code: reviewStatus });
    }
  }

  if (useType) {
    and.push({ primary_use_type_code: useType });
  }

  if (status) {
    and.push({ lifecycle_phase_code: status });
  }

  if (missing === "country") {
    and.push(missingTextCondition("country"));
  } else if (missing === "coordinates") {
    and.push({ OR: [{ latitude: null }, { longitude: null }] });
  } else if (missing === "capacity") {
    and.push({
      electric_capacity_mwe: null,
      thermal_capacity_mwth: null,
      potential_min_mwe: null,
      potential_max_mwe: null,
      annual_power_generation_gwhe: null,
      annual_heat_supply_gwhth: null,
      annual_cooling_supply_gwhc: null,
    });
  } else if (missing === "use_type") {
    and.push({ primary_use_type_code: "unknown" });
  } else if (missing === "status") {
    and.push({ lifecycle_phase_code: "unknown" });
  } else if (missing === "source") {
    and.push({ entity_sources: { none: {} } });
  } else if (missing === "company_link") {
    and.push({ company_project_links: { none: {} } });
  } else if (missing === "research_issue") {
    and.push({ project_id: { in: researchIssueEntityIds || [] } });
  }

  if (and.length > 0) {
    where.AND = and;
  }

  return where;
}

function buildOperatingAssetListWhere(
  filters: PostgresPreviewOperatingAssetListFilters = {}
): Prisma.operating_assetsWhereInput {
  const search = cleanFilterValue(filters.search);
  const country = cleanFilterValue(filters.country);
  const tgeRegion = cleanFilterValue(filters.tgeRegion);
  const wbRegion = cleanFilterValue(filters.wbRegion);
  const reviewStatus = cleanFilterValue(filters.reviewStatus);
  const useType = cleanFilterValue(filters.useType);
  const status = cleanFilterValue(filters.status);
  const missing = cleanFilterValue(filters.missing);
  const researchIssueEntityIds = filters.researchIssueEntityIds;
  const countryReferenceIds = filters.countryReferenceIds || [];
  const where: Prisma.operating_assetsWhereInput = {};
  const and: Prisma.operating_assetsWhereInput[] = [];

  if (search) {
    and.push({
      OR: [
        { asset_name: { contains: search, mode: "insensitive" } },
        { project_group: { contains: search, mode: "insensitive" } },
        { other_name: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
        { region: { contains: search, mode: "insensitive" } },
        { legacy_plant_id: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (country || tgeRegion || wbRegion) {
    const fallbackAnd: Prisma.operating_assetsWhereInput[] = [];

    if (country) {
      fallbackAnd.push({ country });
    }

    if (tgeRegion) {
      fallbackAnd.push({ region: tgeRegion });
    }

    if (wbRegion) {
      fallbackAnd.push({ wb_region: wbRegion });
    }

    and.push({
      OR: [
        ...(countryReferenceIds.length > 0
          ? [{ country_id: { in: countryReferenceIds } }]
          : []),
        ...(fallbackAnd.length > 0 ? [{ AND: fallbackAnd }] : []),
      ],
    });
  }

  if (reviewStatus) {
    if (reviewStatus === "draft_or_validation") {
      and.push({ review_status_code: { in: ["draft", "validation"] } });
    } else {
      and.push({ review_status_code: reviewStatus });
    }
  }

  if (useType) {
    and.push({ primary_use_type_code: useType });
  }

  if (status) {
    and.push({ lifecycle_phase_code: status });
  }

  if (missing === "country") {
    and.push(missingTextCondition("country"));
  } else if (missing === "coordinates") {
    and.push({ OR: [{ latitude: null }, { longitude: null }] });
  } else if (missing === "capacity") {
    and.push({
      electric_capacity_mwe: null,
      electric_capacity_running_mwe: null,
      thermal_capacity_mwth: null,
      annual_power_generation_gwhe: null,
      annual_heat_supply_gwhth: null,
      annual_cooling_supply_gwhc: null,
    });
  } else if (missing === "use_type") {
    and.push({ primary_use_type_code: "unknown" });
  } else if (missing === "status") {
    and.push({ lifecycle_phase_code: "unknown" });
  } else if (missing === "source") {
    and.push({ entity_sources: { none: {} } });
  } else if (missing === "company_link") {
    and.push({ company_operating_asset_links: { none: {} } });
  } else if (missing === "cod") {
    and.push({ cod_year: null });
  } else if (missing === "research_issue") {
    and.push({
      operating_asset_id: { in: researchIssueEntityIds || [] },
    });
  }

  if (and.length > 0) {
    where.AND = and;
  }

  return where;
}

function buildCompanyListWhere(
  filters: PostgresPreviewCompanyListFilters = {}
): Prisma.companiesWhereInput {
  const search = cleanFilterValue(filters.search);
  const country = cleanFilterValue(filters.country);
  const tgeRegion = cleanFilterValue(filters.tgeRegion);
  const wbRegion = cleanFilterValue(filters.wbRegion);
  const reviewStatus = cleanFilterValue(filters.reviewStatus);
  const companyType = cleanFilterValue(filters.companyType);
  const missing = cleanFilterValue(filters.missing);
  const researchIssueEntityIds = filters.researchIssueEntityIds;
  const countryReferenceIds = filters.countryReferenceIds || [];
  const where: Prisma.companiesWhereInput = {};
  const and: Prisma.companiesWhereInput[] = [];

  if (search) {
    and.push({
      OR: [
        { company_name: { contains: search, mode: "insensitive" } },
        { company_name_short: { contains: search, mode: "insensitive" } },
        { company_legal_name: { contains: search, mode: "insensitive" } },
        { website_url: { contains: search, mode: "insensitive" } },
        { headquarters_country: { contains: search, mode: "insensitive" } },
        { geothermal_focus: { contains: search, mode: "insensitive" } },
        { legacy_company_id: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (country || tgeRegion || wbRegion) {
    const fallbackAnd: Prisma.companiesWhereInput[] = [];

    if (country) {
      fallbackAnd.push({ headquarters_country: country });
    }

    if (tgeRegion) {
      fallbackAnd.push({ region: tgeRegion });
    }

    if (wbRegion) {
      fallbackAnd.push({ wb_region: wbRegion });
    }

    and.push({
      OR: [
        ...(countryReferenceIds.length > 0
          ? [{ headquarters_country_id: { in: countryReferenceIds } }]
          : []),
        ...(fallbackAnd.length > 0 ? [{ AND: fallbackAnd }] : []),
      ],
    });
  }

  if (reviewStatus) {
    if (reviewStatus === "draft_or_validation") {
      and.push({ review_status_code: { in: ["draft", "validation"] } });
    } else {
      and.push({ review_status_code: reviewStatus });
    }
  }

  if (companyType) {
    and.push({ company_type_primary_code: companyType });
  }

  if (missing === "country") {
    and.push(missingTextCondition("headquarters_country"));
  } else if (missing === "website") {
    and.push(missingTextCondition("website_url"));
  } else if (missing === "primary_type") {
    and.push(missingTextCondition("company_type_primary_code"));
  } else if (missing === "source") {
    and.push({ entity_sources: { none: {} } });
  } else if (missing === "activity_link") {
    and.push({
      company_project_links: { none: {} },
      company_operating_asset_links: { none: {} },
    });
  } else if (missing === "research_issue") {
    and.push({ company_id: { in: researchIssueEntityIds || [] } });
  }

  if (and.length > 0) {
    where.AND = and;
  }

  return where;
}

export async function listPostgresPreviewProjects(
  options: number | (PostgresPreviewListOptions & {
    filters?: PostgresPreviewProjectListFilters;
  }) = 25
): Promise<PostgresPreviewProject[]> {
  const { limit, offset } = normalizePreviewListOptions(options);
  const filters = typeof options === "number" ? undefined : options.filters;
  const resolvedFilters = await resolveCountryReferenceFilter(
    await resolveResearchIssueFilter({
      filters: filters || {},
      entityType: "project",
      entityColumn: "project_id",
    })
  );
  const where = buildProjectListWhere(resolvedFilters);
  const rows = await getPrismaClient().projects.findMany({
    where,
    select: {
      project_id: true,
      legacy_project_id: true,
      project_name: true,
      primary_use_type_code: true,
      lifecycle_phase_code: true,
      country: true,
      region: true,
      latitude: true,
      longitude: true,
      potential_min_mwe: true,
      potential_max_mwe: true,
      electric_capacity_mwe: true,
      thermal_capacity_mwth: true,
      annual_power_generation_gwhe: true,
      annual_heat_supply_gwhth: true,
      annual_cooling_supply_gwhc: true,
      review_status_code: true,
      research_status: true,
      _count: {
        select: {
          entity_sources: true,
          company_project_links: true,
        },
      },
    },
    orderBy: [{ created_at: "desc" }, { project_name: "asc" }],
    take: limit,
    skip: offset,
  });
  const openIssueCounts = await listOpenResearchOpsIssueCounts({
    entityType: "project",
    entityColumn: "project_id",
    entityIds: rows.map((row) => row.project_id),
  });

  return rows.map(({ _count, ...row }) => ({
    ...row,
    latitude: toNullableNumber(row.latitude),
    longitude: toNullableNumber(row.longitude),
    potential_min_mwe: toNullableNumber(row.potential_min_mwe),
    potential_max_mwe: toNullableNumber(row.potential_max_mwe),
    electric_capacity_mwe: toNullableNumber(row.electric_capacity_mwe),
    thermal_capacity_mwth: toNullableNumber(row.thermal_capacity_mwth),
    annual_power_generation_gwhe: toNullableNumber(
      row.annual_power_generation_gwhe
    ),
    annual_heat_supply_gwhth: toNullableNumber(row.annual_heat_supply_gwhth),
    annual_cooling_supply_gwhc: toNullableNumber(
      row.annual_cooling_supply_gwhc
    ),
    source_count: _count.entity_sources,
    company_link_count: _count.company_project_links,
    ...openResearchOpsIssueCountsFor(openIssueCounts, row.project_id),
  }));
}

export async function listPostgresPreviewOperatingAssets(
  options: number | (PostgresPreviewListOptions & {
    filters?: PostgresPreviewOperatingAssetListFilters;
  }) = 25
): Promise<PostgresPreviewOperatingAsset[]> {
  const { limit, offset } = normalizePreviewListOptions(options);
  const filters = typeof options === "number" ? undefined : options.filters;
  const resolvedFilters = await resolveCountryReferenceFilter(
    await resolveResearchIssueFilter({
      filters: filters || {},
      entityType: "operating_asset",
      entityColumn: "operating_asset_id",
    })
  );
  const where = buildOperatingAssetListWhere(resolvedFilters);
  const rows = await getPrismaClient().operating_assets.findMany({
    where,
    select: {
      operating_asset_id: true,
      legacy_plant_id: true,
      asset_name: true,
      primary_use_type_code: true,
      lifecycle_phase_code: true,
      country: true,
      region: true,
      latitude: true,
      longitude: true,
      electric_capacity_mwe: true,
      electric_capacity_running_mwe: true,
      thermal_capacity_mwth: true,
      annual_power_generation_gwhe: true,
      annual_heat_supply_gwhth: true,
      annual_cooling_supply_gwhc: true,
      cod_year: true,
      review_status_code: true,
      research_status: true,
      _count: {
        select: {
          entity_sources: true,
          company_operating_asset_links: true,
        },
      },
    },
    orderBy: [{ created_at: "desc" }, { asset_name: "asc" }],
    take: limit,
    skip: offset,
  });
  const openIssueCounts = await listOpenResearchOpsIssueCounts({
    entityType: "operating_asset",
    entityColumn: "operating_asset_id",
    entityIds: rows.map((row) => row.operating_asset_id),
  });

  return rows.map(({ _count, ...row }) => ({
    ...row,
    latitude: toNullableNumber(row.latitude),
    longitude: toNullableNumber(row.longitude),
    electric_capacity_mwe: toNullableNumber(row.electric_capacity_mwe),
    electric_capacity_running_mwe: toNullableNumber(
      row.electric_capacity_running_mwe
    ),
    thermal_capacity_mwth: toNullableNumber(row.thermal_capacity_mwth),
    annual_power_generation_gwhe: toNullableNumber(
      row.annual_power_generation_gwhe
    ),
    annual_heat_supply_gwhth: toNullableNumber(row.annual_heat_supply_gwhth),
    annual_cooling_supply_gwhc: toNullableNumber(
      row.annual_cooling_supply_gwhc
    ),
    source_count: _count.entity_sources,
    company_link_count: _count.company_operating_asset_links,
    ...openResearchOpsIssueCountsFor(openIssueCounts, row.operating_asset_id),
  }));
}

export async function listPostgresPreviewCompanies(
  options: number | (PostgresPreviewListOptions & {
    filters?: PostgresPreviewCompanyListFilters;
  }) = 25
): Promise<PostgresPreviewCompany[]> {
  const { limit, offset } = normalizePreviewListOptions(options);
  const filters = typeof options === "number" ? undefined : options.filters;
  const resolvedFilters = await resolveCountryReferenceFilter(
    await resolveResearchIssueFilter({
      filters: filters || {},
      entityType: "company",
      entityColumn: "company_id",
    })
  );
  const where = buildCompanyListWhere(resolvedFilters);
  const rows = await getPrismaClient().companies.findMany({
    where,
    select: {
      company_id: true,
      legacy_company_id: true,
      company_name: true,
      entity_type_code: true,
      company_type_primary_code: true,
      headquarters_country: true,
      website_url: true,
      geothermal_focus: true,
      review_status_code: true,
      research_status: true,
      _count: {
        select: {
          entity_sources: true,
          company_project_links: true,
          company_operating_asset_links: true,
        },
      },
    },
    orderBy: [{ created_at: "desc" }, { company_name: "asc" }],
    take: limit,
    skip: offset,
  });
  const openIssueCounts = await listOpenResearchOpsIssueCounts({
    entityType: "company",
    entityColumn: "company_id",
    entityIds: rows.map((row) => row.company_id),
  });

  return rows.map(({ _count, ...row }) => ({
    ...row,
    source_count: _count.entity_sources,
    project_link_count: _count.company_project_links,
    operating_asset_link_count: _count.company_operating_asset_links,
    ...openResearchOpsIssueCountsFor(openIssueCounts, row.company_id),
  }));
}

export async function countPostgresPreviewProjects(
  filters: PostgresPreviewProjectListFilters = {}
) {
  const resolvedFilters = await resolveCountryReferenceFilter(
    await resolveResearchIssueFilter({
      filters,
      entityType: "project",
      entityColumn: "project_id",
    })
  );

  return getPrismaClient().projects.count({
    where: buildProjectListWhere(resolvedFilters),
  });
}

export async function countPostgresPreviewOperatingAssets(
  filters: PostgresPreviewOperatingAssetListFilters = {}
) {
  const resolvedFilters = await resolveCountryReferenceFilter(
    await resolveResearchIssueFilter({
      filters,
      entityType: "operating_asset",
      entityColumn: "operating_asset_id",
    })
  );

  return getPrismaClient().operating_assets.count({
    where: buildOperatingAssetListWhere(resolvedFilters),
  });
}

export async function countPostgresPreviewCompanies(
  filters: PostgresPreviewCompanyListFilters = {}
) {
  const resolvedFilters = await resolveCountryReferenceFilter(
    await resolveResearchIssueFilter({
      filters,
      entityType: "company",
      entityColumn: "company_id",
    })
  );

  return getPrismaClient().companies.count({
    where: buildCompanyListWhere(resolvedFilters),
  });
}

function compactFacetValues(rows: Array<Record<string, string | null>>) {
  return Array.from(
    new Set(
      rows
        .flatMap((row) => Object.values(row))
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value))
    )
  ).sort((a, b) => a.localeCompare(b));
}

async function listReferencedCountryFacetValues(
  entity:
    | "projects"
    | "operating_assets"
    | "companies"
): Promise<Array<{ country: string | null }>> {
  const tableByEntity = {
    projects: {
      table: "projects",
      countryColumn: "country",
      countryIdColumn: "country_id",
    },
    operating_assets: {
      table: "operating_assets",
      countryColumn: "country",
      countryIdColumn: "country_id",
    },
    companies: {
      table: "companies",
      countryColumn: "headquarters_country",
      countryIdColumn: "headquarters_country_id",
    },
  } as const;
  const config = tableByEntity[entity];

  return getPrismaClient().$queryRawUnsafe<Array<{ country: string | null }>>(
    `
    SELECT DISTINCT
      COALESCE(cr.country_name, NULLIF(trim(entity_row.${config.countryColumn}), ''))
        AS country
    FROM ${config.table} entity_row
    LEFT JOIN countries_reference cr
      ON cr.country_id = entity_row.${config.countryIdColumn}
    WHERE COALESCE(cr.country_name, NULLIF(trim(entity_row.${config.countryColumn}), ''))
      IS NOT NULL
    ORDER BY country ASC
    `
  );
}

async function listCountryReferenceRegionFacetValues(
  regionColumn: "tge_region" | "wb_region"
): Promise<Array<{ region: string | null }>> {
  return getPrismaClient().$queryRawUnsafe<Array<{ region: string | null }>>(
    `
    SELECT DISTINCT ${regionColumn} AS region
    FROM countries_reference
    WHERE is_active = TRUE
      AND NULLIF(trim(${regionColumn}), '') IS NOT NULL
    ORDER BY region ASC
    `
  );
}

export async function getPostgresPreviewProjectListFacets(): Promise<PostgresPreviewListFacets> {
  const prisma = getPrismaClient();
  const [
    countries,
    tgeRegions,
    wbRegions,
    reviewStatuses,
    useTypes,
    statuses,
  ] = await Promise.all([
    listReferencedCountryFacetValues("projects"),
    listCountryReferenceRegionFacetValues("tge_region"),
    listCountryReferenceRegionFacetValues("wb_region"),
    prisma.projects.findMany({
      distinct: ["review_status_code"],
      orderBy: { review_status_code: "asc" },
      select: { review_status_code: true },
    }),
    prisma.projects.findMany({
      distinct: ["primary_use_type_code"],
      orderBy: { primary_use_type_code: "asc" },
      select: { primary_use_type_code: true },
    }),
    prisma.projects.findMany({
      distinct: ["lifecycle_phase_code"],
      orderBy: { lifecycle_phase_code: "asc" },
      select: { lifecycle_phase_code: true },
    }),
  ]);

  return {
    countries: compactFacetValues(countries),
    tgeRegions: compactFacetValues(tgeRegions),
    wbRegions: compactFacetValues(wbRegions),
    reviewStatuses: compactFacetValues(reviewStatuses),
    useTypes: compactFacetValues(useTypes),
    statuses: compactFacetValues(statuses),
    companyTypes: [],
  };
}

export async function getPostgresPreviewOperatingAssetListFacets(): Promise<PostgresPreviewListFacets> {
  const prisma = getPrismaClient();
  const [
    countries,
    tgeRegions,
    wbRegions,
    reviewStatuses,
    useTypes,
    statuses,
  ] = await Promise.all([
    listReferencedCountryFacetValues("operating_assets"),
    listCountryReferenceRegionFacetValues("tge_region"),
    listCountryReferenceRegionFacetValues("wb_region"),
    prisma.operating_assets.findMany({
      distinct: ["review_status_code"],
      orderBy: { review_status_code: "asc" },
      select: { review_status_code: true },
    }),
    prisma.operating_assets.findMany({
      distinct: ["primary_use_type_code"],
      orderBy: { primary_use_type_code: "asc" },
      select: { primary_use_type_code: true },
    }),
    prisma.operating_assets.findMany({
      distinct: ["lifecycle_phase_code"],
      orderBy: { lifecycle_phase_code: "asc" },
      select: { lifecycle_phase_code: true },
    }),
  ]);

  return {
    countries: compactFacetValues(countries),
    tgeRegions: compactFacetValues(tgeRegions),
    wbRegions: compactFacetValues(wbRegions),
    reviewStatuses: compactFacetValues(reviewStatuses),
    useTypes: compactFacetValues(useTypes),
    statuses: compactFacetValues(statuses),
    companyTypes: [],
  };
}

export async function getPostgresPreviewCompanyListFacets(): Promise<PostgresPreviewListFacets> {
  const prisma = getPrismaClient();
  const [countries, tgeRegions, wbRegions, reviewStatuses, companyTypes] =
    await Promise.all([
    listReferencedCountryFacetValues("companies"),
    listCountryReferenceRegionFacetValues("tge_region"),
    listCountryReferenceRegionFacetValues("wb_region"),
    prisma.companies.findMany({
      distinct: ["review_status_code"],
      orderBy: { review_status_code: "asc" },
      select: { review_status_code: true },
    }),
    prisma.companies.findMany({
      distinct: ["company_type_primary_code"],
      orderBy: { company_type_primary_code: "asc" },
      select: { company_type_primary_code: true },
    }),
  ]);

  return {
    countries: compactFacetValues(countries),
    tgeRegions: compactFacetValues(tgeRegions),
    wbRegions: compactFacetValues(wbRegions),
    reviewStatuses: compactFacetValues(reviewStatuses),
    useTypes: [],
    statuses: [],
    companyTypes: compactFacetValues(companyTypes),
  };
}

function cleanOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function cleanRequiredText(value: string | null | undefined, fallback: string) {
  return cleanOptionalText(value) || fallback;
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

export class PostgresApprovalReadinessError extends Error {
  issues: string[];

  constructor(
    entityType: PostgresReviewEntityType,
    reviewStatusCode: string,
    issues: string[]
  ) {
    super(
      `Cannot mark ${entityType.replaceAll("_", " ")} as ${reviewStatusCode} until: ${issues.join("; ")}.`
    );
    this.name = "PostgresApprovalReadinessError";
    this.issues = issues;
  }
}

type ApprovalReadinessRelationships = {
  sourceCount: number;
  companyLinkCount?: number;
  activityLinkCount?: number;
};

function approvalText(value: unknown) {
  return String(value ?? "").trim();
}

function approvalHasText(data: Record<string, unknown>, field: string) {
  return Boolean(approvalText(data[field]));
}

function approvalIsUnknown(data: Record<string, unknown>, field: string) {
  const value = approvalText(data[field]).toLowerCase();
  return !value || value === "unknown";
}

function approvalReadinessIssues({
  entityType,
  data,
  relationships,
}: {
  entityType: PostgresReviewEntityType;
  data: Record<string, unknown>;
  relationships: ApprovalReadinessRelationships;
}) {
  const issues: string[] = [];

  if (entityType === "project") {
    if (!approvalHasText(data, "project_name")) {
      issues.push("project name is missing");
    }

    if (!approvalHasText(data, "country")) {
      issues.push("country is missing");
    }

    if (approvalIsUnknown(data, "primary_use_type_code")) {
      issues.push("use type is missing");
    }

    if (
      approvalIsUnknown(data, "lifecycle_phase_code") ||
      approvalText(data.lifecycle_phase_code).toLowerCase() === "prospect_tbd"
    ) {
      issues.push("lifecycle phase needs classification");
    }
  } else if (entityType === "operating_asset") {
    if (!approvalHasText(data, "asset_name")) {
      issues.push("plant name is missing");
    }

    if (!approvalHasText(data, "country")) {
      issues.push("country is missing");
    }

    if (approvalIsUnknown(data, "primary_use_type_code")) {
      issues.push("use type is missing");
    }

    if (approvalIsUnknown(data, "lifecycle_phase_code")) {
      issues.push("operating status is missing");
    }
  } else {
    if (!approvalHasText(data, "company_name")) {
      issues.push("company name is missing");
    }

    if (approvalIsUnknown(data, "company_type_primary_code")) {
      issues.push("primary company type is missing");
    }
  }

  if (relationships.sourceCount < 1) {
    issues.push("at least one source/evidence link is required");
  }

  return issues;
}

function assertApprovalReadiness({
  entityType,
  reviewStatusCode,
  data,
  relationships,
}: {
  entityType: PostgresReviewEntityType;
  reviewStatusCode: string;
  data: Record<string, unknown>;
  relationships: ApprovalReadinessRelationships;
}) {
  if (!isApprovedStatus(reviewStatusCode)) {
    return;
  }

  const issues = approvalReadinessIssues({
    entityType,
    data,
    relationships,
  });

  if (issues.length > 0) {
    throw new PostgresApprovalReadinessError(
      entityType,
      reviewStatusCode,
      issues
    );
  }
}

async function getApprovalReadinessRelationships(
  entityType: PostgresReviewEntityType,
  entityId: string | null
): Promise<ApprovalReadinessRelationships> {
  if (!entityId || !isUuid(entityId)) {
    return {
      sourceCount: 0,
      companyLinkCount: 0,
      activityLinkCount: 0,
    };
  }

  if (entityType === "project") {
    const rows = await getPrismaClient().$queryRawUnsafe<
      Array<{ source_count: number | bigint; company_link_count: number | bigint }>
    >(
      `
      SELECT
        (
          SELECT COUNT(*)
          FROM entity_sources es
          WHERE es.project_id = $1::uuid
        ) AS source_count,
        (
          SELECT COUNT(*)
          FROM company_project_links cpl
          WHERE cpl.project_id = $1::uuid
        ) AS company_link_count
      `,
      entityId
    );

    return {
      sourceCount: toNumber(rows[0]?.source_count),
      companyLinkCount: toNumber(rows[0]?.company_link_count),
    };
  }

  if (entityType === "operating_asset") {
    const rows = await getPrismaClient().$queryRawUnsafe<
      Array<{ source_count: number | bigint; company_link_count: number | bigint }>
    >(
      `
      SELECT
        (
          SELECT COUNT(*)
          FROM entity_sources es
          WHERE es.operating_asset_id = $1::uuid
        ) AS source_count,
        (
          SELECT COUNT(*)
          FROM company_operating_asset_links coal
          WHERE coal.operating_asset_id = $1::uuid
        ) AS company_link_count
      `,
      entityId
    );

    return {
      sourceCount: toNumber(rows[0]?.source_count),
      companyLinkCount: toNumber(rows[0]?.company_link_count),
    };
  }

  const rows = await getPrismaClient().$queryRawUnsafe<
    Array<{ source_count: number | bigint; activity_link_count: number | bigint }>
  >(
    `
    SELECT
      (
        SELECT COUNT(*)
        FROM entity_sources es
        WHERE es.company_id = $1::uuid
      ) AS source_count,
      (
        SELECT COUNT(*)
        FROM company_project_links cpl
        WHERE cpl.company_id = $1::uuid
      ) +
      (
        SELECT COUNT(*)
        FROM company_operating_asset_links coal
        WHERE coal.company_id = $1::uuid
      ) AS activity_link_count
    `,
    entityId
  );

  return {
    sourceCount: toNumber(rows[0]?.source_count),
    activityLinkCount: toNumber(rows[0]?.activity_link_count),
  };
}

async function assertExistingRecordApprovalReadiness(
  entityType: PostgresReviewEntityType,
  entityId: string,
  reviewStatusCode: string
) {
  if (!isApprovedStatus(reviewStatusCode)) {
    return;
  }

  const detail =
    entityType === "project"
      ? await getPostgresPreviewProjectById(entityId)
      : entityType === "operating_asset"
        ? await getPostgresPreviewOperatingAssetById(entityId)
        : await getPostgresPreviewCompanyById(entityId);

  if (!detail) {
    return;
  }

  assertApprovalReadiness({
    entityType,
    reviewStatusCode,
    data: detail as unknown as Record<string, unknown>,
    relationships: await getApprovalReadinessRelationships(entityType, entityId),
  });
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

function normalizeMutationComparisonValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function buildMutationChangedFields({
  existing,
  input,
  fields,
}: {
  existing: Record<string, unknown>;
  input: Record<string, unknown>;
  fields: string[];
}) {
  const changedFields: Record<string, [string, string]> = {};

  fields.forEach((field) => {
    const previousValue = normalizeMutationComparisonValue(existing[field]);
    const nextValue = normalizeMutationComparisonValue(input[field]);

    if (previousValue !== nextValue) {
      changedFields[field] = [previousValue, nextValue];
    }
  });

  return changedFields;
}

async function recordEntityFormAudit({
  entityType,
  entityId,
  actorUserId,
  previousReviewStatus,
  nextReviewStatus,
  changedFields,
}: {
  entityType: PostgresReviewEntityType;
  entityId: string;
  actorUserId?: string | null;
  previousReviewStatus: string;
  nextReviewStatus: string;
  changedFields: Record<string, [string, string]>;
}) {
  if (
    Object.keys(changedFields).length === 0 &&
    previousReviewStatus === nextReviewStatus
  ) {
    return;
  }

  await getPrismaClient().audit_events.create({
    data: {
      entity_type: entityType,
      entity_id: entityId,
      event_type: "form_update",
      previous_review_status_code:
        previousReviewStatus !== nextReviewStatus ? previousReviewStatus : null,
      next_review_status_code:
        previousReviewStatus !== nextReviewStatus ? nextReviewStatus : null,
      actor_user_id: isUuid(actorUserId) ? actorUserId : undefined,
      event_note:
        previousReviewStatus !== nextReviewStatus
          ? "Form update changed review status."
          : "Form update saved.",
      changed_fields: changedFields as Prisma.InputJsonValue,
    },
  });
}

function deriveUpdatedReviewStatus(
  current: string,
  requested: string,
  hasCoreFieldChanges = false
) {
  if (
    isApprovedStatus(current) &&
    hasCoreFieldChanges &&
    isApprovedStatus(requested)
  ) {
    return "needs_update";
  }

  if (
    isApprovedStatus(current) &&
    (requested === "draft" || requested === "validation")
  ) {
    return "needs_update";
  }

  return requested;
}

const projectMutationFieldNames = [
  "project_name",
  "project_group",
  "primary_use_type_code",
  "lifecycle_phase_code",
  "location_text",
  "country",
  "region",
  "wb_region",
  "latitude",
  "longitude",
  "resource_type",
  "resource_temp_c",
  "potential_min_mwe",
  "potential_max_mwe",
  "electric_capacity_mwe",
  "thermal_capacity_mwth",
  "annual_power_generation_gwhe",
  "annual_heat_supply_gwhth",
  "annual_cooling_supply_gwhc",
  "capacity_estimate_status_code",
  "output_estimate_status_code",
  "start_dev_year",
  "target_cod_year",
  "target_cod_month",
  "cod_raw",
  "plant_technology",
  "turbine_supplier",
  "research_status",
  "notes",
];

const operatingAssetMutationFieldNames = [
  "asset_name",
  "project_group",
  "primary_use_type_code",
  "lifecycle_phase_code",
  "location_text",
  "country",
  "region",
  "wb_region",
  "latitude",
  "longitude",
  "resource_type",
  "resource_temp_c",
  "potential_min_mwe",
  "potential_max_mwe",
  "electric_capacity_mwe",
  "electric_capacity_running_mwe",
  "thermal_capacity_mwth",
  "annual_power_generation_gwhe",
  "annual_heat_supply_gwhth",
  "annual_cooling_supply_gwhc",
  "capacity_estimate_status_code",
  "output_estimate_status_code",
  "start_dev_year",
  "cod_year",
  "cod_month",
  "cod_raw",
  "number_of_units",
  "plant_technology",
  "turbine_supplier",
  "research_status",
  "notes",
];

const companyMutationFieldNames = [
  "company_name",
  "company_name_short",
  "company_legal_name",
  "website_url",
  "linkedin_url",
  "entity_type_code",
  "company_type_primary_code",
  "ownership_type",
  "company_status",
  "headquarters_city",
  "headquarters_country",
  "region",
  "wb_region",
  "geothermal_focus",
  "technology_focus",
  "service_scope_summary",
  "operating_markets_summary",
  "research_status",
  "notes",
];

async function setProjectCountryReference(
  projectId: string,
  countryId?: string | null
) {
  await getPrismaClient().$executeRawUnsafe(
    `
    UPDATE projects
    SET country_id = $2::uuid
    WHERE project_id = $1::uuid
    `,
    projectId,
    countryId || null
  );
}

async function setOperatingAssetCountryReference(
  operatingAssetId: string,
  countryId?: string | null
) {
  await getPrismaClient().$executeRawUnsafe(
    `
    UPDATE operating_assets
    SET country_id = $2::uuid
    WHERE operating_asset_id = $1::uuid
    `,
    operatingAssetId,
    countryId || null
  );
}

async function setCompanyHeadquartersCountryReference(
  companyId: string,
  countryId?: string | null
) {
  await getPrismaClient().$executeRawUnsafe(
    `
    UPDATE companies
    SET headquarters_country_id = $2::uuid
    WHERE company_id = $1::uuid
    `,
    companyId,
    countryId || null
  );
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

  await assertExistingRecordApprovalReadiness(
    input.entityType,
    input.entityId,
    input.reviewStatusCode
  );

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
    countries,
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
    prisma.$queryRawUnsafe<PostgresCountryReference[]>(
      `
      SELECT
        country_id::text,
        country_name,
        iso3,
        wb_region,
        tge_region,
        is_active
      FROM countries_reference
      WHERE is_active = TRUE
      ORDER BY country_name ASC
      `
    ),
  ]);

  return {
    useTypes,
    lifecyclePhases,
    reviewStatuses,
    estimateStatuses,
    companyEntityTypes,
    companyPrimaryTypes,
    countries,
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

function getRelationshipSourceTargetColumn(
  targetType: PostgresRelationshipSourceTargetType
) {
  switch (targetType) {
    case "company_project_link":
      return "company_project_link_id";
    case "company_operating_asset_link":
      return "company_operating_asset_link_id";
    case "company_relationship":
      return "company_relationship_id";
  }
}

function getRelationshipSourceTargetTable(
  targetType: PostgresRelationshipSourceTargetType
) {
  switch (targetType) {
    case "company_project_link":
      return "company_project_links";
    case "company_operating_asset_link":
      return "company_operating_asset_links";
    case "company_relationship":
      return "company_relationships";
  }
}

function toRelationshipSource(
  row: RelationshipSourceRow
): PostgresRelationshipSource {
  return {
    ...row,
    reviewed_at: row.reviewed_at ? normalizeTimestamp(row.reviewed_at) : null,
    created_at: normalizeTimestamp(row.created_at),
    updated_at: normalizeTimestamp(row.updated_at),
  };
}

export async function postgresRelationshipSourceTargetExists(
  targetType: PostgresRelationshipSourceTargetType,
  targetId: string
) {
  if (!isUuid(targetId)) {
    return false;
  }

  const targetTable = getRelationshipSourceTargetTable(targetType);
  const targetColumn = getRelationshipSourceTargetColumn(targetType);
  const rows = await getPrismaClient().$queryRawUnsafe<Array<{ exists: boolean }>>(
    `
    SELECT EXISTS (
      SELECT 1
      FROM ${targetTable}
      WHERE ${targetColumn} = $1::uuid
    ) AS exists
    `,
    targetId
  );

  return Boolean(rows[0]?.exists);
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
      (
        SELECT COUNT(*)::int
        FROM relationship_sources rs
        WHERE rs.company_project_link_id = cpl.company_project_link_id
      ) AS relationship_source_count,
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
      (
        SELECT COUNT(*)::int
        FROM relationship_sources rs
        WHERE rs.company_operating_asset_link_id = coal.company_operating_asset_link_id
      ) AS relationship_source_count,
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
      (
        SELECT COUNT(*)::int
        FROM relationship_sources rs
        WHERE rs.company_relationship_id = cr.company_relationship_id
      ) AS relationship_source_count,
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
      (
        SELECT COUNT(*)::int
        FROM relationship_sources rs
        WHERE rs.company_project_link_id = cpl.company_project_link_id
      ) AS relationship_source_count,
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
      (
        SELECT COUNT(*)::int
        FROM relationship_sources rs
        WHERE rs.company_project_link_id = cpl.company_project_link_id
      ) AS relationship_source_count,
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
      (
        SELECT COUNT(*)::int
        FROM relationship_sources rs
        WHERE rs.company_operating_asset_link_id = coal.company_operating_asset_link_id
      ) AS relationship_source_count,
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
      (
        SELECT COUNT(*)::int
        FROM relationship_sources rs
        WHERE rs.company_operating_asset_link_id = coal.company_operating_asset_link_id
      ) AS relationship_source_count,
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
      (
        SELECT COUNT(*)::int
        FROM relationship_sources rs
        WHERE rs.company_relationship_id = cr.company_relationship_id
      ) AS relationship_source_count,
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

export async function createPostgresRelationshipSource(
  input: PostgresRelationshipSourceMutationInput
): Promise<PostgresRelationshipSource | null> {
  const targetColumn = getRelationshipSourceTargetColumn(input.target_type);
  const normalizedReviewerId = isUuid(input.reviewedByUserId)
    ? input.reviewedByUserId
    : null;

  const rows = await getPrismaClient().$queryRawUnsafe<RelationshipSourceIdRow[]>(
    `
    WITH reviewer AS (
      SELECT user_id
      FROM app_users
      WHERE user_id = $10::uuid
      LIMIT 1
    ),
    existing AS (
      SELECT relationship_source_id
      FROM relationship_sources
      WHERE source_id = $1::uuid
        AND ${targetColumn} = $2::uuid
      ORDER BY created_at ASC
      LIMIT 1
    ),
    updated AS (
      UPDATE relationship_sources rs
      SET
        evidence_type = $3,
        linked_field = $4,
        claim_text = $5,
        extracted_value = $6,
        evidence_note = $7,
        confidence_status_code = $8,
        is_primary_evidence = $9,
        reviewed_by_user_id = CASE
          WHEN $8 != 'unknown' THEN (SELECT user_id FROM reviewer)
          ELSE NULL
        END,
        reviewed_at = CASE WHEN $8 != 'unknown' THEN now() ELSE NULL END,
        updated_at = now()
      WHERE rs.relationship_source_id = (
        SELECT relationship_source_id FROM existing
      )
      RETURNING rs.relationship_source_id::text
    ),
    inserted AS (
      INSERT INTO relationship_sources (
        source_id,
        ${targetColumn},
        evidence_type,
        linked_field,
        claim_text,
        extracted_value,
        evidence_note,
        confidence_status_code,
        is_primary_evidence,
        reviewed_by_user_id,
        reviewed_at
      )
      SELECT
        $1::uuid,
        $2::uuid,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        CASE WHEN $8 != 'unknown' THEN (SELECT user_id FROM reviewer) ELSE NULL END,
        CASE WHEN $8 != 'unknown' THEN now() ELSE NULL END
      WHERE NOT EXISTS (SELECT 1 FROM existing)
      RETURNING relationship_source_id::text
    )
    SELECT relationship_source_id FROM updated
    UNION ALL
    SELECT relationship_source_id FROM inserted
    LIMIT 1
    `,
    input.source_id,
    input.target_id,
    cleanOptionalText(input.evidence_type),
    cleanOptionalText(input.linked_field),
    cleanOptionalText(input.claim_text),
    cleanOptionalText(input.extracted_value),
    cleanOptionalText(input.evidence_note),
    cleanRequiredText(input.confidence_status_code, "unknown"),
    Boolean(input.is_primary_evidence),
    normalizedReviewerId
  );

  const relationshipSourceId = rows[0]?.relationship_source_id;

  if (!relationshipSourceId) {
    return null;
  }

  const relationshipSources = await getPrismaClient().$queryRawUnsafe<
    RelationshipSourceRow[]
  >(
    `
    SELECT
      rs.relationship_source_id::text,
      rs.source_id::text,
      $2::text AS target_type,
      rs.${targetColumn}::text AS target_id,
      rs.evidence_type,
      rs.linked_field,
      rs.claim_text,
      rs.extracted_value,
      rs.evidence_note,
      rs.confidence_status_code,
      rs.is_primary_evidence,
      rs.reviewed_by_user_id::text,
      rs.reviewed_at,
      rs.created_at,
      rs.updated_at
    FROM relationship_sources rs
    WHERE rs.relationship_source_id = $1::uuid
    LIMIT 1
    `,
    relationshipSourceId,
    input.target_type
  );

  return relationshipSources[0]
    ? toRelationshipSource(relationshipSources[0])
    : null;
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

  await prisma.$executeRawUnsafe(
    `
    UPDATE operating_assets a
    SET country_id = p.country_id
    FROM projects p
    WHERE a.operating_asset_id = $1::uuid
      AND p.project_id = $2::uuid
    `,
    result.operatingAssetId,
    projectId
  );

  const operatingAsset = await getPostgresPreviewOperatingAssetById(
    result.operatingAssetId
  );

  if (!operatingAsset) {
    throw new Error("Promoted plant could not be reloaded.");
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
  assertApprovalReadiness({
    entityType: "project",
    reviewStatusCode: input.review_status_code,
    data: input as unknown as Record<string, unknown>,
    relationships: {
      sourceCount: 0,
      companyLinkCount: 0,
    },
  });

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

  await setProjectCountryReference(project.project_id, input.country_id);

  const detail = await getPostgresPreviewProjectById(project.project_id);

  if (!detail) {
    throw new Error("Created project could not be reloaded.");
  }

  return detail;
}

export async function updatePostgresPreviewProject(
  projectId: string,
  input: PostgresProjectMutationInput,
  actorUserId?: string | null
): Promise<PostgresPreviewProjectDetail | null> {
  const prisma = getPrismaClient();
  const normalizedActorUserId = isUuid(actorUserId) ? actorUserId : null;
  const existing = await prisma.projects.findUnique({
    select: {
      project_name: true,
      project_group: true,
      primary_use_type_code: true,
      lifecycle_phase_code: true,
      location_text: true,
      country: true,
      region: true,
      wb_region: true,
      latitude: true,
      longitude: true,
      resource_type: true,
      resource_temp_c: true,
      potential_min_mwe: true,
      potential_max_mwe: true,
      electric_capacity_mwe: true,
      thermal_capacity_mwth: true,
      annual_power_generation_gwhe: true,
      annual_heat_supply_gwhth: true,
      annual_cooling_supply_gwhc: true,
      capacity_estimate_status_code: true,
      output_estimate_status_code: true,
      start_dev_year: true,
      target_cod_year: true,
      target_cod_month: true,
      cod_raw: true,
      plant_technology: true,
      turbine_supplier: true,
      review_status_code: true,
      research_status: true,
      notes: true,
      approved_at: true,
      export_ready_at: true,
    },
    where: { project_id: projectId },
  });

  if (!existing) {
    return null;
  }

  const changedFields = buildMutationChangedFields({
    existing,
    input: input as unknown as Record<string, unknown>,
    fields: projectMutationFieldNames,
  });
  const reviewStatus = deriveUpdatedReviewStatus(
    existing.review_status_code,
    input.review_status_code,
    Object.keys(changedFields).length > 0
  );

  if (existing.review_status_code !== reviewStatus) {
    changedFields.review_status_code = [existing.review_status_code, reviewStatus];
  }

  assertApprovalReadiness({
    entityType: "project",
    reviewStatusCode: reviewStatus,
    data: input as unknown as Record<string, unknown>,
    relationships: await getApprovalReadinessRelationships("project", projectId),
  });

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
      last_updated_by_user_id: normalizedActorUserId || undefined,
      updated_at: new Date(),
      ...getPreservedReviewTimestampFields(reviewStatus, existing),
    },
  });

  await setProjectCountryReference(projectId, input.country_id);

  await recordEntityFormAudit({
    entityType: "project",
    entityId: projectId,
    actorUserId: normalizedActorUserId,
    previousReviewStatus: existing.review_status_code,
    nextReviewStatus: reviewStatus,
    changedFields,
  });

  return getPostgresPreviewProjectById(projectId);
}

export async function createPostgresPreviewOperatingAsset(
  input: PostgresOperatingAssetMutationInput
): Promise<PostgresPreviewOperatingAssetDetail> {
  assertApprovalReadiness({
    entityType: "operating_asset",
    reviewStatusCode: input.review_status_code,
    data: input as unknown as Record<string, unknown>,
    relationships: {
      sourceCount: 0,
      companyLinkCount: 0,
    },
  });

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

  await setOperatingAssetCountryReference(
    asset.operating_asset_id,
    input.country_id
  );

  const detail = await getPostgresPreviewOperatingAssetById(
    asset.operating_asset_id
  );

  if (!detail) {
    throw new Error("Created plant could not be reloaded.");
  }

  return detail;
}

export async function updatePostgresPreviewOperatingAsset(
  operatingAssetId: string,
  input: PostgresOperatingAssetMutationInput,
  actorUserId?: string | null
): Promise<PostgresPreviewOperatingAssetDetail | null> {
  const prisma = getPrismaClient();
  const normalizedActorUserId = isUuid(actorUserId) ? actorUserId : null;
  const existing = await prisma.operating_assets.findUnique({
    select: {
      asset_name: true,
      project_group: true,
      primary_use_type_code: true,
      lifecycle_phase_code: true,
      location_text: true,
      country: true,
      region: true,
      wb_region: true,
      latitude: true,
      longitude: true,
      resource_type: true,
      resource_temp_c: true,
      potential_min_mwe: true,
      potential_max_mwe: true,
      electric_capacity_mwe: true,
      electric_capacity_running_mwe: true,
      thermal_capacity_mwth: true,
      annual_power_generation_gwhe: true,
      annual_heat_supply_gwhth: true,
      annual_cooling_supply_gwhc: true,
      capacity_estimate_status_code: true,
      output_estimate_status_code: true,
      start_dev_year: true,
      cod_year: true,
      cod_month: true,
      cod_raw: true,
      number_of_units: true,
      plant_technology: true,
      turbine_supplier: true,
      review_status_code: true,
      research_status: true,
      notes: true,
      approved_at: true,
      export_ready_at: true,
    },
    where: { operating_asset_id: operatingAssetId },
  });

  if (!existing) {
    return null;
  }

  const changedFields = buildMutationChangedFields({
    existing,
    input: input as unknown as Record<string, unknown>,
    fields: operatingAssetMutationFieldNames,
  });
  const reviewStatus = deriveUpdatedReviewStatus(
    existing.review_status_code,
    input.review_status_code,
    Object.keys(changedFields).length > 0
  );

  if (existing.review_status_code !== reviewStatus) {
    changedFields.review_status_code = [existing.review_status_code, reviewStatus];
  }

  assertApprovalReadiness({
    entityType: "operating_asset",
    reviewStatusCode: reviewStatus,
    data: input as unknown as Record<string, unknown>,
    relationships: await getApprovalReadinessRelationships(
      "operating_asset",
      operatingAssetId
    ),
  });

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
      last_updated_by_user_id: normalizedActorUserId || undefined,
      updated_at: new Date(),
      ...getPreservedReviewTimestampFields(reviewStatus, existing),
    },
  });

  await setOperatingAssetCountryReference(
    operatingAssetId,
    input.country_id
  );

  await recordEntityFormAudit({
    entityType: "operating_asset",
    entityId: operatingAssetId,
    actorUserId: normalizedActorUserId,
    previousReviewStatus: existing.review_status_code,
    nextReviewStatus: reviewStatus,
    changedFields,
  });

  return getPostgresPreviewOperatingAssetById(operatingAssetId);
}

export async function createPostgresPreviewCompany(
  input: PostgresCompanyMutationInput
): Promise<PostgresPreviewCompanyDetail> {
  assertApprovalReadiness({
    entityType: "company",
    reviewStatusCode: input.review_status_code,
    data: input as unknown as Record<string, unknown>,
    relationships: {
      sourceCount: 0,
      activityLinkCount: 0,
    },
  });

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

  await setCompanyHeadquartersCountryReference(
    company.company_id,
    input.headquarters_country_id
  );

  const detail = await getPostgresPreviewCompanyById(company.company_id);

  if (!detail) {
    throw new Error("Created company could not be reloaded.");
  }

  return detail;
}

export async function updatePostgresPreviewCompany(
  companyId: string,
  input: PostgresCompanyMutationInput,
  actorUserId?: string | null
): Promise<PostgresPreviewCompanyDetail | null> {
  const prisma = getPrismaClient();
  const normalizedActorUserId = isUuid(actorUserId) ? actorUserId : null;
  const existing = await prisma.companies.findUnique({
    select: {
      company_name: true,
      company_name_short: true,
      company_legal_name: true,
      website_url: true,
      linkedin_url: true,
      entity_type_code: true,
      company_type_primary_code: true,
      ownership_type: true,
      company_status: true,
      headquarters_city: true,
      headquarters_country: true,
      region: true,
      wb_region: true,
      geothermal_focus: true,
      technology_focus: true,
      service_scope_summary: true,
      operating_markets_summary: true,
      review_status_code: true,
      research_status: true,
      notes: true,
      approved_at: true,
      export_ready_at: true,
    },
    where: { company_id: companyId },
  });

  if (!existing) {
    return null;
  }

  const changedFields = buildMutationChangedFields({
    existing,
    input: input as unknown as Record<string, unknown>,
    fields: companyMutationFieldNames,
  });
  const reviewStatus = deriveUpdatedReviewStatus(
    existing.review_status_code,
    input.review_status_code,
    Object.keys(changedFields).length > 0
  );

  if (existing.review_status_code !== reviewStatus) {
    changedFields.review_status_code = [existing.review_status_code, reviewStatus];
  }

  assertApprovalReadiness({
    entityType: "company",
    reviewStatusCode: reviewStatus,
    data: input as unknown as Record<string, unknown>,
    relationships: await getApprovalReadinessRelationships("company", companyId),
  });

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
      last_updated_by_user_id: normalizedActorUserId || undefined,
      updated_at: new Date(),
      ...getPreservedReviewTimestampFields(reviewStatus, existing),
    },
  });

  await setCompanyHeadquartersCountryReference(
    companyId,
    input.headquarters_country_id
  );

  await recordEntityFormAudit({
    entityType: "company",
    entityId: companyId,
    actorUserId: normalizedActorUserId,
    previousReviewStatus: existing.review_status_code,
    nextReviewStatus: reviewStatus,
    changedFields,
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
    latest_activity_type: row.latest_activity_type,
    latest_activity_note: row.latest_activity_note,
    latest_changed_field_count: toNumber(row.latest_changed_field_count),
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
      p.country_id::text,
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
      (
        SELECT COUNT(*)::int
        FROM company_project_links cpl
        WHERE cpl.project_id = p.project_id
      ) AS company_link_count,
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
      a.country_id::text,
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
      (
        SELECT COUNT(*)::int
        FROM company_operating_asset_links coal
        WHERE coal.operating_asset_id = a.operating_asset_id
      ) AS company_link_count,
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
      c.headquarters_country_id::text,
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
      latest_audit.event_type AS latest_activity_type,
      latest_audit.event_note AS latest_activity_note,
      COALESCE(latest_audit.changed_field_count, 0)::int
        AS latest_changed_field_count,
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
    LEFT JOIN LATERAL (
      SELECT
        audit.event_type,
        audit.event_note,
        CASE
          WHEN jsonb_typeof(audit.changed_fields) = 'object'
            THEN (
              SELECT count(*)::int
              FROM jsonb_object_keys(audit.changed_fields)
            )
          ELSE 0
        END AS changed_field_count
      FROM audit_events audit
      WHERE audit.entity_type = records.entity_type
        AND audit.entity_id = records.entity_id::uuid
      ORDER BY audit.created_at DESC
      LIMIT 1
    ) latest_audit ON TRUE
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
