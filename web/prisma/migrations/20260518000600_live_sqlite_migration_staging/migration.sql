-- Live SQLite migration staging support.
--
-- These tables support repeatable dry runs from copied Hetzner SQLite backups
-- into PostgreSQL staging. Raw live rows are preserved as JSONB first; transform
-- scripts then normalize them into the platform tables with warnings.

CREATE TABLE IF NOT EXISTS live_sqlite_migration_runs (
  run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_label TEXT NOT NULL UNIQUE,
  source_database_file_name TEXT,
  source_database_size_bytes BIGINT,
  source_database_sha256 TEXT,
  source_table_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'created',
  import_started_at TIMESTAMPTZ,
  import_completed_at TIMESTAMPTZ,
  transform_started_at TIMESTAMPTZ,
  transform_completed_at TIMESTAMPTZ,
  validation_completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS live_sqlite_raw_rows (
  run_id UUID NOT NULL REFERENCES live_sqlite_migration_runs(run_id) ON DELETE CASCADE,
  source_table TEXT NOT NULL,
  source_row_number INTEGER NOT NULL,
  legacy_primary_key TEXT,
  row_data JSONB NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (run_id, source_table, source_row_number)
);

CREATE INDEX IF NOT EXISTS idx_live_sqlite_raw_rows_table
  ON live_sqlite_raw_rows(run_id, source_table);
CREATE INDEX IF NOT EXISTS idx_live_sqlite_raw_rows_legacy_key
  ON live_sqlite_raw_rows(run_id, source_table, legacy_primary_key);
CREATE INDEX IF NOT EXISTS idx_live_sqlite_raw_rows_data
  ON live_sqlite_raw_rows USING GIN (row_data);

CREATE TABLE IF NOT EXISTS live_sqlite_migration_warnings (
  warning_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES live_sqlite_migration_runs(run_id) ON DELETE CASCADE,
  severity TEXT NOT NULL DEFAULT 'warning',
  warning_code TEXT NOT NULL,
  source_table TEXT,
  legacy_primary_key TEXT,
  field_name TEXT,
  warning_note TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_sqlite_warnings_run
  ON live_sqlite_migration_warnings(run_id);
CREATE INDEX IF NOT EXISTS idx_live_sqlite_warnings_code
  ON live_sqlite_migration_warnings(run_id, warning_code);
CREATE INDEX IF NOT EXISTS idx_live_sqlite_warnings_source
  ON live_sqlite_migration_warnings(run_id, source_table, legacy_primary_key);

CREATE TABLE IF NOT EXISTS live_sqlite_migration_validation_results (
  validation_result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES live_sqlite_migration_runs(run_id) ON DELETE CASCADE,
  check_code TEXT NOT NULL,
  check_label TEXT NOT NULL,
  expected_count INTEGER,
  actual_count INTEGER,
  status TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, check_code)
);

CREATE INDEX IF NOT EXISTS idx_live_sqlite_validation_run
  ON live_sqlite_migration_validation_results(run_id);
CREATE INDEX IF NOT EXISTS idx_live_sqlite_validation_status
  ON live_sqlite_migration_validation_results(run_id, status);
