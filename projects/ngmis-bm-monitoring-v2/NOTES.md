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

- `lib/scorecard.tsx` — `Scorecard`, one table per section (Task, Repayment,
  Disbursement, Cash collection). One layout only: the section's rows down the
  side, the BPs across the top as `DataTable` column groups, and under each BP
  name the measures that section carries. Its `comment` prop adds a "Komentar"
  row whose cell spans each BP's whole block: absent on Monitoring, an editable
  box in a live briefing, seeded read-only text in a past one. `ClosedDayPanel`
  is the reference's "Has closed the day?" row. Both take an optional `bps`
  list, so the dashboard's BP-name filter narrows them.
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

Data (`lib/data.ts`) is a full branch of six BPs, restructured into the four
sections above. Each section declares its `measures` (the columns under every BP)
and its `rows`; a row's `values` are per BP, aligned to the measure order, with
`null` where the row doesn't carry a measure (BTC has no daily target). A
measure's `role` drives the reading aids: an `achievement` shows its percentage
of the row's target and lifts to orange when short, `outstanding` reads orange
above zero, `standing` figures (mitra aktif) are neither.
`sectionsForBriefing('morning')` keeps targets and the standing counts and zeroes
every achievement — a morning briefing runs before any fieldwork.

Open questions:

- The scorecard figures are undated beyond the one report date — no week / month
  selector. The branch is fixed (the top-right branch filter was removed); the
  BP-name filter under the tabs narrows the rows.
- Commentary is per section + per BP; the seeded sample fills only a handful of
  cells, so most read-only Komentar cells show "—".
- The BP-name filter sits under the tabs and is shown on both, but only narrows
  the Monitoring scorecard — the Briefings tab has nothing per-BP to filter.
- Disbursement mixes counts and rupiah in one section: `isRupiah` keys the money
  formatting off the `disbursement-amount` row, since the measure alone can't
  tell them apart.
