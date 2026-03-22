# TradeLife v3 — Full Schema Blueprint

## Status
- This blueprint is derived from the locked contracts in `/app/memory/TRADELIFE_V3_SYSTEM_CONTRACTS.md`.
- It is the **authoritative schema design target** for the v3 rebuild.
- It is intentionally **schema-only**: no implementation code, no SQL, no app logic snippets.

---

## 1. Schema Design Principles

1. PostgreSQL is the canonical database.
2. Supabase Auth is the identity provider.
3. Every org-owned business row carries `org_id`.
4. `profiles.org_id` is the only tenant context key.
5. Public access is never granted through broad table policies.
6. Financial truth lives in `ledger_entries`.
7. `ledger_entries` is append-only and uses signed `amount_pence`.
8. Revenue recognition is cash-based.
9. Quote → Job → Invoice lineage is mandatory.
10. All money is stored as integer pence.
11. All timestamps are `TIMESTAMPTZ`.
12. All state machines are enforced by check constraints, foreign keys, and transactional boundaries.

---

## 2. Canonical Enums

## 2.1 Organisation / identity enums

### `profile_role`
- `OWNER`
- `ADMIN`
- `MANAGER`
- `STAFF`
- `FINANCE`

### `trade_type`
- `PLUMBING`
- `ELECTRICAL`
- `CARPENTRY`
- `PAINTING`
- `ROOFING`
- `GENERAL_BUILDING`
- `HEATING`
- `HVAC`
- `MULTI_TRADE`
- `OTHER`

## 2.2 Quote enums

### `quote_status`
- `DRAFT`
- `SENT`
- `ACCEPTED`
- `DECLINED`
- `EXPIRED`

### `quote_line_type`
- `LABOUR`
- `MATERIAL`
- `SUBCONTRACT`
- `OTHER`

## 2.3 Job enums

### `job_status`
- `PLANNED`
- `BOOKED`
- `IN_PROGRESS`
- `BLOCKED`
- `SNAGGING`
- `COMPLETED`
- `CANCELLED`

### `job_line_status`
- `PENDING`
- `IN_PROGRESS`
- `COMPLETE`
- `CANCELLED`

### `variation_status`
- `PROPOSED`
- `APPROVED`
- `REJECTED`

## 2.4 Invoice / payment enums

### `invoice_type`
- `DEPOSIT`
- `INTERIM`
- `FINAL`
- `CREDIT_NOTE`

### `invoice_status`
- `DRAFT`
- `SENT`
- `PARTIALLY_PAID`
- `PAID`
- `OVERDUE`
- `VOID`
- `PARTIALLY_REFUNDED`
- `REFUNDED`

### `payment_provider`
- `STRIPE`
- `MANUAL`
- `XERO`

### `payment_status`
- `PENDING`
- `PROCESSING`
- `SUCCEEDED`
- `FAILED`
- `CANCELED`
- `PARTIALLY_REFUNDED`
- `REFUNDED`
- `DISPUTED`

### `dispute_status`
- `OPEN`
- `UNDER_REVIEW`
- `WON`
- `LOST`
- `CLOSED`

### `hold_status`
- `HELD`
- `PARTIALLY_RELEASED`
- `RELEASED`
- `FROZEN`
- `CANCELED`

## 2.5 Expense / ledger enums

### `expense_status`
- `DRAFT`
- `CONFIRMED`
- `VOID`

### `ledger_category`
- `COMMITTED_REVENUE`
- `RECOGNISED_REVENUE`
- `EXPENSE`
- `VAT`

### `ledger_event_type`
- `QUOTE_ACCEPTED`
- `PAYMENT_SUCCEEDED`
- `EXPENSE_CONFIRMED`
- `PAYMENT_REFUNDED`

## 2.6 Scheduling enums

### `resource_status`
- `ACTIVE`
- `INACTIVE`

### `booking_status`
- `HELD`
- `CONFIRMED`
- `EXPIRED`
- `REJECTED`
- `CANCELLED`
- `COMPLETED`

### `booking_type`
- `QUOTE_VISIT`
- `SITE_VISIT`
- `INSTALL`
- `SNAGGING`
- `SERVICE`
- `EMERGENCY`

### `lock_type`
- `SOFT`
- `HARD`

## 2.7 Recurring / communication / notifications enums

### `asset_status`
- `ACTIVE`
- `INACTIVE`
- `RETIRED`

### `schedule_frequency`
- `WEEKLY`
- `MONTHLY`
- `QUARTERLY`
- `YEARLY`
- `CUSTOM`

### `portal_invite_status`
- `ACTIVE`
- `EXPIRED`
- `REVOKED`

### `thread_type`
- `JOB`
- `CLIENT`
- `PORTAL`
- `ASSISTANT`
- `SYSTEM`

### `message_sender_type`
- `ORG_USER`
- `CLIENT`
- `SYSTEM`
- `AI`

### `assistant_task_status`
- `PENDING`
- `IN_PROGRESS`
- `DONE`
- `CANCELLED`

### `notification_channel`
- `IN_APP`
- `EMAIL`
- `SMS`

### `notification_status`
- `PENDING`
- `SENT`
- `FAILED`
- `CANCELLED`

## 2.8 Integration / audit enums

### `integration_provider`
- `STRIPE`
- `XERO`
- `PLAID`
- `TWILIO`
- `RESEND`

### `webhook_status`
- `RECEIVED`
- `VERIFIED`
- `PROCESSED`
- `REJECTED`
- `FAILED`

### `domain_event_status`
- `PENDING`
- `PROCESSED`
- `FAILED`

### `audit_event_type`
- `CREATE`
- `UPDATE`
- `DELETE`
- `STATUS_CHANGE`
- `AUTH`
- `FINANCIAL`
- `SYSTEM`

---

## 3. Table Blueprint

## 3.1 Tenancy, identity, organisation settings

### `organisations`
Purpose: tenant root record.

Columns:
- `id UUID PK`
- `name TEXT NOT NULL`
- `trade_type trade_type NOT NULL`
- `legal_name TEXT NULL`
- `company_number TEXT NULL`
- `vat_number TEXT NULL`
- `is_vat_registered BOOLEAN NOT NULL DEFAULT false`
- `timezone TEXT NOT NULL DEFAULT 'Europe/London'`
- `currency_code TEXT NOT NULL DEFAULT 'GBP'`
- `logo_url TEXT NULL`
- `margin_floor_basis_points INTEGER NOT NULL DEFAULT 2000`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- unique `(company_number)` where not null
- unique `(vat_number)` where not null
- check `currency_code = 'GBP'`
- check `margin_floor_basis_points between 0 and 10000`

Indexes:
- unique pk index on `id`
- index on `trade_type`

