# TradeLife v3 Audit PRD

## Original Problem Statement
ACTIVATE: TradeLife v3 — Full System Audit Mode

Perform a full, deep structural + functional + architectural audit of the current TradeLife codebase against:
1. Current implementation (source of truth = codebase)
2. TradeLife OLD blueprint
3. TradeLife v3 MASTER blueprint

Audit targets included database layer, backend logic, state machines, financial engine correctness, Stripe, quote engine, scheduling, recurring logic, OCR, and AI system integrity.

## Architecture Decisions
- Treated the codebase itself as the only source of truth.
- Audited the app as a **Next.js + Supabase system**, with `/app/backend/server.py` recognised as a thin proxy, not the domain backend.
- Focused on migration definitions, server actions, route handlers, workers, and route/page wiring.
- Kept the task read-only from a product/runtime perspective; only audit artifacts were written into `/app/memory`.

## What’s Been Implemented
- Completed a repo-wide system audit and saved the detailed report to `/app/memory/TRADELIFE_V3_AUDIT.md`.
- Identified major failure zones: migration drift, public RLS leakage, incorrect revenue recognition, broken public quote acceptance, incomplete Stripe lifecycle, placeholder core modules, and missing DB objects used by live routes.
- Produced an ordered high-impact remediation backlog to move the system toward a production-safe v3 baseline.

## Prioritized Backlog

### P0
- Rebuild the database baseline to remove conflicting migrations (`job_wallet_ledger`, `quote_snapshots`) and establish one canonical schema.
- Lock down public RLS/service-role exposure (`quotes`, `portal_invites`, auth/me fallback, org_id-trusting routes).
- Reimplement the financial engine so revenue is recognised only on payment receipt and refunds/disputes are represented properly.
- Build verified Stripe webhook processing with idempotency and persisted payment events.
- Collapse duplicate quote send/accept/job conversion flows into one deterministic state machine.

### P1
- Replace placeholder quote creation, calendar, assistant, finance, jobs detail, and integration routes with working modules.
- Enforce quote → job → invoice lineage everywhere; remove orphan/manual side paths.
- Implement true scheduling states and conflict/resource logic.
- Unify OCR/expense ingestion into one receipt-confirmation-to-ledger pipeline.

### P2
- Build goal engine, owner pay engine, recurring reminders, Start My Day, notifications engine, and full audit trail.
- Replace mocked dashboard/AI surfaces with real live data.
- Expand automated testing around money, state transitions, and webhooks.

## Next Tasks
- If you want, the next execution step should be a **P0 remediation pass** starting with: schema rebuild plan, security lockdown, and ledger/payment redesign.
