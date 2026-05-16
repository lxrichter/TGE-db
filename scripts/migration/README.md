# Migration Scripts

This folder contains read-only profiling and future migration helpers for moving
from the current SQL/SQLite-style system into the PostgreSQL/Railway platform.

## Current Tooling

Profile the local SQLite reference database:

```bash
python3 scripts/migration/profile_sqlite_db.py
```

The default input is:

```text
shared/data/tge.db
```

The default output is an ignored local report folder:

```text
migration/profile_reports/
```

Print the report to the terminal instead:

```bash
python3 scripts/migration/profile_sqlite_db.py --stdout
```

## Important

The local SQLite file is not the final source of truth. The live server database
must be exported and profiled before final import scripts are written.

Do not commit live exports, staging dumps, database backups, or profile reports.
