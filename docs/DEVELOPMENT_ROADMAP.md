# Development Roadmap

This roadmap reflects the current strategic direction: build the platform described in the vision document, using the current prototype as earlier work to audit, learn from, and selectively reuse.

## Phase 1: Audit

Goal: establish what exists in the current prototype, what is usable for the future platform, and what should be replaced.

Tasks:

- export and preserve current local database/schema state
- inventory pages, API routes, components, scripts, and data flows
- review authentication and role logic
- review data model for projects, plants, companies, and relationships
- identify code, logic, workflows, and UI ideas to keep, refactor, rebuild, or discard
- document lint, typing, security, and deployment risks, including Railway readiness

Outputs:

- keep / refactor / rebuild / discard report
- current schema inventory
- risk register
- prioritized stabilization backlog
- Railway deployment readiness notes

## Phase 2: Semantic Model

Goal: define meaning before rebuilding surfaces.

Tasks:

- define installed capacity, running capacity, pipeline capacity, and potential capacity rules
- define project lifecycle phases and promotion logic
- define company role taxonomy across projects and plants
- define owner, operator, developer, supplier, investor, EPC, and parent-company logic
- define regional and country classification rules
- define research status and approval status vocabulary

Outputs:

- semantic model v1
- lifecycle state model
- company role model
- validation rule inventory

## Phase 3: Research Workflow

Goal: make the editorial workflow reliable and auditable.

Tasks:

- define staging records versus approved records
- define validation queue behavior
- define approval permissions
- define audit trail requirements
- define duplicate detection and merge workflows
- define source citation requirements

Outputs:

- research workflow specification
- approval and audit model
- validation queue design

## Phase 4: Source Registry

Goal: connect structured data to evidence.

Tasks:

- design article registry
- design PDF/report registry
- define source tags and entity linking
- define source confidence and freshness rules
- define how historical ThinkGeoEnergy article data will be indexed

Outputs:

- source registry schema proposal
- tagging taxonomy
- entity-source linking model

## Phase 5: MVP Build

Goal: build the stable internal MVP for the intended platform, not merely polish the existing prototype.

Tasks:

- implement clean database foundation
- migrate selected prototype logic and workflow patterns
- build core UI for projects, plants, companies, and relationships
- implement research workflow
- implement dashboards and exports
- harden auth and role controls
- establish Railway-based deployment pipeline

Outputs:

- internal MVP
- migration scripts
- Railway production deployment notes
- operator/admin guide

## Phase 6: Light AI Layer

Goal: add AI support after data meaning and workflows are stable.

Tasks:

- add AI-assisted source summarization
- add QA support for records
- add semantic search over source registry
- add extraction assistance for internal researchers
- keep human review and approval as final authority

Outputs:

- AI assistant workflow specification
- source QA prototype
- AI safety and review rules

## Guiding Principle

Build order should follow risk:

1. data meaning
2. workflow integrity
3. database stability
4. user-facing analysis
5. AI support
6. subscriber packaging
