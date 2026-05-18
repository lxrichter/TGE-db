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
- plan deployment around Railway as the intended hosting platform
- use Prisma as the PostgreSQL migration and application data-access foundation
- keep PostgreSQL staging workflows under `/postgres-preview` until they are
  ready to replace the current SQLite prototype routes
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
- [docs/DATA_AND_SECURITY.md](docs/DATA_AND_SECURITY.md)
- [docs/schema/README.md](docs/schema/README.md)

PostgreSQL schema baseline:

- [database/postgres/schema_v1.sql](database/postgres/schema_v1.sql)
- [docs/schema/POSTGRES_SCHEMA_V1.md](docs/schema/POSTGRES_SCHEMA_V1.md)
- [docs/schema/PRISMA_POSTGRES_BASELINE.md](docs/schema/PRISMA_POSTGRES_BASELINE.md)
- [docs/schema/SQLITE_TO_POSTGRES_MAPPING.md](docs/schema/SQLITE_TO_POSTGRES_MAPPING.md)
- [docs/schema/LIVE_DATABASE_MIGRATION_PLAN.md](docs/schema/LIVE_DATABASE_MIGRATION_PLAN.md)
- [docs/schema/LIVE_SQLITE_EXPORT_GUIDE.md](docs/schema/LIVE_SQLITE_EXPORT_GUIDE.md)
- [docs/schema/POSTGRES_STAGING_WORKFLOW.md](docs/schema/POSTGRES_STAGING_WORKFLOW.md)
- [scripts/migration/README.md](scripts/migration/README.md)

Current PostgreSQL staging implementation:

- `/postgres-preview` reads Railway PostgreSQL staging records
- `/postgres-preview/projects/new` and `/postgres-preview/projects/[id]/edit`
  provide staging-only project create/edit scaffolds
- `/postgres-preview/operating-assets/new` and
  `/postgres-preview/operating-assets/[id]/edit` provide staging-only
  plant/facility create/edit scaffolds
- `/postgres-preview/companies/new` and
  `/postgres-preview/companies/[id]/edit` provide staging-only company
  create/edit scaffolds
- PostgreSQL staging detail pages include add/remove managers for
  company-project roles, company-plant/facility roles, and company-company
  relationships
- `/sources` and `/sources/[id]` provide the current PostgreSQL source/evidence
  workflow foundation

These PostgreSQL routes are current implementation work in progress. They do
not yet replace the SQLite prototype, and the live Hetzner SQLite database has
not been imported.

## GitHub

Remote repository:

```text
https://github.com/lxrichter/TGE-db
```

Main branch:

```text
main
```
