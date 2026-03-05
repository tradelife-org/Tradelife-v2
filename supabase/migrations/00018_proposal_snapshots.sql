-- Migration: 00018_proposal_snapshots.sql
-- Purpose: Quote Acceptance Snapshots & Terms
-- Standard: BIGINT pence, ORG_ID RLS

-- ============================================================================
-- TABLE: quote_snapshots (Immutable Record of Acceptance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS quote_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    quote_id        UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    snapshot_data   JSONB NOT NULL, -- Full copy of quote, sections, lines, upsells
    accepted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_by_name TEXT,
    accepted_ip     TEXT,
    signature_url   TEXT, -- Optional if we add e-sign
    total_amount_gross BIGINT NOT NULL, -- Final agreed price
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_snapshots_quote_id ON quote_snapshots(quote_id);

ALTER TABLE quote_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation select" ON quote_snapshots FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON quote_snapshots FOR INSERT WITH CHECK (org_id = get_user_org_id());

-- ============================================================================
-- TABLE: organisation_terms (Standard Terms)
-- ============================================================================

CREATE TABLE IF NOT EXISTS organisation_terms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    title           TEXT NOT NULL DEFAULT 'Standard Terms',
    content         TEXT NOT NULL,
    is_default      BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE organisation_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org isolation select" ON organisation_terms FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation insert" ON organisation_terms FOR INSERT WITH CHECK (org_id = get_user_org_id());
CREATE POLICY "Org isolation update" ON organisation_terms FOR UPDATE USING (org_id = get_user_org_id());
CREATE POLICY "Org isolation delete" ON organisation_terms FOR DELETE USING (org_id = get_user_org_id());

-- ============================================================================
-- UPDATE: quotes (Link to snapshot)
-- ============================================================================

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS accepted_snapshot_id UUID REFERENCES quote_snapshots(id) ON DELETE SET NULL;
