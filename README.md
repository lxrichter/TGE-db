# TGE Geothermal Intelligence Platform

Internal ThinkGeoEnergy platform workstream for the geothermal intelligence platform to be built.

This repository contains two related things:

- the platform vision and development documentation for the geothermal intelligence platform ThinkGeoEnergy intends to build
- the current Next.js + SQLite prototype, which is earlier work to audit and mine for useful domain logic, workflows, data structures, UI patterns, and operational lessons

The current code is not the final architecture. It is a reference implementation and product-specification input for the next platform build.

## Purpose

The platform is intended to become ThinkGeoEnergy's structured geothermal intelligence infrastructure, combining:

- geothermal power projects, power plants, direct-use projects/facilities, mineral extraction projects, and companies
- lifecycle tracking from project development to operating plants
- company relationships and asset roles
- editorial research workflows, validation, and approvals
- maps, dashboards, exports, and market views
- future source indexing for articles, PDFs, reports, and AI-assisted workflows

## Current Prototype Status

Current implemented baseline in `web/`:

- Next.js app using the App Router
- SQLite local database access through `sqlite` / `sqlite3`
- NextAuth credentials-based authentication
- role-aware access controls for internal users
- project, plant, and company CRUD surfaces
- approval workflows for research operations
- map and market overview pages
- Excel export utilities
- import and maintenance scripts for source data

Intended build direction:

- audit current code and schema as earlier work
- keep useful domain logic, workflows, UI ideas, and validation rules
- refactor or rebuild unstable implementation areas
- define a stronger semantic model for geothermal capacity, lifecycle phases, roles, and relationships
- migrate toward a stronger production database foundation on PostgreSQL
- use local/Railway PostgreSQL for controlled staging while preparing the final
  app deployment path around the ThinkGeoEnergy Hetzner server environment
- use Prisma as the PostgreSQL migration and application data-access foundation
- keep PostgreSQL staging workflows under `/postgres-preview` until they are
  ready to replace the current SQLite prototype routes
- use the copied Hetzner SQLite backup imported into PostgreSQL staging
  as a controlled review baseline while the current live database remains on
  the server
- add source registry and AI-assisted research support only after the core model and workflow are stable

## Repository Layout

```text
.
├── data-tools/             # Local import/build scripts for source data
├── docs/                   # Project context, status, roadmap, and data rules
├── scripts/                # Maintenance and validation helper scripts
├── shared/data/            # Local SQLite runtime data, ignored by Git
├── source-data/            # Local Excel/source imports, ignored by Git
└── web/                    # Next.js application
```

Important application paths:

```text
web/app/                   # Routes, pages, and API endpoints
web/components/            # Reusable UI and workflow components
web/lib/                   # Database, auth, validation, export, options
web/data/schema.sql        # Legacy/reference SQLite schema snapshot
web/prisma/                # Prisma PostgreSQL schema and migrations
web/.env.example           # Local environment example
```

## Local Development

Prerequisites:

- Node.js compatible with Next.js 16
- npm
- a local SQLite database file, or an empty database path that can be initialized

Setup:

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

The app runs at:

```text
http://localhost:3000
```

By default, local development expects SQLite data at:

```text
../shared/data/tge.db
```

Set `DB_PATH` in `web/.env.local` to override this path.

### PostgreSQL Staging Development

To run the PostgreSQL staging preview locally with Railway variables:

```bash
cd web
railway run --service Postgres -- npm run dev
```

Railway is currently a staging/development aid, not a final production hosting
decision. The final app-hosting target is expected to be the ThinkGeoEnergy
Hetzner server environment, currently serving `internal.thinkgeoenergy.com`.
Production PostgreSQL hosting still needs a final decision: Hetzner-hosted
PostgreSQL for maximum control, or managed PostgreSQL to reduce operations
burden.

Primary PostgreSQL staging routes:

```text
http://localhost:3000/postgres-preview
http://localhost:3000/postgres-preview/research-ops
http://localhost:3000/postgres-preview/projects
http://localhost:3000/postgres-preview/operating-assets
http://localhost:3000/postgres-preview/companies
http://localhost:3000/sources
```

## Environment Variables

See `web/.env.example`.

Required for local development:

```text
DB_PATH=../shared/data/tge.db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-local-development-secret
```

Use a real secret outside local development. Do not commit `.env`, `.env.local`, database files, exports, credentials, or client-confidential source data.

## Data Handling

The repository intentionally excludes:

- local SQLite databases and backups
- Excel source imports
- client-confidential data
- personal identifiers
- NDA-bound materials unless anonymized
- generated build output
- dependency folders

Database and source files should remain local unless a sanitized, explicit sample fixture is created for development.

## Validation Status

The app preview runs locally, but `npm run lint` currently fails on pre-existing TypeScript and React lint issues, mainly `@typescript-eslint/no-explicit-any` and one hook rule. Treat lint cleanup as part of the audit and stabilization phase rather than as completed baseline quality.

## Documentation

Start here:

