# Implementation Sequencing Plan

Date: 2026-05-18

Purpose: translate the functional page blueprint into a practical build order
for the TGE geothermal intelligence platform.

This plan is intentionally concise. It defines what to build first, what depends
on what, and when page-by-page design review should happen.

## Current Position

Current implemented foundation:

- Next.js + SQLite prototype with projects, plants, companies, map, analysis,
  markets, auth, and exports
- Railway PostgreSQL staging database
- PostgreSQL schema baseline
- Prisma migration/application data-access foundation
- Prisma baseline migration recorded against Railway PostgreSQL staging
- safe PostgreSQL staging seed
- PostgreSQL preview page
- read-only PostgreSQL Research Ops preview
- read-only PostgreSQL project, plant/facility, and company detail previews
- PostgreSQL Sources / Documents MVP foundation:
  - source visibility and credibility/status reference tables
  - expanded source metadata and evidence-link fields
  - source list/detail/reference-data service and API route foundation
  - source validation queues added to PostgreSQL Research Ops preview
  - source/evidence panels on PostgreSQL entity preview pages
  - editor source credibility actions on source profiles
- functional page/module blueprint covering:
  - Research Ops
  - Sources / Documents
  - Projects
  - Plants / Facilities
  - Companies
  - Countries / Markets
  - Map
  - Analysis
  - Dashboard
  - Admin / Governance
  - Global Search / Command Palette / AI Readiness

Current deliberate constraints:

- do not import the live Hetzner SQLite database yet
- do not build the subscriber portal yet
- do not build full AI workflows yet
- do not build a full report builder yet
- use the current prototype as earlier work to selectively reuse, not as the
  final architecture by default

## Sequencing Principles

Build order should follow dependency and risk:

1. PostgreSQL platform foundation
2. source/evidence and validation model
3. operational research workflows
4. core entity pages and forms
5. relationships and promotion logic
6. search/navigation
7. market, map, and analysis outputs
8. dashboard/presentation layer
9. live data migration
10. future AI/subscriber/reporting layers

Strategic rules:

- one structured relational core, many analytical views
- Research Ops is the operational backbone
- Sources / Documents is the evidence backbone
- Projects, Plants / Facilities, and Companies are the core entity workflows
- Countries / Markets, Map, Analysis, and Dashboard are intelligence outputs
- Admin / Governance protects taxonomy, validation, visibility, and future AI
  safety

## Phase 0: Planning Baseline

Status: mostly complete.

Purpose:

- preserve product, semantic, and functional decisions before deep rebuild work

Completed / current outputs:

- product build spec
- semantic model
- PostgreSQL schema baseline
- functional page blueprint
- PostgreSQL staging workflow
- live SQLite export guide

Remaining actions:

- keep decisions updated as design reviews refine page behavior
- avoid adding major functionality until the next technical slice is agreed

## Phase 1: PostgreSQL Application Foundation

Status: in progress.

Purpose: turn PostgreSQL from a staging preview into the real application data
foundation.

Key work:

- choose and configure migration layer: Prisma selected
- formalize PostgreSQL migrations instead of standalone SQL only: baseline done
- connect core app data access to PostgreSQL behind stable query/service modules:
  started with PostgreSQL preview and Research Ops preview services
- decide staging vs production Railway environment pattern
- align app roles with the MVP role model: done for current auth/admin and
  PostgreSQL `app_users.role_code`
  - researcher
  - editor
  - senior editor
  - admin
- define shared audit fields and update behavior
- ensure local development can reliably use Railway PostgreSQL

Deliverables:

- migration tooling selected: Prisma
- first managed migration generated from current PostgreSQL schema
- stable database access layer: shared Prisma client helper started
- Railway environment notes
- auth/role model alignment notes: `docs/ROLE_MODEL.md`
- Sources / Documents MVP migration applied to Railway PostgreSQL staging
- PostgreSQL source service and read endpoints started
- source status connected into the read-only Research Ops preview queues

Immediate next actions:

1. add source-aware export-readiness checks
2. keep tightening permissions when write-enabled PostgreSQL routes are added
3. decide when PostgreSQL entity edit pages should replace or sit beside the
   current SQLite prototype edit flows

