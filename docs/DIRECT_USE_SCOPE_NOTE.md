# Direct-Use Geothermal Scope Note

Date: 2026-05-16

Purpose: capture the decision that the future TGE platform must support geothermal direct-use projects and plants in addition to geothermal power projects and plants.

## Current Baseline

The current prototype and existing database work primarily cover geothermal power projects and power plants.

The future database and website should support a broader geothermal market-intelligence scope:

- geothermal power projects
- geothermal power plants
- geothermal direct-use projects
- geothermal direct-use operating facilities/plants
- companies active across power and direct-use geothermal markets

## Direct-Use Categories To Define

The semantic model must define how direct-use records are categorized. Initial candidate categories:

- district heating
- residential/commercial heating and cooling
- large-scale heat pumps using geothermal/ground-source resources
- industrial process heat
- agriculture and greenhouses
- aquaculture
- food drying or processing
- bathing, wellness, tourism, or balneology
- cooling applications
- hybrid heat and power applications
- other direct-use applications

These categories are working candidates, not final taxonomy.

## Key Design Question

The platform needs to decide whether `projects` and `plants` remain universal entities with a field such as `geothermal_use_type`, or whether power and direct-use assets require separate subtypes.

Recommended starting assumption:

- keep `projects` and `plants` as the shared top-level concepts
- add clear classification fields for power vs direct-use
- add subtype-specific fields only where the data genuinely differs

Candidate top-level fields:

- `geothermal_use_type`: `power`, `direct_use`, `hybrid`
- `direct_use_category`: district heating, industrial, agriculture, residential/commercial, heat pump, etc.
- `thermal_capacity_mwth`
- `electric_capacity_mwe`
- `annual_heat_supply_gwhth`
- `annual_power_generation_gwhe`
- `heat_offtaker_type`
- `temperature_range_c`

## Why This Matters

Direct-use assets differ from power assets in:

- capacity units: MWth vs MWe
- output metrics: heat supplied vs electricity generated
- customers/offtakers: district heating systems, industrial users, greenhouses, buildings, heat networks
- technology: wells, heat exchangers, heat pumps, distribution networks, cascaded use
- project lifecycle: direct-use projects may not map cleanly to power plant development phases
- company roles: utility, heat network operator, municipality, industrial host, greenhouse operator, heat pump supplier, drilling contractor

The future data model should avoid forcing direct-use projects into power-only fields.

## Immediate Work Required

Before implementing the future schema, create `docs/SEMANTIC_MODEL_V1.md` with direct-use included.

That document should answer:

- what is a direct-use project?
- what is a direct-use plant/facility?
- when does a direct-use project become operating?
- which direct-use categories are supported at MVP?
- which capacity and output units are required?
- which fields are shared with power projects/plants?
- which fields are direct-use-specific?
- how direct-use company roles differ from power company roles?

## MVP Guidance

For MVP, direct-use should be included in the semantic model and database design from the start, even if the first imported dataset remains power-heavy.

Do not postpone the direct-use classification model until after the PostgreSQL schema is built.
