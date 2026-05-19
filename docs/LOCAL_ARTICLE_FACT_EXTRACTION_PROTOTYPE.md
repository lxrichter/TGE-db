# Local Article Fact Extraction Prototype

Date: 2026-05-19

Purpose: test whether the local ThinkGeoEnergy markdown article archive can
produce reviewable candidate facts and article/entity signals without storing
full article body text in PostgreSQL.

## Current Implemented Baseline

Current implemented functionality:

- local markdown archive scanning via `npm run tge-news:facts`
- deterministic extraction only; no AI model calls
- no network calls
- no full article body export
- no automatic entity field updates
- optional PostgreSQL write path to `article_fact_candidates`
- review status model for suggested, needs review, confirmed, rejected, and
  superseded candidates

Current generated local outputs:

- `article_fact_summary.json`
- `article_fact_candidates_preview.ndjson`
- `article_fact_candidates_preview.csv`
- `article_fact_review_sample.csv`
- `article_fact_review_sample.xlsx`
- `article_fact_article_index.ndjson`

These files are written under `source-data/`, which is intentionally ignored by
Git.

## PostgreSQL Staging Table

The migration `20260519000200_article_fact_candidates` adds:

- `ref_article_fact_candidate_statuses`
- `article_fact_candidates`

The table stores compact candidate facts only:

- source reference
- optional linked `source_id`
- fact type
- candidate field name
- extracted value
- normalized value
- confidence score
- short evidence snippet capped by the script
- extraction metadata
- review status

It does not store full article body text.

## Safe Local Dry Run

Run a small local test:

```bash
cd "/Users/lxrichter/TGE Database/02_current_platform/tge-business-intel platform/web"
npm run tge-news:facts -- --root "/Users/lxrichter/Documents/TGE_AI/03_ai_documents/tge_news_md_canonical" --limit 20
```

Run a year-scoped test:

```bash
npm run tge-news:facts -- --root "/Users/lxrichter/Documents/TGE_AI/03_ai_documents/tge_news_md_canonical" --years 2025 --limit 250
```

Run a broader local dry run:

```bash
npm run tge-news:facts -- --root "/Users/lxrichter/Documents/TGE_AI/03_ai_documents/tge_news_md_canonical"
```

Run a narrower, more operational extraction without broad entity/tag signals:

```bash
npm run tge-news:facts -- --root "/Users/lxrichter/Documents/TGE_AI/03_ai_documents/tge_news_md_canonical" --skip-entity-signals
```

Run the recommended local manual-review batch:

```bash
npm run tge-news:facts -- --root "/Users/lxrichter/Documents/TGE_AI/03_ai_documents/tge_news_md_canonical" --years 2026 --skip-entity-signals --review-sample-per-type 25 --review-sample-mode mixed --out "../source-data/tge-news-article-fact-review-2026-focused"
```

The review CSV is intentionally human-facing. It includes blank
`review_decision` and `review_note` columns, then the candidate value, short
evidence snippet, article title/URL, confidence score, and fact reason. This is
for manual quality review only; it does not create confirmed evidence links.
The recommended `mixed` sample mode includes high-, middle-, and lower-confidence
examples per fact type so rule quality can be judged more realistically.
An Excel workbook is also generated for easier manual review. The CSV remains
the canonical file used by the audit command.

Recommended review decisions:

- `accept`
- `reject`
- `unclear`
- `needs_rule_change`

After marking review decisions locally in either the CSV or Excel workbook, run
the audit:

```bash
npm run tge-news:fact-review -- --input "../source-data/tge-news-article-fact-review-2026-focused/article_fact_review_sample.csv"
```

This creates:

- `article_fact_review_audit.json`
- `article_fact_review_audit.md`
- `article_fact_review_rule_notes.csv`

The audit is local-only and does not write to PostgreSQL. It can read the CSV or
the generated `.xlsx` workbook. It summarizes accept, reject, unclear, and
rule-change rates by fact type and field so extraction rules can be tuned before
any database import.

Use `docs/ARTICLE_FACT_REVIEW_GUIDE.md` for consistent review rules before
marking the CSV.

## Reviewed Import Pack

After a review/audit pass, create a local DB-shaped import pack from the
reviewed workbook:

