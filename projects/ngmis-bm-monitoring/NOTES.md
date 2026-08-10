# NOTES

Project-local components (CLAUDE.md §4). The shell half is adapted from
`projects/ngmis-live/lib/ui.tsx` (copied, not imported — §1), so the promotion
candidates recorded there are the same ones here.

In `lib/ui.tsx`:

- `MisShell` / `SideNav` — the desktop chrome. Sidebar-first: the amartha lockup sits at the top of the 216px sidebar instead of in a 40px header strip. `MisShell`'s `header` slot renders the title, filter row and tabs as one full-bleed white block above the tinted body.
- `SidebarPromo` — the "We've updated our portal!" card above Report/Settings.
- `Breadcrumbs`, `PageHeading`, `Panel`, `PanelHeading`, `Tabs` — page chrome.
- `Select` — FunDS has no select; a phone uses a bottom sheet. Supports labelled `groups`, which the BP filter needs because it mixes a status and a name in one list.
- `Textarea` — same gap. `morning-report`, `evening-report`.
- `RatePill` — a rate wearing its verdict: green when it clears its standard, red when it does not, plain text when the bucket has no standard to be judged against.
- `MetricCard` — a headline rate with the target it is judged against underneath.
- `DataTable` — sortable headers, zebra rows. Used only by `report-history` now.
- `ReportTile`, `SunGlyph`, `MoonGlyph` — the morning/evening tiles. Sun and moon are genuinely absent from the 166-icon set, so they are one-offs. Currently unused by any screen; the two report screens they belong to still exist.

Elsewhere in `lib/`:

- `branch-summary-page.tsx` — the Performa page shared by both variations, so chrome cannot drift between them. Tugas and Pencairan render a deliberate "belum dirancang" empty state: invented placeholder content gets reviewed as though it were a proposal.
- `repayment-table.tsx` — the MVP cut. Counts and rate side by side in every bucket.
- `repayment-grid.tsx` — the end state. Rate leads, branch rate under each column header, and the weakest bucket called out.
- `bp-filter.tsx` — the shared filter, by target status or by BP name.
- `store.ts` + `demo.ts` — which cut is on screen, driven from the STATES panel rather than a control inside the prototype.

Judgement calls worth challenging:

- **Targets come from the biz team** — DPD 0 at 98%, DPD 1-30 at 55%, DPD 31-90 at 13% (`TARGETS`). Total Mitra and DPD 90+ carry none: the first is an aggregate of the others, and nobody is held to a number on the oldest bucket. Both are left uncoloured rather than given an invented verdict.
- **A missed bucket reports a shortfall in mitra, not percentage points.** "kurang 37 mitra" is something a BP can act on; a percentage-point gap is arithmetic the reader has to convert first.
- **`branchRate` pools every BP's mitra** rather than averaging the ten rates, so a BP with six mitra cannot swing the branch figure as hard as one with three hundred.
- **`weakestBucket` measures the gap to each bucket's own target**, not the raw rate — otherwise the oldest bucket wins every week and the answer is never useful.
- The **Flow rate to DPD 1-30** metric scores downwards while Repayment rate scores upwards; `Metric.higherIsBetter` is what keeps one of them from reading backwards.
