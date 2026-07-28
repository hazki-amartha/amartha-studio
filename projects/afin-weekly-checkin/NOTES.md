# Notes

Project-local components (design system has no equivalent):

- `WeekTile` (`lib/ui.tsx`) — the check-in tile: stamped / delayed / this week / later, used in all three homes and the ladder.
- `RewardTile` (`lib/ui.tsx`) — the locked-vs-open milestone reward chip beside a chapter row.
- `Destination` + `Meter` (`lib/ui.tsx`) — the week-48 limit-increase line and its progress bar, shared by every screen.
- `TaskRow` / `WeekTasks` (`lib/ui.tsx`) — the two halves of a good week (bayar / absen), which stamp the week automatically once both land.
- `HomeShell` (`lib/ui.tsx`) — the rest of the real AFin home (brand band, Poket, shortcuts, nav) so the three card options are judged in context. Unwired.
