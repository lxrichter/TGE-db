# Functional Page Blueprint

Date: 2026-05-17

Purpose: define the functional contract for the TGE geothermal intelligence
platform before detailed page-by-page design work begins.

This document distinguishes:

- current implemented functionality
- MVP functional requirements
- proposed future improvements

## Platform Navigation Model

### MVP Top-Level Navigation

Recommended MVP navigation:

- Dashboard
- Research Ops
- Projects
- Plants / Facilities
- Companies
- Countries / Markets
- Map
- Analysis
- Sources / Documents
- Admin

### Default Landing Logic

MVP/future role-based landing behavior:

- Researcher: Research Ops
- Editor / Senior Editor: Research Ops, with Dashboard as an alternative later
- Admin: Dashboard or Admin
- Future commercial/executive role: Dashboard

Reason: the platform is primarily evolving into a research operations and
geothermal intelligence system. Research Ops should be the daily working
environment for missing data, validation queues, source gaps, recent edits, and
approval workflows.

### Navigation Terminology

Use `Plants / Facilities` in the main navigation for MVP.

Terminology by context:

- power asset detail page: Plant
- direct-use asset detail page: Facility
- hybrid or multi-use asset detail page: Plant, Facility, or Complex depending
  on the dominant use case
- backend/semantic model: operating_asset

## MVP Page Inventory

### Dashboard

Executive/high-level overview with KPIs, recent activity, data-quality summary,
market snapshot, and later commercial/intelligence views.

### Research Ops

Daily research operations workspace for queues, missing data, validation,
source gaps, duplicate review, recent edits, assignments, and workflow status.

### Projects

Development pipeline records, including project list, detail page, create/edit,
company links, sources, lifecycle state, validation status, and exports.

### Plants / Facilities

Operating assets, including geothermal power plants and future direct-use
facilities. Supports list, detail, create/edit, capacity/output, operators,
sources, operating status, and exports.

### Companies

Company list, company profile, company relationships, linked projects/assets,
company role management, source records, validation, and exports.

### Countries / Markets

Country and regional intelligence pages. These should combine database-derived
metrics with optional editorial/market intelligence notes.

### Map

Spatial view of projects, plants, and facilities with filters by country,
status, use type, lifecycle phase, and internal draft/approved toggle.

### Analysis

Cross-database analytics workspace for capacity by country, pipeline by phase,
company roles, technology mix, direct-use categories, and data-quality analytics.

### Sources / Documents

Evidence and source management. MVP should be simple but top-level because
source traceability is central to validation, AI readiness, and future reporting.

### Admin

Users, roles, permissions, system settings, and controlled vocabularies.

## Research Ops Functional Blueprint

### Current Implemented Functionality

The current implementation includes:

- read-only PostgreSQL staging preview at `/postgres-preview/research-ops`
- queues for selected data-quality issues
- search/filter controls over staging queue rows
- filters by issue type, severity, entity type, and country
- row-level inspection panel
- updated-by field ready for PostgreSQL user metadata
- no live Hetzner SQLite import
- no write actions against PostgreSQL records yet
- no full PostgreSQL record detail/edit pages yet

The existing SQLite application also has earlier prototype pages and workflows
for projects, plants, companies, maps, analysis, and exports.

### Main Purpose

Research Ops should serve three purposes, with queue/worklist functionality as
the primary focus.

Primary purpose:

- queue/worklist page for getting to individual records that need action

Secondary purposes:

- data-quality dashboard
- operational activity overview
- researcher/editor workflow visibility

Research Ops should help researchers and editors quickly find records that need:

- data updates
- missing fields
- corrections
- sources
- classification
- validation
- approval
- duplicate review

### MVP Operating Model

MVP should remain record-centric:

- a project, plant/facility, company, or source appears in a queue because it has
  an issue
- clicking it takes the user to the relevant record
- filters should cut across entity types instead of creating separate dashboards
  for each entity class

Future:

- support separate task/ticket objects assigned to researchers
- task objects may be linked to records and specific issues

### Primary Users

MVP users:

- researchers
- editors / senior editors
- admins

Future users:

- commercial/subscription managers
- external contributors/reviewers
- client/subscriber users through a separate curated access layer

### MVP Queues

Confirmed MVP queues:

- Needs source
- Needs approval
- Missing country/location
- Missing coordinates
- Missing capacity
- Missing company link
- Missing use type/category
- Missing lifecycle/status
- Direct-use classification needed
- Suspected duplicates
- Needs update/stale record
- Recently edited

Additional MVP queues to include:

- Missing owner/operator
- Missing COD/date
- Missing technology/resource type
- Source/evidence needs validation
- Edited approved records needing re-approval
- Records assigned to me
- Critical issues
- Important issues

### Issue Severity / Priority

MVP should support a simple issue severity model.

Critical:

- missing name
- missing country
- missing lifecycle/status
- missing use type
- missing source/evidence
- duplicate suspected
- broken core relationship

Important:

- missing capacity
- missing coordinates
- missing company link
- missing owner/operator
- missing COD/date
- missing classification
- stale record

Useful / nice to have:

- missing wells
- missing turbine supplier
- missing EPC
- missing investment cost
- missing PPA
- missing technical details

### Filters And Search

MVP filters:

- entity type
- country
- region
- researcher
- status
- use type
- lifecycle phase
- priority/severity
- date edited
- source status

MVP search should cover:

- record name
- aliases / legacy IDs
- country
- company names
- issue labels
- source URLs/titles
- lifecycle/status
- use type/category
- researcher/editor metadata
- internal notes where permission allows

### MVP Row Actions

Researcher actions:

- open record
- edit record
- add source
- add note
- assign to self
- mark ready for validation
- flag duplicate
- change basic workflow status where allowed

Editor-only actions:

- approve
- return to validation
- mark needs update
- mark export ready
- confirm duplicate
- reject duplicate flag

Admin/editor bulk actions:

- bulk assign
- bulk status update
- bulk export
- bulk mark reviewed

MVP should allow lightweight bulk actions:

- assign records
- export selected/filtered records
- mark reviewed
- change status
- add common issue flag

Avoid heavy inline editing in Research Ops for MVP.

