# Colors — FunDS Lite

## Semantic Aliases (Use These in Code)

Prefer semantic aliases over raw hex values in all component and layout code.

| Alias | Hex | CSS Variable | Role |
|-------|-----|--------------|------|
| `text-default` | `#111928` | `--neutral-900` | Primary readable text |
| `text-caption` | `#6B7280` | `--neutral-600` | Secondary / supporting text |
| `text-disabled` | `#8E95A3` | `--neutral-500` | Disabled labels |
| `text-placeholder` | `#C6CAD0` | `--neutral-400` | Input placeholder text |
| `text-link` | `#853291` | `--primary-500` | Clickable links |
| `text-success` | `#007D55` | `--green-600` | Status text — success / paid |
| `text-warning` | `#AD540A` | `--orange-700` | Status text — warning / pending |
| `text-error` | `#AC2B26` | `--red-600` | Status text — error / overdue |
| `text-info` | `#0457A5` | `--blue-600` | Status text — informational |
| `border-default` | `#E5E7EB` | `--neutral-200` | Card and input borders |
| `border-light` | `#F9FAF8` | `--neutral-50` | Subtle dividers |

> **The aliases are text/border-only.** There are no `bg-*` semantic aliases —
> `bg-default` etc. do not exist. The only semantic background is `bg-overlay`
> (modal/sheet backdrop). For surfaces, use the raw scale classes
> (`bg-neutral-white`, `bg-neutral-50`, `bg-primary-50`, …).

### Status backgrounds on hand-built surfaces

The Badge component pairs status colors for you, but when you build a tinted
status surface yourself (e.g. a success/error icon circle), apply the same
rule manually: **status text uses the text alias, the surface the 50 tint** —
`text-success` on `bg-green-50`, `text-error` on `bg-red-50`, and so on. An
icon or dot on it can be the 500 (`text-green-500`), except orange and yellow,
whose icons take 700. See Status Colors below for why.

---

## Brand (Primary Purple)

The single brand action color. Use `primary-500` for every primary button, link, and active state.

| Token | Hex | Role |
|-------|-----|------|
| `--primary-50` | `#FEF3FF` | Badge fills, focus rings, ghost hover backgrounds |
| `--primary-200` | `#E5B8EF` | Focus ring outer glow |
| `--primary-300` | `#D68EE4` | Illustrative / decorative |
| `--primary-400` | `#A642B7` | Secondary decorative actions |
| `--primary-500` | `#853291` | **PRIMARY** — buttons, links, active states |
| `--primary-600` | `#732C7C` | Hover / pressed state |
| `--primary-700` | `#612966` | On-light text emphasis |
| `--primary-900` | `#3D1042` | Deep emphasis |

Do NOT use purple tones from generic Tailwind palettes — ONLY `--primary-*` tokens.

---

## Neutral

| Token | Hex | Role |
|-------|-----|------|
| `--neutral-white` | `#FFFFFF` | Surface / card backgrounds |
| `--neutral-50` | `#F9FAF8` | Page background |
| `--neutral-200` | `#E5E7EB` | Borders (default) |
| `--neutral-400` | `#C6CAD0` | Placeholder text |
| `--neutral-500` | `#8E95A3` | Disabled state |
| `--neutral-600` | `#6B7280` | Caption / secondary text |
| `--neutral-700` | `#525C6A` | Secondary text emphasis |
| `--neutral-900` | `#111928` | Default text (darkest) |

---

## Status Colors

**Rule:** status **text** takes the step that reads — 4.5:1 or better on white,
`--neutral-50` and its own 50 tint alike. The 500s don't: orange-500 text is
2.1:1 on its tint, yellow-500 1.9:1, green-500 3.3:1. **Icons and dots** need
3:1, which the 500 gives for blue, green and red but not orange or yellow.
**White text on a solid fill** needs 4.5:1 too, so green and orange fills go
darker, and a yellow fill always carries dark text.

| Color | Text | Icon / dot | Tint | White text on a fill | Role |
|-------|------|------------|------|----------------------|------|
| Blue | `text-info` (600) | 500 | `bg-blue-50` | `bg-blue-500` | Informational |
| Green | `text-success` (600) | 500 | `bg-green-50` | `bg-green-600` | Success / funded |
| Orange | `text-warning` (700) | 700 | `bg-orange-50` | `bg-orange-700` | Warning / pending |
| Red | `text-error` (600) | 500 | `bg-red-50` | `bg-red-500` | Error / overdue / danger |
| Yellow | `text-yellow-800` | 700 | `bg-yellow-50` | never — `bg-yellow-500` with `text-default` | Accent / review |

---

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Page Background | `#F9FAF8` (`--neutral-50`) | Primary page / screen background |
| 1 | Surface / Card | `#FFFFFF` (`--neutral-white`) | Card and modal backgrounds |
| — | Brand Tint | `#FEF3FF` (`--primary-50`) | Badge fills, ghost hover, focus rings |
| — | Overlay | `rgba(17, 25, 40, 0.8)` | Modal / drawer overlays |

---

## Rules

- Use `--primary-500` (#853291) for EVERY primary action button, active state, and link
- Use semantic alias names in code — never raw hex
- Do NOT invent hex values outside this token set
- Do NOT use emoji or decorative colors not in this palette
