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
- `field_suggestion_candidates` and `ref_field_suggestion_statuses` exist in
  PostgreSQL staging
- Research Ops shows field suggestion counts and review candidates
- editors/admins can confirm, reject, or mark field suggestions as needing
  review
- project, plant/facility, and company profiles show record-level field
  suggestions
- project, plant/facility, and company profiles show open article/source match
  candidates when they exist

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
or editor can then confirm, reject, or defer those candidates. In the current
implementation, confirming a field suggestion updates only the suggestion
status. It does not yet apply the suggested value to the entity record.

## Candidate Workflow

Recommended workflow:

1. A source, document, article, PDF, website, or report is added.
2. A parsing/extraction process identifies possible facts.
3. Each possible fact becomes a `field_suggestion_candidates` row.
4. Suggestions appear in Research Ops and on the relevant record profile.
5. A researcher/editor reviews the evidence, current value, suggested value,
   confidence, and source.
6. Confirmed suggestions enter the future controlled apply workflow.
7. Applying a confirmed suggestion should update the real entity field through
   normal application logic.
8. Applying a confirmed suggestion should create or reuse a real source/evidence
   link where appropriate.
9. The target record should move to `validation` or `needs_update` if the
   change affects approved/export-ready data.
10. An audit event should record the applied change.

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

Project, plant/facility, and company detail pages currently show a compact AI
Field Suggestions panel:

- current value
- suggested value
- source/evidence
- confidence
- reason
- confirm/reject actions

Confirmed suggestions should open a controlled edit/review flow rather than
silently changing fields inline.

The same profiles also show open article/source match candidates when matching
has suggested related TGE articles for that record. Confirming those article
matches can create real evidence links; flagged candidates remain blocked from
bulk confirmation.

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
- field suggestion review API
- Research Ops field suggestion review controls
- record-level AI field suggestion panels
- record-level article match candidate review
- local markdown article fact extraction prototype
- local article fact review sample and audit workflow
- `article_fact_candidates` staging table for compact reviewable article facts

Future:

- controlled apply workflow for confirmed field suggestions
- field suggestion generation from confirmed article facts
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
