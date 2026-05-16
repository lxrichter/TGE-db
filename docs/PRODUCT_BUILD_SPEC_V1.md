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

## Next Discovery Step

Step 2 should define validation and research operations:

- required fields
- missing-data flags
- validation queues
- assignment
- review states
- researcher/editor dashboards
- export readiness rules