### `profiles`
Purpose: authenticated user tenancy binding.

Columns:
- `id UUID PK REFERENCES auth.users(id)`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `email TEXT NOT NULL`
- `full_name TEXT NULL`
- `role profile_role NOT NULL`
- `phone TEXT NULL`
- `is_active BOOLEAN NOT NULL DEFAULT true`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- unique `(org_id, email)`

Indexes:
- index on `org_id`
- index on `(org_id, role)`

### `organisation_settings`
Purpose: operational and financial defaults.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL UNIQUE REFERENCES organisations(id)`
- `default_vat_basis_points INTEGER NOT NULL DEFAULT 2000`
- `invoice_payment_terms_days INTEGER NOT NULL DEFAULT 14`
- `payment_reminder_days_before_due INTEGER NOT NULL DEFAULT 3`
- `weather_postcode TEXT NULL`
- `branding_theme TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- check `default_vat_basis_points between 0 and 10000`
- check `invoice_payment_terms_days >= 0`

Indexes:
- unique index on `org_id`

### `organisation_terms`
Purpose: default quote/proposal/invoice terms.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `title TEXT NOT NULL`
- `content TEXT NOT NULL`
- `is_default BOOLEAN NOT NULL DEFAULT false`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- max one default terms row per org

Indexes:
- index on `org_id`
- partial unique index on `(org_id)` where `is_default = true`

### `goals`
Purpose: monthly financial targets.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `month_start DATE NOT NULL`
- `target_revenue_pence BIGINT NOT NULL`
- `target_profit_pence BIGINT NOT NULL`
- `owner_pay_target_pence BIGINT NOT NULL`
- `stability_buffer_pence BIGINT NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- unique `(org_id, month_start)`
- non-negative money checks

Indexes:
- index on `(org_id, month_start desc)`

---

## 3.2 CRM, client, sites

### `clients`
Purpose: customer master.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `name TEXT NOT NULL`
- `email TEXT NULL`
- `phone TEXT NULL`
- `billing_address TEXT NULL`
- `notes TEXT NULL`
- `stripe_customer_id TEXT NULL`
- `xero_contact_id TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- unique `(org_id, stripe_customer_id)` where not null
- unique `(org_id, xero_contact_id)` where not null

Indexes:
- index on `org_id`
- index on `(org_id, name)`
- index on `(org_id, email)`

### `client_sites`
Purpose: physical job/service locations.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `client_id UUID NOT NULL REFERENCES clients(id)`
- `label TEXT NOT NULL`
- `address TEXT NOT NULL`
- `postcode TEXT NULL`
- `latitude DOUBLE PRECISION NULL`
- `longitude DOUBLE PRECISION NULL`
- `is_default BOOLEAN NOT NULL DEFAULT false`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- partial unique `(client_id)` where `is_default = true`

Indexes:
- index on `org_id`
- index on `client_id`
- index on `(org_id, postcode)`

---

## 3.3 Quote engine

### `quote_templates`
Purpose: reusable quote template headers.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `name TEXT NOT NULL`
- `trade_type trade_type NOT NULL`
- `is_active BOOLEAN NOT NULL DEFAULT true`
- `created_by UUID NULL REFERENCES profiles(id)`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- unique `(org_id, name)`

Indexes:
- index on `org_id`
- index on `(org_id, trade_type)`

### `quote_template_sections`
Purpose: reusable template section definitions.

Columns:
- `id UUID PK`
- `template_id UUID NOT NULL REFERENCES quote_templates(id)`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `title TEXT NOT NULL`
- `sort_order INTEGER NOT NULL`
- `default_margin_basis_points INTEGER NOT NULL`

Constraints:
- unique `(template_id, sort_order)`
- check `default_margin_basis_points between 0 and 10000`

Indexes:
- index on `template_id`
- index on `org_id`

### `quote_template_line_items`
Purpose: reusable template cost lines.

Columns:
- `id UUID PK`
- `template_section_id UUID NOT NULL REFERENCES quote_template_sections(id)`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `line_type quote_line_type NOT NULL`
- `description TEXT NOT NULL`
- `quantity NUMERIC(12,2) NOT NULL`
- `unit TEXT NOT NULL`
- `unit_cost_pence BIGINT NOT NULL`
- `default_markup_basis_points INTEGER NOT NULL`
- `sort_order INTEGER NOT NULL`

Constraints:
- unique `(template_section_id, sort_order)`
- check `quantity > 0`
- check `unit_cost_pence >= 0`
- check `default_markup_basis_points between 0 and 10000`

Indexes:
- index on `template_section_id`
- index on `org_id`

### `quotes`
Purpose: commercial quote master.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `client_id UUID NOT NULL REFERENCES clients(id)`
- `client_site_id UUID NULL REFERENCES client_sites(id)`
- `status quote_status NOT NULL`
- `reference TEXT NOT NULL`
- `share_token TEXT NOT NULL`
- `valid_until DATE NULL`
- `scope_summary TEXT NULL`
- `notes TEXT NULL`
- `vat_basis_points INTEGER NOT NULL`
- `quote_amount_net_pence BIGINT NOT NULL`
- `quote_amount_vat_pence BIGINT NOT NULL`
- `quote_amount_gross_pence BIGINT NOT NULL`
- `quote_total_cost_pence BIGINT NOT NULL`
- `quote_profit_pence BIGINT NOT NULL`
- `quote_margin_basis_points INTEGER NOT NULL`
- `accepted_snapshot_id UUID NULL REFERENCES quote_snapshots(id)`
- `created_by UUID NULL REFERENCES profiles(id)`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- unique `(org_id, reference)`
- unique `(share_token)`
- check `vat_basis_points between 0 and 10000`
- check `quote_amount_net_pence >= 0`
- check `quote_amount_vat_pence >= 0`
- check `quote_amount_gross_pence = quote_amount_net_pence + quote_amount_vat_pence`
- check `quote_total_cost_pence >= 0`
- check `quote_margin_basis_points between 0 and 10000`

Indexes:
- index on `org_id`
- index on `client_id`
- index on `(org_id, status)`
- unique index on `share_token`
- index on `(org_id, created_at desc)`

### `quote_sections`
Purpose: grouped scope blocks.

Columns:
- `id UUID PK`
- `quote_id UUID NOT NULL REFERENCES quotes(id)`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `title TEXT NOT NULL`
- `sort_order INTEGER NOT NULL`
- `section_amount_net_pence BIGINT NOT NULL`
- `section_cost_pence BIGINT NOT NULL`
- `section_profit_pence BIGINT NOT NULL`
- `section_margin_basis_points INTEGER NOT NULL`

Constraints:
- unique `(quote_id, sort_order)`
- check `section_amount_net_pence >= 0`
- check `section_cost_pence >= 0`

