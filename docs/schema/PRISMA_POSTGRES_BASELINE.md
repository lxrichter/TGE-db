# Prisma PostgreSQL Baseline

Date: 2026-05-18

Purpose: document the first managed Prisma baseline for the Railway PostgreSQL
staging database.

## Current Status

Prisma is now the selected migration and application data-access foundation for
the PostgreSQL rebuild.

Current implemented pieces:

- `web/prisma/schema.prisma`
- `web/prisma.config.ts`
- `web/prisma/migrations/20260518000000_baseline/migration.sql`
- `web/prisma/migrations/20260518000100_align_user_roles/migration.sql`
- `web/prisma/migrations/20260518000200_sources_documents_mvp/migration.sql`
- `web/prisma/migrations/20260518000300_research_ops_issues/migration.sql`
- `web/lib/db/prisma.ts`
- `web/lib/services/postgres-preview.ts`
- `web/lib/services/sources.ts`
- Prisma package scripts in `web/package.json`
- generated Prisma client ignored at `web/prisma/generated/`

The baseline migration is copied from:

```text
database/postgres/schema_v1.sql
```

The existing Railway PostgreSQL staging database was already created from that
schema before Prisma was introduced. For that reason, the baseline migration was
marked as applied with Prisma instead of being re-run against the non-empty
database.

## Environment

Prisma reads the database URL from `web/prisma.config.ts`.

Local/Railway CLI workflow prefers:

```text
DATABASE_PUBLIC_URL
```

Fallback:

```text
DATABASE_URL
```

This matches the current Railway setup where `DATABASE_URL` may point to private
Railway networking and `DATABASE_PUBLIC_URL` is usable from the Mac through the
Railway CLI.

## Common Commands

Run these from:

```bash
cd "02_current_platform/tge-business-intel platform/web"
```

Validate the Prisma schema:

```bash
npm run prisma:validate
```

Generate the local Prisma client:

```bash
npm run prisma:generate
```

Check migration status on Railway PostgreSQL:

```bash
railway run --service Postgres -- npm run prisma:migrate:status
```

Introspect the current Railway PostgreSQL schema into Prisma:

```bash
railway run --service Postgres -- npm run prisma:pull
```

Deploy future migrations:

```bash
railway run --service Postgres -- npm run prisma:migrate:deploy
```

## Baseline Note

Do not run `prisma migrate deploy` as the first Prisma action against an already
populated/non-empty database. Prisma will reject that with `P3005`.

For an existing database that already matches the baseline SQL, the correct
operation is:

```bash
railway run --service Postgres -- npx prisma migrate resolve --applied 20260518000000_baseline --schema prisma/schema.prisma
```

This has already been done for the current Railway staging database.

For a brand-new empty PostgreSQL database, use normal migration deployment:

```bash
railway run --service Postgres -- npm run prisma:migrate:deploy
```

## Important Constraint

Prisma Client does not model PostgreSQL check constraints. Those constraints
remain enforced by PostgreSQL through the migration SQL and should also be
mirrored in application-level validation where they affect form behavior.

This is especially relevant for:

- latitude/longitude ranges
- non-negative capacity fields
- review/status enums currently implemented as database checks
- relationship records that must link to exactly one valid entity context

## Next Development Use

Use the Prisma schema as the canonical TypeScript-facing model for new
PostgreSQL-backed service modules.

Current application use:

- `web/lib/db/prisma.ts` provides the shared lazy Prisma client.
- `web/lib/services/postgres-preview.ts` owns the PostgreSQL preview and
  Research Ops preview data access, plus staging entity create/update helpers
  for projects, operating assets, and companies.
- `web/lib/postgres-preview/entity-api.ts` parses and validates PostgreSQL
  staging entity write payloads against controlled reference tables.
- `web/lib/services/sources.ts` owns the PostgreSQL source list/detail and
  source reference-data access layer.
- `web/lib/postgres-preview.ts` remains as a compatibility re-export for the
  current page and API imports.
- `web/prisma/migrations/20260518000100_align_user_roles/migration.sql`
  aligns PostgreSQL `app_users.role_code` to the canonical MVP role model.
- `web/prisma/migrations/20260518000200_sources_documents_mvp/migration.sql`
  adds the first Sources / Documents MVP extension:
  - source visibility/confidentiality reference data
  - source credibility/status reference data
  - expanded source metadata fields
  - evidence-link metadata for future field-level claims
  - source validation queues in Research Ops
- `web/prisma/migrations/20260518000300_research_ops_issues/migration.sql`
  adds the first persistent Research Ops task/issue foundation:
  - research issue type and status reference tables
  - linked project, operating asset, company, or source issue records
  - assignment, notes, linked field, duplicate-candidate fields
  - issue event history for auditability

Current PostgreSQL source API foundation:

```text
GET /api/postgres/sources
GET /api/postgres/sources/[id]
GET /api/postgres/sources/reference-data
```

Current PostgreSQL entity staging API foundation:

```text
GET /api/postgres-preview/projects
POST /api/postgres-preview/projects
GET /api/postgres-preview/projects/[id]
PATCH /api/postgres-preview/projects/[id]
POST /api/postgres-preview/projects/[id]/promote
GET /api/postgres-preview/operating-assets
POST /api/postgres-preview/operating-assets
GET /api/postgres-preview/operating-assets/[id]
PATCH /api/postgres-preview/operating-assets/[id]
GET /api/postgres-preview/companies
POST /api/postgres-preview/companies
GET /api/postgres-preview/companies/[id]
PATCH /api/postgres-preview/companies/[id]
POST /api/postgres-preview/company-project-links
DELETE /api/postgres-preview/company-project-links/[id]
POST /api/postgres-preview/company-operating-asset-links
DELETE /api/postgres-preview/company-operating-asset-links/[id]
POST /api/postgres-preview/company-relationships
DELETE /api/postgres-preview/company-relationships/[id]
PATCH /api/postgres-preview/research-ops/status
POST /api/postgres-preview/research-ops/issues
PATCH /api/postgres-preview/research-ops/issues/[id]
```

The current PostgreSQL project promotion scaffold can create a linked
operating-asset draft from a project, preserve the original project, add a
project/asset promotion link, and copy existing source/evidence and
company-role links where available.

The current PostgreSQL Research Ops page also supports selected-row status
changes, lightweight bulk review/status changes, and filtered CSV exports using
the existing `PATCH /api/postgres-preview/research-ops/status` route. Persistent
human-created research issues/tasks are now modeled and can be created,
resolved, or dismissed from the Research Ops page. PostgreSQL project,
plant/facility, and company detail pages also show linked open persistent
Research Ops issues.

The next recommended implementation slice is:

1. expand persistent Research Ops issues into richer assignment workflow,
   manual duplicate review, and field-level issue persistence
2. persist generated missing-data flags into issue records where operationally
   useful
3. harden project-to-operating-asset promotion with readiness checks, review
   transition rules, and unit/expansion behavior
4. keep permission checks explicit as PostgreSQL write routes expand

The live Hetzner SQLite database remains untouched until the PostgreSQL
workflows and import scripts are ready.
