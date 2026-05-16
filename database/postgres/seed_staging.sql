-- TGE Geothermal Intelligence Platform
-- Safe non-confidential seed data for PostgreSQL staging/development.
--
-- This file is idempotent. It does not contain live project, plant, company,
-- user, client, or confidential data.

BEGIN;

INSERT INTO companies (
  legacy_company_id,
  company_name,
  company_name_short,
  company_name_clean,
  entity_type_code,
  company_type_primary_code,
  ownership_type,
  company_status,
  headquarters_country,
  geothermal_focus,
  service_scope_summary,
  review_status_code,
  research_status,
  notes
) VALUES
  (
    'SAMPLE-COMPANY-DEVELOPER-001',
    'Sample Geothermal Development Company',
    'Sample GeoDev',
    'sample geothermal development company',
    'operating_entity',
    'developer',
    'Private',
    'Active',
    'Iceland',
    'Power and direct-use geothermal development',
    'Non-confidential staging sample for development workflows.',
    'approved',
    'Done',
    'Safe staging record. Not a real company.'
  ),
  (
    'SAMPLE-COMPANY-UTILITY-001',
    'Sample District Heating Utility',
    'Sample Heat Utility',
    'sample district heating utility',
    'operating_entity',
    'utility_ipp',
    'Public',
    'Active',
    'Germany',
    'District heating and thermal energy services',
    'Non-confidential staging sample for direct-use workflows.',
    'approved',
    'Done',
    'Safe staging record. Not a real company.'
  )
ON CONFLICT (legacy_company_id) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  company_name_short = EXCLUDED.company_name_short,
  company_name_clean = EXCLUDED.company_name_clean,
  entity_type_code = EXCLUDED.entity_type_code,
  company_type_primary_code = EXCLUDED.company_type_primary_code,
  ownership_type = EXCLUDED.ownership_type,
  company_status = EXCLUDED.company_status,
  headquarters_country = EXCLUDED.headquarters_country,
  geothermal_focus = EXCLUDED.geothermal_focus,
  service_scope_summary = EXCLUDED.service_scope_summary,
  review_status_code = EXCLUDED.review_status_code,
  research_status = EXCLUDED.research_status,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO projects (
  legacy_project_id,
  project_name,
  project_name_short,
  project_name_clean,
  primary_use_type_code,
  lifecycle_phase_code,
  location_text,
  country,
  region,
  wb_region,
  electric_capacity_mwe,
  thermal_capacity_mwth,
  annual_heat_supply_gwhth,
  capacity_estimate_status_code,
  output_estimate_status_code,
  review_status_code,
  research_status,
  notes
) VALUES
  (
    'SAMPLE-PROJECT-POWER-001',
    'Sample Power Development Project',
    'Sample Power Project',
    'sample power development project',
    'power',
    'exploration',
    'Sample geothermal field',
    'Iceland',
    'Europe',
    'Europe & Central Asia',
    25.000,
    NULL,
    NULL,
    'estimated',
    'unknown',
    'approved',
    'Done',
    'Safe staging record. Not a real project.'
  ),
  (
    'SAMPLE-PROJECT-DIRECT-USE-001',
    'Sample District Heating Project',
    'Sample Heat Project',
    'sample district heating project',
    'direct_use',
    'feasibility',
    'Sample city district heating network',
    'Germany',
    'Europe',
    'Europe & Central Asia',
    NULL,
    45.000,
    120.000,
    'estimated',
    'estimated',
    'approved',
    'Done',
    'Safe staging record. Not a real project.'
  )
ON CONFLICT (legacy_project_id) DO UPDATE SET
  project_name = EXCLUDED.project_name,
  project_name_short = EXCLUDED.project_name_short,
  project_name_clean = EXCLUDED.project_name_clean,
  primary_use_type_code = EXCLUDED.primary_use_type_code,
  lifecycle_phase_code = EXCLUDED.lifecycle_phase_code,
  location_text = EXCLUDED.location_text,
  country = EXCLUDED.country,
  region = EXCLUDED.region,
  wb_region = EXCLUDED.wb_region,
  electric_capacity_mwe = EXCLUDED.electric_capacity_mwe,
  thermal_capacity_mwth = EXCLUDED.thermal_capacity_mwth,
  annual_heat_supply_gwhth = EXCLUDED.annual_heat_supply_gwhth,
  capacity_estimate_status_code = EXCLUDED.capacity_estimate_status_code,
  output_estimate_status_code = EXCLUDED.output_estimate_status_code,
  review_status_code = EXCLUDED.review_status_code,
  research_status = EXCLUDED.research_status,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO operating_assets (
  legacy_plant_id,
  asset_name,
  asset_name_short,
  asset_name_clean,
  primary_use_type_code,
  lifecycle_phase_code,
  location_text,
  country,
  region,
  wb_region,
  electric_capacity_mwe,
  electric_capacity_running_mwe,
  thermal_capacity_mwth,
  annual_power_generation_gwhe,
  annual_heat_supply_gwhth,
  capacity_estimate_status_code,
  output_estimate_status_code,
  review_status_code,
  research_status,
  notes
) VALUES
  (
    'SAMPLE-ASSET-POWER-001',
    'Sample Operating Power Plant',
    'Sample Power Plant',
    'sample operating power plant',
    'power',
    'operating',
    'Sample geothermal field',
    'Iceland',
    'Europe',
    'Europe & Central Asia',
    20.000,
    19.000,
    NULL,
    155.000,
    NULL,
    'estimated',
    'estimated',
    'approved',
    'Done',
    'Safe staging record. Not a real plant.'
  ),
  (
    'SAMPLE-ASSET-DIRECT-USE-001',
    'Sample District Heating Facility',
    'Sample Heating Facility',
    'sample district heating facility',
    'direct_use',
    'operating',
    'Sample city district heating network',
    'Germany',
    'Europe',
    'Europe & Central Asia',
    NULL,
    NULL,
    40.000,
    NULL,
    110.000,
    'estimated',
    'estimated',
    'approved',
    'Done',
    'Safe staging record. Not a real facility.'
  )
