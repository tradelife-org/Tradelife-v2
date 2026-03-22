# TradeLife v3 — P0/P1/P2 Remediation Plan

## Planning Assumptions
- Scope is intentionally narrowed to critical production blockers first.
- Schema strategy: **clean baseline rebuild**, not incremental rescue of the current migration chain.
- Goal of P0: make the system structurally safe enough to begin trustworthy end-to-end rebuilding.
- Guiding rule: **one canonical schema, one canonical money flow, one canonical public-access model, one canonical payment state machine**.

---

## P0 — Critical Remediation Plan

## P0.1 — Replace the migration chain with a canonical schema baseline

### Objective
Remove schema drift and make the database reproducible from scratch.

### Why this comes first
Everything else depends on the schema being authoritative. Right now the app, migrations, and runtime assumptions disagree.

### Exact fix order
1. **Freeze the current migration set** as historical reference only.
2. **Author one new canonical baseline migration** that reflects the schema the app should actually use.
3. **Deprecate conflicting table definitions** instead of trying to patch them in place.
4. **Rebuild the quote, invoice, ledger, payment, portal, and scheduling tables from the baseline**.
5. **Add explicit check constraints and foreign keys for every stateful module**.
6. **Create a small seed/verification migration** for required buckets, indexes, and policies only after the core tables are stable.

### Affected migrations/files
- Current conflicting migrations to replace/supersede:
  - `/app/supabase/migrations/00004_job_wallets.sql`
  - `/app/supabase/migrations/00006_financial_engine.sql`
  - `/app/supabase/migrations/00007_ledger_categories.sql`
  - `/app/supabase/migrations/00008_tax_engine.sql`
  - `/app/supabase/migrations/00010_retention_logic.sql`
  - `/app/supabase/migrations/00014_payments.sql`
  - `/app/supabase/migrations/00018_proposal_snapshots.sql`
  - `/app/supabase/migrations/00027_ledger_spelling.sql`
- New canonical baseline migration (recommended):
  - `/app/supabase/migrations/00100_v3_schema_baseline.sql`
- Optional follow-up policy/index migration:
  - `/app/supabase/migrations/00101_v3_security_policies.sql`

### Canonical schema decisions to lock in
- **Quotes** remain the upstream commercial object.
- **Jobs** must always reference a source quote.
- **Invoices** must always reference a source job.
- **quote_snapshots** must be defined once with all required acceptance columns.
- **job_wallet_ledger** must be defined once with one posting model.
- **payment_records / payment_events / refund_records / dispute_records** should be explicit tables, not implied behaviour.
- Remove dead schema dependencies unless intentionally rebuilt:
  - `proposals`
  - `transactions`
  - `user_rules`
  - `twilio_recordings`
  - `webhook_logs`

### Validation steps
- Create a fresh database and run the new migration chain from zero.
- Verify these tables exist with the expected columns and constraints:
  - `quotes`, `quote_sections`, `quote_line_items`, `quote_snapshots`
  - `jobs`, `job_line_items`, `job_materials`, `job_timeline`
  - `invoices`, `invoice_line_items`
  - `job_wallet_ledger`, `job_wallets`, `money_pots`
  - `payment_records`, `payment_events`, `refund_records`, `dispute_records`
- Confirm no migration depends on a column created only by a conflicting earlier version.
- Run a cold-start smoke test: create quote → accept quote → convert to job → create invoice.

---

## P0.2 — Lock down security isolation and public access

### Objective
Stop unauthorised data exposure and remove unsafe service-role patterns.

### Why this is second
The current code has real isolation failures. Until these are removed, any live data is unsafe.

### Exact fix order
1. **Delete or replace public RLS policies that expose records globally**.
2. **Move public-token access into narrowly scoped SECURITY DEFINER functions or tightly validated service actions**.
3. **Remove all routes that trust caller-supplied `org_id` while using service-role access**.
4. **Require session or validated token context for every route/action**.
5. **Return 401/403 on missing auth instead of fallback org/profile behaviour**.
6. **Replace broad service-role reads with server-session reads where possible**.

