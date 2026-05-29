# TGE Intelligence Platform Design System

Status: foundation proposal for implementation

This document is the design constitution for the ThinkGeoEnergy Intelligence
Platform. It should guide Dashboard, Markets, Projects, Plants, Companies,
Analysis, Map Explorer, Sources, Research Ops, and Admin work.

## V2 Product Identity Addendum

The first foundation pass established structure. The second pass sharpens
product identity.

Design work must distinguish:

- Platform identity: ThinkGeoEnergy green, navigation, primary actions, selected
  states, product branding, and key intelligence accents.
- Semantic state: operating, pipeline, lifecycle phase, review, rejected,
  evidence, and governance colors.

ThinkGeoEnergy green is not simply another semantic color. It is the product's
identity color. Semantic green may still represent operating or positive state,
but it should be visually related and not confused with the broader brand role.

The product should feel like a morning intelligence workspace. It should open
with market movement, not module structure.

KPI cards should remain compact and calm. They should not include decorative
charts unless real trend data is available and the trend meaning is important.
Trend storytelling belongs primarily in chart surfaces, not KPI cards.

Prefer whitespace, section rhythm, and confident typography before adding
visible boxes. Borders are useful for tables, filters, governance blocks, and
repeated cards, but the product should not feel like cards inside cards.

## 1. Product Positioning

The platform is a geothermal market intelligence product.

It should feel close to:

- Bloomberg Terminal, simplified
- PitchBook
- Rystad Intelligence
- CB Insights
- modern SaaS intelligence products

It should not feel like:

- Google Analytics
- PowerBI
- Tableau
- internal ERP software
- administrative database software

The primary user reaction should be:

> I am looking at the state of the geothermal market.

Not:

> I am managing database records.

Core product principle:

> Intelligence leads. Governance supports. Records sit underneath.

## 2. Information Hierarchy

Platform-wide visual priority:

1. Market intelligence
2. Maps and spatial intelligence
3. Signals
4. Rankings
5. Analysis
6. Entity records
7. Governance
8. Admin and system state

Governance is critical, but it should normally appear as confidence context,
review state, or workflow support. It should not dominate subscriber-facing or
executive-facing views.

Every page should pass this test:

> If this page were shown to a geothermal executive, investor, analyst, or
> developer, would they immediately understand something about the market?

If not, the page is too administrative.

## 3. Typography System

The current system font stack is acceptable for now. Use a modern neutral
sans-serif. Avoid decorative or overly editorial type.

| Element | Size | Weight | Line height | Usage |
| --- | ---: | ---: | ---: | --- |
| Page label | 11-12px | 700 | 16px | Small uppercase section marker |
| H1 page title | 26-32px | 700 | 34-40px | Page identity, not a marketing hero |
| Intelligence headline | 34-44px | 700 | 40-50px | Dashboard or briefing lead only |
| H2 section title | 18-22px | 700 | 26-30px | Main modules |
| H3 card title | 14-16px | 700 | 20-24px | Cards, widgets, panels |
| Body text | 14px | 400-500 | 22px | Descriptions and interface copy |
| Table body | 13-14px | 400-500 | 20px | Dense work surfaces |
| Table header | 11-12px | 700 | 16px | Uppercase or title case by table type |
| Metadata / badges | 10-12px | 600-700 | 14-16px | Status, labels, compact notes |

Rules:

- Page titles orient the user. They should not dominate work pages.
- Dashboard may use one larger intelligence headline.
- Live product pages should avoid long explanatory paragraphs.
- Tables must remain readable during long research sessions.
- If text exists only to explain the UI, consider moving it to a tooltip,
  help drawer, onboarding state, or removing it.

## 4. Color System

### Primary Brand Color

ThinkGeoEnergy green is the primary brand and action color.

Use it for:

- primary actions
- selected navigation
- operating / positive state
- confirmed / approved state
- subtle intelligence accents

