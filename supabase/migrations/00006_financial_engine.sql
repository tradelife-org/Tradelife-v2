-- Migration: 00006_financial_engine.sql
-- Purpose: Create job_wallet_ledger and quote_snapshots tables

-- ============================================================================
-- TABLE: job_wallet_ledger
-- Canonical Ledger - Append-Only
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_wallet_ledger (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    amount          BIGINT NOT NULL, -- pence (positive = in, negative = out? or just amount + type?)
    -- Ledger usually implies amount is absolute, type defines direction.
    -- Or signed amount? "amount (BIGINT pence), type (DEBIT/CREDIT)"
    -- Typically: DEBIT = Increase Asset (Cash/Receivable), CREDIT = Decrease Asset (Expense/Liability)
    -- Wait, for "Job Wallet" (Asset/Revenue tracking):
    -- Revenue = CREDIT usually in accounting?
    -- Let's stick to simple: DEBIT (Out/Expense), CREDIT (In/Revenue) or vice versa depending on perspective.
    -- But here we track "Job Value".
    -- Let's assume Amount is always positive, and Type defines direction.
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('DEBIT', 'CREDIT')),
    category        TEXT NOT NULL CHECK (category IN ('REVENUE', 'EXPENSE', 'TAX')),
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_job_wallet_ledger_org_id ON job_wallet_ledger(org_id);
CREATE INDEX IF NOT EXISTS idx_job_wallet_ledger_job_id ON job_wallet_ledger(job_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE job_wallet_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org isolation select" ON job_wallet_ledger
    FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Org isolation insert" ON job_wallet_ledger
    FOR INSERT WITH CHECK (org_id = get_user_org_id());

-- NO UPDATE / DELETE policies = Implicitly denied for users.
-- Admin/Service Role can still do it, but application users cannot.

-- ============================================================================
-- TABLE: quote_snapshots
-- Full JSON version of quote line items when ACCEPTED
-- ============================================================================

CREATE TABLE IF NOT EXISTS quote_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id        UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    snapshot_data   JSONB NOT NULL, -- Stores the full quote + line items structure
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_snapshots_quote_id ON quote_snapshots(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_snapshots_org_id ON quote_snapshots(org_id);

ALTER TABLE quote_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org isolation select" ON quote_snapshots
    FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "Org isolation insert" ON quote_snapshots
    FOR INSERT WITH CHECK (org_id = get_user_org_id());

-- ============================================================================
-- STORAGE BUCKET: gallery
-- Ensure the bucket exists for storing logos
-- ============================================================================

-- Attempt to create the bucket if it doesn't exist (Idempotent-ish via DO block)
-- Note: 'storage' schema access might be restricted.
-- Usually buckets are created via API or dashboard.
-- But let's try to insert into storage.buckets if we have permissions.
-- If not, we'll handle it via client creation or assume it exists.

INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated uploads to 'gallery'
CREATE POLICY "Authenticated users can upload to gallery"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gallery');

CREATE POLICY "Public access to gallery"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gallery');
