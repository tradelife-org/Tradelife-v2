# TradeLife v3 — Migration Specification Pack

## Status
- This pack is derived from the revised locked schema blueprint in `/app/memory/TRADELIFE_V3_SCHEMA_BLUEPRINT.md`.
- It is the **authoritative structural migration plan** for the v3 rebuild.
- It is intentionally **not SQL**. It defines dependency order, staged creation strategy, constraints, RLS intent, and validation goals only.

---

## 1. Global Migration Strategy

### 1.1 Migration philosophy
1. Build from clean baseline only.
2. Create enums before any dependent tables.
3. Create root tenancy tables before org-scoped tables.
4. Create parent tables before child tables wherever possible.
5. Resolve unavoidable cycles with staged FK application.
6. Apply RLS only after base tables and primary foreign keys exist.
7. Apply advanced validation, immutability, and deferred cross-table integrity checks only in the final validation pack.

### 1.2 Constraint application order
Per migration group, constraints must be applied in this order:
1. Primary keys
2. Required non-null columns
3. simple check constraints
4. parent-first foreign keys
5. unique constraints / partial uniques
6. non-circular secondary foreign keys
7. indexes
8. RLS enablement intent
9. advanced validation / deferred consistency rules later in the validation pack

### 1.3 RLS application rule
RLS is **not** enabled during the first creation step for each table cluster.
RLS is enabled in a dedicated late migration after:
- tables exist
- base foreign keys exist
- indexes exist
- tenant lookup strategy is settled

### 1.4 Legacy replacement scope
The migration plan explicitly replaces these legacy structures:
- `job_wallet_ledger`
- `job_wallets`

Replacement strategy:
1. Do not recreate them in the clean v3 baseline.
2. Replace them with:
   - `ledger_entries`
3. If temporary compatibility is needed during cutover, compatibility views may be added after the new schema is live, but they are out of scope for the clean baseline migration set.

---

## 2. Circular Dependency Analysis and Resolution Strategy

## 2.1 Cycle A — `quotes.accepted_snapshot_id` <-> `quote_snapshots.quote_id`

### Cycle
- `quotes` wants `accepted_snapshot_id -> quote_snapshots.id`
- `quote_snapshots` wants `quote_id -> quotes.id`

### Resolution
Use **staged FK application**.

### Correct creation strategy
1. Create `quotes` first with `accepted_snapshot_id` column present but **without** the foreign key.
2. Create `quote_snapshots` with FK to `quotes(id)`.
3. After `quote_snapshots` exists, add the FK from `quotes.accepted_snapshot_id -> quote_snapshots.id`.

### Why this is the chosen strategy
- It preserves the final intended schema.
- It avoids fake nullable-first redesigns.
- It keeps quote snapshot linkage explicit and authoritative.

## 2.2 Cycle B — cross-org child/parent consistency

### Issue
Many child tables reference parent rows and also carry `org_id`. Standard FKs do not guarantee that child and parent belong to the same org.

### Resolution
Use **deferred validation triggers / constraint functions** in the validation pack.

### Correct creation strategy
1. Create standard FK to parent PK first.
2. Add deferred org-consistency validation later for critical relationships.

### Critical relationships needing deferred org-consistency validation
- `profiles.org_id -> organisations.id`
- `clients.org_id`, `client_sites.org_id`
- `quotes.org_id`, `quotes.client_id`, `quotes.client_site_id`
- `quote_sections.org_id`, `quote_line_items.org_id`
- `jobs.org_id`, `jobs.source_quote_id`, `jobs.client_id`
- `job_line_items.org_id`, `variations.org_id`, `job_materials.org_id`
- `invoices.org_id`, `invoices.job_id`, `invoices.client_id`
- `payment_records.org_id`, `payment_records.invoice_id`, `payment_records.job_id`
- `refunds.org_id`, `disputes.org_id`
- `ledger_entries.org_id` with any referenced entity ids
- `job_bookings.org_id`, `booking_assignments.org_id`, `booking_locks.org_id`
- `maintenance_schedules.org_id`, `portal_invites.org_id`, `conversation_threads.org_id`

## 2.3 Cycle C — scheduling preference dependency

### Issue
- `jobs.preferred_resource_id` references `resources.id`
- `resources.profile_id` references `profiles.id`

