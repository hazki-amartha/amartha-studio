# Notes — apartner-majelis-view

## Project-local components (§4)

- `TabBar` — the three L0 destinations (Jadwal / Majelis / KPI), hidden inside a pelayanan. Ported from `apartner-task-first`.
- `AgendaRow`, `HeaderAction` — the schedule's clock gutter and its top-bar icon buttons. Ported from `apartner-task-first`.
- `StageBar` — three numbered stages with rails; a cleared stage turns green and swaps its number for a tick. Used on attendance, collection, growth, recap.
- `WeekStrip` — horizontal 50-week repayment rail carrying the amount inside each week. Used on the mitra page. The direction's centrepiece.
- `ProgressCard` — headline value + denominator + percent over a meter. Used on attendance and collection.
- `StickyBar` — pinned footer holding a summary above its button. Used on all six action screens; the collect page needs the summary inside the sticky region or "sisa setelah ini" scrolls away from the button it qualifies.
- `MitraCard` / `DpdBadge` — the one member card, shared by roster, attendance, collection and growth.
- `AttendancePill`, `Chip`, `ChipGroup`, `ProofTile`, `StatRows`, `Meter`, `Avatar`, `IconTile`, `Collapsible`, `Overline`, `SectionTitle`, `VisitTitle` — carried over from `apartner-task-first`.
- `h-40` on `Button size="sm"` — FunDS button sizes step 28 (xs) → 36 (sm), so neither lands on the 40px avatar rhythm the cards use. `h-40` is a token class, not an arbitrary value.

## The L0 layer (Jadwal / Majelis / KPI)

Ported from `apartner-task-first` so the two directions share a front door and
what gets compared is the pelayanan itself, not the way in to it. Two routes,
each opening on what it is for:

- **Schedule → work.** "Mulai Pelayanan" goes **straight to Kunjungan 1 —
  Kehadiran**, skipping the roster. A BP sent there by the day already knows the
  group; the roster would be a page between her and the work.
- **Majelis tab → record.** Tapping a group opens the **Majelis View roster** —
  reaching a group off-schedule is a look-up, and the roster is the answer. Its
  own "Mulai Pelayanan" still works, but a pelayanan started this way does not
  tick a scheduled task: she was never sent.

- **No home visits.** `apartner-task-first` schedules them and a real BP does
  them; this direction models only the majelis pelayanan, so the day is four
  majelis rather than a schedule with rows that open nothing.
- **Prototype edge:** only Majelis Mawar has a real roster — every task and every
  directory row opens Mawar's 22 mitra, whatever name is on the card.

## Where this departs from the reference

- **Payment history screen dropped.** The week strip carries the amount per week, so a 50-row table says the same thing one screen further from the conversation. Designer's call.
- **"Tidak Bayar" added as a fourth collect option.** The reference's three choices are all payments, which leaves a mitra who hands over nothing unrecordable — she stays in the queue and the queue never reaches zero.
- **The repeated "Total to Collect" block at the top of the collect page dropped.** It is the third showing of the same breakdown in two taps; only the version above the CTA earns its place, because it moves.
- **The reference's numbers do not reconcile.** Its week strip and its outstanding breakdown imply different totals. Everything here derives from one authored ledger, so Rina lands on exactly the reference's arithmetic — this week 200.000 + two missed weeks 400.000 + a 50.000 shortfall = 650.000 — and "minggu ini saja" leaves 450.000, a custom 300.000 leaves 350.000.
- **Proof and recap sit outside the stage bar.** Three stages are the work; proof is the paperwork that closes it.

## Open questions

1. **Does the attendance gate pay for itself?** Collection cannot open until all 22 mitra are marked, per the reference. It means the BP passes the room twice. The 15 pre-paid mitra are seeded present so she marks 7 rather than 22, but the gate is the main thing to judge against `apartner-task-first`, which records attendance and payment on one card in one pass.
2. **Page vs sheet for collection.** This direction opens a full page where `apartner-task-first` opens a bottom sheet. The page can afford the week strip; the sheet kept the queue visible behind it. Both prototypes exist to be compared here.
3. **The credit-limit line on the recap is generic.** Stating the relationship without a number is deliberate — a real figure needs a scoring model this prototype doesn't have, and a fabricated one is the kind of number a BP might repeat to a mitra as a promise.
4. **Contact rows on the mitra page do nothing.** WhatsApp and route are affordances only, same as in `apartner-task-first`.
