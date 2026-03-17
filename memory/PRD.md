# Tradelife-v2 — PRD & Task Log

## Original Problem Statement
Clone https://github.com/tradelife-org/Tradelife-v2 and fix all build errors caused by merge corruption. Focus on duplicate supabase declarations, duplicate createClient definitions, and broken JSX in onboarding and signup. Do not redesign anything. Make the build pass.

## Architecture
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Auth/DB**: Supabase (SSR + client)
- **Integrations**: Stripe, Twilio, Xero, Plaid, OpenAI, Google Gemini
- **Deploy target**: Vercel

## What Was Implemented (Jan 2026)

### Build Fixes — Merge Corruption Cleanup
1. **`app/api/webhooks/stripe/route.ts`** — Removed duplicate `const supabase` module-level declaration
2. **`app/api/webhooks/twilio/recording/route.ts`** — Removed duplicate `const supabase` module-level declaration
3. **`app/api/quotes/accept/route.ts`** — Removed duplicate `const supabase` module-level declaration, moved client creation inside handler
4. **`lib/supabase/server.ts`** — Renamed import `createClient` → `createSupabaseClient` to avoid collision with exported `createClient()` function; fixed `createServiceRoleClient` to use proper import instead of broken `require`; added placeholder fallbacks to prevent build-time crashes
5. **`app/onboarding/page.tsx`** — Restored clean version from `.backup` file (merge had broken JSX, undefined variables, unclosed functions)
6. **`app/signup/page.tsx`** — Reconstructed coherent component from two merged versions; added missing imports (Link, lucide icons), missing state (fullName, success, error), proper function closure
7. **`middleware.ts`** — Fixed undefined `request`/`user`/`response` variables (replaced with correct `req`/`session?.user`/`res`)
8. **`components/dashboard/morning-brief.tsx`** — Made `brief` prop optional (component already handled null)

### Build Result
- `next build` passes with exit code 0
- All 50+ routes compile successfully
- Only warnings are from xero-node dependency (not actionable)

## Backlog
- P0: Set up real Supabase env vars for runtime connectivity
- P1: Review middleware.backup.ts for cookie `setAll` handling that may be needed
- P2: TypeScript strict mode audit (some `any` types throughout)
