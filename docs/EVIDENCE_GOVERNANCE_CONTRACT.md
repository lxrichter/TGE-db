# Evidence Governance Contract

This note defines how sources, evidence links, article matches, article fact
candidates, and AI field suggestions should be represented during design and
future implementation.

## Core Principle

Evidence is a governed intelligence asset.

Sources, matches, extracted facts, and AI suggestions must not be presented as
automatic truth. They form a review pipeline that supports human-confirmed
database updates.

## Evidence Pipeline

The platform evidence flow is:

1. Source Record
2. Credibility / Review State
3. Evidence Link To Entity
4. Article Match Candidate
5. Article Fact Candidate
6. AI Field Suggestion
7. Human Confirmation
8. Audited Apply / Record Update

Design must preserve this sequence.

## Source Record

Meaning: a first-class source object such as article, report, document, URL, or
other evidence reference.

Design should show:

- source title
- source type
- source date where available
- visibility
- review status
- linked evidence count
- related article/match/fact candidate state

Source records may support entity facts, but do not update entity values by
themselves.

## Credibility / Review State

Meaning: human or editorial assessment of source usefulness.

Example states:

- New
- Needs Review
- Credible
- Weak
- Outdated
- Rejected
- Archived

Design should make credibility visible but not confuse it with entity approval.
A credible source can still support a fact that has not yet been approved.

## Evidence Link

Meaning: a controlled relationship between a source and an entity, field, fact,
or relationship.

Evidence links should support:

- project evidence
- plant evidence
- company evidence
- country / market evidence
- relationship evidence
- field-level evidence later

Design should show what the source supports, not only that a link exists.

Preferred language:

- "Supports"
- "Linked Evidence"
- "Source Evidence"
- "Evidence Coverage"

Avoid making evidence links look like generic URL attachments.

## Article Match Candidate

Meaning: a suggested link between a TGE article and an entity.

States:

- Suggested
- Confirmed
- Rejected
- Needs Review
- Possible Multiple Matches

Design priority:

- review status first
- matched entity second
- confidence/reasoning third
- evidence details expandable

Article matches should make clear that human review controls whether a source
becomes entity evidence.

## Article Fact Candidate

Meaning: extracted candidate fact from an article.

Examples:

- capacity signal
- COD signal
- drilling / construction activity
- funding / financing signal
- license / award signal
- ownership / operator signal
- technology signal

Design should show:

- fact type
- candidate value
- evidence excerpt
- source reference
- confidence
- review status

Candidate facts should never appear as final database values until confirmed
through the review workflow.

## AI Field Suggestion

Meaning: a proposed field update generated from governed evidence or extracted
facts.

Design must distinguish:

- AI suggested
- human confirmed
- ready to apply
- applied to database
- rejected

Recommended lifecycle language:

- Open Review
- Confirmed, Not Written
- Ready To Apply
- Applied To Record
- Rejected

The key message: confirm does not write to the database. Apply is the audited
write step.

## Subscriber Visibility

Subscribers may eventually see:

- approved source references
- public source titles
- source-backed confidence signals
- evidence summaries where curated

Subscribers must not see:

- internal reviewer notes
- rejected candidate reasoning
- AI uncertainty discussions
- unconfirmed article matches
- unconfirmed fact candidates
- audit-confidential source disputes
- internal Research Ops queues

## Design Requirements

The design phase should define:

- source status badges
- credibility / review state visual treatment
- evidence coverage summaries
- match review row hierarchy
- fact candidate row hierarchy
- AI suggestion lifecycle treatment
- source detail page hierarchy
- evidence link previews on entity pages
- subscriber-safe evidence display pattern
- review queue compact mode

## Governance Warnings

Evidence UI should warn when:

- source is missing for approval/export
- source is weak or outdated
- candidate fact has low confidence
- article has multiple plausible entity matches
- extracted value conflicts with existing approved value
- source is internal-only or not subscriber-safe

Warnings should be grouped by actionability:

- blocks approval
- blocks export
- needs review
- advisory improvement

## Avoid

- presenting article matches as confirmed source links
- presenting extracted facts as approved database values
- presenting AI suggestions as applied changes
- mixing source credibility with field approval
- hiding evidence coverage from editor workflows
- exposing internal evidence uncertainty to subscribers
- storing or displaying full article body text from PostgreSQL

## Related Contracts

- `docs/FORM_FIELD_STATE_CONTRACT.md`
- `docs/TABLE_LIST_VIEW_CONTRACT.md`
- `docs/STATUS_BADGE_HIERARCHY.md`
- `docs/AI_ASSISTED_DATA_FILLING_WORKFLOW.md`
- `docs/LOCAL_ARTICLE_FACT_EXTRACTION_PROTOTYPE.md`
