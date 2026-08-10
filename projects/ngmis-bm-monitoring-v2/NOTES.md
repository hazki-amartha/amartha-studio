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
  of Aktif) or the remainder still held (Collected less Settled). Fixed column
  widths, so a wide subject scrolls. Its `comment` prop adds a "Komentar" row
  (one cell per BP): absent on Monitoring, editable in a live briefing, seeded
  read-only text in a past one. `ClosedDayPanel` is the "Has closed the day?"
  row. Both take an optional `bps` list, so the BP-name filter narrows them.
- `lib/briefing-form.tsx` — `BriefingForm`, shared by the morning and evening
  briefing screens (they differ only by `kind`). The scorecard in edit mode, a
  `PhotoProof` block, and a send bar gated on the photo being attached. The photo
  is a click-through placeholder, not a real file picker (§3).
- `lib/store.ts` — carries the active dashboard tab, which of today's two
  briefings have been sent, and which briefing the detail screen shows. All three
  must survive navigation.

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
