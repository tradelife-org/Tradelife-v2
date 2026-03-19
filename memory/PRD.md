# TradeLife PRD

## Architecture
- **Frontend**: Next.js 14.2.3 + TypeScript + TailwindCSS
- **Visual Engine**: React Three Fiber 8.18.0 + Three.js 0.170.0 + postprocessing 6.36.4
- **State**: Zustand

## What's Been Implemented

### Phase 6-7 — Shell + Material — **100%**
### Phase 8 — WebGL Engine — **100%**
### Phase 9 — Postprocessing (Bloom/Vignette/Noise) — **100%**

### Phase 10 — Rendered AI Core T (Jan 2026)
- **CoreTElement**: 3D text "T" using @react-three/drei `Text` with Inter-Bold.ttf
- **Emissive material**: MeshStandardMaterial, emissive orange (1, 0.45, 0.08), emissiveIntensity 2.5, toneMapped false, metalness 0.7, roughness 0.3
- **Animated glow**: useFrame-driven pulse (0.85-1.0 at 0.8Hz) + multi-frequency flicker (3.7/7.3/13.1 Hz)
- **Bloom-driven light**: PointLight intensity 6, distance 18 — synced to animation. Bloom catches emissive at threshold 0.1
- **UI integration**: CSS T button made transparent (text-transparent) — 3D T shows through the semi-transparent panel
- **CoreLight simplified**: Removed redundant orb (now CoreTElement is the light source), kept ambient fill + halos
- **Testing: 12/12 (100%)**

## Next Tasks
- P0: Widget drag-and-drop (constrained zones)
- P1: AI Core interaction overlay (Jarvis-style)
- P2: Route-aware intensity scaling
