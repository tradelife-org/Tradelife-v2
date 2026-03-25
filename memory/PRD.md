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
