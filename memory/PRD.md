# TradeLife PRD

## Problem Statement
Build and enhance TradeLife using Next.js App Router + Supabase + OpenAI + Tailwind CSS. Three phases:
1. Initial MVP: onboarding → dashboard → transaction classification → review
2. Enhancement: Remove localStorage, persist via Supabase, add Companies House mock, logo generation, route protection, user rule learning
3. Auth UI: Full login/signup flow with Supabase Auth

## Architecture
- **Frontend**: Next.js 14.2.3 App Router (client components)
- **API Routes**: Next.js /app/api/* (classify, transactions, user-rules, auth/me, auth/ensure-profile, onboarding/complete)
- **Backend Proxy**: FastAPI on port 8001 proxies /api/* to Next.js on port 3000 (K8s ingress compat)
- **Database**: Supabase (PostgreSQL) — transactions, user_rules, profiles, organisations
- **Auth**: Supabase Auth (email/password signInWithPassword, signUp)
- **AI**: OpenAI gpt-4o via Emergent LLM key for transaction classification fallback
- **Styling**: Tailwind CSS with blueprint theme

## What's Been Implemented

### Phase 1 - MVP
- [x] Onboarding with multi-step flow (Sole Trader, Limited, Not set up yet)
- [x] Dashboard with Connect Bank and classification results
- [x] Transaction classifier (3-tier: hardcoded → user rules → OpenAI)
- [x] Review page with Business/Personal buttons

### Phase 2 - Enhancement
- [x] Removed ALL localStorage, Supabase-only persistence
- [x] Companies House mock lookup, auto-generated logos
- [x] Classifier fetches user rules from Supabase before AI fallback
- [x] Middleware route protection (auth cookie check)

### Phase 3 - Auth UI
- [x] Login page: email/password form, Supabase signInWithPassword
- [x] Signup page: email/password form, Supabase signUp + profile creation
- [x] Error handling: empty fields, invalid credentials, short password
- [x] Post-login redirect: onboarding_complete → /dashboard, else → /onboarding
- [x] Post-signup redirect: → /onboarding
- [x] /api/auth/ensure-profile: creates profile row if not exists
- [x] Navigation links between login ↔ signup
- [x] Clean Tailwind UI, centered forms, no blank screens

## Key Files
- `/app/app/login/page.tsx` - Login form
- `/app/app/signup/page.tsx` - Signup form
- `/app/app/api/auth/ensure-profile/route.ts` - Profile creation after signup
- `/app/app/api/auth/me/route.ts` - Auth state check
- `/app/app/onboarding/page.tsx` - Multi-step onboarding
- `/app/app/dashboard/page.tsx` - Dashboard with Supabase data
- `/app/app/transactions/review/page.tsx` - Transaction review
- `/app/middleware.ts` - Route protection

## Prioritized Backlog
### P0
- Email confirmation flow (if Supabase requires it)
- Password reset flow

### P1
- Real Companies House API
- Real bank connection via Plaid

### P2
- Social login (Google)
- Transaction export, VAT calculation
