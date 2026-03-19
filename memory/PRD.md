# TradeLife PRD

## Architecture
- **Frontend**: Next.js 14.2.3 App Router + TypeScript + TailwindCSS
- **Visual Engine**: React Three Fiber 8.18.0 + Three.js 0.170.0
- **State**: Zustand
- **Styling**: CSS tokens + material system

## What's Been Implemented

### Phase 6 — Platform Shell
- Login, Onboarding (6 steps), Dashboard (3-column grid) — **17/17 (100%)**

### Phase 7 — Premium Material System
- panel-material, inset-material, topbar-material, btn-material — **14/14 (100%)**

### Phase 8 — WebGL Visual Engine (Jan 2026)
- **SceneCanvas**: Full-screen fixed canvas, z-index 0, pointer-events none, alpha transparent
- **CoreLight**: Central warm point light (intensity 4, distance 15), ambient fill, core orb (additive blend), halo ring, atmospheric halo
- **EmberSystem**: 50 instanced mesh particles, slow upward drift, depth variation, additive blending
- **VisualEngine**: Client-side lazy-loaded wrapper (next/dynamic, ssr:false)
- **Mounting**: Root layout.tsx — engine renders behind UI div (z-10)
- **Fog**: Subtle haze at 4-14 distance
- **Persistence**: Same engine on all routes (login, onboarding, dashboard)
- **Dependencies**: @react-three/fiber@8.18.0 + @react-three/drei@9 + three@0.170.0 (React 18 compatible)
- **Testing: 17/17 (100%)** — DOM presence, z-index layering, full flow, interactivity, no JS errors

## Next Tasks
- P0: Widget drag-and-drop (constrained zones)
- P1: AI Core interaction overlay (Jarvis-style)
- P2: Route-aware intensity (login calm, dashboard full)
