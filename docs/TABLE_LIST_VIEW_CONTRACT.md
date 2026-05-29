# Table And List View Contract

This note defines how dense platform tables and list views should behave during
the design phase. Tables are core product surfaces, but they should not make the
platform feel like a spreadsheet rendered in a browser.

## Core Principle

Default list views should support fast intelligence scanning.

Deep research detail should remain available through expansion, detail pages,
saved views, column controls, or exports rather than being forced into every
default table.

## Three-Layer Model

### Layer 1: Overview Intelligence

Purpose: explain the page before rows appear.

Examples:

- project pipeline overview
- plant fleet snapshot
- company ecosystem summary
- source/evidence operations
- market intelligence snapshot
- analysis benchmark summary

Design behavior:

- compact
- high-signal
- MWe/MWth and count hierarchy clear
- not a wall of KPI cards

### Layer 2: Default Operational Table

Purpose: scan, compare, filter, and route into work.

Default rows should prioritize:

- identity
- geography
- primary status
- primary capacity/scale signal
- key relationship signal
- evidence/review state
- next action

Design behavior:

- dense but readable
- stable row height where possible
- clear hover state
- restrained badges
- long text clamped
- row actions visible but not dominant

### Layer 3: Deep Research Detail

Purpose: show everything needed for investigation, editing, approval, export, or
audit.

Use:

- record detail pages
- expandable rows
- drawers
- side panels
- saved layouts
- exports

Design behavior:

- do not overload default list views
- keep governance and audit detail available but secondary
- preserve evidence/source traceability

## Default Column Priorities

### Projects

Default table should prioritize:

- project name
- country / TGE region
- project phase
- planned / pipeline MWe
- geothermal use category
- key developer or company signal
- evidence/review state
- critical issue state
- last update or review action

Secondary or expandable:

- detailed source excerpts
- full relationship descriptions
- COD source text
- turbine supplier
- detailed notes
- audit fields

### Plants

Default table should prioritize:

- plant name
- country / TGE region
- operating status
- installed MWe
- current / operating MWe where available
- technology
- operator or owner signal
- commissioning year
- evidence/review state

Secondary or expandable:

- unit-level detail
- thermal output
- annual production
- COD source wording
- detailed company roles
- audit fields

### Companies

Default table should prioritize:

- company name
- headquarters / primary country
- primary business identity
- activity footprint
- developer/operator/owner/supplier role signals
- linked projects / plants count
- evidence/review state

Secondary or expandable:

- long ownership descriptions
- narrative relationship notes
- full portfolio details
- secondary business categories
- audit fields

### Sources

Default table should prioritize:

- source title
- source type
- review status
- visibility
- linked evidence count
- article match / fact candidate state
- updated date

Secondary or expandable:

- long source excerpts
- full metadata
- rejected reasoning
- article body text should not be stored or displayed from PostgreSQL

### Research Ops

Queue tables should prioritize:

- queue or issue identity
- severity / blocker status
- assignee
- linked entity
- evidence/source state
- age or updated date
- next action

Secondary or expandable:

- full notes
- long issue text
- complete audit history
- lower-priority queue diagnostics

### Analysis

Analysis tables should prioritize:

- ranking or segment label
- dominant measure such as MWe, MWth, units, count, or share
- compact visual bar
- attribution caveat where relevant
- QA warning count where relevant

Secondary or expandable:

- detailed attribution math
- raw relationship rows
- internal governance QA tables for subscriber-facing variants

## Density Modes

Design should define at least:

- default density for general use
- compact density for review queues and power users
- mobile card layout
- export/report layout

Avoid creating many bespoke density systems per page.

## Mobile Strategy

Tables should not simply shrink.

On mobile, list views should become cards or compact stacked rows with:

- name
- country / market
- primary status
- primary MWe/MWth/count signal
- critical issue state
- quick action

Secondary metadata should be hidden behind expansion.

## Badge And Status Strategy

Badges should:

- use the platform semantic color contract
- avoid too many saturated chips in one row
- prioritize human review state over confidence percentage when both appear
- distinguish lifecycle/status from evidence/review/governance

If many badges are needed, consolidate into:

- severity dot
- compact count
- expandable details

## Long Text Strategy

Default tables should clamp:

- relationship descriptions
- ownership notes
- evidence snippets
- long source titles
- comments and review notes

Use tooltip, drawer, expansion, or detail page for full text.

## Saved Views And Column Controls

Future design should support:

- saved personal views
- saved team views
- queue-specific layouts
- export current filtered view
- export selected rows
- column chooser for power users

These are design targets, not required before the first visual pass.

## Avoid

- showing every available column by default
- making governance chips visually louder than entity identity
- letting long text determine row rhythm
- treating mobile tables as squeezed desktop tables
- using table views as the only place to understand page context
- hiding source/evidence traceability entirely

## Related Contracts

- `docs/DESIGN_TOKEN_CONTRACT.md`
- `docs/STATUS_BADGE_HIERARCHY.md`
- `docs/FORM_FIELD_STATE_CONTRACT.md`
- `docs/DESIGN_PHASE_ENTRY_CHECKLIST.md`
