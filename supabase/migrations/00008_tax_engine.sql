-- Migration: 00008_tax_engine.sql
-- Purpose: Add VAT_RECLAIM category and Transactional Expense RPC

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
    'VAT_RECLAIM'          -- New: For VAT portion of expenses
));

-- 2. Transactional RPC for Expenses
-- Handles splitting expense into Net + VAT if registered
CREATE OR REPLACE FUNCTION record_expense_transaction(
    p_org_id UUID,
    p_job_id UUID,
    p_total_amount BIGINT,
    p_vat_amount BIGINT,
    p_description TEXT,
    p_is_vat_registered BOOLEAN
)
RETURNS VOID AS $$
BEGIN
    -- Input Validation
    IF p_total_amount < 0 OR p_vat_amount < 0 THEN
        RAISE EXCEPTION 'Amounts must be positive';
    END IF;

    IF p_is_vat_registered THEN
        -- Scenario A: Registered -> Split into EXPENSE (Net) and VAT_RECLAIM (Tax)
        -- Net = Total - VAT
        INSERT INTO job_wallet_ledger (
            org_id, job_id, amount, transaction_type, category, description
        ) VALUES (
            p_org_id, p_job_id, p_total_amount - p_vat_amount, 'DEBIT', 'EXPENSE', p_description || ' (Net)'
        );

        INSERT INTO job_wallet_ledger (
            org_id, job_id, amount, transaction_type, category, description
        ) VALUES (
            p_org_id, p_job_id, p_vat_amount, 'DEBIT', 'VAT_RECLAIM', p_description || ' (VAT Reclaim)'
        );
    ELSE
        -- Scenario B: Not Registered -> Full amount is EXPENSE
        INSERT INTO job_wallet_ledger (
            org_id, job_id, amount, transaction_type, category, description
        ) VALUES (
            p_org_id, p_job_id, p_total_amount, 'DEBIT', 'EXPENSE', p_description
        );
    END IF;
END;
$$ LANGUAGE plpgsql;
