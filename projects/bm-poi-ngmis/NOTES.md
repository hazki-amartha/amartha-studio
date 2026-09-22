# NOTES

`lib/shell.tsx`'s `BmShell` uses the shared `AppShell`/`SideNav`
(`@/design-system/components`, promoted from the NG-MIS shell) — imported, not
copied, since using a shared component is ordinary project work (§1 only bars
reaching into another PROJECT's folder). The NAV list itself is copied from
`projects/ngmis-bm-monitoring/lib/shell.tsx` (§1), reordered so Branches opens
on **POI creation** (this project's own screen) above FO monitoring, rather
than that project's own default.

Project-local components (CLAUDE.md §4), copied (not imported — §1) and trimmed
from `projects/ngmis-bm-monitoring/lib/ui.tsx`'s `Panel`/`Select`/`SidebarPromo`
— FunDS has no desktop `<select>` or back-office card:

- `Panel` / `PageHeading` / `SectionTitle` (`lib/ui.tsx`) — the bordered content card and headings, sized for the 1440×900 desktop canvas. `PageHeading`'s `actions` slot holds the list's "Tambah POI" button and the form's "Batal" button.
- `SidebarPromo` — the "We've updated our portal!" card above Report/Settings in the sidebar.
- `Select` — plain `<select>` with a chevron, matched to `Input`'s height so the grid lines up.
- `FieldLabel` — the required/optional label row, matched to the "POI Baru" design handoff.
- `SimpleTable` / `EmptyState` — the POI list table and its empty state, same shape as `ngmis-bm-monitoring`'s. A `TableRow.onClick` gets the hover/pointer treatment; a row without one stays inert.

`lib/store.ts` holds the POI list in a module store (screens remount on `go()`,
so `useState` alone would lose a newly-submitted POI on the way back to the
list) — three representative rows seeded, matching the "keep mock data to
what's on screen" rule.

The POI Baru form's fields live in that same store as a `draft`
(`setDraftField` / `useDraft`), not local `useState` — that's what lets the
**Auto-filled** state (`poi-create`'s `states`, `fillSampleDraft`) and an
edited row both fill the form before the screen mounts. `editingId`
(`useEditingId`) is which POI a list row is editing, or `null` for a fresh
one — set by `beginCreate`/`beginEdit`, called from the list *before*
`flow.go('poi-create')`, and read back by the form to switch its title
("POI Baru" / "Edit POI") and Submit between `addPoi`/`updatePoi`. Both
clear the draft and `editingId` afterward (`beginCreate` again) so the next
visit starts blank.
