-- Local markdown article fact candidate staging layer.
-- This stores compact extracted signals from TGE article metadata/body parsing,
-- not full article body text. Candidates remain reviewable and must not update
-- entity records automatically.

CREATE TABLE ref_article_fact_candidate_statuses (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO ref_article_fact_candidate_statuses
  (code, label, description, is_open, sort_order)
VALUES
  ('suggested', 'Suggested', 'New extracted article fact candidate awaiting review.', TRUE, 10),
  ('needs_review', 'Needs Review', 'Candidate needs manual triage or assignment.', TRUE, 20),
  ('confirmed', 'Confirmed', 'Candidate has been reviewed and accepted.', FALSE, 80),
  ('rejected', 'Rejected', 'Candidate has been reviewed and rejected.', FALSE, 90),
  ('superseded', 'Superseded', 'Candidate was replaced by a newer or better candidate.', FALSE, 95)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  is_open = EXCLUDED.is_open,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

CREATE TABLE article_fact_candidates (
  article_fact_candidate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fact_key TEXT NOT NULL UNIQUE,

  source_id UUID REFERENCES sources(source_id) ON DELETE SET NULL,
  source_reference TEXT NOT NULL,
  archive_file_path TEXT,
  published_date DATE,

  fact_type_code TEXT NOT NULL,
  entity_type TEXT,
  entity_label TEXT,
  field_name TEXT,
  extracted_value TEXT NOT NULL,
  normalized_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  unit_code TEXT,
  evidence_snippet TEXT,

  confidence_score NUMERIC(6,5) NOT NULL CHECK (
    confidence_score >= 0 AND confidence_score <= 1
  ),
  fact_status_code TEXT NOT NULL DEFAULT 'suggested'
    REFERENCES ref_article_fact_candidate_statuses(code),
  fact_reason TEXT,
  extraction_method TEXT NOT NULL DEFAULT 'local_markdown_regex_v1',
  extraction_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by_user_id UUID REFERENCES app_users(user_id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT article_fact_candidates_snippet_length_check
    CHECK (evidence_snippet IS NULL OR length(evidence_snippet) <= 500)
);

CREATE INDEX idx_article_fact_candidates_source
  ON article_fact_candidates(source_id);
CREATE INDEX idx_article_fact_candidates_reference
  ON article_fact_candidates(source_reference);
CREATE INDEX idx_article_fact_candidates_type
  ON article_fact_candidates(fact_type_code);
CREATE INDEX idx_article_fact_candidates_status
  ON article_fact_candidates(fact_status_code);
CREATE INDEX idx_article_fact_candidates_entity
  ON article_fact_candidates(entity_type, entity_label);
CREATE INDEX idx_article_fact_candidates_field
  ON article_fact_candidates(field_name);
CREATE INDEX idx_article_fact_candidates_confidence
  ON article_fact_candidates(confidence_score DESC);
CREATE INDEX idx_article_fact_candidates_generated
  ON article_fact_candidates(generated_at DESC);
CREATE INDEX idx_article_fact_candidates_metadata
  ON article_fact_candidates USING GIN (extraction_metadata);
CREATE INDEX idx_article_fact_candidates_normalized
  ON article_fact_candidates USING GIN (normalized_value);
