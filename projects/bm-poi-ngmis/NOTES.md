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
- `FoAvailabilityGrid` — new here, not copied from anywhere. Days × hour slots (09.00–18.00), under Jadwal/Assigned FO in Detail Sosialisasi, for the ONE already-selected Assigned FO — not all four at once, since the BM has already picked who and this is about when. A busy cell names the POI it's already booked for at that hour (not just greyed out, since "what's Sari doing Monday at 10" is what the BM needs to route around); a free cell is a button that sets Jadwal to that day and Jam ramai POI to that hour (start = clicked hour, end = +1h). Bookings are read straight off the existing POI list (`jadwal` + `jamMulai`/`jamSelesai` per record, filtered to the selected FO) — no separate schedule data to seed or keep in sync. The record being edited is excluded from its own bookings. Before a FO is picked, the field shows a plain empty-state prompt instead of an empty/meaningless grid.
- `ReadField` — new here. The label style from the form's own `FieldLabel`, paired with plain text instead of an input, for the read-only detail screen. An empty value prints a placeholder dash rather than going blank.

`lib/store.ts` holds the POI list in a module store (screens remount on `go()`,
so `useState` alone would lose a newly-submitted POI on the way back to the
list) — three representative rows seeded, matching the "keep mock data to
what's on screen" rule.

The POI Baru form's fields live in that same store as a `draft`
(`setDraftField` / `useDraft`), not local `useState` — that's what lets the
**Auto-filled** state (`poi-create`'s `states`, `fillSampleDraft`) and an
edited row both fill the form before the screen mounts. `editingId`
(`useEditingId`) is which POI is being edited, or `null` for a fresh one —
set by `beginCreate`/`beginEdit`, read back by the form to switch its title
("POI Baru" / "Edit POI") and Submit between `addPoi`/`updatePoi`. Both clear
the draft and `editingId` afterward (`beginCreate` again) so the next visit
starts blank.

A list row's default landing is now `poi-detail` (read-only), not the form
directly — `beginView`/`useViewingId` are the same pattern as `editingId` but
kept separate, since viewing never touches the draft. Its own "Edit" button
is what calls `beginEdit` and goes to `poi-create`.
