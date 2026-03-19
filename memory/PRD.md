# TradeLife PRD — Mobile + Desktop Final

## Mobile Dashboard (AI-First)
- **TopBar**: Burger left, TradeLife+EN flag center, notification+avatar right
- **AI Hero** (MobileAIHero): Blue pulsing orb, "How can I help today?", 4 quick actions (Check finances, Plan week, Risks & delays, Performance)
- **Content Stack** (MobileContentStack): Attention Needed, Active Projects, Financial Overview (2x2 grid)
- **Desktop elements hidden** on mobile via `hidden lg:block`

## Desktop Dashboard (3-Column)
- **Unchanged**: Full LeftStack/CenterCore/RightStack grid
- **Mobile elements hidden** on desktop via `lg:hidden`
- **TopBar**: Full brand + Command Center + settings + menu

## Responsive Strategy
- Mobile-first: `grid-cols-1` default
- Desktop: `lg:grid-cols-12` activates 3-column
- Components use `lg:hidden` / `hidden lg:block` for view switching
- Adaptive padding: `px-4 py-5 sm:px-6 sm:py-6`

## Testing: 13/13 (95%)
All viewport switching, component visibility, content counts verified.