### Affected migrations/files
- Policies to change:
  - `/app/supabase/migrations/00001_foundation_schema.sql`
    - remove/replace public quote policy
  - `/app/supabase/migrations/00016_client_portal.sql`
    - remove/replace `Public token verify`
- Route handlers/actions to harden:
  - `/app/app/api/auth/me/route.ts`
  - `/app/app/api/auth/ensure-profile/route.ts`
  - `/app/app/api/transactions/route.ts`
  - `/app/app/api/user-rules/route.ts`
  - `/app/app/api/quotes/accept/route.ts`
  - `/app/lib/actions/public-quote.ts`
  - `/app/lib/actions/portal.ts`
  - `/app/lib/supabase/server.ts`
  - `/app/lib/supabase/server-safe.ts`

### Required behaviour after fix
- Public quote access must only return a quote when the request presents the exact share token.
- Portal access must only return records derived from the validated invite token.
- `/api/auth/me` must return `user: null` when there is no valid session.
- Transactions/rules APIs must derive org context from session, not query/body input.
- Service-role use must be limited to:
  - webhook processing
  - secure token validation wrappers
  - background jobs

### Validation steps
- Unauthenticated call to `/api/auth/me` returns `user: null`, not a real org.
- Unauthenticated requests cannot enumerate quotes or portal invites.
- A valid share token fetches exactly one quote and only safe client-facing fields.
- Invalid token returns 404/403 with no information leakage.
- Cross-org access attempts fail in route tests.

---

## P0.3 — Rebuild ledger correctness and canonical money posting

### Objective
Make the financial engine deterministic and align posting rules to the v3 blueprint.

### Why this is third
Without a trusted ledger, revenue, runway, dashboards, invoices, and payouts are all misleading.

### Exact fix order
1. **Define the canonical ledger contract in the schema**.
2. **Create one posting service/module** used by every writer.
3. **Map each business event to exactly one posting rule**.
4. **Refactor every direct ledger insert to call the posting service**.
5. **Update all readers/dashboards to consume canonical categories only**.
6. **Add regression tests for every money transition**.

### Canonical posting rules
- **Quote accepted** → post `COMMITTED_REVENUE`
- **Invoice issued** → no recognised revenue yet; invoice becomes collectible, not earned cash
- **Payment received** → post `RECOGNISED_REVENUE`
- **Expense confirmed** → post `EXPENSE` (+ `VAT` or `VAT_RECLAIM`, whichever naming is chosen canonically)
- **Refund issued** → post negative `RECOGNISED_REVENUE`
- **Retention hold/release** → explicit separate posting classes, not ad hoc debits

### Affected files
- Schema / migration layer:
  - `/app/supabase/migrations/00100_v3_schema_baseline.sql`
- Writer code to refactor:
  - `/app/lib/actions/quote-workflow.ts`
  - `/app/lib/actions/proposal.ts`
  - `/app/lib/actions/invoices.ts`
  - `/app/lib/actions/receipts.ts`
  - `/app/lib/actions/finance.ts`
  - `/app/lib/actions/financial-comms.ts`
  - `/app/lib/actions/payouts.ts`
- Reader code to refactor:
  - `/app/lib/actions/dashboard.ts`
  - `/app/lib/actions/analytics.ts`
  - `/app/lib/actions/command-center.ts`
  - `/app/lib/workers/finance-snapshot.ts`

### Structural code change recommended
- Introduce a single module such as:
  - `/app/lib/finance/ledger.ts`
  - or `/app/lib/actions/ledger.ts`
- That module should own:
  - category enum contract
  - debit/credit or signed-amount convention
  - posting helpers
  - validation guards
  - idempotent event keys

### Validation steps
- Automated test matrix:
  - accept quote → ledger shows committed only
  - create invoice → ledger unchanged for recognised revenue
  - record payment → recognised revenue posted once
  - confirm expense with VAT → correct split
  - refund payment → negative recognised revenue
