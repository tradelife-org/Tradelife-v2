# TradeLife PRD

## Problem Statement
Build and enhance TradeLife using Next.js App Router + Supabase + OpenAI + Tailwind CSS. Two phases:
1. Initial MVP: onboarding → dashboard → transaction classification → review
2. Enhancement: Remove localStorage, persist via Supabase, add Companies House mock, logo generation, route protection, user rule learning

## Architecture
- **Frontend**: Next.js 14.2.3 App Router (client components)
- **API Routes**: Next.js /app/api/* (classify, transactions, user-rules, auth/me, onboarding/complete)
- **Backend Proxy**: FastAPI on port 8001 proxies /api/* to Next.js on port 3000 (K8s ingress compat)
- **Database**: Supabase (PostgreSQL) — transactions, user_rules, profiles, organisations
- **AI**: OpenAI gpt-4o via Emergent LLM key for transaction classification fallback
- **Styling**: Tailwind CSS with blueprint theme

## Supabase Tables
- `transactions`: id(UUID), org_id(UUID), amount, description, merchant, date, type, category, confidence, created_at
- `user_rules`: id(UUID), org_id(UUID), merchant, type, category, created_at
- `profiles`: id(UUID), org_id, full_name, email, role, onboarding_completed, onboarding_complete, active_org_id
- `organisations`: id(UUID), name, stripe_customer_id, xero_tenant_id

## User Personas
- UK tradespeople (sole traders, limited companies) managing business/personal finances

## Core Requirements
1. Multi-step onboarding with business type selection and conditional flows
2. Companies House mock lookup for Limited Company flow
3. Auto-generated logo (colored circle with first letter)
4. Dashboard with "Connect Bank" → classify → persist to Supabase
5. Transaction classifier: hardcoded rules → user rules (Supabase) → AI fallback
6. Review page for manual reclassification with Supabase persistence
7. User rules learning: reclassification saves rules for future classifications
8. Route protection via middleware (auth cookie check)
9. Onboarding completion state in profiles table

## What's Been Implemented (Jan 2026)
### Phase 1 - MVP
- [x] Onboarding with multi-step flow (Sole Trader, Limited, Not set up yet)
- [x] Dashboard with Connect Bank and classification results
- [x] Transaction classifier (3-tier: hardcoded → user rules → OpenAI)
- [x] Review page with Business/Personal buttons
- [x] API routes: classify, transactions, user-rules

### Phase 2 - Enhancement
- [x] Removed ALL localStorage from app pages
- [x] All data persists via Supabase (transactions, user_rules)
- [x] Companies House mock lookup in Limited Company onboarding
- [x] Auto-generated logo (colored circle with company initial)
- [x] Enhanced preview with editable name, address, logo
- [x] Classifier fetches user rules from Supabase before AI fallback
- [x] Review page: PATCH transaction + POST user rule on reclassification
- [x] /api/auth/me endpoint (returns user + org_id)
- [x] /api/onboarding/complete endpoint (updates profiles)
- [x] Middleware route protection (checks Supabase auth cookies)
- [x] UUID-based transaction IDs (auto-generated when non-UUID provided)
- [x] Onboarding page safety (never blank, always shows UI or fallback)
- [x] Dashboard fetches existing transactions from Supabase on load
- [x] All tests passing (100% backend, 95% frontend)

## Key Files
- `/app/app/onboarding/page.tsx` - Multi-step onboarding with Companies House mock
- `/app/app/dashboard/page.tsx` - Dashboard with Supabase-backed data
- `/app/app/transactions/review/page.tsx` - Review with Supabase persistence
- `/app/app/api/classify/route.ts` - Classification with user rules from Supabase
- `/app/app/api/transactions/route.ts` - GET/POST/PATCH for transactions
- `/app/app/api/user-rules/route.ts` - GET/POST for user rules
- `/app/app/api/auth/me/route.ts` - Auth state check
- `/app/app/api/onboarding/complete/route.ts` - Onboarding completion
- `/app/lib/transactions/classifier.ts` - 3-tier classification logic
- `/app/middleware.ts` - Route protection
- `/app/backend/server.py` - FastAPI proxy

## Prioritized Backlog
### P0 (Critical)
- Full login/signup flow with Supabase Auth
- Real Companies House API integration

### P1 (Important)
- Real bank connection via Plaid
- Transaction export (CSV/PDF)
- More hardcoded merchant rules

### P2 (Nice to have)
- Receipt upload for transaction evidence
- Monthly expense summary
- Auto-learning improvements (confidence score tracking)
- VAT calculation from business transactions

## Next Tasks
1. Implement full Supabase Auth login/signup flow
2. Real Companies House API integration
3. Connect Plaid for real bank data
4. Add more merchant classification rules
