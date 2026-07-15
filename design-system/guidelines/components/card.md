# Card

Base surface container for grouping related content on a screen.

## Shape & tokens

| Part | Value | Token |
|------|-------|-------|
| Background | `#FFFFFF` | `--neutral-white` |
| Border | 1px `#E5E7EB` | `--neutral-200` / `border-default` |
| Radius | 12px | `rounded-12` |
| Padding | 12px | `--card-padding` (not 20px) |
| Gap between cards | 8px | `--card-gap` |

## React API

```tsx
import { Card } from '@/design-system/components'

<Card>...</Card>
<Card flush>          {/* no internal padding — for edge-to-edge ListRow groups */}
  <ListRow ... />
  <ListRow ... />
</Card>
```

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `flush` | `boolean` | `false` | Removes internal padding, clips children to the radius |
| `children` | `ReactNode` | — | required |
| ...div props | | | `className`, `onClick`, etc. |

## Do / Don't

- **Do** stack cards with an 8px gap (`gap-8` on the parent).
- **Do** use `flush` when the content is a ListRow group so dividers reach the edges.
- **Don't** nest cards.
- **Don't** override the 12px radius or padding with utility classes.
