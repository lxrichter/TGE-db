# Hetzner Deployment Prep

Internal planning note.

The new TGE geothermal intelligence platform should remain deployable to the ThinkGeoEnergy Hetzner server environment when production-ready. The current internal site already runs at:

```text
https://internal.thinkgeoenergy.com
```

This document is not the final deployment runbook. It captures the groundwork needed before production cutover.

## Current Hosting Context

Known current state:

- Hetzner server in Germany
- current internal platform served under `internal.thinkgeoenergy.com`
- live operational data currently stored in a SQLite database file on that server
- PostgreSQL replacement is being developed and tested separately

Do not overwrite or replace the current live service until migration rehearsals and rollback are ready.

## Target Deployment Shape

Recommended target shape for production planning:

```text
Browser
  -> internal.thinkgeoenergy.com
  -> reverse proxy on Hetzner
  -> Next.js app process
  -> PostgreSQL production database
```

Production PostgreSQL location is still a deliberate decision:

- Hetzner PostgreSQL for maximum control and Germany-based hosting
- managed PostgreSQL if operations burden should remain lower

Near term:

- local and Railway PostgreSQL are staging/dev tools
- Hetzner remains the final app-hosting target unless a later decision changes this

## Deployment Decisions To Make Later

Before production setup, decide:

1. App runtime
   - Node.js process managed by `systemd`
   - or Docker/container deployment

2. PostgreSQL location
   - local PostgreSQL on Hetzner
   - separate Hetzner database server
   - managed PostgreSQL provider

3. Reverse proxy
   - Nginx
   - Caddy
   - existing server proxy setup

4. Cutover model
   - replace current internal site
   - run new platform under a temporary subpath/subdomain first
   - maintain old platform read-only for a transition period

5. Upload/file storage
   - local server storage
   - object storage
   - no uploads in MVP production

## Production Environment Variables

Expected baseline:

```text
NODE_ENV=production
NEXTAUTH_URL=https://internal.thinkgeoenergy.com
NEXTAUTH_SECRET=<strong production secret>
DATABASE_URL=<production PostgreSQL URL>
```

Optional or transition-only:

```text
DB_PATH=<legacy SQLite path>
```

The final platform should not rely on SQLite for core production data.

## Build And Start Commands

Current likely baseline:

```bash
cd web
npm ci
npm run build
npm run start
```

Before production, verify the exact commands on a clean server checkout.

## Migration Workflow Before Cutover

Minimum cutover rehearsal:

1. Create fresh backup of live SQLite database on Hetzner.
2. Download backup through a controlled channel.
3. Stage/import into local PostgreSQL.
4. Run validation and transformation scripts.
5. Review validation report.
6. Repeat against staging PostgreSQL.
7. Freeze live edits for the final migration window.
8. Run final import into production PostgreSQL.
9. Run smoke tests.
10. Switch app traffic only after acceptance.

## Backup Requirements

Production needs:

- automated PostgreSQL backups
- off-server backup copies
- documented restore command
- periodic restore test
- backup retention policy
- pre-migration snapshot before every major schema/data migration

If PostgreSQL is hosted on Hetzner, this is a first-class operational requirement, not optional polish.

## Rollback Requirements

Before cutover:

- current live SQLite service must remain restorable
- app deployment rollback command must be known
- previous Git commit or release artifact must be identifiable
- database rollback/restore strategy must be documented
- DNS/proxy change must be reversible

## Immediate Next Practical Steps

Not yet production deployment. Next practical steps are:

- keep building PostgreSQL staging functionality
- keep `/postgres-preview` as the safe transition layer
- continue validating live SQLite import quality
- document deployment assumptions as they become concrete
- decide later whether production PostgreSQL lives on Hetzner or managed hosting

## Open Questions

- Should the new platform replace `internal.thinkgeoenergy.com` directly or launch first under a temporary subdomain?
- Should production PostgreSQL live on Hetzner?
- Should the app run as a Node.js service or Docker container?
- Will uploads/PDFs be stored on the server in MVP, or deferred?
- Who will be responsible for backup monitoring and restore testing?
