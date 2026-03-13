-- Migration for missing tables in Finance and Banking modules

-- Burn Rate Snapshots
CREATE TABLE IF NOT EXISTS public.burn_rate_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    revenue BIGINT NOT NULL DEFAULT 0,
    expenses BIGINT NOT NULL DEFAULT 0,
    profit BIGINT NOT NULL DEFAULT 0,
    burn_rate BIGINT NOT NULL DEFAULT 0,
    runway BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.burn_rate_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org burn rate"
    ON public.burn_rate_snapshots FOR SELECT
    USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

-- Bank Transactions
CREATE TABLE IF NOT EXISTS public.bank_transactions (
    id TEXT PRIMARY KEY, -- Plaid transaction ID
    org_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    connection_id UUID NOT NULL REFERENCES public.bank_connections(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    merchant_name TEXT,
    category TEXT,
    date DATE NOT NULL,
    pending BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org bank transactions"
    ON public.bank_transactions FOR SELECT
    USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));
