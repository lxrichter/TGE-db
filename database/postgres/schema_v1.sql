-- TGE Geothermal Intelligence Platform
-- PostgreSQL schema v1
-- Date: 2026-05-16
--
-- Purpose:
-- - Provide the first PostgreSQL schema baseline for the future TGE platform.
-- - Support migration/import from the current live SQL database.
-- - Support power, direct-use, mineral extraction, and hybrid geothermal assets.
--
-- Notes:
-- - Keep legacy_* columns during migration so old SQLite/server IDs can be mapped.
-- - This is a baseline schema, not yet a generated Prisma/Drizzle migration.
-- - Review against live production data before go-live migration.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- ---------------------------------------------------------------------------
-- Reference tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ref_geothermal_use_types (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ref_direct_use_categories (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  mvp_scope BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ref_technology_tags (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ref_lifecycle_phases (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_operating BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ref_review_statuses (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_terminal BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ref_estimate_statuses (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ref_company_roles (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  role_group TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ref_company_entity_types (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ref_company_primary_types (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ref_company_relationship_types (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ref_source_types (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------------------
-- Users and access
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS app_users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_user_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email CITEXT NOT NULL UNIQUE,
  password_hash TEXT,
  role_code TEXT NOT NULL CHECK (
    role_code IN ('viewer', 'analyst', 'editor', 'reviewer', 'administrator')
  ),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Shared audit columns are repeated on core tables for fast filtering.
-- Detailed change history is stored in audit_events.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS projects (
  project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_project_id TEXT UNIQUE,

  project_name TEXT NOT NULL,
  project_name_short TEXT,
  project_name_clean TEXT,
  project_group TEXT,
  other_name TEXT,

  primary_use_type_code TEXT NOT NULL DEFAULT 'unknown'
    REFERENCES ref_geothermal_use_types(code),
  lifecycle_phase_code TEXT NOT NULL DEFAULT 'prospect_tbd'
    REFERENCES ref_lifecycle_phases(code),

  location_text TEXT,
  country TEXT,
  region TEXT,
  wb_region TEXT,
  latitude NUMERIC(9,6) CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  longitude NUMERIC(9,6) CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  field_name TEXT,
  resource_type TEXT,
  resource_temp_c NUMERIC(8,2),

  potential_min_mwe NUMERIC(12,3) CHECK (potential_min_mwe IS NULL OR potential_min_mwe >= 0),
  potential_max_mwe NUMERIC(12,3) CHECK (potential_max_mwe IS NULL OR potential_max_mwe >= 0),
  electric_capacity_mwe NUMERIC(12,3) CHECK (electric_capacity_mwe IS NULL OR electric_capacity_mwe >= 0),
  electric_capacity_running_mwe NUMERIC(12,3) CHECK (electric_capacity_running_mwe IS NULL OR electric_capacity_running_mwe >= 0),
  thermal_capacity_mwth NUMERIC(12,3) CHECK (thermal_capacity_mwth IS NULL OR thermal_capacity_mwth >= 0),
  installed_heat_pump_capacity_mwth NUMERIC(12,3)
    CHECK (installed_heat_pump_capacity_mwth IS NULL OR installed_heat_pump_capacity_mwth >= 0),
  geothermal_resource_capacity_mwth NUMERIC(12,3)
    CHECK (geothermal_resource_capacity_mwth IS NULL OR geothermal_resource_capacity_mwth >= 0),
  annual_power_generation_gwhe NUMERIC(14,3)
    CHECK (annual_power_generation_gwhe IS NULL OR annual_power_generation_gwhe >= 0),
  annual_heat_supply_gwhth NUMERIC(14,3)
    CHECK (annual_heat_supply_gwhth IS NULL OR annual_heat_supply_gwhth >= 0),
  annual_cooling_supply_gwhc NUMERIC(14,3)
    CHECK (annual_cooling_supply_gwhc IS NULL OR annual_cooling_supply_gwhc >= 0),
  capacity_estimate_status_code TEXT NOT NULL DEFAULT 'unknown'
    REFERENCES ref_estimate_statuses(code),
  output_estimate_status_code TEXT NOT NULL DEFAULT 'unknown'
    REFERENCES ref_estimate_statuses(code),

  start_dev_year INTEGER CHECK (start_dev_year IS NULL OR start_dev_year BETWEEN 1900 AND 2100),
  target_cod_year INTEGER CHECK (target_cod_year IS NULL OR target_cod_year BETWEEN 1900 AND 2100),
  target_cod_month INTEGER CHECK (target_cod_month IS NULL OR target_cod_month BETWEEN 1 AND 12),
  cod_raw TEXT,

  wells_total NUMERIC(10,2) CHECK (wells_total IS NULL OR wells_total >= 0),
  wells_prod_active NUMERIC(10,2) CHECK (wells_prod_active IS NULL OR wells_prod_active >= 0),
  wells_reinj_active NUMERIC(10,2) CHECK (wells_reinj_active IS NULL OR wells_reinj_active >= 0),
  wells_inactive_standby NUMERIC(10,2) CHECK (wells_inactive_standby IS NULL OR wells_inactive_standby >= 0),
  wells_other_exploration NUMERIC(10,2) CHECK (wells_other_exploration IS NULL OR wells_other_exploration >= 0),
  well_depth_prod_m NUMERIC(12,2) CHECK (well_depth_prod_m IS NULL OR well_depth_prod_m >= 0),
  temp_prod_well_c NUMERIC(8,2),
  flow_rate_ls NUMERIC(12,3) CHECK (flow_rate_ls IS NULL OR flow_rate_ls >= 0),

  plant_technology TEXT,
  turbine_supplier TEXT,
  epc_suppliers TEXT,
  ppa_usd_kwh NUMERIC(12,6) CHECK (ppa_usd_kwh IS NULL OR ppa_usd_kwh >= 0),
  total_investment_cost TEXT,

  website_information TEXT,
  source_evidence_note TEXT,
  notes TEXT,
  internal_comments TEXT,

  review_status_code TEXT NOT NULL DEFAULT 'draft'
    REFERENCES ref_review_statuses(code),
  research_status TEXT,
  created_by_user_id UUID REFERENCES app_users(user_id),
  last_updated_by_user_id UUID REFERENCES app_users(user_id),
  approved_by_user_id UUID REFERENCES app_users(user_id),
  approved_at TIMESTAMPTZ,
  export_ready_at TIMESTAMPTZ,

  legacy_created_at TEXT,
  legacy_updated_at TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (
    potential_min_mwe IS NULL OR
    potential_max_mwe IS NULL OR
    potential_max_mwe >= potential_min_mwe
  ),
  CHECK (
    electric_capacity_mwe IS NULL OR
    electric_capacity_running_mwe IS NULL OR
    electric_capacity_running_mwe <= electric_capacity_mwe
  )
);

CREATE TABLE IF NOT EXISTS operating_assets (
  operating_asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_plant_id TEXT UNIQUE,

  asset_name TEXT NOT NULL,
  asset_name_short TEXT,
  asset_name_clean TEXT,
  project_group TEXT,
  other_name TEXT,

  primary_use_type_code TEXT NOT NULL DEFAULT 'unknown'
    REFERENCES ref_geothermal_use_types(code),
  lifecycle_phase_code TEXT NOT NULL DEFAULT 'operating'
    REFERENCES ref_lifecycle_phases(code),

  location_text TEXT,
  country TEXT,
  region TEXT,
  wb_region TEXT,
  latitude NUMERIC(9,6) CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  longitude NUMERIC(9,6) CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  field_name TEXT,
  resource_type TEXT,
  resource_temp_c NUMERIC(8,2),

  potential_min_mwe NUMERIC(12,3) CHECK (potential_min_mwe IS NULL OR potential_min_mwe >= 0),
  potential_max_mwe NUMERIC(12,3) CHECK (potential_max_mwe IS NULL OR potential_max_mwe >= 0),
  electric_capacity_mwe NUMERIC(12,3) CHECK (electric_capacity_mwe IS NULL OR electric_capacity_mwe >= 0),
  electric_capacity_running_mwe NUMERIC(12,3) CHECK (electric_capacity_running_mwe IS NULL OR electric_capacity_running_mwe >= 0),
  thermal_capacity_mwth NUMERIC(12,3) CHECK (thermal_capacity_mwth IS NULL OR thermal_capacity_mwth >= 0),
  installed_heat_pump_capacity_mwth NUMERIC(12,3)
    CHECK (installed_heat_pump_capacity_mwth IS NULL OR installed_heat_pump_capacity_mwth >= 0),
  geothermal_resource_capacity_mwth NUMERIC(12,3)
    CHECK (geothermal_resource_capacity_mwth IS NULL OR geothermal_resource_capacity_mwth >= 0),
  annual_power_generation_gwhe NUMERIC(14,3)
    CHECK (annual_power_generation_gwhe IS NULL OR annual_power_generation_gwhe >= 0),
  annual_heat_supply_gwhth NUMERIC(14,3)
    CHECK (annual_heat_supply_gwhth IS NULL OR annual_heat_supply_gwhth >= 0),
  annual_cooling_supply_gwhc NUMERIC(14,3)
    CHECK (annual_cooling_supply_gwhc IS NULL OR annual_cooling_supply_gwhc >= 0),
  capacity_estimate_status_code TEXT NOT NULL DEFAULT 'unknown'
    REFERENCES ref_estimate_statuses(code),
  output_estimate_status_code TEXT NOT NULL DEFAULT 'unknown'
    REFERENCES ref_estimate_statuses(code),

  start_dev_year INTEGER CHECK (start_dev_year IS NULL OR start_dev_year BETWEEN 1900 AND 2100),
  cod_year INTEGER CHECK (cod_year IS NULL OR cod_year BETWEEN 1900 AND 2100),
  cod_month INTEGER CHECK (cod_month IS NULL OR cod_month BETWEEN 1 AND 12),
  cod_raw TEXT,

  wells_total NUMERIC(10,2) CHECK (wells_total IS NULL OR wells_total >= 0),
  wells_prod_active NUMERIC(10,2) CHECK (wells_prod_active IS NULL OR wells_prod_active >= 0),
  wells_reinj_active NUMERIC(10,2) CHECK (wells_reinj_active IS NULL OR wells_reinj_active >= 0),
  wells_inactive_standby NUMERIC(10,2) CHECK (wells_inactive_standby IS NULL OR wells_inactive_standby >= 0),
  wells_other_exploration NUMERIC(10,2) CHECK (wells_other_exploration IS NULL OR wells_other_exploration >= 0),
  well_depth_prod_m NUMERIC(12,2) CHECK (well_depth_prod_m IS NULL OR well_depth_prod_m >= 0),
  temp_prod_well_c NUMERIC(8,2),
  flow_rate_ls NUMERIC(12,3) CHECK (flow_rate_ls IS NULL OR flow_rate_ls >= 0),

  number_of_units TEXT,
  plant_technology TEXT,
  turbine_supplier TEXT,
  epc_suppliers TEXT,
  ppa_usd_kwh NUMERIC(12,6) CHECK (ppa_usd_kwh IS NULL OR ppa_usd_kwh >= 0),
  total_investment_cost TEXT,

  promoted_from_project_id UUID REFERENCES projects(project_id),
  promoted_at TIMESTAMPTZ,

  website_information TEXT,
  source_evidence_note TEXT,
  notes TEXT,
  internal_comments TEXT,

  review_status_code TEXT NOT NULL DEFAULT 'draft'
    REFERENCES ref_review_statuses(code),
  research_status TEXT,
  created_by_user_id UUID REFERENCES app_users(user_id),
  last_updated_by_user_id UUID REFERENCES app_users(user_id),
  approved_by_user_id UUID REFERENCES app_users(user_id),
  approved_at TIMESTAMPTZ,
  export_ready_at TIMESTAMPTZ,

  legacy_created_at TEXT,
  legacy_updated_at TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (
    potential_min_mwe IS NULL OR
    potential_max_mwe IS NULL OR
    potential_max_mwe >= potential_min_mwe
  ),
  CHECK (
    electric_capacity_mwe IS NULL OR
    electric_capacity_running_mwe IS NULL OR
    electric_capacity_running_mwe <= electric_capacity_mwe
  )
);

CREATE TABLE IF NOT EXISTS project_operating_asset_links (
  project_operating_asset_link_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  operating_asset_id UUID NOT NULL REFERENCES operating_assets(operating_asset_id) ON DELETE CASCADE,
  link_type TEXT NOT NULL DEFAULT 'promotion',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, operating_asset_id, link_type)
);

-- ---------------------------------------------------------------------------
-- Asset classification and technology tags
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS asset_use_components (
  asset_use_component_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(project_id) ON DELETE CASCADE,
  operating_asset_id UUID REFERENCES operating_assets(operating_asset_id) ON DELETE CASCADE,
  use_type_code TEXT NOT NULL REFERENCES ref_geothermal_use_types(code),
  direct_use_category_code TEXT REFERENCES ref_direct_use_categories(code),
  mineral_type TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(project_id, operating_asset_id) = 1)
);

CREATE TABLE IF NOT EXISTS asset_technology_tags (
  asset_technology_tag_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(project_id) ON DELETE CASCADE,
  operating_asset_id UUID REFERENCES operating_assets(operating_asset_id) ON DELETE CASCADE,
  technology_tag_code TEXT NOT NULL REFERENCES ref_technology_tags(code),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(project_id, operating_asset_id) = 1)
);

-- ---------------------------------------------------------------------------
-- Companies and relationships
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS companies (
  company_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_company_id TEXT UNIQUE,

  company_name TEXT NOT NULL,
  company_name_short TEXT,
  company_legal_name TEXT,
  company_name_clean TEXT,
  website_url TEXT,
  linkedin_url TEXT,

  entity_type_code TEXT REFERENCES ref_company_entity_types(code),
  company_type_primary_code TEXT REFERENCES ref_company_primary_types(code),
  ownership_type TEXT,
  company_status TEXT,
  is_active_company BOOLEAN NOT NULL DEFAULT TRUE,
  is_spv BOOLEAN NOT NULL DEFAULT FALSE,
  is_group_parent BOOLEAN NOT NULL DEFAULT FALSE,
  is_operating_entity BOOLEAN NOT NULL DEFAULT FALSE,

  parent_company_id UUID REFERENCES companies(company_id),
  ultimate_parent_company_id UUID REFERENCES companies(company_id),
  company_group_name TEXT,
  group_inclusion_type TEXT,
  group_reporting_weight NUMERIC(5,4) NOT NULL DEFAULT 1.0
    CHECK (group_reporting_weight >= 0 AND group_reporting_weight <= 1),
  consolidation_method TEXT,

  headquarters_city TEXT,
  headquarters_country TEXT,
  region TEXT,
  wb_region TEXT,
  geothermal_focus TEXT,
  technology_focus TEXT,
  service_scope_summary TEXT,
  operating_markets_summary TEXT,

  source_evidence_note TEXT,
  notes TEXT,
  information TEXT,
  internal_comments TEXT,

  review_status_code TEXT NOT NULL DEFAULT 'draft'
    REFERENCES ref_review_statuses(code),
  research_status TEXT,
  created_by_user_id UUID REFERENCES app_users(user_id),
  last_updated_by_user_id UUID REFERENCES app_users(user_id),
  approved_by_user_id UUID REFERENCES app_users(user_id),
  approved_at TIMESTAMPTZ,
  export_ready_at TIMESTAMPTZ,

  legacy_created_at TEXT,
  legacy_updated_at TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_secondary_types (
  company_secondary_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  company_type_code TEXT NOT NULL REFERENCES ref_company_primary_types(code),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, company_type_code)
);

CREATE TABLE IF NOT EXISTS company_role_profiles (
  company_role_profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_company_role_id TEXT UNIQUE,
  company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  role_code TEXT NOT NULL REFERENCES ref_company_roles(code),
  role_subtype TEXT,
  role_scope TEXT,
  role_status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_project_links (
  company_project_link_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_company_project_link_id TEXT UNIQUE,
  company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  role_code TEXT NOT NULL REFERENCES ref_company_roles(code),
  role_detail TEXT,
  ownership_share NUMERIC(7,4) CHECK (ownership_share IS NULL OR ownership_share BETWEEN 0 AND 100),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, project_id, role_code)
);

CREATE TABLE IF NOT EXISTS company_operating_asset_links (
  company_operating_asset_link_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_company_plant_link_id TEXT UNIQUE,
  company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  operating_asset_id UUID NOT NULL REFERENCES operating_assets(operating_asset_id) ON DELETE CASCADE,
  role_code TEXT NOT NULL REFERENCES ref_company_roles(code),
  role_detail TEXT,
  ownership_share NUMERIC(7,4) CHECK (ownership_share IS NULL OR ownership_share BETWEEN 0 AND 100),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, operating_asset_id, role_code)
);

CREATE TABLE IF NOT EXISTS company_relationships (
  company_relationship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_company_relationship_id TEXT UNIQUE,
  company_id_from UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  company_id_to UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  relationship_type_code TEXT NOT NULL REFERENCES ref_company_relationship_types(code),
  ownership_percentage NUMERIC(7,4)
    CHECK (ownership_percentage IS NULL OR ownership_percentage BETWEEN 0 AND 100),
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (company_id_from <> company_id_to)
);

-- ---------------------------------------------------------------------------
-- Sources and evidence
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sources (
  source_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type_code TEXT NOT NULL DEFAULT 'web'
    REFERENCES ref_source_types(code),
  title TEXT,
  url TEXT,
  publisher TEXT,
  published_date DATE,
  accessed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entity_sources (
  entity_source_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES sources(source_id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(project_id) ON DELETE CASCADE,
  operating_asset_id UUID REFERENCES operating_assets(operating_asset_id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  evidence_type TEXT,
  evidence_note TEXT,
  confidence_status_code TEXT NOT NULL DEFAULT 'unknown'
    REFERENCES ref_estimate_statuses(code),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(project_id, operating_asset_id, company_id) = 1)
);

-- ---------------------------------------------------------------------------
-- Audit and review events
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_events (
  audit_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (
    entity_type IN ('project', 'operating_asset', 'company', 'company_project_link',
                    'company_operating_asset_link', 'company_relationship')
  ),
  entity_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  previous_review_status_code TEXT REFERENCES ref_review_statuses(code),
  next_review_status_code TEXT REFERENCES ref_review_statuses(code),
  actor_user_id UUID REFERENCES app_users(user_id),
  event_note TEXT,
  changed_fields JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(project_name);
CREATE INDEX IF NOT EXISTS idx_projects_clean ON projects(project_name_clean);
CREATE INDEX IF NOT EXISTS idx_projects_country ON projects(country);
CREATE INDEX IF NOT EXISTS idx_projects_region ON projects(region);
CREATE INDEX IF NOT EXISTS idx_projects_use_type ON projects(primary_use_type_code);
CREATE INDEX IF NOT EXISTS idx_projects_phase ON projects(lifecycle_phase_code);
CREATE INDEX IF NOT EXISTS idx_projects_review_status ON projects(review_status_code);
CREATE INDEX IF NOT EXISTS idx_projects_legacy ON projects(legacy_project_id);

CREATE INDEX IF NOT EXISTS idx_operating_assets_name ON operating_assets(asset_name);
CREATE INDEX IF NOT EXISTS idx_operating_assets_clean ON operating_assets(asset_name_clean);
CREATE INDEX IF NOT EXISTS idx_operating_assets_country ON operating_assets(country);
CREATE INDEX IF NOT EXISTS idx_operating_assets_region ON operating_assets(region);
CREATE INDEX IF NOT EXISTS idx_operating_assets_use_type ON operating_assets(primary_use_type_code);
CREATE INDEX IF NOT EXISTS idx_operating_assets_phase ON operating_assets(lifecycle_phase_code);
CREATE INDEX IF NOT EXISTS idx_operating_assets_review_status ON operating_assets(review_status_code);
CREATE INDEX IF NOT EXISTS idx_operating_assets_legacy ON operating_assets(legacy_plant_id);

CREATE INDEX IF NOT EXISTS idx_asset_use_components_project ON asset_use_components(project_id);
CREATE INDEX IF NOT EXISTS idx_asset_use_components_asset ON asset_use_components(operating_asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_use_components_use_type ON asset_use_components(use_type_code);
CREATE INDEX IF NOT EXISTS idx_asset_use_components_direct_use ON asset_use_components(direct_use_category_code);

CREATE INDEX IF NOT EXISTS idx_asset_technology_tags_project ON asset_technology_tags(project_id);
CREATE INDEX IF NOT EXISTS idx_asset_technology_tags_asset ON asset_technology_tags(operating_asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_technology_tags_code ON asset_technology_tags(technology_tag_code);

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(company_name);
CREATE INDEX IF NOT EXISTS idx_companies_clean ON companies(company_name_clean);
CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(headquarters_country);
CREATE INDEX IF NOT EXISTS idx_companies_primary_type ON companies(company_type_primary_code);
CREATE INDEX IF NOT EXISTS idx_companies_parent ON companies(parent_company_id);
CREATE INDEX IF NOT EXISTS idx_companies_review_status ON companies(review_status_code);
CREATE INDEX IF NOT EXISTS idx_companies_legacy ON companies(legacy_company_id);

CREATE INDEX IF NOT EXISTS idx_company_project_links_company ON company_project_links(company_id);
CREATE INDEX IF NOT EXISTS idx_company_project_links_project ON company_project_links(project_id);
CREATE INDEX IF NOT EXISTS idx_company_project_links_role ON company_project_links(role_code);

CREATE INDEX IF NOT EXISTS idx_company_asset_links_company ON company_operating_asset_links(company_id);
CREATE INDEX IF NOT EXISTS idx_company_asset_links_asset ON company_operating_asset_links(operating_asset_id);
CREATE INDEX IF NOT EXISTS idx_company_asset_links_role ON company_operating_asset_links(role_code);

CREATE INDEX IF NOT EXISTS idx_company_relationships_from ON company_relationships(company_id_from);
CREATE INDEX IF NOT EXISTS idx_company_relationships_to ON company_relationships(company_id_to);
CREATE INDEX IF NOT EXISTS idx_company_relationships_type ON company_relationships(relationship_type_code);

CREATE INDEX IF NOT EXISTS idx_entity_sources_source ON entity_sources(source_id);
CREATE INDEX IF NOT EXISTS idx_entity_sources_project ON entity_sources(project_id);
CREATE INDEX IF NOT EXISTS idx_entity_sources_asset ON entity_sources(operating_asset_id);
CREATE INDEX IF NOT EXISTS idx_entity_sources_company ON entity_sources(company_id);

CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_events(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at);

-- ---------------------------------------------------------------------------
-- Seed reference values
-- ---------------------------------------------------------------------------

INSERT INTO ref_geothermal_use_types (code, label, sort_order) VALUES
  ('power', 'Power', 10),
  ('direct_use', 'Direct Use', 20),
  ('mineral_extraction', 'Mineral Extraction', 30),
  ('hybrid', 'Hybrid', 40),
  ('unknown', 'Unknown', 99)
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

INSERT INTO ref_direct_use_categories (code, label, mvp_scope, sort_order) VALUES
  ('district_heating', 'District Heating', TRUE, 10),
  ('district_cooling', 'District Cooling', TRUE, 20),
  ('building_heating_cooling', 'Building Heating & Cooling', TRUE, 30),
  ('industrial_process_heat', 'Industrial Process Heat', TRUE, 40),
  ('agriculture_greenhouses', 'Agriculture / Greenhouses', TRUE, 50),
  ('aquaculture', 'Aquaculture', TRUE, 60),
  ('food_drying_processing', 'Food Drying / Processing', TRUE, 70),
  ('bathing_wellness_tourism', 'Bathing / Wellness / Tourism', TRUE, 80),
  ('cooling_refrigeration', 'Cooling & Refrigeration', TRUE, 90),
  ('hybrid_heat_power', 'Hybrid Heat and Power', TRUE, 100),
  ('other_direct_use', 'Other Direct Use', TRUE, 110),
  ('snow_melting_infrastructure', 'Snow Melting & Infrastructure', FALSE, 120),
  ('thermal_storage_linked_geothermal_use', 'Thermal Storage-Linked Geothermal Use', FALSE, 130)
ON CONFLICT (code) DO UPDATE
SET label = EXCLUDED.label, mvp_scope = EXCLUDED.mvp_scope, sort_order = EXCLUDED.sort_order;

INSERT INTO ref_technology_tags (code, label, sort_order) VALUES
  ('direct_hydrothermal_use', 'Direct Hydrothermal Use', 10),
  ('heat_pump_assisted', 'Heat Pump Assisted', 20),
  ('large_scale_heat_pump', 'Large-Scale Heat Pump', 30),
  ('ground_source_heat_pump_gshp', 'Ground-Source Heat Pump / GSHP', 40),
  ('aquifer_thermal_energy_storage_ates', 'Aquifer Thermal Energy Storage / ATES', 50),
  ('borehole_thermal_energy_storage_btes', 'Borehole Thermal Energy Storage / BTES', 60),
  ('closed_loop_geothermal', 'Closed-Loop Geothermal', 70),
  ('egs_ags', 'EGS / AGS', 80),
  ('cascaded_use', 'Cascaded Use', 90),
  ('waste_heat_integration', 'Waste Heat Integration', 100),
  ('seawater_or_water_source_integration', 'Seawater or Water-Source Integration', 110),
  ('hybrid_renewable_integration', 'Hybrid Renewable Integration', 120)
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

INSERT INTO ref_lifecycle_phases (code, label, sort_order, is_operating) VALUES
  ('prospect_tbd', 'Prospect / TBD', 10, FALSE),
  ('exploration', 'Exploration', 20, FALSE),
  ('pre_feasibility', 'Pre-Feasibility', 30, FALSE),
  ('feasibility', 'Feasibility', 40, FALSE),
  ('construction', 'Construction', 50, FALSE),
  ('operating', 'Operating', 60, TRUE),
  ('cancelled', 'Cancelled', 90, FALSE)
ON CONFLICT (code) DO UPDATE
SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order, is_operating = EXCLUDED.is_operating;

INSERT INTO ref_review_statuses (code, label, sort_order, is_terminal) VALUES
  ('draft', 'Draft', 10, FALSE),
  ('validation', 'Validation', 20, FALSE),
  ('approved', 'Approved', 30, FALSE),
  ('export_ready', 'Export Ready', 40, FALSE),
  ('needs_update', 'Needs Update', 50, FALSE),
  ('archived', 'Archived', 90, TRUE)
ON CONFLICT (code) DO UPDATE
SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order, is_terminal = EXCLUDED.is_terminal;

INSERT INTO ref_estimate_statuses (code, label, sort_order) VALUES
  ('unknown', 'Unknown', 10),
  ('reported', 'Reported', 20),
  ('estimated', 'Estimated', 30),
  ('inferred', 'Inferred', 40),
  ('verified', 'Verified', 50),
  ('not_applicable', 'Not Applicable', 90)
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

INSERT INTO ref_company_roles (code, label, role_group, sort_order) VALUES
  ('owner', 'Owner', 'asset', 10),
  ('operator', 'Operator', 'asset', 20),
  ('developer', 'Developer', 'asset', 30),
  ('investor', 'Investor', 'finance', 40),
  ('financier', 'Financier', 'finance', 50),
  ('resource_owner', 'Resource Owner', 'asset', 60),
  ('drilling_contractor', 'Drilling Contractor', 'supplier', 70),
  ('epc_contractor', 'EPC Contractor', 'supplier', 80),
  ('engineering_consultant', 'Engineering Consultant', 'supplier', 90),
  ('technology_supplier', 'Technology Supplier', 'supplier', 100),
  ('equipment_supplier', 'Equipment Supplier', 'supplier', 110),
  ('utility_offtaker', 'Utility / Offtaker', 'offtake', 120),
  ('government_public_agency', 'Government / Public Agency', 'public', 130),
  ('research_institution', 'Research Institution', 'research', 140),
  ('district_heating_operator', 'District Heating Operator', 'direct_use', 150),
  ('district_cooling_operator', 'District Cooling Operator', 'direct_use', 160),
  ('municipality', 'Municipality', 'direct_use', 170),
  ('industrial_host', 'Industrial Host', 'direct_use', 180),
  ('building_owner', 'Building Owner', 'direct_use', 190),
  ('heat_offtaker', 'Heat Offtaker', 'direct_use', 200),
  ('heat_pump_supplier', 'Heat Pump Supplier', 'direct_use', 210),
  ('greenhouse_operator', 'Greenhouse Operator', 'direct_use', 220),
  ('cooling_offtaker', 'Cooling Offtaker', 'direct_use', 230),
  ('other', 'Other', 'general', 999)
ON CONFLICT (code) DO UPDATE
SET label = EXCLUDED.label, role_group = EXCLUDED.role_group, sort_order = EXCLUDED.sort_order;

INSERT INTO ref_company_entity_types (code, label, sort_order) VALUES
  ('operating_entity', 'Operating Entity', 10),
  ('holding_company', 'Holding Company', 20),
  ('subsidiary', 'Subsidiary', 30),
  ('business_unit', 'Business Unit', 40),
  ('association', 'Association', 50),
  ('advocacy_non_profit', 'Advocacy / Non-Profit', 60),
  ('government_public_agency', 'Government / Public Agency', 70),
  ('unknown', 'Unknown', 99)
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

INSERT INTO ref_company_primary_types (code, label, sort_order) VALUES
  ('resource_owner', 'Resource Owner', 10),
  ('developer', 'Developer', 20),
  ('technology_provider', 'Technology Provider', 30),
  ('utility_ipp', 'Utility / IPP', 40),
  ('turbine_supplier', 'Turbine Supplier', 50),
  ('oem_equipment_supplier', 'OEM / Equipment Supplier', 60),
  ('service_provider', 'Service Provider', 70),
  ('drilling_company', 'Drilling Company', 80),
  ('epc_contractor', 'EPC Contractor', 90),
  ('investment_finance', 'Investment / Finance', 100),
  ('energy_major', 'Energy Major', 110),
  ('public_development_institution', 'Public / Development Institution', 120),
  ('association_industry_body', 'Association / Industry Body', 130),
  ('advocacy_non_profit', 'Advocacy / Non-Profit', 140),
  ('holding_group_entity', 'Holding / Group Entity', 150),
  ('spv_project_company', 'SPV / Project Company', 160),
  ('unknown', 'Unknown', 999)
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

INSERT INTO ref_company_relationship_types (code, label, sort_order) VALUES
  ('parent_subsidiary', 'Parent / Subsidiary', 10),
  ('ownership', 'Ownership', 20),
  ('joint_venture', 'Joint Venture', 30),
  ('sister_company', 'Sister Company', 40),
  ('brand_or_business_unit', 'Brand / Business Unit', 50),
  ('other', 'Other', 999)
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

INSERT INTO ref_source_types (code, label, sort_order) VALUES
  ('web', 'Web Page', 10),
  ('article', 'Article', 20),
  ('pdf', 'PDF / Report', 30),
  ('company', 'Company Source', 40),
  ('government', 'Government Source', 50),
  ('internal_note', 'Internal Note', 60),
  ('other', 'Other', 999)
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

COMMIT;
