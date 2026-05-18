# Current SQL To PostgreSQL Mapping

Date: 2026-05-18

Purpose: provide the first mapping from the current live SQL/SQLite-style schema into the new PostgreSQL schema.

This document is based on the local reference database and must be checked against a fresh export of the live server database before implementation.

## Current Mapping Status

This is still a planning mapping, not a final import specification.

Before migration scripts are written, run the live SQLite inspector against a
fresh Hetzner backup:

```bash
cd web
npm run sqlite:inspect -- --db "../migration/live_exports/YYYY-MM-DD/tge_live_YYYYMMDD_HHMMSS.db" --profile-values
```

Then update this document with:

- tables present in live but not local/reference
- columns present in live but not mapped here
- columns mapped here but missing from live
- row counts by core table
- unmapped lifecycle/status/company role values
- source/evidence fields that must be preserved
- fields that should move into internal notes, metadata JSON, or future
  structured tables

The live SQLite file itself should remain local/private and should not be
committed or uploaded.

## Table Mapping

| Current table | New PostgreSQL table | Notes |
| --- | --- | --- |
| `projects` | `projects` | Preserve current `project_id` as `legacy_project_id`. |
| `plants` | `operating_assets` | Preserve current `plant_id` as `legacy_plant_id`. UI may still call these Plants for power assets. |
| `companies` | `companies` | Preserve current `company_id` as `legacy_company_id`. |
| `company_project_links` | `company_project_links` | Preserve current link ID as `legacy_company_project_link_id`. |
| `company_plant_links` | `company_operating_asset_links` | Preserve current link ID as `legacy_company_plant_link_id`. |
| `company_relationships` | `company_relationships` | Preserve current relationship ID as `legacy_company_relationship_id`. |
| `company_roles` | `company_role_profiles` | Preserve current role ID as `legacy_company_role_id`. |
| `users` | `app_users` | Preserve current user ID as `legacy_user_id`. |
| `ref_company_type_primary` | `ref_company_primary_types` | Needs code normalization. |
| `ref_company_type_secondary` | `company_secondary_types` plus reference values | Current secondary values need normalization. |
| `ref_company_roles` | `ref_company_roles` | Needs code normalization and merge with semantic role list. |

## Projects Mapping

| Current field | New field | Notes |
| --- | --- | --- |
| `project_id` | `legacy_project_id` | Generate new UUID in `project_id`. |
| `project_name` | `project_name` | Required after import cleanup. |
| `project_group` | `project_group` | Preserve. |
| `other_name` | `other_name` | Preserve. |
| `owner_operator` | company links or notes | Prefer company links where available; keep raw text in notes if not linked. |
| `developer` | company links or notes | Prefer company links where available; keep raw text in notes if not linked. |
| `location_text` | `location_text` | Preserve. |
| `country` | `country` | Normalize later. |
| `region` | `region` | Normalize later. |
| `wb_region` | `wb_region` | Normalize later. |
| `location_x` | `latitude` | Current naming appears to mean latitude. Validate. |
| `location_y` | `longitude` | Current naming appears to mean longitude. Validate. |
| `potential_min_mw` | `potential_min_mwe` | Current data is power-heavy; direct-use later uses MWth fields. |
| `potential_max_mw` | `potential_max_mwe` | Same as above. |
| `installed_capacity_mw` | `electric_capacity_mwe` | For current power records. |
| `capacity_running_mw` | `electric_capacity_running_mwe` | For current power records. |
| `gross_production_gwh` | `annual_power_generation_gwhe` | For power records. |
| `start_dev_year` | `start_dev_year` | Convert to integer where valid. |
| `cod` | `target_cod_year`, `target_cod_month`, `cod_raw` | Parse YYYY or YYYY-MM; preserve raw value. |
| `resource_type` | `resource_type` | Preserve; later normalize. |
| `resource_temp_c` | `resource_temp_c` | Preserve numeric. |
| `project_phase` | `lifecycle_phase_code` | Map to official codes. |
| `phase_historical` | notes or future phase history | Preserve in notes unless phase-history table is added. |
| `field_name` | `field_name` | Preserve. |
| well fields | same named well fields | Preserve numeric. |
| `plant_technology` | `plant_technology` | Preserve; later normalize or convert to tags. |
| `turbine_supplier` | `turbine_supplier` or company link | Prefer company link when possible. |
| `epc_suppliers` | `epc_suppliers` or company link | Prefer company link when possible. |
| `investor` | company link or notes | Prefer company link when possible. |
| `ppa_usd_kwh` | `ppa_usd_kwh` | Convert numeric where possible. |
| `total_investment_cost` | `total_investment_cost` | Preserve text for now. |
| `website_information` | `website_information` and/or `sources` | Preserve and later parse URLs. |
| `notes` | `notes` | Preserve. |
| `edited_description` | `internal_comments` or audit event | Preserve. |
| `research_status` | `research_status` | Preserve raw value. |
| `review_status` | `review_status_code` | Map to v1 codes. |
| `created_by_user_id` | mapped `created_by_user_id` | Map through `app_users.legacy_user_id`. |
| `last_updated_by_user_id` | mapped `last_updated_by_user_id` | Map through `app_users.legacy_user_id`. |
| `approved_by_user_id` | mapped `approved_by_user_id` | Map through `app_users.legacy_user_id`. |
| `approved_at` | `approved_at` | Convert timestamp where valid. |
| `created_at` | `created_at` and `legacy_created_at` | Preserve raw if conversion fails. |
| `updated_at` | `updated_at` and `legacy_updated_at` | Preserve raw if conversion fails. |

