# Notes

Project-local components (design system has no equivalent):

- `WeekTile` (`lib/ui.tsx`) — the check-in tile: stamped / delayed / this week / later, used in all three homes and the ladder.
- `Destination` + `Meter` (`lib/ui.tsx`) — the combined limit-increase line and its progress bar, shared by home A, the ladder and the reward moment.
- `TaskRow` / `WeekTasks` (`lib/ui.tsx`) — the two halves of a good week. Bayar is a button; datang kumpulan is recorded automatically and shows status only.
- `MajelisCard` + `GroupBadge` (`lib/ui.tsx`) — the three-line group card on home and its qualitative status chip.
- `SplitLine` (both progress screens) — the limit split into her half and the group's.
- `GridWeek` / `Legend` (`screens/progress-weeks.tsx`) — the 48-cell week grid and its key.
- `Stamp` (`screens/progress-rewards.tsx`) — one of the twelve collected rewards.
- `HomeShell` (`lib/ui.tsx`) — the rest of the real AFin home (brand band, Poket, shortcuts, nav) so the three card options are judged in context. Unwired.

The two detail pages are **alternatives, never companions** — one counts in weeks
(A & B), the other in rewards (C). A mitra sees exactly one. Each home links only
to its own; nothing in the app should ever show both units.

Assumptions worth revisiting (nothing in the brief fixed these):

- Withdrawal window every **12 weeks** — four per tenor, three milestones feeding each.
- An unearned pot **carries** to the next window rather than expiring.
- The 90% threshold is counted in **group-weeks** (43 of 48), so one member's miss costs the whole week.
