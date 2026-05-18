# Web Application

Next.js application for the current TGE geothermal intelligence platform prototype.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- NextAuth 4 credentials provider
- SQLite through `sqlite` and `sqlite3`
- PostgreSQL staging through Railway
- Prisma 7 for PostgreSQL schema/migration baseline
- Leaflet / React Leaflet for map views
- `xlsx` for spreadsheet export workflows

## Scripts

```bash
npm run dev     # Start local development server
npm run build   # Build production bundle
npm run start   # Start production server after build
npm run lint    # Run ESLint
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate:status
npm run prisma:pull
npm run prisma:migrate:deploy
npm run postgres:smoke
```

## Local Setup

From this `web/` directory:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

The root route redirects to `/login` when no session is active.

## Environment

Example:

```text
DB_PATH=../shared/data/tge.db
DATABASE_URL=postgresql://postgres:password@host:5432/railway
DATABASE_PUBLIC_URL=postgresql://postgres:password@host:5432/railway
DATABASE_SSL=require
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-local-development-secret
```

Notes:

- `DB_PATH` can be absolute or relative to the `web/` working directory.
- The default local path points to `../shared/data/tge.db`.
- `DATABASE_PUBLIC_URL` is preferred for local Railway/PostgreSQL commands when present.
- `.env.local` is ignored by Git and must not be committed.
- Use a real random `NEXTAUTH_SECRET` for any non-local environment.

## Database

Runtime database access is handled in:

```text
web/lib/db.ts
```

Initialization logic is in:

```text
web/lib/init-db.ts
web/app/api/init/route.ts
```

Reference schema snapshot:

```text
web/data/schema.sql
```

PostgreSQL/Prisma baseline:

```text
web/prisma/schema.prisma
web/prisma.config.ts
web/prisma/migrations/20260518000000_baseline/migration.sql
web/prisma/migrations/20260518000100_align_user_roles/migration.sql
web/prisma/migrations/20260518000200_sources_documents_mvp/migration.sql
web/lib/db/prisma.ts
web/lib/services/postgres-preview.ts
web/lib/services/sources.ts
```

Railway PostgreSQL commands should be run without copying credentials locally:

```bash
railway run --service Postgres -- npm run postgres:smoke
railway run --service Postgres -- npm run prisma:migrate:status
```

Local SQLite files and backups are intentionally ignored. The repository does not include a production or working data dump.

## Authentication And Roles

Authentication uses NextAuth credentials and the local `users` table.

Key paths:

```text
web/lib/auth/auth.ts
web/lib/auth/roles.ts
web/middleware.ts
web/app/login/page.tsx
web/app/admin/users/page.tsx
```

Access is role-aware. The app supports internal editorial/admin workflows; subscriber access is a future platform layer, not a completed production feature in this snapshot.

Canonical MVP user roles are:

```text
researcher
editor
senior_editor
admin
```

Legacy prototype roles are accepted and normalized in `web/lib/auth/roles.ts`.

## Main Route Areas

```text
/projects
/plants
/companies
/map
/markets
/analysis
/research-ops
/sources
/admin
```

API routes live under:

```text
web/app/api/
```

Current PostgreSQL-backed route foundations:

```text
/postgres-preview
/postgres-preview/research-ops
/postgres-preview/projects/[id]
/postgres-preview/projects/[id]/edit
/postgres-preview/projects/new
/postgres-preview/operating-assets/[id]
/postgres-preview/operating-assets/[id]/edit
/postgres-preview/operating-assets/new
/postgres-preview/companies/[id]
/postgres-preview/companies/[id]/edit
/postgres-preview/companies/new
/sources
/sources/[id]
/sources/new
/sources/[id]/edit
/api/postgres-preview/summary
/api/postgres-preview/projects
/api/postgres-preview/projects/[id]
/api/postgres-preview/operating-assets
/api/postgres-preview/operating-assets/[id]
/api/postgres-preview/companies
/api/postgres-preview/companies/[id]
/api/postgres-preview/company-project-links
/api/postgres-preview/company-project-links/[id]
/api/postgres-preview/company-operating-asset-links
/api/postgres-preview/company-operating-asset-links/[id]
/api/postgres-preview/company-relationships
/api/postgres-preview/company-relationships/[id]
/api/postgres-preview/research-ops
/api/postgres-preview/research-ops/status
/api/postgres/sources
/api/postgres/sources/[id]
/api/postgres/sources/[id]/status
/api/postgres/sources/reference-data
/api/postgres/source-links
/api/postgres/source-links/[id]
```

The PostgreSQL Sources / Documents foundation currently provides source
reference data, source list/detail reads, source list/profile/create/edit pages,
source-link add/remove actions, Research Ops source queues, and source/evidence
panels on PostgreSQL project, plant/facility, and company preview pages. It also
includes editor source-credibility actions on source profiles, selected-row
source credibility actions inside PostgreSQL Research Ops, and preview-only
export-readiness panels on PostgreSQL entity detail pages. File uploads, TGE
article sync, country/market evidence panels, and enforced export-readiness
rules are proposed next steps, not completed production functionality.

The PostgreSQL entity workflow now includes staging-only create/edit scaffolds
for Projects, Plants / Facilities, and Companies under `/postgres-preview`.
These routes write to Railway PostgreSQL and are intentionally separate from the
current SQLite prototype routes under `/projects`, `/plants`, and `/companies`.
The forms include live readiness panels for critical and important missing-data
guidance while still allowing incomplete draft saves. It also includes staging
add/remove managers for company-project roles,
company-plant/facility roles, and company-company relationships. PostgreSQL
Research Ops also supports selected-row review/status quick actions for
projects, plants/facilities, companies, and sources. Project promotion, bulk
edits, assignment workflows, relationship history/timelines, and production
exports remain separate next-step workflows.

## Known Issues

`npm run lint` currently fails on pre-existing lint debt, mostly:

- `@typescript-eslint/no-explicit-any`
- unused variables in a few pages
- image optimization warnings
- one `react-hooks/set-state-in-effect` rule

This is documented as audit/stabilization work. Do not assume the current prototype is production-ready just because it runs locally.

## Development Principle

For new work, keep a clear distinction between:

- current implemented functionality
- proposed future improvements
- open questions needing business or data-model decisions
