-- Migration: 00007_ledger_categories.sql
-- Purpose: Expand ledger categories to support COMMITTED vs RECOGNIZED revenue

-- Drop existing check constraint
ALTER TABLE job_wallet_ledger
DROP CONSTRAINT job_wallet_ledger_category_check;

-- Add new check constraint with expanded categories
ALTER TABLE job_wallet_ledger
ADD CONSTRAINT job_wallet_ledger_category_check 
CHECK (category IN (
    'REVENUE',             -- Legacy/Generic
    'EXPENSE',             -- Legacy/Generic
    'TAX', 
    'COMMITTED_REVENUE',   -- Quote Accepted (Not yet invoiced)
    'RECOGNIZED_REVENUE'   -- Invoice Issued
));

-- Optional: Create invoices bucket if not exists (for Task 3)
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false) -- Private bucket for financial docs? Or public?
-- Receipt OCR implies sensitive financial data. Should be private (authenticated access only).
ON CONFLICT (id) DO NOTHING;

-- Policy for invoices bucket
CREATE POLICY "Authenticated users can upload invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

CREATE POLICY "Authenticated users can view invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'invoices');
