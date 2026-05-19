# Research Ops Page Contract

Date: 2026-05-19

Route under review:

```text
/postgres-preview/research-ops
```

## Current Status

Current implemented functionality:

- PostgreSQL staging Research Ops route
- generated system queues for missing data, validation, source, duplicate, and
  classification issues
- persistent human-created research issues/tasks
- assignment filtering for persistent issues
- quick review/status changes for projects, plants/facilities, companies, and
  sources
- filtered CSV export
- lightweight bulk status changes
- article/entity match candidate visibility
- recent edit table

Current limitations:

- hierarchy is still too flat
- generated queues and human-created work need clearer separation
- "My work" needs to be visible immediately
- export blockers need clearer treatment
- saved operational views are not yet persisted
- field-level issues are not yet fully structured
- mobile treatment is not yet optimized

## Primary Purpose

Research Ops is the operational control center for geothermal research work.

It should coordinate:

- missing data resolution
- validation and approval workflows
- source/evidence review
- article/entity match review
- duplicate warnings
- researcher assignments
- recently edited/approved activity
- export-readiness blockers
- future AI-assisted review workflows

Research Ops should not be only a missing-data table.

## Primary Users

MVP users:

- researcher
- editor / senior editor
- admin

Future users:

- commercial/subscription manager
- external contributor/reviewer through a separate controlled interface
- AI service account / AI review assistant

## Workflow Hierarchy

The page should answer, in this order:

1. What is assigned to me?
2. What is critical or blocks export/approval?
3. What needs validation or approval?
4. What missing data should be worked through?
5. What source/evidence work is pending?
6. What duplicates or stale records need review?
7. What changed recently?
8. What can be bulk-reviewed or exported?

## Required Page Sections

### 1. Operational Status Bar

Show compact KPI/status cards for:

- critical issues
- validation backlog
- assigned to me
- source gaps
- duplicate warnings
- export blockers

Cards should be clickable or otherwise drive filtering.

### 2. My Work / Team Work

Show:

- assigned to current user
- unassigned persistent issues
- open team issues
- assigned issue records with links to detail pages

Keep this separate from generated system queues.

### 3. System Queues

Generated queues should be visibly labeled as system-generated.

Queue groups:

- Missing Data
- Sources / Evidence
- Validation / Approval
- Duplicates / Stale
- Classification

Individual queues:

- Missing coordinates
- Missing source
- Missing company link
- Missing capacity
- Missing lifecycle/status
- Missing use type/category
- Duplicate suspected
- Stale / needs update
- Source needs validation
- Approved record edited, needs re-review
- Export blockers

### 4. Research Activity

Show:

- recently edited
- recently approved
- researcher activity
- source additions
- queue completion activity

MVP can begin with recently edited and persistent issue changes.

### 5. Deep Table View

Provide:

- advanced filters
- queue tables
- row selection
- bulk actions
- CSV export
- quick status changes
- record click-through

## Filters

MVP filters:

- entity type
- country
- region later
- researcher / updated by
- assigned_to
- issue type
- priority/severity
- validation status
- source status
- lifecycle/status
- date edited later
- approved/export-ready only later
- draft/internal later

## Actions

Clickable items:

- queue cards
- queue counts
- record name
- project/plant/company/source ID
- assigned researcher
- issue type
- country
- source status
- validation status
- duplicate warning
- export-blocking warning

Research Ops actions:

- queue review
- filtering
- bulk assignment
- bulk status updates
- quick notes
- quick source additions
- bulk review
- export selected/filtered

Open record detail for:

- substantial edits
- full validation
- company links
- field corrections
- source review with wider context
- promotion/approval decisions

## Essential MVP Bulk Actions

- assign selected records/issues
- mark reviewed
- mark ready for validation
- mark needs update
- bulk approve, editor only
- bulk reject candidate match
- bulk confirm source/article match
- bulk export selected/filtered
- bulk change issue status
- bulk add note
- bulk set priority/severity

## Priority / Severity

Use lightweight priority labels:

- Critical
- Important
- Useful

Critical examples:

- missing country
- missing lifecycle/status
- missing source for export-ready record
- duplicate suspected
- approved record edited without re-review

Important examples:

- missing coordinates
- missing company link
- missing capacity
- missing owner/operator

Useful examples:

- missing technical detail
- missing summary
- missing secondary category

## Researcher Activity

MVP should show operational transparency:

- records created
- records edited
- sources added
- records submitted for validation
- approvals/rejections
- assigned queues
- unresolved assigned issues

Avoid in MVP:

- hard rankings
- gamified leaderboards
- aggressive performance scoring

Future:

- validation return rate
- task completion time
- source quality metrics
- researcher quality dashboard

## Mobile Behavior

Mobile should not try to show the full desktop table.

Mobile priority:

- assigned work
- urgent queues
- approval/review actions
- quick lookup
- quick note/source addition
- compact record cards

Use:

- stacked cards
- clear badges
- simplified filters
- limited columns
- quick actions

## MVP Implementation Slices

Slice 1:

- add clearer generated-vs-human separation
- add operational status bar
- add My Work / Team Work section
- group system queues
- clarify export blocker and source/evidence workload
- update stale page copy

Slice 2:

- add saved operational view presets
- add researcher/activity summary
- add clearer issue priority/field labels
- improve bulk issue assignment

Slice 3:

- add field-level issue persistence where needed
- add approved-record-edited queue
- add recently approved activity
- add mobile-specific compact card layout

## Future Direction

Future Research Ops should support:

- formal task/ticket objects
- automated assignment suggestions
- AI-generated queue prioritization
- automated stale detection
- advanced performance/quality analytics
- side-panel review
- inline editing
- field-level validation
- full audit/diff views
