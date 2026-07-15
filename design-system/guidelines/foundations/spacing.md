# Spacing & Shapes — FunDS Lite

**Base unit:** 4px — all spacing values are multiples of 4 (except 2px for micro gaps).

---

## Spacing Scale

| Class | Value | Use |
|-------|-------|-----|
| `space-0` / `p-0` / `gap-0` | 0px | Flush elements |
| `space-2` / `p-2` / `gap-2` | 2px | Micro gap (icon + label) |
| `space-4` / `p-4` / `gap-4` | 4px | Tight spacing |
| `space-8` / `p-8` / `gap-8` | 8px | Component inner gap |
| `space-12` / `p-12` / `gap-12` | 12px | Card padding, section gap |
| `space-16` / `p-16` / `gap-16` | 16px | Page padding, modal padding |
| `space-20` / `p-20` / `gap-20` | 20px | Button padding (xl) |
| `space-24` / `p-24` / `gap-24` | 24px | Section separation |
| `space-32` / `p-32` / `gap-32` | 32px | Large block separation |
| `space-40` / `p-40` / `gap-40` | 40px | Feature-level spacing |
| `space-48` / `p-48` / `gap-48` | 48px | Top bar height, major sections |

**FORBIDDEN:** 5px, 6px, 10px, 15px, 25px, 30px — never use values not in this scale.

---

## Border Radius

| Element | Value | Class |
|---------|-------|-------|
| Buttons, badges, toggle tracks | 9999px | `rounded-full` |
| Inputs, selects, text areas | 8px | `rounded-8` |
| Cards, modals, bottom sheets | 12px | `rounded-12` |
| Chips, small tags | 6px | `rounded-6` |

Do NOT use rectangular buttons (radius 0) or lightly rounded buttons (e.g. 4px, 8px) — pill is the ONLY permitted button shape.

---

## Layout Patterns

### Mobile Screen

| Token | Value | Notes |
|-------|-------|-------|
| `--page-padding-x` | 16px | Horizontal edge margin for ALL screen content |
| `--page-padding-top` | 16px | Top padding below topbar |
| `--section-gap` | 12px | Vertical gap between cards/sections |

### Card

| Token | Value | Notes |
|-------|-------|-------|
| `--card-padding` | 12px | Internal card padding — NOT 20px |
| `--card-gap` | 8px | Gap between sibling cards |

### Topbar / Navigation Header

| Token | Value |
|-------|-------|
| `--topbar-height` | 48px |
| `--topbar-padding-x` | 16px |

---

## Rules

- Use `var(--page-padding-x)` (16px) for all screen horizontal margins
- Card internal padding is 12px — do NOT use 20px for cards
- Do NOT nest cards
- Section gaps between cards are 12px — do NOT use 16px or 24px between sections
