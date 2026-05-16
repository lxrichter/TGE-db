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

## Next Discovery Step

Step 3 should define data entry forms and workflow:

- project form structure
- operating asset/plant/facility form structure
- company form structure
- source/evidence capture
- edit flow
- submit-for-validation flow
- approval screens
- duplicate handling
- mobile usability for data entry
