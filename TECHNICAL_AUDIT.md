# TradeLife v2 — Technical State & Guardrail Audit
### Prepared for Tier-1 Senior Architect Review
### Audit Date: January 2026

---

## 1. Implemented Schema

### 1.1 Migrations Applied

| # | Migration File | Purpose |
|---|----------------|---------|
| 1 | `00001_foundation_schema.sql` | Core 13-table schema, all enums, RLS policies, immutability triggers, money pot auto-seed |
| 2 | `00002_auth_auto_seed.sql` | `handle_new_user()` trigger on `auth.users` — auto-creates Organisation + Profile on signup |
| 3 | `00003_quote_templates.sql` | `quote_templates` table with full RLS + updated_at trigger |

### 1.2 Complete Table Inventory (14 tables)

#### `organisations` — The Tenant Root
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, `gen_random_uuid()` | Every other table FK's back here |
| `name` | TEXT | NOT NULL | Auto-set to `"{user_name}'s Org"` on signup |
| `stripe_customer_id` | TEXT | nullable | **PLACEHOLDER** — deferred Stripe integration |
| `xero_tenant_id` | TEXT | nullable | **PLACEHOLDER** — deferred Xero integration |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default `now()` | Auto-updated via trigger |

#### `profiles` — User-to-Org Link
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, FK → `auth.users(id)` ON DELETE CASCADE | 1:1 with Supabase Auth user |
| `org_id` | UUID | NOT NULL, FK → `organisations(id)` ON DELETE CASCADE | **Multi-tenancy anchor** |
| `full_name` | TEXT | nullable | |
| `email` | TEXT | nullable | Copied from auth on signup |
| `role` | TEXT | NOT NULL, default `'owner'` | Free-text currently; not enum-enforced |
| `created_at` | TIMESTAMPTZ | | |
| `updated_at` | TIMESTAMPTZ | | Auto-updated via trigger |

**Relationship**: `profiles.id` → `auth.users.id` (1:1), `profiles.org_id` → `organisations.id` (many:1)

#### `clients` — Customer Records (Org-Scoped)
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `org_id` | UUID | FK → organisations, NOT NULL |
| `name` | TEXT | NOT NULL |
| `email`, `phone`, `address` | TEXT | nullable |
| `stripe_customer_id` | TEXT | **PLACEHOLDER** |
| `xero_contact_id` | TEXT | **PLACEHOLDER** |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

#### `quotes` — The Sales Instrument
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `org_id` | UUID | FK → organisations, NOT NULL |
| `client_id` | UUID | FK → clients, ON DELETE SET NULL |
| `status` | `quote_status` enum | `DRAFT → SENT → ACCEPTED \| DECLINED` |
| `share_token` | TEXT | UNIQUE, auto-generated 64-char hex |
| `vat_rate` | INTEGER | Default `2000` (20.00% as basis points x100) |
| `quote_amount_net` | BIGINT | Pence — sum of section revenues |
| `quote_amount_gross` | BIGINT | Pence — net + VAT |
| `quote_total_cost` | BIGINT | Pence — sum of section costs |
| `quote_profit` | BIGINT | Pence — net minus cost |
| `quote_margin_percentage` | INTEGER | x100 (2500 = 25.00%) |
| `reference`, `notes` | TEXT | nullable |
| `valid_until` | DATE | nullable |
| `job_id` | UUID | FK → jobs(id), ON DELETE SET NULL — populated when job created |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

**Status Machine**: `DRAFT` → `SENT` → `ACCEPTED` | `DECLINED`
**Immutability**: Once `ACCEPTED`, trigger blocks modification of financial fields.

#### `quote_sections` — The Pricing Engine
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `quote_id` | UUID | FK → quotes, ON DELETE CASCADE |
| `org_id` | UUID | FK → organisations, NOT NULL |
| `title` | TEXT | NOT NULL |
| `trade_type` | TEXT | e.g., Electrical, Plumbing, General |
| `sort_order` | INTEGER | |
| `is_subcontract` | BOOLEAN | Switches labour model |
| `labour_days` | INTEGER | Used when `is_subcontract = false` |
| `labour_day_rate` | BIGINT | Pence per day |
| `subcontract_cost` | BIGINT | Pence, used when `is_subcontract = true` |
| `material_cost_total` | BIGINT | Pence |
| `margin_percentage` | INTEGER | x100 |
| `labour_cost` | BIGINT | Calculated: days x rate OR subcontract |
| `section_cost_total` | BIGINT | Calculated: labour + materials |
| `section_revenue_total` | BIGINT | Calculated: cost + margin |
| `section_profit` | BIGINT | Calculated: revenue - cost |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

