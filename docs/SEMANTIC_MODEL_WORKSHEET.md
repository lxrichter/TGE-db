# Semantic Model Worksheet

Date: 2026-05-16

Purpose: capture the key business/data decisions needed before designing the PostgreSQL schema and future data-entry workflow.

Fill this in roughly. Short answers are enough.

## 1. Asset Scope

Recommended default:

```text
Projects and plants/facilities remain shared top-level entities.
Power, direct-use, and hybrid are classifications on those entities.
```

Decision:

```text
Accept / Change / Unsure: Accept
Notes: We want to keep overview, table overviews and charting separate (so power separate from Direct use of geothermal)
```

## 2. Top-Level Geothermal Use Types

Recommended starting values:

```text
power
direct_use
hybrid
unknown
```

Decision:

```text
Accept / Change / Unsure: Accept but see notes
Notes: We will also have to add Mineral extraction to the setup (mostly Lithium), and a project/ plant could always be a hybrid so producing power and heat (or also mineral extraction)
```


## 3. Direct-Use Categories

For each category, mark: `MVP`, `Later`, `No`, or `Unsure`.

Recommended logic:

- Direct-use categories should describe the main end-use/application.
- Technical configurations such as heat-pump assisted, GSHP, ATES, BTES, cascaded use, or closed-loop should be handled separately as system/technology tags.
- Small-scale single-home residential GSHP systems are outside the core TGE database scope unless they are part of a larger aggregated, commercial, institutional, municipal, or district-scale project.

| Category | MVP / Later / No / Unsure | Notes |
| --- | --- | --- |
| District heating | MVP | Large-scale geothermal heat networks. |
| District cooling | MVP | Geothermal or geothermal-assisted cooling grids and utility-scale cooling systems. |
| Building heating & cooling | MVP | Commercial, institutional, hospital, airport, campus, or multi-building systems. Excludes small single-home systems. |
| Industrial process heat | MVP | Industrial thermal applications, temperature boosting, steam use, drying, washing, or manufacturing. |
| Agriculture / greenhouses | MVP | Greenhouse heating, horticulture, soil heating, agricultural clusters. |
| Aquaculture | MVP | Fish farming, algae, shrimp, hatcheries, or other aquaculture applications. |
| Food drying / processing | MVP | Drying, dehydration, pasteurization, washing, or processing of food and agricultural products. |
| Bathing / wellness / tourism / balneology | MVP | Spas, bathing facilities, resorts, wellness, tourism, therapeutic/balneological uses. |
| Cooling & refrigeration | MVP | Standalone cooling, refrigeration, absorption cooling, cold storage, or process cooling not covered under district cooling. |
| Snow melting & infrastructure | Later | Roads, sidewalks, airport/runway de-icing, sports fields, or other public infrastructure. |
| Hybrid heat and power | MVP | Combined electricity and direct-use heat, CHP, cascaded use, or power plants with material heat offtake. |
| Thermal storage-linked geothermal use | Later | ATES, BTES, seasonal storage, or geothermal-linked storage systems where storage is central to the asset. |
| Other direct use | MVP | Catch-all for direct-use applications not captured above. Must include explanatory notes. |

Extra categories to add:

- District cooling
- Snow melting & infrastructure
- Thermal storage-linked geothermal use

Recommended separate technical/system configuration tags:

- direct_hydrothermal_use
- heat_pump_assisted
- large_scale_heat_pump
- ground_source_heat_pump_gshp
- aquifer_thermal_energy_storage_ates
- borehole_thermal_energy_storage_btes
- closed_loop_geothermal
- egs_ags
- cascaded_use
- waste_heat_integration
- seawater_or_water_source_integration
- hybrid_renewable_integration

Scope note:

- Include district-scale, municipal-scale, commercial-scale, institutional-scale, industrial-scale, utility-scale, and strategically relevant geothermal direct-use systems.
- Exclude small single-home residential GSHP systems unless part of a larger portfolio, district-scale concept, or strategically relevant market dataset.

## 4. Capacity And Output Units

Recommended starting fields:

```text
electric_capacity_mwe
thermal_capacity_mwth
annual_power_generation_gwhe
annual_heat_supply_gwhth
annual_cooling_supply_gwhc
```

Fields to support architecturally, but not necessarily force in MVP data entry:

```text
installed_heat_pump_capacity_mwth
geothermal_resource_capacity_mwth
capacity_estimate_status
output_estimate_status
```

Questions:

```text
Should MWth/GWhth be tracked as seriously as MWe/GWhe?
Answer:
Yes. Thermal capacity and thermal output should be treated as core first-class metrics within the database architecture, not as secondary metadata.

Should direct-use records allow unknown/estimated capacity?
Answer:
Yes. Many direct-use records will not have verified public MWth or GWhth values. The schema should allow unknown, estimated, inferred, and verified values.

Should heat-pump projects track installed heat-pump capacity separately from geothermal resource capacity?
Answer:
Yes, where available. Installed heat-pump capacity and geothermal resource capacity are different technical values. The model should support both, but these should not necessarily be mandatory in MVP data entry.

Should cooling output be supported from the beginning?
Answer:
Yes. Annual cooling supply should be supported from the start because district cooling and process cooling are strategically relevant geothermal direct-use applications.
```

