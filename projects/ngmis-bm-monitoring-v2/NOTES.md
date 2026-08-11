# NOTES

Project-local components (CLAUDE.md §4).

`lib/ui.tsx` and `lib/shell.tsx` are the desktop chrome, copied (not imported —
§1) from `projects/ngmis-bm-monitoring`, then reworked to a **top-header frame**:
`MisShell` renders a full-width header (hamburger + amartha lockup + profile
chip) above a `SideNav` that the hamburger collapses to a 64px icon rail (the
`collapsed` flag; `sidebar` is a render function so it reads that live state).
`MenuGlyph` is the project-local hamburger; `Breadcrumbs`, `PageHeading`, `Panel`,
`PanelHeading`,
`Tabs`, `Select`, `Textarea`, `DataTable`, plus `SunGlyph` / `MoonGlyph` /
`MicGlyph` / `ArrowUpRightGlyph` (sun, moon, microphone and the diagonal
open-in-new-tab arrow are genuinely absent from the 166-icon set). The
`DateFilter` shows an Indonesian "7 Agu 2026" label over a transparent native
date input. `Tabs` is
now unused — the dashboard is a single scorecard screen, briefings reached from
two filter-row controls. The KPI/`ProgressBar`/
`Pagination`/`StatCard`/`ReportTile` exports are carried over unused — kept whole
so the file stays a faithful copy of its source rather than a fork.

New here:

- `lib/scorecard.tsx` — `Scorecard`, one matrix per subject in order: Task,
  Repayment, BTC & Flow, Cash settlement, Disbursement. BPs run across the top,
  each spanning its subject's paired measures (Target/Completed, Aktif/Terbayar,
  Outstanding/Settled) via a two-level header; the metrics run down the side. ONE
  measure width for every subject, so a BP's column sits at the same x in every
  table and the eye skims straight down. A `shortfallTone` row turns its 2nd
  figure RED when it trails the 1st (target not met). Repayment uses `paidTone`
  instead: the colour sits on **Terbayar**, judged against Aktif as its target
  (green when Terbayar meets Aktif, red when short). BTC & Flow uses per-row
  `redWhen`: BTC reds when Completed is below its target (DPD 1-30 + 31-90);
  Flow (target 0) reds when Completed is above 0. Cash settlement reds its
  Outstanding when it is > 0 (`firstRedWhenPositive`); Outstanding =
  collected-but-unsettled, Settled = cleared today. A
  `merged` row (Task's "Tutup hari") renders one cell per BP spanning both measure
  columns, showing the `ClosedDayStatus` badge — "Sudah tutup hari" only once
  every task for that BP is completed, else "Belum tutup hari" (replaced the
  standalone closed-day card). Each section card carries a "Buka report" button
  beside its title (the per-row open-in-new-tab arrow was removed). Its `comment`
  prop has four modes: `none` (Monitoring/briefing form), `edit`, `read`, `cta`.
- `lib/briefing-form.tsx` — `BriefingForm`, shared by the morning and evening
  screens (and, with `readOnly`, the submitted-briefing view). A ghost-icon back
  button sits before the title. The row fills the screen height: the scorecard
  (comment `none`) scrolls on the left, while a **fixed device-height card** on the
  right scrolls its own `BriefingPanel` body (titled "Catatan Briefing") with the
  `Submit briefing` CTA pinned in a sticky footer. The panel holds a condensed
  voice recorder (`PanelRecorder`), a per-BP discussion checklist (`BpCard` — a
  `Checkbox`, the BP's status [morning: `taskCount`; evening: `unmetTargets`], and
  a collapsible note), an **optional** overall note, and an attendance `PhotoBox`.
  Its content is the per-kind **draft in the store**, so leaving and returning
  resumes it; submit is gated on "N/7 selesai" (6 BPs + photo — the note is
  optional). `readOnly` disables every control and swaps the footer for a
  "Terkirim" state (own submission shows the live draft; a past one shows a
  representative `SAMPLE_DRAFT`). All click-through, no real mic/file picker (§3).
- `screens/briefing-history.tsx` — `BriefingHistoryScreen` (Riwayat Briefing):
  just the history table now (the "belum dimulai" card was removed). Status is
  only "Terkirim" or "Tidak dikerjakan"; a Terkirim row's "Lihat" opens the
  read-only briefing view, "Tidak dikerjakan" has none.
- `screens/briefing-detail.tsx` — renders `BriefingForm` in `readOnly` for the
  briefing named by the store's `viewing`.
- `lib/demo.ts` — the `states` (§3) wired in `index.ts`: two `scheduled` controls
  on the dashboard (Briefing Sore default / Briefing Pagi) that pick which
  briefing the landing banner prompts. Each just writes to the store. (The old
  `commentStyle` controls were retired with the briefing-panel redesign.)
- `lib/store.ts` — carries which briefings are `submitted`, which the read-only
  view is `viewing`, which is `scheduled` (the banner), and each briefing's
  in-progress `drafts` (with `isDraftStarted` driving "Lanjutkan"). All survive
  navigation.
- `screens/dashboard.tsx` — a full-width `BriefingBanner` for the `scheduled`
  briefing sits at the top, shown only while that briefing is due and unsent; its
  CTA reads "Mulai …" or, once a draft exists, "Lanjutkan …". Toggle
  morning/evening via the `states`.

Data (`lib/data.ts`) is a full branch of six BPs, authored compactly: each row
carries, per measure, one number per BP, and `section()` assembles the nested
`values` map. Figures vary per BP (the reference sheet's identical columns are a
blank template). `sectionsForBriefing('morning')` zeroes every measure flagged
`actual` (Completed, Terbayar, Collected, Settled) — a morning briefing runs
before any fieldwork — while the plan figures (Target, Aktif) stand.

Open questions:

- The scorecard figures are undated beyond the one report date — no week / month
  selector. The location cascade (region → branch) is fixed context, shown as
  disabled chips; there is no per-BP filter anymore (the whole branch roster is
  always shown).
- Commentary is per section + per BP; the seeded sample fills only a handful of
  cells, so most read-only "Catatan tambahan" cells show "—".
