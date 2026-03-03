# TradeLife v2 — PROJECT STANDARDS (The Constitution)

> This document is the single source of truth for all development decisions.
> Every contributor, AI agent, and code review must enforce these rules.

---

## 1. Multi-Tenancy (Non-Negotiable)

- **Every table** MUST have an `org_id` column (except `organisations` itself and `profiles` which links to it).
- **Every query** MUST filter by `org_id`. No exceptions.
- **Row Level Security (RLS)** is enabled on all tables. The `get_user_org_id()` function resolves the authenticated user's org.
- **New tables** added in future migrations MUST include `org_id` and corresponding RLS policies.

## 2. BigInt Money (Zero Floating-Point)

- **All currency** fields are stored as `BIGINT` in **pence/cents**. `£150.50` = `15050`.
- **All percentages** are stored as `INTEGER × 100`. `25.00%` = `2500`. `20.00% VAT` = `2000`.
- **No `DECIMAL`, `NUMERIC`, `FLOAT`, or `DOUBLE`** types for money. Ever.
- **Division/rounding** happens ONLY at the display layer (`penceToPounds()`, `formatCurrency()`).
- **Intermediate math** stays as integer operations: `value * percentage / 10000`.

## 3. Immutability Gates

- **ACCEPTED quotes** are immutable. Enforced by:
  - Postgres trigger `enforce_quote_immutability()` on `quotes`, `quote_sections`, `quote_line_items`.
  - Application-level checks before any mutation.
- **Invoice line items** are copied from job line items at creation and never modified.
- **Lineage is sacred**: Quote → Job → Invoice. No manual re-entry at any stage.

## 4. Strict Lineage

- A **Job** MUST originate from an Accepted Quote (`source_quote_id` is NOT NULL).
- An **Invoice** MUST originate from a Job (`source_job_id` is NOT NULL).
- **Invoice line items** reference `source_job_line_id` — descriptions and amounts are copied, not typed.
- **Variations** flow: `PROPOSED` → `APPROVED` → creates `JobLineItem` with `is_variation=true`.

## 5. No Drift

- Follow the **STRUCTURAL_AUDIT** exactly as documented in Memory MCP.
- Do **NOT** invent features, tables, or columns not defined in the audit.
- Do **NOT** add "nice to have" logic without explicit approval.
- If a new requirement emerges, update the audit FIRST, then implement.

## 6. Server-Side Math

- **All pricing calculations** happen in `/app/lib/actions/quotes.ts` (Server Actions).
- The client NEVER computes prices, margins, or VAT.
- The client sends raw inputs (days, rates, materials, margin%) → server returns calculated results.
- **Divide-by-zero guard**: `quote_margin_percentage` returns `0` when `quote_total_cost` is `0`.

## 7. Naming Conventions

- **Tables**: `snake_case`, plural (`quotes`, `quote_sections`, `job_line_items`).
- **Columns**: `snake_case` (`unit_price_net`, `is_subcontract`).
- **Enums**: `UPPER_CASE` values (`DRAFT`, `ACCEPTED`, `ON_SITE`).
- **TypeScript types**: `PascalCase` interfaces matching table names (`Quote`, `QuoteSection`).
- **Functions**: `camelCase` (`calculateSection`, `recalculateQuote`).

## 8. Integration Placeholders

The following columns exist for **deferred integrations** — do not remove them:
- `organisations.stripe_customer_id`, `organisations.xero_tenant_id`
- `clients.stripe_customer_id`, `clients.xero_contact_id`
- `invoices.stripe_payment_link`, `invoices.stripe_payment_intent_id`, `invoices.xero_invoice_id`
- `jobs.google_calendar_event_id`

## 9. Currency Display Convention

| Stored Value | Display | Function |
|---|---|---|
| `15050` (pence) | `£150.50` | `formatCurrency(15050)` |
| `2500` (margin%) | `25.00%` | `formatPercentage(2500)` |
| `2000` (VAT%) | `20.00%` | `formatPercentage(2000)` |

---

*Last updated: January 2026*
*Source: Structural Audit + Foundation Layer Approval*
