# Notes — Homepage Card States

## Promotion candidates (§4)

Components built project-local because `@/design-system/components` has no
equivalent. All three are token-only and used across every state of this
exploration. Proposed to the design-system owner:

### `Ring` — `lib/ui.tsx`

A labelled percentage ring meter (56px, 5px stroke, value centred, caption
below). **Why:** performance-against-target is a recurring FunDS pattern —
repayment %, kehadiran %, majelis repayment % here, and the KPI parameters in
`apartner-homepage-ia` are the same idea drawn differently. Two projects have
now drawn their own. **Used in:** Card 3 (limit growth), all non-late states.
**Open question for promotion:** the stroke colour is caller-supplied here;
upstream it should probably take a status `intent` (`green` | `blue` |
`orange`) like `Badge` does, rather than a raw token var.

### `LimitGauge` — `lib/ui.tsx`

A two-anchor progress track with a positioned thumb and a floating value label:
"you are here, between current and potential". **Why:** distinct from a plain
progress bar because the fill is meaningless without both end labels — the unit
is the *span*, not a percentage of 100. Likely reusable for celengan targets and
plafon growth. **Used in:** Card 3.

### `CardHeader` — `lib/ui.tsx`

Card title + circular arrow affordance, with a `tone` override. **Why:** this is
the actual subject of the exploration — "every card gets a motivational headline
and an arrow". If the direction ships, this becomes the homepage card contract
and belongs upstream. **Hold until the exploration resolves** — do not promote a
pattern still under test.

## Off-system corrections made in the port

The source draft (`modal-card-states.jsx`) was a standalone harness. Fixed on
the way in, worth knowing if you compare them side by side:

| Draft | Now | Why |
|---|---|---|
| Card radius 16 | `rounded-12` | Card radius is locked at 12 |
| Card padding 16 | DS `Card` default (12) | `--card-padding` is 12, not 16 |
| Local `T` object of hex values | Token classes / `var(--token)` | No hex in project code |
| `gap: 6`, `padding: "10px 16px"`, `padding: 24` | `gap-8`, `Button size`, `Screen` | 4px grid — 6 and 10 are off-scale |
| Hand-rolled `Card`, buttons, chips | `Card`, `Button` from DS | Vocabulary rule |
| `fontWeight: 700` inline | `font-bold` | Only 500/700 exist |
| 🎉 / 👍 in headlines | removed | `foundations/colors.md` bans emoji |
| `p100` border on the settled card | `border-primary-200` | `primary-100` is not a token |
| `n100` header circle | `bg-neutral-50` | `neutral-100` is not a token |
| `b10` on non-uppercase text | `text-12` | `text-10` must always be UPPERCASE |
| Tab bar / device wrapper / notes card | flow view + `DeviceFrame` + `notes` | The platform already is the harness |

Two `text-10` micro-labels were kept and uppercased ("JADWAL PEMBAYARAN",
"LIMIT SEKARANG", "POTENSI LIMIT") since they read as overlines anyway.

## Known gaps

- Percent-driven positioning in `LimitGauge` uses inline `style` for `left` /
  `width`. That is data binding, not a design value — there is no token path for
  a computed percentage, and Tailwind arbitrary values are banned. Flagged so it
  isn't mistaken for drift.
- The gauge thumb dropped the draft's `0 0 0 1px primary-200` outer glow —
  no shadow token exists for it.
- `Ring`'s "Lihat" link is inert; the drill-down per metric isn't part of this
  exploration.
