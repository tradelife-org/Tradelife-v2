# TradeLife PRD

## Problem Statement
Build a clean, production-ready SaaS dashboard for "TradeLife" using Next.js App Router, TypeScript, TailwindCSS. Linear/Stripe-style UI with dark theme, clean layout, correct spacing, no visual effects initially — then upgrade to premium cinematic visual system.

## Architecture
- **Frontend**: Next.js 14.2.3 App Router + TypeScript + TailwindCSS
- **State**: Zustand (persisted theme store)
- **Styling**: CSS variables for theming, glass/glow/depth system classes, TailwindCSS utilities
- **Backend**: FastAPI proxy (forwards /api/* to Next.js)
- **No database needed** — static mock data

## User Personas
- Tradespeople managing projects, invoices, schedules
- Small business owners needing financial overview

## Core Requirements (Static)
- 3-column dashboard grid (3-6-3 ratio)
- Top bar with branding, notifications, settings, avatar
- Left: Attention Needed, Active Projects, Active Trades
- Center: AI Core placeholder, action buttons, overview stats
- Right: Schedule, Urgent Tasks, Financial Overview

## What's Been Implemented

### Phase 1 — Dashboard Foundation (Jan 2026)
- Clean dark-themed SaaS dashboard at /dashboard
- 3-column grid layout with all sections populated with static mock data
- Top bar with logo, Command Center label, notifications/settings/avatar
- All data-testid attributes on interactive elements
- **Testing: 18/18 passed (100%)**

### Phase 2 — Theme System (Jan 2026)
- 3 themes: commercial (blue, default), molten (orange), remembrance (red)
- CSS variable-based theming in globals.css
- Zustand store with persist middleware (localStorage)
- ThemeProvider wrapping root layout
- Themes change colors only — layout unchanged
- **Testing: 12/12 passed (100%)**

### Phase 3 — Visual Upgrade (Jan 2026)
- **Glass System**: Semi-transparent panels with backdrop blur, subtle inner gradients, faint borders. glass-panel, glass-panel-hero, glass-inset, glass-topbar, glass-action classes
- **Depth System**: Layered box-shadows (--shadow-panel, --shadow-elevated), z-index layering (background → panels → content)
- **Glow System**: Diffused light via layered box-shadows per theme. Molten=stronger warm, Commercial=extremely subtle cool, Remembrance=very soft red. No neon outlines
- **Background System**: Ambient radial gradient + vignette (dark edges)
- **Panel Refinement**: Consistent p-5 padding, rounded-lg insets, improved spacing
- Zero layout changes, zero data changes, zero new components
- **Testing: 14/14 passed (100%)**

## Prioritized Backlog
- P0: None
- P1: Theme switcher UI (settings panel), responsive mobile layout
- P2: Backend API integration, authentication flow
- P3: AI Core functional integration, animations/micro-interactions, drag-and-drop widgets

## Next Tasks
- Add theme switcher UI to settings button
- Micro-animations (entrance transitions, hover states)
- Responsive mobile refinements
