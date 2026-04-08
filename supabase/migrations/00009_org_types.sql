-- Migration: 00009_org_types.sql
-- Purpose: Define organisation categories for health scoring

-- 1. Define Enum
DO $$ BEGIN
    CREATE TYPE organisation_trade_category AS ENUM (
        'GENERAL_BUILDER',
        'ELECTRICIAN',
        'PLUMBER',
        'ROOFER',
        'LANDSCAPER',
        'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Table
CREATE TABLE IF NOT EXISTS organisation_types (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL UNIQUE, -- Added UNIQUE for idempotency
    category        organisation_trade_category NOT NULL DEFAULT 'GENERAL_BUILDER',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Alter Organisations
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS org_type_id UUID REFERENCES organisation_types(id);

-- 4. RLS
ALTER TABLE organisation_types ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read types
DROP POLICY IF EXISTS "Allow authenticated read organisation_types" ON organisation_types;
CREATE POLICY "Allow authenticated read organisation_types"
    ON organisation_types FOR SELECT
    TO authenticated
    USING (true);

-- 5. Trigger
DROP TRIGGER IF EXISTS trg_organisation_types_updated_at ON organisation_types;
CREATE TRIGGER trg_organisation_types_updated_at
    BEFORE UPDATE ON organisation_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. Seed
INSERT INTO organisation_types (name, category) VALUES
('Sole Trader - General', 'GENERAL_BUILDER'),
('Limited Company - General', 'GENERAL_BUILDER'),
('Specialist - Electrical', 'ELECTRICIAN'),
('Specialist - Plumbing', 'PLUMBER'),
('Specialist - Roofing', 'ROOFER'),
('Specialist - Landscaping', 'LANDSCAPER')
ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category;
