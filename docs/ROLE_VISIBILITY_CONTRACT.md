# Role Visibility Contract

This note defines how user roles should shape navigation, page emphasis, visible
workflow state, and subscriber-safe presentation during design and future
implementation.

## Core Principle

All roles can share a coherent product language, but they should not see the
same product.

The platform must distinguish:

- external intelligence consumption
- internal research work
- editorial validation
- platform administration

## Role Groups

### Subscriber

Purpose: consume trusted geothermal intelligence.

Default entry:

- Dashboard or Markets

Primary pages:

- Dashboard
- Markets
- Analysis
- Map
- approved Projects
- approved Plants
- approved Companies

Should see:

- curated KPIs
- approved market summaries
- approved entity data
- approved source references where useful
- clean maps and benchmark views
- confidence language where subscriber-safe

Should not see:

- Research Ops
- validation queues
- internal reviewer notes
- audit logs
- unconfirmed article matches
- unconfirmed fact candidates
- AI uncertainty discussions
- internal source disputes
- PostgreSQL staging route names
- admin controls

Design emphasis:

- intelligence first
- governance mostly hidden
- confidence visible only when it helps trust

### Researcher

Purpose: improve records and source coverage.

Default entry:

- Research Ops

Primary pages:

- Research Ops
- Projects
- Plants
- Companies
- Sources
- Add Project / Plant / Company / Source

Should see:

- assigned work
- missing evidence
- missing fields
- source linking
- relationship workflows
- draft save flows
- validation blockers
- AI review candidates where assigned

Should not see by default:

- user administration
- platform settings
- subscription/commercial controls
- audit-confidential material unless permitted

Design emphasis:

- next required action
- source/evidence attachment
- quick editing
- queue routing
- compact review support

### Editor

Purpose: validate, approve, reject, and prepare data for export or publication.

Default entry:

- Research Ops or Command Center

Primary pages:

- Research Ops
- Sources
- Article Matches
- Fact Review
- Field Suggestions
- Projects / Plants / Companies review queues
- Readiness

Should see:

- approval readiness
- changed fields
- pending review
- evidence quality
- source credibility
- export blockers
- researcher activity
- validation history
- AI suggestion lifecycle

Should not see by default:

- user administration unless also administrator
- system-level settings unless permitted
- subscriber commercial controls

Design emphasis:

- review status over raw confidence
- approval boundaries
- audit-friendly context
- compact queue ergonomics

### Administrator

Purpose: govern the platform, users, vocabularies, readiness, and operational
health.

Default entry:

- Command Center

Primary pages:

- Command Center
- Admin
- Users
- Vocabularies
- Readiness
- Research Ops
- Design Readiness

Should see:

- full internal routing
- user management
- role management
- vocabulary governance
- readiness and cutover state
- platform health
- governance contracts

Design emphasis:

- control without cluttering researcher workflows
- clear platform health
- safe destructive-action prevention
- audit and governance visibility

## Shared Page Behavior

When one page serves multiple roles:

- show intelligence first for subscribers
- show work state first for researchers
- show approval state first for editors
- show governance/admin routes only for administrators

Shared pages should support role-aware emphasis without duplicating page logic
unnecessarily.

## Visibility Levels

Use these visibility meanings:

### Subscriber Safe

Can be shown externally.

Examples:

- approved entity values
- approved market summaries
- public source references
- curated analysis outputs

### Internal Only

Visible to TGE staff.

Examples:

- Research Ops queues
- missing data counts
- internal completeness warnings
- draft records

### Editor / Admin Only

Visible to reviewers and platform governors.

Examples:

- export readiness blockers
- approval controls
- source disputes
- validation history
- rejected candidate reasoning

### Audit Confidential

Highly restricted internal governance.

Examples:

- reviewer notes
- AI conflict discussions
- internal source reliability disputes
- detailed audit logs
- security-sensitive user actions

## Design Requirements

The design phase should define:

- role-aware sidebar emphasis
- subscriber-safe page variants
- internal governance panel treatment
- reviewer/editor queue treatment
- admin-only route visibility
- visibility badges where needed
- mobile role-specific primary actions

## Avoid

- exposing Research Ops to subscribers
- exposing internal AI uncertainty to subscribers
- making researchers work through admin-style pages
- hiding review blockers from editors
- allowing admin controls to visually dominate normal research pages
- duplicating entire page families when role-aware emphasis is enough

## Related Contracts

- `docs/ROLE_MODEL.md`
- `docs/APP_SHELL_NAVIGATION_CONTRACT.md`
- `docs/DESIGN_PHASE_ENTRY_CHECKLIST.md`
- `docs/EVIDENCE_GOVERNANCE_CONTRACT.md`
- `docs/INTELLIGENCE_LAYER_CONTRACT.md`
