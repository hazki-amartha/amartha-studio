# NOTES

Project-local components (CLAUDE.md §4) — all in `lib/ui.tsx`. The shell half is
adapted from `projects/ngmis-bm-monitoring/lib/ui.tsx` (copied, not imported —
§1), so its promotion candidates are the same ones:

- `MisShell` / `SideNav` / `Breadcrumbs` / `PageHeading` — the desktop chrome. Every screen wraps in it.
- `Panel` / `PanelHeading` — the white bordered section card. FunDS `Card` is the mobile 16px tile.
- `SimpleTable` — flat table for the detail pages. `bp`, `task-majelis`.
- `AmarthaLockup` (inside `SideNav`) — `design-system/assets` ships product wordmarks but no corporate amartha lockup. A real asset gap; `ngmis-live` and `ngmis-bm-monitoring` record the same one.
- `CaretUp` / `CaretDown` (inside `RateCell`) — `TriangleUpFill` in the shared set is a 24px glyph, far heavier than an 8px caret inline with 12px text.

New here, and the reason the project exists:

- `GroupedTable` — a two-deep header: a band naming each subject and the clock it runs on, then the columns under it. The board's whole argument is that tasks, repayment and disbursement belong on one row per BP; `ngmis-bm-monitoring`'s `DataTable` is flat and cannot say which columns belong to which subject. `board`.
- `RateCell` — a repayment rate coloured against **its own bucket's target**, with the week-on-week move beneath. `board`, `bp`.
- `TaskCell`, `GapCell`, `SummaryLine` — the other three cell shapes on the board.

Data notes:

- Repayment thresholds are the national **BP Loan** sheet's own: DPD 0 ≥ 98%, DPD 1–30 ≥ 55%, DPD 31–90 ≥ 13%. DPD 90+ is reported without a target there, and so carries none here. A single flat target would read backwards in half the columns.
- Task kinds (MV / HV / Sos / FU) and the not-paid reason list in `lib/tasks.ts` are the A-Partner BP app's, verbatim from `projects/apartner-majelis-view/lib/collect-options.ts` — the BM is reading what the BP recorded in the field, not a summary written afterwards.
- Disbursement is **not** in the BP Loan sheet and is modelled here; it needs a real source before this goes further.