#### `quote_line_items` — Itemised Breakdown (Flows Downstream)
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `quote_id` | UUID | FK → quotes, ON DELETE CASCADE |
| `quote_section_id` | UUID | FK → quote_sections, ON DELETE CASCADE |
| `org_id` | UUID | FK → organisations, NOT NULL |
| `description` | TEXT | NOT NULL |
| `quantity` | INTEGER | Default 1 |
| `unit` | TEXT | Default 'each' |
| `unit_price_net` | BIGINT | Pence per unit |
| `line_total_net` | BIGINT | Pence, = qty x unit_price |
| `sort_order` | INTEGER | |

#### `jobs` — The Operational Unit
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `org_id` | UUID | FK → organisations, NOT NULL |
| `source_quote_id` | UUID | FK → quotes, ON DELETE **RESTRICT** — lineage enforced |
| `client_id` | UUID | FK → clients, ON DELETE SET NULL |
| `title` | TEXT | NOT NULL |
| `address` | TEXT | nullable |
| `status` | `job_status` enum | 7 states: `ENQUIRY → BOOKED → ON_SITE → COMPLETED → SNAGGING → SIGNED_OFF \| CANCELLED` |
| `target_start_date`, `target_end_date` | DATE | nullable |
| `google_calendar_event_id` | TEXT | **PLACEHOLDER** |

#### `job_line_items` — Inherited from Quote + Variation Tracking
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `job_id` | UUID | FK → jobs, ON DELETE CASCADE |
| `org_id` | UUID | FK → organisations, NOT NULL |
| `source_quote_line_id` | UUID | FK → quote_line_items, ON DELETE SET NULL |
| `description`, `quantity`, `unit`, `unit_price_net`, `line_total_net` | | Copied from quote line item |
| `status` | `job_line_item_status` | `PENDING → IN_PROGRESS → COMPLETED` |
| `is_variation` | BOOLEAN | Default false |
| `variation_reason` | TEXT | nullable |
| `source_variation_id` | UUID | FK → variations, ON DELETE SET NULL |

#### `variations` — "Can You Just" Change Orders
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `job_id` | UUID | FK → jobs, ON DELETE CASCADE |
| `org_id` | UUID | FK → organisations, NOT NULL |
| `description` | TEXT | NOT NULL |
| `reason` | TEXT | nullable |
| `quantity`, `unit`, `unit_price_net`, `line_total_net` | | Standard pricing fields (BIGINT pence) |
| `status` | `variation_status` | `PROPOSED → APPROVED \| REJECTED` |
| `approved_at` | TIMESTAMPTZ | nullable |
| `job_line_item_id` | UUID | FK → job_line_items — populated on approval |

#### `invoices` — The Financial Demand
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `org_id` | UUID | FK → organisations, NOT NULL |
| `source_job_id` | UUID | FK → jobs, ON DELETE **RESTRICT** — lineage enforced |
| `invoice_number` | TEXT | NOT NULL, e.g. `INV-0001` |
| `invoice_type` | `invoice_type` | `DEPOSIT \| INTERIM \| FINAL` |
| `amount_net`, `amount_gross` | BIGINT | Pence |
| `vat_rate` | INTEGER | x100 basis points |
| `status` | `invoice_status` | `DRAFT → SENT → PAID \| OVERDUE \| VOID` |
| `issue_date`, `due_date`, `paid_at` | DATE/TIMESTAMPTZ | |
| `stripe_payment_link` | TEXT | **PLACEHOLDER** |
| `stripe_payment_intent_id` | TEXT | **PLACEHOLDER** |
| `xero_invoice_id` | TEXT | **PLACEHOLDER** |

#### `invoice_line_items` — Immutable Copies
| Column | Type | Notes |
|--------|------|-------|
| `source_job_line_id` | UUID | FK → job_line_items, ON DELETE **RESTRICT** |
| All pricing fields | | Copied from job line items. Never modified post-creation. |

#### `money_pots` — Profit First Engine
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `org_id` | UUID | FK → organisations, NOT NULL |
| `pot_type` | `money_pot_type` | `OPERATING \| TAX \| PROFIT \| RESERVE` |
| `balance` | BIGINT | Pence |
| `allocation_percentage` | INTEGER | x100 |
| `income_floor` | BIGINT | Pence |
| **UNIQUE**(org_id, pot_type) | | One pot per type per org |

