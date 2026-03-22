# TradeLife v3 — Locked System Contracts

## Contract Status
- These contracts are the **authoritative target definitions** for the TradeLife v3 rebuild.
- They override conflicting runtime behaviour in the current codebase.
- Inline conflict notes identify where the current implementation disagrees.

---

## 1. Identity + Org Isolation Contract

### 1.1 Organisation ownership
1. Every authenticated user has exactly one `profiles` row.
2. Every `profiles` row has exactly one non-null `org_id`.
3. `profiles.org_id` is the **only authoritative tenant context key**.
4. `active_org_id` is not part of the authoritative v3 contract. If retained temporarily, it must equal `org_id` at all times.

### 1.2 Authorisation source
1. For authenticated requests, org scope must be derived only from:
   - `auth.uid()` → `profiles.id` → `profiles.org_id`
2. No authenticated route, action, or query may accept `org_id` as an authorisation input.
3. `org_id` may be accepted as data only in trusted backend-only workflows after independent authorisation has already succeeded.

### 1.3 Org-scoped tables
Every business table that contains organisation data must include:
- `org_id UUID NOT NULL REFERENCES organisations(id)`

This applies to all quote, job, invoice, payment, ledger, expense, scheduling, portal, and communication tables.

### 1.4 Public access model
1. No org-owned table may have unrestricted public `SELECT` access.
2. Public access is allowed only through server-side validated tokens.
3. Two public token types are permitted:
   - `quote_share_token`
   - `portal_invite_token`
4. Public token validation must happen server-side before any data fetch.
5. Public token flows may return only whitelisted projections, never raw table access.

### 1.5 Service-role usage
Service-role access is permitted only for:
- verified webhook handlers
- background jobs / cron workers
- server-side token validation flows
- controlled admin repair scripts

Service-role access is forbidden in:
- user-facing endpoints that trust caller-provided `org_id`
- client-side code
- any route that can return another tenant's data through input manipulation

### 1.6 Required enforcement rules
1. RLS must be enabled on every org-owned table.
2. Authenticated policies must always compare row `org_id` to session-derived tenant context.
3. Public token access must never be implemented as a general table policy like `USING (true)`.
4. Unauthenticated identity endpoints must return `user: null`, not fallback org data.

### 1.7 Conflicts with current code
- `quotes` public policy currently exposes all quotes through `share_token IS NOT NULL`.
- `portal_invites` currently has a globally open public verify policy.
- `/app/app/api/auth/me/route.ts` currently falls back to the first profile/org without a session.
- `/app/app/api/transactions/route.ts` and `/app/app/api/user-rules/route.ts` currently trust caller-supplied `org_id` while using service-role access.

---

## 2. Ledger Contract

## 2.1 Canonical ledger table
The authoritative financial ledger table is:

### `ledger_entries`

Required columns:
- `id UUID PRIMARY KEY`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `quote_id UUID NULL REFERENCES quotes(id)`
- `job_id UUID NULL REFERENCES jobs(id)`
- `invoice_id UUID NULL REFERENCES invoices(id)`
- `payment_id UUID NULL REFERENCES payment_records(id)`
- `expense_id UUID NULL REFERENCES expenses(id)`
- `refund_id UUID NULL REFERENCES refunds(id)`
- `event_type TEXT NOT NULL`
- `category TEXT NOT NULL`
- `amount_pence BIGINT NOT NULL`
- `currency_code TEXT NOT NULL DEFAULT 'GBP'`
- `effective_at TIMESTAMPTZ NOT NULL`
- `idempotency_key TEXT NOT NULL UNIQUE`
- `description TEXT NOT NULL`
- `metadata JSONB NOT NULL DEFAULT '{}'::jsonb`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

### 2.2 Ledger invariants
1. `ledger_entries` is append-only.
2. Application users may not update or delete ledger rows.
3. Every ledger write must include a unique `idempotency_key`.
4. Every ledger row must belong to exactly one organisation.
5. `currency_code` is always `GBP` in v3.
6. `amount_pence` is a **signed integer**.

### 2.3 Signed amount rule
- Positive `amount_pence` increases financial position in that category.
- Negative `amount_pence` decreases financial position in that category.

There is no separate debit/credit column in the authoritative v3 contract.

### 2.4 Allowed ledger categories
The only allowed ledger categories are:
1. `COMMITTED_REVENUE`
2. `RECOGNISED_REVENUE`
3. `EXPENSE`
4. `VAT`

No other category is allowed in the canonical ledger.

