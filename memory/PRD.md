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

## Known Issues
- Pre-existing: `@/components/app-shell` module not found from `frontend/app/` pages (tsconfig alias mismatch between root and frontend directory)

## Backlog
- **P0:** Fix `app-shell` tsconfig alias resolution for clean builds
- **P1:** Review dual-directory structure (`/app` root vs `/app/frontend`) — consolidate or configure Vercel root directory
- **P2:** Add Vercel build caching / optimization
