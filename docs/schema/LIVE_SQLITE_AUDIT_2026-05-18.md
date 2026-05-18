# Live SQLite Audit

Date: 2026-05-18

Source: copied Hetzner SQLite backup inspected locally with
`npm run sqlite:inspect -- --profile-values`.

Purpose: record the migration-relevant facts from the live SQLite database
before PostgreSQL staging import scripts are written.

This audit intentionally avoids raw project, plant, company, user, note, source,
or client-specific row values. It records only aggregate counts, schema shape,
controlled vocabulary values, and migration rules.

## Snapshot

Backup file inspected:

```text
tge_live_20260518_213034.db
```

Inspection result:

- SQLite `quick_check`: `ok`
- Tables inspected: `11`
- Views: `0`
- SQLite objects: `37`
- Schema shape matches the local reference database:
  - same table list
  - same column list
  - same indexes
  - same declared foreign keys
- No live data has been imported into PostgreSQL.

## Table Counts

| Table | Rows | Columns |
| --- | ---: | ---: |
| `projects` | 1,503 | 55 |
| `plants` | 710 | 54 |
| `companies` | 99 | 44 |
| `company_plant_links` | 118 | 10 |
| `company_project_links` | 29 | 10 |
| `company_relationships` | 26 | 9 |
| `company_roles` | 62 | 10 |
| `ref_company_roles` | 46 | 5 |
| `ref_company_type_primary` | 14 | 3 |
| `ref_company_type_secondary` | 62 | 4 |
| `users` | 8 | 7 |

## Schema Parity

The live schema currently matches the local/reference SQLite schema used for
planning. That means the first import scripts can be written against the
documented local table and column names.

Current difference from local/reference is data volume, not schema shape:

- more companies
- more company-plant links
- more company-project links
- more company relationships
- slightly more projects and plants
- more users

## Foreign-Key Check Findings

SQLite foreign-key check summary:

| Table | Referenced table | Foreign key id | Violations |
| --- | --- | ---: | ---: |
| `companies` | `companies_new` | 2 | 71 |
| `companies` | `companies_new` | 1 | 67 |
| `companies` | `ref_company_type_primary` | 0 | 30 |

Interpretation:

- The `companies_new` references appear to be legacy/stale declared foreign keys
  left from an earlier table rebuild. Direct checks against the current
  `companies` table show no missing current parent or ultimate-parent company
  references.
- The `ref_company_type_primary` issue is real at the SQLite-reference level:
  30 company rows use primary type labels not present in the local SQLite
  reference table.
- PostgreSQL migration should not copy these declared foreign-key definitions.
  It should load raw staging first, then transform into the new PostgreSQL
  reference-code model.

## Core Relationship Integrity

Direct relationship checks against current live tables:

| Check | Orphan rows |
| --- | ---: |
| company-project link missing company | 0 |
| company-project link missing project | 0 |
| company-plant link missing company | 0 |
| company-plant link missing plant | 0 |
| company relationship missing `from` company | 0 |
| company relationship missing `to` company | 0 |
| company role missing company | 0 |

This is good: the operational relationship tables can be imported with normal
legacy-ID mapping once raw staging is in place.

## Legacy ID Findings

| Check | Count |
| --- | ---: |
| duplicate project IDs | 0 |
| duplicate plant IDs | 0 |
| duplicate company IDs | 0 |
| blank company-plant link IDs | 1 |
| duplicate non-blank company-plant link IDs | 0 |

Import rule:

- Preserve all non-blank legacy IDs.
- For the one blank `company_plant_links.company_plant_link_id`, generate a new
  PostgreSQL UUID for the link and keep `legacy_company_plant_link_id` null.
- Record this as a migration warning so the row is still traceable by source
  table and import batch.

## Lifecycle And Review Status Values

### Projects

| Current `projects.project_phase` | Rows | Target code |
| --- | ---: | --- |
| `Prospect` | 599 | `prospect_tbd` |
| `Exploration` | 430 | `exploration` |
| `Cancelled` | 124 | `cancelled` |
| `TBD` | 119 | `prospect_tbd` |
| `Feasibility` | 85 | `feasibility` |
| `Construction` | 80 | `construction` |
| `Pre-Feasibility` | 52 | `pre_feasibility` |
| blank | 7 | `prospect_tbd` plus migration issue |
| `Prospect / TBD` | 4 | `prospect_tbd` |
| `construction` | 1 | `construction` |
| `cancelled` | 1 | `cancelled` |
| `Operational` | 1 | review: possible promoted/operating asset |

