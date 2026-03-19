# TradeLife PRD

## Problem Statement
Premium SaaS platform for UK tradespeople. Built with Next.js App Router + Supabase + OpenAI + Tailwind CSS.

## Architecture
- **Frontend**: Next.js 14.2.3 App Router, Framer Motion, Zustand
- **API Routes**: /app/api/* (classify, transactions, user-rules, auth/me, auth/ensure-profile, onboarding/complete)
- **Backend Proxy**: FastAPI on port 8001 → Next.js port 3000
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (email/password)
- **AI**: OpenAI gpt-4o via Emergent LLM key
- **Styling**: Tailwind CSS + CSS custom properties (3-theme system)

## Implemented Features

### Phase 1 - MVP
- [x] Transaction classifier (hardcoded → user rules → OpenAI)
- [x] Onboarding multi-step flow
- [x] Dashboard with classification results
- [x] Review page with reclassification

### Phase 2 - Supabase Persistence
- [x] All data via Supabase (transactions, user_rules, profiles)
- [x] Companies House mock lookup + auto-generated logos
- [x] Route protection middleware

### Phase 3 - Auth UI
- [x] Login page (Supabase signInWithPassword)
- [x] Signup page (Supabase signUp + profile creation)

### Phase 4 - Premium Visual System
- [x] 3-theme system: Molten (orange), Commercial (blue), Remembrance (crimson)
- [x] CSS variable tokens at root level, zero hardcoded colors
- [x] Zustand store with persist middleware for theme state
- [x] Theme selection step in onboarding
- [x] Settings panel with instant theme switching on dashboard
- [x] Dark glassmorphism UI across all screens
- [x] 3-column command center dashboard layout
- [x] AI Core centerpiece, glass panels, soft edge glow
- [x] Framer Motion entrance animations
- [x] Login/Signup with ambient glow and glass panels
- [x] All existing functionality preserved (100% test pass)

## Key Files
- `/app/app/globals.css` - Theme CSS variables + glass panel classes
- `/app/lib/stores/theme-store.ts` - Zustand theme state
- `/app/components/theme-provider.tsx` - Dynamic theme class application
- `/app/app/login/page.tsx`, `/app/app/signup/page.tsx` - Auth UI
- `/app/app/onboarding/page.tsx` - Multi-step + theme selection
- `/app/app/dashboard/page.tsx` - 3-column command center
- `/app/app/transactions/review/page.tsx` - Review with dark theme

## Backlog
### P0
- Real bank connection (Plaid)
- Email confirmation flow

### P1
- Real Companies House API
- Receipt upload
- Password reset

### P2
- Social login, transaction export, VAT calc
