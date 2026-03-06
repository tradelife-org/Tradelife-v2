-- Migration: 00021_assistant_life.sql
-- Purpose: Unified Inbox & Task Management
-- Standard: ORG_ID RLS, TIMESTAMPTZ

-- ============================================================================
-- TABLE: inbox_messages (Unified Communications)
-- ============================================================================

CREATE TABLE IF NOT EXISTS inbox_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    source          TEXT NOT NULL CHECK (source IN ('EMAIL', 'SMS', 'WHATSAPP', 'PORTAL', 'SYSTEM')),
    sender          TEXT, -- Name or Phone/Email
    content         TEXT NOT NULL,
    priority        TEXT DEFAULT 'NORMAL', -- NORMAL, HIGH, URGENT
    is_read         BOOLEAN NOT NULL DEFAULT false,
    source_ref_id   UUID, -- e.g. link to portal_messages.id if synced
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inbox_messages_org_id ON inbox_messages(org_id);
CREATE INDEX IF NOT EXISTS idx_inbox_messages_read ON inbox_messages(org_id, is_read);

ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation select" ON inbox_messages FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON inbox_messages FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON inbox_messages FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON inbox_messages FOR DELETE USING (org_id = get_user_org_id());

CREATE TRIGGER trg_inbox_messages_updated_at BEFORE UPDATE ON inbox_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- TABLE: assistant_tasks (Task State Machine)
-- ============================================================================

CREATE TABLE IF NOT EXISTS assistant_tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    status          TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, DONE
    priority        TEXT DEFAULT 'NORMAL',
    due_date        TIMESTAMPTZ,
    assigned_to     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    related_job_id  UUID REFERENCES jobs(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assistant_tasks_org_id ON assistant_tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_assistant_tasks_status ON assistant_tasks(org_id, status);

ALTER TABLE assistant_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation select" ON assistant_tasks FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON assistant_tasks FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON assistant_tasks FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON assistant_tasks FOR DELETE USING (org_id = get_user_org_id());

CREATE TRIGGER trg_assistant_tasks_updated_at BEFORE UPDATE ON assistant_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
