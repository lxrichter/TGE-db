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
Accept / Change / Unsure:
Notes:
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
Accept / Change / Unsure:
Notes:
```

## 3. Direct-Use Categories

For each category, mark: `MVP`, `Later`, `No`, or `Unsure`.

| Category | MVP / Later / No / Unsure | Notes |
| --- | --- | --- |
| District heating |  |  |
| Residential/commercial heating and cooling |  |  |
| Large-scale geothermal/ground-source heat pumps |  |  |
| Industrial process heat |  |  |
| Agriculture / greenhouses |  |  |
| Aquaculture |  |  |
| Food drying / processing |  |  |
| Bathing / wellness / tourism / balneology |  |  |
| Cooling applications |  |  |
| Hybrid heat and power |  |  |
| Other direct use |  |  |

Extra categories to add:

```text

```

## 4. Capacity And Output Units

Recommended starting fields:

```text
electric_capacity_mwe
thermal_capacity_mwth
annual_power_generation_gwhe
annual_heat_supply_gwhth
```

Questions:

```text
Should MWth/GWhth be tracked as seriously as MWe/GWhe?
Answer:

Should direct-use records allow unknown/estimated capacity?
Answer:

Should heat-pump projects track installed heat-pump capacity separately from geothermal resource capacity?
Answer:
```

## 5. Project vs Plant/Facility

Recommended starting definitions:

```text
Project = planned, developing, proposed, or under-construction geothermal asset.
Plant/facility = operating or built geothermal asset.
```

Questions:

```text
For direct-use, should the UI say "plant", "facility", or depend on asset type?
Answer:

When does a direct-use project become operating?
Answer:

Can one project become multiple plants/facilities?
Answer:
```

## 6. Lifecycle Phases

Recommended power project phases:

```text
prospect
exploration
feasibility
permitting
financing
construction
operational
cancelled
unknown
```

Recommended direct-use project phases:

```text
concept
feasibility
permitting
financing
construction
commissioning
operational
cancelled
unknown
```

Decision:

```text
Use one shared phase list or separate phase lists for power and direct-use?
Answer:

Missing phases:
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
heat_network_operator
municipality
industrial_host
greenhouse_operator
building_owner
heat_pump_supplier
heat_offtaker
```

Questions:

```text
Which direct-use roles are definitely needed?
Answer:

Should role names be user-friendly labels, controlled database codes, or both?
Answer:
```

## 8. Verification Level

Recommended record states:

```text
draft
in_review
approved
needs_update
rejected
archived
```

Questions:

```text
Is approval needed for every new record?
Answer:

Should power and direct-use records follow the same verification workflow?
Answer:

What minimum source/evidence is needed before approval?
Answer:
```

## 9. MVP Decision Summary

Fill this after the sections above:

```text
Direct-use included in MVP schema: Yes / No / Unsure
Direct-use data entry in MVP UI: Yes / No / Later / Unsure
Direct-use visible in maps/filters from MVP: Yes / No / Later / Unsure
PostgreSQL model must support MWth/GWhth from start: Yes / No / Unsure
```

## 10. Notes

```text

```
