# PRD

## Original Problem Statement
Perform a full system audit on a Next.js 14 + Supabase App Router application deployed on Vercel to determine the root cause of persistent build failures (`Failed to collect page data`, `supabaseUrl is required`) moving across routes such as `/analytics`, `/calendar`, and `/proposals/[id]`. This is a root cause analysis only, not a bug fix task.

## Architecture Decisions
- Treat the issue as a system-level App Router + Supabase architecture failure, not a route-by-route bug.
- Identify shared failure sources first: Supabase client factories, environment contract, and route rendering policy.
- Separate request-scoped user Supabase access from service-role/admin access.
- Keep service-role access out of page module graphs.
- Define rendering policy by route group/segment instead of patching pages individually.

## What's Implemented
- Completed full repository audit of Next.js App Router pages, layouts, Supabase helpers, middleware, actions, and Vercel sync script.
- Identified primary root cause in `lib/supabase/server.ts` and environment mismatch in `scripts/sync-vercel-env.sh`.
- Mapped direct and indirect page importers that can trigger build-time evaluation failures.
- Produced system-level fix strategy covering env normalization, client separation, and route architecture.

## Prioritized Backlog
### P0
- Remove module-scope Supabase client initialization from `lib/supabase/server.ts`
- Normalize Supabase env contract to one canonical URL variable across the app and Vercel sync process
- Split request-scoped SSR client and service-role client into separate server-only modules
- Refactor protected pages to consume repository/service functions instead of initializing Supabase directly in page entrypoints

### P1
- Group authenticated routes under a dedicated protected segment/layout with explicit request-time rendering policy
- Move public token/share flows to isolated public data services or route handlers without importing admin client helpers into page graphs
- Remove unused imports that pull `lib/supabase/server.ts` into route bundles (for example `app/api/companies-house/route.ts`)

### P2
- Consolidate all Supabase access behind domain repositories (`analytics`, `calendar`, `quotes`, `jobs`, etc.)
- Add startup/runtime env validation for all required Supabase keys
- Add CI build check to fail fast on server-only env drift and static-evaluation regressions

## Next Tasks
1. Create a single audited Supabase environment module.
2. Split `server.ts` into request client, admin client, and browser client modules.
3. Refactor protected routes to use the new access layer.
4. Re-run production build and verify zero `collect page data` failures.
