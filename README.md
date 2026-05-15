# TGE Geothermal Intelligence Platform

Internal ThinkGeoEnergy platform workstream for structured geothermal market intelligence.

This repository contains the current Next.js + SQLite prototype for the TGE database platform. It should be treated as a working prototype and product specification: it captures useful data structures, workflows, UI ideas, and operational logic, but the strategic direction is to audit, stabilize, and rebuild/replatform the system where needed.

## Purpose

The platform is intended to become ThinkGeoEnergy's structured geothermal intelligence infrastructure, combining:

- geothermal projects, plants, and companies
- lifecycle tracking from project development to operating plants
- company relationships and asset roles
- editorial research workflows, validation, and approvals
- maps, dashboards, exports, and market views
- future source indexing for articles, PDFs, reports, and AI-assisted workflows

## Current Status

Current implemented baseline:

- Next.js app using the App Router
- SQLite local database access through `sqlite` / `sqlite3`
- NextAuth credentials-based authentication
- role-aware access controls for internal users
- project, plant, and company CRUD surfaces
- approval workflows for research operations
- map and market overview pages
- Excel export utilities
- import and maintenance scripts for source data

Strategic direction:

- audit current code and schema
- keep useful domain logic and workflows
- refactor or rebuild unstable implementation areas
- define a stronger semantic model for geothermal capacity, lifecycle phases, roles, and relationships
- migrate toward a stronger production database foundation, likely PostgreSQL
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

- [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md)
- [docs/CURRENT_STATUS.md](docs/CURRENT_STATUS.md)
- [docs/DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md)
- [docs/DATA_AND_SECURITY.md](docs/DATA_AND_SECURITY.md)

## GitHub

Remote repository:

```text
https://github.com/lxrichter/TGE-db
```

Main branch:

```text
main
```
