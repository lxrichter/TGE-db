# Design Token Contract

This note defines how the platform should connect the formal ThinkGeoEnergy
design doctrine to the current Next.js implementation.

The current token values are staging values. They are intentionally conservative
placeholders and can be replaced during the design phase, but the semantic
meaning of each token family should remain stable.

## Source Of Truth

Implementation tokens:

- `web/app/globals.css`

Admin/design readiness registries:

- `web/lib/design-tokens.ts`
- `web/lib/design-readiness.ts`

Related semantics:

- `docs/STATUS_BADGE_HIERARCHY.md`
- `docs/ANALYSIS_MODULE_CONTRACT.md`
- `docs/APP_SHELL_NAVIGATION_CONTRACT.md`
- `docs/ROUTE_IA_CONTRACT.md`
- `docs/DESIGN_PHASE_ENTRY_CHECKLIST.md`
- `docs/EVIDENCE_GOVERNANCE_CONTRACT.md`
- `docs/FORM_FIELD_STATE_CONTRACT.md`
- `docs/TABLE_LIST_VIEW_CONTRACT.md`

Audit guardrail:

```bash
npm run design:audit-tokens
```

The audit flags unexpected hard-coded visual colors in application files. Token
definitions and explicit fallback values are allowed.

## Token Families

Brand and shell:

- `--tge-brand-green`
- `--tge-brand-green-dark`
- `--tge-brand-dark`
- `--tge-brand-muted`
- `--tge-header-*`

Use these for the platform shell, primary navigation, core TGE identity, and
primary action accents.

Surfaces and text:

- `--tge-surface-page`
- `--tge-surface-card`
- `--tge-surface-subtle`
- `--tge-text-primary`
- `--tge-text-secondary`

Use these for page backgrounds, cards, operational panels, table surfaces, and
standard text hierarchy.

Lifecycle:

- `--tge-lifecycle-prospect-*`
- `--tge-lifecycle-exploration-*`
- `--tge-lifecycle-pre-feasibility-*`
- `--tge-lifecycle-feasibility-*`
- `--tge-lifecycle-construction-*`
- `--tge-lifecycle-operating-*`
- `--tge-lifecycle-pilot-*`
- `--tge-lifecycle-retired-*`
- `--tge-lifecycle-cancelled-*`

Use lifecycle colors only for development phase or plant operating-state meaning.
They should not imply evidence quality or approval quality.

Governance and review:

- `--tge-governance-success-*`
- `--tge-governance-info-*`
- `--tge-governance-attention-*`
- `--tge-governance-danger-*`
- `--tge-governance-neutral-*`
- `--tge-governance-muted-*`

Use these for review state, approval state, blockers, warning states, export
readiness, source credibility, and workflow status.

AI and candidate review:

- `--tge-ai-suggested-*`

Use these only for AI-proposed or candidate content pending human review. AI
candidate styling should stay secondary to human-confirmed evidence and approved
database values.

Status bars and compact charts:

- `--tge-status-bar-*`
- `--tge-chart-technology-*`

Use these for compact benchmark bars, phase shares, technology distributions, and
table-integrated chart cues.

Map:

- `--tge-map-marker-plant`
- `--tge-map-marker-project`
- `--tge-map-marker-stroke`

Use these for current map marker defaults. The formal map basemap, marker
taxonomy, clustering, and expanded-map styling can be refined later without
changing the core page architecture.

## Stable Semantic Meanings

Keep these meanings consistent across the platform:

- Green: approved, complete, operating, credible, high confidence, export-ready.
- Blue: active workflow, validation, process state, structured work in progress.
- Amber: needs review, incomplete, fallback logic, weak evidence, warning.
- Red: rejected, blocker, restricted, cancelled, not output-safe.
- Gray: draft, archived, inactive, historical, advisory, unknown, neutral.

These meanings matter more than the exact color values. The design phase can
change hue, saturation, contrast, and proportion, but should not invert the
operational meaning.

## Design Phase Handoff Checklist

Before final visual design starts, confirm:

- Final brand shell palette for header, navigation, and primary actions.
- Final app shell treatment for left sidebar, top utility bar, and mobile drawer.
- Lifecycle palette for project phases and plant operating states.
- Governance palette for approval, review, source credibility, blockers, and AI.
- Chart palette for turbine technology, owner/operator, developer, market, and
  country benchmark analysis pages.
- Map marker taxonomy for Projects, Plants, heat/direct-use, emerging
  technologies, and future clustered views.
- Form field states for required, edited, pending approval, approved, rejected,
  and blocked values.
- Table density modes for default, compact, mobile card, and review queue views.
- Role-specific visibility for Subscribers, Researchers, Editors, and
  Administrators.

## Implementation Rule

New visual styling should use semantic CSS variables or shared helper mappings.
Avoid adding new literal color values directly inside page components unless the
value is a token definition, an intentional fallback, or a third-party library
requirement.
