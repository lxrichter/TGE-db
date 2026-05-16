# Database

Database planning and implementation assets for the future TGE geothermal intelligence platform.

Current baseline:

```text
postgres/schema_v1.sql
```

This PostgreSQL schema is based on:

- `docs/SEMANTIC_MODEL_V1.md`
- current prototype audit findings
- current local SQLite schema analysis
- the requirement to migrate/import the current live SQL database at go-live

Important:

- Do not commit live database dumps here.
- Do not commit local SQLite databases here.
- Migration scripts should preserve legacy IDs from the current live system.
- Final schema validation should be run against PostgreSQL, ideally Railway staging or a local PostgreSQL instance.
