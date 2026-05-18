# Schema Documentation

This folder contains the database schema planning documents for the future PostgreSQL/Railway version of the TGE geothermal intelligence platform.

Start here:

1. `POSTGRES_SCHEMA_V1.md`
2. `SQLITE_TO_POSTGRES_MAPPING.md`
3. `LIVE_DATABASE_MIGRATION_PLAN.md`
4. `PRISMA_POSTGRES_BASELINE.md`
5. `SOURCES_DOCUMENTS_MVP.md`
6. `LIVE_SQLITE_INSPECTION_WORKFLOW.md`
7. `LIVE_SQLITE_AUDIT_2026-05-18.md`

Implementation SQL:

```text
database/postgres/schema_v1.sql
```

Current migration helper:

```text
web/scripts/live-sqlite-inspect.mjs
```

Live SQLite export guide:

```text
docs/schema/LIVE_SQLITE_EXPORT_GUIDE.md
docs/schema/LIVE_SQLITE_INSPECTION_WORKFLOW.md
docs/schema/LIVE_SQLITE_AUDIT_2026-05-18.md
```

Current recommended live SQLite inspection command:

```bash
cd web
npm run sqlite:inspect -- --db "../migration/live_exports/YYYY-MM-DD/tge_live_YYYYMMDD_HHMMSS.db" --profile-values
```

The output is written to ignored local `source-data/live-sqlite-inspection/`
files. It should be used for schema/mapping review before any PostgreSQL import
script is written.

PostgreSQL staging workflow:

```text
docs/schema/POSTGRES_STAGING_WORKFLOW.md
```

Current PostgreSQL/Prisma migration foundation:

```text
web/prisma/migrations/20260518000000_baseline/migration.sql
web/prisma/migrations/20260518000100_align_user_roles/migration.sql
web/prisma/migrations/20260518000200_sources_documents_mvp/migration.sql
```

Important principle:

The current live SQL database remains the source system until go-live. The local SQLite file in this workspace is useful for analysis, but the final migration must be based on a fresh export from the live server.
