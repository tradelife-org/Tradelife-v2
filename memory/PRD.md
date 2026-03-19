# TradeLife PRD

## Architecture
- **Frontend**: Next.js 14.2.3 + TypeScript + TailwindCSS
- **Visual Engine**: R3F 8.18 + Three.js 0.170 + postprocessing 6.36.4
- **State**: Zustand

## Implemented Phases (all 100%)

### Phase 6-7 — Shell + Material
### Phase 8 — WebGL Engine
### Phase 9 — Postprocessing (Bloom/Vignette/Noise)
### Phase 10 — Rendered AI Core T (emissive + animated)
### Phase 11 — Atmospheric Depth + 3-Layer Embers

### Phase 12 — Center-Based Lighting (Jan 2026)
- **T as primary source**: 2 point lights (primary intensity 8, distance 20 + forward fill intensity 3, distance 10), animated with pulse/flicker synced to emissive
- **Ambient reduced**: 0.4 intensity, warm (0.03,0.02,0.01) — barely prevents pure black
- **Edge darkening (WebGL)**: Large inverted sphere (r=8, black, 0.2 opacity) absorbs periphery
- **Edge darkening (PostFX)**: Vignette strengthened to darkness 0.8, offset 0.2
- **Edge darkening (CSS)**: `.lighting-overlay` radial gradient (transparent center → 0.55 black at edges), z-index 1 between engine and UI
- **Light falloff halos**: 3-tier (r=0.5/2.0/4.5) with decreasing warm opacity
- **Result**: Center panels visibly brighter, side columns noticeably dimmer — strong visual hierarchy
- **Testing: 10/10 (100%)**

## Next Tasks
- P0: Widget drag-and-drop (constrained zones)
- P1: AI Core interaction overlay
- P2: Route-aware intensity
