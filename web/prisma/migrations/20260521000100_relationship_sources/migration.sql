-- Relationship-level evidence foundation.
-- Keeps existing entity_sources as record-level evidence and adds source links
-- for specific company/project roles, company/asset roles, and company-to-company
-- ownership/group relationships.

CREATE TABLE IF NOT EXISTS relationship_sources (
  relationship_source_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES sources(source_id) ON DELETE CASCADE,
  company_project_link_id UUID REFERENCES company_project_links(company_project_link_id) ON DELETE CASCADE,
  company_operating_asset_link_id UUID REFERENCES company_operating_asset_links(company_operating_asset_link_id) ON DELETE CASCADE,
  company_relationship_id UUID REFERENCES company_relationships(company_relationship_id) ON DELETE CASCADE,
  evidence_type TEXT,
  linked_field TEXT,
  claim_text TEXT,
  extracted_value TEXT,
  evidence_note TEXT,
  confidence_status_code TEXT NOT NULL DEFAULT 'unknown'
    REFERENCES ref_estimate_statuses(code),
  is_primary_evidence BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by_user_id UUID REFERENCES app_users(user_id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    num_nonnulls(
      company_project_link_id,
      company_operating_asset_link_id,
      company_relationship_id
    ) = 1
  )
);

CREATE INDEX IF NOT EXISTS idx_relationship_sources_project_link
  ON relationship_sources(company_project_link_id);

CREATE INDEX IF NOT EXISTS idx_relationship_sources_asset_link
  ON relationship_sources(company_operating_asset_link_id);

CREATE INDEX IF NOT EXISTS idx_relationship_sources_company_relationship
  ON relationship_sources(company_relationship_id);

CREATE INDEX IF NOT EXISTS idx_relationship_sources_source
  ON relationship_sources(source_id);

CREATE INDEX IF NOT EXISTS idx_relationship_sources_confidence
  ON relationship_sources(confidence_status_code);

CREATE INDEX IF NOT EXISTS idx_relationship_sources_linked_field
  ON relationship_sources(linked_field);
