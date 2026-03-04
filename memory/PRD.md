# Tradelife V2 — PRD

## Original Problem Statement
Fix Vercel build failure for commit e0776c2 caused by missing `@supabase/supabase-js` package. Tasks:
1. Install `@supabase/supabase-js` and `@supabase/ssr`
2. Verify both in `package.json` dependencies
3. Remove Next.js rewrites/proxy from `next.config.mjs` (native Vercel deployment)

## Architecture
- **Framework:** Next.js 14 (App Router)
- **Deployment:** Vercel (native)
- **Backend:** Supabase (BaaS)
- **UI:** Radix UI + Tailwind CSS + shadcn/ui components
- **Repo:** tradelife-org/Tradelife-v2

## What's Been Implemented (Jan 2026)
- [x] Installed `@supabase/supabase-js` ^2.98.0 and `@supabase/ssr` ^0.9.0 in root `package.json`
- [x] Verified `next.config.js` is clean (no rewrites/proxy)
- [x] Fixed root `tsconfig.json` — `@/*` alias now points to `./frontend/*`
- [x] Created `vercel.json` — framework: nextjs, build/install target `frontend/`, output `frontend/.next`
- [x] Deleted root duplicate folders: `app/`, `components/`, `hooks/`, `lib/`
- [x] Removed root config duplicates: `next.config.js`, `tailwind.config.js`, `postcss.config.js`
- [x] Confirmed `NEXT_PUBLIC_SITE_URL=https://tradelife.app` (no localhost leakage)
- [x] Build verified: `frontend/` builds pass cleanly (exit code 0, all routes compiled)

## Known Issues
- None blocking.

## Backlog
- **P0:** Quote lifecycle: SEND button, EDIT/DELETE, `/quotes/[id]` detail page (dead route)
- **P0:** Wire up clients CRUD (currently `client_id` is always NULL)
- **P1:** Job conversion pipeline (ACCEPTED quote → Job)
- **P1:** "Save as Template" button in quote section UI
- **P1:** Invoice generation from Job
- **P2:** Role-based access control (currently TEXT column, no enforcement)
- **P2:** Money pots / Profit First UI (Settings page)
- **P2:** Integration wiring: Stripe, Xero, Google Calendar
- **P2:** Remove orphaned `dashboard.ts` server action (duplicated by client-side fetch)
