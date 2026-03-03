-- ============================================================================
-- TradeLife v2 - Foundation Schema
-- Migration: 00001_foundation_schema
-- 
-- DESIGN PRINCIPLES:
-- 1. All currency stored as BIGINT (pence/cents) - zero rounding errors
-- 2. Strict org_id multi-tenancy via RLS on every table
-- 3. Strict Lineage: Quote -> Job -> Invoice (no manual re-entry)
-- 4. Immutability enforced at application + DB trigger level
-- 5. Placeholder columns for deferred integrations (Stripe, Xero, etc.)
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE quote_status AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED');
CREATE TYPE job_status AS ENUM ('ENQUIRY', 'BOOKED', 'ON_SITE', 'COMPLETED', 'SNAGGING', 'SIGNED_OFF', 'CANCELLED');
CREATE TYPE job_line_item_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE variation_status AS ENUM ('PROPOSED', 'APPROVED', 'REJECTED');
CREATE TYPE invoice_type AS ENUM ('DEPOSIT', 'INTERIM', 'FINAL');
CREATE TYPE invoice_status AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'VOID');
CREATE TYPE money_pot_type AS ENUM ('OPERATING', 'TAX', 'PROFIT', 'RESERVE');

-- ============================================================================
-- TABLE: organisations
-- The owner of ALL data. Every row in every table links back here.
-- ============================================================================

CREATE TABLE organisations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    -- Integration placeholders (deferred)
    stripe_customer_id   TEXT,
    xero_tenant_id       TEXT,
    -- Metadata
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABLE: profiles
-- Linked to Supabase Auth (auth.users). One user belongs to one org.
-- ============================================================================

CREATE TABLE profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    full_name       TEXT,
    email           TEXT,
    role            TEXT NOT NULL DEFAULT 'owner',
    -- Metadata
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABLE: clients
-- Customers that quotes/jobs are created for. Scoped to org.
-- ============================================================================

CREATE TABLE clients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    email           TEXT,
    phone           TEXT,
    address         TEXT,
    -- Integration placeholders
    stripe_customer_id   TEXT,
    xero_contact_id      TEXT,
    -- Metadata
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABLE: quotes (The Sales Instrument)
-- Status flow: DRAFT -> SENT -> ACCEPTED | DECLINED
-- Once ACCEPTED, becomes IMMUTABLE.
-- ============================================================================

CREATE TABLE quotes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    client_id               UUID REFERENCES clients(id) ON DELETE SET NULL,
    -- Status & sharing
    status                  quote_status NOT NULL DEFAULT 'DRAFT',
    share_token             TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    -- VAT
    vat_rate                INTEGER NOT NULL DEFAULT 2000, -- 20.00% stored as basis points (x100)
    -- Calculated totals (BIGINT = pence/cents)
    quote_amount_net        BIGINT NOT NULL DEFAULT 0,
    quote_amount_gross      BIGINT NOT NULL DEFAULT 0,
    quote_total_cost        BIGINT NOT NULL DEFAULT 0,
    quote_profit            BIGINT NOT NULL DEFAULT 0,
    quote_margin_percentage INTEGER NOT NULL DEFAULT 0,  -- stored as x100 (e.g., 2500 = 25.00%)
    -- Reference
    reference               TEXT,
    notes                   TEXT,
    valid_until             DATE,
    -- Lineage (populated when job is created from this quote)
    job_id                  UUID,  -- FK added after jobs table creation
    -- Metadata
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABLE: quote_sections (The Pricing Engine)
-- Each section represents a trade/scope block (e.g., "Kitchen Fit-out")
-- All currency as BIGINT (pence/cents)
-- ============================================================================

