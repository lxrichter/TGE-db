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
- PostgreSQL project, plant/facility, company, and source detail pages now use
  a shared action-hub pattern that points researchers to source/evidence work,
  relationship work, Research Ops issues, AI suggestions, export readiness, and
  relevant edit/create actions without duplicating workflow logic
- Research Ops generated queue rows now deep-link into the relevant detail-page
  work sections, for example source/evidence, company relationships, identity
  and classification, AI suggestions, and export-readiness review sections
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
- `/sources/matches` now provides the first filtered review surface for article
  match candidates; confirmation creates or reuses reviewed evidence links
- `/sources/matches` and embedded article match candidate panels now paginate
  visible review rows and keep bulk confirmation limited to clean visible
  candidates unless reviewed one by one
- PostgreSQL Research Ops now shows article match candidate counts and quick
  links into the Sources review workflow
- PostgreSQL project, plant/facility, and company detail pages now surface
  confirmed `tge_article` evidence links as Related TGE News / Evidence
- field suggestion candidate schema, review surfaces, and controlled apply
  workflow have been added for AI-assisted data filling; suggestions remain
  human-reviewed candidates and only whitelisted empty project/plant fields can
  be applied through the audited local/staging workflow
- local-only article fact extraction now includes a balanced manual-review CSV
  sample, a local review-audit command, and review guidance for tuning rules
  before any PostgreSQL import
- first local article fact review pass completed on a 2026 focused sample:
  104 accepted, 29 rejected; the first rule-tuning pass removed 15 rejected
  examples while preserving the accepted examples in the reviewed sample
- second local article fact review/tuning pass completed on the tuned sample:
  reviewed rows showed 47 accepted and 16 rejected; follow-up rules removed 14
  rejected examples and added an explicit proposal/call signal
- local-only article fact import-pack command now converts reviewed CSV/XLSX
  decisions into DB-shaped NDJSON/CSV candidate files, including a
  confirmed-only pack; it performs no network calls, no database writes, no
  entity field updates, and no full article body export
- local-only article fact import-pack audit now validates reviewed packs before
  any database staging step, including required fields, duplicate fact keys,
  status values, confidence ranges, snippet length, JSON shape, and privacy
  safety flags
- dry-run-first article fact import-pack loader now prepares confirmed reviewed
  candidates for local PostgreSQL sandbox insertion, with execute mode blocked
  for non-local database URLs by default and no path to update entity fields or
  create real evidence links
- `/sources/facts` now provides the first PostgreSQL-backed article fact review
  surface, with filters, pagination, status summary, candidate table, and
  editor/admin bulk triage actions; these actions update only
  `article_fact_candidates` review status and do not update entity records or
  create evidence links
- `/sources/facts` and embedded article fact candidate panels now paginate
  visible review rows so larger extraction review batches remain manageable
- PostgreSQL Research Ops now includes article fact review visibility, linking
  the extraction candidate workload into the operational dashboard while keeping
  the detailed review workflow in Sources / Documents
- dry-run-first article fact source backfill command now creates or updates
  `tge_article` source metadata rows from reviewed article facts and relinks
  `article_fact_candidates.source_id`; it remains metadata-only and does not
  create evidence links or update entity fields
- dry-run-first article fact field-suggestion command now turns confirmed
  article facts plus confirmed article/entity matches into reviewable
  `field_suggestion_candidates` for capacity and target COD fields, without
  applying values to entity records
- dry-run-first confirmed field-suggestion apply command now provides the
  controlled final step for local sandbox testing: confirmed suggestions can be
  applied only to whitelisted empty project/plant fields, with audit events and
  no automatic approval/export-ready status
- `/postgres-preview/research-ops` now paginates deep queue tables and AI field
  suggestion review rows to keep generated queues and review workloads usable as
  candidate volumes grow
- shared AI field suggestion panels on project, plant/facility, company, and
  source detail pages now use paginated rows while preserving the two-step
  confirm-then-apply governance model
- `/sources/[id]` source detail pages now show source lifecycle state, what the
  source supports, linked evidence, match candidates, article fact candidates,
  AI suggestions, credibility actions, and review metadata as one governed
  evidence workspace
- source edit pages now include quick linked-evidence fact type presets for
  capacity, timing, public funding/grants, private financing/investment,
  debt/loans, contracts, license/lease-sale values, license/permit status,
  ownership/operator, direct-use classification, technology/resource, and
  policy/tariff evidence links
- article fact candidate display now avoids duplicate unit rendering, and the
  local extraction taxonomy separates public funding/grants, private
  financing/investment raises, loans, contract awards, and license/lease-sale
  values instead of treating all money signals as one generic funding category
- `/sources/facts` now supports fact-type training review with compact
  definition cards when a single fact type is selected, and
  `docs/ARTICLE_FACT_TYPE_TRAINING_LOOP.md` documents the local one-type sample
  review cycle
- first `capacity_signal` training audit completed: 50 reviewed rows, 40
  accepted, 10 rejected; repeated false positives came mainly from capacity
  numbers inside markdown link URLs/related-article references, so the local
  article scanner now strips markdown link targets and bare URLs before fact
  extraction while preserving visible link text
- local-only live SQLite migration inspection command `npm run sqlite:inspect`
  can profile a copied Hetzner SQLite backup read-only into ignored
  `source-data/` outputs without exporting raw row samples
- first live SQLite migration audit pass completed against a copied Hetzner
  backup, with aggregate findings documented in
  `docs/schema/LIVE_SQLITE_AUDIT_2026-05-18.md`
- dry-run live SQLite migration tooling has been added for raw PostgreSQL
  staging import, transaction-rollback transform tests, and validation reports
- first live SQLite dry-run migration into Railway PostgreSQL staging completed
  and validated successfully; result documented in
  `docs/schema/LIVE_SQLITE_DRY_RUN_RESULT_2026-05-18.md`
- Railway PostgreSQL staging now contains the transformed copied Hetzner SQLite
  backup for controlled review, while the current live SQLite database remains
  on the server and database files remain ignored locally
- PostgreSQL preview list entry points exist for `/postgres-preview/projects`,
  `/postgres-preview/operating-assets`, and `/postgres-preview/companies`
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

For PostgreSQL staging review, start local development with:

```bash
cd web
railway run --service Postgres -- npm run dev
```

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
- AI layer is not yet a stable production feature; current implementation
  supports controlled local/staging candidate extraction, human confirmation,
  reviewed field-suggestion candidates, and audited apply for a narrow set of
  empty fields only

## Validation Snapshot

Last checked locally:

- `railway run --service Postgres -- npm run dev`: app starts and PostgreSQL
  staging routes respond on `http://localhost:3000`
- `/`: redirects to `/login`
- targeted lint and `npm run build` passed for the Research Ops/detail
  field-suggestion pagination changes added on 2026-05-20
- full-repository lint still needs a separate cleanup pass for older lint debt

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
