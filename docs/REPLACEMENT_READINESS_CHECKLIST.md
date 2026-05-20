# Replacement Readiness Checklist

This checklist defines what is needed before the PostgreSQL-backed TGE Database
platform can replace the current internal database platform at
`internal.thinkgeoenergy.com`.

It separates three milestones:

1. Controlled internal data-filling use
2. Operational replacement of the current platform
3. Full intelligence-platform buildout

## Current Rough Progress

As of the current build:

- Controlled internal data-filling use: **around 70% ready**
- Replacement of the current internal database platform: **around 55-60% ready**
- Full long-term geothermal intelligence platform vision: **around 20-25% ready**

These are product-readiness estimates, not code-completion percentages.

## Milestone 1: Controlled Internal Data-Filling Use

Goal: the team can safely use the PostgreSQL side to create, edit, review, and
improve structured records while the current platform remains available.

Current status: mostly in place, but still needs review and hardening.

Implemented:

- PostgreSQL schema and Prisma migrations
- project create/edit/detail/list flows
- plant/facility create/edit/detail/list flows
- company create/edit/detail/list flows
- source create/edit/detail/list flows
- source-to-record evidence links
- company-project, company-asset, and company-company relationship management
- Research Ops generated queues
- persistent human-created Research Ops issues
- validation/readiness panels on forms
- changed-field highlighting in edit forms
- re-review logic for approved/export-ready records changed by edits
- audit events for governed field changes
- approval/export-readiness guards
- AI field suggestion review and audited apply workflow
- article fact candidate review workflow
- article/entity match candidate review workflow
- controlled vocabulary admin page
- global search and command palette
- filtered list pagination and CSV exports

Still needed before serious daily data-filling use:

- review project, plant/facility, and company forms field-by-field with TGE
  researchers/editors
- confirm required fields, important fields, and approval-sensitive fields
- test user roles with real researcher/editor/admin accounts
- test source/evidence linking on real records
- test relationship creation and deletion on real company/project/asset cases
- confirm Research Ops queue logic with real workflows
- confirm which PostgreSQL pages are the daily working pages
- decide whether users should use `/postgres-preview/...` routes during the
  transition or whether routes should be renamed before broader use
- run a small controlled data-entry pilot with a limited country or project set

Recommended gate:

The platform can be used for controlled internal data filling once a small TGE
team can complete this loop without developer help:

```text
Create/edit project or asset
→ add source/evidence
→ link company role
→ submit for validation
→ editor reviews changed fields
→ editor approves or marks needs update
→ record appears in filtered lists/search/Research Ops correctly
```

## Milestone 2: Replacement Of Current Internal Platform

Goal: the new PostgreSQL-backed platform becomes the operational system at
`internal.thinkgeoenergy.com`.

Current status: not ready for cutover yet.

Required before replacement:

- complete migration rehearsal from fresh live SQLite backup
- validate migrated counts against the current live platform
- validate sample records across projects, plants, and companies
- confirm critical fields migrated correctly
- confirm project/plant/company relationships migrated correctly
- confirm source/evidence records and links are sufficient for MVP workflows
- confirm no critical duplicate or missing-ID problems
- deploy PostgreSQL database on the selected production infrastructure
- deploy app to Hetzner production or staging environment
- run Prisma migrations against production/staging PostgreSQL
- configure `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, and `DATABASE_URL`
- configure system service/process manager
- configure Nginx reverse proxy and TLS
- configure PostgreSQL backups and test restore
- smoke-test login, roles, lists, detail pages, forms, sources, Research Ops,
  exports, and search
- decide rollback plan before DNS/domain switch

Important replacement gaps:

- PostgreSQL-backed Map is not yet the final operational map layer
- PostgreSQL-backed Countries/Markets are not yet the final market layer
- PostgreSQL-backed Analysis is not yet the final analytics layer
- print/profile/report output is still early
- external/subscriber access is not part of replacement scope yet

Recommended gate:

The current platform should only be replaced when the PostgreSQL version can
support all daily internal workflows:

```text
Find records
→ edit records
→ create records
→ validate records
→ approve records
→ manage source evidence
→ manage company links
→ inspect missing data
→ export filtered data
→ recover from backup if needed
```

## Milestone 3: Full Intelligence Platform Buildout

Goal: the platform becomes the broader geothermal intelligence operating system
defined in the vision documents.

Not required before replacing the current internal platform:

- full visual redesign
- full AI assistant
- subscriber portal
- API/data products
- full report builder
- automated PDF report generation
- production semantic/vector search
- advanced BI dashboards
- advanced map overlays
- field-level evidence/claim graph
- full source document parsing/OCR

These should remain future-ready, but they should not block the internal
replacement if the core data workflow is stable.

## Recommended Next Work

Next priorities before design phase:

1. Run field-by-field functional review of project, plant/facility, and company
   create/edit forms.
2. Tighten PostgreSQL-backed Map, Countries/Markets, and Analysis minimum views.
3. Run a controlled data-entry pilot with a small real-world sample.
4. Run a fresh SQLite migration rehearsal and validate results.
5. Prepare Hetzner staging deployment rehearsal.

## Decision Still Needed

Before broader internal use, TGE should decide:

- Should `/postgres-preview/...` remain visible during the pilot, or should
  PostgreSQL pages be promoted to cleaner production route names?
- Which team members will be pilot researchers/editors?
- Which country, market, or record subset should be used for the first data
  filling pilot?
- Is the replacement target only internal operations first, or should it already
  include some executive/demo dashboard expectations?
