# Article Fact Type Training Loop

Date: 2026-05-20

Purpose: sharpen article fact extraction one fact type at a time so the TGE
article archive can create useful review candidates without manually checking
every historical article.

## Current Implemented Workflow

Current implemented functionality:

- local-only deterministic article fact extraction
- no network calls
- no AI model calls
- no full article body stored in PostgreSQL
- one-fact-type review batches via `--fact-types`
- mixed confidence review samples via `--review-sample-mode mixed`
- local review workbooks with `accept`, `reject`, `unclear`, and
  `needs_rule_change`
- audit command that summarizes review quality by fact type
- `/sources/facts` fact-type filters and training definition cards

The current workflow creates candidates only. It does not update projects,
plants/facilities, companies, countries, source links, or export-ready data.

## Training Loop

Use this cycle for each fact type:

1. Define the fact type tightly.
2. Generate a small local sample for only that fact type.
3. Review the sample in Excel.
4. Mark each row as `accept`, `reject`, `unclear`, or `needs_rule_change`.
5. Run the review audit.
6. Tune extraction rules based on repeated false positives.
7. Rerun the same fact type.
8. Move to the next fact type only when false positives are manageable.

The goal is not perfection. The goal is a stable review pipeline where
high-confidence candidates are useful and weak candidates are easy to reject in
bulk.

## Review Batch Command

Run one fact type at a time:

```bash
cd "/Users/lxrichter/TGE Database/02_current_platform/tge-business-intel platform/web"
npm run tge-news:facts -- --root "/Users/lxrichter/Documents/TGE_AI/03_ai_documents/tge_news_md_canonical" --years 2026 --skip-entity-signals --fact-types capacity_signal --review-sample-per-type 50 --review-sample-mode mixed --out "../source-data/article-fact-training/capacity_signal"
```

Then review:

```bash
open "../source-data/article-fact-training/capacity_signal/article_fact_review_sample.xlsx"
```

After marking the workbook, audit it:

```bash
npm run tge-news:fact-review -- --input "../source-data/article-fact-training/capacity_signal/article_fact_review_sample.xlsx"
```

For the next fact type, replace `capacity_signal` in both the `--fact-types`
value and output folder name.

## Recommended Fact Type Order

Start with high-value structured fields:

1. `capacity_signal`
2. `cod_year_signal`
3. `public_funding_grant_amount_signal`
4. `financing_investment_amount_signal`
5. `debt_loan_amount_signal`
6. `contract_award_amount_signal`
7. `license_lease_sale_amount_signal`
8. `direct_use_category_signal`
9. `activity_status_signal`
10. `country_signal`
11. `entity_signal`

Reason: capacity and timing feed core project/asset data. Money signals are
valuable but easy to confuse, so they should be split early. Country and entity
signals are useful for matching and related news, but broader and noisier.

## Reviewer Decision Rules

Use `accept` when:

- the candidate is supported by the snippet
- the fact type is correct
- the candidate would be useful for entity matching, field suggestions,
  Research Ops review, or related-news discovery

Use `reject` when:

- the fact type is wrong
- the value is not useful for geothermal intelligence
- the snippet is too generic, promotional, or unrelated
- the candidate belongs to a more specific fact type

Use `unclear` when:

- the candidate might be valid but needs more article context
- the value is useful but the snippet is not strong enough

Use `needs_rule_change` when:

- the same wrong extraction pattern is likely to repeat
- a rule is too broad or too narrow
- the candidate reveals a missing fact subtype

## Definition Card Format

Each fact type should eventually have:

- plain-language label
- purpose
- reviewer question
- accept rules
- reject rules
- target database fields
- source confidence implications
- examples of good accepts
- examples of common rejects

The `/sources/facts` page now shows the first compact definition card when a
single fact type is selected. These definitions should be sharpened as review
feedback comes in.

## Current vs Future

Current implemented:

- deterministic local extraction
- human review
- candidate staging
- rule tuning by reviewed samples

Proposed future improvements:

- AI-assisted extraction after deterministic rules are stable
- entity-aware fact extraction using confirmed project/plant/company aliases
- confidence scoring based on source credibility and fact type
- bulk-confirm workflows for repeatedly reliable candidate types
- semantic document layer for full article text and PDFs
- field-level evidence/claim model

