# Status Badge Hierarchy

This note records the current PostgreSQL preview badge semantics. The exact
visual palette can still be refined during the design phase, but the meaning of
each tone should remain stable across pages.

## Tone Meanings

- `success`: complete, approved, credible, ready, operating, or confirmed
- `attention`: needs review, in construction, stale, warning, or important
- `danger`: blocker, rejected, weak, cancelled, duplicate-risk, or critical
- `info`: active workflow, validation, exploration, feasibility, or open work
- `neutral`: classification, draft, unknown, early prospect, or non-blocking
- `muted`: archived, dismissed, superseded, inactive, or historical

## Core Domains

Review status:

- `draft` -> neutral
- `validation` -> info
- `approved` / `export_ready` -> success
- `needs_update` -> attention
- `archived` -> muted

Project lifecycle:

- `prospect_tbd` -> neutral
- `exploration`, `pre_feasibility`, `feasibility` -> info
- `construction` -> attention
- `operating` -> success
- `cancelled` -> danger

Source credibility:

- `credible` -> success
- `needs_review` -> attention
- `weak` -> danger
- `outdated` -> attention
- `rejected` -> danger

Source visibility:

- `public` -> success
- `internal_only` -> info
- `stakeholder_confirmation` / `ai_generated_needs_review` -> attention
- `client_confidential` / `not_for_publication` -> danger

Confidence / AI candidate review:

- `high` / `confirmed` / `suggested_high_confidence` -> success
- `verified` -> success
- `medium` / `suggested_medium_confidence` -> attention
- `reported` / `estimated` / `inferred` -> attention
- `low` / `suggested_low_confidence` -> danger
- `unknown` -> neutral

Issue severity:

- `critical`, `blocker`, `error` -> danger
- `important`, `warning` -> attention
- `workflow` -> info
- `useful` -> neutral

## Design Principle

Badges should communicate the operational message before they decorate the UI:
what is approved, what needs attention, what blocks work, and where a record is
in its development or review progression. Colors should stay restrained and
compatible with the TGE green accent rather than turning the interface into a
traffic-light dashboard.

## Current UI Support

The shared PostgreSQL badge legend is implemented in
`web/components/postgres-preview/PostgresStatusLegend.tsx`.

Current placement:

- full Research Ops legend on `/postgres-preview/research-ops`
- compact entity-list legend on PostgreSQL Projects, Plants / Facilities, and
  Companies list context strips
- compact source-governance legend on `/sources`

The legend is intentionally informational only. It does not change validation,
approval, export, or source-governance logic.