```bash
npm run tge-news:fact-import-pack -- --input "../source-data/tge-news-article-fact-review-2026-tuned/article_fact_review_sample.xlsx" --out "../source-data/tge-news-article-fact-review-2026-tuned/import-pack"
```

For the safer handoff artifact, output only accepted/confirmed candidates:

```bash
npm run tge-news:fact-import-pack -- --input "../source-data/tge-news-article-fact-review-2026-tuned/article_fact_review_sample.xlsx" --out "../source-data/tge-news-article-fact-review-2026-tuned/import-pack-confirmed-only" --accepted-only
```

This creates:

- `article_fact_candidates_reviewed_import.ndjson`
- `article_fact_candidates_reviewed_import.csv`
- `article_fact_candidates_confirmed.ndjson`
- `article_fact_candidates_rejected.ndjson`
- `article_fact_candidates_needs_review.ndjson`
- `article_fact_import_pack_summary.json`

The import pack is still local-only. It does not write to PostgreSQL, create
real evidence links, update entity fields, or export full article body text.
It exists to make reviewed decisions reproducible before a future local
PostgreSQL dry-write step.

Audit the generated pack before any database staging step:

```bash
npm run tge-news:fact-import-audit -- --input "../source-data/tge-news-article-fact-review-2026-tuned/import-pack/article_fact_candidates_reviewed_import.ndjson"
```

Audit the confirmed-only pack more strictly:

```bash
npm run tge-news:fact-import-audit -- --input "../source-data/tge-news-article-fact-review-2026-tuned/import-pack-confirmed-only/article_fact_candidates_reviewed_import.ndjson" --confirmed-only
```

This creates:

- `article_fact_import_pack_audit.json`
- `article_fact_import_pack_audit.md`

The audit validates required fields, status values, duplicate fact keys,
confidence-score ranges, evidence snippet length, date shape, JSON object
fields, and privacy/safety flags.

Run a dry load check against the confirmed-only import pack:

```bash
npm run tge-news:fact-import-load -- --input "../source-data/tge-news-article-fact-review-2026-tuned/import-pack-confirmed-only/article_fact_candidates_reviewed_import.ndjson"
```

This is still dry-run-only by default. It checks that the pack is suitable for
loading into `article_fact_candidates` and refuses non-confirmed rows unless
`--allow-non-confirmed` is passed.

When a local PostgreSQL sandbox is available, a controlled local execution will
look like:

```bash
DATABASE_URL="postgresql://localhost:5432/tge_local" npm run tge-news:fact-import-load -- --input "../source-data/tge-news-article-fact-review-2026-tuned/import-pack-confirmed-only/article_fact_candidates_reviewed_import.ndjson" --execute
```

The load command blocks non-local database URLs by default. It writes only to
`article_fact_candidates`; it does not create `entity_sources`, update entity
fields, approve records, or mark anything export-ready.

After loading candidates into a PostgreSQL sandbox, review them in the app:

```text
/sources/facts
```

The page supports status/fact/field filters, pagination, compact evidence
snippets, confidence display, and editor/admin bulk triage. Triage changes only
the `article_fact_candidates` status; it does not apply values to projects,
plants/facilities, companies, sources, or evidence links.

To connect confirmed article facts to the source/evidence layer, backfill TGE
article source records from reviewed fact candidates:

```bash
DATABASE_URL="postgresql://localhost:5432/tge_local" npm run tge-news:fact-source-backfill
```

The command is dry-run by default. It summarizes which confirmed article fact
source references do not yet have matching `sources` rows.

Execute against a local PostgreSQL sandbox:

```bash
DATABASE_URL="postgresql://localhost:5432/tge_local" npm run tge-news:fact-source-backfill -- --execute
```

This creates or updates `tge_article` source metadata rows and relinks matching
`article_fact_candidates.source_id`. It does not create `entity_sources`, update
entity fields, approve records, or store article body text. Execute mode blocks
non-local database URLs unless `--allow-remote-db` is supplied.

After article facts are linked to source rows and article/entity matches exist,
preview field suggestions from confirmed article facts:

```bash
DATABASE_URL="postgresql://localhost:5432/tge_local" npm run tge-news:fact-field-suggestions
```

By default this uses confirmed article facts and confirmed article/entity
matches only. It can suggest capacity and target COD fields where the matched
project or plant/facility field is currently empty.

