# Schema Documentation

This folder contains the database schema planning documents for the future PostgreSQL/Railway version of the TGE geothermal intelligence platform.

Start here:

1. `POSTGRES_SCHEMA_V1.md`
2. `SQLITE_TO_POSTGRES_MAPPING.md`
3. `LIVE_DATABASE_MIGRATION_PLAN.md`

Implementation SQL:

```text
database/postgres/schema_v1.sql
```

Current migration helper:

```text
scripts/migration/profile_sqlite_db.py
```

Important principle:

The current live SQL database remains the source system until go-live. The local SQLite file in this workspace is useful for analysis, but the final migration must be based on a fresh export from the live server.
