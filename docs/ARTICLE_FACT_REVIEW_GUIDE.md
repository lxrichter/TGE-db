# Article Fact Review Guide

Date: 2026-05-19

Purpose: provide consistent manual-review rules for local article fact
candidate samples before any PostgreSQL import, Research Ops queue, or
AI-assisted field-suggestion workflow is enabled.

## Current Implemented Review Workflow

Current workflow:

1. Generate local candidate facts from the markdown archive.
2. Review `article_fact_review_sample.csv` locally.
3. Mark `review_decision` and optionally `review_note`.
4. Run `npm run tge-news:fact-review`.
5. Use the audit results to tune extraction rules.

This remains local-only. It does not:

- write to Railway PostgreSQL
- create `entity_sources`
- update project, plant/facility, company, or country fields
- store full article body text
- call an AI model

## Review Decisions

Use these values in `review_decision`:

- `accept`
- `reject`
- `unclear`
- `needs_rule_change`

Leave blank only if the row has not been reviewed yet.

Use `review_note` for short reasons, especially when rejecting or marking
`needs_rule_change`.

## General Review Rules

Mark `accept` when:

- the extracted value is clearly supported by the evidence snippet
- the value maps to the intended field
- the signal is about the main article subject or a clearly mentioned entity
- the value would be useful as a review candidate for a researcher/editor

Mark `reject` when:

- the value is not supported by the snippet
- the value belongs to a different field type
- the value is generic sector context rather than a useful candidate fact
- the value refers to a non-geothermal topic
- the value is about an event, date, price, parcel count, or general statistic
  but was extracted as project/asset data

Mark `unclear` when:

- the snippet is too short to judge
- the article title suggests relevance but the extracted value needs the full
  article context
- the value may be useful, but not enough evidence is visible in the sample

Mark `needs_rule_change` when:

- the same kind of false positive appears repeatedly
- a fact type is too broad or too narrow
- the extractor is using the wrong unit interpretation
- the confidence score seems systematically too high or too low

## Fact-Type Review Rules

### `country_signal`

Accept when the article is clearly about that country, market, project,
facility, company activity, policy, or funding.

Reject when the country appears only in a list, comparison, dateline,
conference context, or unrelated background.

### `capacity_signal`

Accept when the extracted value is a geothermal power capacity, thermal
capacity, planned capacity, operating capacity, or clearly stated project/asset
capacity.

Reject when the number is:

- funding or investment amount
- acreage, parcel count, lease area, price, or tariff value
- total market statistic not tied to a candidate field
- non-geothermal capacity
- too ambiguous to distinguish MWe from MWth or general MW

Use `unclear` when the value may be capacity but the snippet lacks enough
context.

### `funding_amount_signal`

Accept when the value is clearly an investment, funding award, grant, loan,
financing package, or raise.

Reject when the value is a lease sale price, tariff, revenue number, installed
capacity, or general market value.

### `cod_year_signal`

Accept when the year is clearly linked to commissioning, COD, operation,
startup, or planned operating date.

Reject when the year is simply publication timing, conference timing, company
history, policy year, or a non-operating milestone.

### `direct_use_category_signal`

Accept when the article clearly involves the detected direct-use category, such
as district heating, greenhouses, industrial heat, cooling, or heat pumps.

Reject when the term is used generically or appears only in broad sector
context without article-specific relevance.

### `activity_status_signal`

Accept when the phrase clearly indicates project or asset activity, such as
construction, drilling, tender, funding, policy/tariff, acquisition, or project
progress.

Reject when the phrase is generic article wording, unrelated corporate news,
event promotion, or not useful for lifecycle/status review.

## Recommended First Review Pass

Do not review the full archive first.

Start with:

- 30 to 50 rows from the 2026 focused review sample
- a mix of fact types
- a mix of `top_confidence`, `middle_confidence`, and `lower_confidence`
  sample buckets
- at least a few rejected or unclear examples with notes

Then run:

```bash
cd "/Users/lxrichter/TGE Database/02_current_platform/tge-business-intel platform/web"
npm run tge-news:fact-review -- --input "../source-data/tge-news-article-fact-review-2026-focused/article_fact_review_sample.csv"
```

Primary outputs:

- `article_fact_review_audit.md`
- `article_fact_review_audit.json`
- `article_fact_review_rule_notes.csv`

The rule notes CSV is the most important file for tuning the extractor. It
collects rejected, unclear, and rule-change rows without touching the database.

## What Good Looks Like Before Database Import

Before importing article fact candidates into PostgreSQL, the local review pass
should show:

- capacity signals are useful enough to review at scale
- country signals are not dominated by generic mentions
- COD year signals are not mostly article/event years
- funding amount signals are not confused with capacity or tariffs
- direct-use category signals help identify relevant records
- false positives are understandable and fixable with rules

The first target is not perfection. The first target is a review workflow where
researchers can quickly separate useful candidate facts from noise.
