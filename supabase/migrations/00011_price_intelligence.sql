-- Migration: 00011_price_intelligence.sql
-- Purpose: Track supplier pricing and market intelligence
-- Standard: BIGINT pence, ORG_ID RLS

CREATE TABLE IF NOT EXISTS supplier_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    supplier_name   TEXT NOT NULL,
    item_code       TEXT,
    description     TEXT NOT NULL,
    unit_price_net  BIGINT NOT NULL DEFAULT 0, -- pence
    unit            TEXT DEFAULT 'each',
    last_updated    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_items_org_id ON supplier_items(org_id);
CREATE INDEX IF NOT EXISTS idx_supplier_items_code ON supplier_items(org_id, item_code);

ALTER TABLE supplier_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org isolation select" ON supplier_items FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON supplier_items FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON supplier_items FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON supplier_items FOR DELETE USING (org_id = get_user_org_id());

CREATE TRIGGER trg_supplier_items_updated_at BEFORE UPDATE ON supplier_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
