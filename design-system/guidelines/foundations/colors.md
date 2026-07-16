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
| `border-default` | `#E5E7EB` | `--neutral-200` | Card and input borders |
| `border-light` | `#F9FAF8` | `--neutral-50` | Subtle dividers |

> **The aliases are text/border-only.** There are no `bg-*` semantic aliases —
> `bg-default` etc. do not exist. The only semantic background is `bg-overlay`
> (modal/sheet backdrop). For surfaces, use the raw scale classes
> (`bg-neutral-white`, `bg-neutral-50`, `bg-primary-50`, …).

### Status backgrounds on hand-built surfaces

The Badge component pairs status colors for you, but when you build a tinted
status surface yourself (e.g. a success/error icon circle), apply the same
rule manually: **500 foreground on the matching 50-tint background** —
`text-green-500` on `bg-green-50`, `text-red-500` on `bg-red-50`, and so on.

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

**Rule:** Always pair the 500 foreground with its 50-tint background. Do NOT use a status color on white or `--neutral-50` without the tint.

| Color | 500 (Foreground) | 50 (Background Tint) | Role |
|-------|-----------------|----------------------|------|
| Blue | `#056DCE` (`--blue-500`) | `#EDF7FF` (`--blue-50`) | Informational |
| Green | `#009C6A` (`--green-500`) | `#E4FCEF` (`--green-50`) | Success / funded |
| Orange | `#F7941D` (`--orange-500`) | `#FDF4E9` (`--orange-50`) | Warning / pending |
| Red | `#D73630` (`--red-500`) | `#FFF4F3` (`--red-50`) | Error / overdue / danger |
| Yellow | `#EAB20B` (`--yellow-500`) | `#FFFED9` (`--yellow-50`) | Accent / review |

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
