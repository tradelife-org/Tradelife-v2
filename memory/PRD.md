# TradeLife PRD

## Architecture
- **Frontend**: Next.js 14.2.3 + TypeScript + TailwindCSS
- **Visual Engine**: R3F 8.18 + Three.js 0.170 + postprocessing 6.36.4
- **Drag**: @dnd-kit/core 6.3.1 + @dnd-kit/sortable 8.0.0 + @dnd-kit/modifiers
- **State**: Zustand (persisted)

## Implemented Phases (all passed)

### Phase 6-12 — Shell through Lighting System

### Phase 13 — Constrained Widget Drag (Jan 2026)
- **SortableStack**: Generic component wrapping @dnd-kit DndContext + SortableContext + verticalListSortingStrategy
- **Vertical only**: `restrictToVerticalAxis` modifier — no horizontal or cross-column dragging
- **6 draggable panels**: Left (attention, projects, trades) + Right (schedule, urgent, financial)
- **AI Core fixed**: Center column not wrapped in sortable — cannot be moved
- **Drag handles**: GripVertical icon (top-right of each panel), cursor-grab/grabbing states
- **Persistence**: Zustand with persist middleware stores leftOrder/rightOrder in localStorage
- **Widget registry**: Each stack maps widget IDs to render functions — clean separation
- **Testing: 14/14 (100%)**

## Next Tasks
- P0: AI Core interaction overlay (Jarvis-style)
- P1: Route-aware intensity scaling
- P2: Theme switching UI
