-- Migration: 00017_advanced_quoting.sql
-- Purpose: Advanced Quote Builder, Upsells, and Margin Guardrails
-- Standard: BIGINT pence, ORG_ID RLS

-- ============================================================================
-- 1. Add Costing to Line Items (Granular Profitability)
-- ============================================================================

ALTER TABLE quote_line_items 
ADD COLUMN IF NOT EXISTS unit_cost BIGINT NOT NULL DEFAULT 0; -- pence

-- ============================================================================
-- 2. Upsells System
-- ============================================================================

CREATE TABLE IF NOT EXISTS quote_upsells (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    quote_id        UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    price_total     BIGINT NOT NULL DEFAULT 0, -- pence (sell price)
    cost_total      BIGINT NOT NULL DEFAULT 0, -- pence (internal cost)
    image_url       TEXT,
    accepted        BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_upsells_quote_id ON quote_upsells(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_upsells_org_id ON quote_upsells(org_id);

ALTER TABLE quote_upsells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org isolation select" ON quote_upsells FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON quote_upsells FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON quote_upsells FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON quote_upsells FOR DELETE USING (org_id = get_user_org_id());

-- Public access for viewing upsells on a shared quote
CREATE POLICY "Public upsell view" ON quote_upsells FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM quotes q 
        WHERE q.id = quote_upsells.quote_id 
        AND q.share_token IS NOT NULL
    )
);

CREATE TRIGGER trg_quote_upsells_updated_at BEFORE UPDATE ON quote_upsells FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 3. Financial Settings (Margin Guardrails)
-- ============================================================================

ALTER TABLE organisations 
ADD COLUMN IF NOT EXISTS margin_floor_percentage INTEGER NOT NULL DEFAULT 2000; -- 20.00% default
