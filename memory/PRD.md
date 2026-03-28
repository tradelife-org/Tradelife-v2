# AUTH MODULE — PRD

## Problem Statement
Implement AUTH MODULE for Next.js + Supabase app with strict file lock and stack lock constraints.

## Architecture
- Stack: Next.js (App Router) + Supabase SSR
- Auth: Supabase `signInWithPassword`, `signUp`, `exchangeCodeForSession`, `getUser`
- Middleware: Edge-compatible Supabase client via `@supabase/ssr`

## Core Requirements (Static)
- Login page supports `?next=` redirect param, falls back to `/dashboard`
- Signup page checks for session vs email confirmation required
- Auth callback uses `lib/supabase/server.ts`, default redirect `/`
- Middleware protects all routes except `/`, `/login`, `/signup`, `/auth/callback`
- No crashes on null Supabase client or missing env

## Files Modified (2025-02)
- `app/login/page.tsx` — added `useSearchParams`, `?next=` redirect logic, fallback `/dashboard`
- `app/signup/page.tsx` — added `confirmEmail` state, session-check branch, email-confirm message
- `app/auth/callback/route.ts` — replaced inline client with `createClient()` from `lib/supabase/server`, default redirect `/`
- `middleware.ts` — full Supabase auth protection, public routes list includes `/`, redirect to `/login?next=<pathname>`

## What's Implemented
- [2025-02] Auth module: login, signup, callback, middleware — all 4 files aligned with spec

## Backlog
- P2: Wrap login page in Suspense boundary for `useSearchParams` static optimization
