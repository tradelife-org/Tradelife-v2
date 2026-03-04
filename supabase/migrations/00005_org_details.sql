-- Migration: 00005_org_details.sql
-- Purpose: Add address, logo, and VAT details to organisations table

ALTER TABLE organisations 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS vat_number TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS is_vat_registered BOOLEAN DEFAULT false;
