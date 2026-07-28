# Notes

Project-local components (design system has no equivalent):

- `WeekTile` (`lib/ui.tsx`) — the check-in tile: stamped / delayed / this week / later, used in all three homes and the ladder.
- `Destination` + `Meter` (`lib/ui.tsx`) — the week-48 limit-increase line and its progress bar, shared by home A, the ladder and the reward moment.
- `TaskRow` / `WeekTasks` (`lib/ui.tsx`) — the two halves of a good week. Bayar is a button; datang kumpulan is recorded automatically and shows status only.
- `Stamp` (`screens/home-c.tsx`) — one of the twelve milestone stamps in option C's strip.
- `HomeShell` (`lib/ui.tsx`) — the rest of the real AFin home (brand band, Poket, shortcuts, nav) so the three card options are judged in context. Unwired.
