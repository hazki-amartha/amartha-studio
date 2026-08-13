# NOTES

Project-local components (CLAUDE.md §4) — all in `lib/ui.tsx`. The shell half is
adapted from `projects/ngmis-bm-monitoring/lib/ui.tsx` (copied, not imported —
§1), so its promotion candidates are the same ones:

- `MisShell` / `SideNav` / `Breadcrumbs` / `PageHeading` — the desktop chrome. Every screen wraps in it.
- `Panel` / `PanelHeading` — the white bordered section card. FunDS `Card` is the mobile 16px tile.
- `SimpleTable` — flat table for the detail pages. `bp`, `task-majelis`.
- `AmarthaLockup` (inside `SideNav`) — thin wrapper over `<Wordmark name="amartha" />`, now that the corporate lockup ships in `design-system/assets`. The asset gap it recorded is closed.
- `CaretUp` / `CaretDown` (inside `RateCell`) — `TriangleUpFill` in the shared set is a 24px glyph, far heavier than an 8px caret inline with 12px text.

New here, and the reason the project exists:

- `GroupedTable` — a two-deep header: a band naming each DPD bucket, and the **pair** of columns under it (total loan, then terbayar). A flat header cannot say which "Terbayar" belongs to which bucket once there are five of them. `board`.
- `ViewTabs` — the board's clock switch, Mingguan / Harian. The two periods are the same table on different data, so they are one table and a switch, not two screens. `board`.
- `ToneLegend` — the one place the three colours are explained, said once above the table instead of eight times inside it. `board`.
- `SummaryLine` — the branch read on the active clock: loan aktif, terbayar, and how many BPs are on a red streak.
- `RateCell` — a repayment rate against its own bucket's target, with the week-on-week move beneath. `bp` only now; the board judges by paid share instead (below).
- `TaskCell`, `GapCell` — the cell shapes on the BP page.

Data notes:

- **The board is repayment only**, on two clocks (mingguan / harian) — scoped to what eng says is surfaceable today. Tasks and disbursement came off it: disbursement had no real source behind it, and tasks belong on the BP page, where a row can name the mitra.
- **Colour on the board is paid share, not bucket target**: ≥85% green, ≥60% yellow, below red. Judging each bucket against its own target is correct and unscannable — the same green would mean "98 of 100" in DPD 0 and "13 of 100" in DPD 31–90, so a row could not be read across. The sheet's targets keep their own column on the BP page.
- Repayment thresholds are the national **BP Loan** sheet's own: DPD 0 ≥ 98%, DPD 1–30 ≥ 55%, DPD 31–90 ≥ 13%. DPD 90+ is reported without a target there, and so carries none here.
- **Status** (`Beyond Target` / `At Risk` / `On Track`) is the row's verdict on the same paid-share thresholds as every cell, and it follows the active clock — a status that stayed weekly while the numbers beside it went daily would be the confusion the two views were split to remove.
- The board row is **name, status, figures** — nothing else. Majelis count and the sheet's `Grouping Reason` live on the BP page; on the board they competed with the figures for the same glance. A four-week red streak was tried here and removed for the same reason.
- Total Loan is **derived** as the sum of the four buckets, never stored — a stored total is one that can disagree with its own columns.
- Task kinds (MV / HV / Sos / FU) and the not-paid reason list in `lib/tasks.ts` are the A-Partner BP app's, verbatim from `projects/apartner-majelis-view/lib/collect-options.ts` — the BM is reading what the BP recorded in the field, not a summary written afterwards.
- Disbursement is **not** in the BP Loan sheet and is modelled here; it needs a real source before this goes further.
