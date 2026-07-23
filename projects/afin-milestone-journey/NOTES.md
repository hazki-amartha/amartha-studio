# Notes

Project-local components (§4 missing-component protocol) — all in `lib/ui.tsx`:

- **StickyBar** — pinned footer for a screen's CTA; `Screen` only pins the top bar. Used on 9 screens.
- **FullWidthButton** — `Button` is inline-sized; every footer CTA here is full-bleed.
- **OptionCard** — radio card with a *trailing* control and arbitrary content inside the selected card (inline amount field, live Poket balance); `SelectableCard` leads with its control and takes text-only slots. Used on `amount` and `method`.
- **TaskButton** — the small pill on a home task; it has five states (do / check / done / retry / checking) that `Button`'s variants don't cover.
- **Meter** — data-driven progress bar. Used on `home`, `progress`, `amount`.
- **IconTile** — tinted square or circle behind an icon. Used across `home`, `method`, `majelis`.
- **CopyBlock / InfoBlock / Notice / Steps / Hero / ResultHeader / StatRow / Chip / StatusMark / SectionTitle / Caption** — the shared vocabulary of the payment-instruction and outcome screens.
- **`lib/icons.tsx`** — FunDS Lite ships no icon library; this is the minimum set these screens need.
