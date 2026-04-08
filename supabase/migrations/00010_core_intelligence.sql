-- Migration: 00010_core_intelligence.sql
-- Purpose: Intelligence Core (Quote Win Intelligence & Business Health Score)

-- 1. Create Snapshot Tables
CREATE TABLE IF NOT EXISTS quote_intelligence_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    quote_id        UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    net_amount      BIGINT NOT NULL, -- pence
    profit_amount   BIGINT NOT NULL, -- pence
    margin_pct      INTEGER NOT NULL, -- x100
    is_win          BOOLEAN NOT NULL DEFAULT false,
    snapshot_date   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_health_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    health_score    INTEGER NOT NULL, -- 0-100
    profitability_score INTEGER NOT NULL, -- 0-33
    stability_score INTEGER NOT NULL, -- 0-33
    efficiency_score INTEGER NOT NULL, -- 0-34
    snapshot_date   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. RLS for Snapshots
ALTER TABLE quote_intelligence_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_health_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org isolation select" ON quote_intelligence_snapshots;
CREATE POLICY "Org isolation select" ON quote_intelligence_snapshots
    FOR SELECT USING (org_id = get_user_org_id());

DROP POLICY IF EXISTS "Org isolation select" ON business_health_snapshots;
CREATE POLICY "Org isolation select" ON business_health_snapshots
    FOR SELECT USING (org_id = get_user_org_id());

-- 3. Intelligence Functions

-- Function: get_quote_win_stats
CREATE OR REPLACE FUNCTION get_quote_win_stats(p_org_id UUID)
RETURNS TABLE (
    total_quotes BIGINT,
    won_quotes BIGINT,
    win_rate_pct INTEGER, -- x100
    avg_margin_pct INTEGER -- x100
) AS $$
DECLARE
    v_user_org_id UUID;
BEGIN
    -- Security Check: Multi-tenant isolation
    v_user_org_id := get_user_org_id();
    IF v_user_org_id IS NULL OR v_user_org_id != p_org_id THEN
        RAISE EXCEPTION 'Unauthorized: Access to organization % is denied.', p_org_id;
    END IF;

    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE status = 'ACCEPTED')::BIGINT,
        CASE
            WHEN COUNT(*) = 0 THEN 0
            ELSE (COUNT(*) FILTER (WHERE status = 'ACCEPTED') * 10000 / COUNT(*))::INTEGER
        END,
        CASE
            WHEN COUNT(*) FILTER (WHERE status = 'ACCEPTED') = 0 THEN 0
            ELSE COALESCE(AVG(quote_margin_percentage) FILTER (WHERE status = 'ACCEPTED'), 0)::INTEGER
        END
    FROM quotes
    WHERE org_id = p_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: simulate_quote_profit_scenarios
CREATE OR REPLACE FUNCTION simulate_quote_profit_scenarios(
    p_quote_id UUID,
    p_margin_adjustment INTEGER -- e.g. 500 for +5.00%
)
RETURNS TABLE (
    original_profit BIGINT,
    simulated_profit BIGINT,
    difference BIGINT
) AS $$
DECLARE
    v_cost BIGINT;
    v_original_profit BIGINT;
    v_margin INTEGER;
    v_quote_org_id UUID;
    v_user_org_id UUID;
BEGIN
    -- Security Check: Multi-tenant isolation
    SELECT org_id INTO v_quote_org_id FROM quotes WHERE id = p_quote_id;
    v_user_org_id := get_user_org_id();

    IF v_user_org_id IS NULL OR v_quote_org_id IS NULL OR v_user_org_id != v_quote_org_id THEN
        RAISE EXCEPTION 'Unauthorized: Access to quote % is denied.', p_quote_id;
    END IF;

    SELECT quote_total_cost, quote_profit, quote_margin_percentage
    INTO v_cost, v_original_profit, v_margin
    FROM quotes WHERE id = p_quote_id;

    RETURN QUERY
    SELECT
        COALESCE(v_original_profit, 0),
        COALESCE((v_cost * (v_margin + p_margin_adjustment) / 10000), 0)::BIGINT,
        COALESCE(((v_cost * (v_margin + p_margin_adjustment) / 10000) - v_original_profit), 0)::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: calculate_business_health_score
CREATE OR REPLACE FUNCTION calculate_business_health_score(p_org_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_total_quotes BIGINT;
    v_win_rate_pct INTEGER;
    v_avg_margin_pct INTEGER;
    v_profit_score INTEGER;
    v_stability_score INTEGER;
    v_efficiency_score INTEGER;
    v_total_score INTEGER;
    v_pot_balance BIGINT;
    v_user_org_id UUID;
BEGIN
    -- Security Check: Multi-tenant isolation
    v_user_org_id := get_user_org_id();
    IF v_user_org_id IS NULL OR v_user_org_id != p_org_id THEN
        RAISE EXCEPTION 'Unauthorized: Access to organization % is denied.', p_org_id;
    END IF;

    -- Get baseline stats
    SELECT total_quotes, win_rate_pct, avg_margin_pct
    INTO v_total_quotes, v_win_rate_pct, v_avg_margin_pct
    FROM get_quote_win_stats(p_org_id);

    -- 1. Profitability (Max 33): Target 20% margin (2000)
    v_profit_score := GREATEST(0, LEAST(33, (COALESCE(v_avg_margin_pct, 0) * 33 / 2000)));

    -- 2. Stability (Max 33): Based on money pot balances
    SELECT SUM(balance) INTO v_pot_balance FROM money_pots WHERE org_id = p_org_id;
    v_stability_score := CASE
        WHEN COALESCE(v_pot_balance, 0) >= 1000000 THEN 33 -- £10k+
        WHEN v_pot_balance >= 500000 THEN 20  -- £5k+
        WHEN v_pot_balance > 0 THEN 10
        ELSE 0
    END;

    -- 3. Efficiency (Max 34): Based on win rate, Target 50% (5000)
    v_efficiency_score := GREATEST(0, LEAST(34, (COALESCE(v_win_rate_pct, 0) * 34 / 5000)));

    v_total_score := v_profit_score + v_stability_score + v_efficiency_score;

    -- Record snapshot
    INSERT INTO business_health_snapshots (
        org_id, health_score, profitability_score, stability_score, efficiency_score
    ) VALUES (
        p_org_id, v_total_score, v_profit_score, v_stability_score, v_efficiency_score
    );

    RETURN v_total_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger for Quote Intelligence Snapshotting
CREATE OR REPLACE FUNCTION snapshot_quote_intelligence()
RETURNS TRIGGER AS $$
BEGIN
    -- Only snapshot if status changes to ACCEPTED or DECLINED
    IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status IN ('ACCEPTED', 'DECLINED')) THEN
        INSERT INTO quote_intelligence_snapshots (
            org_id, quote_id, net_amount, profit_amount, margin_pct, is_win
        ) VALUES (
            NEW.org_id,
            NEW.id,
            NEW.quote_amount_net,
            NEW.quote_profit,
            NEW.quote_margin_percentage,
            (NEW.status = 'ACCEPTED')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_snapshot_quote_intelligence ON quotes;
CREATE TRIGGER trg_snapshot_quote_intelligence
    AFTER UPDATE ON quotes
    FOR EACH ROW EXECUTE FUNCTION snapshot_quote_intelligence();
