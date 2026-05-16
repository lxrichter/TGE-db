# Semantic Model v1

Date: 2026-05-16

Purpose: define the core meaning, categories, lifecycle logic, capacity units, company roles, and verification states for the future TGE geothermal intelligence platform.

This document is the basis for the future PostgreSQL schema, data-entry forms, filters, maps, charts, exports, and validation workflows.

## 1. Core Principle

Projects and operating assets remain shared top-level concepts.

Power, direct-use, mineral extraction, and hybrid use cases are classifications on those entities, not separate databases.

The platform should support separate overview pages, table views, charting, filters, and exports for power and direct-use geothermal, while preserving one coherent underlying data model.

## 2. Core Entities

Core MVP entities:

- `project`
- `operating_asset`
- `company`
- `company_project_link`
- `company_operating_asset_link`
- `company_relationship`
- `user`
- `review_record` or `audit_event`

Current prototype naming uses `plants`. Future UI labels should adapt by asset type:

- power generation: Plant
- direct-use: Facility
- hybrid: Plant, Facility, or Complex depending on dominant use case

Recommended future database concept:

```text
operating_asset
```

The UI can still show "Plant" for power assets and "Facility" for direct-use assets.

## 3. Geothermal Use Types

Top-level use types:

```text
power
direct_use
mineral_extraction
hybrid
unknown
```

Recommended modeling approach:

- every project/operating asset has a `primary_use_type`
- assets may also have multiple `use_components`
- `hybrid` should be used when multiple use components are material to the asset

Examples:

- a power plant with material district heat offtake: `primary_use_type = hybrid`
- a lithium extraction project using geothermal brine: `primary_use_type = mineral_extraction`
- a geothermal power project with potential future heat use but no active heat offtake: `primary_use_type = power`, with notes or future-use flag

## 4. Direct-Use Categories

Direct-use categories describe the main end-use/application, not the technical configuration.

MVP direct-use categories:

```text
district_heating
district_cooling
building_heating_cooling
industrial_process_heat
agriculture_greenhouses
aquaculture
food_drying_processing
bathing_wellness_tourism
cooling_refrigeration
hybrid_heat_power
other_direct_use
```

Later direct-use categories:

```text
snow_melting_infrastructure
thermal_storage_linked_geothermal_use
```

Scope rule:

- include district-scale, municipal-scale, commercial-scale, institutional-scale, industrial-scale, utility-scale, and strategically relevant geothermal direct-use systems
- exclude small single-home residential GSHP systems unless part of a larger portfolio, district-scale concept, or strategically relevant market dataset

## 5. Technology And System Tags

Technology/system tags describe how the asset works. They should be separate from direct-use application categories.

Recommended tags:

```text
direct_hydrothermal_use
heat_pump_assisted
large_scale_heat_pump
ground_source_heat_pump_gshp
aquifer_thermal_energy_storage_ates
borehole_thermal_energy_storage_btes
closed_loop_geothermal
egs_ags
cascaded_use
waste_heat_integration
seawater_or_water_source_integration
hybrid_renewable_integration
```

Why separate tags matter:

- district heating is an application
- heat pump assisted is a technical configuration
- ATES/BTES are storage/system configurations
- cascaded use is a system design pattern

This prevents the database from mixing "what the asset is used for" with "how the asset technically works."

## 6. Capacity And Output Metrics

Power metrics:

```text
electric_capacity_mwe
annual_power_generation_gwhe
```

Direct-use thermal metrics:

```text
thermal_capacity_mwth
annual_heat_supply_gwhth
annual_cooling_supply_gwhc
```

Additional supported metrics:

```text
installed_heat_pump_capacity_mwth
geothermal_resource_capacity_mwth
capacity_estimate_status
output_estimate_status
```

Metric rules:

- MWth/GWhth are first-class metrics, not secondary notes
- direct-use records may have unknown, estimated, inferred, or verified capacity values
- installed heat-pump capacity and geothermal resource capacity are different values and should be separately supported where available
- cooling output should be supported from the beginning

Recommended estimate status values:

```text
unknown
reported
estimated
inferred
verified
not_applicable
```

## 7. Project And Operating Asset Definitions

Project:

```text
A geothermal asset that is planned, proposed, developing, under evaluation, or under construction, and is not yet operating.
```

