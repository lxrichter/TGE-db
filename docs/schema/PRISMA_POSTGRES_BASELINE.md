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
  Research Ops preview data access.
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

Current PostgreSQL source API foundation:

```text
GET /api/postgres/sources
GET /api/postgres/sources/[id]
GET /api/postgres/sources/reference-data
```

The next recommended implementation slice is:

1. build the Sources / Documents list and detail UI
2. add source create/edit and source-link actions
3. wire source actions into Research Ops and core entity detail pages
4. keep permission checks explicit as PostgreSQL write routes are added

The live Hetzner SQLite database remains untouched until the PostgreSQL
workflows and import scripts are ready.
