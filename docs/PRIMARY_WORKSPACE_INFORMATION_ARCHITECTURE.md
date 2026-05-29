# Primary Workspace Information Architecture

Status: product IA baseline for design-system rollout

This document defines the product purpose and information architecture for the
primary TGE Intelligence Platform workspaces before broad live-page redesign.
It translates the approved design system, chart language, lifecycle language,
table language, and role separation into page-level product rules.

## Core Product Rule

The platform should answer:

> What is the current state of the geothermal market, and where should I drill
> deeper?

It should not primarily answer:

> What changed today?

Recent developments matter, but they are supporting context. The executive and
subscriber-facing product should lead with current market state, market
structure, pipeline composition, geographic distribution, and clear drilldowns
into deeper intelligence.

## Cross-Workspace Hierarchy

Default visual and product priority:

1. current market intelligence
2. market structure and geography
3. pipeline and operating fleet composition
4. analysis and benchmark outputs
5. entity discovery and drilldown
6. evidence confidence
7. governance and Research Ops

Governance remains essential, but subscriber-facing and executive-facing pages
should show it as confidence, coverage, readiness, or source context rather than
as the dominant page purpose.

## Cross-Workspace Rules

- Use one compact KPI strip at the top of overview pages unless the page has a
  clear operational reason for a second summary layer.
- Do not use decorative mini charts inside KPI cards. KPIs show state; chart
  surfaces show movement and composition.
- Use the shared lifecycle palette for project phase everywhere:
  Prospect / TBD, Exploration, Pre-Feasibility, Feasibility, Construction,
  Operating, Cancelled.
- Ranking charts use one color per metric. Do not assign random colors to rows.
- TGE region is the primary geothermal market taxonomy. World Bank region is a
  secondary analytical taxonomy.
- Subscriber-facing pages suppress internal queue language, AI uncertainty,
  staging route names, and governance audit detail.
- Internal pages may show source gaps, validation status, AI review state,
  attribution warnings, and export readiness, but these should not leak into
  subscriber navigation as primary content.

## 1. Dashboard

### Primary Purpose

Executive landing page and current-state overview of the geothermal sector. The
Dashboard should communicate global market status and route users into the best
next workspace.

The Dashboard is not a database homepage, not a Research Ops summary, and not a
news feed.

### Key User Questions

- What is the current global geothermal market size?
- How large is the development pipeline?
- Which markets and regions matter most?
- How is the pipeline distributed by phase?
- Where should I investigate next?
- Is there a small amount of important current context I should notice?

### Recommended KPIs

Use a single executive KPI strip:

- Operating capacity
- Pipeline capacity
- Markets tracked
- Projects tracked
- Companies tracked

Optional subscriber/internal variants:

- Plants tracked
- Evidence coverage score
- Direct-use coverage, when data quality is ready

### Recommended Tables

- Top markets by operating MWe
- Top markets by pipeline MWe
- Markets to watch, curated or rules-based

Tables should be compact and executive-readable, not full worklists.

### Recommended Charts

- Regional operating vs pipeline comparison
- Project lifecycle / pipeline composition
- Top markets ranking bars
- Compact world/regional map preview or spatial concentration panel

### Recommended Navigation

Primary drilldowns:

- Markets
- Analysis
- Map Explorer
- Projects
- Plants
- Companies

These should behave as gateways into deeper workspaces, not as large dashboard
content blocks.

### Subscriber-Facing Elements

- approved global KPIs
- market rankings
- regional comparisons
- approved map preview
- curated intelligence summary
- featured analysis modules

### Internal-Only Elements

- Research Ops pulse
- validation queue counts
- AI review counts
- source gaps
- export readiness
- staging/cutover state

Internal operations may appear as a compact lower section for internal users
only. They should never dominate the Dashboard.

## 2. Markets

### Primary Purpose

Market intelligence layer for countries and TGE regions. Markets should explain
where geothermal activity is concentrated and which countries or regions deserve
deeper attention.

### Key User Questions

- Which countries are the most important geothermal markets?
- Which TGE regions lead in operating capacity and pipeline?
- Where is development momentum strongest?
- Which markets have major source or coverage gaps?
- Which countries should I open next?

### Recommended KPIs

- Countries / markets tracked
- Operating MWe
- Pipeline MWe
- Active projects
- Operating plants
- Source gap markets, internal only or confidence-context only

### Recommended Tables

- Top countries by operating MWe
- Top countries by pipeline MWe
- TGE regional intelligence overview
- Country comparison table with operating MWe, pipeline MWe, projects, plants,
  companies, and source coverage

### Recommended Charts

- Operating MWe by TGE region
- Pipeline MWe by TGE region
- Top country ranking bars
- Regional operating vs pipeline split
- Source coverage / gap comparison, internal or confidence-context variant

### Recommended Navigation

Primary drilldowns:

- country intelligence page
- region intelligence page
- filtered Projects
- filtered Plants
- filtered Companies
- filtered Map Explorer
- relevant Analysis modules

### Subscriber-Facing Elements

