# NOTES

Project-local components (§4), all built from tokens + design-system components:

- `lib/ui.tsx` — AppScreen, StageBar, SearchField, FilterBar, FilterChip, ResetLink, OptionSheet, EmptyState, SectionTitle, ContactButton, VisitTitle, StickyBar, RescheduleSheet. Used across every screen.
- `lib/pipeline-ui.tsx` — the lead-record fields and their pickers (SelectField, SourceSheet, MajelisPickerSheet, AddressSheet, KtpSheet, RiwayatSheet, SubmitSheet, ReasonRadios). Used by sales, lead-detail, lead-new, follow-up, sosialisasi.
- `lib/tabs.tsx` — TabBar, the five-destination bottom nav. Used by sales.
- `lib/poi-image.tsx` — PoiImage, the illustrated stand-in for a POI photo. Used by sosialisasi.
- `lib/sales-list.tsx` — SalesList, the Leads/POI-visit board (funnel columns + cards) shared by "Sales hari ini" (today scope) and "Lihat semua" (all scope).
- `lib/pipeline-ui.tsx` (added) — OnboardingModeSheet, the self-service/assisted choice after the majelis step. Used by pendaftaran and kumpulan-jadwal.
- `lib/tasks.tsx` (added) — LeadBoardCard + PoiBoardCard, the Phase-2 board cards (two date pills, source/place, pinned location, onboarding-mode line). Used by SalesList.
- `lib/group-tasks.ts` — the Group Formation tasks shown on the Tugas page (a new majelis with >5 approved members, ready for its first MV).

Extracted from `apartner-majelis-view` on 2026-09-08 so the Sales module can be
iterated without the field day around it. The pipeline files came across
verbatim; `lib/schedule.ts`, `lib/store.ts` and `lib/ui.tsx` are trimmed to the
seam the Sales screens actually read.
