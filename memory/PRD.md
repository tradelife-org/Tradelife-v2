# TradeLife - Codebase Forensic Audit PRD

## Original Problem Statement
Full forensic audit of the TradeLife repository — inspect entire codebase and report ONLY what is ACTUALLY implemented in code across Auth, Ledger, Finance Calculations, Jobs & Quotes, Integrations, and API/Backend structure.

## Architecture
- **Framework**: Next.js (App Router) with TypeScript
- **Auth**: Supabase Auth (email/password + Google OAuth)
- **Database**: Supabase PostgreSQL with 28 migrations
- **Integrations**: Xero, Plaid, Stripe, Twilio, Resend, Gemini AI, OpenAI
- **Currency Convention**: All monetary values BIGINT (pence), percentages x100

## What's Been Implemented (Jan 2026)
- [x] Full forensic audit completed
- [x] Auth system: Supabase Auth, signup flow, OAuth callback, profile auto-creation
- [x] Ledger: job_wallet_ledger with 10 event categories, job_wallets, money_pots, cashflow_entries, payment_records, burn_rate_snapshots, bank_transactions
- [x] Finance: Burn rate, runway, wallet balance, net position, retention tracking calculations
- [x] Quotes: Full pricing engine (section + quote + line item calculations), templates, upsells, snapshots, immutability
- [x] Jobs: Full lifecycle schema, variations (Can You Just), materials, timeline
- [x] Invoices: Create, send, mark paid with ledger entries
- [x] Integrations: Xero OAuth + sync, Plaid banking, Stripe payments/Connect, Twilio voice/SMS, Gemini/OpenAI AI

## Critical Gaps Found
- P0: Login page has no submit handler (UI only)
- P0: Middleware disabled (no route protection)
- P0: /api/quotes/accept uses lowercase 'accepted' vs DB ENUM 'ACCEPTED'
- P1: getFinanceDashboardData() returns hardcoded zeros
- P1: Stripe webhook logs but processes nothing
- P1: /api/quotes and /api/jobs GET routes are placeholders
- P2: processCallRecording() is empty
- P2: /api/auth/me returns data without session (dev fallback)
- P2: No minimum/target revenue calculations

## Prioritized Backlog
### P0 - Critical
1. Fix login page submit handler
2. Re-enable auth middleware
3. Fix quote accept API enum casing

### P1 - High
4. Implement getFinanceDashboardData() calculations
5. Wire Stripe webhook processing (payment_intent.succeeded → markInvoicePaid)
6. Implement /api/quotes and /api/jobs GET routes

### P2 - Medium
7. Implement call recording transcription
8. Secure /api/auth/me endpoint
9. Add minimum/target revenue calculations

## Margin Engine Extension (Jan 2026)
- [x] `calculateRequiredMargin()` — burn/target/jobs → decimal margin
- [x] `evaluateQuote()` — OK/WARNING/DANGEROUS grading
- [x] `projectQuoteOutcome()` — N-job financial projection
- [x] `getRecommendedPrice()` — cost / (1 - margin)
- [x] `recalculateQuote()` extended with optional `financialContext` → `outcomeLayer`
- [x] 57/57 tests pass, zero regressions

### Next Steps
- P1: Wire financialContext from getDashboardMetrics() into quote creation
- P1: Surface outcomeLayer (status badge, recommended price) in quote builder UI
- P2: Add per-section outcome evaluation

## Login Fix (Jan 2026)
- [x] Added `handleLogin` with `supabase.auth.signInWithPassword({ email, password })`
- [x] Wired `onSubmit={handleLogin}` to form, `e.preventDefault()` included
- [x] On success → `router.push('/quotes/create')`
- [x] On failure → error displayed in UI via `login-error` div, logged to console, no crash
- [x] Loading state: button disabled + "Signing in..." text during auth call
- [x] Google OAuth: wired `signInWithOAuth({ provider: 'google' })` with redirect to `/auth/callback`
- [x] Signup page NOT modified. Middleware NOT modified. Backend NOT modified.
- [x] 35/35 existing quote engine tests still pass (no regressions)

## Middleware Re-enabled (Jan 2026)
- [x] Restored auth middleware from backup pattern
- [x] Fixed `setAll` bug: `res` now properly reassigned so refreshed cookies are returned to browser
- [x] Public routes: `/login`, `/signup`, `/auth/callback` (exact + prefix match)
- [x] API routes excluded from matcher (`api/`) — webhooks, crons, public endpoints unaffected
- [x] All unauthenticated non-public requests → redirect to `/login`
- [x] Backup file untouched

## Auth /me Fallback Removed (Jan 2026)
- [x] Removed dev/preview fallback that returned first available profile/org without session
- [x] No session → HTTP 401 `{ error: "Unauthorized" }`
- [x] Authenticated path unchanged: session → profile lookup → return user with org_id
- [x] No other auth files modified

## Finance Dashboard Real Calculations (Jan 2026)
- [x] `getFinanceDashboardData()` now computes from `job_wallet_ledger`
- [x] totalRevenue = sum(CREDIT amounts)
- [x] totalExpenses = sum(DEBIT amounts)
- [x] monthlyBurn = sum(DEBIT amounts where created_at >= 30 days ago)
- [x] cash = totalRevenue - totalExpenses
- [x] runway = cash / monthlyBurn (months, floored) or 0
- [x] Pot values = totalRevenue * allocation_percentage / 10000
- [x] All hardcoded zeros removed

