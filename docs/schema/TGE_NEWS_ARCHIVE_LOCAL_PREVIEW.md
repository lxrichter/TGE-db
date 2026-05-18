# TGE News Archive Local Preview

Purpose: provide a controllable, local-only way to inspect and normalize the
ThinkGeoEnergy markdown news archive before any bulk import into PostgreSQL.

This workflow is designed for the 17,000+ article markdown archive exported from
the ThinkGeoEnergy WordPress/news history. It does not upload article files,
does not call network APIs, and writes output only to the local ignored
`source-data/` working directory.

## Privacy And Safety

- The markdown archive stays on the local Mac.
- The preview script makes no network calls.
- Generated output is written to `source-data/`, which is ignored by Git.
- Body text is not exported by default.
- Only derived article metadata, summary counts, and candidate-link rows are
  written unless `--include-body-excerpt` is explicitly used.
- Do not commit generated preview files.
- Do not run this against client-confidential, NDA-bound, unpublished, or
  personally identifying material.

## Command

From the `web` directory:

```bash
npm run tge-news:preview -- --root "/path/to/tge_news_md_canonical"
```

For the current local archive path:

```bash
npm run tge-news:preview -- --root "/Users/lxrichter/Documents/TGE_AI/03_ai_documents/tge_news_md_canonical"
```

Optional quick test for selected years:

```bash
npm run tge-news:preview -- --root "/Users/lxrichter/Documents/TGE_AI/03_ai_documents/tge_news_md_canonical" --years 2025,2026 --candidate-limit 100
```

## Output

Default output directory:

```text
source-data/tge-news-archive-preview/
```

Generated files:

- `summary.json`
  - archive counts
  - counts by year, category, tag, and inferred use type
  - missing metadata counts
  - duplicate slug preview
  - small sample of normalized article metadata
- `article_index_preview.ndjson`
  - one metadata-only record per article
  - no body text by default
- `candidate_links_preview.csv`
  - first-pass candidate related-news rows
  - country candidates from country-like tags
  - entity-tag candidates from non-generic tags
  - internal TGE article link candidates

## Current Mapping

For each markdown article:

- `source_type_code`: `tge_article`
- `source_reference`: `TGE-MD-{YYYY-MM-DD-slug}`
- `title`: frontmatter `title`
- `published_date`: frontmatter `date`, falling back to filename date
- `url`: `https://www.thinkgeoenergy.com/{slug}/`
- `categories`: frontmatter `categories`
- `tags`: frontmatter `tags`
- `inferred_use_type`: lightweight local heuristic only

This does not replace WordPress IDs. If a future WordPress/API export provides
post IDs, those should be stored as an additional canonical reference for clean
deduplication against live WordPress data.

## What This Is Not Yet

This is not a production import and does not write to PostgreSQL.

Not yet implemented:

- full article import into `sources`
- article body/document storage
- semantic search
- AI extraction
- automated project/company/country matching
- WordPress post ID reconciliation
- related-news panels on country/market pages

## Recommended Next Step

Run the preview locally, inspect `summary.json` and
`candidate_links_preview.csv`, then define which matching rules are acceptable
for semi-automatic related-news links.

## Entity Match Preview

After running `tge-news:preview`, the next local-only step is to compare article
metadata against known project, plant/facility, and company names.

With a local entity JSON file:

```bash
npm run tge-news:match -- --entities-json "/path/to/entities.json"
```

Against Railway PostgreSQL staging, read-only:

```bash
railway run --service Postgres -- npm run tge-news:match -- --from-postgres
```

After the match-candidate migration is applied, persist review candidates:

```bash
railway run --service Postgres -- npm run tge-news:match -- --from-postgres --write-candidates
```

The matcher reads:

- `source-data/tge-news-archive-preview/article_index_preview.ndjson`
- entity names/aliases from either the local JSON file or PostgreSQL

It writes:

```text
source-data/tge-news-entity-match-preview/
```

Generated files:

- `entity_match_summary.json`
- `entity_match_candidates.csv`

By default, PostgreSQL mode only reads entity names and metadata. It writes
candidate review rows only when `--write-candidates` is explicitly provided.
It never creates real `entity_sources` links.

The local entity JSON format may be either an array or an object with an
`entities` array:

```json
[
  {
    "entity_type": "project",
    "entity_id": "stable-id-or-db-id",
    "name": "Cape Station",
    "country": "United States",
    "use_type": "power",
    "aliases": ["Cape Station Phase I", "Cape Station Phase II"]
  }
]
```

Persisted candidate rows are stored in:

```text
source_entity_match_candidates
```

Candidate status values:

- `suggested_high_confidence`
- `suggested_medium_confidence`
- `suggested_low_confidence`
- `needs_review`
- `confirmed`
- `rejected`

Confirmed and rejected rows are preserved on later matcher reruns. The matcher
may refresh confidence, reason, and metadata, but it does not reset confirmed or
rejected review decisions.

Recommended matching tiers:

- High confidence: exact database entity alias in title plus matching country.
- Medium confidence: exact entity alias in body/tags plus matching use type or
  country.
- Low confidence: tag-only match, internal TGE link relation, or broad market
  category.

Only high-confidence matches should eventually be auto-linked. Medium and low
confidence matches should go to Research Ops / source validation for review.

## Metadata Import To PostgreSQL Staging

After the archive preview has produced `article_index_preview.ndjson`, article
metadata can be imported into PostgreSQL staging as `tge_article` source
records.

Dry-run only:

```bash
npm run tge-news:import -- --limit 25
```

Apply migrations first:

```bash
railway run --service Postgres -- npm run prisma:migrate:deploy
```

Controlled full metadata import:

```bash
railway run --service Postgres -- npm run tge-news:import -- --execute
```

The import is metadata-only. It does not read or store full article body text.

Metadata stored on `sources`:

- `source_type_code = tge_article`
- `source_reference = TGE-MD-{YYYY-MM-DD-slug}`
- `title`
- `url`
- `published_date`
- `source_slug`
- `content_type_code`
- `import_source_code = markdown_archive`
- `site_code = thinkgeoenergy`
- `archive_file_path`
- `language_code`
- `metadata_json` with categories, tags, inferred use type, link counts, source
  link counts, and word count
- `last_synced_at`

Imported records default to:

- `visibility_code = public`
- `credibility_status_code = needs_review`
- no entity links
- no full article body text

Importer behavior:

- dry-run by default
- requires `--execute` to write
- upserts by `wordpress_post_id` when present, then `source_reference`, then URL
- writes local ignored summary output to `source-data/tge-news-archive-import/`
- does not auto-link articles to projects, plants/facilities, companies, or
  countries