## 5. Project vs Plant/Facility

Recommended starting definitions:

```text
Project = geothermal asset that is not yet operating and is classified under one of the existing TGE project phases:
Prospect / TBD
Exploration
Pre-Feasibility
Feasibility
Construction

Operating Asset = commissioned geothermal asset classified as:
Operating
```

Questions:

```text
For direct-use, should the UI say "plant", "facility", or depend on asset type?
Answer:
The UI should depend on asset type.

Recommended terminology:
- Power generation → Plant
- Direct-use → Facility
- Hybrid → Plant, Facility, or Complex depending on dominant use case

Internally, the platform should keep the same shared project-to-operating-asset logic, while allowing user-facing labels to adapt by use type.

When does a direct-use project become operating?
Answer:
A direct-use project becomes operating when geothermal heat, cooling, or hybrid output is commissioned and actively delivered to an end user, network, industrial process, building system, or other defined offtake.

The operating status should be:
Operating

If only part of the system is commissioned, this should be captured in notes, capacity fields, linked facilities, or phased asset structure rather than by creating additional lifecycle stages.

Can one project become multiple plants/facilities?
Answer:
Yes. One project, field, or development area can become multiple operating plants/facilities over time.

The model should support:
- phased developments
- expansions
- separate units or facilities
- hybrid assets
- shared resource areas
- project-to-operating-asset linkage

The original project record should remain historically traceable when promoted or linked to an operating asset.
```

## 6. Lifecycle Phases

Official TGE lifecycle phases:

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

```text
Use one shared phase list or separate phase lists for power and direct-use?
Answer:
Use one shared core phase list for power, direct-use, and hybrid geothermal assets. This preserves consistency across the platform, analytics, reporting, exports, and future AI workflows.

Missing phases:
Answer:
No additional core lifecycle phases are recommended at this stage.

Additional details such as permitting, financing, phased commissioning, expansion status, validation status, or stalled/on-hold status should be handled separately as metadata, workflow status, or notes rather than as primary lifecycle phases.
```

## 7. Company Roles

Recommended shared roles:

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

Direct-use-specific candidate roles:

```text
district_heating_operator
district_cooling_operator
municipality
industrial_host
greenhouse_operator
building_owner
heat_pump_supplier
heat_offtaker
cooling_offtaker
```

Questions:

```text
Which direct-use roles are definitely needed?
Answer:
The most important direct-use roles for MVP are:
- district_heating_operator
- district_cooling_operator
- municipality
- industrial_host
- building_owner
- heat_offtaker
- heat_pump_supplier

Greenhouse operator and cooling offtaker should also be supported, but can be treated as Later if needed.

Should role names be user-friendly labels, controlled database codes, or both?
Answer:
Both.

The database should use controlled role codes for consistency and analytics.
The UI should display user-friendly labels for easier data entry and review.
```

## 8. Verification Level

Recommended record states:

```text
draft
validation
approved
export_ready
needs_update
archived
```

Questions:

```text
Is approval needed for every new record?
Answer:
Yes. Every new record should at least pass through validation before being treated as approved or export-ready.

Should power and direct-use records follow the same verification workflow?
Answer:
Yes. Power, direct-use, and hybrid records should follow the same verification workflow.

What minimum source/evidence is needed before approval?
Answer:
Minimum approval should require:
- at least one credible source
- clear source reference or URL
- capacity/status evidence where available
- internal notes for uncertain or estimated values

For important capacity, ownership, COD, or operating-status data, two-source validation should be preferred where possible.
```

## 9. MVP Decision Summary

Fill this after the sections above:

```text
Direct-use included in MVP schema: Yes
Direct-use data entry in MVP UI: Yes
Direct-use visible in maps/filters from MVP: Yes
PostgreSQL model must support MWth/GWhth from start: Yes
Cooling/district cooling supported from MVP: Yes
Heat-pump-assisted systems supported from MVP: Yes, as technical/system tags
Small-scale single-home GSHP included: No, unless part of a larger portfolio or strategically relevant dataset
```

## 10. Notes

```text
The semantic model should remain simple at the core entity level:
Projects and plants/facilities remain shared top-level entities.
Power, direct-use, and hybrid are classifications on those entities.

The key distinction should be:
- application category = what the geothermal system is used for
- technical/system tag = how the system works

This avoids mixing direct-use applications with technologies such as heat pumps, GSHP, ATES, BTES, EGS, AGS, or closed-loop systems.

The model should preserve TGE's existing lifecycle terminology and avoid creating separate direct-use lifecycle phases.
```