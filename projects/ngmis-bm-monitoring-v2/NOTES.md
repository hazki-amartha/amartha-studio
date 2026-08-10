# NOTES

Project-local components (CLAUDE.md §4).

`lib/ui.tsx` and `lib/shell.tsx` are the desktop chrome, copied (not imported —
§1) from `projects/ngmis-bm-monitoring`: `MisShell` / `SideNav` / `SidebarPromo`
(the sidebar-first frame), `Breadcrumbs`, `PageHeading`, `Panel`, `PanelHeading`,
`Tabs`, `Select`, `Textarea`, `DataTable`, plus `SunGlyph` / `MoonGlyph` (sun and
moon are genuinely absent from the 166-icon set). The KPI/`ProgressBar`/
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
  RED when it trails the 1st (target not met). Its `comment` prop has four modes:
  `none` (Monitoring), `edit` (inline box), `read` (past briefing), and `cta`
  (a "✎ Isi" button that calls `onOpen`). `ClosedDayPanel` is the "Has closed
  the day?" row. Both take an optional `bps` list.
- `lib/briefing-form.tsx` — `BriefingForm`, shared by the morning and evening
  screens. Its commentary layout follows the store's `commentStyle`, one of three
  prototype states: `inline` (a Komentar box in every table), `dedicated` (no
  per-section box; a `DedicatedComments` section with one note per BP), and
  `dialog` (a "✎ Isi" CTA per section opening a `CommentDialog` Modal that shows
  the BP's figures for that section while the BM types). Plus the `PhotoProof`
  block and a send bar gated on the photo.
- `lib/demo.ts` — the three `states` (§3) wired in `index.ts` on both briefing
  screens; each just writes `commentStyle` to the store.
- `lib/store.ts` — carries the active dashboard tab, which of today's two
  briefings have been sent, which briefing the detail screen shows, and the
  briefing `commentStyle`. All must survive navigation.

Data (`lib/data.ts`) is a full branch of six BPs, authored compactly: each row
carries, per measure, one number per BP, and `section()` assembles the nested
`values` map. Figures vary per BP (the reference sheet's identical columns are a
blank template). `sectionsForBriefing('morning')` zeroes every measure flagged
`actual` (Completed, Terbayar, Collected, Settled) — a morning briefing runs
before any fieldwork — while the plan figures (Target, Aktif) stand.

Open questions:

- The scorecard figures are undated beyond the one report date — no week / month
  selector. The branch is fixed (the top-right branch filter was removed); the
  BP-name filter under the tabs narrows the rows.
- Commentary is per section + per BP; the seeded sample fills only a handful of
  cells, so most read-only Komentar cells show "—".
- The BP-name filter sits under the tabs and is shown on both, but only narrows
  the Monitoring scorecard — the Briefings tab has nothing per-BP to filter.
