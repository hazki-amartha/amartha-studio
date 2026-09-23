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
- `lib/survey.ts` — the assisted-survey model + progress store: the three boxes (BP Feedback / Survey Uji Kelayakan / Ritual), their step questions, and per-lead completion read by the survey-form / ritual pages.
- `lib/ui.tsx` (added) — ProductBadge, the colour-coded majelis product chip, ported from the BP New Concept directory. Used by the Majelis list + page.
- `lib/roster.tsx` — MAJELIS_ROSTER (stand-in active-majelis mitra) + MitraRosterCard + DpdBadge, ported from the BP New Concept mitra card: product, arrangement (keringanan / janji bayar) and DPD bucket. Used by the Majelis page roster.

The Majelis module (`screens/majelis-list.tsx` directory + `screens/majelis-page.tsx` detail) is ported from `apartner-majelis-view` (A-Partner BP New Concept), adapted to this project's `MAJELIS_DIRECTORY`; the field-day roster (collection / DPD) is out of scope here.

Extracted from `apartner-majelis-view` on 2026-09-08 so the Sales module can be
iterated without the field day around it. The pipeline files came across
verbatim; `lib/schedule.ts`, `lib/store.ts` and `lib/ui.tsx` are trimmed to the
seam the Sales screens actually read.
