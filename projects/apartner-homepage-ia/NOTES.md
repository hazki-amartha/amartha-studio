# A-Partner Homepage IA — notes

Translated from the team's standalone JSX draft, most recently re-synced against
`apartner-homepage-ia_6`. The draft carries its own hex palette, type ramp, and
hand-rolled primitives; this port rebuilds all of it from FunDS Lite tokens +
`@/design-system/components`.

## 2026-07-20 resync (`apartner-homepage-ia_6`)

Full resync against a substantially expanded draft. New surface area:

- **Kunjungan Majelis visit mode**, built directly into `majelis-detail.tsx`
  rather than a separate flow screen — matches the source, which toggles the
  same page into an expanded state instead of pushing a new one. Adds an Info
  popover (lokasi + grup WhatsApp), a Status-minggu-ini card, per-mitra
  Kehadiran + Pembayaran controls (with a payment bottom sheet for
  penuh/sebagian/PTP), a Tugas-tambahan section for renewal/celengan offers,
  and a Rekam-kumpulan (lokasi + foto) gate before Submit Kumpulan.
- **`mitra-detail` is live now** — previously parked with no inbound `go()`.
  The source now routes a Beranda "Kunjungan Rumah" task tap, and a
  browse-mode mitra card on majelis-detail, straight to it. Gained a
  main/profil view toggle, a dedicated HV launcher card, Potensi pencairan
  tambahan, Progress limit (outlook factors), and Kehadiran kumpulan sections.
- **`kunjungan-rumah.tsx`** (new) — the branching home-visit wizard. The
  source models it as an overlay pushed over the whole shell with no
  `onFinish`/return-routing concept; ported as a plain pushed screen whose
  "Selesai kunjungan" just calls `flow.back()`.
- **`titip-bayar.tsx`** (new) — the end-of-day settlement page, reached only
  from Beranda's "Setor Titip Bayar" task. Not tied to a specific task id in
  the source (`startTitip` takes no argument) — ported the same way.
- **`kpi.tsx` — flat-Rp model.** The source dropped the weighted-group model
  entirely: 7 flat parameters, each earning its own flat Rp bonus outright.
  The per-majelis breakdown and the separate "Cara Perhitungan KPI" explainer
  are both gone — `kpi-info.tsx` is deleted and no longer registered.
- **Comms carry `read` state** and live in the store now (previously a static
  `BANNERS` array + separate static `COMMS` list). The Home carousel shows
  only unread comms; tapping one marks it read everywhere.
- **No task-completion tracking.** The source has no `done` flag, no
  "selesai" log, and no post-flow "scroll back to Tugas" behavior — dropped
  from this project too (an earlier build of this sync had added all three;
  the draft that shipped does not have them).

## Components proposed for promotion

Per the §4 missing-component protocol, these live in `lib/` and are built only
from tokens + existing design-system components. Candidates for FunDS Lite:

## Components proposed for promotion

Per the §4 missing-component protocol, these live in `lib/` and are built only
from tokens + existing design-system components. Candidates for FunDS Lite:

- **SearchField** (`lib/ui.tsx`) — a search input with a **leading icon** and an
  inline clear ("Hapus") action. Used on Majelis and Majelis-detail. Motivating
  gap: the design-system `Input` accepts affixes via `prefix`/`suffix`, but those
  props are typed `ReactNode` while the DOM's global `prefix: string` attribute
  collides with them, so only **string** affixes typecheck (`prefix="Rp"` works,
  `prefix={<Icon/>}` does not). An icon-leading search field is common enough to
  warrant either a first-class `Input` icon slot or a dedicated search component.

- **FilterChip** (`lib/ui.tsx`) — a dropdown-trigger pill (label + chevron, active
  state) that opens a bottom sheet. Used on every list surface (Home, Majelis,
  KPI, Comms, Notif). A recurring pattern with no current design-system control.

- **OptionSheet** (`lib/ui.tsx`) — a `BottomSheet` wrapping a single-choice
  `SelectableCard` group. This is the sanctioned pairing for "pick one from a
  list" and might deserve to ship as one component.

- **ProgressBar** (`lib/ui.tsx`) — a token track + data-driven fill. Used for the
  collection total, the KPI incentive hero, and every KPI parameter. The fill
  width is an inline `style` (a percentage of the track, not a spacing token) —
  the one place a value can't be a class.

- **Avatar** / **IconTile** — the circular initials chip and the rounded-square
  icon leading, both recurring across mitra/majelis/task/profile rows.

- **BannerTag** (`lib/ui.tsx`) — a category pill for **colored surfaces**
  (translucent white fill, white text). Used on the Home banner carousel and the
  banner-detail hero. Motivating gap: `Badge` has no on-color variant —
  `variant="inverted"` is a solid white pill with a primary border/text, which
  reads wrong on a `primary-500`/`blue-500` banner. Proposal: a Badge
  `variant="overlay"` (or similar) for content sitting on brand-colored fills.

- **SegmentedChoice** (`lib/ui.tsx`) — two evenly-sized pill-adjacent buttons
  filling a row. Used for every yes/no branch in the Kunjungan Rumah wizard and
  the majelis-detail payment dialog. `SelectableCard` covers the card-shaped
  radio case but not this compact inline-pair case.

- **ChipPicker** (`lib/ui.tsx`) — small wrapping pill buttons for a single
  choice among several: reason chips, PTP date chips, and the Hadir/Tidak
  toggle on a visit-mode mitra card.

## Translation decisions

- **Tabs are real screens.** The source held tab + overlay state in one `<App>`
  and swapped page components in place. Here each tab and pushed page is its own
  `ScreenDef`; the bottom bar navigates with `useFlow().go()` and reads
  `flow.current` for its active state. Cross-screen state (notification read
  status, the KPI deep-link filters, the selected majelis/mitra/banner) lives in
  `lib/store.ts`, since screens remount on navigation.

- **`mitra-detail` is parked.** The source keeps `MitraDetail` fully built but
  switched off (`const [selM] = useState(null)`) and drops the chevron from mitra
  cards because of it. Kept faithful: the screen is registered but has **no
  inbound `go()`** and `flowsTo` is empty, so `check:flows` treats it as a valid
  unreferenced screen. Open it from the flow view. Its "+ Jadikan tugas" action
  does write into the shared task store, so it's live when reached.

- **Gradients → token backgrounds.** Banner cards and the banner-detail hero used
  bespoke `linear-gradient`s. Gradients are off-system, so each banner now carries
  a single token background (`bg-primary-500` / `bg-blue-500` / `bg-green-600`).

- **Sizes/weights snapped to scale.** The draft mixed in 13px text, 600 weight,
  and 14/18/22px icons. All text is now 10/12/14/16/20/24 at weight 500/700, and
  icons are clamped to the 16/20/24 grid.

- **`banner-detail` stays a stub.** The source marks the banner destination as
  TBD; the body is an explicit dashed placeholder rather than invented content.
