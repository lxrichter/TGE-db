# Map Spatial Intelligence Contract

This note defines how the Map should behave as a spatial intelligence layer
during design and future implementation.

## Core Principle

The Map is not decorative and not only a coordinate viewer.

It should become a geothermal spatial intelligence layer that connects:

- coordinate-confirmed projects and plants
- market and regional context
- technology and use-category filters
- Research Ops coordinate cleanup
- entity detail pages
- future subscriber-facing spatial exploration

## Current Scope

Current implementation:

- displays coordinate-confirmed Projects and Plants
- supports layer toggles for Projects and Plants
- supports market/country and TGE region filtering
- supports terrain and satellite basemap modes
- links marker popups to PostgreSQL entity detail pages
- routes missing-coordinate work to Research Ops
- includes standard and expanded map modes

This current scope is enough for staging. Design should refine the experience
without requiring all future filters to be implemented immediately.

## Target Modes

### Standard Mode

Purpose: map embedded inside the broader platform page.

Design behavior:

- map remains visible quickly
- filter panel is compact
- page context, readiness, and workflow links remain visible
- suitable for researchers and editors

### Expanded Map Mode

Purpose: immersive spatial analysis.

Design behavior:

- map footprint dominates the viewport
- filters can collapse into a side drawer
- popups are readable but compact
- map interaction feels primary
- suitable for analysts, subscribers, and spatial exploration

### Mobile Mode

Purpose: quick location review and drilldown.

Design behavior:

- filters become drawer or bottom sheet
- popups become bottom sheet or compact card
- primary actions remain reachable
- map should not be covered permanently by controls

## Core Filters

Current / near-term filters:

- Projects
- Plants
- Country / Market
- TGE Region
- WB Region where needed
- Basemap

Design should make TGE Region the primary geothermal market taxonomy. WB Region
should remain secondary and analytical, not visually equal by default.

## Future Advanced Filters

Future filter architecture should support:

- Power plants
- Heat plants
- Power projects
- Heat projects
- Lifecycle / project phase
- Plant operating status
- Geothermal use category
- Technology type
- Turbine technology
- Resource type
- Hydrothermal
- EGS
- AGS
- Closed-loop
- Superhot
- Lithium / minerals
- Capacity ranges
- Ownership / operator overlays
- Recent activity overlays

Do not expose all advanced filters before the underlying data quality and
taxonomy are ready.

## Marker Taxonomy

Current marker distinction:

- Plants
- Projects

Future marker taxonomy should allow:

- power vs heat
- operating vs pipeline
- selected lifecycle phase
- emerging technology overlays
- clustered dense regions

Marker colors must not conflict with lifecycle/status meanings unless the map
legend explicitly explains the visual language.

## Popup Priority

Popup content should prioritize:

1. record name
2. entity type: Project or Plant
3. country / market
4. primary status or phase
5. MWe / MWth signal
6. open record action

Future popup actions may include:

- Open Record
- Open Market
- Open Research Queue

Avoid overloaded popups with long metadata, audit text, source excerpts, or
relationship detail.

## Research Ops Integration

The Map should make coordinate governance visible without turning into a queue
page.

It should route to:

- missing coordinate queues
- project coordinate cleanup
- plant coordinate cleanup
- country / region filtered worklists

Records without usable coordinates do not appear on the map and should remain
visible in Research Ops.

## Market Integration

Map should connect to Markets and Analysis:

- map filters should preserve geography context where possible
- country or TGE region selections should route to market context
- market pages should route back to filtered map views
- future country/region pages should include map drilldowns

## Subscriber Visibility

Subscriber-facing map views may show:

- approved projects and plants
- curated market filters
- approved capacity and status
- clean marker popups
- regional and country drilldowns

Subscriber-facing map views should not show:

- internal missing-coordinate queues
- unapproved source/evidence warnings
- audit notes
- internal AI/candidate uncertainty
- staging route names

## Design Requirements

The design phase should define:

- standard map layout
- expanded map layout
- mobile filter drawer / bottom sheet
- marker taxonomy
- marker legend
- popup hierarchy
- map control styling
- basemap styling direction
- cluster behavior direction
- filter grouping and progressive disclosure

## Avoid

- letting the filter panel dominate the map
- treating the map as a decorative widget
- exposing every future filter before taxonomy is ready
- making popups feel like mini detail pages
- mixing Research Ops queue detail into subscriber map views
- using marker colors without semantic explanation

## Related Contracts

- `docs/APP_SHELL_NAVIGATION_CONTRACT.md`
- `docs/DESIGN_PHASE_ENTRY_CHECKLIST.md`
- `docs/DESIGN_TOKEN_CONTRACT.md`
- `docs/TABLE_LIST_VIEW_CONTRACT.md`
- `docs/ROUTE_IA_CONTRACT.md`
