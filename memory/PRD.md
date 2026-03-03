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
- [x] No `next.config.mjs` existed — nothing to remove
- [x] Fixed root `tsconfig.json` — `@/*` alias now points to `./frontend/*`
- [x] Created `vercel.json` — build/install commands target `frontend/`, output from `frontend/.next`
- [x] Build verified: both root and `frontend/` builds pass cleanly (exit code 0)

## Known Issues
- None blocking. Lockfile patch warning is non-fatal.

## Backlog
- **P1:** Consider consolidating dual-directory structure (root `app/` vs `frontend/app/`) into single `frontend/` for cleaner architecture
- **P2:** Add Vercel build caching / optimization
- **P2:** Clean up root `app/`, `components/`, `hooks/`, `lib/` duplicates if they're no longer needed
