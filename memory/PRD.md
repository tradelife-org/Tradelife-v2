# TradeLife PRD — Visual Correction Complete

## AI Orb System (Global)
- **AIOrb component** (`/app/components/ui/AIOrb.tsx`): 3 sizes (sm/md/lg), 3-layer radial gradient (core bright → mid → outer halo), no text, CSS pulse animation (5s), clickable opens AI overlay
- **Used on**: Login (md, centered above form), Onboarding (sm, above each step), Dashboard mobile (md, standalone hero), Dashboard desktop (lg, standalone hero), AI Overlay (sm, header badge)
- **Rule**: Orb is NEVER inside a panel — always standalone

## Visual Hierarchy (Fixed)
- **Login**: Orb → "Welcome back" → Form panel (orb is primary, form secondary)
- **Onboarding**: Step indicator → Orb → Question → Input (AI-guided, one question per screen)
- **Dashboard mobile**: Orb → "How can I help today?" → Quick actions → Content panels
- **Dashboard desktop**: Orb (large) → Action buttons → Stats grid (flanked by side panels)

## Removed
- All "T" text as AI core visual
- All orb-inside-panel patterns
- Form-first layouts on login/onboarding

## Testing: 12/12 (95%)
