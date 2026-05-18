# Live SQLite Inspection Workflow

Date: 2026-05-18

Purpose: inspect the current Hetzner-hosted SQLite database safely before any
PostgreSQL migration work is attempted.

This workflow is for local/private migration preparation only. It does not
import the live database into PostgreSQL and does not upload the database file.

## Ground Rules

- Do not commit the live SQLite database, compressed backups, profile reports,
  source spreadsheets, or generated exports.
- Do not upload the live database file into Codex, ChatGPT, GitHub, Railway, or
  any public/shared environment.
- Work from a timestamped backup copy, not the live file while the app may be
  writing to it.
- The first inspection should produce schema, table counts, column metadata,
  indexes, foreign keys, and aggregate completeness metrics only.
- No migration/import script should be written until the live schema has been
  compared against the current PostgreSQL mapping.

The repository already ignores:

```text
migration/live_exports/
migration/profile_reports/
source-data/
*.db
*.sqlite
*.sqlite3
```

## What You Need To Access

Before running this workflow, you need:

- SSH access to the Hetzner server.
- The filesystem path to the current live SQLite database on that server.
- Permission to run `sqlite3` on the server, or help from the server admin.
- Your local project checkout on your Mac.

If you do not know the live SQLite path yet, that is the first thing to confirm
on the server before doing anything else.

## Step 1: Create A Consistent Backup On Hetzner

SSH into the server:

```bash
ssh USER@SERVER
```

Create a SQLite backup copy. Replace `/path/to/live/tge.db` with the actual
server path:

```bash
sqlite3 /path/to/live/tge.db ".backup '/tmp/tge_live_YYYYMMDD_HHMMSS.db'"
```

Check that the backup is valid:

```bash
sqlite3 /tmp/tge_live_YYYYMMDD_HHMMSS.db "PRAGMA integrity_check;"
```

Expected result:

```text
ok
```

Compress the backup:

```bash
gzip -c /tmp/tge_live_YYYYMMDD_HHMMSS.db > /tmp/tge_live_YYYYMMDD_HHMMSS.db.gz
```

Then leave the server:

```bash
exit
```

## Step 2: Download The Backup Locally

From your Mac:

```bash
cd "/Users/lxrichter/TGE Database/02_current_platform/tge-business-intel platform"
mkdir -p migration/live_exports/YYYY-MM-DD
scp USER@SERVER:/tmp/tge_live_YYYYMMDD_HHMMSS.db.gz migration/live_exports/YYYY-MM-DD/
gunzip -k migration/live_exports/YYYY-MM-DD/tge_live_YYYYMMDD_HHMMSS.db.gz
```

This folder is ignored by Git.

## Step 3: Run The Safe Local Inspector

From the app folder:

```bash
cd "/Users/lxrichter/TGE Database/02_current_platform/tge-business-intel platform/web"
npm run sqlite:inspect -- --db "../migration/live_exports/YYYY-MM-DD/tge_live_YYYYMMDD_HHMMSS.db"
```

This writes metadata-only inspection files to:

```text
source-data/live-sqlite-inspection/
```

To add aggregate completeness metrics, run:

```bash
npm run sqlite:inspect -- --db "../migration/live_exports/YYYY-MM-DD/tge_live_YYYYMMDD_HHMMSS.db" --profile-values
```

The `--profile-values` mode still does not export raw row values. It adds:

- null/blank counts
- distinct non-blank counts
- minimum text length
- maximum text length

## Inspector Output Files

The inspector writes:

```text
summary.json
tables.csv
columns.csv
foreign_keys.csv
indexes.csv
schema.sql
sensitive_columns.csv
value_profiles.csv   # only with --profile-values
```

These outputs are still local/ignored working files. They are much safer than
the database itself, but review them before sharing externally.

## What To Share For Migration Planning

For the next planning pass, the useful files are:

- `summary.json`
- `tables.csv`
- `columns.csv`
- `foreign_keys.csv`
- `indexes.csv`
- `value_profiles.csv`, if generated

Do not share the SQLite database file itself unless there is a deliberate
private handling process for it.

## Next Step After Inspection

After the inspection exists, compare it against:

```text
docs/schema/SQLITE_TO_POSTGRES_MAPPING.md
```

The migration mapping should then be updated with:

- live-only tables
- live-only columns
- missing expected tables/columns
- unmapped statuses
- unmapped lifecycle phases
- unmapped company roles
- source/evidence fields that need preservation
- fields that should move into notes, metadata, or future structured models

Only after that comparison should staging import and transformation scripts be
created.
