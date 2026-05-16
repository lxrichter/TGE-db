# Product Build Specification v1

Date: 2026-05-16

Purpose: capture foundational product decisions for the future TGE geothermal
intelligence platform before implementation expands beyond the current
prototype.

Status: working specification. This document distinguishes desired MVP behavior
from later/future product layers.

## 1. Users, Roles, And Access

### Current Situation

The platform is currently an internal ThinkGeoEnergy research and database
platform used by a small team.

It supports or is intended to support:

- geothermal plants
- geothermal projects
- geothermal direct-use facilities and projects
- companies
- research workflows
- validation and approval
- future reporting and subscriber-facing products

It is not yet intended for external client or subscriber access.

Future external access is expected, but the exact product form is still to be
defined.

### Desired MVP Roles

Keep roles simple and operational in the MVP.

#### Researcher

Can view:

- all internal project records
- all internal operating asset records
- all internal company records
- all internal source records
- all non-confidential research workflow status

Can create:

- draft records

Can edit:

- draft records
- non-approved records

Can approve:

- no

Can export:

- no, or limited internal export only

Can manage users:

- no

Should not see:

- commercial/subscription data
- sensitive client-specific notes if added later
- future Tier C confidential areas

#### Editor / Senior Editor

Can view:

- all internal research records
- validation status
- source/evidence status
- researcher/edit metadata needed for workflow

Can create:

- records

Can edit:

- records

Can approve:

- yes

Can export:

- yes

Can manage users:

- no

Should not see:

- user administration settings unless also admin
- future Tier C confidential areas unless explicitly granted

#### Admin

Can view:

- all records
- workflow metadata
- user and role settings

Can create:

- yes

Can edit:

- yes

Can approve:

- yes

Can export:

- yes

Can manage users:

- yes

Should not see:

- no internal restriction by default
- future client-confidential areas may still need separate access design

### Later/Future Roles

Potential future roles:

- commercial/subscription manager
- external client/subscriber
- API/data partner
- contributor/reviewer

External users should not use the same operational research interface.

Future client/subscriber access should be through a separate curated layer, such
as:

- frontend portal
- subscriber site section
- API
- controlled export product

External access should expose only approved/export-ready data.

### Field Restrictions

#### Current Situation

Most geothermal project, plant, facility, and company data is intended for
internal research use and is not highly sensitive by itself.

#### Desired MVP

Clearly separate or restrict:

- internal notes
- source confidence
- validation status
- researcher/editor names
- AI-generated summaries
- unapproved records
- commercial/subscription information
- client-specific Tier C notes
- sensitive ownership or financing notes

Standard public/sector data can remain visible internally.

#### Later/Future

Introduce field-level permissions when needed for:

- client-facing access
- subscriber products
- Tier C confidential work
- external API or data partner access

Recommendations:

- source confidence should not be externally visible by default
- internal notes should not be externally visible
- AI-generated summaries should require human approval before export

### Researcher Visibility

#### Current Situation

The team is small and collaborative.

#### Desired MVP

Researchers should see everyone’s internal work to avoid silos and duplication.

Records should still track ownership and accountability.

Recommended MVP field:

```text
assigned_researcher_user_id
```

This should support workflow and accountability, not restrict visibility.

#### Later/Future

Add assignment logic, record locking, or team-based visibility only if team size
and workflow complexity require it.

### Audit Trail

#### Current Situation

Basic metadata exists or is planned.

#### Desired MVP

Track:

- who created a record
- when it was created
- who last edited it
- when it was edited
- who approved it
- when it was approved
- short edit description or change note

Full edit history is not required for MVP.

#### Later/Future

Add:

- full revision history
- field-level change diffs
- rollback
- audit log review UI

### Approval And Visibility

#### Current Situation

Data may exist as draft, incomplete, or still under validation.

#### Desired MVP

Approval should be required before data appears in:

- formal exports
- subscriber/client views
- final charts
- public-facing maps
- official analytics

