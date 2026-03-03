-- ============================================================================
-- TradeLife v2 - Quote Templates + Clients Seed
-- Migration: 00003_quote_templates
-- ============================================================================

CREATE TABLE quote_templates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    -- Template identity
    name                TEXT NOT NULL,
    trade_type          TEXT,
    -- Saved configuration
    is_subcontract      BOOLEAN NOT NULL DEFAULT false,
    labour_days         INTEGER NOT NULL DEFAULT 0,
    labour_day_rate     BIGINT NOT NULL DEFAULT 0,
    subcontract_cost    BIGINT NOT NULL DEFAULT 0,
    material_cost_total BIGINT NOT NULL DEFAULT 0,
    margin_percentage   INTEGER NOT NULL DEFAULT 0,
    -- Metadata
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_quote_templates_org_id ON quote_templates(org_id);

-- RLS
ALTER TABLE quote_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org isolation select" ON quote_templates
    FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON quote_templates
    FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON quote_templates
    FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON quote_templates
    FOR DELETE USING (org_id = get_user_org_id());

-- Updated_at trigger
CREATE TRIGGER trg_quote_templates_updated_at
    BEFORE UPDATE ON quote_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