**Auto-seeded on org creation**: OPERATING 50%, TAX 20%, PROFIT 15%, RESERVE 15%

#### `cashflow_entries` — Financial Audit Trail
| Column | Type | Notes |
|--------|------|-------|
| `org_id` | UUID | FK → organisations |
| `pot_type` | `money_pot_type` | |
| `amount` | BIGINT | Pence (positive = in, negative = out) |
| `source_invoice_id` | UUID | FK → invoices, nullable |

#### `quote_templates` — Reusable Section Templates
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `org_id` | UUID | FK → organisations, NOT NULL |
| All section input fields | | Mirrors `quote_sections` inputs (title, trade_type, labour config, materials, margin) |

### 1.3 Enum Definitions

| Enum | Values |
|------|--------|
| `quote_status` | `DRAFT`, `SENT`, `ACCEPTED`, `DECLINED` |
| `job_status` | `ENQUIRY`, `BOOKED`, `ON_SITE`, `COMPLETED`, `SNAGGING`, `SIGNED_OFF`, `CANCELLED` |
| `job_line_item_status` | `PENDING`, `IN_PROGRESS`, `COMPLETED` |
| `variation_status` | `PROPOSED`, `APPROVED`, `REJECTED` |
| `invoice_type` | `DEPOSIT`, `INTERIM`, `FINAL` |
| `invoice_status` | `DRAFT`, `SENT`, `PAID`, `OVERDUE`, `VOID` |
| `money_pot_type` | `OPERATING`, `TAX`, `PROFIT`, `RESERVE` |

### 1.4 Relationship Map

```
auth.users (Supabase)
    └── profiles (1:1)
            └── organisations (many:1)
                    ├── clients
                    ├── quotes
                    │       ├── quote_sections
                    │       └── quote_line_items
                    ├── jobs (source_quote_id → quotes)
                    │       ├── job_line_items (source_quote_line_id → quote_line_items)
                    │       └── variations → approved creates job_line_item
                    ├── invoices (source_job_id → jobs)
                    │       └── invoice_line_items (source_job_line_id → job_line_items)
                    ├── money_pots (auto-seeded, 4 per org)
                    ├── cashflow_entries
                    └── quote_templates
```

---

## 2. Active Guardrails

### 2.1 Multi-Tenancy Isolation (`org_id`)

| Rule | Implementation | Status |
|------|---------------|--------|
| Every data table has `org_id` | All 12 data tables (excluding `organisations` itself) carry `org_id NOT NULL FK` | ENFORCED |
| RLS enabled on ALL tables | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on all 14 tables (including `organisations` + `profiles`) | ENFORCED |
| RLS policy pattern | `org_id = get_user_org_id()` for SELECT/INSERT/UPDATE/DELETE on all data tables | ENFORCED |
| `get_user_org_id()` function | `SELECT org_id FROM profiles WHERE id = auth.uid()` — `SECURITY DEFINER`, `STABLE` | ENFORCED |
| Application-level org_id | Server Actions (`save-quote.ts`, `dashboard.ts`, `templates.ts`) all lookup `profile.org_id` before querying | ENFORCED |
| Client-side queries also filter | `quotes/page.tsx` fetches `profile.org_id` then filters `.eq('org_id', profile.org_id)` | ENFORCED |
| `org_id` indexes | Every table has `CREATE INDEX idx_{table}_org_id ON {table}(org_id)` | ENFORCED |

### 2.2 Role Enforcement

| Rule | Status |
|------|--------|
| `profiles.role` defaults to `'owner'` | ENFORCED at schema + application level |
| Role column is `TEXT`, **not an enum** | **OBSERVATION**: No role-based access control is implemented beyond the column existing. All authenticated users within an org have identical permissions. |
| Profile update RLS | Users can only update their OWN profile (`id = auth.uid()`) | ENFORCED |
| Org update RLS | Users can only update their OWN org (`id = get_user_org_id()`) | ENFORCED |

### 2.3 Data Integrity Guardrails

