-- Field suggestion candidate review layer.
-- AI-assisted extraction, source parsing, and future semantic workflows write
-- suggested project/asset/company field values here first. Confirmed candidates
-- may later update real entity fields through reviewed application workflows.

CREATE TABLE ref_field_suggestion_statuses (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO ref_field_suggestion_statuses
  (code, label, description, is_open, sort_order)
VALUES
  ('suggested_high_confidence', 'Suggested - High Confidence', 'Field suggestion with strong evidence and high model/rule confidence. Review before applying.', TRUE, 10),
  ('suggested_medium_confidence', 'Suggested - Medium Confidence', 'Field suggestion with useful evidence but requiring careful review.', TRUE, 20),
  ('suggested_low_confidence', 'Suggested - Low Confidence', 'Weak or ambiguous field suggestion. Review carefully before applying.', TRUE, 30),
  ('needs_review', 'Needs Review', 'Suggestion needs manual triage or assignment.', TRUE, 40),
  ('confirmed', 'Confirmed', 'Suggestion has been reviewed and accepted.', FALSE, 80),
  ('rejected', 'Rejected', 'Suggestion has been reviewed and rejected.', FALSE, 90),
  ('superseded', 'Superseded', 'Suggestion was replaced by a newer or better suggestion.', FALSE, 95)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  is_open = EXCLUDED.is_open,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

CREATE TABLE field_suggestion_candidates (
  field_suggestion_candidate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_key TEXT NOT NULL UNIQUE,

  entity_type TEXT NOT NULL CHECK (
    entity_type IN ('project', 'operating_asset', 'company')
  ),
  project_id UUID REFERENCES projects(project_id) ON DELETE CASCADE,
  operating_asset_id UUID REFERENCES operating_assets(operating_asset_id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,

  field_name TEXT NOT NULL,
  current_value TEXT,
  suggested_value TEXT NOT NULL,
  normalized_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  unit_code TEXT,

  source_id UUID REFERENCES sources(source_id) ON DELETE SET NULL,
  source_entity_match_candidate_id UUID REFERENCES source_entity_match_candidates(match_candidate_id) ON DELETE SET NULL,
  linked_entity_source_id UUID REFERENCES entity_sources(entity_source_id) ON DELETE SET NULL,
  extraction_excerpt TEXT,
  evidence_note TEXT,

  confidence_score NUMERIC(6,5) NOT NULL CHECK (
    confidence_score >= 0 AND confidence_score <= 1
  ),
  suggestion_status_code TEXT NOT NULL DEFAULT 'needs_review'
    REFERENCES ref_field_suggestion_statuses(code),
  suggestion_reason TEXT,
  suggestion_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_by TEXT NOT NULL DEFAULT 'field_suggestion_pipeline',
  model_name TEXT,
  prompt_version TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  reviewed_by_user_id UUID REFERENCES app_users(user_id),
  reviewed_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  applied_audit_event_id UUID REFERENCES audit_events(audit_event_id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT field_suggestions_one_entity_check
    CHECK (num_nonnulls(project_id, operating_asset_id, company_id) = 1),
  CONSTRAINT field_suggestions_entity_alignment_check
    CHECK (
      (entity_type = 'project' AND project_id IS NOT NULL)
      OR (entity_type = 'operating_asset' AND operating_asset_id IS NOT NULL)
      OR (entity_type = 'company' AND company_id IS NOT NULL)
    )
);

CREATE INDEX idx_field_suggestions_status
  ON field_suggestion_candidates(suggestion_status_code);
CREATE INDEX idx_field_suggestions_entity_project
  ON field_suggestion_candidates(project_id);
CREATE INDEX idx_field_suggestions_entity_asset
  ON field_suggestion_candidates(operating_asset_id);
CREATE INDEX idx_field_suggestions_entity_company
  ON field_suggestion_candidates(company_id);
CREATE INDEX idx_field_suggestions_field
  ON field_suggestion_candidates(entity_type, field_name);
CREATE INDEX idx_field_suggestions_source
  ON field_suggestion_candidates(source_id);
CREATE INDEX idx_field_suggestions_match_candidate
  ON field_suggestion_candidates(source_entity_match_candidate_id);
CREATE INDEX idx_field_suggestions_confidence
  ON field_suggestion_candidates(confidence_score DESC);
CREATE INDEX idx_field_suggestions_generated_at
  ON field_suggestion_candidates(generated_at DESC);
CREATE INDEX idx_field_suggestions_metadata
  ON field_suggestion_candidates USING GIN (suggestion_metadata);
