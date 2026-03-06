-- Migration: 00023_financial_integrations.sql
-- Purpose: Plaid & Xero Connections
-- Standard: ORG_ID RLS

-- ============================================================================
-- 1. Bank Connections (Plaid)
-- ============================================================================

CREATE TABLE IF NOT EXISTS bank_connections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    provider        TEXT NOT NULL DEFAULT 'PLAID',
    item_id         TEXT NOT NULL,
    access_token    TEXT NOT NULL, -- Encrypt in prod!
    institution_name TEXT,
    last_synced_at  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation select" ON bank_connections FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON bank_connections FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON bank_connections FOR DELETE USING (org_id = get_user_org_id());

-- ============================================================================
-- 2. Accounting Connections (Xero)
-- ============================================================================

CREATE TABLE IF NOT EXISTS accounting_connections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    provider        TEXT NOT NULL DEFAULT 'XERO',
    tenant_id       TEXT,
    access_token    TEXT NOT NULL,
    refresh_token   TEXT,
    expires_at      TIMESTAMPTZ,
    last_synced_at  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE accounting_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation select" ON accounting_connections FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON accounting_connections FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON accounting_connections FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON accounting_connections FOR DELETE USING (org_id = get_user_org_id());
