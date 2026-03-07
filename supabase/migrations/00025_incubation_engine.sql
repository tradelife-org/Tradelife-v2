-- Migration: 00025_incubation_engine.sql
-- Purpose: Support Phase 0 - Incubation Engine & Director Sync

-- ============================================================================
-- TABLE: team_members (Auto-drafted from Companies House or manually added)
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    full_name       TEXT NOT NULL,
    role            TEXT,
    idv_status      BOOLEAN DEFAULT false, -- 2026 Identity Verification status
    is_director     BOOLEAN DEFAULT false,
    ch_officer_id   TEXT, -- Companies House Officer ID
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(org_id, ch_officer_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_org_id ON team_members(org_id);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org isolation select" ON team_members FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON team_members FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON team_members FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON team_members FOR DELETE USING (org_id = get_user_org_id());

-- ============================================================================
-- TABLE: branding_gallery (AI Branding Gallery)
-- ============================================================================

CREATE TABLE IF NOT EXISTS branding_gallery (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    image_url       TEXT NOT NULL,
    prompt          TEXT,
    type            TEXT NOT NULL CHECK (type IN ('LOGO', 'MOCKUP')),
    is_selected     BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_branding_gallery_org_id ON branding_gallery(org_id);

ALTER TABLE branding_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org isolation select" ON branding_gallery FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON branding_gallery FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON branding_gallery FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON branding_gallery FOR DELETE USING (org_id = get_user_org_id());

-- ============================================================================
-- UPDATES TO organisations
-- ============================================================================

ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS founders_bundle_paid BOOLEAN DEFAULT false;

-- ============================================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================================

CREATE TRIGGER tr_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_branding_gallery_updated_at
    BEFORE UPDATE ON branding_gallery
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
