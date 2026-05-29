# Route IA Contract

This note defines the current platform route contract before the formal design
phase. It separates clean user-facing entry points from PostgreSQL staging routes
that are still intentionally visible during the replacement process.

Related design contracts:

- `docs/APP_SHELL_NAVIGATION_CONTRACT.md`
- `docs/DESIGN_TOKEN_CONTRACT.md`
- `docs/DESIGN_PHASE_ENTRY_CHECKLIST.md`
- `docs/STATUS_BADGE_HIERARCHY.md`

## Current Principle

Use clean routes where the page is already acting as the durable platform entry
point. Keep `/postgres-preview/...` where the page is still the active
PostgreSQL staging surface, especially for entity editing, Research Ops,
readiness, and filtered operational worklists.

Do not promote legacy short entity routes until the PostgreSQL-backed entity
workspaces are ready to replace them fully.

## Canonical Entry Points Now

These routes are the preferred top-level navigation destinations:

- `/` - executive geothermal intelligence dashboard
- `/markets` - market intelligence parent layer
- `/markets/countries` - country market drilldowns
- `/markets/regions` - TGE regional market drilldowns
- `/analysis` - analysis workspace and module registry
- `/analysis/countries` - country market analysis
- `/analysis/turbine-technology` - turbine technology analysis
- `/analysis/owners-operators` - owners and operators analysis
- `/analysis/developers` - developer analysis
- `/map` - canonical map entry point, currently redirecting to the richer
  PostgreSQL map implementation
- `/sources` - evidence backbone
- `/sources/matches` - article match review
- `/sources/facts` - article fact review
- `/admin` - platform administration workspace
- `/admin/users` - user administration
- `/admin/vocabularies` - controlled vocabulary administration

## PostgreSQL Staging Routes Still Canonical For Operations

These remain the correct operational routes until the full database replacement
decision is made:

- `/postgres-preview` - command center / operational navigation
- `/postgres-preview/projects` - PostgreSQL project worklist
- `/postgres-preview/projects/[id]` - PostgreSQL project detail
- `/postgres-preview/projects/[id]/edit` - PostgreSQL project edit workflow
- `/postgres-preview/operating-assets` - PostgreSQL plant worklist
- `/postgres-preview/operating-assets/[id]` - PostgreSQL plant detail
- `/postgres-preview/operating-assets/[id]/edit` - PostgreSQL plant edit workflow
- `/postgres-preview/companies` - PostgreSQL company worklist
- `/postgres-preview/companies/[id]` - PostgreSQL company detail
- `/postgres-preview/companies/[id]/edit` - PostgreSQL company edit workflow
- `/postgres-preview/research-ops` - Research Ops command center
- `/postgres-preview/readiness` - replacement readiness and cutover governance
- `/postgres-preview/pilot` - manual pilot acceptance workflow

## Legacy Short Entity Routes

These routes still exist, but should not be treated as the main future IA until
the PostgreSQL replacement is complete:

- `/projects`
- `/projects/[id]`
- `/plants`
- `/plants/[id]`
- `/companies`
- `/companies/[id]`
- `/research-ops`

They should not become the primary global navigation target yet because they are
still tied to older API/data assumptions and can use legacy IDs that differ from
PostgreSQL UUID-backed records.

## Query-Preserving Exceptions

Some links should keep pointing directly to `/postgres-preview/...` even when a
clean parent route exists, because they carry filter/query context into the
active staging page:

- filtered market ranking links
- filtered map links with country, TGE region, or WB region parameters
- entity worklist links from Research Ops queues
- cutover/readiness links

## Future Cutover Direction

When the PostgreSQL platform becomes the replacement system, the likely route
promotion path is:

- `/postgres-preview/projects` -> `/projects`
- `/postgres-preview/operating-assets` -> `/plants`
- `/postgres-preview/companies` -> `/companies`
- `/postgres-preview/research-ops` -> `/research-ops`
- `/postgres-preview/map` -> direct `/map` implementation, not redirect

This should happen only after:

- fresh live database import has been rehearsed
- PostgreSQL entity worklists and detail/edit pages are accepted
- legacy ID vs PostgreSQL UUID behavior is resolved
- role permissions are confirmed
- internal pilot users have validated the workflows
- rollback path is clear

## Design Phase Implication

Design should treat the short clean routes as the eventual public product IA,
while preserving the internal PostgreSQL staging routes for operational buildout
and migration governance. Visual design should not make `/postgres-preview`
feel like a permanent public product namespace.
