-- Migration: 00004_job_wallets.sql
-- Purpose: Track financial state per job (Revenue Expected vs Invoiced vs Paid)

-- ============================================================================
-- TABLE: job_wallets
-- One wallet per job to aggregate financial status.
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_wallets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    balance         BIGINT NOT NULL DEFAULT 0, -- Current recognized value
    status          TEXT DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(job_id)
);

-- ============================================================================
-- TABLE: job_wallet_ledger
-- Immutable record of financial events for the job.
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_wallet_ledger (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    wallet_id       UUID NOT NULL REFERENCES job_wallets(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL, -- e.g., 'EXPECTED_REVENUE', 'INVOICE_ISSUED'
    amount          BIGINT NOT NULL DEFAULT 0,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_job_wallets_org_id ON job_wallets(org_id);
CREATE INDEX IF NOT EXISTS idx_job_wallets_job_id ON job_wallets(job_id);
CREATE INDEX IF NOT EXISTS idx_job_wallet_ledger_org_id ON job_wallet_ledger(org_id);
CREATE INDEX IF NOT EXISTS idx_job_wallet_ledger_wallet_id ON job_wallet_ledger(wallet_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE job_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_wallet_ledger ENABLE ROW LEVEL SECURITY;

-- Policies for job_wallets
CREATE POLICY "Org isolation select" ON job_wallets
    FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Org isolation insert" ON job_wallets
    FOR INSERT WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Org isolation update" ON job_wallets
    FOR UPDATE USING (org_id = get_user_org_id());

CREATE POLICY "Org isolation delete" ON job_wallets
    FOR DELETE USING (org_id = get_user_org_id());

-- Policies for job_wallet_ledger
CREATE POLICY "Org isolation select" ON job_wallet_ledger
    FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Org isolation insert" ON job_wallet_ledger
    FOR INSERT WITH CHECK (org_id = get_user_org_id());

-- Ledger entries should generally be immutable, but allow update for now if needed (though typically not)
CREATE POLICY "Org isolation update" ON job_wallet_ledger
    FOR UPDATE USING (org_id = get_user_org_id());

CREATE POLICY "Org isolation delete" ON job_wallet_ledger
    FOR DELETE USING (org_id = get_user_org_id());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_job_wallets_updated_at
    BEFORE UPDATE ON job_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