| Guardrail | Mechanism | Status |
|-----------|-----------|--------|
| Quote immutability (ACCEPTED) | Postgres trigger `enforce_quote_immutability()` blocks financial field changes on ACCEPTED quotes | ENFORCED |
| Quote section immutability | Trigger on `quote_sections` blocks UPDATE/DELETE if parent quote is ACCEPTED | ENFORCED |
| Quote line item immutability | Trigger on `quote_line_items` blocks UPDATE/DELETE if parent quote is ACCEPTED | ENFORCED |
| Job must come from quote | `jobs.source_quote_id` is NOT NULL, FK with ON DELETE **RESTRICT** | ENFORCED |
| Invoice must come from job | `invoices.source_job_id` is NOT NULL, FK with ON DELETE **RESTRICT** | ENFORCED |
| Invoice line items are immutable copies | `source_job_line_id` is NOT NULL, ON DELETE **RESTRICT** | ENFORCED |
| No orphaned records | CASCADE deletes on quotes→sections, quotes→line_items, jobs→job_line_items, jobs→variations | ENFORCED |
| `updated_at` auto-update | Trigger `update_updated_at()` on all 12 mutable tables | ENFORCED |
| Money pots auto-seed | Trigger `seed_default_money_pots()` fires on org creation | ENFORCED |

### 2.4 Financial Guardrails

| Rule | Status |
|------|--------|
| All currency as BIGINT (pence) | ENFORCED across all 14 tables. Zero DECIMAL/FLOAT/NUMERIC. |
| All percentages as INTEGER x100 | ENFORCED. `2500 = 25.00%`, `2000 = 20.00% VAT` |
| Division only at display layer | ENFORCED. Only `penceToPounds()`, `formatCurrency()`, `formatPercentage()` do division |
| Server-side recalculation | ENFORCED. `saveQuoteDraft()` recalculates all math server-side before writing to DB |
| Divide-by-zero guard | ENFORCED. `quote_margin_percentage` returns 0 when `quote_total_cost` is 0 |

---

## 3. Auth Flow Logic

### 3.1 Signup Flow

```
[User] → /signup page (client component)
    ↓
    supabase.auth.signUp({ email, password, data: { full_name } })
    emailRedirectTo: getAuthCallbackUrl()  // → https://tradelife.app/auth/callback
    ↓
    [DB Trigger: handle_new_user()]
        1. Creates Organisation: "{full_name}'s Org"
        2. Creates Profile: { id: user.id, org_id, full_name, email, role: 'owner' }
        3. seed_default_money_pots trigger fires → 4 money pots created
    ↓
    [Safety Net: ensureOrgAndProfile() server action]
        Called immediately after signUp() returns
        Checks if profile exists → if not, manually creates org + profile
        This is a redundancy layer in case the DB trigger hasn't run yet
    ↓
    Shows "Check your email" confirmation screen
```

### 3.2 Login Flow

```
[User] → /login page (client component)
    ↓
    supabase.auth.signInWithPassword({ email, password })
    ↓
    Success → router.push('/quotes/create') + router.refresh()
    Error → Display error message in-page
```

### 3.3 Email Confirmation Callback

```
[User clicks email link] → /auth/callback?code=XXX&next=/quotes/create
    ↓
    GET route handler:
        supabase.auth.exchangeCodeForSession(code)
    ↓
    Success → Redirect to `next` param (default: /quotes/create)
    Error → Redirect to /login
```

### 3.4 Middleware (Route Protection)

```
File: frontend/middleware.ts
Runs on: ALL routes except static assets (_next/static, images, favicon)

Logic:
    1. Create Supabase server client (reads auth cookies)
    2. Call supabase.auth.getUser() — refreshes session tokens via cookies
    3. Define PUBLIC routes:
         /              (landing — currently redirects to /quotes)
         /login
         /signup
         /view/*        (public quote share links)
         /auth/*        (callback)
         /api/*         (API routes)
    4. IF no user AND route is NOT public → Redirect to /login
    5. IF user AND route is /login or /signup → Redirect to /quotes
    6. Otherwise → Pass through (with refreshed cookies)
```

### 3.5 Redirect Logic Summary

| Scenario | Destination |
|----------|-------------|
| Unauthenticated → protected route | `/login` |
| Authenticated → `/login` or `/signup` | `/quotes` |
| After login success | `/quotes/create` |
| After email confirmation | `/quotes/create` (via `next` param) |
| Root `/` | `/quotes` (server-side redirect in `page.tsx`) |
| Signout | `/login` (via `router.push` + `router.refresh`) |

### 3.6 Supabase Client Architecture

