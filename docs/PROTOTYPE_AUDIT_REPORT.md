# Prototype Audit Report

Date: 2026-05-16

Purpose: identify what the current Next.js + SQLite prototype contributes to the future TGE geothermal intelligence platform, and what should be kept, refactored, rebuilt, or discarded.

## Executive Summary

The current prototype is valuable as a product and workflow reference. It already models the key geothermal intelligence domains: projects, plants, companies, company relationships, asset roles, maps, analysis views, approvals, exports, and internal user management.

It should not be treated as the final production foundation. The strongest path is to reuse its domain learning, field vocabulary, workflow patterns, and selected UI ideas, then rebuild the durable platform on a cleaner schema, likely PostgreSQL, with Railway deployment assumptions from the start.

## Current Technical Baseline

- Framework: Next.js 16 App Router
- UI: React 19, TypeScript, Tailwind CSS 4
- Auth: NextAuth credentials provider
- Database: SQLite through `sqlite` / `sqlite3`
- Maps: Leaflet / React Leaflet
- Exports: `xlsx`
- Deployment target for future work: Railway

## Implemented Route Areas

Current pages include:

- `/projects`
- `/plants`
- `/companies`
- `/map`
- `/markets`
- `/analysis`
- `/research-ops`
- `/admin`
- `/login`

Current API areas include:

- projects CRUD, export, approval, promotion
- plants CRUD, export, approval
- companies CRUD, approval, options
- company-project links
- company-plant links
- company relationships
- map data
- analysis endpoints
- user admin
- auth
- related news

## Current Data Model

The live local SQLite database contains these main tables:

- `projects`
- `plants`
- `companies`
- `company_roles`
- `company_relationships`
- `company_project_links`
- `company_plant_links`
- `ref_company_roles`
- `ref_company_type_primary`
- `ref_company_type_secondary`
- `users`

Observed local record counts:

- plants: 705
- projects: 1500
- companies: 69
- company-project links: 18
- company-plant links: 26
- company relationships: 14
- users: 6

Important: the live SQLite schema is ahead of `web/data/schema.sql` and `web/lib/init-db.ts`. It includes review/audit fields, ownership share fields, company secondary type fields, SPV/group reporting fields, and `ref_company_roles`.

## Data Entry And Validation

Useful existing validation patterns:

- required names and countries for projects/plants
- required project/plant phase
- installed capacity required for plants
- year and COD format validation
- numeric validation for MW, GWh, wells, temperature, depth, flow rate
- coordinate validation
- capacity consistency checks
- company primary/secondary type checks
- company asset link role checks
- ownership share validation for owner/developer/investor-style roles

Limitations:

- project and plant validation are heavily duplicated
- validation is mostly form-level, not database-enforced
- semantic definitions are still implicit
- role vocabularies appear in more than one place with different option sets
- current validation does not yet define source-evidence requirements

## Verification And Approval Workflow

Useful existing concepts:

- `review_status`
- `created_by_user_id`
- `last_updated_by_user_id`
- `approved_by_user_id`
- `approved_at`
- approval endpoints for projects, plants, and companies
- editor-created changes can become `pending_review`
- reviewer/admin concepts exist through roles
- self-approval prevention exists in role logic

Limitations:

- workflow states are not yet formally specified across all entities
- audit trail is not yet a full event log
- approval logic is not fully centralized
- source evidence and verification standard are not yet modeled
- current implementation should be treated as workflow inspiration, not final workflow architecture

## User Roles

Current implemented roles:

- `viewer`
- `editor`
- `editor_export`
- `administrator`

Useful capability concepts:

- edit
- export
- print
- promote project
- access admin
- manage users
- import
- review
- approve

Limitations:

- role logic is duplicated between `web/lib/auth/roles.ts` and `web/middleware.ts`
- `editor_export` mixes review/export/admin-adjacent meaning
- future platform probably needs clearer names, for example `reviewer`, `analyst`, and `subscriber`
- subscriber access is not implemented

## UI And Design Patterns

Useful existing UI patterns:

- list/detail/edit structure for core entities
- status badges
- approval buttons
- entity detail sections
- key stats blocks
- map components
- market tables
- export modal
- top overview/navigation patterns
- admin user management panel

Limitations:

