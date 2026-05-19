# Page Review Protocol

Date: 2026-05-19

Purpose: provide a repeatable working method for reviewing and improving each
platform page before the PostgreSQL staging pages become the main application
routes.

This protocol is deliberately practical. It is meant to guide detailed
discussion about exact data fields, tables, charts, forms, filters, workflows,
and design choices without losing the distinction between current
implementation and target platform behavior.

## Current Review Baseline

Current implemented baseline:

- current SQLite prototype routes remain available at `/projects`, `/plants`,
  `/companies`, `/research-ops`, `/map`, `/analysis`, and `/markets`
- PostgreSQL staging routes are available under `/postgres-preview`
- Railway PostgreSQL staging contains the transformed 2026-05-18 copied
  Hetzner SQLite backup plus PostgreSQL-native preview records
- source/evidence records and TGE article metadata are in PostgreSQL staging
- generated Research Ops queues are live/calculated
- human-created Research Ops issues are persisted

Current constraint:

- PostgreSQL staging is not yet the production replacement for the SQLite
  prototype
- page reviews should define what must be improved before route replacement

## Review Order

Recommended order:

1. Research Ops
2. Sources / Documents
3. Projects
4. Plants / Facilities
5. Companies
6. Global Search / Navigation
7. Countries / Markets
8. Map
9. Analysis
10. Dashboard
11. Admin / Governance

Reason:

- Research Ops exposes data-quality and workflow problems first
- Sources / Documents is the evidence backbone
- Projects, Plants / Facilities, and Companies are the core data-entry and
  profile workflows
- Countries / Markets, Map, Analysis, and Dashboard depend on cleaner core data
- Admin / Governance should harden rules after the core workflow is clearer

## Page Review Method

Each page review should produce a short page contract before major UI changes.

Use this sequence:

1. Current implementation pass
   - what exists today
   - what is useful
   - what is confusing
   - what is missing

2. User and workflow pass
   - primary users
   - main jobs to be done
   - expected entry points
   - expected next actions

3. Data contract pass
   - exact fields to show
   - derived metrics to calculate
   - validation flags to expose
   - internal-only fields
   - exportable fields

4. Presentation pass
   - tables
   - cards
   - charts
   - maps
   - forms
   - detail sections
   - print/export surfaces

5. Interaction pass
   - filters
   - search
   - sorting
   - bulk actions
   - quick actions
   - click-through behavior
   - mobile behavior

6. Implementation slice
   - what to build now
   - what to defer
   - what requires schema changes
   - what requires data cleanup

7. Verification pass
   - route loads
   - role behavior is correct
   - important filters work
   - create/edit/review actions work where applicable
   - no confidential/internal data leaks into export-style views

## Page Contract Template

Use this template for each page.

```text
Page:
Route:
Current status:
Primary users:
Primary purpose:

Main workflows:
- ...

Data to show:
- ...

Tables:
- columns
- filters
- sorting
- saved views later

Cards / KPI blocks:
- ...

Charts:
- ...

Forms / edit surfaces:
- required fields
- optional fields
- validation warnings
- source/evidence behavior

Actions:
- row actions
- bulk actions
- review/approval actions
- export actions

Permissions:
- researcher
- editor / senior editor
- admin

Mobile behavior:
- ...

Print/export behavior:
- ...

Internal-only fields:
- ...

MVP changes:
- ...

Future changes:
- ...

Open decisions:
- ...
```

## First Page To Review: Research Ops

Start with:

```text
http://localhost:3000/postgres-preview/research-ops
```

Page contract:

- [Research Ops Page Contract](page-contracts/RESEARCH_OPS_PAGE_CONTRACT.md)
- [Sources / Documents Page Contract](page-contracts/SOURCES_DOCUMENTS_PAGE_CONTRACT.md)

Review focus:

- whether the generated queue list is useful as a daily work surface
- whether issue labels, severity, and grouping are clear
- whether filters should prioritize issue type, country, entity type,
  researcher, source status, or review status
- whether selected-row actions feel adequate or too limited
- whether persistent human-created issues should stay visually separate from
  generated queues
- whether article match candidates belong inside Research Ops, Sources, or both
- what bulk actions are necessary before the archive-matching workflow becomes
  operationally usable

Do not attempt final visual design in this first pass. The first pass should
define workflow, data, and information hierarchy.

## Implementation Rules

During page reviews:

- keep changes small enough to verify
- avoid replacing current SQLite production-like routes until PostgreSQL pages
  are good enough
- keep generated queues live/calculated unless a human creates a deliberate
  task/issue
- keep article/entity match candidates reviewable before they create real
  evidence links
- keep AI-assisted field suggestions reviewable before they change real
  project, plant/facility, or company data
- keep source/evidence and validation logic visible in Research Ops
- keep internal-only notes and confidential visibility separate from
  export-ready or future subscriber surfaces

## Definition Of Done For A Page Review

A page review is complete when the repository has:

- current implementation notes
- target MVP behavior
- exact data and presentation requirements
- explicit MVP vs future separation
- implementation tasks small enough to build
- verification checklist

Only then should design refinement become the main topic for that page.
