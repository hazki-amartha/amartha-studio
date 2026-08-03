# Notes

Project-local components (design system has no equivalent):

- `WeekTile` (`lib/ui.tsx`) — the check-in tile: dibayar / telat / belum bayar / this week / later.
- `Meter` (`lib/ui.tsx`) — the progress bar on the majelis page.
- `GroupBadge` (`lib/ui.tsx`) — the majelis's qualitative status chip.
- `WeekLegend` (`lib/ui.tsx`) — key for the three repayment verdicts, lives next to the tile styles it explains.
- `StatusPill` (`lib/ui.tsx`) — the one status pill, three tones. `GroupBadge` and `PaymentPill` are both it, so the group and a member inside it read in the same language.
- `MemberRow` (`screens/majelis.tsx`) — one mitra's week: name, and this week's payment pill.
- `Milestone` / `Quote` / `Habit` (`screens/home-b.tsx`) — the four-stop 12/24/36/48 track, the next-addition quote box, and the two-habit rows.
- `CriterionRow` / `WindowBlock` (`screens/progress-tier.tsx`) — the criteria rows, and one graded 12-week stretch as a collapsible block.
- `StatusLink` (`lib/ui.tsx`) — the home card's footer into the status page.
- `HomeShell` (`lib/ui.tsx`) — the rest of the real AFin home (brand band, Poket, shortcuts, nav), copied from `projects/amarthafin-live/lib/ui.tsx` so the card is judged against the shipped page. Unwired.

Home cards use **16px radius** and 12px padding, per Figma — the cheatsheet still
says 12px for cards. Worth resolving in the design system rather than per
project; the detail pages (status, majelis) are still on 12px.

**Option A is gone** (dropped 2026-08-03). The prototype used to carry two home
cards behind the same journey — A anchored on a rupiah limit increase with a
four-week Rp500rb chapter behind it, B on the status. A's home, its repayment
tracker and its four-week celebration are deleted, along with the chapter/pot
arithmetic and the demo states that only reached them. What is left is one
concept, B, on a 12-week clock.

**Status Modal** (decided 2026-07-30, replacing a tier named Mitra Juara):

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
  weeks and still have members fall short — so it lives on its own page, where
  it moves the week-48 limit and nothing else.
- Twelve clean weeks **add to a balance**, they do not open a window. It never
  expires and she may take part of it. Partial withdrawal is **not wired** —
  `Cairkan` still takes the whole balance.

The majelis page **names who has not paid** as of 2026-08-03, reversing an
earlier rule that withheld it (a face-to-face group already knows, and a
screenshot-able list adds a permanent record to a room that has none). It now
follows `afin-milestone-journey`'s majelis page: her own row under "Anda", the
rest under "Anggota", a pill on every line. `paidThisWeek` in `lib/data.ts`
counts off that roster rather than off `groupShort`, so home's sentence and the
rows can never disagree.

The status page's header carried the two benefits (the next increment, the
week-48 limit rise) until 2026-08-03; the designer cut them. The twelve weeks
behind each addition are **collapsed by default** from the same date — four
stretches standing open is 48 boxes on one page.

Assumptions worth revisiting (nothing in the brief fixed these):

- Withdrawal window every **12 weeks** — four per tenor.
- An unearned addition **carries** to the next window rather than expiring.
- The 90% threshold is counted in **group-weeks** (43 of 48), so one member's miss costs the whole week.
- Whether attendance inside its 2-absence budget should cost her Sangat Baik —
  currently it does **not** (a rule that is allowed but still penalised is a
  trap); only late payment drops her to Baik.