- current UI should be used as a reference, not copied wholesale
- large pages need decomposition before long-term development
- design system is not yet formalized
- loading/error/empty states need standardization
- dense intelligence-tool UX should be defined before new screens are built

## Import, Export, And Reporting

Useful existing pieces:

- import scripts for plants, projects, and companies
- Excel export column definitions for plants and projects
- export modal with field selection
- analysis endpoints for countries, operators, owners, and turbine technology

Limitations:

- imports are script-based and not yet an operational ingestion pipeline
- exports are useful but should be redesigned around explicit report/export products
- source data remains local and excluded from Git, correctly
- no source registry exists yet for article/PDF/report evidence

## Railway And Deployment Readiness

Positive:

- `npm run build` succeeds when run outside sandbox restrictions
- app is environment-variable driven for `DB_PATH`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET`
- generated output and local data are ignored by Git

Risks:

- `npm run lint` fails with 92 findings: 73 errors and 19 warnings
- Next.js reports the `middleware` file convention is deprecated; future work should migrate to `proxy`
- `next build` accesses the local SQLite database during static generation
- Railway production should not depend on a local SQLite file path
- migrations are not formalized
- admin/user bootstrap is not formalized
- production database direction needs PostgreSQL planning
- no sanitized fixture DB is committed

## Keep / Refactor / Rebuild / Discard

| Area | Recommendation | Rationale |
| --- | --- | --- |
| Entity concepts: projects, plants, companies | Keep | Correct core domain for TGE platform. |
| Company-project and company-plant links | Keep | Essential for geothermal market intelligence. |
| Company relationships | Keep | Needed for groups, subsidiaries, ownership, and market structure. |
| Project-to-plant promotion concept | Keep / Refactor | Valuable lifecycle concept; needs formal semantic rules. |
| Review and approval workflow | Keep / Rebuild | Good concept; implementation needs event log, source evidence, and centralized policy. |
| User roles | Refactor | Useful basis, but names and permissions need clearer future matrix. |
| Validation rules | Keep / Refactor | Good starting rules; should be centralized and database-backed where appropriate. |
| Current SQLite schema | Refactor / Rebuild | Useful inventory; not a final production schema. |
| Current code structure | Rebuild selectively | Large pages/routes and duplicated logic limit maintainability. |
| Import scripts | Keep / Refactor | Valuable mapping knowledge; should become repeatable migration/import pipeline. |
| Export logic | Keep / Refactor | Useful reporting basis; future exports need product definitions. |
| Map components | Keep / Refactor | Useful UI pattern; future map data API should be cleaner. |
| Analysis views | Keep as reference | Good product direction; metrics need semantic model first. |
| NextAuth credentials auth | Refactor | Fine for prototype; future auth/session model should be confirmed for Railway and subscriber path. |
| Middleware role checks | Refactor | Duplicate logic and deprecated file convention need cleanup. |
| Related news route | Rebuild later | Better handled after source registry is designed. |
| Local SQLite production assumption | Discard | Not appropriate for Railway production baseline. |

## Recommended Immediate Next Steps

1. Define MVP Scope v1.
2. Define Semantic Model v1 for projects, plants, companies, lifecycle, capacity, and roles.
3. Define Roles & Permissions Matrix v1.
4. Define Data Entry & Verification Workflow v1.
5. Decide technical architecture for the next build: Next.js + PostgreSQL + migration tool + Railway.

## Concrete Terminal Commands For Current Prototype

Run local preview:

```bash
cd "/Users/lxrichter/TGE Database/02_current_platform/tge-business-intel platform/web"
npm run dev
```

Run lint check:

```bash
cd "/Users/lxrichter/TGE Database/02_current_platform/tge-business-intel platform/web"
npm run lint
```

Run production build check:

```bash
cd "/Users/lxrichter/TGE Database/02_current_platform/tge-business-intel platform/web"
npm run build
```

Inspect local SQLite tables without exposing data:

```bash
cd "/Users/lxrichter/TGE Database/02_current_platform/tge-business-intel platform"
sqlite3 shared/data/tge.db ".tables"
```

Inspect schema without exposing record contents:

```bash
cd "/Users/lxrichter/TGE Database/02_current_platform/tge-business-intel platform"
sqlite3 shared/data/tge.db "SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name;"
```