Indexes:
- index on `quote_id`
- index on `org_id`

### `quote_line_items`
Purpose: fully itemised quote lines.

Columns:
- `id UUID PK`
- `quote_id UUID NOT NULL REFERENCES quotes(id)`
- `quote_section_id UUID NOT NULL REFERENCES quote_sections(id)`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `line_type quote_line_type NOT NULL`
- `description TEXT NOT NULL`
- `quantity NUMERIC(12,2) NOT NULL`
- `unit TEXT NOT NULL`
- `unit_cost_pence BIGINT NOT NULL`
- `unit_sell_pence BIGINT NOT NULL`
- `line_cost_pence BIGINT NOT NULL`
- `line_amount_net_pence BIGINT NOT NULL`
- `sort_order INTEGER NOT NULL`

Constraints:
- unique `(quote_section_id, sort_order)`
- check `quantity > 0`
- check `unit_cost_pence >= 0`
- check `unit_sell_pence >= 0`
- check `line_cost_pence >= 0`
- check `line_amount_net_pence >= 0`

Indexes:
- index on `quote_id`
- index on `quote_section_id`
- index on `org_id`

### `quote_upsells`
Purpose: optional add-ons offered with quote.

Columns:
- `id UUID PK`
- `quote_id UUID NOT NULL REFERENCES quotes(id)`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `title TEXT NOT NULL`
- `description TEXT NULL`
- `amount_net_pence BIGINT NOT NULL`
- `cost_pence BIGINT NOT NULL`
- `sort_order INTEGER NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`

Constraints:
- unique `(quote_id, sort_order)`
- check `amount_net_pence >= 0`
- check `cost_pence >= 0`

Indexes:
- index on `quote_id`
- index on `org_id`

### `quote_snapshots`
Purpose: immutable accepted quote record.

Columns:
- `id UUID PK`
- `quote_id UUID NOT NULL UNIQUE REFERENCES quotes(id)`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `accepted_by_name TEXT NOT NULL`
- `accepted_ip TEXT NOT NULL`
- `accepted_at TIMESTAMPTZ NOT NULL`
- `total_amount_net_pence BIGINT NOT NULL`
- `total_vat_pence BIGINT NOT NULL`
- `total_gross_pence BIGINT NOT NULL`
- `snapshot_data JSONB NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`

Constraints:
- check `total_gross_pence = total_amount_net_pence + total_vat_pence`

Indexes:
- unique index on `quote_id`
- index on `org_id`

---

## 3.4 Job engine

### `jobs`
Purpose: accepted work package created from quote.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `source_quote_id UUID NOT NULL UNIQUE REFERENCES quotes(id)`
- `client_id UUID NOT NULL REFERENCES clients(id)`
- `client_site_id UUID NULL REFERENCES client_sites(id)`
- `status job_status NOT NULL`
- `title TEXT NOT NULL`
- `scope_summary TEXT NULL`
- `target_start_date DATE NULL`
- `target_end_date DATE NULL`
- `actual_start_at TIMESTAMPTZ NULL`
- `actual_end_at TIMESTAMPTZ NULL`
- `preferred_resource_id UUID NULL REFERENCES resources(id)`
- `created_by UUID NULL REFERENCES profiles(id)`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- check `target_end_date is null or target_start_date is null or target_end_date >= target_start_date`

Indexes:
- index on `org_id`
- index on `client_id`
- index on `(org_id, status)`
- index on `(org_id, target_start_date)`

### `job_line_items`
Purpose: executable job lines inherited from quote.

Columns:
- `id UUID PK`
- `job_id UUID NOT NULL REFERENCES jobs(id)`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `source_quote_line_item_id UUID NOT NULL REFERENCES quote_line_items(id)`
- `line_type quote_line_type NOT NULL`
- `description TEXT NOT NULL`
- `quantity NUMERIC(12,2) NOT NULL`
- `unit TEXT NOT NULL`
- `unit_cost_pence BIGINT NOT NULL`
- `unit_sell_pence BIGINT NOT NULL`
- `line_cost_pence BIGINT NOT NULL`
- `line_amount_net_pence BIGINT NOT NULL`
- `status job_line_status NOT NULL`
- `sort_order INTEGER NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- unique `(job_id, sort_order)`
- check `quantity > 0`

Indexes:
- index on `job_id`
- index on `org_id`
- index on `(job_id, status)`

### `variations`
Purpose: controlled scope change records.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `job_id UUID NOT NULL REFERENCES jobs(id)`
- `status variation_status NOT NULL`
- `description TEXT NOT NULL`
- `reason TEXT NULL`
- `amount_net_pence BIGINT NOT NULL`
- `vat_pence BIGINT NOT NULL`
- `gross_pence BIGINT NOT NULL`
- `approved_at TIMESTAMPTZ NULL`
- `approved_by UUID NULL REFERENCES profiles(id)`
- `created_by UUID NULL REFERENCES profiles(id)`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- check `amount_net_pence >= 0`
- check `vat_pence >= 0`
- check `gross_pence = amount_net_pence + vat_pence`

Indexes:
- index on `job_id`
- index on `org_id`
- index on `(job_id, status)`

### `job_materials`
Purpose: material requirement list.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `job_id UUID NOT NULL REFERENCES jobs(id)`
- `source_job_line_item_id UUID NULL REFERENCES job_line_items(id)`
- `description TEXT NOT NULL`
- `quantity NUMERIC(12,2) NOT NULL`
- `unit TEXT NOT NULL`
- `estimated_cost_pence BIGINT NOT NULL`
- `actual_cost_pence BIGINT NULL`
- `supplier_name TEXT NULL`
- `status TEXT NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- check `quantity > 0`
- check `estimated_cost_pence >= 0`
- check `actual_cost_pence is null or actual_cost_pence >= 0`

Indexes:
- index on `job_id`
- index on `org_id`

### `job_notes`
Purpose: operational notes.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `job_id UUID NOT NULL REFERENCES jobs(id)`
- `author_id UUID NULL REFERENCES profiles(id)`
- `body TEXT NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`

Indexes:
- index on `job_id`
- index on `org_id`

### `job_photos`
Purpose: field evidence/photos.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `job_id UUID NOT NULL REFERENCES jobs(id)`
- `uploaded_by UUID NULL REFERENCES profiles(id)`
- `storage_path TEXT NOT NULL`
- `caption TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL`

Constraints:
- unique `(storage_path)`

Indexes:
- index on `job_id`
- index on `org_id`

