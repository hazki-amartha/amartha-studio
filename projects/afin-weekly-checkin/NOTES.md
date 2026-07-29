# Notes

Project-local components (design system has no equivalent):

- `WeekTile` (`lib/ui.tsx`) — the check-in tile: stamped / delayed / this week / later, used in both homes and the ladder.
- `Meter` (`lib/ui.tsx`) — the progress bar shared by the ladder and the four-week moment.
- `TaskRow` / `WeekTasks` (`lib/ui.tsx`) — the two halves of a good week. Bayar is a button; datang kumpulan is recorded automatically and shows status only.
- `MajelisCard` + `GroupBadge` (`lib/ui.tsx`) — the three-line group card on home and its qualitative status chip.
- `SplitLine` (`screens/progress-weeks.tsx`) — the limit split into her half and the group's.
- `ChapterBlock` (`screens/progress-weeks.tsx`) — four week tiles and the increment they unlock, labelled by week range.
- `ChapterTile` / `Habit` (`screens/home-a.tsx`) — the hi-fi week tile (done / current / increment / missed) and the two-habit rows.
- `Benefit` / `ThisWeek` (`screens/home-b.tsx`) — one line of what the tier is worth (glyph, benefit, and on the limit line only the majelis note), and the single owed-this-week row that replaces A's board.
- `HomeShell` (`lib/ui.tsx`) — the rest of the real AFin home (brand band, Poket, shortcuts, nav), copied from `projects/amarthafin-live/lib/ui.tsx` so both card options are judged against the shipped page. Unwired.

Home cards use **16px radius** and 12px padding, per Figma — the cheatsheet still
says 12px for cards. Worth resolving in the design system rather than per
project; the detail pages (progress, majelis) are still on 12px.

The four-week reward is **not cash**. It raises what the next disbursement
window pays: three good chapters inside a window means Rp1,5jt at that window,
a missed one means Rp1jt. Nothing here may say "hadiah cair sekarang".

Option B's tier rules, as decided 2026-07-29:

- One destination, **Mitra Juara**, above an unnamed default (`Mitra`).
- Earned on her **own** 48 good weeks. The majelis does **not** gate it — it
  makes the limit benefit bigger, said as a note on that one line, so a mitra
  with a perfect record is never told she failed because of her group.
- The status **carries into the next tenor** and is maintained by the same
  weekly rule (`juara-maintained` state). Cycle two itself is not built.
- Benefits stay wordy, never numeric, on home: limit lebih tinggi · pencairan
  lebih fleksibel · pilihan tenor lebih banyak. The rupiah split lives on
  `progress-weeks`, which is now the single detail page for both options.
- **No board on home.** A puts the four-week chapter on the homepage; B keeps
  only the status, the benefits and the instalment owed this week, and sends
  the ladder (tiles + increments) one tap away. So the two options differ in
  shape as well as anchor — the open question B exists to answer is whether a
  status is a strong enough anchor without a streak on home.

Assumptions worth revisiting (nothing in the brief fixed these):

- Withdrawal window every **12 weeks** — four per tenor, three chapters feeding each.
- An unearned pot **carries** to the next window rather than expiring.
- The 90% threshold is counted in **group-weeks** (43 of 48), so one member's miss costs the whole week.
- What a bad tenor does to an existing Juara (demotion? grace period?) is
  **undecided** — the prototype only shows the status being kept.
