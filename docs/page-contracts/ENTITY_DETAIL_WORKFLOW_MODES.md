# Entity Detail Workflow Modes

Date: 2026-05-22

Purpose: define how project, plant/facility, and company detail pages should
separate core editing from research, validation, evidence, AI, and operational
workflow tooling.

This is a product/UX contract, not a completed implementation. It should guide
the next coding slices before the PostgreSQL staging entity pages replace the
current SQLite-backed routes.

## Current Status

Current implemented foundation:

- PostgreSQL detail pages exist for projects, operating assets, and companies
- entity detail pages show workflow state, readiness, evidence, related TGE
  news/evidence, AI field suggestions, relationships, source evidence, Research
  Ops issues, changed fields, audit trail, and export readiness
- relationship rows support relationship-level evidence counts and a collapsed
  evidence-linking control
- entity edit forms already use collapsible sections

Current risk:

- the architecture is becoming powerful, but too much workflow state is visible
  at once
- researchers can lose the basic action path: edit fields, add evidence, link
  companies/assets/projects, save, submit for review
- validation, AI, export, audit, relationship governance, and Research Ops
  concepts can compete visually even when they are not the immediate job

## Core Principle

Entity pages should show the minimum needed for the current job, with the
operational layers available on demand.

Default page behavior should answer:

1. What is this record?
2. What is the next required action?
3. What core data can I edit or verify?
4. What evidence or relationship is missing?

Secondary layers should remain available but not dominate the first scan.

## Proposed Mode Model

The platform should eventually support a simple view-mode control on entity
detail pages.

Recommended MVP modes:

- Core
- Research
- Review
- Full

These are display modes, not permission roles. Permissions still determine what
actions the user can take.

## Mode Definitions

### Core

Primary user:

- researcher doing normal data entry or correction

Primary purpose:

- keep the page compact and action-oriented

Show by default:

- record header
- key metrics
- next required action
- core data sections
- source/evidence summary
- relationships summary
- edit/save entry points

Collapsed by default:

- AI suggestions
- full Research Ops issue list
- detailed export readiness
- audit/activity trail
- relationship governance details
- source matching/fact candidate machinery

### Research

Primary user:

- researcher filling missing data or adding evidence

Primary purpose:

- expose the data-filling workflow without showing full governance machinery

Show by default:

- Core mode sections
- evidence/source workflow
- related TGE news/evidence
- source evidence table
- relationship add/link controls
- Research Ops issues directly attached to the record

Collapsed by default:

- export readiness details
- full audit trail
- AI apply workflow
- relationship governance details

### Review

Primary user:

- editor or senior editor validating records

Primary purpose:

- make approval/export blockers and evidence quality obvious

Show by default:

- record header
- readiness / blockers
- validation workflow
- source/evidence status
- relationship evidence status
- changed fields pending review
- export readiness summary

Collapsed by default:

- long field detail sections not relevant to blockers
- AI suggestion queues unless open suggestions exist
- full audit trail

### Full

Primary user:

- admin, editor, power user, implementation review

Primary purpose:

- expose all operational layers for audit, debugging, and detailed workflow

Show:

- all sections
- all workflow panels
- all evidence and relationship machinery
- AI suggestion sections
- Research Ops issues
- export readiness
- audit/activity history

## Section Visibility Matrix

| Section | Core | Research | Review | Full |
|---|---:|---:|---:|---:|
| Header / identity | Show | Show | Show | Show |
| Key metrics | Show | Show | Show | Show |
| Next required action | Show | Show | Show | Show |
| Core record fields | Show | Show | Partial | Show |
| Evidence backbone summary | Show | Show | Show | Show |
| Source evidence table | Collapse | Show | Show | Show |
| Related TGE news/evidence | Collapse | Show | Collapse | Show |
| Company/project/asset relationships | Show | Show | Show | Show |
| Relationship evidence controls | Collapse | Collapse, expandable | Collapse, expandable | Show |
| Relationship governance help | Collapse | Collapse | Collapse | Show |
| AI field suggestions | Hide unless open | Collapse | Show if open | Show |
| Research Ops issues | Summary | Show | Show blockers | Show |
| Changed fields pending review | Collapse | Collapse | Show | Show |
| Export readiness | Summary | Collapse | Show | Show |
| Activity / audit trail | Hide | Collapse | Collapse | Show |
| Notes | Show | Show | Show | Show |

## Next Required Action Pattern

Each entity detail page should eventually include a compact next-action strip
near the top.

Example actions:

- Add source evidence
- Add company role
- Add coordinates
- Review changed fields
- Resolve export blocker
- Submit for validation
- Approve record
- Mark export ready

Rules:

- show one primary next action, not ten equally weighted warnings
- show secondary actions as small links or collapsed details
- action calculation should respect role and workflow state
- actions should link to the relevant page section

## Relationship Workflow Rules

Current direction is correct:

- relationship rows show evidence counts
- row-level evidence linking is available but collapsed
- governance guidance is collapsed behind `Details`

Keep this pattern.

Do not add more visible relationship controls until:

- existing controls have been reviewed on real records
- a row-level evidence detail/undo workflow is designed
- the broader entity mode pattern is implemented

## AI And Evidence Visibility Rules

AI and evidence workflows should remain visible enough to build trust, but not
so visible that they crowd normal editing.

MVP display rules:

- AI suggestions should not dominate Core mode
- AI suggestions with open/confirmed/apply-ready status should surface in
  Review mode
- source/evidence summaries should appear in all modes
- detailed source matching and fact candidate review should remain primarily in
  Sources and Research Ops until the entity page needs it

## Recommended Implementation Slices

Build in this order:

1. Add a small mode/view-state contract to entity pages without changing data
   behavior.
2. Add a top-of-page next required action strip for PostgreSQL project,
   operating asset, and company detail pages.
3. Collapse low-priority operational sections by default on entity detail pages.
4. Keep relationship evidence controls collapsed by default.
5. Add visible active-mode state to the page header.
6. Later, allow user-specific default mode preferences.

## MVP vs Future

MVP:

- progressive disclosure by section
- one visible next action summary
- relationship evidence controls collapsed by default
- AI and export sections less visually dominant unless relevant
- no user-specific saved mode preference yet

Future:

- persistent user default modes
- role-aware default modes
- keyboard command palette for mode switching
- saved section states
- side-panel review workflow
- mobile-specific simplified mode
- AI-generated next-action recommendations

## Open Decisions

- Should researchers default to Core or Research mode?
- Should editors default to Review or Full mode?
- Should admins see Full mode by default, or a cleaner Review mode?
- Should mode state be stored per user, per browser, or not stored in MVP?
- Should mobile always use a simplified Core/Research blend?

## Current Recommendation

Default modes:

- researcher: Research
- editor / senior editor: Review
- admin: Full, with ability to switch to Review

For the immediate next coding pass, do not build user preferences yet. Start
with page-level progressive disclosure and a clear next required action strip.
