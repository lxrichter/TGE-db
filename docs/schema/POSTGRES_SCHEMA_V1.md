# PostgreSQL Schema v1

Date: 2026-05-16

Schema file:

```text
database/postgres/schema_v1.sql
```

Purpose: define the first PostgreSQL schema baseline for the future TGE geothermal intelligence platform.

## Design Goals

The schema is designed to:

- support geothermal power, direct-use, mineral extraction, and hybrid assets
- keep projects and operating assets as shared top-level concepts
- allow UI labels to adapt: power plant, direct-use facility, hybrid complex
- support migration from the current live SQL database
- preserve old IDs through `legacy_*` columns
- support Railway/PostgreSQL deployment
- support validation, approval, export-readiness, and audit history
- support source/evidence links before the full article/PDF registry exists

## Main Structural Decision

The future schema uses:

```text
projects
operating_assets
```

instead of treating power plants and direct-use facilities as separate top-level database systems.

This keeps the model coherent while allowing different labels and views:

- power: Plant
- direct-use: Facility
- hybrid: Plant / Facility / Complex

The current prototype uses `plants`; migration should map current `plants` into `operating_assets`.

## Core Tables

Primary entity tables:

- `projects`
- `operating_assets`
- `companies`
- `app_users`

Relationship tables:

- `project_operating_asset_links`
- `company_project_links`
- `company_operating_asset_links`
- `company_relationships`

Classification tables:

- `asset_use_components`
- `asset_technology_tags`
- reference tables for use types, categories, phases, roles, statuses, and source types

Evidence and workflow:

- `sources`
- `entity_sources`
- `audit_events`

## Import Compatibility

The schema includes legacy ID columns:

- `projects.legacy_project_id`
- `operating_assets.legacy_plant_id`
- `companies.legacy_company_id`
- `company_project_links.legacy_company_project_link_id`
- `company_operating_asset_links.legacy_company_plant_link_id`
- `company_relationships.legacy_company_relationship_id`
- `company_role_profiles.legacy_company_role_id`
- `app_users.legacy_user_id`

These are essential for importing the current live database and for repeatable migration tests.

## Use Type Model

Top-level use types are stored in `ref_geothermal_use_types`:

- `power`
- `direct_use`
- `mineral_extraction`
- `hybrid`
- `unknown`

Every project and operating asset has `primary_use_type_code`.

Additional use components are stored in `asset_use_components`, allowing hybrid assets without duplicating core records.

## Direct-Use Model

Direct-use applications are stored in `ref_direct_use_categories`.

MVP categories include:

- district heating
- district cooling
- building heating/cooling
- industrial process heat
- agriculture/greenhouses
- aquaculture
- food drying/processing
- bathing/wellness/tourism
- cooling/refrigeration
- hybrid heat and power
- other direct use

Technology/system tags are separate and stored through `asset_technology_tags`.

This preserves the distinction between:

- application: what the heat/cooling is used for
- technology/system: how the system works

## Capacity And Output

Core metrics are held directly on `projects` and `operating_assets` for practical filtering, sorting, exports, and maps.

Power:

- `electric_capacity_mwe`
- `electric_capacity_running_mwe`
- `annual_power_generation_gwhe`

Direct-use:

- `thermal_capacity_mwth`
- `annual_heat_supply_gwhth`
- `annual_cooling_supply_gwhc`
- `installed_heat_pump_capacity_mwth`
- `geothermal_resource_capacity_mwth`

Estimate status:

- `capacity_estimate_status_code`
- `output_estimate_status_code`

## Lifecycle

Shared lifecycle phases:

- `prospect_tbd`
- `exploration`
- `pre_feasibility`
- `feasibility`
- `construction`
- `operating`
- `cancelled`

Detailed statuses such as permitting, financing, stalled, phased commissioning, or expansion should not become primary lifecycle phases at this stage. Add them later as separate status/detail fields if needed.

## Verification Workflow

Shared review statuses:

- `draft`
- `validation`
- `approved`
- `export_ready`
- `needs_update`
- `archived`

Core tables include:

- `review_status_code`
- `created_by_user_id`
- `last_updated_by_user_id`
- `approved_by_user_id`
- `approved_at`
- `export_ready_at`

Detailed event history belongs in `audit_events`.

## Company Role Model

Company role links use controlled role codes through `ref_company_roles`.

Separate link tables exist for:

- companies linked to projects
- companies linked to operating assets

This supports one company having multiple roles on the same project or asset.

## Source/Evidence Model

The MVP schema includes:

- `sources`
- `entity_sources`
- `relationship_sources`
- `source_evidence_note` fields on core entities

This gives the platform basic evidence handling now, without requiring the full article/PDF source registry before MVP.

`entity_sources` remains the record-level evidence table for projects,
operating assets, and companies.

`relationship_sources` is the staging foundation for row-level evidence on:

- `company_project_links`
- `company_operating_asset_links`
- `company_relationships`

This lets a source support a specific developer/operator/owner/supplier role or
a specific ownership/group relationship without implying that the source
supports the whole project, plant/facility, or company record.

## Open Implementation Questions

Resolve before final implementation:

- whether `hybrid` remains a top-level use type or becomes calculated from multiple use components
- whether `mineral_extraction` should have more specific categories, such as lithium, silica, manganese, or other brine minerals
- whether `export_ready` should remain a workflow status or become a separate boolean flag
- whether location should later use PostGIS geometry/geography
- whether direct-use metrics should later move into a generic metrics table if the category model becomes more complex

## Recommended Next Step

Create a migration mapping from the current live SQL database into this schema before writing application code against it.
