# AI-Assisted Data Filling Workflow

Date: 2026-05-19

Purpose: define how AI-supported research should help fill project,
plant/facility, and company data without bypassing human validation.

## Current Implemented Baseline

Current implemented functionality:

- source records exist in PostgreSQL staging
- source/evidence links can connect sources to projects, operating assets, and
  companies
- source links already support linked field, extracted value, claim text,
  confidence status, and evidence notes
- TGE article/entity matching writes review candidates first
- confirmed article/entity candidates can create real `entity_sources` links
- Research Ops separates generated queues from persistent human-created issues

Current newly prepared schema:

- `field_suggestion_candidates`
- `ref_field_suggestion_statuses`

These tables are schema groundwork only. There is not yet a production AI
extraction service, AI UI, or automatic field-update workflow.

## Core Principle

AI may propose data. Humans confirm data.

AI-generated or rule-generated suggestions must not directly overwrite:

- project fields
- operating asset fields
- company fields
- company relationship fields
- validation status
- export-ready status

Instead, AI-assisted workflows should create reviewable candidates. A researcher
or editor can then confirm, reject, or revise those candidates.

## Candidate Workflow

Recommended workflow:

1. A source, document, article, PDF, website, or report is added.
2. A parsing/extraction process identifies possible facts.
3. Each possible fact becomes a `field_suggestion_candidates` row.
4. Suggestions appear in Research Ops and on the relevant record profile.
5. A researcher/editor reviews the evidence, current value, suggested value,
   confidence, and source.
6. Confirmed suggestions update the real entity field through normal
   application logic.
7. Confirmation creates or reuses a real source/evidence link where appropriate.
8. The target record moves to `validation` or `needs_update` if the change
   affects approved/export-ready data.
9. An audit event records the applied change.

Rejected suggestions remain stored for auditability and to avoid repeatedly
suggesting the same weak match.

## Candidate Statuses

MVP statuses:

- `suggested_high_confidence`
- `suggested_medium_confidence`
- `suggested_low_confidence`
- `needs_review`
- `confirmed`
- `rejected`
- `superseded`

High confidence should mean priority for review, not automatic application.

## Candidate Data

Each suggestion should include:

- entity type: project, operating asset, or company
- target entity ID
- field name
- current value
- suggested value
- normalized value where possible
- unit where relevant
- source ID where available
- related article/entity match candidate where applicable
- extraction excerpt or short claim text
- evidence note
- confidence score
- suggestion reason
- generator name
- model/prompt version if AI generated
- reviewer metadata
- applied audit metadata after confirmation

## Suggested Fields By Entity

Projects:

- country
- region
- lifecycle phase
- use type
- direct-use category
- planned capacity
- potential capacity range
- target COD year/month
- developer/operator/owner relationship suggestions
- technology/resource type
- coordinates

Plants / Facilities:

- country
- operating status
- use type
- installed capacity
- running capacity
- thermal capacity
- COD year/month
- owner/operator relationship suggestions
- technology/resource type
- turbine supplier
- coordinates

Companies:

- primary company category
- secondary categories
- headquarters country/city
- website
- company group/parent
- ownership relationship suggestions
- project/asset role suggestions
- geothermal focus
- technology focus

## Research Ops Integration

Research Ops should expose AI-assisted data-filling work as review queues:

- AI field suggestions needing review
- high-confidence suggestions
- suggestions for export-blocking fields
- suggestions linked to credible sources
- suggestions without enough source confidence
- rejected/superseded suggestions for audit
- suggestions by country, entity type, field, source, and researcher

These queues should sit beside source/evidence and missing-data queues, not
replace them.

## Record Page Integration

Project, plant/facility, and company detail pages should eventually show a
compact "Suggested Updates" panel:

- current value
- suggested value
- source/evidence
- confidence
- reason
- confirm/reject/defer actions

Confirmed suggestions should open a controlled edit/review flow rather than
silently changing fields inline.

## Source / Document Integration

Sources should eventually show:

- extracted candidate facts
- linked records
- matching confidence
- field suggestions generated from that source
- confirmed evidence links
- rejected suggestions

This keeps the source record as the evidence anchor.

## Governance Rules

Required rules:

- AI suggestions are internal-only until confirmed.
- AI-generated summaries require approval before export.
- Suggestions do not count as credible source evidence until reviewed.
- Confirmed suggestions should be traceable to source/evidence.
- Confidential sources cannot feed public/subscriber outputs unless explicitly
  approved.
- Approved/export-ready records edited through a suggestion should move back to
  `validation` or `needs_update`.

## MVP vs Future

MVP groundwork:

- source/evidence model
- article/entity match candidate model
- field suggestion candidate schema
- Research Ops review queues
- human confirmation requirement

Next implementation slices:

- list field suggestion candidates in Research Ops
- show record-level suggestion panels
- add confirm/reject API routes
- add controlled apply workflow
- create first deterministic extraction scripts for article metadata and
  selected source fields

Future:

- PDF/document ingestion
- full-text semantic retrieval
- AI extraction from document bodies
- entity and relationship extraction
- conflicting-claim detection
- source confidence scoring
- AI-generated project/company/market summaries
- natural-language research assistant
- subscriber-safe AI outputs

## Non-Goals For Now

Do not build yet:

- automatic AI updates to real entity tables
- open-ended chatbot as the primary data-entry workflow
- automatic export-ready approval
- subscriber-facing AI answers
- unrestricted document ingestion

The platform should first make AI useful inside controlled research operations.
