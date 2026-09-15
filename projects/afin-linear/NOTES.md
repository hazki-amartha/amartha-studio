# Notes

Project-local components (design system has no equivalent):

- `HomeShell` (`lib/ui.tsx`) — the real AFin home around the cards, copied from `afin-weekly-checkin` / `amarthafin-live`. Unwired.
- `Stat` (`lib/ui.tsx`) — stat tile on the riwayat summary.
- `RewardCard` / `Checklist` / `CheckRow` (`screens/home.tsx`) — purple gradient frame with progress and amounts, and the white "Pertahankan kelancaran" checklist panel of the two home cards.
- `MemberRow` (`screens/majelis.tsx`) — one mitra in the majelis roster, with payment pill; after `afin-milestone-journey`.
- `WeekTile` (`screens/riwayat.tsx`) — one week of repayment history, with an absence dot.

Assumptions (not fixed by the brief):

- Majelis milestones at weeks **12, 24, 36** — week 48 is the limit increase, not a bonus.
- One week with any member unpaid breaks that 12-week streak.
- Her eligibility for a bonus is judged on **late payment inside that stretch** only; attendance does not block it.
- Kondisi pinjaman: any late payment → Kurang Lancar; more than 2 absences → Lancar (s/d Rp7,5jt); else Sangat Lancar (s/d Rp8jt).
- The bonus goes to Poket.