### `job_timeline`
Purpose: immutable operational milestone history.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `job_id UUID NOT NULL REFERENCES jobs(id)`
- `event_type TEXT NOT NULL`
- `title TEXT NOT NULL`
- `description TEXT NULL`
- `actor_profile_id UUID NULL REFERENCES profiles(id)`
- `effective_at TIMESTAMPTZ NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`

Indexes:
- index on `job_id`
- index on `(job_id, effective_at desc)`
- index on `org_id`

---

## 3.5 Invoicing, payments, refunds, disputes, holds

### `invoices`
Purpose: financial demand issued against a job.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `job_id UUID NOT NULL REFERENCES jobs(id)`
- `client_id UUID NOT NULL REFERENCES clients(id)`
- `status invoice_status NOT NULL`
- `invoice_type invoice_type NOT NULL`
- `invoice_number TEXT NOT NULL`
- `issue_date DATE NOT NULL`
- `due_date DATE NOT NULL`
- `amount_net_pence BIGINT NOT NULL`
- `vat_pence BIGINT NOT NULL`
- `amount_gross_pence BIGINT NOT NULL`
- `paid_gross_pence BIGINT NOT NULL DEFAULT 0`
- `refunded_gross_pence BIGINT NOT NULL DEFAULT 0`
- `balance_gross_pence BIGINT NOT NULL`
- `created_by UUID NULL REFERENCES profiles(id)`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- unique `(org_id, invoice_number)`
- check `amount_net_pence >= 0`
- check `vat_pence >= 0`
- check `amount_gross_pence = amount_net_pence + vat_pence`
- check `paid_gross_pence >= 0`
- check `refunded_gross_pence >= 0`
- check `balance_gross_pence >= 0`
- check `due_date >= issue_date`

Indexes:
- index on `job_id`
- index on `client_id`
- index on `org_id`
- index on `(org_id, status)`
- index on `(org_id, due_date)`

### `invoice_line_items`
Purpose: immutable invoice line copies from job lines.

Columns:
- `id UUID PK`
- `invoice_id UUID NOT NULL REFERENCES invoices(id)`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `source_job_line_item_id UUID NOT NULL REFERENCES job_line_items(id)`
- `line_type quote_line_type NOT NULL`
- `description TEXT NOT NULL`
- `quantity NUMERIC(12,2) NOT NULL`
- `unit TEXT NOT NULL`
- `unit_sell_pence BIGINT NOT NULL`
- `line_amount_net_pence BIGINT NOT NULL`
- `sort_order INTEGER NOT NULL`

Constraints:
- unique `(invoice_id, sort_order)`
- check `quantity > 0`
- check `unit_sell_pence >= 0`
- check `line_amount_net_pence >= 0`

Indexes:
- index on `invoice_id`
- index on `org_id`

### `payment_records`
Purpose: payment attempts/settlements.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `invoice_id UUID NOT NULL REFERENCES invoices(id)`
- `job_id UUID NOT NULL REFERENCES jobs(id)`
- `provider payment_provider NOT NULL`
- `status payment_status NOT NULL`
- `provider_payment_id TEXT NULL`
- `provider_checkout_session_id TEXT NULL`
- `provider_customer_id TEXT NULL`
- `attempted_gross_pence BIGINT NOT NULL`
- `succeeded_gross_pence BIGINT NOT NULL DEFAULT 0`
- `currency_code TEXT NOT NULL DEFAULT 'GBP'`
- `metadata JSONB NOT NULL DEFAULT '{}'::jsonb`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- unique `(provider, provider_payment_id)` where not null
- unique `(provider, provider_checkout_session_id)` where not null
- check `attempted_gross_pence > 0`
- check `succeeded_gross_pence >= 0`
- check `currency_code = 'GBP'`

Indexes:
- index on `invoice_id`
- index on `job_id`
- index on `org_id`
- index on `(org_id, status)`
- index on `(provider, provider_payment_id)`

### `payment_events`
Purpose: immutable provider event log per payment.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `payment_id UUID NOT NULL REFERENCES payment_records(id)`
- `provider payment_provider NOT NULL`
- `provider_event_id TEXT NOT NULL`
- `event_type TEXT NOT NULL`
- `status webhook_status NOT NULL`
- `payload_json JSONB NOT NULL`
- `received_at TIMESTAMPTZ NOT NULL`
- `processed_at TIMESTAMPTZ NULL`

Constraints:
- unique `(provider, provider_event_id)`

Indexes:
- unique index on `(provider, provider_event_id)`
- index on `payment_id`
- index on `org_id`

### `refunds`
Purpose: immutable refund records.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `payment_id UUID NOT NULL REFERENCES payment_records(id)`
- `invoice_id UUID NOT NULL REFERENCES invoices(id)`
- `provider payment_provider NOT NULL`
- `provider_refund_id TEXT NOT NULL`
- `gross_pence BIGINT NOT NULL`
- `reason TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL`

Constraints:
- unique `(provider, provider_refund_id)`
- check `gross_pence > 0`

Indexes:
- index on `payment_id`
- index on `invoice_id`
- index on `org_id`

### `disputes`
Purpose: immutable dispute tracking.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `payment_id UUID NOT NULL REFERENCES payment_records(id)`
- `invoice_id UUID NOT NULL REFERENCES invoices(id)`
- `provider payment_provider NOT NULL`
- `provider_dispute_id TEXT NOT NULL`
- `status dispute_status NOT NULL`
- `gross_pence BIGINT NOT NULL`
- `opened_at TIMESTAMPTZ NOT NULL`
- `closed_at TIMESTAMPTZ NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- unique `(provider, provider_dispute_id)`
- check `gross_pence > 0`

Indexes:
- index on `payment_id`
- index on `invoice_id`
- index on `org_id`
- index on `(org_id, status)`

### `payment_holds`
Purpose: Payment Protect hold state outside canonical revenue ledger.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `payment_id UUID NOT NULL UNIQUE REFERENCES payment_records(id)`
- `invoice_id UUID NOT NULL REFERENCES invoices(id)`
- `status hold_status NOT NULL`
- `held_gross_pence BIGINT NOT NULL`
- `released_gross_pence BIGINT NOT NULL DEFAULT 0`
- `frozen_gross_pence BIGINT NOT NULL DEFAULT 0`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- check `held_gross_pence >= 0`
- check `released_gross_pence >= 0`
- check `frozen_gross_pence >= 0`

Indexes:
- unique index on `payment_id`
- index on `invoice_id`
- index on `org_id`

### `payout_releases`
Purpose: milestone release history from payment holds.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `payment_hold_id UUID NOT NULL REFERENCES payment_holds(id)`
- `job_id UUID NOT NULL REFERENCES jobs(id)`
- `gross_pence BIGINT NOT NULL`
- `platform_fee_pence BIGINT NOT NULL`
- `net_pence BIGINT NOT NULL`
- `provider_transfer_id TEXT NULL`
- `released_at TIMESTAMPTZ NOT NULL`

Constraints:
- check `gross_pence > 0`
- check `platform_fee_pence >= 0`
- check `net_pence = gross_pence - platform_fee_pence`

Indexes:
- index on `payment_hold_id`
- index on `job_id`
- index on `org_id`

---

## 3.6 Expenses and canonical ledger

### `expenses`
Purpose: confirmed business cost master.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `job_id UUID NULL REFERENCES jobs(id)`
- `supplier_name TEXT NOT NULL`
- `description TEXT NOT NULL`
- `expense_date DATE NOT NULL`
- `status expense_status NOT NULL`
- `amount_net_pence BIGINT NOT NULL`
- `vat_pence BIGINT NOT NULL`
- `gross_pence BIGINT NOT NULL`
- `is_vat_reclaimable BOOLEAN NOT NULL`
- `confirmed_by UUID NULL REFERENCES profiles(id)`
- `confirmed_at TIMESTAMPTZ NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- check `amount_net_pence >= 0`
- check `vat_pence >= 0`
- check `gross_pence = amount_net_pence + vat_pence`
- check `(status = 'CONFIRMED' and confirmed_at is not null) or status <> 'CONFIRMED'`

