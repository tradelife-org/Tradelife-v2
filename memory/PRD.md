# TradeLife — PRD

## Original Problem Statement
Create a premium login page for TradeLife SaaS using a cinematic background image and clean UI overlay. Fix build stability issues (Three.js JSX errors, turbopack config). Ensure Vercel compatibility.

## Architecture
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + custom CSS tokens
- **3D Engine:** Three.js / React Three Fiber (disabled, preserved for future)
- **Auth:** Supabase (middleware exists, not connected on login page yet)
- **Deployment:** Vercel

## Core Requirements
- Full-screen cinematic background image on login
- Dark radial gradient overlay for readability
- Glassmorphism login panel (420px max-width, centered)
- Email + Password fields, Forgot password, Sign In (blue gradient), Google sign-in, Sign Up link
- No orange UI elements — blue accent (#3b82f6) only
- Three.js visual engine disabled but not deleted
- Clean TypeScript build with no errors

## What's Been Implemented (Jan 2026)
- [x] Premium login page at `/login` with uploaded background image
- [x] Dark radial overlay (lighter center, darker edges)
- [x] Glass panel with all form elements
- [x] Removed turbopack config from `next.config.js`
- [x] Excluded `visual-engine/` from TypeScript compilation
- [x] Removed VisualEngine import from `layout.tsx`
- [x] Root `/` redirects to `/login`
- [x] 100% test pass rate (13/13 tests)
- [x] Zero TypeScript errors

## User Personas
- Tradespeople (electricians, plumbers, builders)
- Small business owners in trade industries

## Prioritized Backlog
### P0 (Critical)
- Connect Supabase authentication on login/signup
- Implement signup flow
- Implement forgot/reset password flow

### P1 (Important)
- Reintroduce Three.js visual engine (fix `@types/three` JSX issues)
- Onboarding flow after first login
- Dashboard page

### P2 (Nice to have)
- Entrance animations on login panel
- Mobile-optimized background image (smaller file)
- Remember me / session persistence

## Files Modified
- `/app/app/login/page.tsx` — rewritten with premium login UI
- `/app/app/layout.tsx` — removed VisualEngine import
- `/app/next.config.js` — removed turbopack config
- `/app/tsconfig.json` — excluded visual-engine from compilation
- `/app/public/login-bg.png` — uploaded background image
