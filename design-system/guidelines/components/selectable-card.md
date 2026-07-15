# Selectable Card

Card-shaped radio or checkbox — the entire card is the tap target. Active state shifts border to `--primary-500` and background to `--primary-50`.

```tsx
import { SelectableCard } from '@funds/funds-lite'

<SelectableCard
  title="Tenor 12 Bulan"
  description="Cicilan Rp 500.000 / bulan"
  inputType="radio"
  name="tenor"
/>
```

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md'` | `'sm'` | Card padding |
| `title` | `string` | — | Primary label (14px / 700) |
| `description` | `string` | — | Supporting text (12px / 500), max 2 lines |
| `prefixIcon` | `ReactNode` | — | Icon in a 32px primary-50 circle |
| `secondary` | `ReactNode` | — | Right-aligned double content block |
| `slot` | `ReactNode` | — | Swappable inline component (e.g. chart, image) |
| `ribbon` | `string` | — | Promo label overlay (e.g. "Paling Untung") |
| `inputType` | `'radio' \| 'checkbox'` | `'radio'` | Selection behavior |
| `name` | `string` | — | Groups radio cards together |
| `checked` | `boolean` | — | Controlled checked state |
| `defaultChecked` | `boolean` | `false` | Initial state |
| `disabled` | `boolean` | `false` | Disables selection |
| `onChange` | `(e) => void` | — | Change handler |

---

## States

| State | Border | Background | Indicator |
|-------|--------|------------|-----------|
| Enabled | `--neutral-200` | white | Empty circle |
| Active | `--primary-500` | `--primary-50` | Filled primary dot |
| Disabled | `--neutral-200` | `--neutral-50` | Dim circle |

---

## Sizes

| Size | Padding |
|------|---------|
| `sm` | 12px |
| `md` | 16px |

---

## Variants

```tsx
// Standard radio card
<SelectableCard title="Paket Standar" description="Rp 500rb/bulan" inputType="radio" name="plan" />

// With prefix icon (32px circle)
<SelectableCard title="Transfer Bank" prefixIcon={<BankIcon />} inputType="radio" name="method" />

// With right-aligned secondary content
<SelectableCard
  title="GGS Series A"
  description="IRR 12.5%"
  secondary={<><span>Rp 50jt</span><span>Tersisa 3 slot</span></>}
  inputType="radio"
  name="product"
/>

// Promo card with ribbon
<SelectableCard
  title="Tenor 24 Bulan"
  description="Cicilan paling ringan"
  ribbon="Paling Untung"
  inputType="radio"
  name="tenor"
/>
```

---

## Rules

- Radius is always 8px — do NOT use 12px card radius on selectable cards
- Do NOT nest selectable cards inside other cards
- Use `inputType="checkbox"` when multiple selections are allowed simultaneously
- Always group radio cards with the same `name` prop
- Use `ribbon` only for ONE option per group — never all options
