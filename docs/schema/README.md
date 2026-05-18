# Schema Documentation

This folder contains the database schema planning documents for the future PostgreSQL/Railway version of the TGE geothermal intelligence platform.

Start here:

1. `POSTGRES_SCHEMA_V1.md`
2. `SQLITE_TO_POSTGRES_MAPPING.md`
3. `LIVE_DATABASE_MIGRATION_PLAN.md`
4. `PRISMA_POSTGRES_BASELINE.md`
5. `SOURCES_DOCUMENTS_MVP.md`

Implementation SQL:

```text
database/postgres/schema_v1.sql
```

Current migration helper:

```text
scripts/migration/profile_sqlite_db.py
```

Live SQLite export guide:

```text
docs/schema/LIVE_SQLITE_EXPORT_GUIDE.md
```

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
