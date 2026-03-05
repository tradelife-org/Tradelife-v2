-- Migration: 00020_calendar.sql
-- Purpose: Job Visits & Staff Assignments
-- Standard: ORG_ID RLS, TIMESTAMPTZ

-- ============================================================================
-- TABLE: job_visits (Scheduled Events)
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_visits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    visit_type      TEXT NOT NULL DEFAULT 'SITE_VISIT', -- SITE_VISIT, INSTALL, SNAGGING, QUOTE_VISIT
    start_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ NOT NULL,
    client_visible  BOOLEAN NOT NULL DEFAULT true,
    status          TEXT NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_times CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_job_visits_org_id ON job_visits(org_id);
CREATE INDEX IF NOT EXISTS idx_job_visits_job_id ON job_visits(job_id);
CREATE INDEX IF NOT EXISTS idx_job_visits_times ON job_visits(start_time, end_time);

ALTER TABLE job_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation select" ON job_visits FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON job_visits FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON job_visits FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON job_visits FOR DELETE USING (org_id = get_user_org_id());

CREATE TRIGGER trg_job_visits_updated_at BEFORE UPDATE ON job_visits FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- TABLE: visit_assignments (Staff Allocation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS visit_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    visit_id        UUID NOT NULL REFERENCES job_visits(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trade_role_label TEXT DEFAULT 'Lead', -- e.g. Lead, Apprentice, Electrician
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visit_assignments_visit_id ON visit_assignments(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_assignments_user_id ON visit_assignments(user_id);

ALTER TABLE visit_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation select" ON visit_assignments FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON visit_assignments FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON visit_assignments FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON visit_assignments FOR DELETE USING (org_id = get_user_org_id());

-- ============================================================================
-- PUBLIC ACCESS POLICY (For Portal Sync)
-- ============================================================================

-- Allow selecting visits via service role / RPC only? 
-- No, let's allow "public" selection if part of a job that is linked to a portal token?
-- Actually, our Portal Actions use `createServiceRoleClient` or specific logic.
-- We don't need a public policy if we fetch via Server Actions using the invite token validation pattern.