### Record Click-Through

MVP behavior:

- clicking a queue row opens the full record detail page
- open in the same tab by default
- users can use normal browser behavior to open in a new tab
- full detail pages should provide edit, source, relationship, validation, and
  approval actions

Later:

- side drawer / detail panel
- inline review drawer
- quick edit panel

### Researcher Tracking

MVP should show operational visibility without turning the tool into a
micromanagement surface.

Visible fields:

- created by
- created date
- last edited by
- last edited date
- assigned to
- reviewed by
- approved by
- approval date
- workflow state
- short change note / edited description

Researcher activity summaries:

- records created
- records edited
- records submitted for validation
- records approved
- sources added
- missing-data issues resolved

Tone: support research quality, workflow coordination, and accountability, not
surveillance.

Later:

- quality review by researcher
- researcher-specific dashboards
- task completion metrics
- source quality metrics
- editor review outcomes
- efficiency/quality indicators for assigning future work

### Recently Edited

MVP:

- show all edits
- filter by entity type
- filter by researcher
- filter by date
- filter by workflow status
- filter by approved/export-ready records
- filter by field category

Later:

- field-level diffs
- before/after comparison
- rollback/version history

### Suspected Duplicates

MVP should support:

- manual duplicate flagging
- lightweight automatic duplicate warnings

Automatic duplicate checks should include:

- similar name
- same/similar country
- same coordinates
- same source URL
- same company website
- similar project/plant group

MVP behavior:

- duplicate detection creates warnings, not hard blocks
- editor/admin confirms or dismisses suspected duplicates

### Sources / Documents Integration

Sources/Documents should be directly integrated into Research Ops queues.

MVP source-related queues:

- records missing source
- records with weak/old source
- source/evidence needing validation
- source added but not reviewed
- project/source link missing
- source URL duplicate
- source linked to wrong entity

This is strategically important because source traceability is central to
validation, AI readiness, and future reporting.

### Exports

MVP Research Ops exports:

- missing data export
- needs source export
- validation queue export
- all filtered queue export
- researcher activity export
- duplicate review export
- stale/needs update export

Export behavior:

- export should respect active filters
- export should preserve stable IDs and relationship fields
- external/client exports must use only approved/export-ready data
- internal exports can later support a draft-data toggle

### AI Readiness

MVP should not include a full AI workflow yet, but data should be structured so
AI can later support Research Ops.

Required AI-ready metadata:

- issue type
- severity
- entity type
- linked record ID
- source status
- validation status
- researcher/editor metadata
- date created/edited/approved
- notes
- source credibility/confidence
- duplicate flags
- stale flags

Later AI use cases:

- Which records are weakest?
- Which projects lack credible sources?
- Summarize missing data for Indonesia.
- Find likely duplicates.
- Suggest records ready for approval.
- Identify stale records.
- Suggest missing company links.
- Suggest direct-use classification.
- Prioritize queues by importance.
- Generate researcher task lists.

### MVP vs Future Summary

MVP:

- record-centric Research Ops dashboard
- unified queues across entities
- entity filters
- issue severity
- manual stale/update flags
- lightweight duplicate warnings
- source/evidence queues
- quick actions
- lightweight bulk actions
- operational activity visibility
- filtered exports

Future:

- separate task/ticket objects
- automated stale detection
- stronger duplicate detection
- side drawer review
- inline editing
- full audit trail/diffs
- researcher quality dashboards
- AI-assisted prioritization
- AI validation suggestions
- automated task assignment

## Sources / Documents Functional Blueprint

### Current Implemented Functionality

The current platform has source/evidence concepts in the PostgreSQL schema and
some existing source/news-related prototype behavior, but Sources / Documents is
not yet a full operational module.

Current limitations:

- source records are not yet a complete user-facing workspace
- document upload/parsing is not yet implemented as a stable workflow
- TGE article linkage is not yet automated from WordPress/RSS/API metadata
- source validation does not yet drive all Research Ops queues
- field-level evidence and structured claims are not yet implemented

### Main Purpose

Sources / Documents should become the evidence backbone of the platform.

It supports:

- validation
- Research Ops
- record approval
- future AI extraction
- semantic search
- related news
- reporting
- client/subscriber confidence

### MVP Source Types

MVP source types:

- tge_article
- external_news_article
- company_website
- company_report
- government_document
- regulator_filing
- press_release
- pdf_report
- academic_paper
- conference_paper_or_presentation
- dataset
- internal_note
- stakeholder_confirmation
- client_confidential_source
- other

ThinkGeoEnergy articles should be a formal source type in MVP.

The platform should prepare for automated linkage to the TGE WordPress/news
archive through RSS, API, tags, metadata, and article body text where possible.

TGE articles should appear as related news on:

- project detail pages
- plant/facility detail pages
- company detail pages
- country/market pages
- source/document detail pages

### Source Link Targets

Sources can link to:

- projects
- plants/facilities
- companies
- countries/markets
- direct-use categories
- company-project relationships
- company-plant/facility relationships
- company-company relationships
- lifecycle/phase changes
- capacity/output values
- ownership/operator claims
- technology/resource claims

MVP linking logic:

- start with record-level source links
- architecturally prepare for field-level evidence later

Examples:

- Source A supports project capacity
- Source B supports owner/operator
- Source C supports COD
- Source D supports project status

### Minimum Source Fields

MVP required fields:

- source title
- source type
- URL or reference
- publication date, if known
- accessed date
- linked entity/entities
- visibility/confidentiality level
- credibility/status label
- source notes
- added by
- added date

Recommended optional fields:

- author/organization
- document/report name
- extracted summary
- relevant quote or data point
- linked field/claim
- language
- country/market relevance
- source file attachment
- duplicate source flag

### Visibility And Confidentiality

MVP visibility/confidentiality tags:

- public
- internal_only
- client_confidential
- not_for_publication
- stakeholder_confirmation
- ai_generated_needs_review

Internal notes, direct confirmations, emails, calls, conference discussions, and
stakeholder comments can count as evidence, but they must be clearly separated
from public sources.

Use source types such as:

- internal_note
- stakeholder_confirmation
- client_confidential_source

