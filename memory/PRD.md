# TradeLife — PRD

## Original Problem Statement
Create a premium login page for TradeLife SaaS using a cinematic background image and clean UI overlay. Apply a global background system across all main routes (/login, /onboarding, /dashboard). Add 3D perspective panel with edge lighting. Fix build stability issues. Ensure Vercel compatibility.

## Architecture
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + custom CSS tokens
- **3D Engine:** Three.js / React Three Fiber (disabled, preserved for future)
- **Auth:** Supabase (middleware exists, not connected on login page yet)
- **Deployment:** Vercel

## Core Requirements
- Global cinematic background image across all routes
- Dark radial gradient overlay (standard for login/onboarding, darker for dashboard)
- Glassmorphism login panel with 3D perspective tilt
- Edge lighting: blue left, warm orange right (matching environment)
- Grounding shadow under panel
- Email + Password fields, Forgot password, Sign In (blue gradient with glow), Google sign-in, Sign Up link
- No orange UI elements — blue accent (#3b82f6) only
- Three.js visual engine disabled but not deleted
- Clean TypeScript build with no errors

## What's Been Implemented (Jan 2026)
### Phase 1 — Login Page
- [x] Premium login page at `/login` with uploaded background image
- [x] Dark radial overlay (lighter center, darker edges)
- [x] Glass panel with all form elements
- [x] Removed turbopack config from `next.config.js`
- [x] Removed VisualEngine import from `layout.tsx`
- [x] Root `/` redirects to `/login`

### Phase 2 — Visual Refinement & System Unification
- [x] Global `CinematicBackground` component with pathname-based overlay
- [x] 3D perspective tilt on login glass panel (rotateX with perspective)
- [x] Edge lighting: cool blue left, warm orange right
- [x] Grounding shadow beneath panel
- [x] Branding text glow effect
- [x] Sign-in button glow effect
- [x] Onboarding page uses global background (layout preserved)
- [x] Dashboard uses global background with darker overlay (layout preserved)
- [x] Consistent visual environment across all pages
- [x] 100% test pass (18/18 tests)
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
- Onboarding flow after first login
- Dashboard page refinements

### P2 (Nice to have)
- Entrance animations on login panel
- Mobile-optimized background image (smaller file)
- Remember me / session persistence
- Panel hover micro-interactions

## Key Files
- `/app/components/CinematicBackground.tsx` — global background system
- `/app/app/login/page.tsx` — premium login with perspective panel
- `/app/app/layout.tsx` — root layout with CinematicBackground
- `/app/styles/globals.css` — perspective panel CSS, edge lighting, grounding
- `/app/next.config.js` — clean Next.js 14 config (no turbopack)
- `/app/public/login-bg.png` — uploaded cinematic background image
