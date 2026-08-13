# NOTES

The shell half has been **promoted**: `AppShell` / `AppHeader` / `SideNav` /
`Breadcrumbs` now ship in `design-system/components`, drawn to this project's
geometry (DESKTOP-PLAN.md §3 Layer B). Five NG-MIS prototypes had each rebuilt
it, so this file no longer owns the chrome — it consumes it.

What is still project-local (all in `lib/ui.tsx`), and still a promotion
candidate:

- `Tabs` — content-column chrome above the table. Used by `screens/customer-list.tsx`.
- `Toolbar` — search + filter + right-aligned action above a table. Same screen.
- `DataTable` — checkbox column, sortable headers, three-line cells, zebra rows, row action. The one real gap in FunDS for back-office work. Same screen.
- `Pagination`, `TableCard` — table footer and the card it all sits on. Same screen.
- `Checkbox` (inside `DataTable`) — FunDS has `Toggle` but no checkbox; a phone doesn't multi-select rows.
- `MenuGlyph` and `AmarthaLockup` are gone — the hamburger moved inside the shared `AppHeader`, and the lockup is `<Wordmark name="amartha" />`.

Fidelity notes against Figma node 28640-12376:

- The reference shows collapsible chevrons on most sidebar sections; only Loan's sub-items are documented there, so only Loan expands here.
- `Spacing_10` (10px) in the Figma is off the FunDS 4px grid and is rounded to 8/12 — see `DESKTOP-PLAN.md` §2.