- market rankings
- regional comparison visuals
- country summaries
- approved capacity and pipeline metrics
- source confidence indicator, if framed externally

### Internal-Only Elements

- source gap work queues
- missing market coverage queues
- country taxonomy cleanup
- WB region mapping QA
- unpublished editorial notes

## 3. Projects

### Primary Purpose

Pipeline intelligence workspace. Projects should help users understand and work
through the geothermal development pipeline.

### Key User Questions

- What is in the geothermal project pipeline?
- Which projects are largest, most advanced, or most important?
- How is pipeline capacity distributed by phase?
- Which markets have the strongest development activity?
- Which records need evidence or governance review?

### Recommended KPIs

- Total projects
- Pipeline MWe
- Projects with capacity
- Active countries / markets
- Evidence coverage, internal or confidence-context variant

### Recommended Tables

Default project table:

- project name
- country
- phase
- MWe
- use type / project type
- key developer / sponsor
- last update
- review status, internal only or visually secondary

Advanced or internal table variants may expose source status, relationship QA,
created/updated metadata, and export readiness.

### Recommended Charts

- Pipeline MWe by phase
- Project count by phase
- Top pipeline markets
- Pipeline by TGE region
- Optional phase-colored progress / distribution strip

### Recommended Navigation

Primary drilldowns:

- project detail
- related companies
- related plants, where applicable
- sources/evidence
- filtered market page
- filtered map
- Research Ops issue queue, internal only

### Subscriber-Facing Elements

- approved project list
- phase and capacity
- market context
- developer/sponsor where approved
- source-backed project profile

### Internal-Only Elements

- edit workflow
- source/evidence gaps
- AI suggestions
- validation state
- duplicate review
- export readiness
- assignment and reviewer state

## 4. Plants

### Primary Purpose

Operating fleet intelligence workspace. Plants should explain built geothermal
infrastructure, installed capacity, operators, technology, and operating status.

### Key User Questions

- What geothermal capacity is operating today?
- Which plants and markets dominate installed capacity?
- Which technologies and operators are most important?
- Which plants are idle, under commissioning, or decommissioned?
- Where should operating-fleet analysis continue?

### Recommended KPIs

- Total plants
- Installed MWe
- Operating MWe
- Active countries / markets
- Operators tracked

Optional future KPIs:

- MWth
- units
- direct-use plants / facilities
- production or utilization metrics, if source basis becomes stable

### Recommended Tables

Default plant table:

- plant name
- country
- operating status
- installed MWe
- technology
- operator
- commissioning year
- last update

Internal variants may expose source gaps, missing technology, coordinate
quality, owner/operator QA, and migration readiness.

### Recommended Charts

- Installed MWe by country
- Installed MWe by TGE region
- Operating status distribution
- Technology mix
- Top operators by linked installed MWe

### Recommended Navigation

Primary drilldowns:

- plant detail
- operator/company profile
- country/market page
- technology analysis
- owners/operators analysis
- map marker / filtered map
- sources/evidence, internal or profile context

### Subscriber-Facing Elements

- approved plant profiles
- installed capacity and technology
- country and operator context
- operating status where approved
- map visibility

### Internal-Only Elements

- source/evidence gaps
- coordinate cleanup
- invalid plant statuses
- owner/operator link QA
- edit/review workflow
- export readiness

## 5. Companies

### Primary Purpose

Geothermal ecosystem intelligence workspace. Companies should explain who
develops, owns, operates, supplies, finances, and services geothermal markets.

### Key User Questions

- Which companies matter in geothermal?
- What role does each company play?
- Which companies are linked to projects and plants?
- Which developers, operators, owners, suppliers, or investors rank highest?
- Where are company relationships incomplete or ambiguous?

### Recommended KPIs

- Companies tracked
- Developers
- Operators
- Owners / investors
- Service and technology companies
- Companies with linked projects/plants

### Recommended Tables

Default company table:

- company name
- country / headquarters
- primary category
- secondary category
- activity status
- linked projects
- linked plants
- last update

Internal variants may expose relationship QA, duplicate candidates, source
coverage, reviewer state, and unmapped roles.

### Recommended Charts

- Company role distribution
- Top developers by attributed pipeline MWe
- Top operators by linked installed MWe
- Top owners by weighted installed MWe
- Ecosystem concentration by country or region

### Recommended Navigation

Primary drilldowns:

- company profile
- linked Projects
- linked Plants
- Developer Analysis
- Owners & Operators Analysis
- Sources/evidence
- relationship cleanup queues, internal only

### Subscriber-Facing Elements

- approved company profiles
- role and market participation
- linked projects/plants
- curated ecosystem rankings
- approved analysis links

### Internal-Only Elements

- duplicate company cleanup
- role taxonomy QA
- relationship attribution warnings
- ownership/developer/operator distinction warnings
- edit and approval workflows

## 6. Analysis

### Primary Purpose

Modular intelligence and benchmark workspace. Analysis should turn structured
records and relationships into explainable market intelligence.

### Key User Questions

- What benchmark question does this module answer?
- What data and attribution logic feed the result?
- Which countries, technologies, companies, or phases lead?
- How reliable is this output?
- Is this module subscriber-ready or internal validation only?

