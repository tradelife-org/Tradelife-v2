# TradeLife PRD

## Architecture
- **Frontend**: Next.js 14.2.3 + TypeScript + TailwindCSS
- **Visual Engine**: R3F 8.18 + Three.js 0.170 + postprocessing 6.36.4
- **Drag**: @dnd-kit/core 6.3.1 + @dnd-kit/sortable 8.0.0
- **State**: Zustand (persisted)

## Implemented Phases (all 100%)

### Phase 6-13 — Shell → Material → WebGL → PostFX → Core T → Embers → Lighting → Drag

### Phase 14 — AI Core Interaction Overlay (Jan 2026)
- **Trigger**: Click T button → opens centered overlay (z-100, fixed, max-w-640px)
- **Daily Brief**: 4 status items (revenue, invoices, VAT, project) shown on initial open
- **Conversation**: User types → mock keyword-matched AI response in monospace, T badge on system messages
- **Close**: X button, backdrop click, or Escape key
- **Style**: "System Intelligence" header, "CORE ACTIVE" mono label, monospace system responses — Jarvis-style, not chatbot
- **Mock responses**: revenue, invoice, schedule, project keywords mapped to contextual briefings
- **T button fix**: Added inset-material + faint accent text for visibility without WebGL
- **Testing: 16/16 (100%)**

## Next Tasks
- P0: Route-aware visual engine intensity
- P1: Theme switching UI
- P2: Connect real AI (GPT/Claude) to replace mock responses
