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

- `lib/scorecard.tsx` — `Scorecard`, the four activity tables (Majelis Visit,
  Sosialisasi, UK, Home Visit) transposed so the BPs are rows and each activity's
  metrics are columns. The BP / Target / Completed columns take fixed pixel
  widths that are constant across all four tables, so those columns line up down
  the page; the tables switch to a fixed layout (via `DataTable`'s new
  per-column `width`) and scroll when a wide one — Home Visit, or any table in a
  briefing — overflows. Its `comment` prop grows a "Komentar" column onto every
  table: absent on Monitoring, an editable box in a live briefing, seeded
  read-only text in a past one. `ClosedDayPanel` is the reference's "Has closed
  the day?" row. Both take an optional `bps` list, so the dashboard's BP-name
  filter narrows them.
- `lib/briefing-form.tsx` — `BriefingForm`, shared by the morning and evening
  briefing screens (they differ by `kind`, and now by `commentStyle`: `'inline'`
  is the shipped Komentar-in-every-table shape, `'dedicated'` drops the column
  and gathers one note per BP in a `BriefingCommentPanel` below the scorecard,
  `'dialog'` keeps the per-activity column but makes the cell a CTA that opens a
  `Modal` to type in). The scorecard in edit mode, a
  `PhotoProof` block, and a send bar gated on the photo being attached. The photo
  is a click-through placeholder, not a real file picker (§3).
- `lib/store.ts` — carries the active dashboard tab, which of today's two
  briefings have been sent, and which briefing the detail screen shows. All three
  must survive navigation.

Data (`lib/data.ts`) follows the reference scorecard ("Bekasi 1 (sample)",
07-Aug-2026): a full branch of six BPs. Count metrics carry their population, so
a cell reads "68/85 (80%)". Majelis Visit's "paid" / "DPD-0" are counted over the
whole membership of the majelis visited (15–20 mitra each), not over the visits.
`sectionsForBriefing('morning')` zeroes every figure except Target — a morning
briefing runs before any fieldwork, so Completed and every result read 0.

Open questions:

- The scorecard figures are undated beyond the one report date — no week / month
  selector. The branch is fixed (the top-right branch filter was removed); the
  BP-name filter under the tabs narrows the rows.
- Commentary is per section + per BP; the seeded sample fills only a handful of
  cells, so most read-only Komentar cells show "—".
- The BP-name filter sits under the tabs and is shown on both, but only narrows
  the Monitoring scorecard — the Briefings tab has nothing per-BP to filter.
