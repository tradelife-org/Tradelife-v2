-- Migration: 00025_property_assets.sql
-- Purpose: Property Asset Registry & Maintenance Reminders
-- Standard: ORG_ID RLS

-- ============================================================================
-- TABLE: property_assets (Equipment Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS property_assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
    job_id          UUID REFERENCES jobs(id) ON DELETE SET NULL,
    asset_type      TEXT NOT NULL, -- Boiler, Consumer Unit, Heat Pump, etc.
    manufacturer    TEXT,
    model           TEXT,
    serial_number   TEXT,
    install_date    DATE,
    warranty_expiry DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_assets_org_id ON property_assets(org_id);
CREATE INDEX IF NOT EXISTS idx_property_assets_client_id ON property_assets(client_id);
CREATE INDEX IF NOT EXISTS idx_property_assets_job_id ON property_assets(job_id);

ALTER TABLE property_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation select" ON property_assets FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON property_assets FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON property_assets FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON property_assets FOR DELETE USING (org_id = get_user_org_id());

CREATE TRIGGER trg_property_assets_updated_at BEFORE UPDATE ON property_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- TABLE: property_maintenance_reminders
-- ============================================================================

CREATE TABLE IF NOT EXISTS property_maintenance_reminders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    asset_id        UUID NOT NULL REFERENCES property_assets(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    due_date        DATE NOT NULL,
    status          TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, COMPLETED, OVERDUE, CANCELLED
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_reminders_org_id ON property_maintenance_reminders(org_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_reminders_asset_id ON property_maintenance_reminders(asset_id);

ALTER TABLE property_maintenance_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation select" ON property_maintenance_reminders FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON property_maintenance_reminders FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON property_maintenance_reminders FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON property_maintenance_reminders FOR DELETE USING (org_id = get_user_org_id());

CREATE TRIGGER trg_maintenance_reminders_updated_at BEFORE UPDATE ON property_maintenance_reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
