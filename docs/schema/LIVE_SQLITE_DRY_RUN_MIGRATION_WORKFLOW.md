# Live SQLite Dry-Run Migration Workflow

Date: 2026-05-18

Purpose: run a controlled, repeatable migration test from a copied Hetzner
SQLite backup into PostgreSQL/Railway staging.

This is not the go-live cutover. It is the first dry-run migration workflow.

## Safety Model

- The live Hetzner SQLite file is not touched.
- The local copied SQLite backup remains ignored by Git.
- Raw SQLite rows are imported into PostgreSQL staging tables first.
- Transform scripts normalize data into PostgreSQL application tables.
- The transform script rolls back by default unless `--execute` is provided.
- The validation script reads the migration result and writes a local report.

## New Scripts

Run from `web/`:

```bash
npm run live-sqlite:stage
npm run live-sqlite:transform
npm run live-sqlite:validate
```

These scripts use the staging support tables from:

```text
web/prisma/migrations/20260518000600_live_sqlite_migration_staging/migration.sql
```

## Step 1: Apply PostgreSQL Migrations

Run against Railway/PostgreSQL staging:

```bash
cd "/Users/lxrichter/TGE Database/02_current_platform/tge-business-intel platform/web"
railway run --service Postgres -- npm run prisma:migrate:deploy
```

This applies the staging support tables if they are not already present.

## Step 2: Create A Local Staging Import Plan

This does not connect to Railway and does not upload live data:

```bash
npm run live-sqlite:stage -- \
  --db "../migration/live_exports/2026-05-18/tge_live_20260518_213034.db" \
  --run-label "tge_live_20260518_213034"
```

Output:

```text
source-data/live-sqlite-migration/staging_import_plan.json
```

## Step 3: Import Raw SQLite Rows To PostgreSQL Staging

This uploads raw rows from the copied SQLite backup into PostgreSQL staging
tables. It does not transform or replace the application tables yet.

```bash
railway run --service Postgres -- npm run live-sqlite:stage -- \
  --db "../migration/live_exports/2026-05-18/tge_live_20260518_213034.db" \
  --run-label "tge_live_20260518_213034" \
  --execute \
  --reset-run
```

The script writes:

```text
source-data/live-sqlite-migration/staging_import_result.json
```

## Step 4: Dry-Run Transform

This performs the full transform inside a PostgreSQL transaction and rolls it
back. Use this before committing the transform.

```bash
railway run --service Postgres -- npm run live-sqlite:transform -- \
  --run-label "tge_live_20260518_213034" \
  --reset-target
```

Output:

```text
source-data/live-sqlite-migration/transform_result.json
```

## Step 5: Commit Transform To PostgreSQL Staging

Only do this after the dry-run transform succeeds.

```bash
railway run --service Postgres -- npm run live-sqlite:transform -- \
  --run-label "tge_live_20260518_213034" \
  --reset-target \
  --execute
```

This writes normalized rows into:

- `projects`
- `operating_assets`
- `companies`
- `company_project_links`
- `company_operating_asset_links`
- `company_relationships`
- `company_role_profiles`
- `project_operating_asset_links`

## Step 6: Validate Migration

```bash
railway run --service Postgres -- npm run live-sqlite:validate -- \
  --run-label "tge_live_20260518_213034" \
  --write-results
```

Output:

```text
source-data/live-sqlite-migration/validation_result.json
```

## Expected First-Run Warnings

The first dry run is expected to warn about:

- blank legacy company-plant link ID
- negative plant capacity values set to null
- project phase blanks
- plant phase/status blanks
- plant lifecycle/status values needing review
- company type normalization
- company role values mapped to `other` or needing review
- secondary company type parsing deferred

Warnings are not automatic failures. They are the worklist for the migration
cleanup pass.

## Important Non-Goals For This Slice

This first dry-run migration does not:

- import legacy password hashes into new live users
- parse legacy `website_information` into structured `sources`
- resolve all missing coordinates
- create direct-use classifications from inference
- perform the final production cutover
- delete the old Hetzner app/database

Those come after migration validation and page/workflow review.