### Recommended KPIs

Analysis KPIs should be module-specific. Examples:

- Developer Analysis: attributed pipeline MWe, developer-linked projects,
  weighted vs equal-split projects, missing MWe.
- Owners & Operators: weighted owner MWe, operator-linked installed MWe, owner
  rows, operator rows.
- Turbine Technology: installed MWe, operating MWe, units, suppliers, unmapped
  technology.

### Recommended Tables

- module registry table
- ranking tables
- country exposure tables
- phase / status exposure tables
- governance QA tables, internal only

### Recommended Charts

- ranking bars
- lifecycle or status distributions
- technology composition charts
- country / region comparisons
- attribution readiness or coverage bars for internal modules

### Recommended Navigation

Primary drilldowns:

- module detail page
- related Markets
- filtered Projects or Plants
- related Companies
- evidence/source context where relevant
- Admin methodology governance, internal only

### Subscriber-Facing Elements

- approved modules
- methodology summary in plain language
- charts and rankings
- market and entity drilldowns
- confidence language without raw internal QA clutter

### Internal-Only Elements

- Governance QA tables
- attribution fallback warnings
- excluded role distributions
- missing MWe / missing technology / invalid status queues
- module readiness status
- definition-next modules

## 7. Map Explorer

### Primary Purpose

Spatial intelligence workspace. Map Explorer should make geothermal market
geography, capacity concentration, and project/plant distribution visible.

The map is not a location database. It is one of the platform's signature
intelligence surfaces.

### Key User Questions

- Where are geothermal projects and plants concentrated?
- Which regions and countries show the strongest operating or pipeline
  footprint?
- How do phase, technology, use type, and status appear spatially?
- Which record should I open from the map?
- Which markets or clusters deserve further analysis?

### Recommended KPIs

Use minimal map-context metrics:

- mapped projects
- mapped plants
- operating MWe visible
- pipeline MWe visible
- records missing coordinates, internal only

### Recommended Tables

Map should not lead with tables, but may include:

- selected marker detail
- filtered result list
- missing-coordinate queue, internal only
- country/region result summary

### Recommended Charts / Visuals

- marker clusters
- operating vs pipeline layers
- capacity density / intensity overlays
- TGE region overlays
- lifecycle or status layer toggles
- future activity/signal overlays

### Recommended Navigation

Primary drilldowns:

- open record
- open market / country
- open TGE region
- open related Analysis
- open Research Ops coordinate queue, internal only

### Subscriber-Facing Elements

- approved project and plant markers
- clean popups
- curated filters
- region and country context
- screenshot/presentation-ready map state

### Internal-Only Elements

- coordinate missing/quality queues
- unapproved markers
- AI uncertainty
- staging route names
- internal audit or source warnings in popups

## 8. Research Ops

### Primary Purpose

Internal research operations command center. Research Ops coordinates human
review, evidence governance, validation queues, AI-assisted workflows, missing
data, and export readiness.

Research Ops is not subscriber-facing and should not define the public product
identity.

### Key User Questions

- What work needs attention now?
- Which records are assigned to me or my team?
- Which issues block evidence confidence, export, or publication?
- Which AI suggestions require review?
- Which researchers have completed or touched which work?
- Which queues should editors prioritize?

### Recommended KPIs

- open issues
- critical blockers
- assigned to me
- evidence gaps
- AI review candidates
- export blockers
- recent edits / completed work

### Recommended Tables

- assigned work queue
- unresolved validation issues
- evidence gaps
- Article Match Review queue
- Article Fact Review queue
- AI Field Suggestion Review queue
- missing coordinates
- duplicate candidates
- researcher activity lens
- export blockers

### Recommended Charts

Research Ops should use charts sparingly:

- queue volume by severity
- work completed by week
- issue type distribution
- researcher activity summary
- export readiness progress

Charts support operations; they should not make Research Ops feel like the
subscriber dashboard.

### Recommended Navigation

Primary drilldowns:

- open entity edit/detail
- open source detail
- open matches/facts review
- open validation queue
- open map coordinate cleanup
- open readiness/export blockers
- open researcher activity lens

### Subscriber-Facing Elements

None by default.

Aggregated confidence or coverage can be transformed into subscriber-facing
signals elsewhere, but Research Ops itself remains internal.

### Internal-Only Elements

All Research Ops content is internal:

- assignments
- review states
- governance notes
- AI candidate queues
- source gaps
- validation issues
- audit/activity summaries
- export readiness

## Rollout Sequence

Use this IA baseline in the next implementation sequence:

1. Dashboard proves the executive current-state overview.
2. Markets proves market and regional drilldown.
3. Analysis proves modular intelligence and methodology.
4. Map Explorer proves spatial intelligence.
5. Projects, Plants, and Companies inherit the intelligence workspace pattern.
6. Sources and Research Ops inherit typography, table, badge, and governance
   rules while remaining visibly internal.

Do not redesign each page independently. Each page should express the same
product system with a different primary intelligence question.

