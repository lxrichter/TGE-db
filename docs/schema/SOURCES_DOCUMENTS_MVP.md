# Sources / Documents MVP Foundation

Date: 2026-05-18

Purpose: document the first PostgreSQL-backed Sources / Documents slice for
the TGE geothermal intelligence platform.

## Current Implemented Functionality

The Sources / Documents foundation has been added to the Railway PostgreSQL
staging database through Prisma migration:

```text
web/prisma/migrations/20260518000200_sources_documents_mvp/migration.sql
```

This migration extends the existing `sources` and `entity_sources` baseline
instead of replacing them. It keeps the model practical for the current rebuild
while preparing for field-level evidence, document extraction, semantic search,
and AI-assisted validation later.

Implemented reference tables:

- `ref_source_visibility_levels`
- `ref_source_statuses`

Implemented source visibility levels:

- `public`
- `internal_only`
- `client_confidential`
- `not_for_publication`
- `stakeholder_confirmation`
- `ai_generated_needs_review`

Implemented credibility/status labels:

- `credible`
- `needs_review`
- `weak`
- `outdated`
- `rejected`

Implemented source types include the strategic MVP set:

- `tge_article`
- `external_news_article`
- `company_website`
- `company_report`
- `government_document`
- `regulator_filing`
- `press_release`
- `pdf_report`
- `academic_paper`
- `conference_paper_or_presentation`
- `dataset`
- `internal_note`
- `stakeholder_confirmation`
- `client_confidential_source`
- legacy-compatible `web`, `article`, `pdf`, `company`, `government`, `other`

## Source Record Fields

The `sources` table now supports:

- title, URL, publisher, publication date, accessed date, and notes
- `source_reference` for non-URL citations
- `author_organization`
- `language_code`
- `country`
- visibility/confidentiality status
- credibility/review status
- extracted summary and relevant excerpt
- attachment URL placeholder
- duplicate-source flag
- added/reviewed user metadata
- review timestamp
- update timestamp

## Evidence Links

The `entity_sources` table now supports richer evidence-link metadata:

- record-level links to projects, operating assets, and companies
- `linked_field` placeholder for future field-level evidence
- `claim_text`
- `extracted_value`
- primary-evidence flag
- confidence status
- reviewed-by and reviewed-at metadata

Field-level claims are not yet fully implemented in the UI. The database
structure now leaves room for that without forcing the MVP to become too heavy.

## Application Layer

Current source service:

```text
web/lib/services/sources.ts
```

Current API endpoints:

```text
GET /api/postgres/sources
GET /api/postgres/sources/[id]
GET /api/postgres/sources/reference-data
```

Current UI routes:

```text
/sources
/sources/[id]
/sources/new
/sources/[id]/edit
```

The current UI supports source list filtering, source profile viewing, source
metadata review, source create/edit, and record-level evidence link management.

The list endpoint currently supports:

- search
- source type filter
- visibility filter
- credibility/status filter
- bounded result limits

These endpoints are PostgreSQL-backed and remain behind the existing app
authentication middleware.

## TGE Article / News Integration

Implemented staging foundation:

- `GET /api/postgres/tge-articles` searches the public ThinkGeoEnergy
  WordPress posts API using the normal WordPress REST posts endpoint.
- `POST /api/postgres/tge-articles/import` fetches the selected WordPress post
  by ID, imports or reuses it as a `tge_article` source, and can link it to the
  current PostgreSQL project, plant/facility, or company.
- PostgreSQL entity detail source panels now include a `Find TGE Article`
  workflow alongside `Link Existing Source` and `Add Source`.
- Imported article sources use `source_reference = TGE-WP-{wordpress_id}`,
  `publisher = ThinkGeoEnergy`, public visibility, and `needs_review`
  credibility by default.
- Duplicate imports are controlled by matching `source_reference` or URL before
  creating a new source record.

This is not yet full archive synchronization. Automated article/entity matching,
WordPress category/tag mapping, country/market related-news panels, and semantic
article search remain future slices.

The local markdown archive preview workflow is documented in:

```text
docs/schema/TGE_NEWS_ARCHIVE_LOCAL_PREVIEW.md
```

That workflow parses the 17,000+ markdown article archive locally and writes
metadata-only preview outputs to the ignored `source-data/` directory. It does
not write to PostgreSQL and does not export article body text by default.

## Research Ops Integration

The PostgreSQL Research Ops preview now includes source queues:

- `Source Needs Review`
- `Weak / Outdated Source`

These queues make source validation visible alongside missing-data and approval
workflows.

## Current Constraints

Current implemented functionality is still foundation-level:

- no file upload pipeline yet
- no full TGE WordPress archive synchronization yet
- no AI extraction or semantic search yet

The live Hetzner SQLite database remains untouched.

## Recommended Next Slice

Continue the Sources / Documents working surface:

1. add country/market evidence and related-news panels when country/market pages
   move to PostgreSQL
2. add file upload/storage decisions before attaching real documents
3. define article/entity matching rules for semi-automatic related-news links
4. prepare export-ready checks that require credible source coverage
5. keep AI extraction and semantic search future-ready but behind validation

This should happen before heavy approval/export automation, because source
traceability is the backbone for validation, reporting, and later AI workflows.