### Resolution
No true cycle if resources are created before jobs.

### Correct creation strategy
1. Create `profiles`
2. Create `resources`
3. Create `jobs`

## 2.4 Cycle D — ledger references many domains

### Issue
`ledger_entries` references quote/job/invoice/payment/expense/refund tables.

### Resolution
Create `ledger_entries` only after all finance domain parents exist.

### Correct creation strategy
1. Create quotes/jobs/invoices/payments/refunds/expenses first.
2. Create `ledger_entries` afterwards.

---

## 3. Exact Migration Dependency Order

1. `00100_core_enums_and_tenancy`
2. `00101_crm_and_client_sites`
3. `00102_quote_engine_core`
4. `00103_resource_and_scheduling_foundation`
5. `00104_job_engine`
6. `00105_invoice_engine`
7. `00106_payment_engine_and_payment_protect`
8. `00107_expense_engine_and_canonical_ledger`
9. `00108_recurring_engine`
10. `00109_portal_communications_assistant_notifications`
11. `00110_integrations_and_bank_feed`
12. `00111_webhooks_domain_events_audit_background_runs`
13. `00112_indexes_and_rls_pack`
14. `00113_validation_immutability_and_transition_guards`

This order is mandatory.

---

## 4. Migration-by-Migration Structural Specification

## Migration 00100 — Core enums and tenancy

### Depends on
- none

### Enums created in this migration
- `profile_role`
- `trade_type`
- `quote_status`
- `quote_line_type`
- `job_status`
- `job_line_status`
- `variation_status`
- `invoice_type`
- `invoice_status`
- `payment_provider`
- `payment_status`
- `dispute_status`
- `hold_status`
- `expense_status`
- `ledger_category`
- `ledger_event_type`
- `resource_status`
- `booking_status`
- `booking_type`
- `lock_type`
- `asset_status`
- `schedule_frequency`
- `portal_invite_status`
- `thread_type`
- `message_sender_type`
- `assistant_task_status`
- `notification_channel`
- `notification_status`
- `integration_provider`
- `webhook_status`
- `domain_event_status`
- `audit_event_type`

### Table creation order
1. `organisations`
2. `profiles`
3. `organisation_settings`
4. `organisation_terms`
5. `goals`

### Foreign keys applied here
- `profiles.org_id -> organisations.id`
- `profiles.id -> auth.users.id`
- `organisation_settings.org_id -> organisations.id`
- `organisation_terms.org_id -> organisations.id`
- `goals.org_id -> organisations.id`

### Check constraints applied here
- `organisations.currency_code = 'GBP'`
- `organisations.margin_floor_basis_points between 0 and 10000`
- `organisation_settings.default_vat_basis_points between 0 and 10000`
- `organisation_settings.invoice_payment_terms_days >= 0`
- non-negative goal money values

### Unique constraints applied here
- `profiles (org_id, email)`
- `organisation_settings (org_id)` unique
- partial uniqueness for default organisation terms
- `goals (org_id, month_start)`

### RLS intent
- Org-scoped authenticated access only.
- No public access.

### Validation goals
- Prove a tenant root can exist independently.
- Prove profile tenancy binding is stable and singular.
- Prove org settings and goals are one-to-many / one-to-one as designed.

---

## Migration 00101 — CRM and client sites

### Depends on
- `00100_core_enums_and_tenancy`

### Enums in this migration
- none

### Table creation order
1. `clients`
2. `client_sites`

### Foreign keys applied here
- `clients.org_id -> organisations.id`
- `client_sites.org_id -> organisations.id`
- `client_sites.client_id -> clients.id`

### Check constraints applied here
- none beyond structural non-null requirements

### Unique constraints applied here
- `clients (org_id, stripe_customer_id)` partial unique where not null
- `clients (org_id, xero_contact_id)` partial unique where not null
- partial unique one default site per client

### RLS intent
- Authenticated org-scoped CRUD only.

### Validation goals
- Prove client master data can exist before quotes/jobs.
- Prove site records hang from clients correctly.

---

## Migration 00102 — Quote engine core

### Depends on
- `00101_crm_and_client_sites`

### Enums in this migration
- none

