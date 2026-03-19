# TradeLife PRD

## Architecture
- **Frontend**: Next.js 14.2.3 App Router + TypeScript + TailwindCSS
- **Visual Engine**: React Three Fiber 8.18.0 + Three.js 0.170.0 + postprocessing 6.36.4
- **State**: Zustand

## What's Been Implemented

### Phase 6-7 — Shell + Material System
- Login/Onboarding/Dashboard, Panel/Button/Input primitives, material system — **100%**

### Phase 8 — WebGL Visual Engine
- CoreLight, EmberSystem, SceneCanvas — full-screen fixed behind UI — **100%**

### Phase 9 — Cinematic Postprocessing (Jan 2026)
- **Bloom**: intensity 0.4, luminanceThreshold 0.15, luminanceSmoothing 0.9, mipmapBlur — soft light bleed from core orb and embers
- **Vignette**: offset 0.3, darkness 0.65, NORMAL blend — cinematic edge darkening
- **Noise**: opacity 0.12, SOFT_LIGHT blend, premultiply — very subtle film grain
- **Dependencies**: @react-three/postprocessing@2.16.3 + postprocessing@6.36.4 (React 18 compatible)
- **Performance**: multisampling 0, dpr [1, 1.5], low-power GPU preference
- **Testing: 12/12 (100%)**

## Next Tasks
- P0: Widget drag-and-drop (constrained zones)
- P1: AI Core interaction overlay
- P2: Route-aware intensity scaling
