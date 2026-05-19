# Sources / Documents Page Contract

Date: 2026-05-19

Routes under review:

```text
/sources
/sources/[id]
/sources/matches
```

## Current Status

Current implemented functionality:

- PostgreSQL-backed source records
- source type, visibility, and credibility controlled vocabularies
- TGE article metadata imported as source records
- source list filters for search, source type, visibility, and credibility
  status
- source detail pages with metadata, notes, visibility, status, and linked
  evidence records
- editor review actions for source credibility status
- article/entity match candidates stored separately from confirmed evidence
  links
- bulk article match review actions for confirm, reject, and needs review
- field suggestion candidate schema exists for future AI-assisted extraction
  from sources into reviewable project/asset/company field suggestions

Current limitations:

- full article body text is not stored in PostgreSQL
- source list pagination is not yet implemented
- source/entity candidates are still early matching outputs and require review
- AI-assisted field suggestions are not yet surfaced in the Sources UI
- source forms exist, but field-level claim/evidence workflows are future work
- uploaded document/PDF parsing, OCR, embeddings, and AI extraction are future
  work

## Primary Purpose

Sources / Documents is the evidence backbone of the platform.

It should support:

- validation and approval
- source credibility review
- TGE article archive linkage
- record-level evidence linking
- future field-level evidence and structured claims
- Research Ops source queues
- future AI extraction, semantic search, and briefing workflows

Sources / Documents should not automatically change validated entity fields.
Sources can suggest evidence, links, and claims; researchers and editors confirm
what becomes part of the structured database.

## Primary Users

MVP users:

- researcher
- editor / senior editor
- admin

Future users:

- AI extraction/review assistant
- subscriber/client readers through approved source-safe surfaces
- API/data product consumers

## Main Workflows

MVP workflows:

- search source records
- filter by source type, credibility status, and visibility
- open source detail pages
- review source metadata and notes
- link a source to projects, plants/facilities, and companies
- review article/entity match candidates
- bulk confirm or reject match candidates
- mark source credibility as credible, needs review, weak, outdated, or rejected
- prepare source-derived field suggestions for later human review

Future workflows:

- upload and parse PDFs/reports
- extract entities and claims from documents
- link evidence to specific fields and claims
- generate field suggestions that remain review candidates until confirmed
- detect duplicate or conflicting sources
- approve AI-generated source summaries
- perform semantic search across article/document text

## Data To Show

Source list:

- title or reference
- URL/reference
- source type
- visibility/confidentiality level
- credibility status
- country/market relevance
- linked entity count
- duplicate flag
- updated date
- added/reviewed by where available

Source detail:

- source metadata
- source type and visibility
- credibility status
- publication/access dates
- author/organization/publisher
- extracted summary and relevant excerpt
- internal notes
- linked evidence records
- review metadata

Article match review:

- source/article title
- source date and country
- suggested entity type and entity label
- confidence score
- match reason
- status
- reviewed by/date

## Cards / KPI Blocks

MVP cards:

- total source records
- TGE article records
- needs review
- unlinked sources
- linked evidence
- restricted visibility

Future cards:

- weak/outdated sources
- duplicate source warnings
- source coverage by country
- source coverage by entity type
- AI extraction review backlog

## Tables

MVP source table:

- dense and sortable later
- filterable by type/status/visibility/search
- link source title to source detail
- show first limited result set until pagination is added

MVP article match table:

- bulk select
- bulk confirm/reject/needs review
- filtered by status, entity type, and search
- preserve candidate status before creating real evidence links

Future:

- pagination
- saved views
- column chooser
- source quality filters
- field-level evidence filters
- AI-generated field suggestion filters
- side-panel review

## Actions

MVP actions:

- add source
- edit source
- review source status
- open source profile
- open article match review
- bulk confirm article/entity match candidate
- bulk reject candidate
- bulk mark candidate needs review

Future actions:

- bulk assign source review batches
- bulk tag country/market relevance
- bulk merge duplicate sources
- approve extracted claims
- send extracted facts into field-suggestion review queues
- approve AI summaries
- generate source quality report

## Permissions

Researchers:

- view internal source records
- create and edit draft/source records
- add notes and links
- mark source as needs review

Editors / senior editors:

- approve source credibility
- reject/mark weak/outdated sources
- confirm article/entity matches
- export source review datasets

Admins:

- manage source vocabularies
- manage visibility/confidentiality rules
- manage validation/export rules
- override review states where necessary

## Internal-Only Fields

Keep restricted from future subscriber/export surfaces unless explicitly
approved:

- internal notes
- stakeholder confirmations
- client-confidential sources
- not-for-publication sources
- AI-generated summaries needing review
- reviewer names and workflow metadata

## Mobile Behavior

Mobile should prioritize:

- search
- quick source lookup
- quick source status review
- article match review for small batches
- adding notes/source links

Avoid forcing large desktop-style source tables onto mobile.

## Print / Export Behavior

MVP exports:

- filtered sources
- source review queue
- article match candidates
- source/evidence links
- missing-source Research Ops queues

Future print/export:

- source/evidence sheet for a record
- market source coverage sheet
- source confidence report
- article archive linkage report

## MVP Changes

Immediate MVP changes:

- show true filtered source totals instead of only displayed row count
- keep article match review clearly separate from confirmed evidence links
- expose evidence operations as a first-class section
- document Sources / Documents as the next page review after Research Ops

## Future Changes

Future changes:

- pagination for large source tables
- field-level evidence and structured claim model
- uploaded document library
- PDF parsing/OCR
- WordPress API/RSS current-article sync
- AI extraction and semantic search
- AI-assisted field suggestion candidate review
- source confidence scoring
- conflicting claim detection

## Open Decisions

- exact source list pagination size
- whether source review batches become persistent tasks or saved views first
- how early to add file upload and document storage
- when to introduce field-level evidence in the UI
- how much TGE article related-news matching should be auto-confirmable after
  audit/testing
