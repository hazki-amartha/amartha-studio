# FunDS Lite — Cheatsheet

**This is the only guidelines file you need to read before building.** It holds
every token and every component signature. Open a `components/*.md` doc only when
this page is genuinely not enough for the component you're using — not "to be
thorough". Reading all of `guidelines/` before writing a screen is the single
most expensive habit in this repo, and it buys almost nothing.

FunDS Lite targets **mobile-first** screens for Amartha Financial. Import
components from `@/design-system/components`, layout from `@/platform/primitives`.

---

## Tokens

| Rule | Value |
|------|-------|
| Primary | `primary-500` = `#853291` — the ONLY primary action color |
| Font | Inter, weights **500 / 700** only → `font-regular` / `font-bold` |
| Spacing | 4px grid: `0 2 4 8 12 16 20 24 32 40 48` only |
| Button radius | `rounded-full` (pill) — never rectangular |
| Card radius | `rounded-12`, 12px padding |
| Input radius | `rounded-8` |
| Status | 500 foreground on matching 50-tint background (Badge does this) |
| Layout | 16px page padding-x/top, 12px section gap, 48px topbar |

`font-medium`, `font-semibold`, `font-400` **do not exist** and fail silently.
No arbitrary values (`p-[13px]`, `text-[#853291]`) — `no-arbitrary-value` errors.
If the value you want isn't a token, you're off-system: pick the nearest token.

Intents available as badge/status colors: `primary blue green orange red yellow
neutral`.

---

## Layout — always start here

```tsx
<Screen topBar={<NavigationHeader title="…" onBack={flow.back} />}>
  {/* canvas, px-16 pt-16 and 12px section gap already applied — just stack */}
</Screen>
```

- **`Screen`** — `topBar?` + `children`. Never hand-roll page padding.
- **`TopBar`** — minimal 48px bar (`children`) when you don't need a full header.

---

## Components

All props below are optional except where marked **required**.

```tsx
// Button — children required
<Button variant="primary|secondary|outline|ghost|danger" size="xs|sm|md|lg|xl" />

// Card — children required
<Card flush />

// ListRow — title required
<ListRow title description leading trailing chevron onClick />

// Input
<Input size="sm|md|lg" state="default|focus|valid|error"
       label optionalText required description helperText
       prefix suffix prefixInteractive suffixInteractive
       prefixButtonProps suffixButtonProps />

// Badge — children required
<Badge intent="primary|blue|green|orange|red|yellow|neutral"
       variant="solid|subtle|outline|inverted" size="sm|md"
       dot leadingIcon trailingIcon />

// Toggle
<Toggle size="sm|md" label />

// SelectableCard
<SelectableCard size="sm|md" title description prefixIcon secondary />

// Modal — open required
<Modal open onClose size="sm|md|lg" variant="default|dialog"
       intent="success|warning|error|info"
       title description slot primaryAction secondaryAction hideClose />

// BottomSheet — open required
<BottomSheet open onClose size="sm|md|fullscreen"
             title description slot slotPosition="above|below"
             primaryAction secondaryAction hideClose />

// NavigationBar — items required
<NavigationBar items={[{ id, label, icon, badge, active, onClick, feature }]} />

// NavigationHeader
<NavigationHeader title variant="light|dark" onBack hideBack
                  trailingIcons link onLinkClick showStatusBar />
```

`primaryAction` / `secondaryAction` on Modal and BottomSheet take a `<Button>`.

---

## Icons

**166 shared icons live in `@/design-system/icons`. Never hand-roll an icon.**

```tsx
import { Coins, ArrowRight, CheckCircle } from '@/design-system/icons'

<Coins />                              // 24px, inherits currentColor
<ArrowRight size={16} />               // size is 16 | 20 | 24
<CheckCircle className="text-green-500" />   // color via a text-* token
```

- Names are **Phosphor** names in PascalCase (`chat-circle-dots` → `ChatCircleDots`).
  Look glyphs up on phosphoricons.com, or `grep 'export function' design-system/icons/index.tsx`.
- **Filled weight = `-fill` suffix**: `House` / `HouseFill`, `Star` / `StarFill`.
- Color comes from `currentColor` — set it with a `text-*` token on the icon or its
  container; don't pass hex.
- If a glyph genuinely isn't in the set, follow the missing-component protocol (§4)
  — build it project-local, don't add a one-off to the shared module.

---

## Navigation

```tsx
const flow = useFlow()   // from '@/platform/runtime'
flow.go('screen-id')     // push    flow.back()   // pop    flow.current
```

Screens receive **no props** and **remount on every navigation** — any value that
must survive a `go()` belongs in `projects/<slug>/lib/store.ts` (module store +
`useSyncExternalStore`), not `useState`.

---

## Deeper docs — open only when needed

[colors](foundations/colors.md) · [typography](foundations/typography.md) ·
[spacing](foundations/spacing.md) · [components overview](components/overview.md)
and the per-component docs beside it.