Do before:

- production PostgreSQL entity editing
- live SQLite migration/import
- write-enabled Research Ops actions

## Phase 2: Sources / Evidence And Validation Core

Status: started.

Purpose: build the evidence and validation backbone before expanding workflows.

Current implemented foundation:

- Prisma migration `20260518000200_sources_documents_mvp`
- source visibility/confidentiality levels
- source credibility/status labels
- richer source metadata fields
- reusable evidence-link metadata on `entity_sources`
- source list/detail/reference-data service and API endpoints
- read-only top-level `/sources` list and filter page
- read-only `/sources/[id]` source profile page
- `/sources/new` create page
- `/sources/[id]/edit` edit page with evidence-link manager
- source create/update API routes
- source-link create/delete API routes
- Research Ops "Needs Source" rows can open a prelinked add-source flow
- safe non-confidential staging source seed with sample evidence links
- Research Ops source queues for review and weak/outdated sources
- read-only PostgreSQL project, plant/facility, and company detail pages show
  source/evidence panels and add-source actions
- editor source-validation actions for credible, weak, outdated, rejected, and
  needs-review states

Key work:

- prepare country/market source links when country/market pages move to
  PostgreSQL
- connect source status into validation and Research Ops queues
- define approval/export-ready validation checks in code

Deliverables:

- source records
- source detail page
- source linking UI
- source validation status
- Research Ops source queues
- source-aware approval/export readiness

Do before:

- serious record approval workflow
- AI/search source work
- report-ready exports

## Phase 3: Research Ops Operationalization

Purpose: move Research Ops from read-only preview to actual work surface.

Key work:

- replace preview-only queues with production PostgreSQL-backed queues
- add filters for entity, country, region, researcher, status, use type,
  lifecycle, severity, source status, and date edited
- add row click-through to full record detail pages
- add quick actions:
  - assign to self
  - add source
  - add note
  - mark ready for validation
  - flag duplicate
- add editor/admin actions:
  - approve
  - return to validation
  - mark needs update
  - mark export ready
- add lightweight bulk actions and filtered exports

Deliverables:

- operational Research Ops dashboard
- assignment and review state
- source and missing-data queues
- duplicate warnings
- filtered Research Ops exports

Do before:

- broad team data-entry scaling
- live data import validation

## Phase 4: Core Entity Workflows

Purpose: build stable detail/edit/list workflows for the core database.

### 4A: Projects

Key work:

- project list/detail/create/edit on PostgreSQL
- adaptive forms for power/direct-use/hybrid
- potential min/max vs planned capacity handling
- company role links
- source links
- validation state
- missing-data flags
- project-to-asset promotion workflow
- project exports and print/profile views

### 4B: Plants / Facilities

Key work:

- operating asset list/detail/create/edit on PostgreSQL
- adaptive fields for power/direct-use/hybrid/mineral
- installed vs running/current capacity logic
- operating status
- plant/facility group and field group linkage
- unit records where analytically important
- retired/offline handling in totals
- capacity history notes/events
- exports and print/profile views

### 4C: Companies

Key work:

- company list/detail/create/edit on PostgreSQL
- company groups
- controlled primary/secondary categories
- structured company relationships
- structured company roles across projects/assets
- ownership share support
- calculated activity summaries
- internal/exportable note separation
- company exports and print/profile views

Deliverables:

- stable entity pages
- record-level validation and approval
- structured relationship management
- source-linked detail pages
- exportable entity views

Do before:

- full market intelligence views
- advanced search/command palette
- live production migration

## Phase 5: Global Search And Command Palette

Purpose: make the platform fast to navigate and prepare the future AI retrieval
layer.

Key work:

- global keyword search
- lightweight fuzzy search
- alias handling
- grouped results:
  - Projects
  - Plants / Facilities
  - Companies
  - Countries / Markets
  - Sources / Articles
- role-aware and validation-aware visibility
- command palette:
  - Add Project
  - Add Plant
  - Add Company
  - Open Research Ops
  - Open country/market
  - Export current view

Deliverables:

- global search
- command palette
- entity-grouped results
- search permission rules