- Dashboard totals reconcile to the same ledger totals.
- No module writes `REVENUE`, `RECOGNIZED_REVENUE`, and `RECOGNISED_REVENUE` interchangeably after refactor.

---

## P0.4 — Implement a real Stripe + payment state machine

### Objective
Turn Stripe from a link generator into a real payment lifecycle engine.

### Why this is fourth
Stripe is currently not the system of record for invoice payment state. That must change before public payment use.

### Exact fix order
1. **Define payment and webhook tables in the new baseline**.
2. **Define the invoice/payment state machine**.
3. **Make checkout/session creation write a pending payment record before redirecting**.
4. **Implement verified webhook processing with signature validation**.
5. **Make webhooks the only path that marks invoice payment state and posts recognised revenue**.
6. **Add refund/dispute handling before declaring the payment flow production-safe**.

### Recommended state model
- Invoice states:
  - `DRAFT`
  - `SENT`
  - `PARTIALLY_PAID`
  - `PAID`
  - `OVERDUE`
  - `VOID`
  - `REFUNDED` (optional but recommended)
- Payment states:
  - `PENDING`
  - `PROCESSING`
  - `SUCCEEDED`
  - `FAILED`
  - `REFUNDED`
  - `DISPUTED`

### Affected files/migrations
- Schema layer:
  - `/app/supabase/migrations/00100_v3_schema_baseline.sql`
  - replace/supersede `/app/supabase/migrations/00014_payments.sql`
- Stripe runtime:
  - `/app/lib/stripe.ts`
  - `/app/lib/actions/stripe.ts`
  - `/app/app/api/webhooks/stripe/route.ts`
  - `/app/lib/actions/invoices.ts`
  - `/app/lib/actions/financial-comms.ts`
  - `/app/lib/actions/payouts.ts`

### Mandatory Stripe fixes
- Verify `Stripe-Signature` in webhook route.
- Persist raw webhook events and dedupe by Stripe event id.
- Store invoice id, org id, job id in Stripe metadata and validate it on webhook receipt.
- Mark invoice paid only from webhook-confirmed success.
- Post recognised revenue only from webhook-confirmed success.
- On refund webhook, create negative recognised revenue posting and update payment status.
- On dispute webhook, mark dispute state and freeze release actions.

### Validation steps
- Test mode payment succeeds → one payment record, one recognised revenue posting, invoice becomes paid.
- Duplicate webhook event does not double-post anything.
- Failed payment does not mark invoice paid.
- Refund webhook creates reversal and updates invoice/payment state.
- Dispute webhook blocks payout/release action.

---

## P0.5 — Replace placeholder core modules that block critical flows

### Objective
Remove the “looks complete but is not wired” layer from the most critical routes.

### Why this is fifth
Even after schema/security/money fixes, core operators still cannot complete the main workflows if the screens remain placeholders.

### Exact fix order
1. **Replace placeholder routes that block quote/job/invoice/payment workflows**.
2. **Disable placeholder API routes until implemented**.
3. **Wire each screen only to the canonical actions created in P0.2–P0.4**.
4. **Remove mocked metrics from the dashboard surfaces that imply live truth**.

### Critical placeholder modules to fix first

#### A. Quote creation
- File:
  - `/app/app/quotes/create/page.tsx`
- Fix:
  - Replace placeholder with real builder wired to `saveQuoteDraft()` or its canonical replacement.
- Validate:
  - Create a draft quote with client, sections, totals, and line items.

#### B. Job detail
- File:
  - `/app/app/jobs/[id]/page.tsx`
- Fix:
  - Replace JSON dump with a real job workspace using job lines, materials, timeline, visits, invoice links, and communications.
- Validate:
  - Open a job created from a quote and see the expected downstream data.

#### C. Finance page
- File:
  - `/app/app/finance/page.tsx`
- Fix:
  - Replace raw invoice dump with real finance dashboard components tied to corrected ledger logic.
- Validate:
  - Totals reconcile with ledger and recent payments/expenses.

#### D. Assistant page
- File:
  - `/app/app/assistant/page.tsx`
