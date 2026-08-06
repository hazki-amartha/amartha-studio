# NOTES

Project-local components (CLAUDE.md §4) — all in `lib/ui.tsx`. The shell half is
adapted from `projects/ngmis-live/lib/ui.tsx` (copied, not imported — §1), so the
promotion candidates there are the same ones here:

- `MisShell` / `SideNav` — the desktop chrome. Sidebar-first: the amartha lockup sits at the top of the 216px sidebar instead of in a 40px header strip, which is the frame the BM portal screenshot uses. Used by `lib/shell.tsx`, which every screen wraps in.
- `SidebarPromo` — the "We've updated our portal!" card above Report/Settings. Same file.
- `Breadcrumbs`, `PageHeading`, `Panel`, `PanelHeading` — content-column chrome. All four screens. `MisShell`'s `header` slot renders the title, filter row and tabs as one full-bleed white block above the tinted body.
- `Tabs` — Overview / Repayment / Disbursement under the page title. Each tab narrows which KPIs and which table columns show, so switching changes the read rather than just the underline. `branch-summary`.
- `Select` — FunDS has no select; a phone uses a bottom sheet for this. Used by the two dashboard filters, the per-page control and both report forms.
- `Textarea` — same gap. `morning-report`, `evening-report`.
- `StatCard` — the KPI tile: label, figure, day-on-day delta, month average, optional second figure ("New mitra"). `branch-summary`.
- `ReportTile` — the morning/evening tile inside Daily Report. `branch-summary`.
- `ProgressBar` — task-completion meter, red/yellow/green by threshold. `branch-summary`.
- `DataTable` — sortable headers, zebra rows. `branch-summary`, `report-history`.
- `Pagination` — numbered pages plus a per-page select, which is the shape the reference draws (`ngmis-live`'s is prev/next only).
- `SunGlyph` / `MoonGlyph` — morning and evening marks, genuinely absent from the 166-icon set. One-offs, not additions to the shared module.
- `TriangleUpGlyph` / `TriangleDownGlyph` (inside `StatCard`) — `TriangleUpFill` in the shared set is a 24px glyph that reads far heavier than the 8px caret sitting inline with 12px text.
- `AmarthaLockup` — `design-system/assets` ships product wordmarks but no corporate amartha lockup, so the sidebar renders the word alone rather than inventing the flower mark. A real asset gap; `ngmis-live` records the same one.

Deliberate divergences from the source screenshot:

- The **Flow rate to DPD 1-30** delta reads red, not green. A rise in DPD flow is bad news; the screenshot draws the same green treatment as the four KPIs where a rise is good, which inverts the meaning. `StatDelta.good` is the flag that separates the two.
- The KPI figure is `text-24`, the largest size token. The screenshot's is ~32px, which is off-scale.