Confidential information must not be mixed into public source fields. It should
be visibly flagged and restricted from external/export-ready outputs unless
explicitly approved.

### Source Reusability

A single source must be reusable across multiple records.

Example: one government report or country dataset may support:

- several projects
- several plants/facilities
- a country market page
- capacity statistics
- company roles

### Credibility / Status Labels

MVP labels:

- credible
- needs_review
- weak
- outdated
- rejected

Later:

- numeric confidence score
- field-level confidence
- source hierarchy weighting
- automated stale-source detection

### Uploaded PDFs / Documents

MVP:

- URL/source records are core
- basic file attachment/upload can be included if easy, especially because many
  geothermal sources are PDF reports

Later/future:

- full document library
- PDF parsing
- OCR where needed
- AI extraction
- semantic search
- entity recognition
- evidence/claim extraction

### Source Validation

Researchers can:

- add sources
- link sources to records
- add notes
- mark source as needs_review

Editors can:

- mark source as credible
- mark source as weak
- mark source as outdated
- reject source
- approve source for export/report use

Admins can:

- manage source types
- manage visibility/confidentiality levels
- override validation status
- delete/archive sources if needed

Source validation should feed into Research Ops queues:

- records missing source
- weak source
- outdated source
- source needs review
- source linked but not approved
- confidential source attached
- source duplicate suspected

### Related News

TGE articles should be linked automatically or semi-automatically where possible.

Related news should appear on:

- project detail pages
- plant/facility detail pages
- company detail pages
- country/market pages
- source/document pages

Potential matching logic:

- project/plant/company name
- aliases
- country
- tags
- categories
- WordPress metadata
- article body text
- manual confirmation

### AI Readiness

MVP should structure sources so AI can later perform:

- extraction
- summarization
- semantic search
- entity matching
- field suggestion
- duplicate source detection
- confidence scoring
- conflicting claim detection
- related news matching
- source quality review
- automated research briefs

### Future Source / Claim Model

Eventually, sources should support structured claims.

Examples:

- Source X says Project Y has 35 MW planned capacity
- Source Y says Company Z is operator
- Source Z says COD is 2027

This is not required for MVP, but the architecture should not block it.

### MVP vs Future Summary

MVP:

- source records
- source types
- visibility/confidentiality tags
- record-level source linking
- reusable sources
- TGE articles as source type
- related news linkage foundation
- basic credibility/status labels
- Research Ops source queues
- basic attachments if feasible

Future:

- field-level evidence
- structured claims
- uploaded document library
- AI extraction
- semantic source search
- WordPress/RSS/API integration
- automatic related news matching
- source confidence scoring
- duplicate source detection
- conflicting source detection
- automated briefing/report support

## Projects Functional Blueprint

### Main Purpose

Projects are the core pipeline entity. They represent geothermal developments
that are not yet operating, including:

- early prospects
- exploration areas
- field development projects
- expansions
- refurbishments
- hybrid developments
- projects under construction

Projects connect to:

- sources/evidence
- companies/roles
- lifecycle phases
- maps
- country/market pages
- Research Ops
- validation workflow
- exports
- promotion into Plants / Facilities

### Current Implemented Functionality

The current platform already has project list/detail/edit workflows in the
SQLite prototype and project records in the PostgreSQL schema baseline.

Current limitations:

- PostgreSQL project detail/edit pages are not yet fully implemented
- promotion to the future operating asset model needs to be hardened
- project source/evidence handling is not yet the full Sources / Documents model
- direct-use and hybrid project forms need adaptive sections
- field-level evidence and capacity claim history are not implemented yet

### Minimum Required Fields

MVP minimum required fields for creating a project:

- project name
- country
- lifecycle phase/status
- geothermal use type: power, direct-use, hybrid, unknown
- source/evidence note or source placeholder
- created_by / created_at

Strongly recommended at creation:

- project group / field group
- region
- location description
- linked company, if known
- capacity or potential capacity, if known
- notes

A project should be allowed to exist without capacity, especially for:

- Prospect / TBD
- Exploration

Early projects often only have potential capacity ranges, not planned installed
capacity.

### Lifecycle / Status Values

Use the existing TGE lifecycle structure.

MVP project phases:

- Prospect / TBD
- Exploration
- Pre-Feasibility
- Feasibility
- Construction
- Cancelled

Operating is not a project phase for active project tables. Once commissioned,
the asset is promoted/copied into Plants / Facilities and the original project
remains historically linked but should not be counted in active project pipeline
totals.

Cancelled projects should remain visible and searchable because geothermal
history, failed projects, and discontinued developments are important for market
intelligence.

Additional statuses should be metadata/tags/notes in MVP rather than core
lifecycle phases:

- permitting
- financing
- stalled
- on hold
- delayed
- repowering
- refurbishment
- expansion

### Capacity Logic

MVP capacity fields should distinguish:

- potential_capacity_min_mw
- potential_capacity_max_mw
- planned_installed_capacity_mw

Current logic:

- for Prospect / TBD and early Exploration, use potential capacity min/max where
  available
- keep planned installed capacity empty if there is no concrete project capacity
  yet
- once a project moves into more concrete development, planned installed
  capacity should be added
- planned installed capacity is used for project pipeline MW summary charts by
  lifecycle phase
- when promoted to Plant / Facility, planned installed capacity can become
  installed capacity or feed into the operating asset record

Later:

- announced capacity
- estimated capacity
- approved capacity
- capacity confidence
- capacity source/claim history

### Form Structure By Use Type

Use one shared core project form with adaptive sections by use type.

Shared core sections:

- identity/naming
- location
- lifecycle/status
- use type/classification
- capacity/output
- companies/roles
- sources/evidence
- internal notes
- validation/review

Power-specific fields:

- planned installed capacity MWe
- resource type
- plant technology
- turbine technology
- grid/PPA notes
- planned COD
- wellfield data

Direct-use-specific fields:

- thermal capacity MWth
- annual heat supply GWhth
- annual cooling supply GWhc, if relevant
- direct-use category
- district heating/cooling flag
- heat pump assisted flag
- offtaker/end-use sector
- facility/network type

Hybrid-specific fields:

- allow both power and direct-use fields
- support multiple use-type tags
- show in both power and direct-use views
- later allow linked sub-assets

Hybrid projects should be represented as one hybrid project entity first,
visible across relevant views/tables. Later, linked sub-assets may be added if
the system needs more detail.

### Project Company Roles

MVP project company roles:

- developer
- owner
- operator
- investor
- financier
- resource_owner
- concession_holder
- utility_offtaker
- heat_offtaker
- industrial_host
- drilling_contractor
- epc_contractor
- engineering_consultant
- technology_supplier
- equipment_supplier
- municipality
- government_public_agency
- research_institution
- other

Direct-use-specific roles:

- district_heating_operator
- district_cooling_operator
- greenhouse_operator
- building_owner
- heat_pump_supplier
- cooling_offtaker

MVP should track current relationships.

Later:

- historical company relationships
- ownership changes
- role timelines

### Approval / Export Readiness

Critical approval/export fields:

- project name
- country
- lifecycle phase/status
- use type
- at least one source/evidence record
- validation status
- duplicate check completed

Important but not always mandatory:

- planned installed capacity or potential capacity
- project group / field group
- linked company
- coordinates
- region
- location description
- source confidence
- notes explaining missing data

Approval rule:

- all critical fields should be present
- important fields may be missing if flagged clearly and editor override/reason
  is recorded

Export-ready rule:

- credible source exists
- no unresolved critical missing-data issues
- no unresolved duplicate warning
- approved validation status

### Promotion Into Plants / Facilities

Projects must have a promotion workflow into Plants / Facilities.

Promotion behavior:

- non-destructive
- project is copied/promoted into a new Plant / Facility record
- original project remains historically linked
- promoted project should no longer count toward active project pipeline MW totals
- promoted project should not appear in the default active project table unless
  filtered/searched
- promoted project remains searchable and visible on historical/detail pages
- new Plant / Facility record receives operating asset fields

Promotion should preserve:

- original project ID
- new plant/facility ID
- promotion date
- promoted_by
- source/evidence
- linked companies
- capacity history
- notes
- project group / field group
- relationship to originating project

The platform must also support expansions, retirements, refurbishments, and
unit-level changes.

MVP:

- allow project records for expansions/additions
- link expansion project to existing plant/field/project group
- promote expansion into a new plant/facility/unit record when commissioned

Future:

- explicit unit-level operating asset model
- capacity addition/retirement events
- refurbishment/repowering events
- historical operating capacity timeline by plant group/geothermal field
- clear tracking of units taken offline, retired, replaced, or added
- ability to understand historical field-level installed/running capacity over
  time

### Project Detail Page

MVP project detail page should become one of the main intelligence views for
each project.

Header/profile section:

- project name
- project ID
- country/region
- location
- lifecycle phase
- use type
- validation/review status
- key tags
- quick actions

Key metrics:

- potential min/max MW
- planned installed capacity MW
- thermal capacity MWth if direct-use
- planned COD if known
- linked companies
- source count
- missing-data flags

Sections/tabs:

- overview
- location
- lifecycle/timeline
- capacity/output
- resource/technology
- direct-use classification, if relevant
- wellfield data, if relevant
- companies/roles
- sources/evidence
- related TGE news
- activity/research notes
- validation/review
- linked plants/facilities if promoted
- related projects/expansions in same project group/field group

The project detail page should include:

- related TGE news/articles
- related external sources
- linked companies
- development timeline/activity feed
- missing data warnings
- source/evidence panel
- map/location preview
- promotion status

### Project Exports / Print Views

MVP exports:

- all projects export
- filtered projects export
- active pipeline export
- missing data project export
- validation queue export
- country project export
- company-linked project export
- direct-use project export
- hybrid project export

MVP print/PDF-like views:

- project profile
- project validation sheet
- project source/evidence sheet
- country project list
- company project portfolio
- project pipeline summary

Later:

- investor-style project brief
- project history/timeline export
- source confidence report
- field/group-level project portfolio
- automated project profile PDF
- AI-generated project summary

### MVP vs Future Summary

MVP:

- shared project structure
- core lifecycle phases
- potential min/max and planned capacity distinction
- adaptive fields by use type
- company relationship links
- source/evidence links
- Research Ops validation flags
- project detail page
- basic promotion into Plants / Facilities
- support expansion projects linked to existing groups/assets
- exports and print profiles

Future:

- field-level evidence
- unit-level asset model
- capacity addition/retirement/refurbishment events
- historical capacity timeline
- polygons/concession areas
- historical company relationships
- AI project summaries
- automated related news/entity matching
- advanced project-to-asset/sub-asset relationships

## Plants / Facilities Functional Blueprint

### Main Concept

Backend concept:

```text
operating_asset
```

UI label:

```text
Plants / Facilities
```

A Plant / Facility is a commissioned or operating geothermal asset, including:

- geothermal power plant
- specific operating unit
- direct-use facility
- district heating system
- district cooling system
- industrial heat facility
- hybrid power/heat/mineral complex
- retired/decommissioned unit or facility, if historically relevant

### Current Implemented Functionality

The current platform already has plant list/detail/edit workflows in the SQLite
prototype and operating asset records in the PostgreSQL schema baseline.

Current limitations:

- PostgreSQL-backed Plant / Facility detail/edit pages are not yet fully
  implemented
- direct-use facility handling needs to be expanded beyond the historic power
  plant focus
- unit-level modeling is not yet explicit
- capacity events, refurbishments, retirements, and repowering are not yet fully
  structured
- active operating capacity calculations need clear rules for retired/offline
  records

### Minimum Required Fields

MVP minimum required fields:

- asset name
- country
- operating status
- use type: power, direct-use, hybrid, mineral, unknown
- installed capacity or capacity unknown flag
- current/running capacity or operating capacity where known
- source/evidence placeholder
- created_by / created_at

Strongly recommended:

- plant/facility group
- field group
- region
- coordinates
- COD/commissioning year
- operator/owner link
- technology
- resource type
- notes

Source rule:

- source is not mandatory for draft creation
- source is required for approval/export-ready status

### Operating Status Values

MVP operating status values:

- Operating
- Partially operating
- Temporarily offline
- Retired / Decommissioned
- Under refurbishment
- Unknown

Later:

- repowered
- mothballed
- seasonal operation
- test operation
- standby
- under expansion

### Form Structure By Use Type

Use the same operating asset entity with adaptive sections by use type.

Power fields:

- installed_capacity_mwe
- running_capacity_mwe
- gross/net capacity, if available
- plant technology: flash, binary, dry steam, combined cycle, hybrid
- turbine supplier
- number of units
- COD
- generation GWh, if available

Direct-use fields:

- thermal_capacity_mwth
- annual_heat_supply_gwhth
- annual_cooling_supply_gwhc
- direct-use category
- district heating/cooling flag
- heat pump assisted flag
- end-use/offtaker
- facility/network type

Hybrid/mineral fields:

- allow multiple use types on one asset
- one asset may appear in power, direct-use, and mineral table views
- power, heat, cooling, and mineral values should remain separately trackable
- future linked sub-assets may be added if needed

### Capacity Representation

MVP capacity fields:

- installed_capacity_mwe
- running_capacity_mwe
- thermal_capacity_mwth
- annual_heat_supply_gwhth
- annual_cooling_supply_gwhc
- capacity_status / confidence note
- capacity_notes

Default operating capacity calculations should use current/running capacity
where available.

Retired/decommissioned capacity should remain visible and searchable, but should
be excluded from default active operating capacity totals.

Future capacity fields:

- retired_capacity_mwe
- retired_capacity_mwth
- gross_capacity_mwe
- net_capacity_mwe
- capacity_event_type
- capacity_event_date
- capacity_change_mw
- capacity_event_source
- historical capacity timeline

### Expansions, Units, Retirements, Refurbishments, Repowering

MVP:

- one row per meaningful operating asset/unit where analytically relevant
- use plant_group / field_group to connect related units/assets
- create separate records where units have distinct COD, capacity, technology,
  supplier, status, or ownership/operator relevance
- use notes/timeline for capacity changes, retirement, refurbishment, or
  repowering if not yet structurally modeled
- retired/offline units remain visible/searchable but excluded from default
  operating totals

Some plants have multiple units with different turbine suppliers and
technologies, such as Ormat vs Fuji or binary vs flash. MVP must support
separate unit records when this matters analytically.

Future:

- explicit unit model
- capacity event model
- refurbishment/repowering event model
- retirement/offline event model
- historical operating capacity timeline by plant group/geothermal field
- clearer view of additions, retirements, replacements, and refurbishments over
  time

### Plant / Facility Company Roles

MVP company roles for Plants / Facilities:

- owner
- operator
- developer
- investor
- financier
- resource_owner
- plant_operator
- district_heating_operator
- district_cooling_operator
- industrial_host
- heat_offtaker
- cooling_offtaker
- utility_offtaker
- turbine_supplier
- technology_supplier
- equipment_supplier
- epc_contractor
- drilling_contractor
- engineering_consultant
- o_and_m_contractor
- municipality
- government_public_agency
- research_institution
- other

### Plant / Facility Detail Page

MVP Plant / Facility detail page should show:

Header/profile:

- asset name
- asset ID
- country/region/location
- coordinates
- operating status
- use type
- validation status
- quick actions

Key metrics:

- installed capacity
- running/current capacity
- thermal/cooling capacity, if relevant
- COD
- technology
- resource type
- operator/owner
- source count
- missing-data flags

Sections/tabs:

- overview
- location/map
- capacity & operating status
- capacity history / events
- units
- resource & technology
- wellfield data
- direct-use classification, if relevant
- companies/roles
- sources/evidence
- related TGE news
- activity/research notes
- validation/review
- linked originating project
- related units/assets in same plant_group / field_group

MVP should include a simple capacity history/timeline section using notes/events.
Future should make capacity events fully structured.

### Exports / Print Views

MVP exports:

- all plants/facilities export
- filtered export
- power plants export
- direct-use facilities export
- hybrid/mineral assets export
- country operating assets export
- company-linked assets export
- missing data export
- validation queue export
- retired/decommissioned assets export

MVP print/PDF-like views:

- plant/facility profile
- unit profile
- plant group / field group profile
- company asset portfolio
- country operating asset list
- validation/source sheet
- capacity history sheet

### MVP vs Future Summary

MVP:

- shared operating asset entity
- UI label Plants / Facilities
- adaptive fields by use type
- installed + running/current capacity
- separate unit records where analytically important
- plant_group / field_group linkage
- retired/offline records visible but filtered out from active totals
- basic capacity history/timeline notes
- company links
- source links
- exports and print profiles

Future:

- explicit unit model
- capacity event model
- retirement/refurbishment/repowering events
- historical field-level capacity timelines
- advanced asset hierarchy
- field/group-level analytics
- AI-assisted operating history summaries

## Companies Functional Blueprint

### Main Concept

The company model should distinguish between:

1. Company Group

   Analytical umbrella/group structure.

2. Company

   Actual legal entity, subsidiary, SPV, operator, supplier, investor,
   institution, or other market actor.

3. Relationship Role

   The role a company plays in a specific project, plant/facility, market, or
   relationship.

Company type/category and company relationship role must remain separate.

Example:

- primary company type: Utility / IPP
- secondary categories: Operator, Owner
- relationship role on Project X: Developer
- relationship role on Plant Y: Operator

This separation is critical for:

- ownership analysis
- operator analysis
- market share analysis
- avoiding duplicated logic
- future AI/semantic graph relationships

### Current Implemented Functionality

The current platform already has company list/detail/edit workflows in the
SQLite prototype and company/relationship tables in the PostgreSQL schema
baseline.

Current limitations:

- company group logic needs to become more explicit
- company type/category and relationship role must be kept cleanly separated
- historical ownership and role timelines are not yet implemented
- company intelligence summaries need to be calculated from structured links
- duplicate company detection needs to be expanded

### Company Categories

MVP should support:

- one primary company category
- multiple secondary company categories
- controlled vocabularies only
- no uncontrolled tagging

Primary company categories (`company_type_primary`):

