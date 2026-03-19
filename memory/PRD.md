# TradeLife PRD

## Problem Statement
Build a clean, production-ready SaaS dashboard for "TradeLife" using Next.js App Router, TypeScript, TailwindCSS. Progressive visual upgrade from flat → cinematic → motion-polished premium UI.

## Architecture
- **Frontend**: Next.js 14.2.3 App Router + TypeScript + TailwindCSS
- **State**: Zustand (persisted theme store)
- **Styling**: CSS variables on `<html>`, glass/glow/depth component classes, CSS keyframe animations
- **Backend**: FastAPI proxy (forwards /api/* to Next.js)
- **No database needed** — static mock data

## What's Been Implemented

### Phase 1 — Dashboard Foundation (Jan 2026)
- 3-column grid, all sections, static mock data, data-testids — **18/18 (100%)**

### Phase 2 — Theme System (Jan 2026)
- 3 themes (commercial/molten/remembrance), Zustand + ThemeProvider — **12/12 (100%)**

### Phase 3 — Visual Upgrade (Jan 2026)
- Glass, depth, glow, background, panel refinement — **14/14 (100%)**

### Phase 4 — Cinematic Depth (Jan 2026)
- 4-layer background, improved glass/glow, ThemeProvider on `<html>` — **18/18 (100%)**

### Phase 5 — Premium Motion & Polish (Jan 2026)
- **Entrance**: Staggered panel reveal (8 panels, 80ms stagger, 400ms duration, fade+translateY 8px)
- **Hero**: AI Core scale-in (0.98→1, 500ms, slightly delayed)
- **Hover**: Panels lift -1px + shadow increase; buttons lift + bg shift + glow
- **Transitions**: All 200ms with cubic-bezier(0.16,1,0.3,1) / ease-out
- **AI Presence**: Icon scale pulse (1→1.01→1, 4s loop) + glow opacity breathing
- **Performance**: CSS-only, will-change for GPU, transform+opacity only
- **Testing: 19/19 (100%)** — all motion verified, no bouncing/dramatic effects

## Prioritized Backlog
- P0: None
- P1: Theme switcher dropdown UI (settings button)
- P2: Backend API integration, auth flow, responsive mobile
- P3: AI Core functional chat, drag-and-drop widgets

## Next Tasks
- Theme switcher dropdown in top-bar settings
- Responsive mobile layout
- Backend API routes
