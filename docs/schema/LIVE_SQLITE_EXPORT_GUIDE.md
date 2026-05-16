# Live SQLite Export Guide

Date: 2026-05-16

Purpose: safely copy the current live SQLite database from the Hetzner server for
migration profiling and import testing.

## Principle

The live SQLite database remains the source of truth until cutover.

Do not copy the live file directly while the application may be writing to it.
Create a consistent backup copy on the server first, then download that backup.

## Local Export Folder

Use a timestamped local folder:

```text
migration/live_exports/YYYY-MM-DD/
```

This folder is ignored by Git. Do not commit live exports, compressed backups,
or generated profile reports.

## Recommended Server-Side Backup

SSH into the server and create a backup copy using SQLite's backup command:

```bash
sqlite3 /path/to/live/tge.db ".backup '/tmp/tge_live_YYYYMMDD_HHMMSS.db'"
```

Then verify the backup on the server:

```bash
sqlite3 /tmp/tge_live_YYYYMMDD_HHMMSS.db "PRAGMA integrity_check;"
```

Expected result:

```text
ok
```

Compress the backup before download:

```bash
gzip -c /tmp/tge_live_YYYYMMDD_HHMMSS.db > /tmp/tge_live_YYYYMMDD_HHMMSS.db.gz
```

## Download To Local Machine

From the local project folder:

```bash
mkdir -p migration/live_exports/YYYY-MM-DD
scp USER@SERVER:/tmp/tge_live_YYYYMMDD_HHMMSS.db.gz migration/live_exports/YYYY-MM-DD/
```

Then decompress locally:

```bash
gunzip -k migration/live_exports/YYYY-MM-DD/tge_live_YYYYMMDD_HHMMSS.db.gz
```

## Local Verification And Profile

Check the copied database:

```bash
sqlite3 migration/live_exports/YYYY-MM-DD/tge_live_YYYYMMDD_HHMMSS.db "PRAGMA integrity_check;"
```

Run the migration profiler:

```bash
python3 scripts/migration/profile_sqlite_db.py \
  --db migration/live_exports/YYYY-MM-DD/tge_live_YYYYMMDD_HHMMSS.db
```

The profile report is written to:

```text
migration/profile_reports/
```

## After Profiling

Compare the live export profile against the local reference profile.

Key checks:

- row counts by table
- extra/missing tables
- extra/missing columns
- status and phase values
- company role values
- orphan relationships
- invalid coordinates or negative capacity values

Only after this comparison should import and transformation scripts be written.
