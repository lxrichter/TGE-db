# Analysis Module Contract

This note defines how new analysis pages should be introduced so the platform
can grow beyond the first modules without becoming a set of one-off reports.

## Core Principle

Every analysis module must have an explicit analytical meaning, source basis,
measure set, segmentation logic, and governance QA layer.

Do not create a new analysis page only because a table or chart is interesting.
Create it when it answers a stable intelligence question.

## Registry First

New modules should be added to:

- `web/lib/analysis/modules.ts`

before or alongside page implementation.

The registry should define:

- module id
- title
- description
- href when live
- status: `live`, `definition_next`, or `planned`
- visibility: subscriber candidate, internal review, or definition governance
- category
- source basis
- primary measures
- definition questions where needed
- data prerequisites where needed

The Analysis workspace and Admin governance views should remain driven by this
registry.

## Required Definition

Before a module becomes live, define:

### User Question

What question does this module answer?

Examples:

- Which companies are the largest geothermal developers by attributed pipeline
  MWe?
- Which turbine technologies and suppliers dominate installed capacity?
- Which operators are linked to the largest operating plant capacity?

### Source Basis

Which structured records feed the module?

Examples:

- plants table
- projects table
- companies table
- company-to-project links
- company-to-plant links
- source/evidence links
- country reference taxonomy

### Measures

Which values are counted or summed?

Examples:

- installed MWe
- operating MWe
- pipeline MWe
- MWth
- units
- linked plants
- linked projects
- attributed MWe
- weighted ownership MWe

### Attribution Logic

How is capacity assigned to companies, roles, or categories?

Examples:

- 100% to single developer
- weighted attribution where explicit weights exist
- equal split fallback among co-developers
- owner MWe weighted by ownership share
- operator MWe counted at full linked plant capacity

The module must explain whether values are full-counted, weighted, split, or
excluded.

### Segments

Which drilldowns are meaningful?

Examples:

- country
- TGE region
- WB region
- project phase
- plant operating status
- technology
- resource type
- company role
- use category

### Governance QA

What can distort the output?

Examples:

- missing MWe
- missing units
- missing ownership share
- equal-split fallback
- excluded non-developer roles
- invalid plant status
- unmapped technology
- duplicate companies
- orphan relationships

Every analytical output should expose these weaknesses internally before it is
treated as subscriber-grade.

## Current Live Pattern

Use these modules as the first implementation patterns:

- Developer Analysis: narrow developer-role attribution with weighted/equal-split
  project MWe.
- Owners & Operators Analysis: weighted owner MWe and full-count operator-linked
  installed MWe.
- Turbine Technology Analysis: installed capacity, operating capacity, units,
  and supplier summary from plant technology and turbine supplier fields.

## Recommended Future Modules

Likely next modules:

- Country Benchmark Analysis
- Project Phase Analysis
- Resource Type Analysis
- Direct Use & Heat Analysis
- Company Role Analysis
- Drilling Activity Analysis
- Investment / Financing Signal Analysis
- Source Coverage Analysis

These should remain planned or definition-next until their source basis and QA
requirements are stable.

## Subscriber Readiness

Internal logic-valid modules are not automatically subscriber-ready.

Before subscriber exposure, confirm:

- data coverage is sufficient
- attribution logic is explainable
- QA warnings are manageable
- source/evidence expectations are clear
- visual design hides internal governance noise while preserving confidence
  signals
- export/report wording is approved

## Avoid

- mixing developer, owner, operator, supplier, EPC, investor, and contractor
  roles into one ranking without explicit grouping logic
- double-counting MWe without explanation
- hiding equal-split fallback logic
- treating missing MWe as zero without warning
- exposing internal QA tables directly to subscribers
- creating bespoke pages outside the module registry

## Related Files

- `web/lib/analysis/modules.ts`
- `web/app/analysis/page.tsx`
- `web/app/admin/page.tsx`
- `docs/DESIGN_PHASE_ENTRY_CHECKLIST.md`
- `docs/DESIGN_TOKEN_CONTRACT.md`
