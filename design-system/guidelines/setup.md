# Setup — FunDS Lite (in-repo)

FunDS Lite lives **in this repository** at `design-system/`. There is nothing to
install and nothing to configure — the token scale is already wired into the
locked `tailwind.config.ts`, and `design-system/tokens.css` is imported once at
the app root. Both files are **read-only** (see `CLAUDE.md` §1); if something
seems missing from them, raise it with the design-system owner instead of
editing.

> The retired npm package `@funds/funds-lite` is **deprecated**. Never install
> or import it — always use the in-repo paths below.

## Importing Components and Tokens

```tsx
// Components — the barrel also loads component CSS, no separate style import
import { Button, Badge, Input, Toggle } from '@/design-system/components'
import { SelectableCard, Modal, BottomSheet } from '@/design-system/components'
import { NavigationBar, NavigationHeader } from '@/design-system/components'

// Design tokens (TypeScript)
import { COLOR_SCALES, TYPE_SCALE, SPACINGS, RADII, TOKENS } from '@/design-system/tokens'
```

## Token Reference

All CSS variables (color scales, typography, layout constants) are defined in
`design-system/tokens.css`, and the matching Tailwind classes (spacing, radii,
font sizes, color scales) in `tailwind.config.ts`. Read those files for the
authoritative token set — do not copy values from docs, and do not redefine
them anywhere.

Key layout constants (from `tokens.css`):

| Token | Value |
|-------|-------|
| Page padding-x | 16px |
| Page padding-top | 16px |
| Section gap | 12px |
| Card padding | 12px |
| Card gap | 8px |
| Topbar height | 48px |
| Topbar padding-x | 16px |

## Guardrails

- Do NOT install `@funds/funds-lite` or add any npm package
- Do NOT edit `tailwind.config.ts` or anything under `design-system/`
- Do NOT use arbitrary Tailwind values: `w-[437px]`, `text-[#abc]`
- Do NOT invent hex values not listed in the token set
- Do NOT use font-weight 400, 600, or 800 — the only weight classes are `font-regular` (500) and `font-bold` (700); `font-medium` does not exist
- Do NOT use spacing values outside: 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48px
- Do NOT use any font other than Inter
