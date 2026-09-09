# NOTES

Project-local components (§4), all built from tokens + design-system components:

- `lib/ui.tsx` — AppScreen, StageBar, SearchField, FilterBar, FilterChip, ResetLink, OptionSheet, EmptyState, SectionTitle, ContactButton, VisitTitle, StickyBar, RescheduleSheet. Used across every screen.
- `lib/pipeline-ui.tsx` — the lead-record fields and their pickers (SelectField, SourceSheet, MajelisPickerSheet, AddressSheet, KtpSheet, RiwayatSheet, SubmitSheet, ReasonRadios). Used by sales, lead-detail, lead-new, follow-up, sosialisasi.
- `lib/tabs.tsx` — TabBar, the five-destination bottom nav. Used by sales.
- `lib/task-card.tsx` — TaskCard, TaskChip, Meter: the category summary card with its progress rail. Used by the Sales Option B board.
- `lib/poi-image.tsx` — PoiImage, the illustrated stand-in for a POI photo. Used by sosialisasi.

Extracted from `apartner-majelis-view` on 2026-09-08 so the Sales module can be
iterated without the field day around it. The pipeline files came across
verbatim; `lib/schedule.ts`, `lib/store.ts` and `lib/ui.tsx` are trimmed to the
seam the Sales screens actually read.
