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

## Environment

The app expects:

```text
DATABASE_URL=postgresql://...
DATABASE_SSL=require
```

When running local utility scripts through the Railway CLI, the scripts prefer
`DATABASE_PUBLIC_URL` because `DATABASE_URL` often points to Railway private
networking (`postgres.railway.internal`), which does not resolve from a Mac.

Prefer:

```bash
railway run --service Postgres -- npm --prefix web run postgres:smoke
```

This avoids copying database credentials into the terminal history.

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
