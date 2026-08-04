# Desktop prototypes in Amartha Studio — scope

**Status:** scoping only. Nothing here is built. `DeviceKind = 'desktop'` has sat
in `platform/types.ts:17` since v1 with no implementation behind it, and
`PLAN.md:546` parks it in the post-v1 backlog.

**Reference:** NG-MIS shell in the FunDS component library
([Figma, node 28640-12376](https://www.figma.com/design/VWK8ra7NhxzTW9iY4MQ9KG/branch/7cqzmFlyxXJo2FU9isqtQK/2.-Funds---Component-Library?node-id=28640-12376)) —
"Expanded (default state)", 1440×900.

**Why now:** `NGMIS` is already a registered `Platform` (`platform/types.ts:28`)
with its own colour in the gallery (`app/page.tsx:68`), but no NGMIS project
exists. The slot was reserved and never filled, because NG-MIS is a desktop
back-office tool and the studio only renders a 390×844 phone.

---

## 1. What the reference actually specifies

Measured off the Figma frame. All numbers are from the file, not invented.

```
┌─────────────────────────────────────────────────────────── 1440 ──┐
│ Header  1440 × 40    ☰  amartha                        avatar ▾  │
├────────────┬──────────────────────────────────────────────────────┤
│ Sidebar    │ Content wrapper 1208 wide                            │
│ 232 wide   │  Breadcrumbs        24h  (y=8)                       │
│            │  Tabs group         52h                              │
│ items      │  ┌── Table container (white card, 16px pad) ───────┐ │
│ 216 × 40   │  │ Search 240×32 · Filter 74×32 ····· Action 32h   │ │
│ 8px pad    │  │ ┌─ Header row  37h, neutral-200 fill ─────────┐ │ │
│ groups     │  │ │ ☐ │ Col 1 ⇅ │ Col 2 ⇅ │ Col 3 ⇅ │ Action   │ │ │
│ expand     │  │ ├─ Body rows ~81h (3 text lines), zebra ──────┤ │ │
│ in place   │  │ │ ☐ │ Title 14 / 12 / 12 │ … │ Badge │  ⋯     │ │ │
│            │  │ └────────────────────────────────────────────┘ │ │
│ "Go to old │  │ Pagination wrapper 64h, bar 32h                 │ │
│  version"  │  └────────────────────────────────────────────────┘ │
└────────────┴──────────────────────────────────────────────────────┘
```

Notable details the mobile system has no answer for:

- **Persistent chrome on two axes** — a 40px header *and* a 232px sidebar that
  both survive navigation. `Screen` pins one 48px bar and nothing else.
- **Expandable sidebar groups** — "Loan" opens to three sub-items in place
  (160px tall when open), and the whole sidebar has a collapsed variant.
- **A data table** — checkbox column, sortable headers, three-line cells, zebra
  striping, a status badge column, a per-row `⋯` action.
- **Pagination**, **breadcrumbs**, **tabs**, and a **toolbar** (search + filter +
  primary action) — none exist in FunDS Lite.
- **Density** — the mobile system's smallest text is 10px but its rhythm is
  built on 12/16px padding and 44px+ touch targets. NG-MIS rows are 40px tall
  with 8px padding and use 10/12px type throughout.

---

## 2. Token audit — the good news

Pulled the Figma variables for the frame and diffed against `tailwind.config.ts`.
**The desktop shell is almost entirely on-token already.** It is the same
design system, not a second one:

| Figma variable | FunDS token | Status |
|---|---|---|
| `Semantic/Primary/primary` `#853291` | `primary-500` | ✅ identical |
| `Semantic/Primary/primary_lightest` `#FEF3FF` | `primary-50` | ✅ |
| `Text/text_default` `#111928` | `text-default` / `neutral-900` | ✅ |
| `Text/text_caption` `#6B7280` | `text-caption` / `neutral-600` | ✅ |
| `Text/text_disabled` `#8E95A3` | `text-disabled` / `neutral-500` | ✅ |
| `Text/text_placeholder` `#C6CAD0` | `text-placeholder` / `neutral-400` | ✅ |
| `Line/line_light_gray` `#E5E7EB` | `neutral-200` / `border-default` | ✅ |
| `Semantic/Green/500` `#009C6A`, `/50` `#E4FCEF` | `green-500`, `green-50` | ✅ |
| `Icon/icon_success` `#007D55` | `green-600` | ✅ |
| Body 14 / 12 / 10, Medium 500 + Bold 700 | `text-14/12/10`, `font-regular/bold` | ✅ |
| `Spacing_0/04/08/12/16/20` | `0 4 8 12 16 20` | ✅ |
| `Radius_0/04/06/08/16` | `rounded-none/4/6/8/16` | ✅ |

**Four gaps, all small:**

1. `Spacing_10` = **10px** — off the 4px grid, so it has no class and `p-[10px]`
   is a lint error. Appears in the shell's denser paddings. → Round to 8 or 12
   and note the drift, or (worse) add a `10` to the spacing scale and weaken the
   grid rule for everyone. **Recommend rounding.**
2. `Line/stroke` = **`#CDCFE7`** — not in the palette (a cool grey, unlike
   `neutral-400` `#C6CAD0` which is warmer). Used on input/checkbox borders.
   → Either accept `neutral-400` or add one token.
3. `Funds/Neutral/N-4` = **`#ABA0AB`** — not in the palette. Appears once.
   → Accept `neutral-500`.
4. `Semantic/Gray/gray_lightest` `#F9FAFB` vs FunDS `neutral-50` `#F9FAF8` —
   a 3-unit difference in one channel. → Use `neutral-50`, ignore.

Also: the table card uses `Card/Level 1` (a `0 1px 2px #A4ACB93D` drop shadow).
`tailwind.config.ts` defines no `boxShadow` scale, so Tailwind's defaults are
still live and `shadow-sm` is close. Worth making it a named token if desktop
lands, since every desktop surface uses it.

**Conclusion:** this is not a second design system. It is the same palette and
type ramp at a different density, plus about eight components that only make
sense on a wide screen. That materially lowers the cost.

---

## 3. Three layers of work

### Layer A — platform: make the frame device-aware

Mobile geometry is hardcoded in six places, all of them small and all of them
already commented as "hardware specs, not tokens":

| File | What's fixed | Change |
|---|---|---|
| `platform/frame/prototype.module.css:20` | `.screen` 390×844, 44px radius, 56px bezel | add a `.screenDesktop` 1440×900, square-ish bezel |
| `platform/frame/DeviceFrame.tsx` | wraps in the phone bezel | take `device`, pick the bezel |
| `platform/frame/PrototypeView.tsx:193` | `DEVICE_W/H = 414/868` | derive from `config.device` |
| `platform/frame/PrototypeView.tsx:200` | `ScaledDevice` scales to **height** only | scale to `min(fitW, fitH)` — 1440 will always be width-bound |
| `platform/frame/prototype.module.css:72` | `.desktop` grid `1fr auto 1fr` (states ‖ device ‖ notes) | a 1440 frame plus two 264px panels needs ~2000px. See below. |
| `platform/flow/geometry.ts:9` | `SCREEN_W/H = 390/844`, `SCALE = 0.25` | per-project geometry; a 1440-wide thumb at 0.25 is 360px, so desktop flow nodes want ~0.12 |

Two decisions fall out:

- **Where do notes and states go?** Today they flank the device. At 1440 the
  device eats the whole viewport. Cheapest honest answer: on desktop-device
  projects the panels become **collapsible drawers over the canvas** rather than
  columns beside it. (Alternative — keep the columns and scale the frame to ~60%
  — makes 10px type unreadable, which defeats the point.)
- **Scrollbars.** `prototype.module.css:54` hides every scrollbar inside
  `.viewport` on purpose, because phones don't show them. A desktop table with
  680px of rows in a 500px container *must* show one. → Scope that rule to the
  mobile device kind.

Also mobile-idiom and worth gating on device kind: the 24px slide transition
(`.forward`/`.back`) reads wrong for a back-office route change.

### Layer B — design system: the desktop vocabulary

Eight new components. All Tier 2, all buildable from existing tokens. Proposed
signatures, deliberately thin — these mirror what the Figma frame actually has,
not a generic admin kit:

```tsx
// AppShell — the whole 1440 chrome. Replaces Screen for desktop projects.
<AppShell
  header={<AppHeader …/>}
  sidebar={<SideNav …/>}
  breadcrumbs={[{ label, onClick? }]}
  children /* content area: 1208 wide, 16px gutters */
/>

// AppHeader — 40px, wordmark left, account menu right, sidebar toggle.
<AppHeader onToggleSidebar user={{ name, initial }} />

// SideNav — 232px expanded / collapsed variant; groups expand in place.
<SideNav
  items={[{ id, label, icon, active?, children?: SubItem[] }]}
  collapsed onSelect footer /* "Go to old version" slot */
/>

// Tabs — 52px underline tabs.
<Tabs items={[{ id, label }]} active onChange />

// Toolbar — search + filter + right-aligned actions above a table.
<Toolbar search={{ value, onChange, placeholder }} filters actions />

// DataTable — the core of it.
<DataTable
  columns={[{ id, header, width?, sortable?, align? }]}
  rows={[{ id, cells, status?, onAction? }]}
  selectable onSelectionChange
  sort={{ columnId, dir }} onSortChange
  zebra empty /* empty-state slot */
/>

// Pagination — 32px bar, page size + range + prev/next.
<Pagination page pageSize total onPageChange onPageSizeChange />

// Popover — anchored menu for the row `⋯` and the filter panel.
// (The mobile system has BottomSheet and Modal; neither is right here.)
<Popover anchor open onClose placement children />
```

`Button`, `Input`, `Badge`, `Card`, `Toggle` carry over unchanged — though note
the NG-MIS status chip is an **outlined** pill, which is `Badge variant="outline"`
(already supported) rather than the mobile 50-tint default. Worth confirming
against the Figma badge component before assuming.

`DataTable` is 60–70% of this layer's cost. The other seven are a day between
them.

### Layer C — the authoring contract

- `platform/primitives` gains `AppShell`'s layout constants, or `Screen` learns a
  `device` prop. **Recommend a separate primitive**, not an overloaded `Screen`
  — the two layouts share nothing but the canvas colour, and every mobile screen
  in the repo would pay for the branch.
- `project.config.ts` starts actually reading `device: 'desktop'`. No contract
  change needed — that was the point of freezing the enum with both members.
- `CLAUDE.md` §2 currently says "compose screens only from … `Screen`". Needs a
  desktop paragraph, and `CHEATSHEET.md` needs a desktop section — the cheatsheet
  is the one file agents read, so a desktop component that isn't in it does not
  exist in practice.
- A `projects/ngmis-live/` reference project, same role `amarthafin-live` plays
  for mobile: the shipped shell, so a proposal is judged against the real screen.
  **This should be the first desktop project, before any prototype.**

---

## 4. Staging

| Stage | Contents | Rough size |
|---|---|---|
| **1. Frame** | Layer A. A desktop project renders a blank 1440×900 page in the studio, scaled to fit, with working scrollbars. | S — a day |
| **2. Shell** | `AppShell` + `AppHeader` + `SideNav` + breadcrumbs + `Tabs`. The chrome is real and navigable. | M — 2 days |
| **3. Table** | `DataTable` + `Toolbar` + `Pagination` + `Popover`. | M/L — 3 days |
| **4. Reference** | `projects/ngmis-live/` rebuilding the Figma frame 1:1, plus cheatsheet + CLAUDE.md updates. | S/M |
| **5. Flow view** | Desktop-aware thumbnails and canvas geometry. Skippable — the flow view still *works*, the nodes are just wrong-shaped. | S |

Stages 1–4 are the real answer to "can we prototype NG-MIS here". Stage 1 alone
is nearly useless; stage 2 alone is already usable for navigation-shaped
questions.

---

## 5. What I'd push back on

- **Don't build this speculatively.** The frame is a day; the vocabulary is a
  week, and it's a week of Tier 2 review. It's worth it if there is a real NG-MIS
  design question waiting. If there isn't, the honest move is to leave
  `DeviceKind 'desktop'` unimplemented for another quarter.
- **Don't build a generic admin kit.** The eight components above are what the
  reference frame contains. A sortable-filterable-groupable table nobody asked
  for is the most expensive thing on this page.
- **The density question is real.** NG-MIS runs on 10/12px type and 40px rows;
  FunDS Lite's rhythm is built for thumbs. These coexist under one palette, but
  someone has to decide whether desktop gets its own spacing guidance in
  `CHEATSHEET.md` or just inherits the grid and rounds `Spacing_10` away.

## 6. Open decisions

1. **Notes/states panels on a 1440 frame** — drawers over the canvas
   (recommended) or scale the device down to fit the columns?
2. **`Spacing_10`** — round to 8/12 (recommended) or add 10 to the scale?
3. **Is there a live NG-MIS design question**, or is this capability work? Drives
   whether stages 3–5 happen at all.
