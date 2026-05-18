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

Additional applied PostgreSQL migrations:

```text
web/prisma/migrations/20260518000100_align_user_roles/migration.sql
web/prisma/migrations/20260518000200_sources_documents_mvp/migration.sql
```

The Sources / Documents MVP migration adds source visibility, source
credibility/status governance, richer source metadata, evidence-link metadata,
and source validation queues for the PostgreSQL Research Ops preview.

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
- current Railway staging public table count is 29 after the Sources /
  Documents MVP migration
- selected reference-table counts are shown

## Read-Only Preview

The first PostgreSQL-backed app surface is:

```text
/postgres-preview
/postgres-preview/projects/[id]
/postgres-preview/operating-assets/[id]
/postgres-preview/companies/[id]
```

It shows:

- projects
- operating assets
- companies
- core relationship counts
- read-only project, plant/facility, and company detail previews
- source/evidence panels and add-source actions on entity preview pages

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
- source needs review
- weak / outdated source
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

## Sources / Documents Foundation

The first PostgreSQL source/evidence service foundation is available through:

```text
/sources
/sources/[id]
/sources/new
/sources/[id]/edit
/api/postgres/sources
/api/postgres/sources/[id]
/api/postgres/sources/[id]/status
/api/postgres/sources/reference-data
/api/postgres/source-links
/api/postgres/source-links/[id]
```

Current implemented behavior:

- browse source records in a read-only Sources / Documents page
- inspect a source profile with linked evidence rows
- create and edit source records
- add and remove record-level evidence links
- start a prelinked add-source flow from Research Ops records missing sources
- start a prelinked add-source flow from PostgreSQL project, plant/facility,
  and company preview pages
- editor source-credibility actions for credible, weak, outdated, rejected, and
  needs-review states
- read source records from Railway PostgreSQL
- filter source records by search, source type, visibility, and credibility
- expose source type, visibility, and credibility/status reference data
- expose linked project, operating asset, and company evidence records
- feed source review queues into Research Ops

This is not yet the full Sources / Documents workflow. File upload, TGE article
sync, country/market evidence panels, and source-aware export-readiness checks
are still future implementation slices.

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

The seed includes one safe source/evidence sample so `/sources` and
`/sources/[id]` can be verified without importing live data.

## What Not To Do Yet

Do not deploy the current app as production on Railway yet. The current app
still uses SQLite for most runtime workflows.

Do not import the Hetzner live SQLite database until the PostgreSQL-backed app
workflow and migration scripts are ready.

Do not use `prisma migrate dev` against the shared Railway staging database.
Use explicit migration files plus `prisma migrate deploy` for shared
environments.