Indexes:
- index on `org_id`
- index on `job_id`
- index on `(org_id, expense_date desc)`
- index on `(org_id, status)`

### `expense_receipts`
Purpose: uploaded receipt/image attachments.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `expense_id UUID NOT NULL REFERENCES expenses(id)`
- `storage_path TEXT NOT NULL`
- `mime_type TEXT NOT NULL`
- `uploaded_at TIMESTAMPTZ NOT NULL`

Constraints:
- unique `(storage_path)`

Indexes:
- index on `expense_id`
- index on `org_id`

### `ledger_entries`
Purpose: canonical append-only financial ledger.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `quote_id UUID NULL REFERENCES quotes(id)`
- `job_id UUID NULL REFERENCES jobs(id)`
- `invoice_id UUID NULL REFERENCES invoices(id)`
- `payment_id UUID NULL REFERENCES payment_records(id)`
- `expense_id UUID NULL REFERENCES expenses(id)`
- `refund_id UUID NULL REFERENCES refunds(id)`
- `event_type ledger_event_type NOT NULL`
- `category ledger_category NOT NULL`
- `amount_pence BIGINT NOT NULL`
- `currency_code TEXT NOT NULL DEFAULT 'GBP'`
- `effective_at TIMESTAMPTZ NOT NULL`
- `idempotency_key TEXT NOT NULL`
- `description TEXT NOT NULL`
- `metadata JSONB NOT NULL DEFAULT '{}'`
- `created_at TIMESTAMPTZ NOT NULL`

Constraints:
- unique `(idempotency_key)`
- check `currency_code = 'GBP'`
- check `amount_pence <> 0`

Indexes:
- unique index on `idempotency_key`
- index on `org_id`
- index on `job_id`
- index on `invoice_id`
- index on `payment_id`
- index on `expense_id`
- index on `(org_id, category, effective_at desc)`
- index on `(org_id, event_type, effective_at desc)`

---

## 3.7 Resource-based scheduling

### `resources`
Purpose: schedulable people/assets.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `profile_id UUID NULL UNIQUE REFERENCES profiles(id)`
- `label TEXT NOT NULL`
- `status resource_status NOT NULL`
- `home_postcode TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- unique `(org_id, label)`

Indexes:
- index on `org_id`
- index on `(org_id, status)`

### `resource_skills`
Purpose: resource trade capability matrix.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `resource_id UUID NOT NULL REFERENCES resources(id)`
- `trade_type trade_type NOT NULL`

Constraints:
- unique `(resource_id, trade_type)`

Indexes:
- index on `resource_id`
- index on `org_id`

### `resource_availability`
Purpose: working hour blocks / unavailability.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `resource_id UUID NOT NULL REFERENCES resources(id)`
- `starts_at TIMESTAMPTZ NOT NULL`
- `ends_at TIMESTAMPTZ NOT NULL`
- `is_available BOOLEAN NOT NULL`
- `reason TEXT NULL`

Constraints:
- check `ends_at > starts_at`

Indexes:
- index on `resource_id`
- index on `(resource_id, starts_at, ends_at)`
- index on `org_id`

### `job_bookings`
Purpose: authoritative scheduling/booking records.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `job_id UUID NOT NULL REFERENCES jobs(id)`
- `client_site_id UUID NULL REFERENCES client_sites(id)`
- `booking_type booking_type NOT NULL`
- `status booking_status NOT NULL`
- `starts_at TIMESTAMPTZ NOT NULL`
- `ends_at TIMESTAMPTZ NOT NULL`
- `payment_gate_required BOOLEAN NOT NULL DEFAULT false`
- `preferred_resource_id UUID NULL REFERENCES resources(id)`
- `locked_by_profile_id UUID NULL REFERENCES profiles(id)`
- `held_until TIMESTAMPTZ NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- check `ends_at > starts_at`
- check `(status = 'HELD' and held_until is not null) or status <> 'HELD'`

Indexes:
- index on `job_id`
- index on `org_id`
- index on `(org_id, status)`
- index on `(org_id, starts_at, ends_at)`
- index on `preferred_resource_id`

### `booking_assignments`
Purpose: resource assignments to bookings.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `booking_id UUID NOT NULL REFERENCES job_bookings(id)`
- `resource_id UUID NOT NULL REFERENCES resources(id)`
- `is_primary BOOLEAN NOT NULL DEFAULT false`
- `created_at TIMESTAMPTZ NOT NULL`

Constraints:
- unique `(booking_id, resource_id)`
- max one primary assignment per booking

Indexes:
- index on `booking_id`
- index on `resource_id`
- index on `org_id`
- partial unique index on `(booking_id)` where `is_primary = true`

### `booking_locks`
Purpose: explicit soft/hard lock windows.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `resource_id UUID NOT NULL REFERENCES resources(id)`
- `booking_id UUID NULL REFERENCES job_bookings(id)`
- `lock_type lock_type NOT NULL`
- `starts_at TIMESTAMPTZ NOT NULL`
- `ends_at TIMESTAMPTZ NOT NULL`
- `reason TEXT NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`

Constraints:
- check `ends_at > starts_at`

Indexes:
- index on `resource_id`
- index on `booking_id`
- index on `(resource_id, starts_at, ends_at)`
- index on `org_id`

---

## 3.8 Recurring engine