CREATE TABLE quote_sections (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id                UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    org_id                  UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    -- Section identity
    title                   TEXT NOT NULL,
    trade_type              TEXT,          -- e.g., Electrical, Plumbing, General
    sort_order              INTEGER NOT NULL DEFAULT 0,
    -- Labour model
    is_subcontract          BOOLEAN NOT NULL DEFAULT false,
    -- Direct labour inputs (used when is_subcontract = false)
    labour_days             INTEGER NOT NULL DEFAULT 0,        -- whole days
    labour_day_rate         BIGINT NOT NULL DEFAULT 0,         -- pence per day
    -- Subcontract input (used when is_subcontract = true)
    subcontract_cost        BIGINT NOT NULL DEFAULT 0,         -- pence
    -- Materials
    material_cost_total     BIGINT NOT NULL DEFAULT 0,         -- pence
    -- Margin
    margin_percentage       INTEGER NOT NULL DEFAULT 0,        -- stored as x100 (2500 = 25.00%)
    -- Calculated fields (BIGINT = pence)
    labour_cost             BIGINT NOT NULL DEFAULT 0,         -- Days * Rate OR Subcontract
    section_cost_total      BIGINT NOT NULL DEFAULT 0,         -- Labour + Materials
    section_revenue_total   BIGINT NOT NULL DEFAULT 0,         -- Cost + Margin
    section_profit          BIGINT NOT NULL DEFAULT 0,         -- Revenue - Cost
    -- Metadata
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABLE: quote_line_items (The Itemised List for Lineage)
-- These flow downstream: Quote -> Job -> Invoice
-- ============================================================================

CREATE TABLE quote_line_items (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id                UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    quote_section_id        UUID REFERENCES quote_sections(id) ON DELETE CASCADE,
    org_id                  UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    -- Item details
    description             TEXT NOT NULL,
    quantity                INTEGER NOT NULL DEFAULT 1,        -- whole units
    unit                    TEXT DEFAULT 'each',               -- each, m2, hr, etc.
    unit_price_net          BIGINT NOT NULL DEFAULT 0,         -- pence per unit
    line_total_net          BIGINT NOT NULL DEFAULT 0,         -- quantity * unit_price_net (pence)
    sort_order              INTEGER NOT NULL DEFAULT 0,
    -- Metadata
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABLE: jobs (The Operational Unit)
-- Created from an ACCEPTED Quote. Lineage enforced.
-- ============================================================================

CREATE TABLE jobs (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    -- Lineage
    source_quote_id         UUID NOT NULL REFERENCES quotes(id) ON DELETE RESTRICT,
    client_id               UUID REFERENCES clients(id) ON DELETE SET NULL,
    -- Job details
    title                   TEXT NOT NULL,
    address                 TEXT,
    status                  job_status NOT NULL DEFAULT 'ENQUIRY',
    -- Scheduling
    target_start_date       DATE,
    target_end_date         DATE,
    -- Integration placeholders
    google_calendar_event_id TEXT,
    -- Metadata
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add the deferred FK from quotes.job_id -> jobs.id
ALTER TABLE quotes ADD CONSTRAINT fk_quotes_job_id FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL;

-- ============================================================================
-- TABLE: job_line_items
-- Inherited from quote_line_items. Adds status + variation tracking.
-- ============================================================================

CREATE TABLE job_line_items (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id                  UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    org_id                  UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    -- Lineage
    source_quote_line_id    UUID REFERENCES quote_line_items(id) ON DELETE SET NULL,
    -- Item details (copied from quote line item at creation)
    description             TEXT NOT NULL,
    quantity                INTEGER NOT NULL DEFAULT 1,
    unit                    TEXT DEFAULT 'each',
    unit_price_net          BIGINT NOT NULL DEFAULT 0,         -- pence
    line_total_net          BIGINT NOT NULL DEFAULT 0,         -- pence
    -- Status
    status                  job_line_item_status NOT NULL DEFAULT 'PENDING',
    -- Variation tracking
    is_variation            BOOLEAN NOT NULL DEFAULT false,
    variation_reason        TEXT,
    source_variation_id     UUID,  -- FK added after variations table
    sort_order              INTEGER NOT NULL DEFAULT 0,
    -- Metadata
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABLE: variations ("Can You Just")
-- Proposed changes during job execution. Approval gate enforced.
-- ============================================================================

CREATE TABLE variations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id                  UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    org_id                  UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    -- Variation details
    description             TEXT NOT NULL,
    reason                  TEXT,
    quantity                INTEGER NOT NULL DEFAULT 1,
    unit                    TEXT DEFAULT 'each',
    unit_price_net          BIGINT NOT NULL DEFAULT 0,         -- pence
    line_total_net          BIGINT NOT NULL DEFAULT 0,         -- pence
    -- Approval gate
    status                  variation_status NOT NULL DEFAULT 'PROPOSED',
    approved_at             TIMESTAMPTZ,
    -- Lineage (populated on approval)
    job_line_item_id        UUID REFERENCES job_line_items(id) ON DELETE SET NULL,
    -- Metadata
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add deferred FK
ALTER TABLE job_line_items ADD CONSTRAINT fk_job_line_items_variation 
    FOREIGN KEY (source_variation_id) REFERENCES variations(id) ON DELETE SET NULL;

-- ============================================================================
-- TABLE: invoices (The Financial Demand)
-- Must originate from a Job. No manual entry.
-- ============================================================================

CREATE TABLE invoices (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    -- Lineage
    source_job_id           UUID NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
    -- Invoice identity
    invoice_number          TEXT NOT NULL,  -- INV-0001 (auto-generated per org)
    invoice_type            invoice_type NOT NULL DEFAULT 'FINAL',
    -- Amounts (BIGINT = pence)
    amount_net              BIGINT NOT NULL DEFAULT 0,
    vat_rate                INTEGER NOT NULL DEFAULT 2000,     -- 20.00% as basis points
    amount_gross            BIGINT NOT NULL DEFAULT 0,
    -- Status
    status                  invoice_status NOT NULL DEFAULT 'DRAFT',
    -- Dates
    issue_date              DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date                DATE,
    paid_at                 TIMESTAMPTZ,
    -- Integration placeholders
    stripe_payment_link     TEXT,
    stripe_payment_intent_id TEXT,
    xero_invoice_id         TEXT,
    -- Metadata
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABLE: invoice_line_items
-- Strictly copied from job_line_items. No manual entry.
-- ============================================================================

CREATE TABLE invoice_line_items (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id              UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    org_id                  UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    -- Lineage
    source_job_line_id      UUID NOT NULL REFERENCES job_line_items(id) ON DELETE RESTRICT,
    -- Copied fields (immutable after creation)
    description             TEXT NOT NULL,
    quantity                INTEGER NOT NULL DEFAULT 1,
    unit                    TEXT DEFAULT 'each',
    unit_price_net          BIGINT NOT NULL DEFAULT 0,         -- pence
    line_total_net          BIGINT NOT NULL DEFAULT 0,         -- pence
    sort_order              INTEGER NOT NULL DEFAULT 0,
    -- Metadata
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABLE: money_pots (Profit First Engine)
-- ============================================================================

CREATE TABLE money_pots (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    pot_type                money_pot_type NOT NULL,
    balance                 BIGINT NOT NULL DEFAULT 0,         -- pence
    allocation_percentage   INTEGER NOT NULL DEFAULT 0,        -- x100 (5000 = 50.00%)
    income_floor            BIGINT NOT NULL DEFAULT 0,         -- pence
    -- Metadata
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- One pot per type per org
    UNIQUE(org_id, pot_type)
);

-- ============================================================================
-- TABLE: cashflow_entries
-- ============================================================================

CREATE TABLE cashflow_entries (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    pot_type                money_pot_type NOT NULL,
    amount                  BIGINT NOT NULL,                   -- pence (positive = in, negative = out)
    description             TEXT,
    -- Optional references
    source_invoice_id       UUID REFERENCES invoices(id) ON DELETE SET NULL,
    -- Metadata
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES (Performance)
-- ============================================================================

-- Multi-tenancy lookups
CREATE INDEX idx_profiles_org_id ON profiles(org_id);
CREATE INDEX idx_clients_org_id ON clients(org_id);
CREATE INDEX idx_quotes_org_id ON quotes(org_id);
CREATE INDEX idx_quote_sections_quote_id ON quote_sections(quote_id);
CREATE INDEX idx_quote_sections_org_id ON quote_sections(org_id);
CREATE INDEX idx_quote_line_items_quote_id ON quote_line_items(quote_id);
CREATE INDEX idx_quote_line_items_org_id ON quote_line_items(org_id);
CREATE INDEX idx_jobs_org_id ON jobs(org_id);
CREATE INDEX idx_jobs_source_quote ON jobs(source_quote_id);
CREATE INDEX idx_job_line_items_job_id ON job_line_items(job_id);
CREATE INDEX idx_job_line_items_org_id ON job_line_items(org_id);
CREATE INDEX idx_variations_job_id ON variations(job_id);
CREATE INDEX idx_variations_org_id ON variations(org_id);
CREATE INDEX idx_invoices_org_id ON invoices(org_id);
CREATE INDEX idx_invoices_source_job ON invoices(source_job_id);
CREATE INDEX idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_org_id ON invoice_line_items(org_id);
CREATE INDEX idx_money_pots_org_id ON money_pots(org_id);
CREATE INDEX idx_cashflow_entries_org_id ON cashflow_entries(org_id);

-- Share token lookup (public quote view)
CREATE INDEX idx_quotes_share_token ON quotes(share_token);

-- Invoice number lookup
CREATE INDEX idx_invoices_number ON invoices(org_id, invoice_number);

-- ============================================================================
-- ROW LEVEL SECURITY (Multi-Tenancy)
-- Every table with org_id gets RLS. Users can only see their org's data.
-- ============================================================================

ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_pots ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashflow_entries ENABLE ROW LEVEL SECURITY;

-- Helper function: Get org_id for current authenticated user
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
    SELECT org_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- RLS POLICIES
-- Pattern: Users can CRUD rows where org_id matches their org
-- ============================================================================

-- Organisations: Users can only see their own org
CREATE POLICY "Users can view own organisation"
    ON organisations FOR SELECT
    USING (id = get_user_org_id());

CREATE POLICY "Users can update own organisation"
    ON organisations FOR UPDATE
    USING (id = get_user_org_id());

-- Profiles: Users see profiles in their org
CREATE POLICY "Users can view org profiles"
    ON profiles FOR SELECT
    USING (org_id = get_user_org_id());

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

-- Generic org_id policy for all data tables
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'clients', 'quotes', 'quote_sections', 'quote_line_items',
            'jobs', 'job_line_items', 'variations',
            'invoices', 'invoice_line_items',
            'money_pots', 'cashflow_entries'
        ])
    LOOP
        EXECUTE format('
            CREATE POLICY "Org isolation select" ON %I 
                FOR SELECT USING (org_id = get_user_org_id());
            CREATE POLICY "Org isolation insert" ON %I 
                FOR INSERT WITH CHECK (org_id = get_user_org_id());
            CREATE POLICY "Org isolation update" ON %I 
                FOR UPDATE USING (org_id = get_user_org_id());
            CREATE POLICY "Org isolation delete" ON %I 
                FOR DELETE USING (org_id = get_user_org_id());
        ', tbl, tbl, tbl, tbl);
    END LOOP;
END $$;

-- Special: Public quote view via share_token (no auth required)
CREATE POLICY "Public quote view via share token"
    ON quotes FOR SELECT
    USING (share_token IS NOT NULL);

-- ============================================================================
-- TRIGGER: Immutability Gate - Prevent edits to ACCEPTED quotes
-- ============================================================================

CREATE OR REPLACE FUNCTION enforce_quote_immutability()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow status transitions on the quote itself
    IF TG_TABLE_NAME = 'quotes' THEN
        -- Only block if trying to change non-status fields on ACCEPTED quote
        IF OLD.status = 'ACCEPTED' AND (
            NEW.vat_rate != OLD.vat_rate OR
            NEW.quote_amount_net != OLD.quote_amount_net OR
            NEW.quote_amount_gross != OLD.quote_amount_gross OR
            NEW.notes != OLD.notes OR
            NEW.reference != OLD.reference OR
            NEW.client_id != OLD.client_id
        ) THEN
            RAISE EXCEPTION 'Cannot modify an ACCEPTED quote. Quote % is immutable.', OLD.id;
        END IF;
        RETURN NEW;
    END IF;

    -- For sections and line items: block ALL changes if parent quote is ACCEPTED
    IF EXISTS (SELECT 1 FROM quotes WHERE id = OLD.quote_id AND status = 'ACCEPTED') THEN
        RAISE EXCEPTION 'Cannot modify sections/items of an ACCEPTED quote.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_quote_immutability
    BEFORE UPDATE ON quotes
    FOR EACH ROW EXECUTE FUNCTION enforce_quote_immutability();

CREATE TRIGGER trg_quote_section_immutability
    BEFORE UPDATE OR DELETE ON quote_sections
    FOR EACH ROW EXECUTE FUNCTION enforce_quote_immutability();

CREATE TRIGGER trg_quote_line_item_immutability
    BEFORE UPDATE OR DELETE ON quote_line_items
    FOR EACH ROW EXECUTE FUNCTION enforce_quote_immutability();

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'organisations', 'profiles', 'clients',
            'quotes', 'quote_sections', 'quote_line_items',
            'jobs', 'job_line_items', 'variations',
            'invoices', 'invoice_line_items', 'money_pots'
        ])
    LOOP
        EXECUTE format('
            CREATE TRIGGER trg_%s_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW EXECUTE FUNCTION update_updated_at();
        ', tbl, tbl);
    END LOOP;
END $$;

-- ============================================================================
-- FUNCTION: Seed default money pots for a new organisation
-- ============================================================================

CREATE OR REPLACE FUNCTION seed_default_money_pots()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO money_pots (org_id, pot_type, allocation_percentage) VALUES
        (NEW.id, 'OPERATING', 5000),   -- 50.00%
        (NEW.id, 'TAX',       2000),   -- 20.00%
        (NEW.id, 'PROFIT',    1500),   -- 15.00%
        (NEW.id, 'RESERVE',   1500);   -- 15.00%
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_seed_money_pots
    AFTER INSERT ON organisations
    FOR EACH ROW EXECUTE FUNCTION seed_default_money_pots();
