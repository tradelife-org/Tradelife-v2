# TradeLife PRD

## Architecture
- **Frontend**: Next.js 14.2.3 App Router + TypeScript + TailwindCSS
- **State**: Zustand (`/app/store/useUIStore.ts`)
- **Styling**: CSS tokens (`/app/styles/tokens.css`), globals + material system (`/app/styles/globals.css`)

## What's Been Implemented

### Phase 6 — Platform Shell (Jan 2026)
- Login, Onboarding (6 steps), Dashboard (3-column grid)
- Component architecture: Panel, Button, Input, TopBar, DashboardLayout, LeftStack, CenterCore, RightStack
- **Testing: 17/17 (100%)**

### Phase 7 — Premium Material System (Jan 2026)
- **panel-material**: Semi-transparent bg (0.55 alpha), backdrop blur(14px) + saturate(1.1), top-edge inner gradient via ::before, soft multi-layer shadow
- **inset-material**: Subtle translucent background for nested items
- **topbar-material**: Glass-like top bar with blur(16px)
- **btn-material**: Glass action buttons with blur(10px), soft border hover
- Applied uniformly: 11 panels, 23 insets, 3 buttons, 1 topbar on dashboard; login + onboarding panels also upgraded
- CSS tokens: `--panel-bg`, `--panel-border`, `--panel-highlight`, `--panel-shadow`, `--inset-bg`
- **Testing: 14/14 (100%)**

## Next Tasks
- P0: WebGL visual engine (React Three Fiber)
- P1: Widget drag-and-drop (constrained zones)
- P2: AI Core interaction overlay
