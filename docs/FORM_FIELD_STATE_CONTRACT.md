# Form Field State Contract

This note defines the semantic states that create/edit forms must communicate
during the design phase. The goal is to make record editing fast while keeping
review, approval, source evidence, and AI-assisted suggestions clearly
separated.

## Core Principle

Saving a draft, submitting for review, approving a field, and applying an
AI-derived suggestion are different actions.

The visual design must make these states unmistakable without making every form
feel like a warning screen.

## Field State Vocabulary

### Required

Meaning: field is needed for the record to be considered complete enough for a
specific workflow.

Use for:

- critical identity fields
- country / market fields
- capacity fields when needed for analysis
- source-required fields before approval or export

Design behavior:

- visible but not alarming while saving draft
- stronger when submitting for review or export
- should explain what workflow is blocked

### Edited

Meaning: field value has changed from the last saved or approved value.

Use for:

- inline edited-field highlight
- pending review summaries
- changed-fields-for-review panels

Design behavior:

- quiet highlight
- should not imply error
- should be easy for editors to scan

### Pending Approval

Meaning: edited value has been saved but not approved.

Use for:

- staged updates
- reviewer queues
- export readiness blockers

Design behavior:

- more visible than Edited
- should show who changed it and when when available
- should link or route to approval workflow where possible

### Approved

Meaning: field value is accepted for internal use and downstream workflows.

Use for:

- approved values
- export-ready values
- source-backed confirmed facts

Design behavior:

- should be calm and not over-colored
- can use green accents or approved badges sparingly
- should not visually dominate normal filled fields

### Blocked

Meaning: field or record cannot move to approval, export, or subscriber-safe
state until resolved.

Use for:

- missing critical source
- invalid country/region relation
- conflicting company relationship
- duplicate risk
- export blocker

Design behavior:

- red or high-attention treatment
- should state the blocked workflow
- should include next action where possible

### Advisory / Recommended

Meaning: field is incomplete or weak, but does not block saving or internal
draft progress.

Use for:

- nice-to-have source improvements
- missing secondary metadata
- old or weak evidence
- future enrichment opportunities

Design behavior:

- neutral or amber-light treatment
- should not compete with blocked states

### AI Suggested

Meaning: value was proposed by article extraction, AI review, or candidate
logic and has not been human confirmed.

Use for:

- field suggestion candidates
- article fact candidates
- match-derived possible updates

Design behavior:

- visually distinct from approved fields
- secondary to human-confirmed values
- must not look like an applied database value
- should show source/candidate context when available

### Source Backed

Meaning: field value has supporting evidence or linked source context.

Use for:

- source-evidence coverage
- confidence indicators
- reviewer trust signals

Design behavior:

- should be compact
- should not imply all sources have equal credibility
- should link to source detail when possible

## Workflow Mapping

Draft Save:

- allowed with incomplete non-critical fields
- shows Required and Advisory states without blocking save

Submit For Review:

- checks required review fields
- highlights Pending Approval and Blocked states

Approve:

- requires approval fields and source/evidence expectations
- converts approved staged values into accepted record state

Apply AI Suggestion:

- only after human confirmation
- should create or preserve audit context
- must never bypass approval semantics

Export / Subscriber-Safe:

- stricter than draft or internal review
- blocked by unresolved evidence, validation, or approval requirements

## Design Requirements

The design phase should define:

- field border/background/label treatment for each state
- compact edited-field markers
- pending approval summary rows
- blocking vs advisory panel hierarchy
- source-backed markers
- AI-suggested candidate markers
- mobile behavior for long forms
- sticky readiness/sidebar behavior for edit pages

## Avoid

- using red for every missing field
- making draft editing feel blocked
- making AI suggestions look like confirmed values
- mixing source confidence with approval state
- hiding pending approval state inside small text only
- showing all readiness warnings with equal visual weight

## Related Contracts

- `docs/DESIGN_TOKEN_CONTRACT.md`
- `docs/STATUS_BADGE_HIERARCHY.md`
- `docs/DESIGN_PHASE_ENTRY_CHECKLIST.md`