- Resource owner
- Portfolio developer
- Technology developer
- Hybrid developer + technology
- Utility / IPP
- OEM / supplier
- Service provider
- Drilling company
- EPC contractor
- Investment firm
- Energy major
- Public / development institution
- Association / industry body
- Advocacy / non-profit

Primary category should represent the company’s dominant strategic identity in
the geothermal sector.

Secondary company categories (`company_type_secondary`):

Development / ownership:

- Developer
- Operator
- Owner
- Investor
- Licensor

Financial/investment:

- Private equity
- Venture capital
- Infrastructure investor
- Development finance institution
- Commercial bank
- Institutional investor
- Family office
- Mezzanine finance
- Export credit agency

Exploration / subsurface:

- Geology services
- Geophysics services
- Geochemistry services
- Seismic services
- Reservoir engineering
- Exploration services

Drilling & wells:

- Drilling contractor
- Drilling engineering
- Drilling services
- Well services
- Cementing services
- Casing supplier
- Well testing

Engineering & construction:

- Engineering consultant
- Project management
- Construction contractor
- O&M services

Equipment & technology:

- Turbine supplier
- Binary technology
- Steam technology
- Control systems
- Electrical systems
- Surface equipment
- Valves and piping
- Cooling systems

Software & digital:

- Software provider
- Data services
- Reservoir modelling software

Consulting & advisory:

- Business consulting
- Market intelligence
- Strategy consulting
- Transaction advisory
- Legal services
- Regulatory advisory
- Project structuring

Communications & media:

- Communications
- Public relations
- Marketing
- Branding
- Media services
- Content creation

Industry & policy:

- Industry association
- Policy advocacy
- Market development
- Industry promotion
- Stakeholder engagement
- Lobbying
- Government relations

Secondary categories should support:

- filtering
- analytics
- company intelligence
- future AI classification
- market ecosystem mapping

### Minimum Required Fields

MVP minimum required fields:

- company name
- primary company category
- created_by / created_at

Strongly recommended:

- HQ country
- website
- company group if known
- source/evidence placeholder
- status: active, inactive, acquired, unknown
- notes

Optional but useful:

- short name
- legal name
- ownership type
- listed status
- ticker
- exchange
- geothermal focus
- technology focus
- regions active
- operating markets

### Company Relationships

MVP company relationships:

- parent company
- subsidiary
- affiliate
- joint venture
- consortium
- owner/shareholder
- acquired by
- merged with
- partner
- SPV / project company

Support `ownership_share_percent` from MVP because ownership analysis is already
being implemented and is strategically important.

MVP relationship fields:

- relationship type
- related company
- ownership_share_percent, optional
- current/effective flag
- source/evidence
- notes

MVP should focus on current relationships.

Future:

- historical ownership timelines
- relationship start/end dates
- transaction history
- ultimate parent calculations
- ownership confidence scoring
- consolidation logic

### Company Roles Across Projects And Assets

Company roles must be structured relationship records, not text fields.

Role vocabulary:

Ownership & Leadership:

- Owner
- Operator
- Developer
- Co-Developer
- Resource Owner

Finance & Commercial:

- Project Sponsor
- Equity Investor
- Debt Provider
- Project Finance Lender
- Grant Provider
- Offtaker
- Financial Advisor

Drilling & Wells:

- Drilling Contractor
- Drilling Engineering
- Well Services
- Cementing Services
- Well Testing
- Casing Supplier

EPC & Construction:

- EPC Contractor
- Construction Contractor
- Balance of Plant Contractor

Engineering & Consulting:

- Engineering Consultant
- Owner's Engineer
- Technical Advisor
- Environmental Consultant
- Regulatory Advisor
- Project Management

Equipment & Technology:

- Turbine Supplier
- Binary Technology Provider
- Steam Technology Provider
- Control Systems Supplier
- Electrical Systems Supplier
- Surface Equipment Supplier
- Valves & Piping Supplier
- Cooling System Supplier
- Software Provider
- Data Services Provider
- Reservoir Modelling Provider
- Technology Licensor

Operations & Maintenance:

- O&M Contractor
- Asset Manager

Policy / Ecosystem / Other:

- Industry Association
- Advocacy Organization
- Government Agency
- Research Organization
- Other

Role metadata should support:

- role_group
- priority_class
- role_score
- ownership_share_percent where relevant
- source/evidence
- notes

Display logic:

Company profiles should show:

- linked projects by role
- linked plants/facilities by role
- countries active
- MW linked as owner/operator/developer where possible
- role counts
- source/evidence for major relationships

A company may have different roles on different records.

### Company Market / Activity Summaries

Company profiles should include calculated intelligence summaries.

MVP summaries:

- linked projects
- linked plants/facilities
- countries active
- regions active
- operating MW linked
- pipeline MW linked
- roles held
- technology exposure
- direct-use/mineral involvement
- source count
- latest activity
- validation status
- related TGE news

Calculated summaries should be clearly separated from:

- manually written notes
- editorial descriptions
- internal intelligence notes

Internal company intelligence notes should remain internal-only.

### Company Detail Page

MVP company detail page should include:

Header/profile:

- company name
- company ID
- primary category
- secondary categories
- HQ country/location
- website
- status
- validation status
- quick actions

Key summary cards:

- linked projects
- linked plants/facilities
- countries active
- linked MW
- operating MW
- pipeline MW
- source count
- missing-data flags

Core sections/tabs:

- company overview
- categories & geothermal focus
- linked projects
- linked plants/facilities
- roles & capabilities
- company relationships/group structure
- ownership/shareholdings
- countries/markets active
- sources/evidence
- related TGE news
- internal notes
- validation/review
- activity/history

Relationship section should show:

- parent company
- subsidiaries
- affiliates
- JV/consortium relationships
- ownership/share percentages
- source/evidence
- notes

Internal-only sections:

- strategic observations
- ownership uncertainty
- source uncertainty
- confidential notes
- client-related notes
- research comments

These must remain separated from exportable/public profile information.

### Exports / Print Views

MVP exports:

- all companies export
- filtered companies export
- company roles export
- company-project relationship export
- company-plant/facility relationship export
- ownership/shareholding export
- company group export
- company missing-data export
- validation queue export
- country/company activity export

