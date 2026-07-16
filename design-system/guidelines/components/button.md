# Button

Triggers an action or event. Shape is always pill (9999px) — never rectangular or lightly rounded.

```tsx
import { Button } from '@/design-system/components'

<Button variant="primary" size="md">Lanjutkan</Button>
```

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Visual style |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Height and padding |
| `disabled` | `boolean` | `false` | Disables interaction |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Native button type |
| `onClick` | `() => void` | — | Click handler |

Accepts all native `<button>` HTML attributes.

---

## Variants

| Variant | Background | Border | Text | Hover |
|---------|------------|--------|------|-------|
| `primary` | `--primary-500` + gradient | white 16% | white | `--primary-600` |
| `secondary` | white | `--primary-500` | `--primary-500` | `--primary-50` tint |
| `outline` | white | `--neutral-200` | `--neutral-900` | `--neutral-400` border |
| `ghost` | transparent | transparent | `--primary-500` | `--primary-50` bg |
| `danger` | `--red-500` | `--red-500` | white | `--red-600` |

---

## Sizes

| Size | Font | Padding | Use |
|------|------|---------|-----|
| `xs` | 12px / 700 | 4px 8px | Inline / compact |
| `sm` | 12px / 700 | 8px 10px | Secondary actions |
| `md` | 14px / 700 | 8px 12px | Default — use 90% of the time |
| `lg` | 16px / 700 | 12px 16px | Hero CTAs |
| `xl` | 16px / 700 | 12px 20px | Full-width CTAs |

---

## States

- **Disabled:** `--neutral-200` background, `--neutral-500` text, no shadow, `cursor: not-allowed`
- **Focus:** 2px white + 4px `--primary-200` (#E5B8EF) outline

---

## Rules

- Do NOT use rectangular or lightly-rounded buttons — pill (9999px) is the ONLY shape
- Do NOT use font-weight other than 700 for button labels
- Use `primary` for the single most important action per screen
- Use `ghost` for tertiary actions or destructive cancel flows
- Use `danger` for destructive confirmations only (e.g. delete, withdraw)
