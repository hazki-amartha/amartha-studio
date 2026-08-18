# NOTES

Project-local components (CLAUDE.md §4). The shell half is adapted from
`projects/ngmis-live/lib/ui.tsx` (copied, not imported — §1), so the promotion
candidates recorded there are the same ones here.

In `lib/ui.tsx`:

- `MisShell` / `SideNav` — the desktop chrome. Sidebar-first: the amartha lockup sits at the top of the 216px sidebar instead of in a 40px header strip. `MisShell`'s `header` slot renders the title, filter row and tabs as one full-bleed white block above the tinted body.
- `SidebarPromo` — the "We've updated our portal!" card above Report/Settings.
- `Breadcrumbs`, `PageHeading`, `Panel`, `PanelHeading`, `Tabs` — page chrome.
- `Select` — FunDS has no select; a phone uses a bottom sheet. Supports labelled `groups`, which the BP filter needs because it mixes a status and a name in one list.
- `RatePill` — a rate wearing its verdict: green when it clears its standard, red when it does not, plain text when the bucket has no standard to be judged against.
- `MetricCard` — a headline rate with the target it is judged against underneath.
- `SideSheet` / `SheetSection` — the right-hand panel the action brief opens in. FunDS ships `BottomSheet`, which is the phone answer: on a 1440-wide console a sheet from the bottom covers the table it is about. Positioned `absolute` so it stays inside the device frame in prototype view.

Elsewhere in `lib/`:

- `branch-summary-page.tsx` — the Performa page shared by both variations, so chrome cannot drift between them. Tugas renders a deliberate "belum dirancang" empty state: invented placeholder content gets reviewed as though it were a proposal.
- `repayment-table.tsx` — the MVP cut. Counts and rate side by side in every bucket.
- `repayment-grid.tsx` — the end state. Rate leads, and every BP missing a standard carries a recommended action with a brief behind it.
- `bp-filter.tsx` — the shared filter, by target status or by BP name.
- `store.ts` + `demo.ts` — which cut is on screen and which BPs have a task booked. The cut is driven from the STATES panel rather than a control inside the prototype.

Judgement calls worth challenging:

- **Targets come from the biz team** — DPD 0 at 98%, DPD 1-30 at 55%, DPD 31-90 at 13% (`TARGETS`). Total Mitra and DPD 90+ carry none: the first is an aggregate of the others, and nobody is held to a number on the oldest bucket. Both are left uncoloured rather than given an invented verdict.
- **A missed bucket reports a shortfall in mitra, not percentage points.** "kurang 37 mitra" is something a BP can act on; a percentage-point gap is arithmetic the reader has to convert first.
- **The recommended action keys off the bucket with the biggest shortfall in mitra**, because the three failures want different responses: nothing collected at DPD 0 is what a surprise visit tests, DPD 1-30 is a coaching problem, and 31-90 is past what a BP can fix alone. A BP clearing every standard gets no action at all — one on every row would bury the ones that need it.
- **A created task lives in the module store, not the grid**, because switching tab or state unmounts the grid and a task disappearing mid-walkthrough is worse than useless.
- The **Flow rate to DPD 1-30** metric scores downwards while Repayment rate scores upwards; `Metric.higherIsBetter` is what keeps one of them from reading backwards.
- `DisbursementTable` / `DisbursementMetrics` (`disbursement-table.tsx`) — the Pencairan tab, which used to be a "belum dirancang" placeholder. NoA and Nilai each split into mitra baru / mitra lanjutan, plus the rupiah still missing from the month's target.
- **Renewal is shown as a rate, not just a count.** Eleven renewals is excellent on a book with twelve mitra maturing and poor on one with twenty, and the target ("85% renewal mitra cair per bulan") is written as a percentage — so the mitra lanjutan cell carries "% dari N" under its count, against a per-BP `renewalDue`.
- **Pencairan is reported by the MONTH, Pembayaran by the week.** The targets were always monthly; the page used to report a week and pace them, which meant a figure was judged against a quarter of the number printed beside it. The scope line above the table now follows the tab.
- **Pencairan wears colour on one figure only — the renewal rate.** Same rule as Pembayaran: counts and rupiah are facts and stay black, the rate is the judgement. The earlier red/orange/green banding coloured almost every cell, which left nothing standing out, and it is gone along with the standalone "Kurang dari target" column — the two shortfalls now read as caption lines beneath their own group, the way Pembayaran does it.
