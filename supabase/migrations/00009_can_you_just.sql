-- Migration: 00009_can_you_just.sql
-- Purpose: Policies for "Can You Just" / Small Works engine

-- ============================================================================
-- TABLE: can_you_just_policies
-- Org-scoped configuration for time-based variations
-- ============================================================================

CREATE TABLE IF NOT EXISTS can_you_just_policies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    rate_per_15min  BIGINT NOT NULL DEFAULT 1500, -- e.g. £15.00 per 15 mins (£60/hr)
    min_increment   INTEGER NOT NULL DEFAULT 15,  -- minutes
    rounding_rule   TEXT NOT NULL DEFAULT 'UP',   -- 'UP', 'DOWN', 'NEAREST'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(org_id)
);

-- RLS
ALTER TABLE can_you_just_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org isolation select" ON can_you_just_policies
    FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Org isolation insert" ON can_you_just_policies
    FOR INSERT WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Org isolation update" ON can_you_just_policies
    FOR UPDATE USING (org_id = get_user_org_id());

-- Trigger for updated_at
CREATE TRIGGER trg_can_you_just_policies_updated_at
    BEFORE UPDATE ON can_you_just_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed default policy for existing orgs (idempotent)
INSERT INTO can_you_just_policies (org_id, rate_per_15min, min_increment, rounding_rule)
SELECT id, 1500, 15, 'UP'
FROM organisations
ON CONFLICT (org_id) DO NOTHING;

-- Auto-seed for new orgs via trigger
CREATE OR REPLACE FUNCTION seed_default_cyj_policy()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO can_you_just_policies (org_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_seed_cyj_policy
    AFTER INSERT ON organisations
    FOR EACH ROW EXECUTE FUNCTION seed_default_cyj_policy();
