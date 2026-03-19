# TradeLife PRD — Commercial Theme Final

## Architecture
- **Frontend**: Next.js 14.2.3 + TypeScript + TailwindCSS
- **Visual Engine**: R3F 8.18 + Three.js 0.170 + postprocessing 6.36.4 + Custom GLSL
- **Drag**: @dnd-kit/core 6.3.1 + sortable 8.0.0
- **State**: Zustand (persisted)

## Commercial Theme (Final)

### Color System
- bg-base: #0b0f14 (charcoal/anthracite)
- bg-surface: #111620 (slightly lighter)
- bg-elevated: #18202c
- accent: #3b82f6 (soft blue)
- text-primary: #d8dce3
- borders: rgba(148,180,214,0.06) — blue-tinted, nearly invisible

### Panel Material
- bg: rgba(17,22,32,0.5), blur(16px), saturate(1.1)
- ::before: directional gradient + blue radial tint
- ::after: thin rim light (blue-tinted)
- shadow: 3-tier soft (no strong elevation)

### WebGL Engine (Blue)
- MoltenCore GLSL: white→light blue→blue→deep navy→black color ramp
- CoreTElement: blue emissive (0.3, 0.55, 1.0), 3 blue point lights
- EmberSystem: 3 layers in blue tones
- Fog: #0b0f14

### CSS Overlays
- lighting-overlay: radial vignette (charcoal edges)
- core-wash: blue tint center (screen blend)
- atmosphere-haze: subtle depth fog

### Mobile Responsive
- grid-cols-1 default, lg:grid-cols-12 for desktop
- TopBar: EN flag + "Command Center" hidden on small screens
- Panels: p-6 sm:p-8 adaptive padding
- Action buttons/overview: gap-2 sm:gap-3

### Consistency
- Same panel-material across login, onboarding, dashboard
- Same btn-material for all secondary buttons
- Same inset-material for all nested items
- Same topbar-material for all top bars
- Same Input component everywhere

## All Phases Complete
Phases 6-17 implemented and tested. Commercial theme finalized.
