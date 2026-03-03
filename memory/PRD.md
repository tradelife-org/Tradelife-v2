# TradeLife v2 — PRD (Product Requirements Document)

## Original Problem Statement
Build TradeLife v2: a Next.js + Supabase trade management platform (Quote → Job → Invoice pipeline) for UK tradespeople. Strict data lineage, BigInt money (pence/cents), org_id multi-tenancy, and immutability gates on accepted quotes.

## Architecture
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + Shadcn-style components
- **Database**: Supabase (PostgreSQL with RLS)
- **Deployment**: Vercel (production domain: `tradelife.app`)
- **Currency**: BigInt (pence/cents) — zero floating-point
- **Percentages**: Integer x100 (2500 = 25.00%)
- **Auth**: Supabase Auth with email/password
- **Integrations**: Stripe, Xero, Resend, Google Calendar (all deferred)

## User Personas
1. **Sole Trader** (Electrician, Plumber) — Creates quotes on-site from phone/tablet
2. **Small Firm Owner** — Manages multiple quotes/jobs, tracks profitability
3. **Client** — Receives and accepts quotes via share link

## Core Requirements
- Strict Lineage: Quote → Job → Invoice (no manual re-entry)
- Immutability: ACCEPTED quotes become read-only
- Multi-tenancy: org_id on every table, RLS on all
- Server-side math: Pricing engine runs server-side only
- BigInt money: All currency as pence, all percentages as x100

## Design System: "Industrial Swiss"
- Typography: Chivo (headings) + Manrope (body) + JetBrains Mono (numbers)
- Colors: Blueprint Blue (#0047AB) + Safety Orange (#FF5F00)
- Components: MoneyInput, PercentageInput, QuoteSectionCard, TotalsPanel

---

## What's Been Implemented

### Session 1 — Foundation Layer (January 2026)
- [x] Database Schema: 13 tables, 7 enums, RLS policies, immutability triggers
- [x] TypeScript Types: Full type definitions for all entities
- [x] Pricing Engine: Server-side calculation functions (35/35 tests pass)
- [x] PROJECT_STANDARDS.md: Constitution with 9 rules
- [x] Create Quote Page: Multi-section builder with real-time calculations

### Session 2 — Auth + Persistence (January 2026)
- [x] Supabase Auth: Login + Signup pages with JWT session management
- [x] Auth auto-seed: App-level fallback creates org+profile on signup
- [x] Save Draft persistence: Server Action writes quote+sections+line_items
- [x] BigInt conversion verified: UI pounds → pence, percentages → x100
- [x] Middleware: Protects app routes, redirects unauth users to /login

### Session 3 — Dashboard & Templates (January 2026)
- [x] Quote Dashboard: /quotes page with data table, stats cards
- [x] BigInt Formatting: All dashboard values formatted from pence to £0.00
- [x] Navigation: AppShell component with top nav
- [x] Quote Templates: Save as Template + Import Template
- [x] Search: Dashboard search filters by client name, reference, status

### Session 4 — Public Portal + Production Config (March 2026)
- [x] Public Quote View: /view/[share_token] — client-facing quote page
- [x] Accept Quote API: POST /api/quotes/accept — updates status to ACCEPTED
  - Uses Service Role Key to bypass RLS (public system action)
  - Idempotent, validates SENT status, rejects DRAFT/DECLINED
  - 100% test pass rate (12/12 tests including config verification)
- [x] Production Config: Cleaned for Vercel-native deployment
  - Removed all Emergent preview proxy workarounds
  - Removed rewrites, middleware hacks, junk route files
  - Clean next.config.js with production-only origins
  - NEXT_PUBLIC_SITE_URL hardcoded to https://tradelife.app

---

## Environment Variables for Vercel

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only, never exposed to client) |
| `NEXT_PUBLIC_SITE_URL` | Yes | Production domain: `https://tradelife.app` |

**Note:** `NEXT_PUBLIC_VERCEL_URL` is auto-injected by Vercel and used as a fallback only.

---

## Prioritized Backlog

### P0 — Core Flow (Completed)
- [x] Supabase Auth integration
- [x] Connect Create Quote page to Supabase
- [x] Quote list page (dashboard)
- [x] Client share link (public quote view + accept flow)
- [x] Production configuration for Vercel

### P0 — Remaining
- [ ] Push to `main` branch (user action: "Save to Github")
- [ ] Quote → Job conversion

### P1 — Job & Invoice
- [ ] Job detail page with line items
- [ ] Variation ("Can You Just") workflow
- [ ] Invoice creation from Job
- [ ] Invoice PDF generation
- [ ] Quote Analytics Dashboard (profitability by trade type)

### P2 — Integrations
- [ ] Stripe payment links
- [ ] Xero sync (push/pull invoices)
- [ ] Resend email (quote/invoice delivery)
- [ ] Google Calendar (job scheduling)

### P3 — Finance
- [ ] Profit First money pots dashboard
- [ ] Cashflow entries & allocation
- [ ] Open Banking integration

---

## Key API Endpoints
- `POST /api/quotes/accept` — Accepts a quote (public, uses Service Role Key)
- `GET /auth/callback` — Supabase email auth callback

## Key Files
- `/app/frontend/app/api/quotes/accept/route.ts` — Accept Quote API
- `/app/frontend/app/view/[share_token]/page.tsx` — Public quote portal (server)
- `/app/frontend/app/view/[share_token]/client.tsx` — Public quote portal (client)
- `/app/frontend/middleware.ts` — Auth middleware
- `/app/frontend/next.config.js` — Next.js config
- `/app/frontend/lib/utils/url.ts` — URL helpers (tradelife.app)
- `/app/frontend/lib/actions/quotes.ts` — Pricing engine
- `/app/frontend/lib/actions/public-quote.ts` — Public quote data fetching
