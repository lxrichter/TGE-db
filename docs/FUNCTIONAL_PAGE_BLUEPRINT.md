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

## Next Functional Blueprint Step

Next recommended page blueprint:

```text
Projects
```

Reason: project records are the core pipeline entity and need to carry
lifecycle/status, sources, company links, direct-use classification readiness,
validation state, exports, map behavior, and future project-to-asset promotion.
