-- Migration: 00013_emergency.sql
-- Purpose: Track urgent jobs and emergency callouts
-- Standard: ORG_ID RLS

CREATE TABLE IF NOT EXISTS emergency_callouts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    job_id          UUID REFERENCES jobs(id) ON DELETE SET NULL,
    client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
    reported_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    severity        TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status          TEXT NOT NULL DEFAULT 'OPEN', -- OPEN, ASSIGNED, RESOLVED
    description     TEXT NOT NULL,
    location        TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emergency_callouts_org_id ON emergency_callouts(org_id);
CREATE INDEX IF NOT EXISTS idx_emergency_callouts_job_id ON emergency_callouts(job_id);

ALTER TABLE emergency_callouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org isolation select" ON emergency_callouts FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON emergency_callouts FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON emergency_callouts FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON emergency_callouts FOR DELETE USING (org_id = get_user_org_id());

CREATE TRIGGER trg_emergency_callouts_updated_at BEFORE UPDATE ON emergency_callouts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
