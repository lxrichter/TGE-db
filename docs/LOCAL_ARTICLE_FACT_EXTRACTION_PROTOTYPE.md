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

Recommended review decisions:

- `accept`
- `reject`
- `unclear`
- `needs_rule_change`

After marking review decisions locally, run the audit:

```bash
npm run tge-news:fact-review -- --input "../source-data/tge-news-article-fact-review-2026-focused/article_fact_review_sample.csv"
```

This creates:

- `article_fact_review_audit.json`
- `article_fact_review_audit.md`
- `article_fact_review_rule_notes.csv`

The audit is local-only and does not write to PostgreSQL. It summarizes accept,
reject, unclear, and rule-change rates by fact type and field so extraction
rules can be tuned before any database import.

Use `docs/ARTICLE_FACT_REVIEW_GUIDE.md` for consistent review rules before
marking the CSV.

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
