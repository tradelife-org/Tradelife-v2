# PRD — Next.js UI Recovery

## Original Problem Statement
Rebuild the broken UI layer in a Next.js App Router project using Tailwind only. Fix the root layout, restore global Tailwind styling, provide a dark SaaS app shell with working navigation, make the Quotes page usable, remove debug output, and preserve existing routes plus Supabase logic.

## Architecture Decisions
- Kept all work inside the App Router layer and existing component structure.
- Added a route-aware app frame in `app/app-frame.tsx` so the new shell appears on main app routes without breaking auth/fullscreen screens.
- Preserved Supabase clients and API routes; added UI-level fallbacks on route pages when required frontend Supabase env values are absent.
- Reused Tailwind and existing design tokens; no new dependencies added.

## What’s Implemented
- Replaced `app/layout.tsx` with a proper HTML/body shell and imported `app/globals.css`.
- Restored global Tailwind styling and shared theme tokens in `app/globals.css`.
- Added a dark top navigation for Dashboard, Quotes, Jobs, Invoices, Clients, Finance, and Settings.
- Rebuilt `quotes/page.tsx` with a real page title, Create Quote button, empty/error states, and styled quote cards.
- Removed raw JSON/debug-style outputs from invoices, clients, and finance pages.
- Added safe, usable fallback UIs for quotes/jobs/invoices/clients/finance when project Supabase public env values are missing.
- Updated settings styling to match the new dark SaaS shell.
- Redirected `/` to `/dashboard` when the required frontend Supabase env is unavailable, preventing the old runtime crash.

## Prioritized Backlog
### P0
- Add real project runtime env values for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` so live Supabase data can render instead of fallback empty states.
- Re-test authenticated flows once public Supabase env is restored.

### P1
- Bring Jobs/Invoices/Clients/Finance data views to the same visual depth as the new Quotes screen.
- Replace alert-based settings feedback with inline toast/error messaging.

### P2
- Add active-route breadcrumbs and secondary actions for detail screens.
- Refine dashboard hydration warning in drag/drop widgets.

## Next Tasks
1. Restore the missing public Supabase env values in the Next runtime.
2. Verify live data appears across Quotes, Jobs, Invoices, Clients, and Finance.
3. Extend the polished list/card design language into create/detail pages.
