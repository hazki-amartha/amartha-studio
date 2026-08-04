# NOTES

Project-local components (CLAUDE.md §4) — all in `lib/ui.tsx`, all promotion
candidates for `design-system/components` once a second desktop project wants
them (see `DESKTOP-PLAN.md` §3 Layer B):

- `MisShell` / `MisHeader` — 1440×900 chrome: 40px header + 232px sidebar. The desktop counterpart to `Screen`, which is mobile-shaped. Used by `screens/customer-list.tsx`.
- `SideNav` — 232px nav, collapsible to 56px, groups expand in place. Same screen.
- `Breadcrumbs`, `Tabs` — content-column chrome above the table. Same screen.
- `Toolbar` — search + filter + right-aligned action above a table. Same screen.
- `DataTable` — checkbox column, sortable headers, three-line cells, zebra rows, row action. The one real gap in FunDS for back-office work. Same screen.
- `Pagination`, `TableCard` — table footer and the card it all sits on. Same screen.
- `Checkbox` (inside `DataTable`) — FunDS has `Toggle` but no checkbox; a phone doesn't multi-select rows.
- `MenuGlyph` — hamburger, genuinely absent from the 166-icon set. One-off, not an addition to the shared module.
- `AmarthaLockup` — `design-system/assets` ships product wordmarks but no corporate amartha lockup, so the header renders the word alone rather than inventing the flower mark. A real asset gap.

Fidelity notes against Figma node 28640-12376:

- The reference shows collapsible chevrons on most sidebar sections; only Loan's sub-items are documented there, so only Loan expands here.
- `Spacing_10` (10px) in the Figma is off the FunDS 4px grid and is rounded to 8/12 — see `DESKTOP-PLAN.md` §2.
