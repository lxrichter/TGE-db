# Live SQLite Dry-Run Migration Result

Date: 2026-05-18

Purpose: record the first completed dry-run migration from the copied Hetzner
SQLite backup into Railway PostgreSQL staging.

This was not a production cutover. The old Hetzner SQLite application remains
untouched.

## Run

Run label:

```text
tge_live_20260518_213034
```

Railway/PostgreSQL migration run ID:

```text
a8f946de-e71f-40ac-9856-c547d6740bd0
```

Source backup:

```text
tge_live_20260518_213034.db
```

## Completed Steps

1. Applied PostgreSQL staging support migration:

```text
20260518000600_live_sqlite_migration_staging
```

2. Imported raw copied SQLite rows into PostgreSQL migration staging tables.

3. Ran transform once in rollback mode.

4. Committed transform into Railway PostgreSQL staging application tables.

5. Ran validation with result persistence.

## Raw Rows Imported To Staging

| Source table | Rows |
| --- | ---: |
| `companies` | 99 |
| `company_plant_links` | 118 |
| `company_project_links` | 29 |
| `company_relationships` | 26 |
| `company_roles` | 62 |
| `plants` | 710 |
| `projects` | 1,503 |
| `ref_company_roles` | 46 |
| `ref_company_type_primary` | 14 |
| `ref_company_type_secondary` | 62 |
| `users` | 8 |

Total raw rows staged: `2,677`.

## Transformed Rows

| Target table | Rows |
| --- | ---: |
| `companies` | 99 |
| `projects` | 1,503 |
| `operating_assets` | 710 |
| `project_operating_asset_links` | 6 |
| `company_project_links` | 29 |
| `company_operating_asset_links` | 118 |
| `company_relationships` | 26 |
| `company_role_profiles` | 62 |

## Validation Result

Validation status: `pass`

Checks: `10`

Failed checks: `0`

Passed checks:

- projects imported by legacy ID
- plants imported as operating assets by legacy ID
- companies imported by legacy ID
- company-project links imported
- company-asset links imported for nonblank legacy IDs
- company relationships imported
- company role profiles imported
- no orphan company-project links
- no orphan company-asset links
- no orphan company relationships

## Warning Counts

Warnings are expected in this first dry run. They are migration cleanup work,
not validation failures.

| Warning code | Count |
| --- | ---: |
| `invalid_numeric_value` | 623 |
| `missing_lifecycle_status` | 477 |
| `secondary_types_preserved_for_review` | 71 |
| `normalized_company_type` | 48 |
| `company_role_needs_review` | 28 |
| `running_capacity_above_installed` | 23 |
| `capacity_range_invalid` | 12 |
| `lifecycle_status_needs_review` | 11 |
| `negative_numeric_value` | 6 |
| `unmapped_company_role` | 4 |
| `missing_review_status` | 3 |
| `company_relationship_needs_review` | 2 |
| `blank_company_plant_link_id` | 1 |
| `spv_entity_type_mapped_to_business_unit` | 1 |

## Railway Smoke-Test Counts After Transform

The smoke test includes existing safe sample records and already-imported TGE
article source records, so these totals are larger than live SQLite-only
counts.

| Table | Rows |
| --- | ---: |
| `projects` | 1,505 |
| `operating_assets` | 712 |
| `companies` | 101 |
| `company_project_links` | 30 |
| `company_operating_asset_links` | 119 |
| `sources` | 17,575 |
| `entity_sources` | 2 |
| `asset_use_components` | 2 |

## Interpretation

The first dry-run migration is technically successful:

- raw staging import works
- transform works
- validation passes
- relationship integrity passes
- legacy IDs are preserved for core entities and nonblank relationship IDs

The next work should focus on warning cleanup and UI review of the migrated
PostgreSQL staging data, not on another schema-audit pass.

## Recommended Next Step

Use the migrated Railway PostgreSQL staging data in `/postgres-preview` to
review:

- project list and detail behavior at real-data scale
- plant/facility list and detail behavior at real-data scale
- company pages and relationships
- Research Ops queues from migrated missing-data patterns
- warning categories from `live_sqlite_migration_warnings`

Then decide whether to:

1. improve migration transforms for numeric cleanup and statuses,
2. add a migration warning review page,
3. begin moving `/postgres-preview` toward the main working routes.
