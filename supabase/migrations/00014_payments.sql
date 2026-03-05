-- Migration: 00014_payments.sql
-- Purpose: Track payments and integration logs
-- Standard: BIGINT pence, ORG_ID RLS

CREATE TABLE IF NOT EXISTS payment_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    invoice_id      UUID REFERENCES invoices(id) ON DELETE SET NULL,
    amount          BIGINT NOT NULL, -- pence
    currency        TEXT DEFAULT 'gbp',
    provider        TEXT NOT NULL, -- 'stripe', 'xero', 'manual'
    provider_ref    TEXT, -- stripe_charge_id etc
    status          TEXT NOT NULL, -- 'succeeded', 'pending', 'failed'
    payment_date    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_records_org_id ON payment_records(org_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_invoice_id ON payment_records(invoice_id);

ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org isolation select" ON payment_records FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON payment_records FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON payment_records FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON payment_records FOR DELETE USING (org_id = get_user_org_id());

CREATE TRIGGER trg_payment_records_updated_at BEFORE UPDATE ON payment_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
