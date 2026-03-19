# TradeLife PRD

## Architecture
- **Frontend**: Next.js 14.2.3 + TypeScript + TailwindCSS
- **Visual Engine**: R3F 8.18 + Three.js 0.170 + postprocessing 6.36.4
- **Drag**: @dnd-kit/core 6.3.1 + sortable 8.0.0
- **State**: Zustand (persisted)

## Implemented (all passed)

### Phase 6-15 — Shell → Material → WebGL → PostFX → Core T → Embers → Lighting → Drag → AI Overlay → Route Intensity

### Phase 16 — Cinematic Integration Pass (Jan 2026)
- **Center light influence**: Warm core-wash overlay (z-2, screen blend, radial gradient of accent at 0.025 alpha) tints center panels warm
- **Panel light reaction**: `::before` now combines directional gradient (top→down) + warm radial (center→out), borders softened to 0.035 alpha, panels more transparent (0.42)
- **Atmosphere**: 3 overlay layers (lighting-overlay z-1, core-wash z-2, atmosphere-haze z-3) create depth
- **Reduced contrast**: Text dimmed to #dcdce0, secondary to #727280, borders near-invisible, panels blend into environment
- **Core dominance**: Bloom boosted to 0.8, threshold lowered to 0.08, vignette darkness 0.9 — T is clearly the brightest element
- **Radius increased**: panels from 14px to 16px for softer feel
- **Testing: 12/12 core (100%)**

## Next Tasks
- P0: Theme switching UI
- P1: Connect real AI API
- P2: Mobile responsive