Do not use green as a decorative frame around every section.

### Semantic Colors

| Meaning | Color direction | Usage |
| --- | --- | --- |
| Operating / positive | Green | Plants, operating capacity, approved states |
| Pipeline / development | Blue / teal | Projects, pipeline MWe, development signal |
| Prospect / unknown | Gray / slate | Early stage, TBD, neutral states |
| Pre-feasibility | Purple | Lifecycle phase |
| Feasibility | Teal | Lifecycle phase |
| Construction | Amber / gold | Active build, near-term activity |
| Review / attention | Orange / amber | Needs review, pending, caution |
| Cancelled / rejected | Red | Cancelled, rejected, blockers |
| Governance / metadata | Neutral gray | Admin and supporting layers |

### Background Rules

Default surface usage:

- Page background: light neutral gray or off-white
- Primary cards: white
- Secondary cards: very light gray
- Dense tables: white with light row separation

Color should appear as:

- small accents
- semantic badges
- status dots
- thin bars
- chart marks
- selected navigation states

Avoid:

- large colored KPI backgrounds
- decorative gradients
- heavy tinted panels
- unrelated color variety

## 5. KPI Design Language

KPI cards must be compact, minimal, and executive.

A KPI contains:

- label
- primary value
- unit where needed
- short context or delta
- optional trend indicator only if meaningful

Example:

```text
Operating Capacity
17.4 GW
+312 MW confirmed
```

Avoid:

- decorative sparklines without meaningful trend data
- large colored card backgrounds
- oversized KPI blocks
- long explanatory text
- KPI walls that dominate the page

### KPI Sizes

Large KPI:

- Use only for top dashboard metrics.
- Strong number, compact height, subtle semantic accent.

Medium KPI:

- Use for page summaries and section summaries.
- Same layout, smaller number and tighter padding.

Small KPI:

- Use in side panels, governance summaries, and compact workflow modules.
- Minimal text and no charting.

Rule:

> KPI cards should summarize. They should not become the design.

## 6. Card Standards

General card standard:

- background: white
- border: subtle neutral
- border radius: 0-6px
- shadow: none or very subtle
- compact padding: 12-16px
- standard padding: 16-20px
- feature padding: 20-24px

Avoid nested cards unless they represent a true repeated item, table row,
modal, or framed tool.

### Intelligence Card

Used for:

- market signals
- recent changes
- analysis modules
- subscriber-facing insight summaries

Contains:

- signal type
- market or entity
- concise headline
- source or confidence marker
- optional action

### Market Summary Card

Used for:

- countries
- regions
- market drilldowns

Contains:

- market name
- operating MWe
- pipeline MWe
- active projects / plants
- signal or source-gap indicator

### Governance Card

Used for:

- source gaps
- evidence coverage
- readiness
- review queues

Should be visually quieter than market intelligence cards.

## 7. Table Design Language

Tables are core product surfaces. They must feel like intelligence workspaces,
not raw spreadsheets.

### Entity Table

Used for:

- Projects
- Plants
- Companies

Goal:

- fast scanning
- operational intelligence
- clear drilldown

Default priority:

Projects:

- name
- country
- phase
- MWe
- type
- key company
- status
- last update / action

Plants:

- name
- country
- operator
- technology
- installed MWe
- operating status
- COD

Companies:

- name
- country
- primary business identity
- activity footprint
- linked projects / plants
- status

Rules:

- row height should be compact but readable
- entity name is visually dominant
- lifecycle/status badges are secondary
- avoid repeated `NA`; use muted dash
- clamp long text in list view
- row actions are right-aligned and quiet

### Governance Table

Used for:

- Sources
- Matches
- Facts
- Research Ops queues

Goal:

- review efficiency
- moderation workflow

Default priority:

- item / source / entity
- candidate value
- evidence
- confidence
- status
- action

Rules:

- candidate value and evidence dominate
- governance metadata is secondary
- confidence is visible but not overpowering
- row actions are clear and repeatable

