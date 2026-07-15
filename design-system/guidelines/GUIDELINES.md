# FunDS Lite — Design System Overview

FunDS Lite is the lightweight design system for **Amartha Financial** (https://amartha.com/), a micro-finance lending company focused on productive micro loans for grassroot women in Indonesia.

The system targets **mobile-first** screens (iOS/Android) and internal dashboards. A single brand purple (`#853291`) anchors every primary action, link, and active state.

---

## Location

The design system lives in this repo at `design-system/` — components in
`design-system/components/`, tokens in `design-system/tokens.ts` +
`design-system/tokens.css`, locked Tailwind scales in the root
`tailwind.config.ts`. Import components from `@/design-system/components`.
(The former `@mhazki/funds-lite` npm package is deprecated; see
[setup.md](setup.md) for historical setup notes.)

---

## Key Constraints

| Rule | Value |
|------|-------|
| Brand color | `#853291` (primary-500) — the ONLY primary action color |
| Font | Inter — weights **500** and **700** only |
| Spacing | 4px grid: 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48px only |
| Button radius | 9999px (pill) — never rectangular |
| Card radius | 12px |
| Input radius | 8px |
| Status colors | Always pair 500 foreground with its 50-tint background |

Do NOT invent hex values. Do NOT use arbitrary spacing. Do NOT use font-weight 400, 600, or 800.

---

## Platforms & Products

- **AmarthaFin App** — Consumer iOS/Android (borrowers, investors, PPOB users)
- **NG-MIS** — Internal ops system / CRM
- **A-Partner App** — Field agent app

Products: Modal (loan) · Celengan · GGS · B2B Funding · PPOB/AmarthaLink · Poket (wallet)

---

## Documentation Index

### Foundations
- [colors.md](foundations/colors.md) — Color tokens, semantic aliases, status color rules
- [typography.md](foundations/typography.md) — Type scale, weight rules, usage
- [spacing.md](foundations/spacing.md) — Spacing scale, border radius, layout patterns

### Components
- [components/overview.md](components/overview.md) — All components at a glance
- [components/button.md](components/button.md)
- [components/card.md](components/card.md)
- [components/list-row.md](components/list-row.md)
- [components/input.md](components/input.md)
- [components/badge.md](components/badge.md)
- [components/toggle.md](components/toggle.md)
- [components/selectable-card.md](components/selectable-card.md)
- [components/modal.md](components/modal.md)
- [components/bottom-sheet.md](components/bottom-sheet.md)
- [components/navigation-bar.md](components/navigation-bar.md)
- [components/navigation-header.md](components/navigation-header.md)
