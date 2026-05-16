# MVP Scope v1

Date: 2026-05-16

Purpose: define the first serious internal platform target, based on the platform vision and prototype audit.

## MVP Objective

Build a stable internal geothermal intelligence database platform for ThinkGeoEnergy staff to enter, verify, manage, analyze, and export structured data about geothermal projects, plants, companies, and their relationships.

The MVP should be Railway-ready and designed for PostgreSQL. The semantic model should support both geothermal power and direct-use geothermal from the start, even if the first operational dataset remains power-heavy. The MVP does not need to include the full subscriber product, AI layer, or article/PDF source registry on day one.

## Primary Users

- administrator
- editor
- reviewer
- analyst
- internal viewer

Subscriber users are future scope unless a commercial pilot requires them earlier.

## Core Entity Scope

MVP entities:

- projects
- plants
- geothermal use classifications
- direct-use categories
- companies
- company-project links
- company-plant links
- company relationships
- users
- review/audit records

Later entities:

- article registry
- PDF/report registry
- source citations
- subscriber accounts
- subscription plans
- saved views/alerts
- AI extraction jobs

## Core Functional Scope

In scope:

- secure login
- user roles and permissions
- project list/detail/create/edit
- plant list/detail/create/edit
- power vs direct-use classification
- company list/detail/create/edit
- relationship/link management
- project-to-plant lifecycle/promotion logic
- internal review queue
- approval workflow
- basic audit trail
- search and filters
- maps for plants/projects
- basic country/region/market views
- Excel export for internal users
- PostgreSQL-backed database design
- Railway deployment baseline

Out of scope for MVP:

- public subscriber portal
- payment/subscription handling
- AI extraction from articles
- semantic search over all articles/PDFs
- advanced dashboards
- CRM-style account management
- full article/PDF source registry
- automated data ingestion from external sources
- mobile-first subscriber UX

## Data Entry Requirements

Each create/edit form should support:

- required field validation
- draft save
- submit for review
- visible review status
- last edited metadata
- source/evidence note field, even before full source registry exists
- duplicate warning for likely matching names/countries
- clear distinction between project, plant, and company fields

Minimum required fields:

Projects:

- project name
- country
- geothermal use type: power, direct use, or hybrid
- phase
- capacity field relevant to phase
- research status

Plants:

- plant name
- country
- geothermal use type: power, direct use, or hybrid
- installed capacity MW
- operating/running capacity MW if available
- plant phase/status
- COD or COD estimate if available
- research status

Companies:

- company name
- primary company type
- headquarters country if known
- active/inactive status
- research status

Relationships/links:

- company
- linked project or plant
- role
- ownership share when role requires it
- primary/secondary flag where useful

## Verification Workflow

Initial workflow states:

- `draft`
- `in_review`
- `approved`
- `needs_update`
- `rejected`
- `archived`

Minimum workflow rules:

- editors can create and edit drafts
- editors can submit records for review
- reviewers can approve or reject editor work
- administrators can approve, reject, archive, and manage users
- users should not approve their own substantive changes
- every approval should record who approved and when
- every material edit should update audit metadata

## Roles And Permissions v1

| Action | Viewer | Analyst | Editor | Reviewer | Administrator |
| --- | --- | --- | --- | --- | --- |
| View approved records | Yes | Yes | Yes | Yes | Yes |
| View draft/internal records | No | Optional | Yes | Yes | Yes |
| Create records | No | No | Yes | Yes | Yes |
| Edit own draft | No | No | Yes | Yes | Yes |
| Edit approved record | No | No | Submit change | Yes | Yes |
| Submit for review | No | No | Yes | Yes | Yes |
| Approve record | No | No | No | Yes | Yes |
| Export data | No | Yes | Optional | Yes | Yes |
| Manage users | No | No | No | No | Yes |
| Manage schema/reference data | No | No | No | Optional | Yes |

## Design Basics

MVP UI should feel like a professional internal intelligence tool:

- dense but readable tables
- compact filters
- clear status badges
- stable detail pages
- predictable edit forms
- clear action buttons
- no marketing-style landing page as the main app entry
- map views as working tools, not decoration
- export controls visible only to permitted roles
- loading, empty, error, and permission states defined for every major page

## Technical Baseline

Recommended direction:

- Next.js application
- PostgreSQL production database
- Railway deployment
- migration tool to be selected: Prisma or Drizzle
- environment-variable configuration
- no production dependency on local filesystem data
- explicit staging and production environments
- GitHub as source of truth

## Open Decisions

Resolve before schema implementation:

- exact project lifecycle phase list
- exact plant status list
- exact company role taxonomy
- whether project and plant share one parent `asset` model or remain separate entities
- how power and direct-use assets are classified in the shared project/plant model
- exact direct-use category list for MVP
- direct-use capacity/output units, such as MWth and GWhth
- whether verification state is entity-level only or field-level later
- whether source/evidence notes are enough for MVP or a minimal source table is needed immediately
- whether Railway-hosted PostgreSQL is sufficient or an external managed PostgreSQL provider is preferred

## Next Deliverable

Create `docs/SEMANTIC_MODEL_V1.md`.

That document should define the terms, phases, capacities, company roles, direct-use categories, and lifecycle rules that the PostgreSQL schema and UI will enforce.
