# Design Phase Entry Checklist

This checklist defines the minimum confirmation needed before the broad visual
design phase starts. It keeps the design process focused on product language,
visual hierarchy, responsive behavior, and component polish rather than
re-litigating core platform architecture.

## Readiness Target

Start the formal design phase when these areas are accepted as functionally
stable enough for visual design:

- route and navigation architecture
- role entry points and visibility rules
- semantic status and color meanings
- Projects, Plants, Companies, Sources, Research Ops, Markets, Analysis, Map,
  Dashboard, Readiness, and Admin page purpose
- evidence governance model
- analysis module governance model
- create/edit form workflow model
- PostgreSQL staging route strategy and future route-promotion path

The design phase can still change layout, typography, component density,
spacing, color values, chart styling, and responsive treatment.

## Must Be Confirmed Before Design

### Role Entry Points

- Subscriber starts from Dashboard or Markets.
- Researcher starts from Research Ops and entity work queues.
- Editor starts from Research Ops, validation, evidence review, and export
  readiness.
- Administrator starts from Command Center and Admin.
- Subscriber visibility excludes Research Ops, audit logs, reviewer notes,
  internal AI uncertainty, and platform admin controls.

### Product Navigation

- Current grouped top navigation remains acceptable for staging.
- Future design should target a left sidebar plus top utility bar.
- Mobile should use a drawer or compact navigation pattern.
- `web/lib/platform-navigation.ts` remains the source of truth for nav labels,
  role access, command search, and future sidebar rendering.
- Form field visual treatment should follow
  `docs/FORM_FIELD_STATE_CONTRACT.md`.

### Terminology

- Use Projects, Plants, Companies, Sources, Markets, Analysis, Map, Research Ops,
  Command Center, Dashboard.
- Use Plants as the product-facing term.
- Avoid making Assets or Facilities primary UI terms.
- Use MWe and MWth capitalization consistently.
- Use "projects", "plants", and "companies" instead of "records" in
  user-facing intelligence contexts.

### Semantic Color Meaning

- Lifecycle colors represent phase or operating state.
- Governance colors represent approval, review, blocker, evidence, confidence,
  and export state.
- AI/candidate styling remains secondary to human-confirmed data.
- Green, blue, amber, red, and gray meanings remain stable even if final hues
  change.

### Entity Workspaces

- Projects communicate pipeline intelligence first, table detail second.
- Plants communicate operating fleet intelligence first, table detail second.
- Companies communicate ecosystem and relationship intelligence first, table
  detail second.
- Table and list design should follow `docs/TABLE_LIST_VIEW_CONTRACT.md`.
- Source and relationship workflow remains tied to entity detail/edit pages.
- Edited, required, approval, rejected, and approved field states need final
  visual treatment during design.

### Evidence And Research Ops

- Sources remain the evidence backbone.
- Evidence and source design should follow
  `docs/EVIDENCE_GOVERNANCE_CONTRACT.md`.
- Article Matches remain entity-link review candidates.
- Article Facts remain extracted fact candidates.
- AI field suggestions remain human-confirmed before audited apply.
- Research Ops remains the operational command center for queues, assignments,
  evidence gaps, validation, and AI review work.

### Analysis Layer

- Analysis modules are governed through source basis, measures, segmentation,
  attribution rules, and QA warnings.
- New analysis modules should follow `docs/ANALYSIS_MODULE_CONTRACT.md`.
- Developer Analysis, Owners & Operators, and Turbine Technology are valid
  first analysis-module patterns.
- Future modules should be added through the analysis module registry before
  becoming live pages.
- Governance QA remains visible for internal validation and can be hidden or
  simplified for subscriber-facing views later.

### Map Layer

- Map is a spatial intelligence layer, not just a location preview.
- Standard and expanded map modes are part of the design target.
- Future filters should support geography, project/plant layer, use category,
  lifecycle/status, technology, resource type, and emerging technology overlays.
- Popup actions should prioritize Open Record, Open Market, and Research Queue
  paths where relevant.

## Design Review Page Set

Use this page set for first design review:

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

## Do Not Start Broad Visual Design If

- PostgreSQL staging cannot run locally.
- route targets are unclear or split between legacy and PostgreSQL pages without
  an explicit reason.
- status colors still have conflicting meanings.
- Projects, Plants, Companies, Sources, Research Ops, Markets, Analysis, Map,
  Dashboard, Readiness, or Admin have unclear page purpose.
- role visibility is unresolved.
- the design doctrine contradicts the implemented route/navigation contract.

## Allowed During Design

The design phase may:

- replace color values while preserving semantic meaning
- redesign the app shell
- introduce left sidebar navigation
- tune page spacing and density
- define table/card/mobile variants
- improve chart and bar visual language
- redesign map controls and popups
- define form states and field highlighting
- introduce icons and compact interaction patterns

The design phase should not:

- rewrite backend data logic without a functional reason
- change attribution rules without governance review
- remove evidence governance
- expose internal review or audit state to subscribers
- bypass human confirmation for AI-derived suggestions
