# TradeLife PRD

## Problem Statement
Build a premium cinematic SaaS dashboard for "TradeLife" — progressive upgrade from flat foundation to AI Core-powered command hub with directional lighting.

## Architecture
- **Frontend**: Next.js 14.2.3 App Router + TypeScript + TailwindCSS
- **State**: Zustand (persisted theme store)
- **Styling**: CSS variables on `<html>`, glass/glow/depth/core energy classes, CSS keyframe animations
- **Backend**: FastAPI proxy (forwards /api/* to Next.js)

## What's Been Implemented

### Phase 1-4 — Foundation through Cinematic Depth
- 3-column grid, 3 themes, glass/glow/depth, 4-layer background, entrance animations, hover effects
- **All tests passed (100%)**

### Phase 5 — Cinematic Hero System (Jan 2026)
- **AI Core as Power Source**: Multi-ring radial energy (inner/mid/outer rings + light bleed), increased icon size (w-14 h-14), stronger glow, breathing + pulse animations
- **Directional Lighting**: Background gradients recentered on AI Core position (~50% x, ~28% y), center brightest, edges darker
- **Core Energy System**: Per-theme `--core-inner`, `--core-mid`, `--core-outer`, `--core-bleed` variables. Molten strongest, Commercial moderate, Remembrance softest
- **Contrast Boost**: Darker base backgrounds (#060609/#050507/#060405), stronger vignette (0.78-0.82 opacity)
- **Visual Hierarchy**: AI Core (primary) → Center panels (secondary) → Side panels (tertiary) via brightness/glow/contrast differentiation
- **Testing: 13/13 (100%)**

## Prioritized Backlog
- P1: Theme switcher dropdown UI, responsive mobile
- P2: Backend API integration, auth flow
- P3: AI Core functional chat, drag-and-drop widgets
