# NOTES

Project-local components (CLAUDE.md §4). The shell half is adapted from
`projects/ngmis-live/lib/ui.tsx` (copied, not imported — §1), so the promotion
candidates recorded there are the same ones here.

In `lib/ui.tsx`:

- `MisShell` / `SideNav` — the desktop chrome. Sidebar-first: the amartha lockup sits at the top of the 216px sidebar instead of in a 40px header strip, which is the frame the BM portal uses. `MisShell`'s `header` slot renders the title, filter row and tabs as one full-bleed white block above the tinted body. Used by `lib/shell.tsx`, which every screen wraps in.
- `SidebarPromo` — the "We've updated our portal!" card above Report/Settings. Same file.
- `Breadcrumbs`, `PageHeading`, `Panel`, `PanelHeading` — content-column chrome. All four screens.
- `Tabs` — Task / Repayment / Disbursement under the page title. `branch-summary`.
- `Select` — FunDS has no select; a phone uses a bottom sheet for this. Header filters and both report forms.
- `Textarea` — same gap. `morning-report`, `evening-report`.
- `StatCard` — KPI tile: label, figure, day-on-day delta, month average, optional second figure. `branch-summary`.
- `ProgressBar` — task-completion meter, red/yellow/green by threshold. `branch-summary`.
- `DataTable` — sortable headers, zebra rows. `branch-summary`, `report-history`.
- `Pagination` — numbered pages plus a per-page select. `branch-summary`.
- `ReportTile`, `SunGlyph`, `MoonGlyph` — the morning/evening tiles. Sun and moon are genuinely absent from the 166-icon set, so they are one-offs rather than additions to the shared module. Currently unused by any screen — the Daily Report section was removed from the dashboard, but the two report screens they belong to still exist.

In `lib/repayment-view.tsx` — the whole Repayment tab, kept out of the screen
file because it is a full view rather than a section:

- `Paid` — a "Terbayar" figure coloured against a benchmark for **its own DPD bucket** (`RATE_BANDS` in `lib/data.ts`). One flat threshold would paint the DPD 90+ column red on every row, since collecting little on the oldest bucket is normal — that leaves no signal at all. The bands are inferred from the reference screenshot's colouring, not from real targets.
- `Rank` — the numbered badge; the top 3 are filled red and their rows tinted.

Open questions on the Repayment tab:

- No period control — the figures are undated. No week or month selector exists.
- Row order is fixed in the data, not computed, so it will not re-sort if the figures change.
- No actions anywhere on the tab. It is purely a monitoring surface.

Deliberate divergence elsewhere:

- The **Flow rate to DPD 1-30** delta on the Task tab reads red, not green. A rise in DPD flow is bad news; the source screenshot gives it the same green treatment as the KPIs where a rise is good, which inverts the meaning. `StatDelta.good` is the flag that separates the two.
- KPI figures are `text-24`, the largest size token. The source screenshot's are ~32px, which is off-scale.