| Client | File | Auth Level | Use Case |
|--------|------|------------|----------|
| Browser Client | `lib/supabase/client.ts` | Anon key (user session via cookies) | Client components — fetching user data, auth actions |
| Server Client | `lib/supabase/server.ts` → `createServerSupabaseClient()` | Anon key (server-side cookies) | Server Actions — respects RLS |
| Service Role Client | `lib/supabase/server.ts` → `createServiceRoleClient()` | Service Role key | **Bypasses RLS** — used for public quote view, auth auto-seed, quote accept API |

---

## 4. State of "Can You Just" (Deterministic Pricing Rules & Constants)

### 4.1 Hardcoded Constants

| Constant | Value | Location | Notes |
|----------|-------|----------|-------|
| Default VAT Rate | `2000` (20.00%) | `quotes/create/page.tsx` line 12, DB default on `quotes.vat_rate` | UK standard rate |
| Default Margin | `2000` (20.00%) | `hooks/use-quote-calculator.ts` line 107 | Default for new sections |
| Money Pot: Operating | `5000` (50.00%) | `00001_foundation_schema.sql` line 538 | Seeded on org creation |
| Money Pot: Tax | `2000` (20.00%) | `00001_foundation_schema.sql` line 539 | Seeded on org creation |
| Money Pot: Profit | `1500` (15.00%) | `00001_foundation_schema.sql` line 540 | Seeded on org creation |
| Money Pot: Reserve | `1500` (15.00%) | `00001_foundation_schema.sql` line 541 | Seeded on org creation |

### 4.2 Pricing Formulas (from `lib/actions/quotes.ts`)

```
SECTION LEVEL:
  Direct Labour Cost    = labour_days × labour_day_rate        (integer × integer)
  Subcontract Cost      = subcontract_cost                     (pass-through)
  Section Cost          = Labour Cost + Material Cost
  Margin Amount         = Math.round(Section Cost × margin_percentage / 10000)
  Section Revenue       = Section Cost + Margin Amount
  Section Profit        = Section Revenue - Section Cost

QUOTE LEVEL:
  Quote Net             = SUM(all Section Revenues)
  Quote Cost            = SUM(all Section Costs)
  Quote Profit          = Quote Net - Quote Cost
  Quote Margin%         = Math.round((Profit × 10000) / Cost)  [guarded: 0 if cost = 0]
  Quote Gross           = Math.round(Net × (10000 + VAT Rate) / 10000)

LINE ITEMS:
  Line Total            = quantity × unit_price_net

VARIATIONS:
  Variation Total       = quantity × unit_price_net
```

### 4.3 Variation ("Can You Just") Schema Rules

| Rule | Enforcement |
|------|-------------|
| Variations belong to a Job | `variations.job_id` NOT NULL, FK → jobs |
| Status gate: `PROPOSED → APPROVED \| REJECTED` | `variation_status` enum |
| Approval creates job line item | `variations.job_line_item_id` FK populated on approval |
| Job line item tracks origin | `job_line_items.is_variation = true`, `source_variation_id` FK |
| Pricing: BIGINT pence | `unit_price_net`, `line_total_net` consistent with all other tables |

### 4.4 Test Coverage for Pricing Engine

File: `lib/actions/quotes.test.ts` — **7 test suites, 28+ assertions**

| Test | What It Validates |
|------|-------------------|
| Direct Labour Section | 5 days × £250/day + £500 materials + 25% margin |
| Subcontract Section | £3,000 subcontract + £200 materials + 15% margin |
| Quote Totals (combined) | Net/Cost/Profit/Margin%/Gross aggregation from 2 sections |
| Full Recalculation | End-to-end `recalculateQuote()` pipeline |
| Line Item Calculation | `quantity × unit_price_net` |
| Edge Cases | Zero margin, zero cost, zero VAT, divide-by-zero guard |
| Display Helpers | `penceToPounds`, `formatPercentage`, `poundsToPence`, `percentageToStored` |

---

## 5. Unfinished Dependencies & Ghost Components

### 5.1 Schema Tables with No Application Wiring

