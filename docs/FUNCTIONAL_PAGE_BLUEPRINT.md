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

## Next Functional Blueprint Step

Next recommended page blueprint:

```text
Sources / Documents
```

Reason: source/evidence structure is foundational for validation, Research Ops,
AI readiness, reports, and future semantic search.
