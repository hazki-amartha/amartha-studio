# Navigation Header

Top app bar for screen-level navigation. 48px height, 16px horizontal padding.

```tsx
import { NavigationHeader } from '@/design-system/components'

<NavigationHeader
  title="Detail Investasi"
  onBack={() => router.back()}
  trailingIcons={[<NotificationIcon />, <FilterIcon />]}
/>
```

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | — | Screen title (16px / 700) |
| `variant` | `'light' \| 'dark'` | `'light'` | Color scheme |
| `onBack` | `() => void` | — | Back arrow click handler |
| `hideBack` | `boolean` | `false` | Hides the back arrow |
| `trailingIcons` | `ReactNode[]` | — | Up to 2 icons (24×24) on the right |
| `link` | `string` | — | Text link on the right (e.g. "Bantuan") |
| `onLinkClick` | `() => void` | — | Link press handler |
| `showStatusBar` | `boolean` | `false` | Renders iOS-style status bar above header (for mocks) |

---

## Variants

| Variant | Background | Text | Border |
|---------|------------|------|--------|
| `light` | `--neutral-white` | `--neutral-900` | `--neutral-200` bottom |
| `dark` | `--neutral-900` | `--neutral-white` | none |

- Light variant: link color is `--primary-500`
- Dark variant: link color is `--primary-300`

---

## Trailing Slot

- Up to **2 icons** OR a **text link button** — not both simultaneously
- Icons: 24×24, tappable with 44×44 minimum tap target
- Link: 14px / 700, primary color per variant

---

## Examples

```tsx
// Back + title only
<NavigationHeader title="Profil Saya" onBack={() => router.back()} />

// With trailing icons
<NavigationHeader
  title="Beranda"
  hideBack
  trailingIcons={[<NotifIcon />, <SearchIcon />]}
/>

// Dark variant (e.g. promo screen)
<NavigationHeader
  title="Promo Spesial"
  variant="dark"
  onBack={() => router.back()}
  link="Info"
  onLinkClick={() => openHelp()}
/>

// Mobile mock with status bar
<NavigationHeader
  title="Checkout"
  onBack={() => router.back()}
  showStatusBar
/>
```

---

## Rules

- Height is always 48px — do NOT change the topbar height
- Do NOT use both trailing icons AND a link simultaneously — choose one
- `hideBack` should only be used on root screens (e.g. home, profile)
- `dark` variant is for branded / promo screens only — most screens use `light`
- `showStatusBar` is for design mockups only — do NOT use in production UI
