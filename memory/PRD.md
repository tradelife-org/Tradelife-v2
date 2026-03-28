# PRD — Next.js UI Recovery + Quotes Supabase Integration

## Original Problem Statement
Rebuild the broken UI layer in a Next.js App Router project using Tailwind only. Fix the root layout, restore global Tailwind styling, provide a dark SaaS app shell with working navigation, make the Quotes page usable, remove debug output, and preserve existing routes plus Supabase logic.

Later scope extension: replace mock Quotes logic with real Supabase persistence for the Quotes list, create flow, and quote detail flow without redesigning the UI.

## Architecture Decisions
- Kept all work inside the existing App Router and component structure.
- Preserved the existing Supabase client setup and extended the pre-existing `saveQuoteDraft` server action instead of introducing a new data layer.
- Reused the existing quote pricing helpers for labour/material/margin calculations and persisted quote + section + line-item records through the current schema.
- Added route-level env guards on Quotes pages so missing frontend Supabase env values no longer crash the pages during server render.

## What’s Implemented
- Root shell and dark navigation remain in place from the earlier UI recovery work.
- `app/quotes/page.tsx` now fetches real quotes from Supabase, ordered by `created_at DESC`, and renders linked quote cards using related client + section data.
- `app/quotes/create/page.tsx` now submits real data through the existing server action, creates/fetches the client, inserts the quote, inserts its section + line item, and redirects to the new quote detail page.
- `lib/actions/save-quote.ts` now returns the inserted quote record summary (including `id`) and revalidates Quotes routes after save.
- `app/quotes/[id]/page.tsx` continues to fetch the real quote by ID, keeps the existing detail UI, redirects unauthenticated users to login, and handles not-found states via `notFound()`.
- Quotes list/detail pages now render safe visible error states instead of crashing when frontend Supabase env values are temporarily missing.

## Prioritized Backlog
### P0
- Add the real local/frontend Supabase public env values so the live Quotes pages can query Supabase in this runtime.
- Validate the authenticated end-to-end quote creation flow with a real user session.

### P1
- Populate quote references during draft creation so list/detail headers show a business-friendly identifier.
- Surface inline success toasts for quote creation and send actions.

### P2
- Extend the same persistence pattern into quote editing and section management.
- Add richer filtering/search on the Quotes list.

## Next Tasks
1. Provide the real frontend Supabase public env values locally and restart the frontend.
2. Log in with a valid user and create a quote to verify the full save → redirect → detail flow against Supabase.
3. If needed, add a lightweight reference generator for newly created quotes.
