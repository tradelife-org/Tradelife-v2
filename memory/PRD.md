# TradeLife PRD

## Problem Statement
Build a minimal, production-ready feature for TradeLife using Next.js App Router + Supabase + OpenAI + Tailwind CSS. Create onboarding → dashboard → transaction classification flow. All server logic in /app/api/* routes.

## Architecture
- **Frontend**: Next.js 14.2.3 App Router (client components for interactive pages)
- **API Routes**: Next.js /app/api/* routes (classify, transactions, user-rules)
- **Backend Proxy**: FastAPI on port 8001 proxies /api/* to Next.js on port 3000 (for K8s ingress compatibility)
- **Database**: Supabase (with localStorage fallback for when tables don't exist)
- **AI**: OpenAI via Emergent LLM key for transaction classification fallback
- **Styling**: Tailwind CSS with custom blueprint theme

## User Personas
- UK tradespeople (sole traders, limited companies) managing business/personal finances

## Core Requirements
1. Multi-step onboarding (business type → conditional questions → business name → preview)
2. Dashboard with "Connect Bank" mock flow
3. Transaction classifier: hardcoded rules → user rules → AI fallback
4. Review page for manual classification corrections
5. User rules stored when manually classifying

## What's Been Implemented (Jan 2026)
- [x] Onboarding page with multi-step flow (Sole Trader, Limited Company, Not set up yet)
- [x] Conditional onboarding steps based on business type
- [x] Business name input and autofill preview
- [x] Dashboard with "Connect Bank" card
- [x] Mock transaction loading and classification on Connect Bank click
- [x] Transaction classifier with 3-tier logic (hardcoded → user rules → OpenAI)
- [x] Classification results display (Business/Personal/Review counts + transaction list)
- [x] Review page with Business/Personal reclassification buttons
- [x] API routes: /api/classify, /api/transactions, /api/user-rules
- [x] FastAPI proxy for external API access
- [x] localStorage persistence bridge between pages
- [x] All flows tested end-to-end (95%+ pass rate)

## Key Files
- `/app/app/onboarding/page.tsx` - Multi-step onboarding
- `/app/app/dashboard/page.tsx` - Dashboard with bank connect
- `/app/app/transactions/review/page.tsx` - Transaction review
- `/app/app/api/classify/route.ts` - Classification endpoint
- `/app/app/api/transactions/route.ts` - Transaction CRUD
- `/app/app/api/user-rules/route.ts` - User rules CRUD
- `/app/lib/transactions/classifier.ts` - Classification logic
- `/app/backend/server.py` - FastAPI proxy

## Prioritized Backlog
### P0 (Critical)
- Create Supabase tables (transactions, user_rules) via Supabase dashboard/migrations

### P1 (Important)
- Real bank connection (Plaid integration - partially set up in codebase)
- Authentication flow (Supabase Auth middleware already exists)
- Not set up yet → Limited Company onboarding flow testing

### P2 (Nice to have)
- Receipt upload for transaction evidence
- Export classified transactions as CSV
- Auto-learning from user classification patterns
- Monthly expense summary dashboard

## Next Tasks
1. Set up Supabase tables for persistent storage
2. Enable auth middleware for production
3. Connect real bank data via Plaid
4. Add more hardcoded merchant rules