Execute against a local PostgreSQL sandbox:

```bash
DATABASE_URL="postgresql://localhost:5432/tge_local" npm run tge-news:fact-field-suggestions -- --execute
```

This writes only to `field_suggestion_candidates`. It does not apply values to
projects, plants/facilities, or companies, and it does not create evidence links.
The suggestions still require human review in Research Ops or record-level
field suggestion panels.

After field suggestions are reviewed and marked `confirmed`, preview the
controlled apply step:

```bash
DATABASE_URL="postgresql://localhost:5432/tge_local" npm run field-suggestions:apply
```

Execute against a local PostgreSQL sandbox only after reviewing the preview:

```bash
DATABASE_URL="postgresql://localhost:5432/tge_local" npm run field-suggestions:apply -- --execute
```

The apply command only uses confirmed, unapplied suggestions. It updates
whitelisted empty project or plant/facility fields, writes an `audit_events`
record, and marks the suggestion as applied. It skips unsupported fields,
invalid values, and targets that already have a value.

The first reviewed pack from the adapted tuned workbook produced:

- 125 input rows
- 63 reviewed rows
- 47 confirmed rows
- 16 rejected rows
- 62 pending rows
- 0 invalid rows

Run only selected fact types:

```bash
npm run tge-news:facts -- --root "/Users/lxrichter/Documents/TGE_AI/03_ai_documents/tge_news_md_canonical" --fact-types capacity_signal,cod_year_signal,funding_amount_signal
```

## Optional PostgreSQL Write

Do not run this until the migration has been deployed to the intended PostgreSQL
environment.

```bash
railway run --service Postgres -- npm run tge-news:facts -- --root "/Users/lxrichter/Documents/TGE_AI/03_ai_documents/tge_news_md_canonical" --years 2025 --execute
```

This writes only review candidates to `article_fact_candidates`.

For safety, `--execute` refuses to write more than 5,000 candidates unless
`--max-execute-rows` is raised. Prefer narrowing with `--years`, `--limit`,
`--fact-types`, or `--skip-entity-signals` before writing.

It does not:

- create `entity_sources`
- update project fields
- update operating asset fields
- update company fields
- approve records
- mark records export-ready

## Extracted Candidate Types

Current deterministic extraction supports:

- `country_signal`
- `entity_signal`
- `capacity_signal`
- `funding_amount_signal`
- `cod_year_signal`
- `direct_use_category_signal`
- `activity_status_signal`

These are intentionally broad article facts. They are not yet final structured
database values.

## First Review Tuning Pass

The first manually reviewed 2026 focused sample produced:

- 133 reviewed rows
- 104 accepted rows
- 29 rejected rows

Rule changes from that review:

- capacity parsing now handles thousands separators so values such as
  `20,000 MW` are not misread as `20 MW`
- COD/year extraction now requires stricter forward-looking operation timing
  language
- old historical operation years are filtered more aggressively
- event/conference articles are filtered for body-only capacity, money,
  direct-use, and status signals where they tend to create noise

In a same-scope local comparison, the tuned rules removed 15 previously rejected
rows from the reviewed sample while preserving all 104 accepted rows. The
remaining false positives are mostly semantic/contextual cases that should be
handled later through entity matching, article type classification, or human
review rather than heavier regex filtering.

A second review pass on the tuned 2026 sample covered 63 rows:

- 47 accepted rows
- 16 rejected rows
- 62 pending rows

The follow-up tuning pass:

- reduced generic `activity_status_signal` noise by removing broad
  `loan`/`investment`/`financing` triggers
- made PPA/offtake and exploration-license status signals title-first
- added a more explicit `Proposal / call` activity signal
- removed policy-threshold capacity false positives
- filtered past-year COD candidates when they are historical rather than
  forward-looking

Against the reviewed rows in that second pass, the updated rules removed 14 of
16 rejected rows and kept 46 of 47 accepted rows. The one removed accepted row
was replaced semantically by the newer `Proposal / call` signal.

## Governance

All extracted facts remain candidates until reviewed.

Confirmed article facts should later feed controlled workflows:

- source/entity match review
- field suggestion generation
- entity source/evidence creation
- human-approved field updates
- Research Ops queues
- future semantic/AI workflows

The current prototype is a safe bridge between the historical article archive
and the future evidence/AI layer.
