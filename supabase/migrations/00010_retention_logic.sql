-- Migration: 00010_retention_logic.sql
-- Purpose: Add Retention/Payout categories and Payout Split RPC

-- 1. Update Ledger Categories
ALTER TABLE job_wallet_ledger
DROP CONSTRAINT job_wallet_ledger_category_check;

ALTER TABLE job_wallet_ledger
ADD CONSTRAINT job_wallet_ledger_category_check 
CHECK (category IN (
    'REVENUE',
    'EXPENSE',
    'TAX',
    'COMMITTED_REVENUE',
    'RECOGNIZED_REVENUE',
    'VAT_RECLAIM',
    'PAYOUT',              -- New: Actual money leaving for builder salary/withdrawals
    'RETENTION_HELD',      -- New: Money deducted but held back
    'RETENTION_RELEASED'   -- New: Money returning (Credit?) or Paid out later?
    -- Usually: Held (Debit from Wallet) -> Released (Credit back to Wallet? Or Payout directly?)
    -- Prompt implies Held is "earned but cannot spend".
    -- "released" likely means it becomes available again or is paid out.
    -- We'll assume Released is a CREDIT to the wallet (reversing the Hold) allowing a subsequent Payout.
));

-- 2. Transactional RPC for Payout Split
CREATE OR REPLACE FUNCTION record_payout_transaction(
    p_org_id UUID,
    p_job_id UUID,
    p_total_amount BIGINT,
    p_description TEXT
)
RETURNS VOID AS $$
DECLARE
    v_payout_amount BIGINT;
    v_retention_amount BIGINT;
BEGIN
    -- Input Validation
    IF p_total_amount <= 0 THEN
        RAISE EXCEPTION 'Payout amount must be positive';
    END IF;

    -- Calculate Split (75% / 25%)
    -- Use integer math: (Total * 75) / 100
    v_payout_amount := (p_total_amount * 75) / 100;
    v_retention_amount := p_total_amount - v_payout_amount;

    -- Insert Entry A: PAYOUT
    INSERT INTO job_wallet_ledger (
        org_id, job_id, amount, transaction_type, category, description
    ) VALUES (
        p_org_id, p_job_id, v_payout_amount, 'DEBIT', 'PAYOUT', p_description || ' (75% Payout)'
    );

    -- Insert Entry B: RETENTION_HELD
    INSERT INTO job_wallet_ledger (
        org_id, job_id, amount, transaction_type, category, description
    ) VALUES (
        p_org_id, p_job_id, v_retention_amount, 'DEBIT', 'RETENTION_HELD', p_description || ' (25% Retention)'
    );
END;
$$ LANGUAGE plpgsql;
