-- TGE article metadata foundation.
-- Stores metadata-only archive/import fields on source records without storing
-- full article body text.

ALTER TABLE sources
  ADD COLUMN wordpress_post_id BIGINT,
  ADD COLUMN source_slug TEXT,
  ADD COLUMN content_type_code TEXT NOT NULL DEFAULT 'news_article',
  ADD COLUMN import_source_code TEXT,
  ADD COLUMN site_code TEXT NOT NULL DEFAULT 'thinkgeoenergy',
  ADD COLUMN archive_file_path TEXT,
  ADD COLUMN metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN last_synced_at TIMESTAMPTZ;

CREATE INDEX idx_sources_wordpress_post_id ON sources(wordpress_post_id)
  WHERE wordpress_post_id IS NOT NULL;
CREATE INDEX idx_sources_source_reference ON sources(source_reference)
  WHERE source_reference IS NOT NULL;
CREATE INDEX idx_sources_source_slug ON sources(source_slug)
  WHERE source_slug IS NOT NULL;
CREATE INDEX idx_sources_content_type ON sources(content_type_code);
CREATE INDEX idx_sources_import_source ON sources(import_source_code)
  WHERE import_source_code IS NOT NULL;
CREATE INDEX idx_sources_site_code ON sources(site_code);
CREATE INDEX idx_sources_archive_file_path ON sources(archive_file_path)
  WHERE archive_file_path IS NOT NULL;
CREATE INDEX idx_sources_metadata_json ON sources USING GIN (metadata_json);
