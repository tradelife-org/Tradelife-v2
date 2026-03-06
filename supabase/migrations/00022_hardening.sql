-- Migration: 00022_hardening.sql
-- Purpose: Stripe Connect, Storage RLS, Import Review
-- Standard: ORG_ID RLS

-- ============================================================================
-- 1. Stripe Connect
-- ============================================================================

ALTER TABLE organisations 
ADD COLUMN IF NOT EXISTS stripe_connect_id TEXT;

-- ============================================================================
-- 2. Storage RLS (Hardening)
-- ============================================================================

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload/select their own org's files
-- Assuming file path convention: bucket_id/path
-- We used `receipts/{org_id}/...` in `finance.ts`.
-- Supabase Storage RLS usually checks `bucket_id` and `name` (path).

CREATE POLICY "Org isolation storage select" ON storage.objects FOR SELECT USING (
    bucket_id = 'gallery' AND (
        (storage.foldername(name))[1] = get_user_org_id()::text
        OR 
        auth.role() = 'service_role' -- Allow admin
    )
);

CREATE POLICY "Org isolation storage insert" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'gallery' AND (
        (storage.foldername(name))[1] = get_user_org_id()::text
    )
);

-- ============================================================================
-- 3. Maintenance Schedules (Import Review)
-- ============================================================================

ALTER TABLE maintenance_schedules 
ADD COLUMN IF NOT EXISTS source_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS import_status TEXT DEFAULT 'ACTIVE'; -- ACTIVE, PENDING_REVIEW, IGNORED

CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_import ON maintenance_schedules(org_id, import_status);
