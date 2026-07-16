# Navigation Bar

Bottom tab bar for primary app navigation. Equal-width tabs with icon + label. White surface with a 1px top border.

```tsx
import { NavigationBar } from '@/design-system/components'

<NavigationBar
  items={[
    { id: 'home', label: 'Beranda', icon: <HomeIcon />, active: true, onClick: () => router.push('/') },
    { id: 'invest', label: 'Investasi', icon: <ChartIcon />, onClick: () => router.push('/invest') },
    { id: 'scan', label: 'Scan', icon: <ScanIcon />, feature: true, onClick: () => router.push('/scan') },
    { id: 'poket', label: 'Poket', icon: <WalletIcon />, badge: 3, onClick: () => router.push('/poket') },
    { id: 'profile', label: 'Profil', icon: <PersonIcon />, onClick: () => router.push('/profile') },
  ]}
/>
```

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

---

## Rules

- 3–5 tabs maximum in a navigation bar
- Use exactly ONE `feature` tab — never zero or two
- Do NOT use a navigation bar with only 2 tabs — use tabbed navigation instead
- Labels are ALWAYS shown — do NOT hide labels on active state only
- Do NOT use the navigation bar on non-root screens — use `NavigationHeader` instead