### Table creation order
1. `quote_templates`
2. `quote_template_sections`
3. `quote_template_line_items`
4. `quotes` (with `accepted_snapshot_id` column present, but FK deferred)
5. `quote_sections`
6. `quote_line_items`
7. `quote_upsells`
8. `quote_snapshots`
9. staged FK application: `quotes.accepted_snapshot_id -> quote_snapshots.id`

### Foreign keys applied immediately
- `quote_templates.org_id -> organisations.id`
- `quote_templates.created_by -> profiles.id`
- `quote_template_sections.template_id -> quote_templates.id`
- `quote_template_sections.org_id -> organisations.id`
- `quote_template_line_items.template_section_id -> quote_template_sections.id`
- `quote_template_line_items.org_id -> organisations.id`
- `quotes.org_id -> organisations.id`
- `quotes.client_id -> clients.id`
- `quotes.client_site_id -> client_sites.id`
- `quotes.created_by -> profiles.id`
- `quote_sections.quote_id -> quotes.id`
- `quote_sections.org_id -> organisations.id`
- `quote_line_items.quote_id -> quotes.id`
- `quote_line_items.quote_section_id -> quote_sections.id`
- `quote_line_items.org_id -> organisations.id`
- `quote_upsells.quote_id -> quotes.id`
- `quote_upsells.org_id -> organisations.id`
- `quote_snapshots.quote_id -> quotes.id`
- `quote_snapshots.org_id -> organisations.id`

### Foreign keys deferred to staged application
- `quotes.accepted_snapshot_id -> quote_snapshots.id`

### Check constraints applied here
- VAT basis points ranges
- non-negative quote money values
- `quote_amount_gross_pence = quote_amount_net_pence + quote_amount_vat_pence`
- non-negative section totals
- line quantity > 0
- line cost and amount non-negative
- snapshot gross = net + VAT

### Unique constraints applied here
- `quote_templates (org_id, name)`
- `quote_template_sections (template_id, sort_order)`
- `quote_template_line_items (template_section_id, sort_order)`
- `quotes (org_id, reference)`
- `quotes (share_token)`
- `quote_sections (quote_id, sort_order)`
- `quote_line_items (quote_section_id, sort_order)`
- `quote_upsells (quote_id, sort_order)`
- `quote_snapshots (quote_id)` unique

### RLS intent
- Authenticated org-scoped CRUD for live quote structures.
- Quote snapshots are authenticated org-readable only.
- No direct public quote table access.

### Validation goals
- Prove full quote structure can be created without jobs.
- Prove accepted snapshot cycle is resolved correctly.
- Prove quote itemisation is structurally complete before job conversion.

---

## Migration 00103 — Resource and scheduling foundation

### Depends on
- `00100_core_enums_and_tenancy`

### Enums in this migration
- none

### Table creation order
1. `resources`
2. `resource_skills`
3. `resource_availability`
4. `job_bookings`
5. `booking_assignments`
6. `booking_locks`

### Special strategy note
`job_bookings` is created in this migration before `jobs` exists only if `job_id` FK is staged later.

### Preferred strategy
Do **not** create `job_bookings` in 00103 if `job_id` is mandatory and no placeholder strategy is desired.

### Final chosen strategy
Split the practical application as follows:
- create `resources`, `resource_skills`, `resource_availability` in `00103`
- create `job_bookings`, `booking_assignments`, `booking_locks` in `00104` after `jobs`

### Therefore actual table creation order for 00103
1. `resources`
2. `resource_skills`
3. `resource_availability`

### Foreign keys applied here
- `resources.org_id -> organisations.id`
- `resources.profile_id -> profiles.id`
- `resource_skills.org_id -> organisations.id`
- `resource_skills.resource_id -> resources.id`
- `resource_availability.org_id -> organisations.id`
- `resource_availability.resource_id -> resources.id`

### Check constraints applied here
- `resource_availability.ends_at > starts_at`

### Unique constraints applied here
- `resources (org_id, label)`
- `resources (profile_id)` partial/unique where not null
- `resource_skills (resource_id, trade_type)`

### RLS intent
- Authenticated org-scoped CRUD only.

### Validation goals
- Prove schedulable resources exist independently of jobs.
- Prove resource/profile and skill mappings are stable.

---