MVP print/PDF-like views:

- company profile
- company project portfolio
- company plant/facility portfolio
- company relationship/ownership sheet
- company country activity sheet
- validation/source sheet

Later:

- investor-style company briefing
- market positioning report
- ownership structure report
- company activity timeline
- AI-generated company summary
- competitive landscape report

### Design / Data Integrity Principles

Avoid:

- duplicated company records
- duplicated role logic
- text-based ownership logic
- uncontrolled tags/categories

Use:

- one company record per legal entity
- one company group layer
- controlled category vocabularies
- structured relationship records
- structured role tables
- reusable source/evidence linkage

This becomes foundational for:

- ownership analysis
- operator analysis
- market ecosystem mapping
- company intelligence
- AI semantic relationships
- future investor/subscriber products

### MVP vs Future Summary

MVP:

- company records
- company groups
- controlled primary/secondary categories
- current company relationships
- structured company roles
- ownership_share_percent support
- linked projects/plants/facilities
- source/evidence linkage
- related TGE news
- calculated activity summaries
- exports and print profiles
- internal notes separated from public/exportable data

Future:

- historical ownership timelines
- relationship timelines
- acquisition history
- market share analytics
- advanced ownership consolidation
- company intelligence scoring
- semantic company graph
- duplicate company detection
- investor/company intelligence layer
- AI-assisted company summaries
- automated portfolio analysis
- external/subscriber-ready company profiles

## Countries / Markets Functional Blueprint

### Main Concept

Countries / Markets should become one of the highest-value intelligence layers
of the platform.

The country/market layer should combine:

- database-derived analytics
- editorial market intelligence
- validation-aware structured data
- future AI-generated market briefing capability

The approach should be a strong hybrid:

- structured data and analytics first
- editorial intelligence layered on top

This aligns with ThinkGeoEnergy’s role as:

- geothermal intelligence provider
- editorial/media platform
- consulting/research organization

### Current Implemented Functionality

The current platform already has prototype Markets/Countries pages and
database-derived analysis surfaces.

Current limitations:

- country market pages are not yet the full intelligence layer described here
- editorial market notes need to be cleanly separated from structured analytics
- approved/export-ready market totals need clearer handling
- internal draft-aware totals need explicit toggles and labels
- regional pages need a shared aggregation logic
- market-report/export workflows are not yet complete

### Primary Functions

Country pages should primarily:

- provide structured geothermal market overview
- aggregate projects, plants/facilities, companies, and market activity
- support market intelligence and consulting
- support export/report generation
- support future AI market briefings
- act as a market dashboard for a country or region

Country pages should summarize:

- operating market status
- pipeline/development status
- direct-use activity
- company activity
- technology/resource mix
- drilling/construction activity
- editorial commentary and market intelligence notes

Country pages must support slight editorial override capability where official
market numbers differ from strictly database-derived totals.

Examples of official/editorial reporting conventions:

- official government reporting
- IGA/TGE reporting convention
- editorially adjusted market interpretation

This matters for:

- annual global/top 10 reports
- market comparison
- strategic consulting outputs

### Header And Summary Cards

Country header should show:

- country name
- region
- World Bank region
- geothermal market status tag
- map/location visual
- latest market update
- validation/export-ready status

MVP market status tags:

- emerging market
- active development market
- mature market
- policy-driven growth market
- drilling-active market
- stalled market
- direct-use dominant market
- hybrid market
- unknown

MVP summary cards:

- installed operating capacity MWe
- running/operating capacity MWe
- direct-use thermal capacity MWth
- annual heat supply GWhth where available
- project pipeline MW
- number of operating plants/facilities
- number of active projects
- number of companies active
- direct-use project count
- hybrid/mineral project count
- drilling activity count if available
- latest market activity date
- source coverage/validation indicators

Summary cards should distinguish:

- approved/export-ready data
- internal draft-aware data where permitted

### Sections / Tabs

MVP sections/tabs:

#### Overview

- editorial market summary
- headline market metrics
- key market status
- recent developments

#### Projects

- project table
- pipeline MW
- lifecycle breakdown
- project map integration

#### Plants / Facilities

- operating asset table
- operating capacity
- direct-use facilities
- retired/decommissioned assets if enabled

#### Companies

- active companies
- owners/operators
- developers
- suppliers
- investors
- ecosystem participants

#### Market Analysis

- charts
- lifecycle analysis
- technology mix
- direct-use breakdown
- company role analysis

#### Map

- projects
- plants/facilities
- direct-use facilities
- hybrid/mineral assets
- clustering/filtering

#### Policy & Market Notes

- regulatory overview
- permitting notes
- geothermal strategy
- funding/tenders
- major policy developments
- market barriers/opportunities

#### Sources & Related News

- related TGE articles
- key reports/documents
- source/evidence overview
- latest market updates

#### Internal Notes

Restricted section for:

- internal market assessment
- research gaps
- validation concerns
- client-sensitive notes
- editorial notes

#### Validation & Metadata

- source coverage
- approval/export readiness
- missing-data issues
- last reviewed date
- last updated by

### Editorial / Market Intelligence Notes

MVP editorial/market intelligence notes:

- market overview
- market maturity assessment
- development momentum
- regulatory environment
- drilling activity commentary
- financing environment
- utility/public sector involvement
- direct-use market status
- major projects
- major stakeholders
- bottlenecks/challenges
- investment outlook
- market opportunities

Internal-only notes:

- strategic observations
- data concerns
- validation uncertainty
- stakeholder commentary
- client-sensitive intelligence

Editorial notes and structured analytics must remain clearly separated.

### MVP Charts, Tables, And Maps

MVP charts:

- installed capacity by year
- operating vs pipeline capacity
- pipeline by lifecycle phase
- direct-use by category
- technology mix
- company role distribution
- projects by status
- operating assets by technology
- drilling activity summary if available

MVP tables:

- projects table
- plants/facilities table
- companies table
- direct-use assets table
- source/news table

MVP maps:

- operating plants/facilities
- projects
- direct-use facilities
- hybrid/mineral assets
- clustering/grouping
- approved-only toggle
- internal draft toggle for editors/admins