Operating asset:

```text
A commissioned geothermal asset actively delivering electricity, heat, cooling, mineral extraction output, or hybrid output to a defined offtaker, network, process, facility, or market.
```

Direct-use operating trigger:

```text
A direct-use project becomes operating when geothermal heat, cooling, or hybrid output is commissioned and actively delivered to an end user, heat/cooling network, industrial process, building system, agricultural/aquaculture facility, or other defined offtake.
```

One project can become multiple operating assets. The model must support:

- phased developments
- expansions
- separate units or facilities
- hybrid assets
- shared resource areas
- project-to-operating-asset linkage

The original project record should remain historically traceable when promoted or linked to operating assets.

## 8. Lifecycle Phases

Official shared TGE lifecycle phases:

```text
Prospect / TBD
Exploration
Pre-Feasibility
Feasibility
Construction
Operating
Cancelled
```

Decision:

- use one shared core phase list for power, direct-use, mineral extraction, and hybrid geothermal assets
- do not create separate direct-use lifecycle phases at this stage

Additional details should be modeled separately, not as primary lifecycle phases:

- permitting
- financing
- commissioning details
- expansion status
- stalled/on-hold status
- validation status
- source confidence

## 9. Company Roles

Company roles should use controlled database codes and user-friendly UI labels.

Shared role codes:

```text
owner
operator
developer
investor
financier
resource_owner
drilling_contractor
epc_contractor
engineering_consultant
technology_supplier
equipment_supplier
utility_offtaker
government_public_agency
research_institution
other
```

Direct-use role codes for MVP:

```text
district_heating_operator
district_cooling_operator
municipality
industrial_host
building_owner
heat_offtaker
heat_pump_supplier
```

Direct-use role codes to support or add later:

```text
greenhouse_operator
cooling_offtaker
```

Role model rule:

- one company can have multiple roles on one project or operating asset
- roles should be normalized enough for analytics
- UI labels should remain understandable for editors and reviewers

## 10. Verification States

Record workflow states:

```text
draft
validation
approved
export_ready
needs_update
archived
```

Workflow rules:

- every new record must pass through validation before it is approved or export-ready
- power, direct-use, mineral extraction, and hybrid records follow the same verification workflow
- every approval records who approved and when
- every material edit updates audit metadata
- export-ready should be stricter than approved if data is used for external reporting or subscriber products

Minimum evidence before approval:

- at least one credible source
- clear source reference or URL
- capacity/status evidence where available
- internal notes for uncertain or estimated values

For important capacity, ownership, COD, operating-status, or company-role data, two-source validation should be preferred where possible.

## 11. MVP Schema Implications

The future PostgreSQL model should support these concepts from the beginning:

- shared project entity
- shared operating asset entity
- adaptive UI labels for plant/facility/complex
- power/direct-use/mineral/hybrid classification
- direct-use application categories
- technology/system tags
- MWe, MWth, GWhe, GWhth, and GWhc metrics
- metric estimate status
- project-to-operating-asset links
- company role links to projects and operating assets
- review/audit state
- source/evidence notes, even before the full source registry exists

Recommended high-level schema direction:

```text
projects
operating_assets
asset_use_components
asset_technology_tags
companies
company_project_links
company_operating_asset_links
company_relationships
review_events
users
reference tables
```

## 12. Decisions Captured

- Direct-use included in MVP schema: yes
- Direct-use data entry in MVP UI: yes
- Direct-use visible in maps/filters from MVP: yes
- PostgreSQL model supports MWth/GWhth from start: yes
- Cooling/district cooling supported from MVP: yes
- Heat-pump-assisted systems supported from MVP: yes, as technical/system tags
- Small-scale single-home GSHP included: no, unless part of a larger portfolio or strategically relevant dataset
- Existing TGE lifecycle terminology is preserved

## 13. Open Questions

Resolve before final schema implementation:

- should `mineral_extraction` be a top-level `primary_use_type`, a use component, or both?
- should hybrid be a top-level type, or should it be calculated from multiple use components?
- should `operating_asset` replace the word `plants` in the database while UI labels remain adaptive?
- which direct-use categories need mandatory fields at MVP?
- what is the minimum source/evidence structure before the full article/PDF source registry exists?
- should export-ready be an explicit workflow state or a separate boolean flag?