### 2.5 Category meanings
#### `COMMITTED_REVENUE`
- Represents accepted quote value not yet recognised as received cash.
- Amount is always stored **net of VAT**.

#### `RECOGNISED_REVENUE`
- Represents cash-backed earned revenue from successful payment receipt.
- Amount is always stored **net of VAT**.

#### `EXPENSE`
- Represents confirmed business cost.
- Amount is always stored **net of VAT**.
- Expense rows are negative.

#### `VAT`
- Represents VAT liability/reclaim effect.
- Positive VAT = output VAT collected from customer payments.
- Negative VAT = input VAT reclaim from confirmed business expenses.

### 2.6 Allowed event types
The only allowed P0 event types are:
1. `QUOTE_ACCEPTED`
2. `PAYMENT_SUCCEEDED`
3. `EXPENSE_CONFIRMED`
4. `PAYMENT_REFUNDED`

No other event type may write to the canonical ledger in P0.

### 2.7 Ledger posting rules
#### Event: `QUOTE_ACCEPTED`
- One ledger row only:
  - category: `COMMITTED_REVENUE`
  - amount: `+quote_amount_net_pence`

#### Event: `PAYMENT_SUCCEEDED`
- Two ledger rows only:
  - category: `RECOGNISED_REVENUE`
  - amount: `+recognised_net_pence`
- and
  - category: `VAT`
  - amount: `+recognised_vat_pence`

#### Event: `EXPENSE_CONFIRMED`
- One or two ledger rows:
  - category: `EXPENSE`
  - amount: `-expense_net_pence`
- and, if reclaimable VAT exists:
  - category: `VAT`
  - amount: `-expense_vat_pence`

#### Event: `PAYMENT_REFUNDED`
- Two ledger rows only:
  - category: `RECOGNISED_REVENUE`
  - amount: `-refunded_net_pence`
- and
  - category: `VAT`
  - amount: `-refunded_vat_pence`

### 2.8 Forbidden ledger behaviour
The ledger must never:
- post revenue at invoice creation time
- post gross revenue into `RECOGNISED_REVENUE`
- mix `REVENUE`, `RECOGNIZED_REVENUE`, and `RECOGNISED_REVENUE`
- use category variants such as `PAYOUT`, `RETENTION_HELD`, `RETENTION_RELEASED`, `VAT_RECLAIM` inside the canonical ledger

Those non-core treasury/payment-hold concerns belong outside the canonical revenue/expense ledger.

### 2.9 Conflicts with current code
- Current code uses `job_wallet_ledger` instead of one canonical ledger table.
- Current code mixes `wallet_id` and `job_id` posting models.
- Current code mixes `REVENUE`, `RECOGNIZED_REVENUE`, and `RECOGNISED_REVENUE`.
- Current code posts revenue on invoice creation.
- Current code uses extra ledger categories (`PAYOUT`, `RETENTION_HELD`, `RETENTION_RELEASED`, `VAT_RECLAIM`) that conflict with the authoritative core ledger contract.

---

## 3. Payment + Invoice State Machine Contract

## 3.1 Invoice state machine
Allowed invoice states:
1. `DRAFT`
2. `SENT`
3. `PARTIALLY_PAID`
4. `PAID`
5. `OVERDUE`
6. `VOID`
7. `PARTIALLY_REFUNDED`
8. `REFUNDED`

### 3.2 Invoice transition rules
Allowed transitions only:
- `DRAFT -> SENT`
- `DRAFT -> VOID`
- `SENT -> PARTIALLY_PAID`
- `SENT -> PAID`
- `SENT -> OVERDUE`
- `SENT -> VOID`
- `OVERDUE -> PARTIALLY_PAID`
- `OVERDUE -> PAID`
- `OVERDUE -> VOID`
- `PARTIALLY_PAID -> PAID`
- `PARTIALLY_PAID -> OVERDUE`
- `PAID -> PARTIALLY_REFUNDED`
- `PAID -> REFUNDED`
- `PARTIALLY_REFUNDED -> REFUNDED`

No other invoice transition is allowed.

### 3.3 Invoice state derivation rules
An invoice is:
- `DRAFT` before issue
- `SENT` after issue and before due-date breach, while paid amount = 0
- `OVERDUE` when due date has passed and paid amount < gross amount
- `PARTIALLY_PAID` when `0 < paid_gross_pence < amount_gross_pence`
- `PAID` when `paid_gross_pence = amount_gross_pence` and refunded amount = 0
- `PARTIALLY_REFUNDED` when invoice was paid and `0 < refunded_gross_pence < paid_gross_pence`
- `REFUNDED` when `refunded_gross_pence = paid_gross_pence`
- `VOID` only before any successful payment exists

