# Migration Scripts

This folder contains read-only profiling and future migration helpers for moving
from the current SQL/SQLite-style system into the PostgreSQL/Railway platform.

## Current Tooling

The current recommended inspection tool lives in the web app scripts so it can
run through the normal `npm` workflow:

```bash
cd web
npm run sqlite:inspect -- --db "../shared/data/tge.db" --profile-values
```

For a copied live export:

```bash
cd web
npm run sqlite:inspect -- --db "../migration/live_exports/YYYY-MM-DD/tge_live_YYYYMMDD_HHMMSS.db" --profile-values
```

The output is an ignored local folder:

```text
source-data/live-sqlite-inspection/
```

The inspector opens SQLite read-only and writes schema/count/profile files
without raw row samples.

The older Python profiler remains available as a reference helper:

```bash
python3 scripts/migration/profile_sqlite_db.py --stdout
```

## Important

The local SQLite file is not the final source of truth. The live server database
must be exported and profiled before final import scripts are written.

Do not commit live exports, staging dumps, database backups, or profile reports.
