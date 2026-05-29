# Design Handoff Index

This is the recommended entry point for the visual design phase of the
ThinkGeoEnergy Intelligence Platform.

Use this index before changing page visuals broadly. The contracts below define
what should remain stable while the design phase refines layout, typography,
spacing, color values, responsive behavior, icons, chart language, map controls,
and component polish.

## Recommended Reading Order

### 1. Start Here

- `docs/DESIGN_PHASE_ENTRY_CHECKLIST.md`
- `docs/PLATFORM_VISION.md`
- `docs/ROLE_VISIBILITY_CONTRACT.md`

Purpose: confirm why the platform exists, who it serves, and whether the app is
ready to enter broad visual design.

### 2. Product Shell And Navigation

- `docs/APP_SHELL_NAVIGATION_CONTRACT.md`
- `docs/ROUTE_IA_CONTRACT.md`

Purpose: define the future left-sidebar shell, top utility bar, mobile drawer,
clean routes, PostgreSQL staging routes, and future route-promotion path.

### 3. Visual Semantics

- `docs/DESIGN_TOKEN_CONTRACT.md`
- `docs/STATUS_BADGE_HIERARCHY.md`
- `docs/FORM_FIELD_STATE_CONTRACT.md`

Purpose: keep color, status, field state, review state, and approval meaning
consistent while final design values change.

### 4. Core Product Layers

- `docs/INTELLIGENCE_LAYER_CONTRACT.md`
- `docs/TABLE_LIST_VIEW_CONTRACT.md`
- `docs/EVIDENCE_GOVERNANCE_CONTRACT.md`
- `docs/MAP_SPATIAL_INTELLIGENCE_CONTRACT.md`
- `docs/ANALYSIS_MODULE_CONTRACT.md`

Purpose: define how intelligence pages, tables, evidence workflows, map
exploration, and analysis modules should behave.

### 5. Supporting Implementation Context

- `docs/ROLE_MODEL.md`
- `docs/AI_ASSISTED_DATA_FILLING_WORKFLOW.md`
- `docs/LOCAL_ARTICLE_FACT_EXTRACTION_PROTOTYPE.md`
- `docs/HETZNER_DEPLOYMENT_PREP.md`
- `docs/DATA_AND_SECURITY.md`

Purpose: understand role implementation, AI workflow governance, article
extraction, deployment direction, and security boundaries.

## First Design Target

Recommended first design pass:

1. App shell
2. Dashboard
3. Markets
4. Analysis
5. Map

Reason: these pages define the subscriber-facing and executive intelligence
language. Once they feel right, their visual system can be carried into entity
workspaces, Sources, Research Ops, Admin, and forms.

Initial non-production concept route:

- `/design/pass-1`

Use this route to review App Shell, Dashboard, Markets, Analysis, Map Explorer,
palette, chart language, lifecycle/governance colors, typography, component
direction, and mobile behavior before changing live product pages.

## Second Design Target

Recommended second pass:

1. Projects list/detail/edit
2. Plants list/detail/edit
3. Companies list/detail/edit
4. Sources and source detail
5. Research Ops

Reason: these pages are denser and more operational. They should inherit the
platform language from the first pass, then refine table density, progressive
disclosure, form states, relationship cards, and review queues.

## Third Design Target

Recommended third pass:

1. Article Match Review
2. Article Fact Review
3. AI Field Suggestion Review
4. Admin
5. Replacement Readiness

Reason: these pages depend heavily on governance hierarchy and should not
overpower the broader product identity.

## Design Review Page Set

Use this page set for the first visual review:

- `/design/pass-1`
- `/`
- `/markets`
- `/analysis`
- `/analysis/developers`
- `/analysis/owners-operators`
- `/analysis/turbine-technology`
- `/map`
- `/postgres-preview/projects`
- `/postgres-preview/operating-assets`
- `/postgres-preview/companies`
- `/postgres-preview/research-ops`
- `/sources`
- `/sources/matches`
- `/sources/facts`
- `/postgres-preview/readiness`
- `/admin`

Use representative detail/edit pages for:

- one project
- one plant
- one company
- one source

## What Design May Change

The design phase may change:

- shell layout
- typography
- spacing
- density
- final color values
- chart style
- table/card/mobile variants
- map controls and marker treatment
- icons
- page rhythm
- responsive behavior
- component proportions

## What Design Should Preserve

The design phase should preserve:

- evidence governance
- human confirmation for AI-derived data
- role visibility boundaries
- canonical terminology
- semantic status meanings
- route promotion strategy
- analysis module methodology
- source/evidence separation from entity values
- Research Ops as internal command center
- Dashboard / Markets / Analysis / Map separation

## Current Readiness

Functional and information-architecture readiness is effectively complete for
starting the design phase.

Remaining pre-design work is human acceptance:

- confirm the design doctrine
- confirm this handoff index
- choose the first design target
- decide whether the app shell redesign starts immediately or after one final
  visual review of the current staging pages
