-- Sources / Documents MVP foundation.
-- Adds source visibility, credibility/status governance, richer metadata,
-- reusable evidence-link metadata, and TGE/news/document source types.

CREATE TABLE ref_source_visibility_levels (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  is_exportable BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE ref_source_statuses (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  is_export_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO ref_source_visibility_levels
  (code, label, description, is_exportable, sort_order)
VALUES
  ('public', 'Public', 'Publicly available source suitable for internal and export-ready evidence use.', TRUE, 10),
  ('internal_only', 'Internal Only', 'Internal research note or non-public evidence. Not available for external outputs.', FALSE, 20),
  ('client_confidential', 'Client Confidential', 'Client-specific or confidential source requiring explicit restrictions.', FALSE, 30),
  ('not_for_publication', 'Not For Publication', 'Source may support internal research but must not be exposed externally.', FALSE, 40),
  ('stakeholder_confirmation', 'Stakeholder Confirmation', 'Direct confirmation from stakeholder, call, email, meeting, or event discussion.', FALSE, 50),
  ('ai_generated_needs_review', 'AI Generated - Needs Review', 'AI-generated or AI-assisted source summary that needs human review before use.', FALSE, 60)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  is_exportable = EXCLUDED.is_exportable,
  sort_order = EXCLUDED.sort_order;

INSERT INTO ref_source_statuses
  (code, label, description, is_export_eligible, sort_order)
VALUES
  ('credible', 'Credible', 'Reviewed source considered credible for internal and export-ready use.', TRUE, 10),
  ('needs_review', 'Needs Review', 'Source has been added but still requires editorial/research validation.', FALSE, 20),
  ('weak', 'Weak', 'Source exists but is weak, indirect, incomplete, or low confidence.', FALSE, 30),
  ('outdated', 'Outdated', 'Source is stale or superseded and needs replacement or confirmation.', FALSE, 40),
  ('rejected', 'Rejected', 'Source should not be used as supporting evidence.', FALSE, 90)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  is_export_eligible = EXCLUDED.is_export_eligible,
  sort_order = EXCLUDED.sort_order;

INSERT INTO ref_source_types (code, label, sort_order) VALUES
  ('tge_article', 'ThinkGeoEnergy Article', 10),
  ('external_news_article', 'External News Article', 20),
  ('company_website', 'Company Website', 30),
  ('company_report', 'Company Report', 40),
  ('government_document', 'Government Document', 50),
  ('regulator_filing', 'Regulator Filing', 60),
  ('press_release', 'Press Release', 70),
  ('pdf_report', 'PDF Report', 80),
  ('academic_paper', 'Academic Paper', 90),
  ('conference_paper_or_presentation', 'Conference Paper / Presentation', 100),
  ('dataset', 'Dataset', 110),
  ('internal_note', 'Internal Note', 120),
  ('stakeholder_confirmation', 'Stakeholder Confirmation', 130),
  ('client_confidential_source', 'Client Confidential Source', 140),
  ('web', 'Web Page', 150),
  ('article', 'Article', 160),
  ('pdf', 'PDF / Report', 170),
  ('company', 'Company Source', 180),
  ('government', 'Government Source', 190),
  ('other', 'Other', 999)
ON CONFLICT (code) DO UPDATE
SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

ALTER TABLE sources
  ADD COLUMN source_reference TEXT,
  ADD COLUMN author_organization TEXT,
  ADD COLUMN language_code TEXT,
  ADD COLUMN country TEXT,
  ADD COLUMN visibility_code TEXT NOT NULL DEFAULT 'public',
  ADD COLUMN credibility_status_code TEXT NOT NULL DEFAULT 'needs_review',
  ADD COLUMN extracted_summary TEXT,
  ADD COLUMN relevant_excerpt TEXT,
  ADD COLUMN attachment_url TEXT,
  ADD COLUMN duplicate_source_flag BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN added_by_user_id UUID,
  ADD COLUMN reviewed_by_user_id UUID,
  ADD COLUMN reviewed_at TIMESTAMPTZ,
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE sources
  ADD CONSTRAINT sources_visibility_code_fkey
  FOREIGN KEY (visibility_code)
  REFERENCES ref_source_visibility_levels(code);

ALTER TABLE sources
  ADD CONSTRAINT sources_credibility_status_code_fkey
  FOREIGN KEY (credibility_status_code)
  REFERENCES ref_source_statuses(code);

ALTER TABLE sources
  ADD CONSTRAINT sources_added_by_user_id_fkey
  FOREIGN KEY (added_by_user_id)
  REFERENCES app_users(user_id);

ALTER TABLE sources
  ADD CONSTRAINT sources_reviewed_by_user_id_fkey
  FOREIGN KEY (reviewed_by_user_id)
  REFERENCES app_users(user_id);

ALTER TABLE entity_sources
  ADD COLUMN linked_field TEXT,
  ADD COLUMN claim_text TEXT,
  ADD COLUMN extracted_value TEXT,
  ADD COLUMN is_primary_evidence BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN reviewed_by_user_id UUID,
  ADD COLUMN reviewed_at TIMESTAMPTZ,
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE entity_sources
  ADD CONSTRAINT entity_sources_reviewed_by_user_id_fkey
  FOREIGN KEY (reviewed_by_user_id)
  REFERENCES app_users(user_id);

CREATE INDEX idx_sources_type ON sources(source_type_code);
CREATE INDEX idx_sources_visibility ON sources(visibility_code);
CREATE INDEX idx_sources_credibility ON sources(credibility_status_code);
CREATE INDEX idx_sources_country ON sources(country);
CREATE INDEX idx_sources_url ON sources(url);
CREATE INDEX idx_sources_published_date ON sources(published_date);
CREATE INDEX idx_sources_updated_at ON sources(updated_at);

CREATE INDEX idx_entity_sources_confidence ON entity_sources(confidence_status_code);
CREATE INDEX idx_entity_sources_linked_field ON entity_sources(linked_field);
