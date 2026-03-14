-- Migration to support UK spelling of Recognised Revenue
ALTER TABLE job_wallet_ledger DROP CONSTRAINT IF EXISTS job_wallet_ledger_category_check;

ALTER TABLE job_wallet_ledger
ADD CONSTRAINT job_wallet_ledger_category_check 
CHECK (category IN (
    'REVENUE',
    'EXPENSE',
    'TAX', 
    'COMMITTED_REVENUE',
    'RECOGNIZED_REVENUE',
    'RECOGNISED_REVENUE'
));
