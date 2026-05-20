# Deployment Baseline

Internal use only.

The deployment direction is now a staged hybrid path:

- use local development and Railway PostgreSQL for controlled PostgreSQL staging while the model and workflows stabilize
- keep the current live internal site on Hetzner untouched until a tested cutover path exists
- prepare the new platform to be deployable on the ThinkGeoEnergy Hetzner server environment, currently serving `internal.thinkgeoenergy.com`

This replaces the earlier assumption that Railway is the default final hosting platform.

## Current Position

Current live system:

- hosted on a Hetzner server in Germany
- available under `internal.thinkgeoenergy.com`
- backed by a live SQLite database file on the server
- still the operational live database until the PostgreSQL replacement is ready

Current development/staging system:

- Next.js app under `web/`
- PostgreSQL schema managed with Prisma migrations
- local PostgreSQL and Railway PostgreSQL used for staging and workflow validation
- `/postgres-preview` routes are the PostgreSQL staging surface
- source/evidence, Research Ops, article matching, and AI candidate workflows are being built against PostgreSQL staging

## Recommended Path

Use the hybrid path until production cutover:

1. Local development
   - build and test features locally
   - use local PostgreSQL for safe prototype runs where useful
   - keep raw article archives and live database backups local/private

2. Railway PostgreSQL staging
   - use as controlled hosted PostgreSQL staging while schema and workflows evolve
   - do not treat it as final production until backup, access, and governance decisions are confirmed
   - import controlled batches, not uncontrolled full archive data

3. Hetzner production preparation
   - prepare the app to run cleanly on the Hetzner server or a successor Hetzner environment
   - decide whether production PostgreSQL also lives on Hetzner or remains managed elsewhere
   - define backup, restore, deployment, monitoring, and rollback before cutover

## Key Production Decision Still Open

Before production launch, decide where production PostgreSQL lives:

### Option A: Hetzner App + Hetzner PostgreSQL

Benefits:

- strongest data-control story
- Germany-based hosting aligned with current setup
- fewer external runtime dependencies

Tradeoffs:

- TGE/team must manage backups, upgrades, monitoring, disk space, and restore testing
- requires careful server hardening and operational discipline

### Option B: Hetzner App + Managed PostgreSQL

Benefits:

- less database operations work
- managed backups and simpler maintenance depending on provider
- app can still run under the existing Hetzner/domain strategy

Tradeoffs:

- cross-provider dependency
- data residency, access, and cost need explicit review

### Current Recommendation

Keep Railway/PostgreSQL staging while building. Revisit production database hosting before final migration rehearsal.

Default production preference should lean toward Hetzner-hosted PostgreSQL if TGE wants maximum control and Germany-based hosting, provided backup/restore operations are handled properly.

## Production Readiness Requirements

Do not cut over until these are true:

- PostgreSQL schema is stable enough for MVP production
- live SQLite import has been rehearsed from a fresh backup
- migration validation reports are clean or accepted with documented exceptions
- admin/editor/researcher access works against production-like data
- source/evidence workflows do not expose internal/confidential fields incorrectly
- Research Ops queues are understandable enough for daily work
- exports are clearly separated as internal operational exports versus future client/report-ready exports
- deployment can be repeated from Git
- environment variables are documented outside Git
- backups and restore tests are proven
- rollback path is documented

## Runtime And Environment Rules

The app should remain environment-driven:

- no production secrets in Git
- no production database files in Git
- no raw imports or local article archives in Git
- no hardcoded production URLs except where explicitly documented
- deployment should work from a clean checkout plus environment variables

Important production variables will include:

```text
NEXTAUTH_URL=https://internal.thinkgeoenergy.com
NEXTAUTH_SECRET=<production secret>
DATABASE_URL=<production PostgreSQL connection string>
```

SQLite-era variables such as `DB_PATH` may remain temporarily during transition, but the final production system should not depend on SQLite for core platform data.

## Hetzner Deployment Runbook Placeholder

A final Hetzner runbook should define:

- server access model
- Node.js runtime or Docker strategy
- process manager, e.g. systemd or container service
- reverse proxy, likely Nginx or Caddy
- TLS certificate handling
- environment variable location
- PostgreSQL location and access
- backup schedule
- restore test command
- migration command
- build command
- start command
- rollback command
- log locations
- monitoring and alerting expectations

## Near-Term Development Guidance

While building, prefer choices that keep Hetzner deployment simple:

- keep database access behind Prisma/PostgreSQL services
- avoid relying on local persistent filesystem writes for application data
- keep article archive ingestion as controlled local/staging jobs, not runtime assumptions
- separate migrations from application startup
- keep staging and production databases separate
- make exports and imports explicit operations
- keep source/evidence governance separate from AI-generated candidates

## Documentation Rule

Before any real production deployment, verify current server state and current deployment tool behavior. This document is a planning baseline, not a substitute for a tested production runbook.
