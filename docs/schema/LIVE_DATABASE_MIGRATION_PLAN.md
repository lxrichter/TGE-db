# Live Database Migration Plan

Date: 2026-05-16

Purpose: define how the current live SQL database should be imported into the future PostgreSQL schema without losing data or breaking traceability.

## Core Principle

The current live database is the source system until the new platform goes live.

The new PostgreSQL schema should not be populated manually from memory. It should be populated through repeatable migration scripts, tested on exported copies of the live database.

## Important Current Situation

The repository contains a local SQLite copy/reference, but the user notes that the current database is live on a server and may contain newer/additional data.

Therefore:

- do not treat the local SQLite file as final source of truth
- use the live server database export for final migration testing
- use local SQLite only for schema analysis and prototype audit
- preserve all live IDs in `legacy_*` columns during import

## Migration Phases

### Phase 1: Export Current Live Database

Export from the live server into a timestamped migration input folder.

Recommended local folder:

```text
migration/live_exports/YYYY-MM-DD/
```

Do not commit live exports to Git.

Files to collect:

- full database dump
- schema-only dump
- table counts
- user/role export, if safe and needed
- any uploaded/import source files used by the current system

### Phase 2: Profile Current Data

For each current table, record:

- row count
- column list
- null patterns
- duplicate IDs
- duplicate names
- invalid countries/regions
- invalid coordinates
- invalid numeric fields
- inconsistent review statuses
- unmapped company roles

This should produce a data-quality report before import scripts are written.

Current local/reference profiler:

```bash
python3 scripts/migration/profile_sqlite_db.py
```

The script writes aggregate reports to:

```text
migration/profile_reports/
```

These reports are ignored by Git. Use them for internal review, not as committed
source material.

### Phase 3: Create Staging Tables

In PostgreSQL, import current live tables first into staging tables, for example:

```text
staging_projects_raw
staging_plants_raw
staging_companies_raw
staging_company_project_links_raw
staging_company_plant_links_raw
staging_company_relationships_raw
staging_company_roles_raw
staging_users_raw
```

Staging tables should preserve raw values exactly.

### Phase 4: Transform Into New Schema

Transform staging tables into the new schema.

Main mappings:

| Current/live table | New PostgreSQL table |
| --- | --- |
| `projects` | `projects` |
| `plants` | `operating_assets` |
| `companies` | `companies` |
| `company_project_links` | `company_project_links` |
| `company_plant_links` | `company_operating_asset_links` |
| `company_relationships` | `company_relationships` |
| `company_roles` | `company_role_profiles` |
| `users` | `app_users` |

Preserve source IDs:

| Current/live ID | New legacy column |
| --- | --- |
| `projects.project_id` | `projects.legacy_project_id` |
| `plants.plant_id` | `operating_assets.legacy_plant_id` |
| `companies.company_id` | `companies.legacy_company_id` |
| `company_project_links.company_project_link_id` | `company_project_links.legacy_company_project_link_id` |
| `company_plant_links.company_plant_link_id` | `company_operating_asset_links.legacy_company_plant_link_id` |
| `company_relationships.company_relationship_id` | `company_relationships.legacy_company_relationship_id` |
| `company_roles.company_role_id` | `company_role_profiles.legacy_company_role_id` |
| `users.user_id` | `app_users.legacy_user_id` |

### Phase 5: Classification Backfill

Current data is mostly geothermal power.

Initial import assumption:

```text
primary_use_type_code = power
```

Then backfill exceptions:

- direct-use records
- hybrid heat and power records
- mineral extraction records
- unknown/unclear records

This backfill should be done through reviewed mapping rules, not guesses hidden inside code.

### Phase 6: Validate Migration

Run validation checks:

- source row counts vs imported row counts
- all legacy IDs preserved
- all company links point to existing companies
- all project links point to existing projects
- all plant links point to existing operating assets
- no orphan relationships
- no invalid role codes
- no invalid review statuses
- capacity values are non-negative
- latitude/longitude ranges are valid
- project-to-operating-asset links preserve promoted assets where known

### Phase 7: Dry-Run Application Against Migrated Data

Before go-live:

- deploy a Railway staging app
- connect it to a staging PostgreSQL database
- import a fresh live export
- test login, lists, detail pages, filters, maps, edits, approvals, and exports
- compare key counts and sample records with the live/current system

### Phase 8: Go-Live Cutover

Recommended cutover:

1. freeze writes in the old live system
2. export final live database
3. run migration into PostgreSQL
4. run validation checks
5. switch Railway production app to migrated database
6. smoke-test core workflows
7. keep old system read-only during rollback window

## Data That Needs Special Care

### Review Statuses

Current data may use inconsistent values such as:

- `Pending Review`
- `pending_review`
- `Approved`
- `approved`
- `Done`
- `Need Info`

Map these carefully into:

- `draft`
- `validation`
- `approved`
- `export_ready`
- `needs_update`
- `archived`

### Project Phases

Map current phase values into official TGE lifecycle phases:

- `Prospect / TBD`
- `Exploration`
- `Pre-Feasibility`
- `Feasibility`
- `Construction`
- `Operating`
- `Cancelled`

Any unmapped phase should be reported, not silently changed.

### Plants To Operating Assets

Current `plants` become `operating_assets`.

Keep:

- original plant ID
- original plant name
- project group
- location
- capacity fields
- COD
- technology fields
- company links
- review status
- promoted project relationship where available

### Direct-Use And Mineral Extraction

Existing current/live records may not yet classify direct-use or mineral extraction.

Do not force direct-use classification during blind import unless the source record is clear.

Use:

```text
primary_use_type_code = unknown
```

when classification needs review.

## Deliverables Before Go-Live

Required before migration:

- live database export
- schema diff between local/reference and live database
- data-quality report
- staging import script
- transformation script
- validation script
- rollback plan

## Recommended Next Development Step

The first migration mapping documentation now exists:

```text
docs/schema/SQLITE_TO_POSTGRES_MAPPING.md
```

Next create scripts for:

```text
scripts/migration/import_to_staging.*
scripts/migration/transform_to_postgres.*
scripts/migration/validate_migration.*
```

The current profiling script is:

```text
scripts/migration/profile_sqlite_db.py
```
