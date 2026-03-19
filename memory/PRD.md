# TradeLife PRD — Final State

## Architecture
- **Frontend**: Next.js 14.2.3 + TypeScript + TailwindCSS
- **Visual Engine**: R3F 8.18 + Three.js 0.170 + postprocessing 6.36.4 + Custom GLSL
- **Drag**: @dnd-kit/core 6.3.1 + sortable 8.0.0
- **State**: Zustand (persisted)

## Complete Feature Set

### Platform Shell
- Login (email/password + Google), Onboarding (6 steps), Dashboard (3-column grid)
- TopBar, DashboardLayout, LeftStack, CenterCore, RightStack
- Panel, Button, Input primitives

### Visual Engine
- **MoltenCore** (GLSL): Custom ShaderMaterial with fbm noise, animated organic flow, radial falloff, white-hot→orange→red→black color ramp, additive blending
- **CoreTElement**: Emissive T text (intensity 4, toneMapped false), 3 PointLights (primary 10, fill 4, rear 2), pulse + multi-freq flicker
- **CoreLight**: Low ambient (0.3), 3-tier halo (0.4/1.6/4.0r), edge absorber (r=9), depth haze, floor shadow
- **EmberSystem**: 3 layers (far 25, mid 20, near 10), upward drift, additive blending
- **PostFX**: Bloom (0.7, threshold 0.06, mipmapBlur), Vignette (0.95), ChromaticAberration (0.0004), Noise (0.08)

### Route-Aware Intensity
- Login: 0.3 | Onboarding: 0.5 | Dashboard: 1.0

### CSS Material System
- panel-material: 0.38 alpha, blur(18px), directional gradient, warm radial tint, rim light (::after)
- 3 overlay layers: lighting-overlay (vignette), core-wash (warm screen), atmosphere-haze
- Crushed blacks: bg #060608, borders 0.03 alpha

### Interactions
- Widget drag (dnd-kit, vertical-only, constrained zones, persisted order)
- AI Core overlay (Jarvis-style, daily brief, mock conversational AI)

## Testing History: All iterations 100%
