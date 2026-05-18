# Current Status

This document separates current prototype implementation from the target platform vision.

The markdown vision document defines the platform ThinkGeoEnergy intends to build. The current codebase is earlier work that should be audited and selectively reused.

## Current Implemented Functionality

The repository currently contains a working Next.js + SQLite prototype in `web/`.

Implemented areas include:

- authentication with NextAuth credentials
- middleware-based route protection
- internal role checks
- project, plant, and company pages
- create and edit flows for core entities
- company relationships
- company-project and company-plant links
- research operations views
- approval routes and buttons for records
- map and grouped map components
- markets and analysis pages
- Excel export utilities
- SQLite initialization logic
- import and maintenance scripts

The repository also contains an in-progress Railway PostgreSQL staging
foundation. Current implemented PostgreSQL staging areas include:

- Prisma schema and migration baseline
- `/postgres-preview` staging list/detail pages for projects, operating assets,
  and companies
- staging-only create/edit scaffolds for projects, plants/facilities, and
  companies under `/postgres-preview`
- live form-readiness panels for PostgreSQL staging project, plant/facility,
  and company forms
- staging add/remove relationship managers for company-project roles,
  company-plant/facility roles, and company-company relationships
- staging project, plant/facility, and company detail pages show linked open
  persistent Research Ops issues and allow editors/admins to create, progress,
  resolve, or dismiss human-created issues from the record page
- staging project-to-operating-asset promotion scaffolding from PostgreSQL
  project detail pages, including non-destructive links plus copied source and
  company-role relationships where available
- PostgreSQL Research Ops preview queues with staging quick actions for
  review/status changes, filtered CSV export, row selection, and lightweight
  bulk status changes
- PostgreSQL Research Ops persistent issue/task foundation with issue types,
  issue statuses, assignment fields, linked entities, operational notes, and
  issue event history
- PostgreSQL Research Ops assignment now maps the logged-in internal user to
  `app_users`, supports "assigned to me" filtering, and provides assignment
  dropdowns for persistent human-created issues
- generated Research Ops queues remain live/calculated; only human-created
  issues/tasks are currently persisted
- PostgreSQL Sources / Documents list/detail/create/edit workflow foundation
- source/evidence linking between source records and projects, operating
  assets, or companies
- editor source credibility actions
- PostgreSQL source workflows now stamp mapped `app_users` metadata for source
  creation, source review, and evidence-link review actions
- PostgreSQL project, plant/facility, and company detail pages now support
  direct linking of existing source/evidence records with confidence, linked
  field, extracted value, claim text, and evidence notes
- PostgreSQL project, plant/facility, and company detail source panels now
  support searching/importing public ThinkGeoEnergy WordPress articles as
  `tge_article` sources and linking them to the current record
- a local-only TGE markdown news archive preview script can parse historical
  article metadata and candidate related-news links into ignored `source-data/`
  outputs without writing to PostgreSQL
- a local-only entity match preview can compare article metadata against local
  entity JSON or read-only PostgreSQL staging entity names to create candidate
  related-news review files
- PostgreSQL source records now have a migration-ready TGE article metadata
  extension and a dry-run-by-default metadata importer for the markdown archive
- source/entity article matches now have a dedicated candidate-review table and
  explicit matcher write path; no real `entity_sources` links are auto-created
- preview-only export-readiness panels on PostgreSQL entity detail pages

These PostgreSQL routes are not yet the production replacement for the SQLite
prototype.

## Current Data Model Areas

Current application code references these main entity areas:

- `plants`
- `projects`
- `companies`
- `company_roles`
- `company_relationships`
- `company_project_links`
- `company_plant_links`
- reference tables for company types and roles
- `users`

The current schema is useful as an inventory and prototype baseline. It still needs audit before being treated as a stable production schema or as the basis for a PostgreSQL migration.

## How To Use The Prototype

Use the current codebase to extract:

- domain entities and fields that remain relevant
- UI flows that match real editorial work
- validation and approval concepts
- import/export requirements
- role and permission concepts
- lessons about what should not be carried forward

Do not use the current codebase as proof that the future architecture is settled.

## Current Runtime Assumptions

The app expects:

- a local SQLite database file
- a `users` table with active internal users
- `NEXTAUTH_SECRET` configured
- `DB_PATH` pointing at the database

PostgreSQL staging routes additionally expect Railway/PostgreSQL connection
variables through `DATABASE_PUBLIC_URL` or `DATABASE_URL`.

No production data dump is included in Git.

## Known Gaps

Known current gaps and risks:

- lint fails on TypeScript and React rule violations
- extensive `any` usage needs cleanup
- schema needs formal audit and migration plan
- SQLite is acceptable for local prototype work but is not the likely final production database
- PostgreSQL staging entity forms are scaffolds; promotion workflows and
  persistent Research Ops issues have first staging implementations, while
  richer assignment workflows, field-level issue automation, generated-queue
  persistence decisions, and production exports are still next-step work
- current docs and comments should not be assumed to describe final architecture
- no committed sanitized fixture database exists yet
- deployment process needs hardening and should be evaluated against Railway requirements
- subscriber access is not yet a completed product layer
- AI layer is not yet a stable implemented platform feature

## Validation Snapshot

Last checked locally:

- `npm run dev`: app starts and responds on `http://localhost:3000`
- `/`: redirects to `/login`
- `npm run lint`: fails on existing lint debt

The lint result should be treated as part of the Phase 1 audit backlog.

## Current Repository Hygiene

The following are intentionally ignored:

- `node_modules/`
- `.next/`
- `.env` and `.env.*`
- SQLite databases and backups
- source Excel/CSV files
- `.DS_Store`
- local command artifacts

Do not remove these ignore rules unless a sanitized, explicit development fixture is being added.
