// ============================================================================
// TradeLife v2 — Schema Context (MCP Layer)
// lib/ai/schema-context.ts
//
// Provides Gemini with full awareness of the TradeLife database schema,
// constraints, and business rules. This is the "Supabase MCP" — the AI
// reads this context before generating any data-touching logic.
//
// PURPOSE:
// - Schema Verification: AI validates its output against BIGINT/org_id rules
// - Constraint Awareness: AI understands immutability gates, RLS, lineage
// - Business Logic: AI knows the pricing formulas and status machines
// ============================================================================

export const TRADELIFE_SCHEMA_CONTEXT = `
## TradeLife v2 — Database Schema Context

### CRITICAL CONSTRAINTS (Non-Negotiable)
1. ALL currency values are BIGINT stored as pence/cents (integers). £150.50 = 15050. NEVER use DECIMAL, FLOAT, or NUMERIC.
2. ALL percentages are INTEGER x100. 25.00% = 2500. 20.00% VAT = 2000.
3. EVERY data table has org_id (UUID, NOT NULL, FK → organisations). Multi-tenancy is absolute.
4. Row Level Security (RLS) is enabled on ALL tables. get_user_org_id() resolves the authenticated user's org.
5. ACCEPTED quotes are IMMUTABLE — enforced by Postgres trigger. Cannot modify financial fields.
6. Lineage is sacred: Quote → Job → Invoice. No manual re-entry at any stage.

### TABLES

#### organisations
- id (UUID PK), name (TEXT), stripe_customer_id (TEXT, deferred), xero_tenant_id (TEXT, deferred)

#### profiles (1:1 with auth.users)
- id (UUID PK, FK → auth.users), org_id (UUID FK → organisations), full_name (TEXT), email (TEXT), role (TEXT, default 'owner')

#### clients (org-scoped customers)
- id (UUID PK), org_id, name (TEXT), email, phone, address, stripe_customer_id (deferred), xero_contact_id (deferred)

#### quotes (Sales Instrument)
- id (UUID PK), org_id, client_id (FK → clients), status (quote_status enum: DRAFT/SENT/ACCEPTED/DECLINED)
- share_token (TEXT UNIQUE), vat_rate (INTEGER, default 2000 = 20%)
- quote_amount_net (BIGINT pence), quote_amount_gross (BIGINT pence), quote_total_cost (BIGINT pence)
- quote_profit (BIGINT pence), quote_margin_percentage (INTEGER x100)
- reference, notes, valid_until, job_id (FK → jobs)

#### quote_sections (Pricing Engine)
- id, quote_id (FK → quotes CASCADE), org_id
- title, trade_type, sort_order, is_subcontract (BOOLEAN)
- labour_days (INTEGER), labour_day_rate (BIGINT pence/day), subcontract_cost (BIGINT pence)
- material_cost_total (BIGINT pence), margin_percentage (INTEGER x100)
- CALCULATED: labour_cost, section_cost_total, section_revenue_total, section_profit (all BIGINT pence)

#### quote_line_items (flows downstream to Jobs/Invoices)
- id, quote_id (CASCADE), quote_section_id (CASCADE), org_id
- description, quantity (INTEGER), unit (TEXT), unit_price_net (BIGINT), line_total_net (BIGINT)

#### quote_templates (reusable section presets)
- id, org_id, name, trade_type, is_subcontract, labour_days, labour_day_rate, subcontract_cost, material_cost_total, margin_percentage

#### jobs (Operational Unit — created from ACCEPTED Quote)
- id, org_id, source_quote_id (FK → quotes, NOT NULL, ON DELETE RESTRICT)
- client_id, title, address, status (job_status: ENQUIRY/BOOKED/ON_SITE/COMPLETED/SNAGGING/SIGNED_OFF/CANCELLED)
- target_start_date, target_end_date, google_calendar_event_id (deferred)

#### job_line_items (inherited from quote_line_items)
- id, job_id (CASCADE), org_id, source_quote_line_id (FK)
- description, quantity, unit, unit_price_net (BIGINT), line_total_net (BIGINT)
- status (PENDING/IN_PROGRESS/COMPLETED), is_variation (BOOLEAN), source_variation_id (FK)

#### variations ("Can You Just" change orders)
- id, job_id (CASCADE), org_id
- description, reason, quantity, unit, unit_price_net (BIGINT), line_total_net (BIGINT)
- status (PROPOSED/APPROVED/REJECTED), approved_at, job_line_item_id (FK, set on approval)

#### invoices (Financial Demand — from Job)
- id, org_id, source_job_id (FK → jobs, NOT NULL, ON DELETE RESTRICT)
- invoice_number, invoice_type (DEPOSIT/INTERIM/FINAL)
- amount_net (BIGINT), vat_rate (INTEGER), amount_gross (BIGINT)
- status (DRAFT/SENT/PAID/OVERDUE/VOID)
- stripe_payment_link (deferred), xero_invoice_id (deferred)

#### invoice_line_items (immutable copies from job_line_items)
- source_job_line_id (FK, ON DELETE RESTRICT) — descriptions/amounts copied, never modified

#### money_pots (Profit First Engine)
- id, org_id, pot_type (OPERATING/TAX/PROFIT/RESERVE), balance (BIGINT pence)
- allocation_percentage (INTEGER x100), income_floor (BIGINT pence)
- UNIQUE(org_id, pot_type) — one pot per type per org
- Auto-seeded on org creation: OPERATING 50%, TAX 20%, PROFIT 15%, RESERVE 15%

#### cashflow_entries (audit trail)
- id, org_id, pot_type, amount (BIGINT, +/- pence), description, source_invoice_id

### PRICING FORMULAS
- Direct Labour Cost = labour_days * labour_day_rate
- Subcontract Cost = subcontract_cost (pass-through)
- Section Cost = Labour Cost + Material Cost
- Section Revenue = Section Cost + Math.round(Section Cost * margin_percentage / 10000)
- Section Profit = Revenue - Cost
- Quote Net = SUM(Section Revenues)
- Quote Cost = SUM(Section Costs)
- Quote Profit = Net - Cost
- Quote Margin% = Math.round((Profit * 10000) / Cost), guarded: 0 if cost = 0
- Quote Gross = Math.round(Net * (10000 + vat_rate) / 10000)

### ENUMS
- quote_status: DRAFT, SENT, ACCEPTED, DECLINED
- job_status: ENQUIRY, BOOKED, ON_SITE, COMPLETED, SNAGGING, SIGNED_OFF, CANCELLED
- job_line_item_status: PENDING, IN_PROGRESS, COMPLETED
- variation_status: PROPOSED, APPROVED, REJECTED
- invoice_type: DEPOSIT, INTERIM, FINAL
- invoice_status: DRAFT, SENT, PAID, OVERDUE, VOID
- money_pot_type: OPERATING, TAX, PROFIT, RESERVE
`.trim()