Do before:

- semantic search
- AI prompting
- subscriber-safe search products

## Phase 6: Intelligence Outputs

Purpose: turn the relational data core into market intelligence surfaces.

### 6A: Countries / Markets

Build country and regional market pages with:

- approved/export-ready market metrics
- internal draft-aware toggle
- project, asset, company, source tables
- editorial market notes
- policy/market notes
- related TGE news
- charts, maps, and exports

### 6B: Map

Build map as navigation and spatial intelligence layer:

- clustered default map
- project and plant/facility layers
- direct-use, hybrid, and mineral layers
- approved-only and internal draft toggles
- no fake markers for missing coordinates
- marker popup with full record link
- filtered map exports/screenshots where feasible

### 6C: Analysis

Build predefined BI-style dashboards:

- installed capacity by country
- pipeline by country and lifecycle
- direct-use category analysis
- technology mix
- company role analysis
- historical charts where data exists
- chart -> filtered table -> record detail drilldowns
- exportable chart/table data

Deliverables:

- market pages
- map intelligence layer
- predefined analysis dashboards
- exportable filtered views

Do before:

- premium Dashboard overhaul
- automated report generation
- AI market briefings

## Phase 7: Dashboard Intelligence Layer

Purpose: create the premium intelligence home screen and demo surface.

Key work:

- global KPI cards
- market snapshot
- pipeline overview
- top markets
- technology overview
- company intelligence
- activity feed
- latest TGE news
- compact map snapshot
- validation/data-health summary
- role-aware widgets
- mobile-capable layout

Deliverables:

- polished Dashboard
- demo-ready intelligence overview
- role-aware dashboard widgets

Do after:

- enough core data surfaces exist to make dashboard drilldowns meaningful

## Phase 8: Admin / Governance Maturity

Purpose: harden the governance layer needed for scale.

Key work:

- user/role management
- permission controls
- controlled vocabulary management
- provisional vocabulary workflow
- approval/export rule configuration
- internal/exportable field visibility
- activity/audit views
- Admin vs Editor workflow separation

Deliverables:

- governance-ready Admin section
- controlled vocabulary workflows
- validation/export rule controls

Runs in parallel with:

- Phases 2-6 where role, vocabulary, and validation needs appear

## Phase 9: Live SQLite Migration

Purpose: safely migrate the current live Hetzner SQLite database into the new
PostgreSQL system.

Do only after:

- PostgreSQL entity schema is stable
- source/evidence model is ready
- validation and Research Ops queues are operational
- import mapping has been tested on a copy
- duplicate and missing-data workflows exist

Key work:

- export live SQLite backup
- profile live schema and records
- map legacy fields to PostgreSQL schema
- import into staging
- run validation/missing-data reports
- reconcile duplicates and relationship issues
- approve go-live import plan

Deliverables:

- migration scripts
- staging import report
- reconciliation backlog
- go-live import checklist

## Phase 10: Future Product Layers

Not MVP, but architecture should remain ready for:

- semantic search
- AI-assisted source extraction
- AI summaries
- natural-language querying
- automated report generation
- subscriber/client portal
- API/data products
- presentation/report templates
- Power BI/external BI integration

## Design Review Order

Page-by-page design review should happen in this order:

1. Research Ops
2. Sources / Documents
3. Projects
4. Plants / Facilities
5. Companies
6. Countries / Markets
7. Map
8. Analysis
9. Admin / Governance
10. Global Search / Command Palette
11. Dashboard

Reason:

- start with workflow and data integrity
- then define core record pages
- then intelligence outputs
- then navigation/search
- then premium dashboard presentation

## Immediate Next Action

Recommended next concrete step:

```text
Continue Phase 2: Source validation and entity integration
```

Next implementation slice:

```text
Bring source evidence directly into the next PostgreSQL entity workflows.
```

Recommended task order:

1. add export-readiness checks that require credible source coverage
2. add PostgreSQL edit-page scaffolds for projects/assets/companies or migrate
   existing detail/edit pages carefully
3. keep SQLite prototype routes available until PostgreSQL replacements are
   ready
4. avoid live data import until the PostgreSQL workflows are stable
