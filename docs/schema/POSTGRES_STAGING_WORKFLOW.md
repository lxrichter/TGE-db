# PostgreSQL Staging Workflow

Date: 2026-05-16

Purpose: define how the repository connects to the Railway PostgreSQL staging
database before live-data migration.

## Current Position

The current live SQLite database stays on Hetzner and will be imported later.

For now, Railway PostgreSQL is used as a clean staging foundation:

- validate the PostgreSQL schema
- seed safe non-confidential records
- develop PostgreSQL-backed screens and API routes
- test future migration scripts without touching live data

Prisma is now the managed migration and application data-access foundation for
PostgreSQL. The first baseline migration is tracked at:

```text
web/prisma/migrations/20260518000000_baseline/migration.sql
```

The current Railway staging database already contained the baseline schema, so
the migration has been marked as applied rather than re-run.

## Environment

The app expects:

```text
DATABASE_URL=postgresql://...
DATABASE_SSL=require
```

When running local utility scripts through the Railway CLI, the scripts prefer
`DATABASE_PUBLIC_URL` because `DATABASE_URL` often points to Railway private
networking (`postgres.railway.internal`), which does not resolve from a Mac.
The app connector also uses `DATABASE_PUBLIC_URL` first when it is present, so
local Railway previews can connect from macOS.

Prefer:

```bash
railway run --service Postgres -- npm --prefix web run postgres:smoke
```

This avoids copying database credentials into the terminal history.

Prisma commands can also be run through Railway from the `web` directory:

```bash
railway run --service Postgres -- npm run prisma:migrate:status
railway run --service Postgres -- npm run prisma:pull
railway run --service Postgres -- npm run prisma:migrate:deploy
```

## Smoke Test

From the repository root:

```bash
railway run --service Postgres -- npm --prefix web run postgres:smoke
```

Expected result:

- PostgreSQL connection succeeds
- database and user are printed
- public table count is shown
- selected reference-table counts are shown

## Read-Only Preview

The first PostgreSQL-backed app surface is:

```text
/postgres-preview
```

It shows:

- projects
- operating assets
- companies
- core relationship counts

The page uses Railway/PostgreSQL data and remains behind the existing app login
middleware. It is intentionally read-only.

Supporting API endpoints:

```text
/api/postgres-preview/summary
/api/postgres-preview/projects
/api/postgres-preview/operating-assets
/api/postgres-preview/companies
```

## Research Ops Preview

The first PostgreSQL-backed operational surface is:

```text
/postgres-preview/research-ops
```

It is read-only and focuses on the validation and research queues defined in
the product build spec:

- needs source
- missing country
- missing lifecycle/status
- missing geothermal use type
- missing company link
- missing coordinates
- missing capacity/output
- needs approval
- needs update
- direct-use records needing classification
- suspected duplicate candidates
- recently edited records

Current controls:

- search across queue rows
- filter by issue type
- filter by severity
- filter by record type
- filter by country
- click queue chips to focus one issue class
- inspect a selected row in a lightweight detail panel
- show updated-by metadata when PostgreSQL user records are available

Supporting API endpoint:

```text
/api/postgres-preview/research-ops
```

This preview validates the future PostgreSQL workflow model without importing
or changing the current live Hetzner SQLite database.

## Safe Staging Seed

Seed non-confidential sample data:

```bash
railway run --service Postgres -- npm --prefix web run postgres:seed:staging
```

Seed SQL:

```text
database/postgres/seed_staging.sql
```

The seed file is idempotent and contains no live project, plant, company, user,
client, or confidential data.

## What Not To Do Yet

Do not deploy the current app as production on Railway yet. The current app
still uses SQLite for most runtime workflows.

Do not import the Hetzner live SQLite database until the PostgreSQL-backed app
workflow and migration scripts are ready.

Do not use `prisma migrate dev` against the shared Railway staging database.
Use explicit migration files plus `prisma migrate deploy` for shared
environments.