## Migration 00104 — Job engine

### Depends on
- `00102_quote_engine_core`
- `00103_resource_and_scheduling_foundation`

### Enums in this migration
- none

### Table creation order
1. `jobs`
2. `job_line_items`
3. `variations`
4. `job_materials`
5. `job_notes`
6. `job_photos`
7. `job_timeline`
8. `job_bookings`
9. `booking_assignments`
10. `booking_locks`

### Foreign keys applied here
- `jobs.org_id -> organisations.id`
- `jobs.source_quote_id -> quotes.id`
- `jobs.client_id -> clients.id`
- `jobs.client_site_id -> client_sites.id`
- `jobs.preferred_resource_id -> resources.id`
- `jobs.created_by -> profiles.id`
- `job_line_items.job_id -> jobs.id`
- `job_line_items.org_id -> organisations.id`
- `job_line_items.source_quote_line_item_id -> quote_line_items.id`
- `variations.org_id -> organisations.id`
- `variations.job_id -> jobs.id`
- `variations.approved_by -> profiles.id`
- `variations.created_by -> profiles.id`
- `job_materials.org_id -> organisations.id`
- `job_materials.job_id -> jobs.id`
- `job_materials.source_job_line_item_id -> job_line_items.id`
- `job_notes.org_id -> organisations.id`
- `job_notes.job_id -> jobs.id`
- `job_notes.author_id -> profiles.id`
- `job_photos.org_id -> organisations.id`
- `job_photos.job_id -> jobs.id`
- `job_photos.uploaded_by -> profiles.id`
- `job_timeline.org_id -> organisations.id`
- `job_timeline.job_id -> jobs.id`
- `job_timeline.actor_profile_id -> profiles.id`
- `job_bookings.org_id -> organisations.id`
- `job_bookings.job_id -> jobs.id`
- `job_bookings.client_site_id -> client_sites.id`
- `job_bookings.preferred_resource_id -> resources.id`
- `job_bookings.locked_by_profile_id -> profiles.id`
- `booking_assignments.org_id -> organisations.id`
- `booking_assignments.booking_id -> job_bookings.id`
- `booking_assignments.resource_id -> resources.id`
- `booking_locks.org_id -> organisations.id`
- `booking_locks.resource_id -> resources.id`
- `booking_locks.booking_id -> job_bookings.id`

### Check constraints applied here
- job target date ordering
- job line quantity > 0
- variation gross = net + VAT
- material costs non-negative
- booking time windows `ends_at > starts_at`
- held booking requires `held_until`
- booking lock windows `ends_at > starts_at`

### Unique constraints applied here
- `jobs (source_quote_id)` unique
- `job_line_items (job_id, sort_order)`
- `job_bookings` uniqueness handled by business validation, not a simple unique key
- `booking_assignments (booking_id, resource_id)`
- partial unique one primary assignment per booking

### RLS intent
- Authenticated org-scoped CRUD.
- Job timeline should become append-only at validation stage.

### Validation goals
- Prove accepted quote converts to exactly one job.
- Prove line lineage quote -> job is maintained.
- Prove booking structures now depend on jobs, resolving the earlier pseudo-cycle.

---

## Migration 00105 — Invoice engine

### Depends on
- `00104_job_engine`

### Enums in this migration
- none

### Table creation order
1. `invoices`
2. `invoice_line_items`

### Foreign keys applied here
- `invoices.org_id -> organisations.id`
- `invoices.job_id -> jobs.id`
- `invoices.client_id -> clients.id`
- `invoices.created_by -> profiles.id`
- `invoice_line_items.invoice_id -> invoices.id`
- `invoice_line_items.org_id -> organisations.id`
- `invoice_line_items.source_job_line_item_id -> job_line_items.id`

### Check constraints applied here
- invoice gross = net + VAT
- non-negative paid/refunded/balance values
- due date >= issue date
- invoice line quantity > 0
- invoice line money non-negative

### Unique constraints applied here
- `invoices (org_id, invoice_number)`
- `invoice_line_items (invoice_id, sort_order)`

### RLS intent
- Authenticated org-scoped CRUD.
- Invoice line items become immutable at validation stage.

### Validation goals
- Prove invoice lineage job -> invoice is mandatory.
- Prove invoice structure exists before payments.

