-- Migration for missing profile fields required by Onboarding and Bootstrap

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS active_org_id UUID REFERENCES public.organisations(id);

-- Update existing profiles to have active_org_id set to their org_id
UPDATE public.profiles SET active_org_id = org_id WHERE active_org_id IS NULL AND org_id IS NOT NULL;

-- Assuming all current users have completed onboarding if they have an org
UPDATE public.profiles SET onboarding_completed = true WHERE org_id IS NOT NULL;
