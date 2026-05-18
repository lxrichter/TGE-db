-- Research Ops persistent issue/task foundation.
-- Generated queues still detect missing data from live records. These tables
-- store human-created issues, assignments, notes, and manual duplicate flags.

CREATE TABLE ref_research_issue_statuses (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE ref_research_issue_types (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'important',
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT ref_research_issue_types_severity_check
    CHECK (severity IN ('critical', 'important', 'workflow'))
);

INSERT INTO ref_research_issue_statuses
  (code, label, description, is_open, sort_order)
VALUES
  ('open', 'Open', 'Issue is open and available for research work.', TRUE, 10),
  ('in_progress', 'In Progress', 'Issue is actively being worked on.', TRUE, 20),
  ('resolved', 'Resolved', 'Issue has been resolved or validated.', FALSE, 80),
  ('dismissed', 'Dismissed', 'Issue was reviewed and dismissed as not actionable.', FALSE, 90)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  is_open = EXCLUDED.is_open,
  sort_order = EXCLUDED.sort_order;

INSERT INTO ref_research_issue_types
  (code, label, severity, description, sort_order)
VALUES
  ('missing_source', 'Missing Source', 'critical', 'Record requires source or evidence support.', 10),
  ('missing_country_location', 'Missing Country / Location', 'critical', 'Record is missing core geography.', 20),
  ('missing_lifecycle_status', 'Missing Lifecycle / Status', 'critical', 'Record is missing lifecycle or operating status classification.', 30),
  ('missing_use_type', 'Missing Use Type / Category', 'critical', 'Record is missing geothermal use type or category.', 40),
  ('duplicate_suspected', 'Duplicate Suspected', 'critical', 'Record may duplicate another project, asset, company, or source.', 50),
  ('missing_coordinates', 'Missing Coordinates', 'important', 'Record cannot appear on coordinate-confirmed map layers.', 60),
  ('missing_capacity_output', 'Missing Capacity / Output', 'important', 'Record is missing capacity or output values.', 70),
  ('missing_company_link', 'Missing Company Link', 'important', 'Record needs a structured company relationship.', 80),
  ('direct_use_classification', 'Direct-Use Classification', 'important', 'Direct-use or hybrid record needs structured category review.', 90),
  ('source_validation', 'Source Validation', 'important', 'Source or evidence link needs review.', 100),
  ('stale_record', 'Stale Record', 'workflow', 'Record should be rechecked because it may be stale.', 110),
  ('research_note', 'Research Note', 'workflow', 'General operational research note or follow-up.', 999)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  severity = EXCLUDED.severity,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

CREATE TABLE research_ops_issues (
  research_ops_issue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_type_code TEXT NOT NULL REFERENCES ref_research_issue_types(code),
  issue_status_code TEXT NOT NULL DEFAULT 'open' REFERENCES ref_research_issue_statuses(code),
  severity TEXT NOT NULL DEFAULT 'important',
  entity_type TEXT NOT NULL,
  project_id UUID REFERENCES projects(project_id) ON DELETE CASCADE,
  operating_asset_id UUID REFERENCES operating_assets(operating_asset_id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  source_id UUID REFERENCES sources(source_id) ON DELETE CASCADE,
  linked_field TEXT,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to_user_id UUID REFERENCES app_users(user_id),
  created_by_user_id UUID REFERENCES app_users(user_id),
  resolved_by_user_id UUID REFERENCES app_users(user_id),
  duplicate_candidate_entity_type TEXT,
  duplicate_candidate_entity_id UUID,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  CONSTRAINT research_ops_issues_severity_check
    CHECK (severity IN ('critical', 'important', 'workflow')),
  CONSTRAINT research_ops_issues_entity_type_check
    CHECK (entity_type IN ('project', 'operating_asset', 'company', 'source')),
  CONSTRAINT research_ops_issues_duplicate_candidate_type_check
    CHECK (
      duplicate_candidate_entity_type IS NULL
      OR duplicate_candidate_entity_type IN ('project', 'operating_asset', 'company', 'source')
    ),
  CONSTRAINT research_ops_issues_one_entity_check
    CHECK (num_nonnulls(project_id, operating_asset_id, company_id, source_id) = 1),
  CONSTRAINT research_ops_issues_entity_alignment_check
    CHECK (
      (entity_type = 'project' AND project_id IS NOT NULL)
      OR (entity_type = 'operating_asset' AND operating_asset_id IS NOT NULL)
      OR (entity_type = 'company' AND company_id IS NOT NULL)
      OR (entity_type = 'source' AND source_id IS NOT NULL)
    )
);

CREATE TABLE research_ops_issue_events (
  research_ops_issue_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_ops_issue_id UUID NOT NULL REFERENCES research_ops_issues(research_ops_issue_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_user_id UUID REFERENCES app_users(user_id),
  previous_status_code TEXT REFERENCES ref_research_issue_statuses(code),
  next_status_code TEXT REFERENCES ref_research_issue_statuses(code),
  previous_assigned_to_user_id UUID REFERENCES app_users(user_id),
  next_assigned_to_user_id UUID REFERENCES app_users(user_id),
  event_note TEXT,
  changed_fields JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_research_ops_issues_status ON research_ops_issues(issue_status_code);
CREATE INDEX idx_research_ops_issues_type ON research_ops_issues(issue_type_code);
CREATE INDEX idx_research_ops_issues_severity ON research_ops_issues(severity);
CREATE INDEX idx_research_ops_issues_entity ON research_ops_issues(entity_type);
CREATE INDEX idx_research_ops_issues_project ON research_ops_issues(project_id);
CREATE INDEX idx_research_ops_issues_asset ON research_ops_issues(operating_asset_id);
CREATE INDEX idx_research_ops_issues_company ON research_ops_issues(company_id);
CREATE INDEX idx_research_ops_issues_source ON research_ops_issues(source_id);
CREATE INDEX idx_research_ops_issues_assigned ON research_ops_issues(assigned_to_user_id);
CREATE INDEX idx_research_ops_issues_updated ON research_ops_issues(updated_at);
CREATE INDEX idx_research_ops_issue_events_issue ON research_ops_issue_events(research_ops_issue_id);
CREATE INDEX idx_research_ops_issue_events_actor ON research_ops_issue_events(actor_user_id);