---

## Migration 00106 — Payment engine and Payment Protect

### Depends on
- `00105_invoice_engine`

### Enums in this migration
- none

### Table creation order
1. `payment_records`
2. `payment_events`
3. `refunds`
4. `disputes`
5. `payment_holds`
6. `payout_releases`

### Foreign keys applied here
- `payment_records.org_id -> organisations.id`
- `payment_records.invoice_id -> invoices.id`
- `payment_records.job_id -> jobs.id`
- `payment_events.org_id -> organisations.id`
- `payment_events.payment_id -> payment_records.id`
- `refunds.org_id -> organisations.id`
- `refunds.payment_id -> payment_records.id`
- `refunds.invoice_id -> invoices.id`
- `disputes.org_id -> organisations.id`
- `disputes.payment_id -> payment_records.id`
- `disputes.invoice_id -> invoices.id`
- `payment_holds.org_id -> organisations.id`
- `payment_holds.payment_id -> payment_records.id`
- `payment_holds.invoice_id -> invoices.id`
- `payout_releases.org_id -> organisations.id`
- `payout_releases.payment_hold_id -> payment_holds.id`
- `payout_releases.job_id -> jobs.id`

### Check constraints applied here
- payment money > 0 / >= 0 as applicable
- refund money > 0
- dispute money > 0
- hold and release arithmetic validity
- `currency_code = 'GBP'`

### Unique constraints applied here
- partial unique provider payment identifiers
- partial unique provider checkout session identifiers
- `payment_events (provider, provider_event_id)`
- `refunds (provider, provider_refund_id)`
- `disputes (provider, provider_dispute_id)`
- `payment_holds (payment_id)` unique

### RLS intent
- Users may read org-scoped payment state.
- User writes are limited.
- Provider event tables are service-role-written, user-readable where appropriate.

### Validation goals
- Prove invoice -> payment dependency is strict.
- Prove refund/dispute structures hang from payment truth.
- Prove hold/release structures remain outside canonical revenue ledger.

---

## Migration 00107 — Expense engine and canonical ledger

### Depends on
- `00106_payment_engine_and_payment_protect`

### Enums in this migration
- none

### Table creation order
1. `expenses`
2. `expense_receipts`
3. `ledger_entries`

### Foreign keys applied here
- `expenses.org_id -> organisations.id`
- `expenses.job_id -> jobs.id`
- `expenses.confirmed_by -> profiles.id`
- `expense_receipts.org_id -> organisations.id`
- `expense_receipts.expense_id -> expenses.id`
- `ledger_entries.org_id -> organisations.id`
- `ledger_entries.quote_id -> quotes.id`
- `ledger_entries.job_id -> jobs.id`
- `ledger_entries.invoice_id -> invoices.id`
- `ledger_entries.payment_id -> payment_records.id`
- `ledger_entries.expense_id -> expenses.id`
- `ledger_entries.refund_id -> refunds.id`

### Check constraints applied here
- expense gross = net + VAT
- expense confirmation state consistency
- ledger `currency_code = 'GBP'`
- ledger `amount_pence <> 0`

### Unique constraints applied here
- `expense_receipts (storage_path)`
- `ledger_entries (idempotency_key)`

### RLS intent
- Expenses are authenticated org-scoped CRUD until confirmed.
- Ledger is append-only and read-only to authenticated org users.
- Ledger writes are backend/service controlled.

### Validation goals
- Prove ledger is created only after all referenced finance parents exist.
- Prove the revised canonical categories can be enforced by validation logic later.
- Prove expenses and receipts are first-class entities before ledger posting.

---

## Migration 00108 — Recurring engine

### Depends on
- `00104_job_engine`
- `00101_crm_and_client_sites`

### Enums in this migration
- none

### Table creation order
1. `service_assets`
2. `maintenance_schedules`
3. `recurring_reminders`

### Foreign keys applied here
- `service_assets.org_id -> organisations.id`
- `service_assets.client_id -> clients.id`
- `service_assets.client_site_id -> client_sites.id`
- `service_assets.job_id -> jobs.id`
- `maintenance_schedules.org_id -> organisations.id`
- `maintenance_schedules.asset_id -> service_assets.id`
- `maintenance_schedules.client_id -> clients.id`
- `recurring_reminders.org_id -> organisations.id`
- `recurring_reminders.schedule_id -> maintenance_schedules.id`
- `recurring_reminders.client_id -> clients.id`