### 3.4 Payment state machine
Allowed payment states:
1. `PENDING`
2. `PROCESSING`
3. `SUCCEEDED`
4. `FAILED`
5. `CANCELED`
6. `PARTIALLY_REFUNDED`
7. `REFUNDED`
8. `DISPUTED`

### 3.5 Payment transition rules
Allowed transitions only:
- `PENDING -> PROCESSING`
- `PENDING -> SUCCEEDED`
- `PENDING -> FAILED`
- `PENDING -> CANCELED`
- `PROCESSING -> SUCCEEDED`
- `PROCESSING -> FAILED`
- `PROCESSING -> CANCELED`
- `SUCCEEDED -> PARTIALLY_REFUNDED`
- `SUCCEEDED -> REFUNDED`
- `SUCCEEDED -> DISPUTED`
- `PARTIALLY_REFUNDED -> REFUNDED`
- `PARTIALLY_REFUNDED -> DISPUTED`

`FAILED`, `CANCELED`, `REFUNDED`, and `DISPUTED` are terminal in the P0 contract.

### 3.6 Payment source-of-truth rule
1. Payment state is controlled only by verified provider events.
2. Invoice payment status is controlled only by successful payment records and verified refund records.
3. A UI action may create a payment attempt, but may not mark an invoice paid.

### 3.7 Conflicts with current code
- Current code marks invoices as paid through app actions outside verified provider state.
- Current Stripe webhook does not verify signatures and does not own the payment lifecycle.

---

## 4. Revenue Recognition Contract

### 4.1 Recognition basis
TradeLife v3 uses **cash-basis recognition for recognised revenue**.

### 4.2 Rules
1. Accepted quote value creates `COMMITTED_REVENUE`, not `RECOGNISED_REVENUE`.
2. Invoice creation creates no recognised revenue ledger entry.
3. Payment attempt creation creates no recognised revenue ledger entry.
4. Only a verified successful provider payment event creates `RECOGNISED_REVENUE`.
5. `RECOGNISED_REVENUE` is always posted **net of VAT**.
6. VAT collected on successful payment is posted separately to `VAT`.
7. Refunds reverse both net recognised revenue and VAT.
8. VAT is never included inside the `RECOGNISED_REVENUE` amount.

### 4.3 Partial payment allocation formula
For a payment against an invoice:

- `recognised_net_pence = round(payment_gross_pence * invoice_amount_net_pence / invoice_amount_gross_pence)`
- `recognised_vat_pence = payment_gross_pence - recognised_net_pence`

These two values must be used for the payment success ledger entries.

### 4.4 Refund allocation formula
For a refund against a previously successful payment allocation:

- `refunded_net_pence = round(refund_gross_pence * original_invoice_amount_net_pence / original_invoice_amount_gross_pence)`
- `refunded_vat_pence = refund_gross_pence - refunded_net_pence`

These two values must be used for the refund reversal ledger entries.

### 4.5 Expense recognition rule
1. Expense is recognised only when the user confirms the expense.
2. Expense amount posted to `EXPENSE` is always net of VAT.
3. Reclaimable input VAT is posted separately to `VAT` as a negative amount.

### 4.6 Conflicts with current code
- `/app/lib/actions/invoices.ts` currently posts recognised revenue at invoice creation time.
- Current refund/dispute logic is missing.
- Current dashboards sometimes infer recognised revenue from snapshots instead of payments.

---

## 5. Core Financial Event Flow Contract

## 5.1 Event 1 — Quote accepted
### Preconditions
- Quote state is `SENT`
- Quote has immutable accepted snapshot data generated at acceptance time
- No prior successful acceptance event exists for the same quote

### Required writes
1. Quote state becomes `ACCEPTED`
2. Quote snapshot is persisted
3. Ledger write:
   - event_type: `QUOTE_ACCEPTED`
   - category: `COMMITTED_REVENUE`
   - amount: `+quote_amount_net_pence`
   - idempotency_key: `quote_accept:{quote_id}`

### Forbidden writes
- No recognised revenue
- No VAT write
- No invoice write

## 5.2 Event 2 — Job created from accepted quote
### Preconditions
- Quote state is `ACCEPTED`
- Quote has no existing linked job

### Required writes
1. Job row created from accepted quote lineage
2. Job line items copied from accepted quote structure

