# TradeLife PRD

## Problem Statement
Build a clean, production-ready SaaS dashboard for "TradeLife" using Next.js App Router, TypeScript, TailwindCSS. Linear/Stripe-style UI with dark theme, then upgrade to premium cinematic visual system with true depth.

## Architecture
- **Frontend**: Next.js 14.2.3 App Router + TypeScript + TailwindCSS
- **State**: Zustand (persisted theme store)
- **Styling**: CSS variables on `<html>` element for theming, glass/glow/depth component classes
- **Backend**: FastAPI proxy (forwards /api/* to Next.js)
- **No database needed** — static mock data

## What's Been Implemented

### Phase 1 — Dashboard Foundation (Jan 2026)
- 3-column grid dashboard with all sections, static mock data, data-testids
- **Testing: 18/18 (100%)**

### Phase 2 — Theme System (Jan 2026)
- 3 themes: commercial (blue), molten (orange), remembrance (red)
- Zustand store + ThemeProvider applying class to `<html>`
- **Testing: 12/12 (100%)**

### Phase 3 — Visual Upgrade (Jan 2026)
- Glass, depth, glow, background, panel refinement systems
- **Testing: 14/14 (100%)**

### Phase 4 — Cinematic Depth Refinement (Jan 2026)
- **Background**: 4-layer system (primary glow, secondary ambient, floor gradient, vignette) — environment not flat color
- **Glass**: 0.45 alpha transparency, blur(16-20px) + saturate, top-edge highlight gradient (::before)
- **Glow**: Multi-layer diffused box-shadows, ambient light bleed behind hero, per-theme logo/icon glow. No neon/sharp
- **Depth**: 3-tier shadow (close 1px / mid 6px / far 24-48px), clear bg→panel→content separation
- **ThemeProvider**: Now applies class to `<html>` (was inner div) so body CSS vars resolve correctly
- **Testing: 18/18 (100%)**

## Prioritized Backlog
- P0: None
- P1: Theme switcher UI, micro-animations (entrance reveals, hover states)
- P2: Backend API integration, auth flow
- P3: AI Core integration, drag-and-drop widgets

## Next Tasks
- Theme switcher dropdown in settings
- Entrance animations (staggered card reveals)
- Responsive mobile refinements
