-- Migration: 00019_job_life.sql
-- Purpose: Job Materials & Timeline
-- Standard: BIGINT pence, ORG_ID RLS

-- ============================================================================
-- TABLE: job_materials (Material Requirements)
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_materials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    description     TEXT NOT NULL,
    quantity        INTEGER NOT NULL DEFAULT 1,
    unit            TEXT DEFAULT 'each',
    estimated_cost  BIGINT NOT NULL DEFAULT 0, -- pence
    actual_cost     BIGINT, -- pence
    status          TEXT NOT NULL DEFAULT 'REQUIRED', -- REQUIRED, ORDERED, RECEIVED, USED
    supplier        TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_materials_job_id ON job_materials(job_id);

ALTER TABLE job_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation select" ON job_materials FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON job_materials FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON job_materials FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON job_materials FOR DELETE USING (org_id = get_user_org_id());

CREATE TRIGGER trg_job_materials_updated_at BEFORE UPDATE ON job_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- TABLE: job_timeline (Event History)
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_timeline (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    event_type      TEXT NOT NULL DEFAULT 'INFO', -- INFO, MILESTONE, ALERT, FINANCIAL
    event_date      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_timeline_job_id ON job_timeline(job_id);

ALTER TABLE job_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation select" ON job_timeline FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON job_timeline FOR INSERT WITH CHECK (org_id = get_user_org_id());