Charts should be:

- database-derived by default
- able to support editorial notes/callouts
- expandable later

### Draft vs Approved / Export-Ready Data

Default public/export-ready view:

- approved/export-ready records only

Internal/editor/admin toggle:

- include draft/internal records
- include validation-warning records
- include unapproved/internal notes

Country-level totals and charts should clearly distinguish:

- approved market numbers
- internal draft-aware numbers

Research/admin users should be able to:

- compare approved vs internal totals
- identify missing-data impact
- see validation coverage

### Exports / Print Views

MVP exports:

- country market export
- project export by country
- plant/facility export by country
- company activity export by country
- direct-use export
- lifecycle/pipeline export
- validation/missing-data export
- source export

MVP print/PDF-like views:

- country market profile
- country pipeline summary
- country operating asset profile
- company activity summary
- market intelligence briefing
- validation/research sheet

Future:

- investor-style market report
- automated country report generation
- AI-generated market briefings
- consulting-ready export packages
- subscriber-ready market intelligence PDFs

### Regional Pages

Regional pages should exist in MVP.

MVP regional pages:

- derived from country aggregation logic
- use the same metrics and charts where possible
- allow regional project/asset/company/source tables
- support regional market notes where available

Future:

- dedicated editorial/regional intelligence pages
- cross-country benchmarking
- regional consulting outputs

### MVP vs Future Summary

MVP:

- hybrid analytics + editorial structure
- country and regional market pages
- approved/export-ready market metrics
- internal/draft-aware toggle
- operating + pipeline summaries
- direct-use/mineral visibility
- company ecosystem visibility
- charts/tables/maps
- editorial market notes
- policy/regulatory notes
- related TGE news integration
- exports and print profiles

Future:

- AI-generated country briefings
- semantic market intelligence search
- market maturity scoring
- investment attractiveness scoring
- automated trend detection
- geothermal market forecasting
- policy monitoring
- tender/funding tracking
- drilling activity intelligence
- cross-country benchmarking
- consulting/report generation automation
- subscriber-facing intelligence products

### Strategic Principle

Country/Market pages should become:

- one of the core consulting outputs
- one of the core report-generation layers
- one of the strongest AI briefing foundations
- one of the strongest subscriber intelligence products

The market layer should unify:

- projects
- plants/facilities
- companies
- sources
- editorial intelligence
- validation logic
- analytics
- maps
- future AI capabilities

into a single geothermal market intelligence view.

## Map Functional Blueprint

### Main Purpose

The map should be both:

1. a navigation/search tool
2. a spatial market intelligence tool

MVP should prioritize:

- finding projects/plants/facilities geographically
- filtering by country, region, lifecycle, use type, technology, resource type,
  turbine type, company, and status
- supporting screenshots/exports of filtered map states for presentations and
  reports

### Current Implemented Functionality

The current platform already has a prototype map view and grouped map logic.

Current limitations:

- the map is not yet fully aligned with the future PostgreSQL operating asset
  model
- direct-use, hybrid, and mineral/lithium layers need to be formalized
- map exports/print states are not yet mature
- marker click-through should eventually connect to PostgreSQL-backed record
  detail pages
- missing-coordinate workflow needs tight integration with Research Ops

### MVP Layers

MVP layers:

- power plants
- power projects
- direct-use facilities
- direct-use projects
- hybrid assets/projects
- mineral/lithium-related assets/projects
- grouped/clustered markers
- individual markers at local zoom levels

Default behavior:

- clustered/grouped markers by default for usability and performance
- individual records visible when zoomed in or when the user switches to
  record-level view

### Filters / Toggles

MVP filters/toggles:

- country
- region
- use type: power, direct-use, hybrid, mineral
- project vs plant/facility
- lifecycle phase
- operating status
- technology type
- resource type
- turbine/plant technology
- company/operator/developer
- approved/export-ready only
- internal draft toggle for researchers/editors/admins
- missing coordinates queue link

### Visual Distinction

MVP visual logic:

- color should indicate lifecycle/status where possible
- icon/shape may indicate asset type if design allows
- avoid visual overload
- filters should do most of the analytical work

### Missing Coordinates

Records with missing coordinates should not appear as fake or country-centroid
markers on the main map.

MVP behavior:

- only show records with usable coordinates
- records missing coordinates appear in Research Ops / missing coordinates queue
- no fake country-centroid markers in the main map

Future:

- optional approximate-location mode may be considered, clearly labelled as
  approximate

### Marker Click Behavior

MVP marker click should open a minimalist popup showing:

- project/plant/facility name
- country
- lifecycle phase or operating status
- installed/planned capacity
- use type
- link to full record page

Future:

- side intelligence panel
- inline quick actions
- source/validation preview

### Country / Market Integration

Country/market pages should embed filtered maps for that country/region.

Embedded maps should inherit relevant context:

- country/region filter
- approved/export-ready default view
- internal draft toggle for permitted users
- relevant project/asset/direct-use/hybrid layers

### Exports / Print

MVP should support:

- screenshots / printable filtered map states
- export current filtered map view
- map image for reports/presentations where feasible
- filtered record export from map view

Future:

- presentation-quality map exports
- consulting/report map templates
- map layers for concessions/polygons
- transmission/pipeline/geology overlays
- heatmaps
- spatial clustering analytics
- AI-generated map summaries

### MVP vs Future Summary

MVP:

- map as navigation + intelligence view
- clustered default map
- individual markers at local zoom
- separate toggles/layers for power, direct-use, hybrid, mineral
- strong filters
- approved/default view + internal draft toggle
- only coordinate-confirmed records shown
- minimalist marker popup + full-page link
- screenshots/filtered views for reporting

Future:

- side panel
- polygons/concession areas
- geological/resource overlays
- transmission/district heating network overlays
- heatmaps
- advanced spatial analytics
- report-quality map generator
- AI spatial intelligence

## Next Functional Blueprint Step

Next recommended page blueprint:

```text
Analysis
```

Reason: Analysis turns the relational core into cross-database analytics,
charts, comparison views, direct-use breakdowns, company role analytics,
data-quality analytics, and future BI-style intelligence surfaces.