| Table | Schema Status | App Code Status | Verdict |
|-------|--------------|-----------------|---------|
| `clients` | Fully defined, RLS active | **No CRUD UI**. Referenced by `quotes.client_id` but no client creation/selection flow exists. `client_id` is always NULL on quote save. | GHOST — Schema only |
| `jobs` | Fully defined, RLS active | **No UI or Server Actions**. `/jobs` page shows "Coming soon" placeholder. No `Quote → Job` conversion logic. | GHOST — Schema only |
| `job_line_items` | Fully defined | **No code references** beyond TypeScript type definition. | GHOST — Schema only |
| `variations` | Fully defined | **No code references** beyond TypeScript type definition. | GHOST — Schema only |
| `invoices` | Fully defined, RLS active | **No UI or Server Actions**. No route exists. | GHOST — Schema only |
| `invoice_line_items` | Fully defined | **No code references** beyond TypeScript type definition. | GHOST — Schema only |
| `money_pots` | Fully defined, auto-seeded on org creation | **No UI**. Pots are seeded but never read or displayed. Settings page shows "Coming soon". | GHOST — Schema + auto-seed active |
| `cashflow_entries` | Fully defined | **No code references** beyond TypeScript type definition. | GHOST — Schema only |

### 5.2 Placeholder Pages (Skeleton UI with No Functionality)

| Page | Route | Status |
|------|-------|--------|
| Jobs | `/jobs` | Renders `AppShell` + "Coming soon" text. No data fetching. |
| Settings | `/settings` | Renders `AppShell` + "Coming soon" text. Intended for org settings, integrations, Profit First pots. |

### 5.3 Integration Placeholder Columns (Deferred — No Code)

| Column | Table | Integration |
|--------|-------|-------------|
| `stripe_customer_id` | `organisations`, `clients` | Stripe (billing) |
| `xero_tenant_id` | `organisations` | Xero (accounting) |
| `xero_contact_id` | `clients` | Xero (contacts) |
| `stripe_payment_link` | `invoices` | Stripe (payment links) |
| `stripe_payment_intent_id` | `invoices` | Stripe (payment tracking) |
| `xero_invoice_id` | `invoices` | Xero (invoice sync) |
| `google_calendar_event_id` | `jobs` | Google Calendar (scheduling) |

### 5.4 Partially Wired Features

| Feature | What Exists | What's Missing |
|---------|-------------|----------------|
| Quote → SENT transition | Status enum allows it, share_token auto-generated | **No "Send Quote" button or status update action.** User creates DRAFT but cannot advance to SENT from UI. |
| Public quote acceptance | Full end-to-end: `/view/[share_token]` page + `/api/quotes/accept` API route + `acceptQuote()` server action | Works, but unreachable without a way to SEND quotes first |
| Quote editing | None | Quotes are write-once. No edit/update/delete from dashboard. Clicking a quote row links to `/quotes/{id}` but **no detail page exists** for that route. |
| Template save | `saveTemplate()` + `getTemplates()` + `deleteTemplate()` server actions exist | **No "Save as Template" button in the quote section UI.** Import template works; creating templates does not. |
| Dashboard server action | `getQuotes()` in `dashboard.ts` | **Not used anywhere.** The `/quotes` page fetches directly via browser Supabase client instead. |

### 5.5 Dead Route

| Route | Issue |
|-------|-------|
| `/quotes/[id]` | Quote dashboard rows link to `/quotes/${q.id}` (line 254 of `quotes/page.tsx`) but **no `quotes/[id]/page.tsx` exists**. This will 404. |

---

## 6. Summary Assessment

### What's Solid
- **Schema architecture** is production-grade: proper BIGINT money, comprehensive RLS, immutability triggers, lineage enforcement
- **Pricing engine** is deterministic, fully tested (28+ assertions), and runs server-side with client mirror for optimistic UI
- **Multi-tenancy** is airtight: RLS + application-level `org_id` filtering on every query
- **Auth flow** is clean with proper session management, middleware protection, and dual-layer org/profile seeding

### What Needs Attention
- **8 of 14 tables** are schema-only with zero application code (the entire Job → Invoice pipeline)
- **Role-based access** is a placeholder (`TEXT` column, no enforcement beyond 'owner')
- **Quote lifecycle is incomplete**: Can create DRAFT, cannot SEND, cannot EDIT, cannot DELETE
- **Template save UI is missing** despite server actions being ready
- **Dead route** at `/quotes/[id]` will 404 for users clicking quote rows
- **`dashboard.ts` server action** is orphaned — duplicate of client-side fetch

---

*Report generated from full codebase audit of `/app/frontend/` and `/app/supabase/migrations/`*
*Codebase ref: tradelife-org/Tradelife-v2*
