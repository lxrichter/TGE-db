-- Source/entity match candidate review layer.
-- Automated article/entity matching writes here first. Confirmed candidates can
-- later create real entity_sources links through a reviewed workflow.

CREATE TABLE ref_source_match_statuses (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO ref_source_match_statuses
  (code, label, description, is_open, sort_order)
VALUES
  ('suggested_high_confidence', 'Suggested - High Confidence', 'Automated match candidate with high confidence. Review before confirming.', TRUE, 10),
  ('suggested_medium_confidence', 'Suggested - Medium Confidence', 'Automated match candidate with medium confidence. Requires review.', TRUE, 20),
  ('suggested_low_confidence', 'Suggested - Low Confidence', 'Automated match candidate with weak confidence. Requires careful review.', TRUE, 30),
  ('needs_review', 'Needs Review', 'Candidate needs manual review or triage.', TRUE, 40),
  ('confirmed', 'Confirmed', 'Candidate has been reviewed and confirmed.', FALSE, 80),
  ('rejected', 'Rejected', 'Candidate has been reviewed and rejected.', FALSE, 90)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  is_open = EXCLUDED.is_open,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

CREATE TABLE source_entity_match_candidates (
  match_candidate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_key TEXT NOT NULL UNIQUE,

  source_id UUID NOT NULL REFERENCES sources(source_id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (
    entity_type IN (
      'project',
      'operating_asset',
      'company',
      'country_market',
      'technology',
      'internal_tge_article',
      'other'
    )
  ),
  entity_id UUID,
  entity_key TEXT,
  entity_label TEXT NOT NULL,

  matched_alias TEXT,
  confidence_score NUMERIC(6,5) NOT NULL CHECK (
    confidence_score >= 0 AND confidence_score <= 1
  ),
  match_status_code TEXT NOT NULL DEFAULT 'needs_review'
    REFERENCES ref_source_match_statuses(code),
  match_reason TEXT,
  match_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_by TEXT NOT NULL DEFAULT 'tge_news_matcher',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  reviewed_by_user_id UUID REFERENCES app_users(user_id),
  reviewed_at TIMESTAMPTZ,
  confirmed_entity_source_id UUID REFERENCES entity_sources(entity_source_id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_source_match_candidates_source
  ON source_entity_match_candidates(source_id);
CREATE INDEX idx_source_match_candidates_entity
  ON source_entity_match_candidates(entity_type, entity_id);
CREATE INDEX idx_source_match_candidates_key
  ON source_entity_match_candidates(entity_type, entity_key);
CREATE INDEX idx_source_match_candidates_status
  ON source_entity_match_candidates(match_status_code);
CREATE INDEX idx_source_match_candidates_confidence
  ON source_entity_match_candidates(confidence_score DESC);
CREATE INDEX idx_source_match_candidates_generated_at
  ON source_entity_match_candidates(generated_at DESC);
CREATE INDEX idx_source_match_candidates_metadata
  ON source_entity_match_candidates USING GIN (match_metadata);
