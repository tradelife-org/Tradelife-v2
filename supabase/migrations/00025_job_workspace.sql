-- Migration: 00025_job_workspace.sql
-- Purpose: Collaboration, Document Vault, and Dispatch Geocoding
-- Standard: ORG_ID RLS, TIMESTAMPTZ

-- ============================================================================
-- TABLE: job_participants (Collaboration Layer)
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_participants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'STAFF', -- STAFF, SUBCONTRACTOR, CLIENT_REP
    status          TEXT NOT NULL DEFAULT 'INVITED', -- INVITED, ACTIVE, REMOVED
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(job_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_job_participants_job_id ON job_participants(job_id);
CREATE INDEX IF NOT EXISTS idx_job_participants_user_id ON job_participants(user_id);

ALTER TABLE job_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation select" ON job_participants FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON job_participants FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON job_participants FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON job_participants FOR DELETE USING (org_id = get_user_org_id());

CREATE TRIGGER trg_job_participants_updated_at BEFORE UPDATE ON job_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- TABLE: job_documents (Document Vault)
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    storage_path    TEXT NOT NULL,
    visibility      TEXT NOT NULL DEFAULT 'INTERNAL', -- INTERNAL, CLIENT_VISIBLE
    uploaded_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_documents_job_id ON job_documents(job_id);

ALTER TABLE job_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation select" ON job_documents FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON job_documents FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON job_documents FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON job_documents FOR DELETE USING (org_id = get_user_org_id());

CREATE TRIGGER trg_job_documents_updated_at BEFORE UPDATE ON job_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- TABLE: job_timeline_events (Detailed Action Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_timeline_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    event_type      TEXT NOT NULL DEFAULT 'ACTION', -- ACTION, STATUS_CHANGE, DOCUMENT, PARTICIPANT
    created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_timeline_events_job_id ON job_timeline_events(job_id);

ALTER TABLE job_timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation select" ON job_timeline_events FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON job_timeline_events FOR INSERT WITH CHECK (org_id = get_user_org_id());

-- ============================================================================
-- DISPATCH: Geocoding Support
-- ============================================================================

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS latitude FLOAT8,
ADD COLUMN IF NOT EXISTS longitude FLOAT8;