Draft and unapproved data should remain visible internally for research work.

Internal maps and analytics should support an internal-only toggle:

```text
include draft data
```

External APIs and subscriber views should expose only:

```text
approved/export-ready records
```

#### Later/Future

Create separate data visibility layers:

1. draft research layer
2. approved internal intelligence layer
3. external/subscriber-facing curated layer

### Open Questions

External access:

- should it be a separate frontend, API, subscriber portal, or a combination?

Commercial/subscription management:

- should this live inside the platform or remain separate?

Field-level access:

- when should sensitive ownership, financing, or Tier C notes require separate
  permissions?

Audit:

- when does the team need full revision history and rollback?

## 2. Validation And Research Operations

### Current Situation

The platform already supports structured research workflows for projects,
plants/facilities, companies, and linked source data.

Records are often incomplete initially and improve iteratively over time through:

- research
- validation
- editorial review
- source checks
- data cleanup

The workflow must support imperfect but useful geothermal intelligence data.

### Desired MVP Principle

Validation should remain lightweight, operational, and research-friendly while
ensuring export-ready data quality.

Approval should not require every possible field to be complete.

MVP rule:

- all critical fields are required for approval
- important fields may still be missing
- warning flags are allowed
- editors/admins may override approval with a reason or note

This is necessary because geothermal intelligence data is often incomplete,
evolving, or source-limited.

### Minimum Usable Data

#### Project

Minimum required:

- project name
- country
- lifecycle phase
- geothermal use type: power, direct-use, hybrid, mineral extraction, or unknown
- at least one source/evidence reference

Strongly recommended:

- developer/company link
- capacity or potential capacity
- region/province
- notes

#### Operating Asset / Plant / Facility

Minimum required:

- asset name
- country
- operating status
- geothermal use type
- at least one source/evidence reference

Strongly recommended:

- installed capacity
- operator/company link
- COD or operating year
- coordinates

#### Company

Minimum required:

- company name
- primary category/type
- at least one linked project, linked plant/facility, or source

Strongly recommended:

- country
- website
- company relationships/groups
- secondary categories

#### Source / Evidence Record

Minimum required:

- source title or URL
- source type
- date accessed or publication date
- linked entity: project, operating asset, or company

Strongly recommended:

- source credibility note
- extracted fields summary
- uploader/researcher name

### Missing Data Logic

#### Critical Missing Data

Critical issues should block approval unless an editor/admin override is entered.

Critical issues:

- missing name
- missing country
- missing lifecycle phase/status
- missing use type
- missing source/evidence
- duplicate suspected
- broken entity relationships

#### Important Missing Data

Important issues should create warning flags but should not necessarily block
approval.

Important issues:

- missing capacity
- missing company link
- missing coordinates
- missing owner/operator
- missing COD/date
- missing classification
- stale/unreviewed record

#### Nice-To-Have Missing Data

Nice-to-have issues should support research completeness but should not block
approval or export readiness unless a specific report requires them.

Nice-to-have issues:

- wells
- turbine supplier
- EPC
- investment cost
- PPA
- flow rate
- reservoir temperature

### Review States

Keep the current proposed review state model:

```text
draft
validation
approved
export_ready
needs_update
archived
```

Definitions:

- `draft`: initial research stage
- `validation`: under review/checking
- `approved`: internally validated
- `export_ready`: approved and suitable for exports, reports, or subscriber use
- `needs_update`: approved but requires re-review due to edits or stale data
- `archived`: inactive, historical, or no longer maintained

### Approval Logic

Approval should support practical editorial judgment.

Rules:

- critical fields should be complete before approval
- important missing fields should remain visible as warning flags
- approval overrides should require a short reason/note
- export-ready status should require stronger completeness than approved status

Potential override examples:

- source confirms existence but no capacity has been reported
- project is real but coordinates are not publicly available
- company role is known from text but formal source detail is incomplete

### Research Ops Dashboard