- Fix:
  - Replace placeholder with inbox/tasks view using `getAssistantData()` and live actions.
- Validate:
  - Tasks/messages load and status changes persist.

#### E. Calendar page
- File:
  - `/app/app/calendar/page.tsx`
- Fix:
  - Replace placeholder page with existing scheduling components once the scheduling state model is corrected.
- Validate:
  - Visits render, create/update flows work, and status changes match the allowed state machine.

#### F. Placeholder API routes
- Files:
  - `/app/app/api/jobs/route.ts`
  - `/app/app/api/quotes/route.ts`
  - `/app/app/api/integrations/accounting/sync/route.ts`
- Fix:
  - Either implement or remove/return 501 clearly until supported.
- Validate:
  - No route claims production behaviour while returning placeholders.

### Validation steps
- Manual smoke path:
  - create quote → send → accept → convert to job → create invoice → create payment link → receive payment via webhook → dashboard reflects cash.
- Frontend screenshot/interaction testing on the critical pages.

---

## Recommended P0 execution order across the whole program

1. Schema baseline rebuild
2. Security isolation lockdown
3. Canonical ledger implementation
4. Stripe/payment state machine
5. Critical placeholder replacement

---

## P1 — Important but not first-wave critical

### P1.1 Scheduling depth
- Add true booking lifecycle: `HELD / CONFIRMED / EXPIRED / REJECTED`
- Add resource conflict detection and locks
- Add payment gating and preferred engineer logic
- Affected areas:
  - `/app/supabase/migrations/00020_calendar.sql`
  - `/app/supabase/migrations/00028_job_scheduling.sql`
  - `/app/lib/actions/calendar.ts`
  - `/app/components/calendar/*`

### P1.2 OCR / expense ingestion unification
- Merge `finance.ts` and `receipts.ts` into one canonical expense flow
- Add receipt entity + storage metadata + confirmation state
- Affected areas:
  - `/app/lib/actions/finance.ts`
  - `/app/lib/actions/receipts.ts`
  - new expense/receipt schema in baseline migration

### P1.3 Quote engine depth
- Add real structured materials/labour/subcontractor itemisation
- Add proposal PDF generation
- Add previous-job and supplier-default scope loading
- Affected areas:
  - `/app/lib/actions/save-quote.ts`
  - `/app/lib/actions/quotes.ts`
  - `/app/app/quotes/*`
  - `/app/components/quote-section-card.tsx`

### P1.4 Refund / dispute / retention completion
- Add full refund system
- Add dispute freeze rules
- Add retention release state handling
- Affected areas:
  - Stripe webhook/payment modules
  - ledger posting service
  - payout/release actions

### P1.5 Audit trail and event logging
- Add immutable event table(s) for state transitions, webhooks, and AI-generated actions
- Make operational changes traceable

---

## P2 — Expansion after the core system is trustworthy

### P2.1 Goal Engine
- Monthly targets
- Required per job
- Margin adjustment suggestions
- Forward loss projection

### P2.2 Assistant-Life maturity
- Real operational/strategic split
- AI secretary
- Safe deterministic action boundaries

### P2.3 Start My Day / Command Centre maturity
- Weather
- alerts
- financial state
- live operational summary

### P2.4 Notifications engine
- financial alerts
- job alerts
- recurring reminders
- delivery preferences

### P2.5 Recurring engine maturity
- asset registry
- service intervals
- automated reminders
- job/booking generation
- better Xero backfill lineage

### P2.6 Capture layer maturity
- offline mode
- durable mobile capture
- transcription pipeline

### P2.7 Test depth and operational hardening
- integration test suite for money flows
- webhook replay/idempotency tests
- tenancy/security regression suite
- migration smoke tests in CI

---

## Bottom-Line Recommendation

If this becomes implementation work, do **not** start by polishing UI or filling random placeholders.

The correct order is:

1. **Schema truth**
2. **Security truth**
3. **Money truth**
4. **Payment truth**
5. **Critical operator screens**

Everything else should wait until those five are stable.