# Deployment Baseline

Internal use only.

Railway is the intended deployment platform for the next TGE platform build baseline.

## Role Of Railway

Railway should be treated as the default deployment assumption for future planning unless a later architecture decision replaces it.

This affects:

- application runtime assumptions
- environment variable management
- production database planning
- migration strategy
- build and start scripts
- preview/staging environments
- operational monitoring and rollback expectations

## Current Prototype Position

The current Next.js + SQLite prototype runs locally and is useful for audit and product learning. It should not be treated as Railway-ready production software without review.

Railway readiness needs to cover:

- production-safe environment variables
- a production database strategy, likely PostgreSQL
- database migration tooling
- seed or admin bootstrap workflow
- build command and start command validation
- file storage assumptions
- authentication secret handling
- logging and error visibility
- backup and restore expectations

## Near-Term Development Guidance

When designing the next build, prefer choices that are straightforward to deploy on Railway:

- keep server configuration environment-driven
- avoid local filesystem assumptions for persistent data
- keep database access behind a clear adapter layer
- separate migrations from application startup
- keep secrets out of Git
- use repeatable build and start commands
- define staging and production environment variables explicitly

## Database Direction

SQLite remains useful for local prototype review. The intended production direction is a stronger relational database foundation, likely PostgreSQL.

Before implementation, confirm:

- whether Railway will host the production database directly
- whether an external managed PostgreSQL provider will be used
- how backups, restores, and migrations will be managed
- how staging and production databases will be separated

## Documentation Rule

Before any real Railway deployment setup, verify current Railway documentation and pricing/feature behavior. Do not rely only on assumptions captured in this repository.
