# Offer Card

The product recommendation card from the AmarthaFin homepage — a headline in
the product's own colour, one line of supporting copy, a chevron affordance,
and the product's full lockup along the foot.

```tsx
import { OfferCard } from '@/design-system/components'

<OfferCard
  product="celengan"
  title="Penempatan dana dari Rp10.000"
  description="Dananya tumbuh dan bisa ditarik kapan pun."
  onClick={() => flow.go('celengan')}
/>
```

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `product` | `'modal' \| 'ggs' \| 'celengan' \| 'amartha-link'` | — | Picks the headline colour and the foot lockup |
| `title` | `string` | — | Headline (16px / 700), in the product's colour |
| `description` | `string` | — | Supporting line (16px / 500), caption colour |
| `onClick` | `() => void` | — | Makes the whole card tappable |

---

## Rules

- The foot is the **lockup** (mark + product name as artwork), never the bare
  mark — the copy above never says which product it is selling, so nothing else
  names it. Don't add a text label beside it.
- The lockups are drawn at different heights, so the component renders each at
  its own drawn height (AmarthaLink is a short wide lockup at 15px, the rest are
  20px). That is what keeps the marks visually the same size down a stack of
  cards. Don't pass a height of your own.
- Headline colour is the product's, not `primary-500`: Modal is blue, GGS and
  Celengan green, AmarthaLink orange.
- One card per product in a stack. If a product is already being shown further
  up the page (a running-loan card, an expanded widget), drop its offer card.