Default import values:

```text
primary_use_type_code = power
capacity_estimate_status_code = unknown
output_estimate_status_code = unknown
```

Use `unknown` for `primary_use_type_code` when a record is not clearly power.

## Plants Mapping

Current `plants` should become `operating_assets`.

| Current field | New field | Notes |
| --- | --- | --- |
| `plant_id` | `legacy_plant_id` | Generate new UUID in `operating_asset_id`. |
| `plant_name` | `asset_name` | Required after import cleanup. |
| `project_group` | `project_group` | Preserve. |
| `other_name` | `other_name` | Preserve. |
| `owner_operator` | company links or notes | Prefer company links where available. |
| `developer` | company links or notes | Prefer company links where available. |
| `location_text` | `location_text` | Preserve. |
| `country` | `country` | Normalize later. |
| `region` | `region` | Normalize later. |
| `wb_region` | `wb_region` | Normalize later. |
| `location_x` | `latitude` | Validate. |
| `location_y` | `longitude` | Validate. |
| `potential_min_mw` | `potential_min_mwe` | Current power assumption. |
| `potential_max_mw` | `potential_max_mwe` | Current power assumption. |
| `installed_capacity_mw` | `electric_capacity_mwe` | Current power assumption. |
| `capacity_running_mw` | `electric_capacity_running_mwe` | Current power assumption. |
| `gross_production_gwh` | `annual_power_generation_gwhe` | Current power assumption. |
| `cod` | `cod_year`, `cod_month`, `cod_raw` | Parse YYYY or YYYY-MM; preserve raw. |
| `promoted_from_project_id` | mapped `promoted_from_project_id` | Map through `projects.legacy_project_id`. |
| `promoted_at` | `promoted_at` | Convert timestamp where valid. |
| remaining technical fields | corresponding fields | Preserve where possible. |

After plant import, create `project_operating_asset_links` when `promoted_from_project_id` is present.

## Companies Mapping

| Current field | New field | Notes |
| --- | --- | --- |
| `company_id` | `legacy_company_id` | Generate new UUID. |
| `company_name` | `company_name` | Required. |
| `company_name_short` | `company_name_short` | Preserve. |
| `company_legal_name` | `company_legal_name` | Preserve. |
| `company_name_clean` | `company_name_clean` | Preserve or regenerate. |
| `website_url` | `website_url` | Preserve. |
| `linkedin_url` | `linkedin_url` | Preserve. |
| `entity_type` | `entity_type_code` | Normalize to ref code. |
| `company_type_primary` | `company_type_primary_code` | Normalize to ref code. |
| `secondary_types` | `company_secondary_types` | Parse current JSON/text/list into rows. |
| `ownership_type` | `ownership_type` | Preserve text. |
| `is_active_company` | `is_active_company` | Convert 0/1 to boolean. |
| `company_status` | `company_status` | Preserve. |
| `parent_company_id` | mapped `parent_company_id` | Map through `companies.legacy_company_id`. |
| `ultimate_parent_company_id` | mapped `ultimate_parent_company_id` | Map through legacy ID. |
| `is_spv` | `is_spv` | Convert 0/1 to boolean. |
| `group_reporting_weight` | `group_reporting_weight` | Validate 0-1. |
| `consolidation_method` | `consolidation_method` | Preserve. |
| location and summary fields | corresponding fields | Preserve. |
| review/audit fields | corresponding fields | Map user IDs and status values. |

## Company Link Mapping

Current project links:

```text
company_project_links -> company_project_links
```

Current plant links:

```text
company_plant_links -> company_operating_asset_links
```

Map role text to `ref_company_roles.code`.

Unmapped roles should be reported and loaded only after review, or mapped to `other` with preserved `role_detail`.

## Review Status Mapping

Initial mapping:

| Current value | New code |
| --- | --- |
| `pending_review` | `validation` |
| `Pending Review` | `validation` |
| `Approved` | `approved` |
| `approved` | `approved` |
| `Done` | `approved` or `export_ready`, to be decided |
| `Need Info` | `needs_update` |
| blank/null | `draft` |

Do not silently map unknown values. Report them.

## Lifecycle Phase Mapping

Initial mapping:

| Current value | New code |
| --- | --- |
| `Prospect / TBD` | `prospect_tbd` |
| `Exploration` | `exploration` |
| `Pre-Feasibility` | `pre_feasibility` |
| `Feasibility` | `feasibility` |
| `Construction` | `construction` |
| `Operational` | `operating` |
| `Operating` | `operating` |
| `Cancelled` | `cancelled` |

Do not silently map unknown values. Report them.

## Migration Risks

Known risks:

- live server schema may differ from local reference schema
- current `review_status` casing is inconsistent
- current company foreign keys may contain historical references
- some company role vocabularies differ across files
- power-only fields may not fit future direct-use records
- `location_x` / `location_y` naming must be confirmed as latitude/longitude
- source evidence is not yet structured

## Required Before Import Script

Before writing final migration scripts:

1. export current live database
2. compare live schema to this mapping
3. list unmapped columns and values
4. decide status mappings
5. decide role mappings
6. decide direct-use/mineral classification rules
7. run migration on staging database first