## Quote ↔ Finance Wiring (Jan 2026)
- [x] `recalculateQuote` now `async` — fetches real ledger data via `getFinanceDashboardData()`
- [x] `financialContext` built from: `burnRate`, `burnRate * 1.3` (target), `jobsPerMonth: 20`
- [x] outcomeLayer ALWAYS computed (no conditional, non-optional in return type)
- [x] Return includes: outcome (status/requiredMargin/actualMargin/profit), projection, recommendation
- [x] All pure calculation functions unchanged

## Quote Outcome UI (Jan 2026)
- [x] Server page computes outcomeLayer from real finance data (try/catch, graceful fallback)
- [x] Passed to StevensenProfitSidebar via new `outcomeLayer` prop
- [x] Displays: status (OK/WARNING/DANGEROUS), required margin %, actual margin %
- [x] WARNING/DANGEROUS: shows "This job is below your required margin" + recommended price
- [x] No layout changes, no new components, no chart/visuals — simple text block in existing sidebar

## Removed Duplicate Calculations from UI (Jan 2026)
- [x] Replaced 5 individual function calls (calculateRequiredMargin, evaluateQuote, projectQuoteOutcome, getRecommendedPrice, getFinanceDashboardData) with single `recalculateQuote()` call
- [x] outcomeLayer sourced from `result.outcomeLayer` — single source of truth
- [x] UI display unchanged — sidebar still receives outcomeLayer prop
- [x] Backend logic untouched

## Quote Accept Enum Fix (Jan 2026)
- [x] Fixed `status: 'accepted'` → `status: 'ACCEPTED'` in `/api/quotes/accept/route.ts`
- [x] Matches DB ENUM (DRAFT/SENT/ACCEPTED/DECLINED)

## Decouple Finance from Quote Calculation (Jan 2026)
- [x] Removed `getFinanceDashboardData` import from quotes.ts
- [x] `recalculateQuote` now sync: `(input, financialContext) => FullQuoteRecalcResult`
- [x] Finance fetching moved to caller (page.tsx) — passed as explicit parameter
- [x] quotes.ts is pure again — no side effects, no async, no DB calls

## Projection Display in Quote UI (Jan 2026)
- [x] WARNING/DANGEROUS quotes now show projection: Revenue, Profit, Avg profit/job (10 jobs)
- [x] Low profit warning: "You are working below your target level" when avgProfitPerJob < quote profit
- [x] Plain text only, no charts, no new components, no layout changes

## Login Input Text Visibility Fix (Jan 2026)
- [x] Added `-webkit-text-fill-color: #fff` and `caret-color: #fff` to `.login-input`
- [x] Added `:-webkit-autofill` override to prevent browser autofill from making text invisible
- [x] No layout/structure changes

## Navigation Fix (Jan 2026)
- [x] TopBar: hamburger button now has `useState(open)` + `onClick` toggle
- [x] Mobile menu renders when open with all nav links (Dashboard, Quotes, Jobs, Invoices, Clients, Finance, Settings)
- [x] Desktop inline nav added (visible on lg+)
- [x] /quotes/page.tsx: server component fetching real quotes from Supabase, displaying list with status/amount/profit
- [x] AppShell: now wraps children with TopBar + main container

## Dashboard + Navigation Flow (Jan 2026)
- [x] `/` (page.tsx): Server component — auth check, redirects to /login if unauthenticated, shows dashboard with nav cards (Quotes, Jobs, Finance, Invoices)
- [x] `/quotes` (page.tsx): Already functional — fetches quotes from Supabase, links to /quotes/[id]
- [x] Full flow: Login → Dashboard → Quotes → Quote Detail (with outcome system)

## UI Stabilisation Pass (Jan 2026)
- [x] tokens.css: All CSS variables swapped from dark (#0b0f14) to light (#f9fafb) theme
- [x] layout.tsx: Removed background image, gradients, blur overlays. Plain `bg-gray-50 text-gray-900`
- [x] login/page.tsx: Stripped glass panels, glow effects, absolute positioning. Clean white card, centered. Inputs: `border border-gray-300 text-black bg-white`. Buttons: `bg-blue-600 text-white`
- [x] signup/page.tsx: Same treatment — removed framer-motion, radial gradients, glass-panel. Clean white card
- [x] page.tsx (dashboard): Replaced CSS variable references with plain Tailwind gray colors
- [x] TopBar.tsx: Replaced dark theme with `bg-white border-b border-gray-200`, plain gray text
- [x] AppShell: Added `bg-gray-50`
- [x] stevensen-sidebar.tsx: Removed GlassPanel import, dark bg-slate-900. Now plain white card with gray borders
- [x] GlassPanel component: Stripped backdrop-blur, noise, gradient layers. Now plain `bg-white border-gray-200 shadow-sm`
- [x] quotes/page.tsx: Replaced CSS variable references with gray/white Tailwind classes
- NOT TOUCHED: auth logic, routing, API calls, quote system, finance system, calculation logic

## API Routes Implemented (Jan 2026)
- [x] GET /api/quotes: Auth check → profile → org_id → real Supabase query (quotes + clients join)
- [x] GET /api/jobs: Auth check → profile → org_id → real Supabase query (jobs + clients join)
- [x] Both return 401 if unauthenticated, 404 if no org, 500 on query error
- [x] Zero placeholders remaining
