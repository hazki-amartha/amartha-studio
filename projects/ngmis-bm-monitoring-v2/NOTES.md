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

- `lib/scorecard.tsx` — `Scorecard`, one matrix per subject (Task, Repayment,
  Disbursement, Cash settlement). BPs run across the top, each spanning its
  subject's paired measures (Target/Completed, Aktif/Terbayar, Collected/
  Settled) via a two-level header; the metrics run down the side. The second
  measure of a row carries a derived note — a percentage of the first (Terbayar
  of Aktif) or the remainder still held (Collected less Settled). ONE measure
  width for every subject, so a BP's column sits at the same x in all four tables
  and the eye skims straight down. A `shortfallTone` row turns its 2nd figure
  RED when it trails the 1st (target not met). Repayment uses `paidTone` instead:
  the colour sits on **Terbayar**, judged against Aktif as its target (green when
  Terbayar meets Aktif, red when short), with no target sublabel and no Terbayar
  percentage. Its `comment` prop has four modes:
  `none` (Monitoring), `edit` (inline box), `read` (past briefing), and `cta`
  (a "✎ Isi" button that calls `onOpen`). `ClosedDayPanel` is the "Has closed
  the day?" row. Both take an optional `bps` list.
- `lib/briefing-form.tsx` — `BriefingForm`, shared by the morning and evening
  screens. Its commentary layout follows the store's `commentStyle`, one of three
  prototype states: `inline` (a Komentar box in every table), `dedicated` (no
  per-section box; a `DedicatedComments` section with one note per BP), and
  `dialog` (a "✎ Isi" CTA per section opening a `CommentDialog` Modal that shows
  the BP's figures for that section while the BM types). Plus a `VoiceRecorder`
  pinned to the top (idle → live mm:ss timer + Stop → saved attachment, carried
  with the briefing; click-through, no real mic per §3), the `PhotoProof` block,
  and a send bar gated on the photo.
- `screens/briefing-history.tsx` — `BriefingHistoryScreen` (Riwayat Briefing):
  today's not-yet-sent briefings + the history table. Was the dashboard's second
  tab; now its own screen, reached from the "Riwayat briefing" filter-row button.
  The dashboard itself carries a "Mulai briefing" button opening a Modal to pick
  morning / evening.
- `lib/demo.ts` — the `states` (§3) wired in `index.ts`: three `commentStyle`
  controls on both briefing screens, plus two `scheduled` controls on the
  dashboard (Briefing Sore default / Briefing Pagi) that pick which briefing the
  landing banner prompts. Each just writes to the store.
- `lib/store.ts` — carries which of today's two briefings have been sent, which
  briefing the detail screen shows, which briefing is `scheduled` (the dashboard
  banner), and the briefing `commentStyle`. All must survive navigation.
- `screens/dashboard.tsx` — a full-width `BriefingBanner` for the `scheduled`
  briefing sits at the top, shown only while that briefing is due and unsent;
  its CTA opens that briefing directly. Toggle morning/evening via the `states`.

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