### Ranking Table

Used for:

- Markets
- Countries
- Technology
- Developers
- Owners / operators

Goal:

- intelligence comparison

Default priority:

- rank
- market / entity
- key metric
- visual bar / share
- secondary metric
- drilldown

Rules:

- use inline bars where helpful
- capacity-first where relevant
- sorting should be obvious
- ranking tables should feel like market intelligence, not exports

## 8. Badge and Status Rules

Badges communicate controlled meaning. They are not decoration.

Badge categories:

- LifecycleBadge: project development phase
- StatusBadge: review, evidence, confidence, governance state
- SeverityBadge: blocker, warning, advisory
- VisibilityBadge: public, internal, confidential

Rules:

- Use consistent size and casing.
- Keep badge text short.
- Avoid multiple badges with equal visual weight in the same row.
- Lifecycle phase is usually more important than review status on entity pages.
- Review/governance status is usually more important on Sources and Research Ops.

## 9. Spacing System

Use a simple spacing scale:

| Token | Size | Usage |
| --- | ---: | --- |
| xs | 4px | tight metadata |
| sm | 8px | inline groups |
| md | 12px | compact cards |
| lg | 16px | standard card padding |
| xl | 24px | section spacing |
| 2xl | 32px | major page separation |

Rules:

- Intelligence pages need room to scan.
- Operational tables need tighter density.
- Long pages need section rhythm, not repeated heavy boxes.
- Avoid large hero spacing except for the dashboard intelligence brief.

## 10. Chart Principles

Charts are part of the product value. They should not feel like placeholders.

General rules:

- Use semantic color consistently.
- Prefer direct labels over legends when space allows.
- Use capacity-first metrics for geothermal market views.
- Keep axes and gridlines subtle.
- Avoid flashy gradients and decorative chart junk.
- Make charts drilldown-ready.

Chart types:

Bar charts:

- use for rankings and market comparisons
- values should be visible or near the bar
- bars should be thick enough to scan

Stacked bars:

- use for lifecycle, operating vs pipeline, technology mix
- keep segment order consistent
- avoid too many tiny segments

Line charts:

- use only when real time-series data exists
- do not fake trend lines in production

Heatmaps:

- use for market intensity, source coverage, activity signals
- keep color intensity restrained

Ranking charts:

- combine rank, label, value, and proportional bar
- must remain readable as a table

Pipeline charts:

- lifecycle order is fixed:
  Prospect / TBD, Exploration, Pre-Feasibility, Feasibility, Construction,
  Operating where applicable, Cancelled / Suspended where relevant

Map overlays:

- map is the primary surface
- filters are secondary and collapsible
- overlays should communicate intensity, clusters, status, and movement

## 11. Dashboard Philosophy

The dashboard is not:

- a database homepage
- an admin page
- a KPI collection
- a list of modules

The dashboard is:

> A global geothermal market command center.

It should answer:

- What changed?
- Where is activity increasing?
- Which markets matter?
- What signals appeared?
- Where should I investigate next?
- How confident is the intelligence?

Recommended dashboard hierarchy:

1. Market intelligence brief
2. Compact KPI summary
3. Market movement / signal pulse
4. Regional momentum
5. Country movers
6. Map intelligence preview
7. Evidence confidence
8. Operational pulse

Governance belongs near the bottom unless it directly affects trust in the
intelligence above it.

## 12. Rollout Sequence

Do not redesign each page independently.

Rollout order:

1. Lock this design system.
2. Refactor shared components.
3. Prove the system on Dashboard.
4. Apply to Markets, Analysis, and Map Explorer.
5. Apply to Projects, Plants, and Companies.
6. Apply to Sources, Matches, Facts, Research Ops, Validation Queue, and Admin.

The goal is not only a working platform. The goal is a coherent geothermal
intelligence product that feels premium, consistent, market-aware, and scalable.