### `service_assets`
Purpose: installed/managed assets requiring service intervals.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `client_id UUID NOT NULL REFERENCES clients(id)`
- `client_site_id UUID NULL REFERENCES client_sites(id)`
- `job_id UUID NULL REFERENCES jobs(id)`
- `asset_type TEXT NOT NULL`
- `manufacturer TEXT NULL`
- `model TEXT NULL`
- `serial_number TEXT NULL`
- `installed_on DATE NULL`
- `status asset_status NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- unique `(org_id, serial_number)` where not null

Indexes:
- index on `org_id`
- index on `client_id`
- index on `job_id`

### `maintenance_schedules`
Purpose: recurring service interval definitions.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `asset_id UUID NULL REFERENCES service_assets(id)`
- `client_id UUID NOT NULL REFERENCES clients(id)`
- `title TEXT NOT NULL`
- `frequency schedule_frequency NOT NULL`
- `interval_days INTEGER NOT NULL`
- `amount_net_pence BIGINT NOT NULL`
- `next_due_date DATE NOT NULL`
- `last_completed_date DATE NULL`
- `is_active BOOLEAN NOT NULL DEFAULT true`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- check `interval_days > 0`
- check `amount_net_pence >= 0`

Indexes:
- index on `org_id`
- index on `asset_id`
- index on `client_id`
- index on `(org_id, next_due_date)`
- index on `(org_id, is_active)`

### `recurring_reminders`
Purpose: generated reminder queue from schedules.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `schedule_id UUID NOT NULL REFERENCES maintenance_schedules(id)`
- `client_id UUID NOT NULL REFERENCES clients(id)`
- `due_date DATE NOT NULL`
- `status notification_status NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- unique `(schedule_id, due_date)`

Indexes:
- index on `schedule_id`
- index on `client_id`
- index on `org_id`
- index on `(org_id, status)`

---

## 3.9 Portal, communication, assistant, notifications

### `portal_invites`
Purpose: tokenised client portal access.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `client_id UUID NOT NULL REFERENCES clients(id)`
- `token TEXT NOT NULL`
- `status portal_invite_status NOT NULL`
- `expires_at TIMESTAMPTZ NOT NULL`
- `created_by UUID NULL REFERENCES profiles(id)`
- `created_at TIMESTAMPTZ NOT NULL`

Constraints:
- unique `(token)`

Indexes:
- unique index on `token`
- index on `client_id`
- index on `org_id`
- index on `(org_id, status)`

### `conversation_threads`
Purpose: unified messaging thread model.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `thread_type thread_type NOT NULL`
- `client_id UUID NULL REFERENCES clients(id)`
- `job_id UUID NULL REFERENCES jobs(id)`
- `portal_invite_id UUID NULL REFERENCES portal_invites(id)`
- `subject TEXT NULL`
- `is_open BOOLEAN NOT NULL DEFAULT true`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- at least one context key among `client_id`, `job_id`, `portal_invite_id`

Indexes:
- index on `org_id`
- index on `client_id`
- index on `job_id`
- index on `(org_id, thread_type)`

### `conversation_messages`
Purpose: immutable thread message log.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `thread_id UUID NOT NULL REFERENCES conversation_threads(id)`
- `sender_type message_sender_type NOT NULL`
- `sender_profile_id UUID NULL REFERENCES profiles(id)`
- `content TEXT NOT NULL`
- `read_at TIMESTAMPTZ NULL`
- `created_at TIMESTAMPTZ NOT NULL`

Constraints:
- if `sender_type = ORG_USER`, `sender_profile_id` must be not null

Indexes:
- index on `thread_id`
- index on `org_id`
- index on `(thread_id, created_at)`

### `assistant_tasks`
Purpose: assistant-generated and human-managed tasks.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `job_id UUID NULL REFERENCES jobs(id)`
- `assigned_profile_id UUID NULL REFERENCES profiles(id)`
- `status assistant_task_status NOT NULL`
- `title TEXT NOT NULL`
- `description TEXT NULL`
- `priority INTEGER NOT NULL DEFAULT 3`
- `due_at TIMESTAMPTZ NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- check `priority between 1 and 5`

Indexes:
- index on `org_id`
- index on `job_id`
- index on `assigned_profile_id`
- index on `(org_id, status, due_at)`

### `assistant_conversations`
Purpose: AI conversation containers.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `profile_id UUID NOT NULL REFERENCES profiles(id)`
- `job_id UUID NULL REFERENCES jobs(id)`
- `title TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Indexes:
- index on `org_id`
- index on `profile_id`
- index on `job_id`

### `assistant_messages`
Purpose: immutable AI/user message history.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `conversation_id UUID NOT NULL REFERENCES assistant_conversations(id)`
- `sender_type message_sender_type NOT NULL`
- `content TEXT NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`

Indexes:
- index on `conversation_id`
- index on `org_id`

### `notification_events`
Purpose: notification intent records.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `client_id UUID NULL REFERENCES clients(id)`
- `job_id UUID NULL REFERENCES jobs(id)`
- `invoice_id UUID NULL REFERENCES invoices(id)`
- `event_type TEXT NOT NULL`
- `payload_json JSONB NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`

Indexes:
- index on `org_id`
- index on `job_id`
- index on `invoice_id`

### `notification_deliveries`
Purpose: channel-level delivery records.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `notification_event_id UUID NOT NULL REFERENCES notification_events(id)`
- `channel notification_channel NOT NULL`
- `status notification_status NOT NULL`
- `recipient TEXT NOT NULL`
- `provider_ref TEXT NULL`
- `scheduled_at TIMESTAMPTZ NULL`
- `sent_at TIMESTAMPTZ NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Indexes:
- index on `notification_event_id`
- index on `org_id`
- index on `(org_id, status, channel)`

---

## 3.10 Integrations, bank feed, webhooks, audit

### `accounting_connections`
Purpose: Xero connection records.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `provider integration_provider NOT NULL`
- `tenant_id TEXT NOT NULL`
- `access_token_ciphertext TEXT NOT NULL`
- `refresh_token_ciphertext TEXT NOT NULL`
- `expires_at TIMESTAMPTZ NOT NULL`
- `last_synced_at TIMESTAMPTZ NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- unique `(org_id, provider)`

Indexes:
- index on `org_id`
- index on `expires_at`

### `bank_connections`
Purpose: Plaid/bank connection records.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `provider integration_provider NOT NULL`
- `provider_account_ref TEXT NOT NULL`
- `access_token_ciphertext TEXT NOT NULL`
- `institution_name TEXT NULL`
- `last_synced_at TIMESTAMPTZ NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`

Constraints:
- unique `(org_id, provider, provider_account_ref)`

Indexes:
- index on `org_id`
- index on `last_synced_at`

