# TradeLife PRD

## Architecture
- **Frontend**: Next.js 14.2.3 + TypeScript + TailwindCSS
- **Visual Engine**: R3F 8.18 + Three.js 0.170 + postprocessing 6.36.4
- **Drag**: @dnd-kit/core 6.3.1 + sortable 8.0.0
- **State**: Zustand (persisted)

## Implemented (all passed)

### Phase 6-14 — Shell → Material → WebGL → PostFX → Core T → Embers → Lighting → Drag → AI Overlay

### Phase 15 — Route-Aware Visual Engine (Jan 2026)
- **VisualEngine** reads `usePathname()`, maps to intensity: `/login`→0.3, `/onboarding`→0.5, `/dashboard`→1.0
- **All components scale by intensity**: CoreTElement (emissive×i, lights×i), CoreLight (ambient×i, halos×i), EmberSystem (count×i, opacity×i), PostFX (bloom×i, vignette scaled)
- **data-intensity attribute** on visual-engine div for verification
- **One unified system** across all routes — same scene, different energy
- **Testing: 11/11 (100%)**

## Next Tasks
- P0: Theme switching UI
- P1: Connect real AI API (GPT/Claude)
- P2: Mobile responsive layout
