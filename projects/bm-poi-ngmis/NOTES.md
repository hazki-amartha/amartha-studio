# NOTES

Project-local components (CLAUDE.md §4), copied (not imported — §1) and trimmed
from `projects/apartner-bm-majelis-view/lib/ui.tsx`'s `SelectField`/`OptionSheet`
pair — the mobile BM app's own way of doing a picker, since FunDS has no
desktop-style `<select>` on a phone:

- `SelectField` / `OptionSheet` (`lib/ui.tsx`) — a tappable field that opens a `BottomSheet` of `SelectableCard` options. `SelectField`'s `chevron="right"` variant marks the map-point field as a drill-in rather than a picker.
- `SectionTitle` / `FieldLabel` — the bold section headings and the required/optional label row, matched to the "POI Baru" design handoff.