- [docs/PLATFORM_VISION.md](docs/PLATFORM_VISION.md)
- [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md)
- [docs/CURRENT_STATUS.md](docs/CURRENT_STATUS.md)
- [docs/PROTOTYPE_AUDIT_REPORT.md](docs/PROTOTYPE_AUDIT_REPORT.md)
- [docs/MVP_SCOPE_V1.md](docs/MVP_SCOPE_V1.md)
- [docs/PRODUCT_BUILD_SPEC_V1.md](docs/PRODUCT_BUILD_SPEC_V1.md)
- [docs/ROLE_MODEL.md](docs/ROLE_MODEL.md)
- [docs/DIRECT_USE_SCOPE_NOTE.md](docs/DIRECT_USE_SCOPE_NOTE.md)
- [docs/SEMANTIC_MODEL_WORKSHEET.md](docs/SEMANTIC_MODEL_WORKSHEET.md)
- [docs/SEMANTIC_MODEL_V1.md](docs/SEMANTIC_MODEL_V1.md)
- [docs/DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md)
- [docs/DEPLOYMENT_BASELINE.md](docs/DEPLOYMENT_BASELINE.md)
- [docs/HETZNER_DEPLOYMENT_PREP.md](docs/HETZNER_DEPLOYMENT_PREP.md)
- [docs/DATA_AND_SECURITY.md](docs/DATA_AND_SECURITY.md)
- [docs/PAGE_REVIEW_PROTOCOL.md](docs/PAGE_REVIEW_PROTOCOL.md)
- [docs/schema/README.md](docs/schema/README.md)

PostgreSQL schema baseline:

- [database/postgres/schema_v1.sql](database/postgres/schema_v1.sql)
- [docs/schema/POSTGRES_SCHEMA_V1.md](docs/schema/POSTGRES_SCHEMA_V1.md)
- [docs/schema/PRISMA_POSTGRES_BASELINE.md](docs/schema/PRISMA_POSTGRES_BASELINE.md)
- [docs/schema/SQLITE_TO_POSTGRES_MAPPING.md](docs/schema/SQLITE_TO_POSTGRES_MAPPING.md)
- [docs/schema/LIVE_DATABASE_MIGRATION_PLAN.md](docs/schema/LIVE_DATABASE_MIGRATION_PLAN.md)
- [docs/schema/LIVE_SQLITE_EXPORT_GUIDE.md](docs/schema/LIVE_SQLITE_EXPORT_GUIDE.md)
- [docs/schema/LIVE_SQLITE_INSPECTION_WORKFLOW.md](docs/schema/LIVE_SQLITE_INSPECTION_WORKFLOW.md)
- [docs/schema/LIVE_SQLITE_AUDIT_2026-05-18.md](docs/schema/LIVE_SQLITE_AUDIT_2026-05-18.md)
- [docs/schema/LIVE_SQLITE_DRY_RUN_MIGRATION_WORKFLOW.md](docs/schema/LIVE_SQLITE_DRY_RUN_MIGRATION_WORKFLOW.md)
- [docs/schema/LIVE_SQLITE_DRY_RUN_RESULT_2026-05-18.md](docs/schema/LIVE_SQLITE_DRY_RUN_RESULT_2026-05-18.md)
- [docs/schema/POSTGRES_STAGING_WORKFLOW.md](docs/schema/POSTGRES_STAGING_WORKFLOW.md)
- [scripts/migration/README.md](scripts/migration/README.md)

Current PostgreSQL staging implementation:

- `/postgres-preview` reads PostgreSQL staging records
- `/postgres-preview/projects`, `/postgres-preview/operating-assets`, and
  `/postgres-preview/companies` provide PostgreSQL staging list entry points
- `/postgres-preview/projects/new` and `/postgres-preview/projects/[id]/edit`
  provide staging-only project create/edit scaffolds
- `/postgres-preview/operating-assets/new` and
  `/postgres-preview/operating-assets/[id]/edit` provide staging-only
  plant/facility create/edit scaffolds
- `/postgres-preview/companies/new` and
  `/postgres-preview/companies/[id]/edit` provide staging-only company
  create/edit scaffolds
- PostgreSQL staging forms include live form-readiness panels for critical,
  important, and separate-workflow data gaps
- PostgreSQL staging detail pages include add/remove managers for
  company-project roles, company-plant/facility roles, and company-company
  relationships, plus linked Research Ops issue panels that can create,
  progress, resolve, or dismiss human-created issues
- PostgreSQL staging project, plant/facility, and company detail pages can link
  existing source/evidence records directly from the record page
- PostgreSQL project detail pages include project-to-plant/facility promotion
  scaffolding that creates a linked staging operating asset and copies available
  source and company-role links
- `/postgres-preview/research-ops` includes staging quick actions for changing
  project, plant/facility, company, and source review/status states, plus
  filtered CSV export, lightweight bulk status changes, and persistent
  human-created research issues/tasks with PostgreSQL user assignment controls
- generated Research Ops queues remain live/calculated for now; only deliberate
  human-created issues are persisted until the workflow is stable
- `/sources` and `/sources/[id]` provide the current PostgreSQL source/evidence
  workflow foundation, including PostgreSQL user stamping for source creation,
  source review, and evidence-link review metadata

These PostgreSQL routes are current implementation work in progress. They do
not yet replace the SQLite prototype. A copied 2026-05-18 Hetzner SQLite backup
has been transformed into PostgreSQL staging for controlled review; the current
live SQLite database remains on the server and local database files stay
ignored by Git.

Live SQLite migration preparation is now handled through a local, read-only
inspection script:

```bash
cd web
npm run sqlite:inspect -- --db "../migration/live_exports/YYYY-MM-DD/tge_live_YYYYMMDD_HHMMSS.db" --profile-values
```

The live database backup and generated inspection outputs remain ignored local
working files. The command produces schema, row counts, indexes, foreign keys,
and aggregate completeness metrics only; it does not export raw record samples.

Dry-run migration tooling for the copied live SQLite backup now runs through:

```bash
cd web
npm run live-sqlite:stage
npm run live-sqlite:transform
npm run live-sqlite:validate
```

See [docs/schema/LIVE_SQLITE_DRY_RUN_MIGRATION_WORKFLOW.md](docs/schema/LIVE_SQLITE_DRY_RUN_MIGRATION_WORKFLOW.md).

## GitHub

Remote repository:

```text
https://github.com/lxrichter/TGE-db
```

Main branch:

```text
main
```
