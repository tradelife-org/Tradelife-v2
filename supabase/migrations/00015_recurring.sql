-- Migration: 00015_recurring.sql
-- Purpose: Track recurring jobs and maintenance schedules
-- Standard: BIGINT pence, ORG_ID RLS

CREATE TABLE IF NOT EXISTS maintenance_schedules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    client_id       UUID REFERENCES clients(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    frequency       TEXT NOT NULL, -- 'weekly', 'monthly', 'quarterly', 'yearly'
    next_due_date   DATE NOT NULL,
    last_service_date DATE,
    amount_net      BIGINT NOT NULL DEFAULT 0, -- pence
    active          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_org_id ON maintenance_schedules(org_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_client_id ON maintenance_schedules(client_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_due_date ON maintenance_schedules(next_due_date);

ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org isolation select" ON maintenance_schedules FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON maintenance_schedules FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON maintenance_schedules FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON maintenance_schedules FOR DELETE USING (org_id = get_user_org_id());

CREATE TRIGGER trg_maintenance_schedules_updated_at BEFORE UPDATE ON maintenance_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
