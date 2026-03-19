# TradeLife PRD

## Problem Statement
Build a cinematic SaaS platform for tradespeople. Progressive build: structural shell → visual engine → full product.

## Architecture
- **Frontend**: Next.js 14.2.3 App Router + TypeScript + TailwindCSS
- **State**: Zustand (`/app/store/useUIStore.ts`)
- **Styling**: CSS custom properties (`/app/styles/tokens.css`), globals (`/app/styles/globals.css`)
- **Component structure**: `/app/components/ui/` (primitives), `/app/components/layout/` (shells), `/app/components/dashboard/` (stacks)

## File Structure
```
app/
  layout.tsx          — root layout, imports globals.css
  page.tsx            — redirects to /login
  login/page.tsx      — centered login with email+password+Google
  onboarding/page.tsx — 6-step guided flow
  dashboard/page.tsx  — 3-column dashboard

components/
  layout/TopBar.tsx         — logo, flag, bell, settings, menu, avatar
  layout/DashboardLayout.tsx — grid wrapper with TopBar
  dashboard/LeftStack.tsx    — Attention, Projects, Trades
  dashboard/CenterCore.tsx   — AI Core T hero, actions, stats
  dashboard/RightStack.tsx   — Schedule, Tasks, Financial

  ui/Panel.tsx   — reusable dark panel
  ui/Button.tsx  — primary/secondary/ghost variants
  ui/Input.tsx   — labeled dark input

store/useUIStore.ts  — sidebar, onboarding step, AI core state
styles/tokens.css    — CSS custom properties (colors, radii)
styles/globals.css   — base styles, scrollbar, imports tokens
```

## What's Been Implemented

### Phase 6 — Platform Shell (Jan 2026)
- **Login**: Centered glass panel, email/password, Google auth, navigates to onboarding
- **Onboarding**: 6-step flow (Welcome→Business→Trade→Team→Theme→Finish), step indicator, back/next
- **Dashboard**: TopBar (logo, EN flag, branding, bell, settings, menu, avatar), 12-col grid (3-6-3), LeftStack/CenterCore/RightStack
- **AI Core**: Large centered T button, hero panel, prompt area
- **Primitives**: Panel, Button (3 variants), Input components
- **State**: Zustand store with sidebar, onboarding step, AI core open
- **Styling**: Pure dark flat theme, CSS tokens, zero effects
- **Testing: 17/17 (100%)** — full flow verified, 47 data-testid attributes

## Next Tasks
- P0: WebGL visual engine (React Three Fiber), cinematic atmosphere
- P1: Widget drag-and-drop (constrained zones)
- P2: AI Core interaction overlay (Jarvis-style)
- P3: Theme switching, login animations