### Check constraints applied here
- `interval_days > 0`
- `amount_net_pence >= 0`

### Unique constraints applied here
- partial unique serial number by org where present
- `recurring_reminders (schedule_id, due_date)`

### RLS intent
- Authenticated org-scoped CRUD.

### Validation goals
- Prove recurring engine hangs from clients/assets/jobs correctly.

---

## Migration 00109 — Portal, communications, assistant, notifications

### Depends on
- `00104_job_engine`
- `00101_crm_and_client_sites`

### Enums in this migration
- none

### Table creation order
1. `portal_invites`
2. `conversation_threads`
3. `conversation_messages`
4. `assistant_tasks`
5. `assistant_conversations`
6. `assistant_messages`
7. `notification_events`
8. `notification_deliveries`

### Foreign keys applied here
- `portal_invites.org_id -> organisations.id`
- `portal_invites.client_id -> clients.id`
- `portal_invites.created_by -> profiles.id`
- `conversation_threads.org_id -> organisations.id`
- `conversation_threads.client_id -> clients.id`
- `conversation_threads.job_id -> jobs.id`
- `conversation_threads.portal_invite_id -> portal_invites.id`
- `conversation_messages.org_id -> organisations.id`
- `conversation_messages.thread_id -> conversation_threads.id`
- `conversation_messages.sender_profile_id -> profiles.id`
- `assistant_tasks.org_id -> organisations.id`
- `assistant_tasks.job_id -> jobs.id`
- `assistant_tasks.assigned_profile_id -> profiles.id`
- `assistant_conversations.org_id -> organisations.id`
- `assistant_conversations.profile_id -> profiles.id`
- `assistant_conversations.job_id -> jobs.id`
- `assistant_messages.org_id -> organisations.id`
- `assistant_messages.conversation_id -> assistant_conversations.id`
- `notification_events.org_id -> organisations.id`
- `notification_events.client_id -> clients.id`
- `notification_events.job_id -> jobs.id`
- `notification_events.invoice_id -> invoices.id`
- `notification_deliveries.org_id -> organisations.id`
- `notification_deliveries.notification_event_id -> notification_events.id`

### Check constraints applied here
- conversation thread requires at least one context key
- `ORG_USER` messages require `sender_profile_id`
- assistant task priority range

### Unique constraints applied here
- `portal_invites (token)`

### RLS intent
- Authenticated org-scoped reads/writes for internal thread/task models.
- No direct public RLS on portal tables.
- Public portal flows must be server-validated only.

### Validation goals
- Prove portal access structures are tokenisable without public table exposure.
- Prove thread/message system is unified and append-only-capable.

---

## Migration 00110 — Integrations and bank feed

### Depends on
- `00100_core_enums_and_tenancy`

### Enums in this migration
- none

### Table creation order
1. `accounting_connections`
2. `bank_connections`
3. `bank_transactions`

### Foreign keys applied here
- `accounting_connections.org_id -> organisations.id`
- `bank_connections.org_id -> organisations.id`
- `bank_transactions.org_id -> organisations.id`
- `bank_transactions.bank_connection_id -> bank_connections.id`

### Check constraints applied here
- none beyond structural money/timestamp sanity

### Unique constraints applied here
- `accounting_connections (org_id, provider)`
- `bank_connections (org_id, provider, provider_account_ref)`
- `bank_transactions (bank_connection_id, provider_transaction_id)`

### RLS intent
- Authenticated org-scoped read access.
- Secret-bearing writes are backend/service controlled.

### Validation goals
- Prove integrations remain tenant-isolated.

---

## Migration 00111 — Webhooks, domain events, audit, background runs

### Depends on
- `00106_payment_engine_and_payment_protect`
- `00107_expense_engine_and_canonical_ledger`
- `00110_integrations_and_bank_feed`

### Enums in this migration
- none

### Table creation order
1. `webhook_events`
2. `domain_events`
3. `audit_events`
4. `background_job_runs`