### Forbidden writes
- No ledger write

## 5.3 Event 3 — Invoice issued
### Preconditions
- Job exists
- Invoice lines originate from job lines
- Invoice total is internally consistent

### Required writes
1. Invoice created
2. Invoice state becomes `SENT`

### Forbidden writes
- No ledger write
- No payment state mutation

## 5.4 Event 4 — Payment attempt created
### Preconditions
- Invoice state is `SENT`, `OVERDUE`, or `PARTIALLY_PAID`
- Invoice amount due is greater than zero

### Required writes
1. Payment record created in `PENDING`
2. Provider metadata contains `org_id`, `job_id`, `invoice_id`, `payment_id`

### Forbidden writes
- No invoice paid state
- No ledger write

## 5.5 Event 5 — Payment succeeded
### Preconditions
- Provider webhook signature verified
- Payment event not previously processed
- Payment record exists and is not terminal

### Required writes
1. Payment record becomes `SUCCEEDED`
2. Invoice paid totals updated
3. Invoice state recalculated
4. Ledger writes:
   - `RECOGNISED_REVENUE` `+recognised_net_pence`
   - `VAT` `+recognised_vat_pence`
5. Idempotency key:
   - `payment_success:{provider_event_id}`

## 5.6 Event 6 — Expense confirmed
### Preconditions
- Expense belongs to authenticated org
- User has confirmed supplier, total, VAT, and job allocation

### Required writes
1. Expense row created or confirmed
2. Ledger write:
   - `EXPENSE` `-expense_net_pence`
3. If reclaimable VAT exists:
   - `VAT` `-expense_vat_pence`
4. Idempotency key:
   - `expense_confirm:{expense_id}`

## 5.7 Event 7 — Payment refunded
### Preconditions
- Provider refund event verified
- Source payment is `SUCCEEDED` or `PARTIALLY_REFUNDED`
- Refund event not previously processed

### Required writes
1. Refund row created
2. Payment state recalculated:
   - `PARTIALLY_REFUNDED` or `REFUNDED`
3. Invoice refund totals updated
4. Invoice state recalculated:
   - `PARTIALLY_REFUNDED` or `REFUNDED`
5. Ledger writes:
   - `RECOGNISED_REVENUE` `-refunded_net_pence`
   - `VAT` `-refunded_vat_pence`
6. Idempotency key:
   - `payment_refund:{provider_event_id}`

### 5.8 Event processing rule
Every financial event must be processed atomically.

That means the following must commit or fail together:
- state change
- payment/refund record write
- ledger write(s)
- event log write

### 5.9 Conflicts with current code
- Current code splits financial writes across unrelated actions without transaction guarantees.
- Current code posts revenue at the wrong event boundary.
- Current code lacks a canonical event log and idempotent event processing path.

---

## 6. Schema Naming Contract for P0 Rebuild

The schema rebuild must use these canonical table names for the critical contracts:
- `organisations`
- `profiles`
- `quotes`
- `quote_sections`
- `quote_line_items`
- `quote_snapshots`
- `jobs`
- `job_line_items`
- `invoices`
- `invoice_line_items`
- `payment_records`
- `refunds`
- `expenses`
- `ledger_entries`

Legacy names that are not authoritative in the rebuilt contract:
- `job_wallet_ledger`
- `job_wallets`

If temporary compatibility views are needed during migration, they must be explicitly marked transitional and must not redefine the contracts above.

---

## 7. Immediate Rebuild Implications

When schema rebuild starts, the following behaviours must be removed first because they violate the contracts above:
- public quote table visibility via generic RLS
- public portal invite table visibility via generic RLS
- invoice-created revenue posting
- manual invoice-paid action as source of truth
- mixed ledger category naming
- routes that trust caller-supplied `org_id`
- placeholder payment webhook persistence without verification

---

## 8. Locked Decision Summary

These are the non-negotiable locked decisions:
1. `profiles.org_id` is the only tenant context key.
2. Public access exists only through server-validated tokens.
3. The canonical ledger is append-only and uses signed amounts.
4. The only P0 ledger categories are `COMMITTED_REVENUE`, `RECOGNISED_REVENUE`, `EXPENSE`, and `VAT`.
5. Recognised revenue is created only by verified successful payment events.
6. Invoice creation creates no ledger revenue entry.
7. Refunds reverse recognised revenue and VAT.
8. Financial events must be idempotent and atomic.
9. Payment/webhook state is the source of truth for invoice paid state.
10. Schema rebuild will target these contracts, not the current drifted implementation.