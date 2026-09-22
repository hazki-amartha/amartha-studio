# NOTES

Project-local components (CLAUDE.md §4), copied (not imported — §1) and trimmed
from `projects/ngmis-bm-monitoring/lib/ui.tsx`'s `Panel`/`Select` pair — FunDS
has no desktop `<select>` or back-office card:

- `Panel` / `PageHeading` / `SectionTitle` (`lib/ui.tsx`) — the bordered content card and headings, sized for the 1440×900 desktop canvas.
- `Select` — plain `<select>` with a chevron, matched to `Input`'s height so the grid lines up.
- `FieldLabel` — the required/optional label row, matched to the "POI Baru" design handoff.
