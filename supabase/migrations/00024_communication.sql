-- Migration: 00024_communication.sql
-- Purpose: Private Communication Engine (Chat)
-- Standard: ORG_ID RLS

-- ============================================================================
-- TABLE: communication_logs (Immutable Chat History)
-- ============================================================================

CREATE TABLE IF NOT EXISTS communication_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    sender_type     TEXT NOT NULL CHECK (sender_type IN ('CLIENT', 'ORG', 'SYSTEM', 'AI')),
    sender_id       UUID, -- User ID if ORG/CLIENT, null if SYSTEM/AI
    content         TEXT NOT NULL,
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- No 'updated_at' because chat logs are immutable
    CONSTRAINT no_phone_numbers CHECK (content !~ '\+?[0-9]{10,}') -- Basic regex check
);

CREATE INDEX IF NOT EXISTS idx_communication_logs_job_id ON communication_logs(job_id);

ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation select" ON communication_logs FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON communication_logs FOR INSERT WITH CHECK (org_id = get_user_org_id());

-- Public access via Portal Token Logic (handled via Security Definer functions or Service Role in actions)
-- But we can add a policy for authenticated clients if we had client auth.
-- For now, relying on Server Actions.
