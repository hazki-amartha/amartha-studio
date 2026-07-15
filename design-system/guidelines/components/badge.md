# Badge

Status indicator or categorical label. Shape is always pill (9999px).

```tsx
import { Badge } from '@funds/funds-lite'

<Badge intent="green" variant="subtle" size="sm">Funded</Badge>
```

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `intent` | `'primary' \| 'blue' \| 'green' \| 'orange' \| 'red' \| 'yellow' \| 'neutral'` | `'primary'` | Color intent |
| `variant` | `'subtle' \| 'solid' \| 'outline' \| 'inverted'` | `'subtle'` | Visual style |
| `size` | `'sm' \| 'md'` | `'sm'` | Size |
| `leadingIcon` | `ReactNode` | — | Icon before label |
| `trailingIcon` | `ReactNode` | — | Icon after label |
| `dot` | `boolean` | `false` | Shows a colored dot before label |

---

## Intents × Colors

| Intent | Background (subtle) | Text (subtle) |
|--------|--------------------|--------------------|
| `primary` | `#FEF3FF` (`--primary-50`) | `#732C7C` (`--primary-600`) |
| `blue` | `#EDF7FF` (`--blue-50`) | `#0457A5` (`--blue-600`) |
| `green` | `#E4FCEF` (`--green-50`) | `#007D55` (`--green-600`) |
| `orange` | `#FDF4E9` (`--orange-50`) | `#AD540A` (`--orange-700`) |
| `red` | `#FFF4F3` (`--red-50`) | `#AC2B26` (`--red-600`) |
| `yellow` | `#FFFED9` (`--yellow-50`) | `#996F03` (`--yellow-700`) |
| `neutral` | `#F9FAF8` (`--neutral-50`) | `#6B7280` (`--neutral-600`) |

---

## Variants

| Variant | Background | Border | Text |
|---------|------------|--------|------|
| `subtle` | tinted bg (50) | none | 600/700 shade |
| `solid` | saturated (500) | none | white |
| `outline` | white | 500 color | 600/700 shade |
| `inverted` | white | `--primary-500` | `--primary-500` |

Use `inverted` for emphasis on filled / colored card backgrounds.

---

## Sizes

| Size | Font | Padding |
|------|------|---------|
| `sm` | 12px / 500 | 3px 10px |
| `md` | 13px / 500 | 4px 12px |

---

## Usage Guide

- `green` for success / funded / approved states
- `red` for error / overdue / rejected states
- `orange` for warning / pending / in-review states
- `blue` for informational / processing states
- `yellow` for accent / under-review states
- `neutral` for inactive / archived states
- `primary` for branded highlights or new feature callouts

---

## Rules

- Do NOT place a badge on a white background with `solid` variant without enough contrast testing
- Use `dot` prop for compact status indicators (e.g. in tables or lists)
- Font is always weight 500 — do NOT bold badge labels
