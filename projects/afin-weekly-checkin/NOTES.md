# Notes

Project-local components (design system has no equivalent):

- `WeekTile` (`lib/ui.tsx`) — the check-in tile: stamped / delayed / this week / later, used in both homes and the ladder.
- `Meter` (`lib/ui.tsx`) — the progress bar shared by the ladder and the four-week moment.
- `TaskRow` / `WeekTasks` (`lib/ui.tsx`) — the two halves of a good week. Bayar is a button; datang kumpulan is recorded automatically and shows status only.
- `MajelisCard` + `GroupBadge` (`lib/ui.tsx`) — the three-line group card on home and its qualitative status chip.
- `WeekLegend` (`lib/ui.tsx`) — key for the three repayment verdicts (dibayar / telat / belum bayar), lives next to the tile styles it explains.
- `SplitLine` (`screens/progress-weeks.tsx`) — the limit split into her half and the group's.
- `CycleBlock` (`screens/progress-weeks.tsx`) — one four-week block of the repayment tracker: four tiles and, under them, what those weeks added to the disbursement.
- `ChapterTile` / `Habit` (`screens/home-a.tsx`) — the hi-fi week tile (done / current / increment / missed) and the two-habit rows.
- `Milestone` / `Quote` / `Habit` (`screens/home-b.tsx`) — the four-stop 12/24/36/48 track, the next-addition quote box, and the two-habit rows.
- `CriterionRow` / `GradeRow` / `WindowRowView` / `Benefit` (`screens/progress-tier.tsx`) — the criteria on the purple band, one rung of the four-grade scale with what it adds, one graded 12-week stretch, and one benefit line.
- `StatusLink` (`lib/ui.tsx`) — B's card footer into the status page.
- `HomeShell` (`lib/ui.tsx`) — the rest of the real AFin home (brand band, Poket, shortcuts, nav), copied from `projects/amarthafin-live/lib/ui.tsx` so both card options are judged against the shipped page. Unwired.

Home cards use **16px radius** and 12px padding, per Figma — the cheatsheet still
says 12px for cards. Worth resolving in the design system rather than per
project; the detail pages (progress, majelis) are still on 12px.

The four-week reward is **not cash**. It raises what the next disbursement
window pays: three good chapters inside a window means Rp1,5jt at that window,
a missed one means Rp1jt. Nothing here may say "hadiah cair sekarang".

`progress-weeks` is the **repayment tracker**, decided 2026-07-30, and it counts
in calendar weeks rather than in good ones:

- Every past week carries one of three verdicts — **dibayar / telat / belum
  bayar** — and the tile colour is the whole statement (primary / orange / red).
- Every **four calendar weeks** settle into one increase to what she can
  disburse: four clean weeks add Rp500rb, each late week takes a quarter off,
  and one week never paid means the block adds nothing. `cycleIncrement` in
  `lib/data.ts` is that rule, in one function.
- A row is therefore always **four boxes wide** — the schedule does not grow to
  make room for a skipped week, because the due dates did not move. That is the
  difference from `ladder`, which is A's original good-weeks framing and is now
  only used by home-a.
- The disbursement card sits **at the top** with the button that spends it,
  enabled exactly when a closed block left something to take.

Option B is **Status Modal**, as decided 2026-07-30 (it replaced a tier named
Mitra Juara, and the tier is gone — not parked):

- The status is a **grade on the financing**, not a membership she joins. It
  already moved down mid-tenor and recovered, which is what a grade does; a tier
  name was the card arguing with its own mechanics. It also removes the
  "earning" state — a mitra has a grade from week 1.
- Four grades: **Sangat Baik · Baik · Perlu Ditingkatkan · Tidak Lancar**, graded
  on the 12 weeks she is inside (`gradeOf` in `lib/data.ts`). Only `Tidak Lancar`
  is inherited from a stretch already closed.
- The top two **pay different increments** — Rp1,25jt against Rp900rb — which is
  the whole reason the scale has four names instead of two states. A grade with
  no consequence is decoration.
- Two criteria, and both are **hers alone**: bayar tepat waktu, datang kumpulan
  10 of 12. The **majelis is deliberately not a criterion** — she can pay all 48
  weeks and still have members fall short — so it appears once, under the limit
  benefit, as the difference between Rp7jt and Rp8jt.
- Exactly **two benefits**, on different clocks: the 12-week increment (near,
  concrete, quoted at today's grade) and the week-48 limit rise (once, hedged
  with "hingga").
- Twelve clean weeks **add to a balance**, they do not open a window. It never
  expires and she may take part of it. Partial withdrawal is **not wired** —
  `Cairkan` still takes the whole balance.

Assumptions worth revisiting (nothing in the brief fixed these):

- Withdrawal window every **12 weeks** — four per tenor, three chapters feeding each.
- An unearned pot **carries** to the next window rather than expiring.
- The 90% threshold is counted in **group-weeks** (43 of 48), so one member's miss costs the whole week.
- Whether attendance inside its 2-absence budget should cost her Sangat Baik —
  currently it does **not** (a rule that is allowed but still penalised is a
  trap); only late payment drops her to Baik.
