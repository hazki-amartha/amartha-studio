# NOTES

Project-local components (CLAUDE.md §4), copied (not imported — §1) and trimmed
from `projects/ngmis-bm-monitoring/lib/ui.tsx`'s `Panel`/`Select` pair — FunDS
has no desktop `<select>` or back-office card:

- `Panel` / `PageHeading` / `SectionTitle` (`lib/ui.tsx`) — the bordered content card and headings, sized for the 1440×900 desktop canvas. `PageHeading`'s `actions` slot holds the list's "Tambah POI" button and the form's "Batal" button.
- `Select` — plain `<select>` with a chevron, matched to `Input`'s height so the grid lines up.
- `FieldLabel` — the required/optional label row, matched to the "POI Baru" design handoff.
- `SimpleTable` / `EmptyState` — the POI list table and its empty state, same shape as `ngmis-bm-monitoring`'s.

`lib/store.ts` holds the POI list in a module store (screens remount on `go()`,
so `useState` alone would lose a newly-submitted POI on the way back to the
list) — three representative rows seeded, matching the "keep mock data to
what's on screen" rule.
