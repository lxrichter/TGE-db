# Intelligence Layer Contract

This note defines the purpose and separation of Dashboard, Markets, Analysis,
and Map before the formal visual design phase.

## Core Principle

The intelligence layer should feel like a curated geothermal market intelligence
product, not a set of administrative summaries.

Dashboard, Markets, Analysis, and Map must work together but should not become
visually or functionally interchangeable.

## Layer Roles

### Dashboard

Purpose: executive intelligence front door.

Primary questions:

- What is the global geothermal picture?
- What changed or needs attention?
- Where should a subscriber or executive drill down next?

Design behavior:

- strongest executive overview
- high-level KPIs and market pulse
- concise, not queue-heavy
- operational governance visible only as compact pulse signals
- clear drilldowns into Markets, Analysis, Map, and selected operational layers

Avoid:

- turning Dashboard into Research Ops
- showing every blocker or internal governance table
- overloading with too many equal-weight widgets

### Markets

Purpose: country and regional market intelligence layer.

Primary questions:

- Which countries and TGE regions matter most?
- Where is operating capacity concentrated?
- Where is pipeline growth concentrated?
- Where are source gaps or market coverage weaknesses?

Design behavior:

- TGE regions are the primary taxonomy
- World Bank regions are secondary/alternative taxonomy
- country and region rankings should dominate over workflow buckets
- charts and ranked tables should support market comparison
- each region/country should be drilldown-ready

Avoid:

- making Markets feel like a Research Ops queue
- giving TGE and World Bank regions equal visual hierarchy by default
- fragmenting the page into too many similar cards

### Analysis

Purpose: governed analytical modules and benchmark views.

Primary questions:

- What does structured data reveal when aggregated with explicit logic?
- What is the source basis, measure, attribution rule, and QA status?
- Which outputs are subscriber candidates versus internal validation modules?

Design behavior:

- cleaner and more analytical than operational pages
- module registry remains visible
- charts, bars, and tables should emphasize measures such as MWe, MWth, units,
  count, and share
- internal Governance QA is visible for internal users
- subscriber-facing variants should suppress internal QA detail while preserving
  confidence language

Avoid:

- treating analysis tables as raw database exports
- hiding attribution caveats internally
- mixing roles or measures without explicit methodology

### Map

Purpose: spatial intelligence and geographic exploration.

Primary questions:

- Where are geothermal projects and plants located?
- How do spatial patterns relate to markets, regions, technology, and status?
- Which records are missing coordinate quality?

Design behavior:

- map should visually dominate in expanded mode
- filters should scale through grouping and progressive disclosure
- popups should be compact and action-oriented
- Research Ops coordinate work remains connected but secondary
- map should route into Markets and entity detail pages

Avoid:

- making the map a decorative widget
- letting filters permanently dominate map area
- exposing internal coordinate queues to subscribers

## Cross-Layer Navigation

Recommended primary paths:

- Dashboard -> Markets for country/region drilldown
- Dashboard -> Analysis for benchmark modules
- Dashboard -> Map for spatial exploration
- Markets -> Map for filtered geography
- Markets -> Analysis for market comparison
- Analysis -> Markets for country/region context
- Map -> Markets for selected geography
- Map -> entity detail for selected markers

Design should make these paths obvious without repeating every CTA everywhere.

## Subscriber vs Internal

Subscriber-facing intelligence:

- curated KPIs
- approved market summaries
- approved entity data
- approved source references where useful
- clean maps and benchmark views

Internal intelligence:

- source gaps
- QA warnings
- attribution fallback warnings
- validation queues
- Research Ops links
- readiness and export blockers

The same page family can support both audiences, but the visual design must
separate subscriber-safe presentation from internal governance detail.

## Visual Hierarchy Requirements

The design phase should define:

- executive KPI hierarchy
- market ranking and chart style
- analysis module card and benchmark style
- map standard/expanded mode treatment
- confidence and QA language for internal versus external views
- cross-page drilldown CTA hierarchy

## Avoid

- making all intelligence pages share identical card grids
- letting governance overwhelm executive pages
- hiding source/QA meaning from internal analytical pages
- making Markets subordinate to Countries as a technical data grouping
- making Analysis the dumping ground for every chart idea

## Related Contracts

- `docs/ANALYSIS_MODULE_CONTRACT.md`
- `docs/MAP_SPATIAL_INTELLIGENCE_CONTRACT.md`
- `docs/TABLE_LIST_VIEW_CONTRACT.md`
- `docs/DESIGN_PHASE_ENTRY_CHECKLIST.md`
- `docs/APP_SHELL_NAVIGATION_CONTRACT.md`