Project review status:

| Current `projects.review_status` | Rows | Target code |
| --- | ---: | --- |
| `pending_review` | 1,481 | `validation` |
| `approved` | 22 | `approved` |

### Plants / Operating Assets

Current `plants.project_phase` is being used as an operating/status field in
the legacy schema.

| Current `plants.project_phase` | Rows | Target handling |
| --- | ---: | --- |
| blank | 470 | import as `operating`; create missing-status issue |
| `Operating` | 187 | `operating` |
| `Operational` | 43 | `operating` |
| `Construction` | 4 | `construction` plus review issue |
| `Cancelled` | 2 | `cancelled` |
| `Prospect / TBD` | 1 | `prospect_tbd` plus review issue |
| `Not Operating` | 1 | review; likely not active operating total |
| `Exploration` | 1 | review; likely belongs in projects/pipeline |
| `Decomissioned` | 1 | `cancelled` for current schema, preserve raw spelling |

Plant review status:

| Current `plants.review_status` | Rows | Target code |
| --- | ---: | --- |
| `approved` | 707 | `approved` |
| blank | 3 | `draft` plus migration issue |

### Companies

Company review status:

| Current `companies.review_status` | Rows | Target code |
| --- | ---: | --- |
| `Pending Review` | 57 | `validation` |
| `approved` | 41 | `approved` |
| `Approved` | 1 | `approved` |

## Company Type Normalization

Current company primary type values:

| Current value | Rows | Proposed PostgreSQL code |
| --- | ---: | --- |
| `Developer` | 23 | `developer` |
| `Investment firm` | 14 | `investment_finance` |
| `Utility / IPP` | 13 | `utility_ipp` |
| `Service provider` | 12 | `service_provider` |
| `OEM / supplier` | 9 | `oem_equipment_supplier` |
| `EPC contractor` | 8 | `epc_contractor` |
| `Technology developer` | 4 | `technology_provider` |
| `Resource owner` | 3 | `resource_owner` |
| `Portfolio developer` | 3 | `developer` |
| `Investment / finance` | 3 | `investment_finance` |
| `Turbine supplier` | 2 | `turbine_supplier` |
| `Technology provider` | 2 | `technology_provider` |
| `Advocacy / non-profit` | 2 | `advocacy_non_profit` |
| `Energy major` | 1 | `energy_major` |

Note: the PostgreSQL reference model currently uses `developer`,
`technology_provider`, `turbine_supplier`, and `investment_finance`, while the
product blueprint uses some more refined category labels such as Portfolio
developer and Technology developer. The import should use current PostgreSQL
codes first; taxonomy refinement can be a later reference-data migration.

## Company Role Normalization

Project and plant role links should transform legacy text into
`ref_company_roles.code`. Preserve original text in `role_detail` when the
legacy role carries extra nuance.

| Current role value | Proposed role code | Notes |
| --- | --- | --- |
| `Owner` | `owner` | direct |
| `Operator` | `operator` | direct |
| `Developer` | `developer` | direct |
| `Investor` | `investor` | direct |
| `EPC`, `EPC contractor` | `epc_contractor` | normalize label |
| `Drilling`, `Drilling contractor` | `drilling_contractor` | normalize label |
| `Turbine Supplier`, `Turbine supplier` | `technology_supplier` | preserve turbine detail |
| `Technology supplier` | `technology_supplier` | direct |
| `Engineering consultant` | `engineering_consultant` | direct |
| `Service provider` | `other` | preserve original role detail |
| `OEM` | `equipment_supplier` | preserve original role detail |
| `Resource partner` | `resource_owner` | review if partner is not ownership |
| `Operator Steam` | `operator` | preserve `Steam` in role detail |
| `Operator Power` | `operator` | preserve `Power` in role detail |
| `Owner/ Operator` | `operator` | review; may require split into owner + operator |
| `Other` | `other` | direct |

## Company Relationship Normalization