### `bank_transactions`
Purpose: imported bank feed rows.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `bank_connection_id UUID NOT NULL REFERENCES bank_connections(id)`
- `provider_transaction_id TEXT NOT NULL`
- `posted_on DATE NOT NULL`
- `amount_pence BIGINT NOT NULL`
- `merchant_name TEXT NULL`
- `description TEXT NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`

Constraints:
- unique `(bank_connection_id, provider_transaction_id)`

Indexes:
- index on `org_id`
- index on `bank_connection_id`
- index on `(org_id, posted_on desc)`

### `webhook_events`
Purpose: raw provider webhook event log.

Columns:
- `id UUID PK`
- `org_id UUID NULL REFERENCES organisations(id)`
- `provider integration_provider NOT NULL`
- `provider_event_id TEXT NOT NULL`
- `status webhook_status NOT NULL`
- `signature_valid BOOLEAN NOT NULL`
- `payload_json JSONB NOT NULL`
- `received_at TIMESTAMPTZ NOT NULL`
- `processed_at TIMESTAMPTZ NULL`
- `failure_reason TEXT NULL`

Constraints:
- unique `(provider, provider_event_id)`

Indexes:
- unique index on `(provider, provider_event_id)`
- index on `org_id`
- index on `(provider, status)`

### `domain_events`
Purpose: internal event outbox/idempotency layer.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `aggregate_type TEXT NOT NULL`
- `aggregate_id UUID NOT NULL`
- `event_type TEXT NOT NULL`
- `idempotency_key TEXT NOT NULL`
- `payload_json JSONB NOT NULL`
- `status domain_event_status NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- `processed_at TIMESTAMPTZ NULL`

Constraints:
- unique `(idempotency_key)`

Indexes:
- unique index on `idempotency_key`
- index on `org_id`
- index on `(aggregate_type, aggregate_id)`
- index on `(status, created_at)`

### `audit_events`
Purpose: immutable change audit trail.

Columns:
- `id UUID PK`
- `org_id UUID NOT NULL REFERENCES organisations(id)`
- `actor_profile_id UUID NULL REFERENCES profiles(id)`
- `event_type audit_event_type NOT NULL`
- `entity_type TEXT NOT NULL`
- `entity_id UUID NOT NULL`
- `before_json JSONB NULL`
- `after_json JSONB NULL`
- `created_at TIMESTAMPTZ NOT NULL`

Indexes:
- index on `org_id`
- index on `(entity_type, entity_id)`
- index on `(org_id, created_at desc)`

### `background_job_runs`
Purpose: cron/worker execution tracking.

Columns:
- `id UUID PK`
- `org_id UUID NULL REFERENCES organisations(id)`
- `job_name TEXT NOT NULL`
- `status domain_event_status NOT NULL`
- `started_at TIMESTAMPTZ NOT NULL`
- `finished_at TIMESTAMPTZ NULL`
- `details_json JSONB NOT NULL DEFAULT '{}'`

Indexes:
- index on `job_name`
- index on `(status, started_at desc)`

---

## 4. Foreign Key Rules

1. Every child row with `org_id` must point to a parent row with the same org context.
2. Cross-org foreign keys are forbidden.
3. `quotes.client_id` must belong to the same org as the quote.
4. `jobs.source_quote_id` is mandatory and unique.
5. `invoices.job_id` is mandatory.
6. `invoice_line_items.source_job_line_item_id` is mandatory.
7. `payment_records.invoice_id` and `payment_records.job_id` are mandatory.
8. `ledger_entries` may reference quote/job/invoice/payment/expense/refund context, but each referenced row must belong to the same org.
9. `job_bookings` must reference a valid job and optional site/resource in the same org.
10. `portal_invites.client_id` must belong to the same org.

---

## 5. Constraint Rules

## 5.1 Monetary constraints
- All money columns are `BIGINT` pence.
- Money columns must be non-negative except signed ledger amounts.
- Gross = net + vat everywhere gross is stored.

## 5.2 Lineage constraints
- Quote can exist without job.
- Job cannot exist without accepted source quote.
- Invoice cannot exist without source job.
- Payment cannot exist without source invoice.

## 5.3 Immutability constraints
- `quote_snapshots`, `invoice_line_items`, `payment_events`, `refunds`, `ledger_entries`, `audit_events`, and `conversation_messages` are immutable after insert.

## 5.4 State-transition constraints
- Invoice and payment states must follow only the allowed transition maps defined in the contracts.
- Booking states must follow the allowed booking transition map:
  - `HELD -> CONFIRMED`
  - `HELD -> EXPIRED`
  - `HELD -> REJECTED`
  - `CONFIRMED -> COMPLETED`
  - `CONFIRMED -> CANCELLED`

No other booking transition is allowed.

---

## 6. Index Blueprint

## 6.1 Mandatory global indexes
Every org-owned business table must have:
- index on `org_id`
- index on `created_at` or primary workflow sort field if the table is time-ordered

## 6.2 Critical workflow indexes
- `quotes(org_id, status, created_at desc)`
- `jobs(org_id, status, target_start_date)`
- `invoices(org_id, status, due_date)`
- `payment_records(org_id, status)`
- `ledger_entries(org_id, category, effective_at desc)`
- `job_bookings(org_id, status, starts_at, ends_at)`
- `maintenance_schedules(org_id, next_due_date)`
- `webhook_events(provider, provider_event_id)` unique
- `domain_events(idempotency_key)` unique
- `portal_invites(token)` unique

---

## 7. RLS Blueprint

## 7.1 Session org resolution
Authoritative tenant scope is:
- `auth.uid()` -> `profiles.id` -> `profiles.org_id`

## 7.2 Standard org-owned tables
Tables using standard authenticated RLS:
- `organisations`
- `profiles`
- `organisation_settings`
- `organisation_terms`
- `goals`
- `clients`
- `client_sites`
- `quote_templates`
- `quote_template_sections`
- `quote_template_line_items`
- `quotes`
- `quote_sections`
- `quote_line_items`
- `quote_upsells`
- `quote_snapshots`
- `jobs`
- `job_line_items`
- `variations`
- `job_materials`
- `job_notes`
- `job_photos`
- `job_timeline`
- `invoices`
- `invoice_line_items`
- `expenses`
- `expense_receipts`
- `resources`
- `resource_skills`
- `resource_availability`
- `job_bookings`
- `booking_assignments`
- `booking_locks`
- `service_assets`
- `maintenance_schedules`
- `recurring_reminders`
- `conversation_threads`
- `assistant_tasks`
- `assistant_conversations`
- `assistant_messages`
- `notification_events`
- `notification_deliveries`
- `accounting_connections`
- `bank_connections`
- `bank_transactions`

Policy model:
- `SELECT`: allowed where `row.org_id = session_org_id`
- `INSERT`: allowed where `new.org_id = session_org_id`
- `UPDATE`: allowed where `row.org_id = session_org_id`
- `DELETE`: allowed only for mutable business tables where delete is permitted by domain rules

## 7.3 Append-only / restricted tables
Tables that users may read but may not update/delete:
- `payment_events`
- `refunds`
- `disputes`
- `payment_holds`
- `payout_releases`
- `ledger_entries`
- `conversation_messages`
- `webhook_events`
- `domain_events`
- `audit_events`
- `background_job_runs`

Policy model:
- authenticated `SELECT` where `row.org_id = session_org_id` if row is org-scoped
- no authenticated `UPDATE`
- no authenticated `DELETE`
- `INSERT` only via service-role/backend workflow where appropriate

## 7.4 Public access rules
1. No direct public policy on `quotes`.
2. No direct public policy on `portal_invites`.
3. No direct public policy on `conversation_threads` or `conversation_messages`.
4. Public quote and portal reads must happen through validated server-side token flows only.

## 7.5 Service-role-only tables/paths
Primary service-role write surfaces:
- `webhook_events`
- `payment_events`
- `refunds`
- `disputes`
- `ledger_entries`
- `domain_events`
- `audit_events`
- `background_job_runs`

---

## 8. Transaction Boundary Blueprint

## 8.1 Quote acceptance transaction
Atomic writes:
1. validate quote state = `SENT`
2. create `quote_snapshots`
3. update `quotes.status` to `ACCEPTED`
4. insert `ledger_entries` row for `COMMITTED_REVENUE`
5. insert `domain_events`
6. insert `audit_events`

## 8.2 Quote-to-job conversion transaction
Atomic writes:
1. validate quote state = `ACCEPTED`
2. create `jobs`
3. copy `job_line_items`
4. create `job_materials` where needed
5. insert `job_timeline`
6. insert `audit_events`

## 8.3 Invoice issue transaction
Atomic writes:
1. validate job lineage
2. create `invoices`
3. copy `invoice_line_items`
4. update invoice status to `SENT`
5. insert `audit_events`

No ledger write is permitted in this transaction.

## 8.4 Payment attempt creation transaction
Atomic writes:
1. validate invoice state and balance due
2. create `payment_records` in `PENDING`
3. insert `domain_events` or provider intent metadata record
4. insert `audit_events`

No ledger write is permitted in this transaction.

## 8.5 Payment success webhook transaction
Atomic writes:
1. verify webhook signature
2. upsert `webhook_events`
3. validate idempotency against `payment_events`/`domain_events`
4. update `payment_records` to `SUCCEEDED`
5. update invoice paid totals and derived invoice state
6. insert two `ledger_entries` rows:
   - `RECOGNISED_REVENUE`
   - `VAT`
7. insert `payment_events`
8. insert `audit_events`

## 8.6 Expense confirmation transaction
Atomic writes:
1. validate expense payload
2. create or confirm `expenses`
3. insert one or two `ledger_entries` rows:
   - `EXPENSE`
   - optional `VAT`
4. insert `audit_events`

## 8.7 Refund webhook transaction
Atomic writes:
1. verify refund event
2. upsert `webhook_events`
3. insert `refunds`
4. update `payment_records`
5. update invoice refund totals and derived state
6. insert two `ledger_entries` rows:
   - negative `RECOGNISED_REVENUE`
   - negative `VAT`
7. insert `payment_events`
8. insert `audit_events`

## 8.8 Booking hold transaction
Atomic writes:
1. validate resource availability
2. validate no overlapping hard lock
3. create `job_bookings` in `HELD`
4. create `booking_assignments`
5. create any `booking_locks`
6. insert `audit_events`

## 8.9 Booking confirm transaction
Atomic writes:
1. validate booking is `HELD`
2. validate payment gate if required
3. update booking to `CONFIRMED`
4. create or update hard lock rows
5. insert `audit_events`

---

## 9. Migration Order Blueprint

## Migration 00100 — Core enums and tenancy
Creates:
- all enums
- `organisations`
- `profiles`
- `organisation_settings`
- `organisation_terms`
- `goals`

## Migration 00101 — CRM and client sites
Creates:
- `clients`
- `client_sites`

## Migration 00102 — Quote engine
Creates:
- `quote_templates`
- `quote_template_sections`
- `quote_template_line_items`
- `quotes`
- `quote_sections`
- `quote_line_items`
- `quote_upsells`
- `quote_snapshots`

## Migration 00103 — Resource and scheduling foundation
Creates:
- `resources`
- `resource_skills`
- `resource_availability`
- `job_bookings`
- `booking_assignments`
- `booking_locks`

## Migration 00104 — Job engine
Creates:
- `jobs`
- `job_line_items`
- `variations`
- `job_materials`
- `job_notes`
- `job_photos`
- `job_timeline`

## Migration 00105 — Invoice engine
Creates:
- `invoices`
- `invoice_line_items`

## Migration 00106 — Payment engine and payment protect
Creates:
- `payment_records`
- `payment_events`
- `refunds`
- `disputes`
- `payment_holds`
- `payout_releases`

## Migration 00107 — Expense engine and canonical ledger
Creates:
- `expenses`
- `expense_receipts`
- `ledger_entries`

## Migration 00108 — Recurring engine
Creates:
- `service_assets`
- `maintenance_schedules`
- `recurring_reminders`

## Migration 00109 — Portal, communications, assistant, notifications
Creates:
- `portal_invites`
- `conversation_threads`
- `conversation_messages`
- `assistant_tasks`
- `assistant_conversations`
- `assistant_messages`
- `notification_events`
- `notification_deliveries`

## Migration 00110 — Integrations and bank feed
Creates:
- `accounting_connections`
- `bank_connections`
- `bank_transactions`

## Migration 00111 — Webhooks, domain events, audit, background runs
Creates:
- `webhook_events`
- `domain_events`
- `audit_events`
- `background_job_runs`

## Migration 00112 — Index pack, RLS enablement, policy pack
Applies:
- indexes
- append-only restrictions
- RLS enablement
- authenticated org policies
- service-role restrictions

## Migration 00113 — Contract validation pack
Applies:
- derived-state validation constraints
- immutability triggers/policies
- transaction guard functions

---

## 10. Explicit Exclusions from the Rebuild Baseline

These legacy structures are not part of the authoritative v3 baseline:
- `job_wallet_ledger`
- `job_wallets`
- generic public quote table policies
- generic public portal invite table policies
- mixed revenue category spellings
- placeholder integration log tables without contracts

---

## 11. Final Build Rule

The schema rebuild must follow this order of truth:

1. Locked system contracts
2. This schema blueprint
3. Migration order above

The current implementation is not the source of truth for the rebuild.