ON CONFLICT (legacy_plant_id) DO UPDATE SET
  asset_name = EXCLUDED.asset_name,
  asset_name_short = EXCLUDED.asset_name_short,
  asset_name_clean = EXCLUDED.asset_name_clean,
  primary_use_type_code = EXCLUDED.primary_use_type_code,
  lifecycle_phase_code = EXCLUDED.lifecycle_phase_code,
  location_text = EXCLUDED.location_text,
  country = EXCLUDED.country,
  region = EXCLUDED.region,
  wb_region = EXCLUDED.wb_region,
  electric_capacity_mwe = EXCLUDED.electric_capacity_mwe,
  electric_capacity_running_mwe = EXCLUDED.electric_capacity_running_mwe,
  thermal_capacity_mwth = EXCLUDED.thermal_capacity_mwth,
  annual_power_generation_gwhe = EXCLUDED.annual_power_generation_gwhe,
  annual_heat_supply_gwhth = EXCLUDED.annual_heat_supply_gwhth,
  capacity_estimate_status_code = EXCLUDED.capacity_estimate_status_code,
  output_estimate_status_code = EXCLUDED.output_estimate_status_code,
  review_status_code = EXCLUDED.review_status_code,
  research_status = EXCLUDED.research_status,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO asset_use_components (
  project_id,
  use_type_code,
  direct_use_category_code,
  is_primary,
  notes
)
SELECT project_id, 'direct_use', 'district_heating', TRUE, 'Safe staging direct-use classification.'
FROM projects
WHERE legacy_project_id = 'SAMPLE-PROJECT-DIRECT-USE-001'
  AND NOT EXISTS (
    SELECT 1
    FROM asset_use_components component
    WHERE component.project_id = projects.project_id
      AND component.use_type_code = 'direct_use'
      AND component.direct_use_category_code = 'district_heating'
  );

INSERT INTO asset_use_components (
  operating_asset_id,
  use_type_code,
  direct_use_category_code,
  is_primary,
  notes
)
SELECT operating_asset_id, 'direct_use', 'district_heating', TRUE, 'Safe staging direct-use classification.'
FROM operating_assets
WHERE legacy_plant_id = 'SAMPLE-ASSET-DIRECT-USE-001'
  AND NOT EXISTS (
    SELECT 1
    FROM asset_use_components component
    WHERE component.operating_asset_id = operating_assets.operating_asset_id
      AND component.use_type_code = 'direct_use'
      AND component.direct_use_category_code = 'district_heating'
  );

INSERT INTO company_project_links (
  legacy_company_project_link_id,
  company_id,
  project_id,
  role_code,
  is_primary,
  notes
)
SELECT
  'SAMPLE-LINK-COMPANY-PROJECT-001',
  company.company_id,
  project.project_id,
  'developer',
  TRUE,
  'Safe staging relationship.'
FROM companies company
CROSS JOIN projects project
WHERE company.legacy_company_id = 'SAMPLE-COMPANY-DEVELOPER-001'
  AND project.legacy_project_id = 'SAMPLE-PROJECT-POWER-001'
ON CONFLICT (legacy_company_project_link_id) DO UPDATE SET
  role_code = EXCLUDED.role_code,
  is_primary = EXCLUDED.is_primary,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO company_operating_asset_links (
  legacy_company_plant_link_id,
  company_id,
  operating_asset_id,
  role_code,
  is_primary,
  notes
)
SELECT
  'SAMPLE-LINK-COMPANY-ASSET-001',
  company.company_id,
  asset.operating_asset_id,
  'district_heating_operator',
  TRUE,
  'Safe staging relationship.'
FROM companies company
CROSS JOIN operating_assets asset
WHERE company.legacy_company_id = 'SAMPLE-COMPANY-UTILITY-001'
  AND asset.legacy_plant_id = 'SAMPLE-ASSET-DIRECT-USE-001'
ON CONFLICT (legacy_company_plant_link_id) DO UPDATE SET
  role_code = EXCLUDED.role_code,
  is_primary = EXCLUDED.is_primary,
  notes = EXCLUDED.notes,
  updated_at = now();

COMMIT;
