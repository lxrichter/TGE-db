# Hetzner Deployment Groundwork

This is the current deployment planning note for the TGE Database platform. It
is not a final production runbook yet. It records the recommended direction so
local PostgreSQL/Railway work does not drift away from the eventual Hetzner
deployment at `internal.thinkgeoenergy.com`.

## Current Implemented State

- The app is a Next.js platform in `web/`.
- Local development currently uses `npm run dev`.
- Production build is verified with `npm run build`.
- PostgreSQL schema changes are managed through Prisma migrations:
  `npm run prisma:migrate:deploy`.
- The current live legacy database is a SQLite file on the Hetzner server.
- The new PostgreSQL staging model can import, transform, and validate a copied
  live SQLite backup through the `live-sqlite:*` scripts.
- Source/article/AI review workflows are local/staging controlled and do not
  automatically overwrite validated entity records.

## Recommended Production Direction

Use Hetzner as the production host for the web application and the production
PostgreSQL database unless a later infrastructure decision says otherwise.

Recommended target architecture:

- Hetzner server
- PostgreSQL database on the same server or a dedicated Hetzner database host
- Next.js app running as a long-lived service
- Nginx reverse proxy for `internal.thinkgeoenergy.com`
- TLS through Certbot/Let’s Encrypt
- daily PostgreSQL backups
- explicit staging-to-production migration process

Railway can remain useful for early hosted PostgreSQL testing, but production
should be planned so the platform can run independently on TGE-controlled
infrastructure.

## Environment Variables

Production will need at least:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
NEXTAUTH_URL="https://internal.thinkgeoenergy.com"
NEXTAUTH_SECRET="long-random-secret"
```

Optional/transition variables:

```bash
DATABASE_PUBLIC_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
DB_PATH="/opt/tge-app/tge-business-intel/shared/data/tge.db"
```

`DB_PATH` is only for the legacy SQLite-backed parts of the current platform and
should eventually disappear once PostgreSQL becomes the production data core.

## Deployment Shape

Recommended app location:

```bash
/opt/tge-app/tge-business-intel
```

Recommended production steps:

```bash
cd /opt/tge-app/tge-business-intel/web
npm ci
npm run prisma:migrate:deploy
npm run build
npm run start
```

For a persistent production service, use `systemd` or a process manager. The
preferred production direction is `systemd` because it is explicit, stable, and
server-native.

Example service shape:

```ini
[Unit]
Description=TGE Database Next.js app
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/tge-app/tge-business-intel/web
EnvironmentFile=/opt/tge-app/tge-business-intel/web/.env.production
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
User=tge-app

[Install]
WantedBy=multi-user.target
```

This is a template only. Paths, Node version, user, and environment file should
be confirmed on the server before production use.

## Nginx Reverse Proxy Shape

`internal.thinkgeoenergy.com` should proxy to the local Next.js port.

Example shape:

```nginx
server {
  server_name internal.thinkgeoenergy.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

TLS should be added with Certbot after DNS and Nginx are confirmed.

## Migration And Cutover Sequence

Recommended future cutover sequence:

1. Freeze or snapshot the live SQLite database.
2. Create a verified SQLite backup on the Hetzner server.
3. Copy the backup into the controlled local/staging migration folder.
4. Run SQLite inspection and migration validation locally.
5. Stage the live SQLite backup into PostgreSQL staging tables.
6. Transform into PostgreSQL target tables.
7. Validate counts, critical fields, duplicates, source links, and sample
   records.
8. Deploy migrations to the production PostgreSQL database.
9. Load transformed production data.
10. Run smoke tests and record-level spot checks.
11. Switch the web app to PostgreSQL production variables.
12. Keep the SQLite backup archived and read-only for rollback/audit.

No production import should happen without a fresh backup and validation pass.

## Backup Requirements

Minimum production backup policy:

- daily `pg_dump` backup
- keep at least 14 daily backups
- keep weekly/monthly snapshots once the database becomes business-critical
- store backups outside the app directory
- periodically test restore into a separate database

Example backup shape:

```bash
pg_dump "$DATABASE_URL" | gzip > /var/backups/tge-db/tge-postgres-$(date +%F).sql.gz
```

## Open Decisions

- Should production PostgreSQL run on the same Hetzner server or a separate
  managed/dedicated database host?
- Should Railway remain a staging PostgreSQL environment after Hetzner
  production is live?
- What is the desired production deployment user and directory ownership model?
- What backup retention policy is appropriate once subscriber/client outputs
  depend on the platform?
- Should there be a separate staging subdomain before production cutover, e.g.
  `staging.internal.thinkgeoenergy.com`?

## Near-Term Recommendation

Continue product development locally and in PostgreSQL staging. Before any
production cutover, perform one complete rehearsal:

- deploy the app to a non-production Hetzner path or subdomain
- deploy PostgreSQL migrations
- import a fresh SQLite backup
- validate key records and workflows
- verify login, Research Ops, Sources, project/asset/company detail pages,
  exports, and global search

Only after this rehearsal should `internal.thinkgeoenergy.com` be moved to the
new PostgreSQL-backed app.