| Current relationship type | Proposed handling |
| --- | --- |
| `Parent of` | parent/subsidiary relationship |
| `Subsidiary of` | parent/subsidiary relationship, reversed direction if needed |
| `Owned by` | ownership relationship, reversed direction if needed |
| `Owns` | ownership relationship |
| `Majority shareholder in` | ownership relationship with share metadata when available |
| `Investor in` | investor/ownership relationship |
| `Technology partner of` | partner relationship |
| `Project partner of` | partner relationship |
| `Owner` | review; likely ownership relationship |

The PostgreSQL `company_relationships` model currently stores
`relationship_type` as text, so exact codes are not yet enforced. The import
should still normalize direction and preserve raw legacy text.

## Data Completeness Findings

| Check | Count |
| --- | ---: |
| projects missing name | 0 |
| plants missing name | 0 |
| companies missing name | 0 |
| projects missing country | 0 |
| plants missing country | 0 |
| companies missing HQ country | 15 |
| projects missing both coordinates | 755 |
| plants missing both coordinates | 46 |
| projects invalid coordinate ranges | 0 |
| plants invalid coordinate ranges | 0 |
| projects missing phase | 7 |
| plants missing phase/status | 470 |
| projects missing installed capacity | 1,222 |
| plants missing installed capacity | 8 |
| plants missing running capacity | 37 |
| projects negative capacity rows | 0 |
| plants negative capacity rows | 3 |
| projects missing `website_information` | 941 |
| plants missing `website_information` | 618 |
| companies missing website URL | 27 |

Import implications:

- Missing project capacity is expected and should not block project import.
- Missing project/plant coordinates should create Research Ops/data-quality
  issues after import.
- Negative plant capacity values cannot be loaded into PostgreSQL numeric
  fields with non-negative checks. These rows must be corrected during
  transform or set to null with a migration warning.
- `website_information`, `notes`, and `information` are legacy evidence/context
  fields, not structured source records. Preserve them in legacy text fields
  first; parse into `sources` only in a later controlled pass.

## Promotion And Historical Status

| Check | Count |
| --- | ---: |
| projects with nonblank phase history | 155 |
| plants with nonblank phase history | 11 |
| projects marked/promoted to plant | 6 |
| plants promoted from project | 6 |

Import rule:

- Preserve project-to-plant promotion links where `promoted_from_project_id` and
  promoted project metadata exist.
- Import phase history into notes/legacy metadata first. A structured phase
  history/event table can come later.

## User Records

The live SQLite `users` table has 8 rows.

Migration recommendation:

- Do not import password hashes into the new production system by default.
- Create fresh app users in PostgreSQL/Railway for active staff.
- Preserve legacy user IDs only for mapping `created_by`,
  `last_updated_by`, and `approved_by` fields where a matching new user exists.
- If a legacy user cannot be mapped safely, keep the raw legacy user ID in
  staging/audit metadata rather than creating a live login account.

## Staging Import Rules

The first migration scripts should use two layers:

1. Raw staging tables: preserve the live SQLite rows exactly, including blank
   IDs, text casing, legacy status labels, old notes, and raw dates.
2. Transform tables: create PostgreSQL records with normalized codes, UUIDs,
   preserved `legacy_*` IDs, and migration warnings for non-clean rows.

Do not transform directly from SQLite into production tables without raw staging.

## Required Transform Warnings

The transform should emit warnings for:

- blank `company_plant_link_id`
- negative plant capacity values
- project phase blank
- project phase `Operational`
- plant phase blank
- plant phase values that are not clearly operating assets
- missing plant review status
- company primary type normalization
- company role values mapped to `other` or requiring review
- legacy source/evidence text that could not be parsed into structured sources
- user IDs that cannot be mapped to active PostgreSQL `app_users`

## Recommended Next Step

Create the first dry-run migration scripts:

```text
scripts/migration/import_sqlite_to_postgres_staging.*
scripts/migration/transform_staging_to_postgres.*
scripts/migration/validate_postgres_migration.*
```

The first dry run should target a Railway/PostgreSQL staging environment only.
It should be repeatable and should print:

- source row counts
- staging row counts
- transformed row counts
- warnings by type
- rows skipped, if any
- all legacy ID preservation checks
- relationship orphan checks after transform
