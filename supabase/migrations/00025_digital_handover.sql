-- Migration: 00025_digital_handover.sql
-- Purpose: Digital Handover Engine & Compliance Mapping
-- Standard: BIGINT pence, ORG_ID RLS

-- ============================================================================
-- 1. Job Enhancements
-- ============================================================================

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS uprn TEXT; -- Unique Property Reference Number

-- ============================================================================
-- 2. Property Assets (Asset Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS property_assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    job_id          UUID REFERENCES jobs(id) ON DELETE SET NULL,
    client_id       UUID REFERENCES clients(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    manufacturer    TEXT,
    model           TEXT,
    serial_number   TEXT,
    installation_date DATE,
    warranty_expiry   DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_assets_job_id ON property_assets(job_id);
CREATE INDEX IF NOT EXISTS idx_property_assets_client_id ON property_assets(client_id);

ALTER TABLE property_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation select" ON property_assets FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON property_assets FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON property_assets FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON property_assets FOR DELETE USING (org_id = get_user_org_id());

CREATE TRIGGER trg_property_assets_updated_at BEFORE UPDATE ON property_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 3. Job Documents (Compliance & Audit Trail)
-- ============================================================================

CREATE TYPE document_compliance_bucket AS ENUM ('PART_P', 'GAS_SAFETY', 'EPC', 'WARRANTY', 'MANUAL', 'PHOTO', 'CERTIFICATE', 'OTHER');

CREATE TABLE IF NOT EXISTS job_documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    job_id              UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    file_path           TEXT NOT NULL,
    compliance_bucket   document_compliance_bucket NOT NULL DEFAULT 'OTHER',
    version             INTEGER NOT NULL DEFAULT 1,

    -- The Golden Thread (Audit Trail)
    uploaded_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    verified_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at         TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_documents_job_id ON job_documents(job_id);

ALTER TABLE job_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation select" ON job_documents FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON job_documents FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON job_documents FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON job_documents FOR DELETE USING (org_id = get_user_org_id());

CREATE TRIGGER trg_job_documents_updated_at BEFORE UPDATE ON job_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 4. Handover Packs (The Compliance Bundle)
-- ============================================================================

CREATE TABLE IF NOT EXISTS handover_packs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    share_token     TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    status          TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, GENERATED, SHARED
    created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_handover_packs_job_id ON handover_packs(job_id);
CREATE INDEX IF NOT EXISTS idx_handover_packs_token ON handover_packs(share_token);

ALTER TABLE handover_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation select" ON handover_packs FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON handover_packs FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON handover_packs FOR UPDATE USING (org_id = get_user_org_id());

-- NOTE: Public view via share_token is handled via Service Role in server actions
-- or specialized security definer functions to prevent token leaking via RLS.

CREATE TRIGGER trg_handover_packs_updated_at BEFORE UPDATE ON handover_packs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