Highest-priority MVP queues:

- needs approval
- needs source
- missing lifecycle phase
- missing use type/category
- missing company link
- missing coordinates
- missing capacity
- needs update
- suspected duplicates
- recently edited
- direct-use records needing classification

Useful later:

- assigned to me
- created by researcher
- missing technical data
- missing ownership data
- AI-generated summaries needing review

Dashboard behavior:

- show open queues first
- support collaborative self-selection
- avoid rigid assignment bottlenecks in MVP

### Assignment Logic

Desired MVP:

- dashboard primarily shows open queues
- researchers can work collaboratively and self-select tasks
- assignment fields may exist but should not restrict access

Recommended lightweight fields:

```text
assigned_to_user_id
reviewed_by_user_id
```

### Research Activity Tracking

Basic research activity should be tracked.

Recommended MVP tracking:

- records created
- records edited
- records submitted for validation
- records approved
- missing-data issues resolved
- sources added

Purpose:

- accountability
- workflow visibility
- future analytics
- contributor evaluation

### Field-Level Validation

MVP should include partial/lightweight field-level validation.

Examples:

- capacity exists but source is missing
- coordinates are outside valid ranges
- company is linked but role is missing
- AI summary exists but has not been approved

These should create warning flags rather than hard validation failures.

Avoid a complex validation engine in MVP.

### Approved Data Edits

Recommended rule:

Editing approved or export-ready data should automatically move the record to:

```text
needs_update
```

or:

```text
validation
```

until re-approved.

The system should preserve:

- previous approval metadata
- edited_by
- edited_at
- short edit/change note

### Later/Future

Potential future validation functionality:

- full audit trail
- field-level approval
- confidence scoring
- automated stale-record detection
- AI-assisted validation
- duplicate detection
- validation scoring
- structured source confidence
- reviewer comments/workflows

### Open Questions

Validation states:

- should `export_ready` remain separate from `approved` long-term?

Stale data:

- should stale records automatically move into `needs_update` after a time
  threshold?

Sources:

- should source confidence become a structured field later?

AI:

- should AI-generated field suggestions require explicit approval before export?

## 3. Data Entry Forms And Workflow

### Current Situation

The current platform already uses structured forms for projects,
plants/facilities, and companies.

The existing approach is grouped-section based and aligned with the TGE database
structure.

Data entry is research-oriented and iterative rather than fully transactional.

### Desired MVP Principle

Forms should remain:

- structured
- fast
- easy to scan
- easy to edit
- scalable for future fields
- consistent across entities

Avoid:

- one massive long scrolling form
- overly rigid multi-step wizards
- duplicated page setups for similar entity workflows

Recommended MVP pattern:

- quick-create modal for minimum usable data
- full edit page for detailed structured entry
- tabs/sections inside full edit pages
- shared form logic between projects and operating assets wherever possible

### Project Entry Form

Project forms should support development pipeline records, including planned,
exploration, feasibility, construction, and other non-operating records.

Recommended sections:

#### 1. Basic Identity

- project name
- other names
- project group
- internal ID

#### 2. Location

- country
- region
- province/state
- county/city
- coordinates

#### 3. Lifecycle / Status

- lifecycle phase
- project status
- development timeline
- COD/planned COD

#### 4. Use Type And Classification

- power/direct-use/hybrid
- direct-use categories
- resource type
- technology tags

#### 5. Capacity / Output

- potential capacity
- planned capacity
- MWe
- MWth
- annual output
- cooling capacity/output where applicable

#### 6. Companies / Roles

- developer
- operator
- owner
- linked companies and roles

#### 7. Technical Fields

- resource temperature
- wellfield data
- plant technology
- drilling status
- infrastructure details

#### 8. Sources / Evidence

- source URLs
- source documents
- evidence notes
- extraction references

#### 9. Internal Notes

- research notes
- assumptions
- missing-data comments
- AI/internal notes

#### 10. Validation / Review

