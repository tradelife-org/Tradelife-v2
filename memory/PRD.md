# TradeLife PRD

## Architecture
- **Frontend**: Next.js 14.2.3 + TypeScript + TailwindCSS
- **Visual Engine**: R3F 8.18 + Three.js 0.170 + postprocessing 6.36.4
- **State**: Zustand

## Implemented Phases

### Phase 6-7 — Shell + Material — 100%
### Phase 8 — WebGL Engine — 100%
### Phase 9 — Postprocessing — 100%
### Phase 10 — Rendered AI Core T — 100%

### Phase 11 — Atmospheric Depth + Embers (Jan 2026)
- **3-layer ember system**: Far (25 particles, z[-4,-2], size 0.008, slow), Mid (20, z[-2,0], size 0.014, moderate), Near (10, z[0,1.5], size 0.02, fastest) — total 55 particles, all additive blending
- **Atmospheric haze**: Depth haze plane at z=-5 (0.35 opacity, warm tinted), floor fade plane at y=-3.5, slow rotation for living feel
- **Light falloff**: 3-tier halo spheres (0.5/1.8/4.0 radius), decreasing opacity (0.05→0.02→0.008) — natural radial falloff from core
- **Fog**: Tightened to [3, 12] for stronger depth separation, color #08080c
- **Testing: 14/14 (100%)**

## Next Tasks
- P0: Widget drag-and-drop (constrained zones)
- P1: AI Core interaction overlay
- P2: Route-aware intensity
