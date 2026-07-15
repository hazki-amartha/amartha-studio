# List Row

Row for settings lists, transaction lists, and menus. Rows stacked together are
separated by an automatic 1px top divider (`--neutral-200`).

## Shape & tokens

| Part | Value | Token |
|------|-------|-------|
| Padding | 12px | spacing scale |
| Gap | 12px | spacing scale |
| Title | 14px / 500 | `--neutral-900` |
| Description | 12px / 500 | `--neutral-600` |
| Trailing value | 14px / 700 | `--neutral-900` |
| Leading icon | inherits | `--primary-500` |
| Chevron | 20px | `--neutral-400` |
| Divider | 1px top on `.ds-listrow + .ds-listrow` | `--neutral-200` |

## React API

```tsx
import { Card, ListRow, Badge } from '@/design-system/components'

<Card flush>
  <ListRow title="Saldo Poket" description="Available balance" trailing="Rp1.250.000" />
  <ListRow title="Riwayat transaksi" chevron onClick={() => flow.go('history')} />
  <ListRow title="Status" trailing={<Badge intent="green">Funded</Badge>} />
</Card>
```

## Props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `title` | `ReactNode` | — | required |
| `description` | `ReactNode` | — | secondary line |
| `leading` | `ReactNode` | — | icon / avatar slot |
| `trailing` | `ReactNode` | — | value text or component |
| `chevron` | `boolean` | `false` | adds chevron; pair with `onClick` |
| `onClick` | `() => void` | — | renders the row as a `<button>` |

## Do / Don't

- **Do** wrap row groups in `<Card flush>`.
- **Do** pass `onClick` whenever the row navigates — it becomes a real button (keyboard accessible).
- **Don't** put buttons inside a row that already has `onClick`.
- **Don't** exceed one line of description; keep rows scannable.
