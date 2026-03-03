-- ============================================================================
-- TradeLife v2 - Auth Auto-Seed Trigger
-- Migration: 00002_auth_auto_seed
--
-- When a new user signs up via Supabase Auth, this trigger automatically:
-- 1. Creates an Organisation for them
-- 2. Creates a Profile linking the user to the org
-- 3. The existing seed_default_money_pots trigger fires on org insert
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
BEGIN
    -- Step 1: Create a new organisation for this user
    INSERT INTO public.organisations (name)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'My Organisation') || '''s Org')
    RETURNING id INTO new_org_id;

    -- Step 2: Create a profile linking user to org
    INSERT INTO public.profiles (id, org_id, full_name, email, role)
    VALUES (
        NEW.id,
        new_org_id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        'owner'
    );

    -- Note: seed_default_money_pots trigger fires automatically on organisations INSERT
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fire after a new user is created in auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
