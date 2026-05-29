# App Shell Navigation Contract

This note defines the target navigation shell for the formal design phase. It
does not require replacing the current grouped top navigation immediately. The
current header remains acceptable for staging, but the design direction should
move toward a role-aware left navigation shell.

## Current Staging State

The platform currently uses a grouped top navigation driven by:

- `web/lib/platform-navigation.ts`
- `web/components/ui/app-header.tsx`

This is the correct temporary state while PostgreSQL staging routes remain
visible and the replacement workflow is still being validated.

## Target Design Direction

The formal platform shell should use:

- left vertical sidebar for primary product navigation
- top bar for utility actions and context
- mobile drawer or compact nav for smaller screens
- role-aware visibility and default emphasis

The top bar should not become the primary product navigation once the formal
design system is implemented.

## Sidebar Groups

Use the existing navigation registry as the source of truth, but render it as
sidebar groups during the design phase.

### Intelligence / Research

Primary audience: subscribers, analysts, editors, researchers.

- Dashboard
- Markets
- Analysis
- Map
- Projects
- Plants
- Companies

Design intent: market intelligence, entity discovery, spatial analysis, and
core geothermal research workflows.

### Research Operations

Primary audience: researchers, editors, administrators.

- Research Ops
- Sources
- Article Matches
- Fact Review
- Field Suggestions
- Add Project
- Add Plant
- Add Company
- Add Source

Design intent: evidence governance, assigned work, AI-assisted review, source
linking, validation, and editorial control.

### Platform / Admin

Primary audience: editors and administrators.

- Command Center
- Replacement Readiness
- Admin
- Users
- Vocabularies
- Design Readiness

Design intent: platform governance, access control, taxonomy management,
cutover readiness, and operational oversight.

## Role Defaults

Subscriber:

- default entry: Dashboard or Markets
- first emphasis: Dashboard, Markets, Analysis, Map
- hidden: Research Ops, audit logs, reviewer notes, internal AI uncertainty,
  admin controls

Researcher:

- default entry: Research Ops
- first emphasis: assigned queues, Projects, Plants, Companies, Sources
- hidden: platform administration unless explicitly permitted

Editor:

- default entry: Research Ops or Command Center
- first emphasis: validation, approval, export readiness, source governance,
  article matches, fact review
- hidden: user and vocabulary administration unless also administrator

Administrator:

- default entry: Command Center
- first emphasis: Command Center, Readiness, Admin, Users, Vocabularies,
  Research Ops
- hidden: none by default

## Top Bar Utility Layer

The top bar should contain utility and context actions, not primary navigation.

Recommended top-bar scope:

- global search / command palette
- current workspace or route context
- saved views
- notifications or attention count
- export action when contextually valid
- user identity, role, and logout

Do not duplicate every sidebar route in the top bar.

## Mobile Behavior

On tablet and mobile:

- sidebar becomes a drawer or compact navigation panel
- global search remains available
- role-specific primary actions remain reachable in one tap
- dense operational pages use section navigation, accordions, or drawers
- map filters become a collapsible drawer or bottom sheet

Mobile should prioritize the next action over full information density.

## Implementation Guardrails

- Keep `platformNavigationGroups` as the registry for route labels, notes,
  access rules, and audience intent.
- Do not hardcode a second navigation tree during design implementation.
- Preserve `activeHrefs` aliases until PostgreSQL staging routes are promoted.
- Keep clean routes visually product-facing and `/postgres-preview` visually
  internal/transitional.
- Do not expose Research Ops, Admin, audit, or reviewer uncertainty to
  subscribers.

## Future Cutover

When PostgreSQL becomes the replacement system, the sidebar should remain stable
while route targets can be promoted underneath:

- `/postgres-preview/projects` to `/projects`
- `/postgres-preview/operating-assets` to `/plants`
- `/postgres-preview/companies` to `/companies`
- `/postgres-preview/research-ops` to `/research-ops`
- `/postgres-preview/map` to direct `/map`

The visual shell should not need a major rewrite for this route promotion.
