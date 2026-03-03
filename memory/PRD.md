# TradeLife v2 — PRD (Product Requirements Document)

## Original Problem Statement
Build the Foundation Layer of TradeLife v2: a Next.js + Supabase trade management platform (Quote -> Job -> Invoice pipeline) for UK tradespeople. Strict data lineage, BigInt money (pence/cents), org_id multi-tenancy, and immutability gates on accepted quotes.

## Architecture
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + Shadcn-style components
- **Database**: Supabase (PostgreSQL with RLS)
- **Currency**: BigInt (pence/cents) — zero floating-point
- **Percentages**: Integer x100 (2500 = 25.00%)
- **Auth**: Supabase Auth (deferred)
- **Integrations**: Stripe, Xero, Resend, Google Calendar (all deferred — placeholder columns exist)

## User Personas
1. **Sole Trader** (Electrician, Plumber) — Creates quotes on-site from phone/tablet
2. **Small Firm Owner** — Manages multiple quotes/jobs, tracks profitability
3. **Client** — Receives and accepts quotes via share link

## Core Requirements (Static)
- Strict Lineage: Quote -> Job -> Invoice (no manual re-entry)
- Immutability: ACCEPTED quotes become read-only
- Multi-tenancy: org_id on every table, RLS on all
- Server-side math: Pricing engine runs server-side only
- BigInt money: All currency as pence, all percentages as x100

## What's Been Implemented (January 2026)

### Session 1 — Foundation Layer
- [x] **Database Schema**: 13 tables, 7 enums, RLS policies, immutability triggers
  - File: `/app/supabase/migrations/00001_foundation_schema.sql`
- [x] **TypeScript Types**: Full type definitions for all entities
  - File: `/app/frontend/lib/types/database.ts`
- [x] **Pricing Engine**: Server-side calculation functions (35/35 tests pass)
  - File: `/app/frontend/lib/actions/quotes.ts`
  - Tests: `/app/frontend/lib/actions/quotes.test.ts`
- [x] **PROJECT_STANDARDS.md**: Constitution with 9 rules
  - File: `/app/PROJECT_STANDARDS.md`
- [x] **Memory MCP**: Full structural audit stored as entities/relations
- [x] **Create Quote Page**: Multi-section builder with real-time calculations
  - Desktop: Two-column layout (form + sticky totals)
  - Mobile: Responsive with fixed bottom summary bar
  - Features: Add/remove sections, collapse/expand, Direct/Subcontract toggle
  - 100% test pass rate on all features

### Design System: "Industrial Swiss"
- Typography: Chivo (headings) + Manrope (body) + JetBrains Mono (numbers)
- Colors: Blueprint Blue (#0047AB) + Safety Orange (#FF5F00)
- Components: MoneyInput, PercentageInput, QuoteSectionCard, TotalsPanel

## Prioritized Backlog

### P0 — Core Flow
- [ ] Supabase Auth integration (sign up, login, org creation)
- [ ] Connect Create Quote page to Supabase (save/load quotes)
- [ ] Quote list page (dashboard)
- [ ] Client share link (public quote view + accept flow)
- [ ] Quote -> Job conversion

### P1 — Job & Invoice
- [ ] Job detail page with line items
- [ ] Variation ("Can You Just") workflow
- [ ] Invoice creation from Job
- [ ] Invoice PDF generation

### P2 — Integrations
- [ ] Stripe payment links
- [ ] Xero sync (push/pull invoices)
- [ ] Resend email (quote/invoice delivery)
- [ ] Google Calendar (job scheduling)

### P3 — Finance
- [ ] Profit First money pots dashboard
- [ ] Cashflow entries & allocation
- [ ] Open Banking integration

## Next Tasks
1. Apply SQL migration to Supabase (user runs manually)
2. Set up Supabase Auth
3. Wire Create Quote page to Supabase persistence
4. Build Quote list/dashboard page
