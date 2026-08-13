# Navigation Bar

Bottom tab bar for primary app navigation. Equal-width tabs with icon + label. White surface with a 1px top border.

The bar below is the one AmarthaFin ships today: five tabs, drawn with the
`NavIcon` artwork from `@/design-system/assets`, no raised feature tab. Copy it
as-is unless the prototype is deliberately proposing a different bar.

```tsx
import { NavigationBar } from '@/design-system/components'
import { NavIcon } from '@/design-system/assets'

<NavigationBar
  items={[
    { id: 'home', label: 'Home', icon: <NavIcon name="home" active />, active: true, onClick: () => go('home') },
    { id: 'pinjaman', label: 'Pinjaman', icon: <NavIcon name="modal" />, onClick: () => go('pinjaman') },
    { id: 'scan', label: 'Scan', icon: <NavIcon name="scan" />, onClick: () => go('scan') },
    { id: 'celengan', label: 'Celengan', icon: <NavIcon name="celengan" />, onClick: () => go('celengan') },
    { id: 'transaksi', label: 'Transaksi', icon: <NavIcon name="transaction" />, onClick: () => go('transaksi') },
  ]}
/>
```

`NavIcon` bakes the selected state into the artwork, so pass it the same `active`
flag you give the item — never a `text-*` colour. `modal` is the "Pinjaman" tab.

---

## Props

### `NavigationBarProps`

| Prop | Type | Description |
|------|------|-------------|
| `items` | `NavBarItem[]` | Array of tab items |

### `NavBarItem`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | — | Unique identifier |
| `label` | `string` | — | Tab label (10px uppercase equivalent) |
| `icon` | `ReactNode` | — | 24×24 icon |
| `active` | `boolean` | `false` | Highlights tab in primary-500 |
| `badge` | `number \| boolean` | — | Red badge on icon (number = count, true = dot) |
| `feature` | `boolean` | `false` | Lifted 40px primary-500 circle (center action) |
| `onClick` | `() => void` | — | Tab press handler |

---

## States

| State | Icon color | Label | Weight |
|-------|-----------|-------|--------|
| Default | `--neutral-600` | `--neutral-600` | 500 |
| Active | `--primary-500` | `--primary-500` | 700 |

---

## Badge

- Red dot (`--red-500` bg, white text) at top-right of icon
- 2px white border ring around dot
- Pass a number for count display, or `true` for dot-only

---

## Feature Tab

- Lifted 40px circle with `--primary-500` background
- Positioned at -16px margin-top (rises above bar)
- White icon color
- Use for a single center action (e.g. Scan, Camera, Quick Pay)
- **Optional, and the shipped AmarthaFin bar does not use one** — its Scan tab is
  a flat tab like the rest. Only raise a tab when the prototype is proposing that
  change on purpose.

---

## Rules

- 3–5 tabs maximum in a navigation bar
- At most ONE `feature` tab — never two; zero is the AmarthaFin default
- Do NOT use a navigation bar with only 2 tabs — use tabbed navigation instead
- Labels are ALWAYS shown — do NOT hide labels on active state only
- Do NOT use the navigation bar on non-root screens — use `NavigationHeader` instead