### Foreign keys applied here
- `webhook_events.org_id -> organisations.id` nullable
- `domain_events.org_id -> organisations.id`
- `audit_events.org_id -> organisations.id`
- `audit_events.actor_profile_id -> profiles.id`
- `background_job_runs.org_id -> organisations.id` nullable

### Check constraints applied here
- none beyond structural non-null requirements

### Unique constraints applied here
- `webhook_events (provider, provider_event_id)`
- `domain_events (idempotency_key)`

### RLS intent
- Mostly service-role write surfaces.
- Readable by authenticated org users where operationally needed.
- Immutable after insert/update-to-processed boundary, then append-only in effect.

### Validation goals
- Prove idempotency and audit scaffolding exist before final validation pack.

---

## Migration 00112 — Indexes and RLS pack

### Depends on
- all prior migrations

### Enums in this migration
- none

### Structural application order
1. Add all non-PK indexes
2. Enable RLS on all org-owned tables
3. Apply authenticated org-scoped policies
4. Apply append-only read policies for immutable tables
5. Apply service-role write intent for webhook/audit/domain event tables

### RLS intent by class

#### Standard authenticated org-scoped CRUD
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

#### Authenticated read / restricted write
- `conversation_messages`
- `job_timeline`
- `expenses`
- `expense_receipts`
- `payment_records`
- `payment_events`
- `refunds`
- `disputes`
- `payment_holds`
- `payout_releases`
- `ledger_entries`
- `webhook_events`
- `domain_events`
- `audit_events`
- `background_job_runs`

#### Explicit public-access prohibition
- `quotes`
- `portal_invites`
- `conversation_threads`
- `conversation_messages`

### Validation goals
- Prove every org-owned table has an intended RLS posture.
- Prove no broad public table policy is required anywhere.

---

## Migration 00113 — Validation, immutability, and transition guards

### Depends on
- all prior migrations

### Enums in this migration
- none

### Structural application order
1. Add deferred org-consistency validation layer
2. Add append-only enforcement for immutable tables
3. Add state-transition guards for invoices, payments, bookings
4. Add ledger category/event validation rules
5. Add transaction-boundary support functions/guards

### Deferred org-consistency validation goals
Enforce same-org relationships for critical child/parent pairs listed in Section 2.2.

### Immutability targets
- `quote_snapshots`
- `invoice_line_items`
- `payment_events`
- `refunds`
- `ledger_entries`
- `conversation_messages`
- `audit_events`

### State-transition guard goals
- invoice states follow the locked transition map only
- payment states follow the locked transition map only
- booking states follow the locked transition map only

### Revised ledger validation goals
Enforce these exact rules:
- `COMMITTED_REVENUE`
  - only allowed for `QUOTE_ACCEPTED`
  - amount must be positive
- `RECOGNISED_REVENUE`
  - only allowed for `PAYMENT_SUCCEEDED` and `PAYMENT_REFUNDED`
  - positive on success
  - negative on refund
- `EXPENSE`
  - only allowed for `EXPENSE_CONFIRMED`
  - amount must be negative
- `VAT_OUTPUT`
  - only allowed for `PAYMENT_SUCCEEDED` and `PAYMENT_REFUNDED`
  - positive on success
  - negative on refund
- `VAT_INPUT`
  - only allowed for `EXPENSE_CONFIRMED`
  - amount must be negative

### Transaction boundary validation goals
Support atomic enforcement for:
- quote acceptance
- quote-to-job conversion
- invoice issue
- payment attempt creation
- payment success processing
- expense confirmation
- refund processing
- booking hold
- booking confirmation

---

## 5. Validation Checklist for the Finished Migration Set

1. Fresh database boot completes in exact order `00100 -> 00113`.
2. No migration references a table or enum that does not already exist.
3. The only staged circular-FK resolution is the quote / quote snapshot cycle.
4. No tenant table depends on public RLS exposure.
5. `ledger_entries` exists only after quotes, jobs, invoices, payments, refunds, and expenses exist.
6. Revised ledger categories are enforced structurally by the validation pack.
7. Legacy wallet tables are absent from the clean baseline.

---

## 6. Final Structural Rule

This migration specification pack is now the direct structural bridge between:

1. locked contracts
2. revised locked schema blueprint
3. future SQL migration authoring

SQL must follow this pack exactly.