- workflow state
- assigned researcher
- reviewed by
- approval metadata

### Operating Asset / Plant / Facility Entry Form

Operating asset forms should be mostly aligned with project forms, but adapted
for operational assets.

Key differences:

- operational capacity instead of planned capacity
- operational metrics/output
- actual COD
- operational companies/operators
- facility/plant terminology
- operating status
- expansion logic

Projects and operating assets should share as much schema and form logic as
possible.

The UI label should adapt by use type:

- power: plant
- direct-use: facility
- hybrid: plant/facility/complex

### Company Entry Form

Recommended sections:

#### 1. Basic Identity

- company name
- aliases
- website
- description

#### 2. Company Type / Category

- primary category
- secondary categories

#### 3. Headquarters / Location

- country
- city
- office locations if relevant

#### 4. Geothermal Focus

- technologies
- market focus
- regions active in

#### 5. Linked Projects / Assets

- linked projects
- linked plants/facilities
- company roles

#### 6. Company Relationships / Group Structure

- parent company
- subsidiaries
- JV/consortium links

#### 7. Sources / Evidence

- website
- reports
- references
- source notes

#### 8. Internal Notes

- research notes
- ownership uncertainty
- strategic observations

#### 9. Validation / Review

- workflow state
- reviewed by
- metadata

### Data Entry UI Structure

Desired MVP:

- tabs/sections for full editing
- quick-create plus later full edit
- compact controls for common fields
- clear warnings for missing critical/important data

Quick-create should capture minimum usable data only.

Full edit pages should support detailed structured entry without forcing a rigid
wizard flow.

### Draft Handling

Researchers must be able to save incomplete records as drafts.

This is critical because geothermal data is often incomplete and iterative.

Drafts should:

- be visible internally
- be excluded from formal exports by default
- be available in research queues
- support later submission to validation

### Duplicate Detection

The system should immediately check for likely duplicates during creation.

Signals:

- similar names
- same country
- same coordinates
- same website
- same source URL

Duplicate detection should create warnings, not hard blocks.

Researchers/editors should be able to continue with a reason when a warning is
not a true duplicate.

### Sources / Evidence Requirements

Sources should be strongly encouraged during creation.

Sources should not be strictly required until validation/approval.

Reason:

Researchers often begin records before full sourcing is complete.

Approval/export readiness should require source/evidence checks according to the
validation rules in Section 2.

### Company Relationship Workflow

Use both:

- inline relationship editing inside project/asset forms
- separate relationship management interface

Inline editing is faster for operational research workflows.

A separate relationship manager is important for complex company structures,
groups, joint ventures, subsidiaries, and future graph-style views.

### Edit Workflow

Typical MVP workflow:

1. researcher creates or edits draft
2. researcher saves draft
3. researcher submits for validation
4. editor reviews
5. editor approves or returns to `needs_update`/`validation`

Edits to approved/export-ready records should automatically move records back
into:

```text
validation
```

or:

```text
needs_update
```

until re-approved.

### Mobile Use Cases

Mobile should support:

- quick review
- field lookup
- small corrections
- adding notes
- adding source links
- approval/review actions

Full large-scale data entry is primarily desktop-focused.

### Later/Future

Potential future form/workflow functionality:

- AI-assisted field suggestions
- auto-fill from source extraction
- advanced duplicate detection
- field-level validation
- relationship graph editor
- drag/drop evidence management
- inline map editing
- dynamic form layouts by use type
- bulk-edit workflows
- structured source extraction pipeline

### Open Questions

Direct-use:

- should direct-use forms dynamically adapt by category?

Project-to-asset lifecycle:

- should project promotion to operating asset happen through a guided workflow?

Duplicates:

- should duplicate confidence scoring be added later?

AI:

- should AI-generated field suggestions be visually separated from verified data?

## 4. Design System, Search, Tables, Exports, Print Views, And Reporting

### Current Situation

The current platform already establishes a useful foundation:

- dark ThinkGeoEnergy-style header/navigation
- white content-focused data workspace
- structured cards and panels
- KPI strips
- large searchable tables
- map integration
- project/plant/company detail pages
- lightweight charts
- mobile-capable layout

There is also a newer mockup direction that should inform the future design
iteration.

The newer direction is stronger for:

- refined spacing
- stronger charting
- better typography hierarchy
- cleaner data presentation
- modern SaaS/data-platform aesthetics
- improved status bars and metadata display
- professional market dashboard layouts
- density management
- responsive behavior

Design iteration is expected to take time and should be treated as an ongoing
product process.

### Desired MVP Design Philosophy

The preferred direction is a hybrid:

- retain ThinkGeoEnergy identity
- evolve toward a professional intelligence/data platform
- prioritize readability and workflow efficiency over branding

Overall target:

```text
70% clean modern data platform
30% ThinkGeoEnergy branding identity
```

The platform should feel like:

- an internal Bloomberg/Crunchbase/industry intelligence platform
- a professional geothermal data and workflow system
- a research and analytics workspace

It should not feel like:

- a media/news site
- a public marketing site
- a decorative dashboard
- a landing page

### Design Language

Desired MVP:

- clean
- white/light workspace
- professional intelligence platform
- data-first
- low visual noise
- high readability
- scalable
- chart-friendly
- desktop-first but responsive

Branding:

- keep ThinkGeoEnergy branding
- keep TGE green as primary accent
- maintain dark top navigation/header
- use a simpler flatter UI beneath the header
- avoid excessive green

Color should be used intentionally for:

- status
- lifecycle phases
- warnings
- validation
- chart series
- map layers

Typography:

- modern sans-serif
- high readability
- strong hierarchy
- slightly condensed dashboard feel is acceptable
- tables should prioritize scanability

Spacing:

- generous spacing around cards/panels
- tighter spacing inside tables
- modular dashboard layouts

Buttons:

- simple
- compact
- functional
- avoid oversized marketing-style buttons

### Desktop And Mobile

Desktop remains the primary environment for:

- large data entry
- bulk editing
- analysis workflows
- exports
- administration
- complex validation

Mobile should work well for:

- viewing records
- searching
- filtering
- quick edits
- review/approval actions
- adding notes
- adding sources
- reviewing maps
- viewing charts

Mobile philosophy:

```text
field-capable research companion
```

not:

```text
full desktop replacement
```

Full desktop parity on mobile is not required initially.

### Tables And Lists

Tables are a core product surface and should feel enterprise-grade.

Desired MVP table functionality:

- sortable columns
- multi-filter support
- saved views
- quick filters
- pagination
- adjustable density
- column chooser
- inline badges/statuses
- missing-data indicators
- review status indicators
- quick actions
- CSV export
- bulk select/actions

Later:

- inline editing
- pinned columns
- AI suggestions
- grouped rows
- user-specific layouts

Table design should be dense but readable.

### Search

Desired MVP global search should cover:

- projects
- plants/facilities
- companies
- countries
- regions
- technologies
- company roles
- IDs
- lifecycle phases
- review status
- source URLs
- internal notes

Search should support:

- fuzzy matching
- quick keyboard access
- global top-bar search
- filtered contextual search inside modules

Later/future:

- semantic search
- AI-assisted search
- article archive integration
- source-document search
- natural language querying

### Charts And Overviews

Charts should become a defining strength of the platform.

Highest-priority MVP overviews:

1. capacity by country
2. pipeline by lifecycle phase
3. operating vs planned MW
4. companies by role
5. technology mix
6. resource type distribution
7. recent edits/activity
8. approved vs pending records
9. missing-data overview
10. research workload/status

Charts should support:

- export
- filtering
- drilldown
- future embedding into reports

Open design implementation question:

- choose a consistent internal visualization library early enough to avoid
  fragmented chart behavior

### Maps

Maps are an integrated operational layer, not decoration.

Initial MVP map layers:

- operating plants
- projects
- grouped plant/project clusters
- lifecycle phase coloring
- technology coloring
- country filtering

Useful toggles:

- approved only
- hide drafts
- projects vs plants
- grouped vs individual
- missing coordinates queue

Current grouped map logic should remain foundational.

Later/future:

- direct-use layers
- heat maps
- transmission/pipeline overlays
- drilling overlays
- geothermal provinces/basins
- AI-assisted geo clustering

Open implementation question:

- should maps and charts share synchronized filtering?

### Excel And Data Exports

Desired MVP exports:

- projects export
- plants/assets export
- companies export
- country export
- market overview export
- research ops export
- missing data export
- filtered custom export

Export philosophy:

- export exactly what is filtered/viewed
- support operational research workflows
- preserve IDs and structured relationships
- centralize export logic to avoid duplicate implementations

Later/future:

- scheduled exports
- API feeds
- Power BI integration
- client-ready export templates

### Print Views / PDF-Like Views

Desired MVP print views:

- project profile
- plant/facility profile
- company profile
- country overview
- market overview
- research validation report

Print philosophy:

- clean
- professional
- report-like
- low UI noise
- usable as meeting material

Later/future:

- client-branded exports
- automated report generation
- investment-style briefings
- PDF report builder
- automated consulting deliverables

### Dashboards

Core MVP dashboards:

1. Research Ops dashboard
2. Market overview dashboard
3. Analysis dashboard
4. Data quality dashboard
5. User activity dashboard

Research Ops should become the operational heart of the platform.

Later/future:

- company intelligence dashboard
- direct-use dashboard
- AI extraction dashboard
- source ingestion dashboard
- executive overview dashboard
- customizable dashboards

Open question:

- should Research Ops become the default landing page for researchers?

### Avoiding Duplicate Workflows

The platform should evolve toward:

```text
one structured relational core
many analytical views
```

not:

```text
many semi-duplicated modules
```

Current duplication risk areas:

#### Plants vs Projects

Most important duplication risk.

Lifecycle logic must stay clear:

- project = pipeline/development
- plant/facility/asset = operating asset

Promotion workflow should remain the bridge.

#### Research Ops vs Normal Lists

Risk:

- same records visible in multiple operational contexts

Solution:

- Research Ops should be workflow-oriented and queue-oriented
- normal lists should remain entity-oriented
- Research Ops should not become another duplicate listing module

#### Company Links In Multiple Places

Risk:

- legacy text fields vs structured relationships

Solution:

- structured relationship system becomes the single source of truth
- legacy text fields are transitional only

#### Export Duplication

Risk:

- different sections create inconsistent export logic

Solution:

- centralize export generation
- export from filtered views using shared export configuration

#### Markets vs Maps vs Analysis

Recommended separation:

- Maps = spatial layer
- Markets = country/regional intelligence pages
- Analysis = cross-database analytics

#### Legacy Text Fields vs Structured Fields

Legacy text fields are a transitional necessity, but they become a long-term risk
if not phased out.

### Later/Future

Potential future design/reporting functionality:

- semantic layer
- unified analytics engine
- AI-assisted workflows
- embedded reporting
- chart builder
- customizable dashboards
- advanced permissions
- PostgreSQL analytics optimization
- report-generation pipelines
- external client portals

### Open Questions

Charts:

- should charts use a consistent internal visualization library from the
  beginning?

Filtering:

- should maps and charts share synchronized filtering?

Dashboards:

- should dashboards become user-customizable later?

Print/PDF:

- should print/PDF layouts eventually support automated consulting deliverables?

Research Ops:

- should Research Ops become the default landing page for researchers?

## Next Implementation Step

The product discovery baseline now supports implementation of the first serious
PostgreSQL-backed operational module:

```text
Research Ops / Data Quality dashboard
```

This should start with read-only queues using the PostgreSQL staging schema and
safe seed data, then evolve into validation actions and assignment workflows.
