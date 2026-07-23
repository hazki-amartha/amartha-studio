# Notes — apartner-majelis-view

## Project-local components (§4)

- `TabBar` — the three L0 destinations (Jadwal / Majelis / KPI), hidden inside a pelayanan. Ported from `apartner-task-first`.
- `AgendaRow`, `HeaderAction` — the schedule's clock gutter and its top-bar icon buttons. Ported from `apartner-task-first`.
- `HomeMitraCard` / `TagihanCard` — the home visit's doorstep card (identity + WhatsApp/call + address) and the ledger-derived amount card beneath it.
- `StageBar` — three numbered stages with rails; a cleared stage turns green and swaps its number for a tick. Used on attendance, collection, growth, recap.
- `WeekStrip` — horizontal 50-week repayment rail carrying the amount inside each week. Used on the mitra page. The direction's centrepiece.
- `ProgressCard` — headline value + denominator + percent over a meter. Used on attendance and collection.
- `StickyBar` — pinned footer holding a summary above its button. Used on all six action screens; the collect page needs the summary inside the sticky region or "sisa setelah ini" scrolls away from the button it qualifies.
- `MitraCard` / `DpdBadge` / `MitraPhoto` — the one member card, shared by roster, attendance, collection and growth. `MitraPhoto` replaced the initials `Avatar` on every MITRA surface (roster, collect, doorstep): a BP in a room of 22 women recognises a face, and "SH" is something she has to decode into a name and then match to a person. It is a silhouette placeholder — the prototype has no photos — but it says what the real thing is. Leads keep `Avatar`: a prospect genuinely has no photo on file.
- `ActionRow` — the bottom half of a stage card: caption + bold figure left, one control right. Used by all three visit stages, which is what keeps the card one object as the BP moves through them.
- `ChoicePill` — the two-outcome pill pair (Tidak/Hadir, Tidak/Tertarik), selected in primary. Replaces `AttendancePill`'s green/red selection: the pills record what was said, and a red "Tidak hadir" beside a red DPD badge puts two alarms in one colour. Used on attendance and growth.
- `ChoiceList` / `ChosenRow` — a single-choice reason picker as full-width rows with a radio mark, collapsing to the answer + "Ubah" once picked. Replaces the chip wrap for absence and decline reasons: reasons are uneven-length sentences, and a chip wrap gives ragged rows and unequal tap targets. Used on attendance and growth.
- `Chip`, `ChipGroup`, `ProofTile`, `StatRows`, `Meter`, `Avatar`, `IconTile`, `Collapsible`, `Overline`, `SectionTitle`, `VisitTitle` — carried over from `apartner-task-first`.
- `LeadRow` / `LeadIdentityCard` — a prospect as a list row and as the identity block on her own record. Both lead with the interest grade, because a list of leads has no other ranking.
- `ContactButton` — the round WhatsApp/handset pair, lifted out of `home-card.tsx` into `ui.tsx`: reaching someone is now the whole job on two screens, not one.
- `IconTile` gained `blue` and `orange` tints for the two NTB task kinds, and `IconMegaphone` / `IconUserPlus` were added to `icons.tsx`.
- `SearchField`, `FilterBar`, `FilterChip`, `OptionSheet`, `ResetLink`, `EmptyState` — the Majelis tab's find-a-group layer, lifted shape-for-shape from `apartner-homepage-ia` (which solves the same problem on the same tab). Strong promotion candidates: three projects now want a filter chip over a bottom sheet, and two of them have written it independently. `SearchField` uses the shared `MagnifyingGlass` from `@/design-system/icons` rather than a local icon.
- `h-40` on `Button size="sm"` — FunDS button sizes step 28 (xs) → 36 (sm), so neither lands on the 40px avatar rhythm the cards use. `h-40` is a token class, not an arbitrary value.

## The L0 layer (Jadwal / Majelis / KPI)

Ported from `apartner-task-first` so the two directions share a front door and
what gets compared is the pelayanan itself, not the way in to it. Two routes,
each opening on what it is for:

- **One button starts work.** Only the "Sekarang" card's button clocks in — a
  majelis goes **straight to Kunjungan 1 — Kehadiran**, a home visit to its own
  step 1. A BP sent by the day already knows the group, so the roster would be a
  page between her and the work.
- **Cards open the record.** Tapping a Berikutnya card opens the **Majelis View
  roster** (majelis) or **the mitra page** (home visit). Reading up on what she
  is riding into is something a BP does constantly, and it must not be the same
  gesture as starting a visit she isn't standing at yet.
- **Majelis tab → the roster**, same as a Berikutnya card. Its own "Mulai
  Pelayanan" starts the work from there.
- **Finishing ticks the schedule either way.** A pelayanan started from the
  Majelis tab still closes the day's row for that group (`finishTask` recovers
  the task from the group when no task id was carried in). The work is the same
  work; only the route differed, and leaving the row open would ask the BP to do
  it twice.
- **Home visits** are ported from `apartner-task-first` — same two steps, same
  one-question-with-three-answers ("siapa yang ditemui"), same inline options
  instead of a sheet. What changes here: the doorstep amount is derived from her
  ledger, so the Tagihan card names the three debts it is made of (this week,
  the missed weeks, any shortfall) instead of printing one fused figure.
- **Prototype edge:** only Majelis Mawar has a real roster — every task and every
  directory row opens Mawar's 22 mitra under the name of the group tapped.

## Where this departs from the reference

- **Payment history screen dropped.** The week strip carries the amount per week, so a 50-row table says the same thing one screen further from the conversation. Designer's call.
- **"Tidak Bayar" added as a fourth collect option.** The reference's three choices are all payments, which leaves a mitra who hands over nothing unrecordable — she stays in the queue and the queue never reaches zero.
- **The repeated "Total to Collect" block at the top of the collect page dropped.** It is the third showing of the same breakdown in two taps; only the version above the CTA earns its place, because it moves.
- **The reference's numbers do not reconcile.** Its week strip and its outstanding breakdown imply different totals. Everything here derives from one authored ledger, so Rina lands on exactly the reference's arithmetic — this week 200.000 + two missed weeks 400.000 + a 50.000 shortfall = 650.000 — and "minggu ini saja" leaves 450.000, a custom 300.000 leaves 350.000.
- **The stage lists are static.** One roster, one order, on all three stages — answering a card updates the card in place and never moves it. The "Belum/Sudah Diabsen" and "Belum/Sudah Ditagih" sections are gone: they re-sorted the list under the BP's thumb on every tap, and the woman she is standing in front of has to stay where she was.
- **Proof and recap sit outside the stage bar.** Three stages are the work; proof is the paperwork that closes it.

## The NTB layer (Sosialisasi / Follow Up)

Two new task kinds on the same schedule as the pelayanan, the doorstep and the
deposit — five stops, two jobs. A BP's NTB target and her collection target are
paid out of the same seven KPI parameters and worked in the same eight hours;
giving prospecting its own tab would let it be the thing she gets to if there is
time, which is exactly how it stops happening.

- **Two tiers of capture.** QUICK — nama, WA, sumber, minat, kapan dihubungi
  lagi — is what a woman answers out loud while nine others wait. LENGKAP —
  alamat, majelis tujuan, pinjaman lain — needs her to think, and asking it in a
  crowded warung is how a BP comes back with four leads instead of ten. The
  `0/10` counter counts the quick tier: a name and a number is a lead, the rest
  is homework.
- **Gaps are drawn, not hidden.** Everything the quick tier skipped appears on
  the prospect's record as a named blank with a count. A lead who can't be
  submitted for want of an address is a lead that dies silently.
- **A promise to call becomes a task.** Recording "hubungi lagi besok" puts a
  Follow Up on tomorrow's agenda, made by the same act that recorded the
  promise. Only tomorrow renders — a lead due in October keeps her date on her
  record and nothing appears anywhere, which is the honest depiction rather than
  a limitation: the app is holding October, and October is not a screen.
- **"Did the call land" is asked before minat.** Most follow-ups don't connect,
  and a form that opens on how interested she is makes an unanswered phone look
  like a lead who went cold.
- **"Siap diajukan" is gated on complete data**, and the gate names the gap and
  offers the jump to fill it. That round trip is why the half-finished call
  lives in the store rather than `useState`.
- **A no is a result.** Same rule as "tidak bayar" in the collection flow: a
  refusal with a reason leaves the pipeline as a record ops can count, instead
  of leaking onto someone's spreadsheet.
- **The day was retimed** to fit both — the sosialisasi takes 14.00–15.15, the
  second home visit moved to 15.30 and Majelis Kenanga to 16.30, so the deposit
  still lands inside its 18.00 cut-off.

## The KPI page — one number per card

Reworked toward the reference's flat-rupiah layout, with one rule: **every card
answers "how many more women".** It used to print four figures per parameter —
a percentage, a target count, the current count, and a rupiah motivation line —
and the BP had to subtract two of them to reach the only one she can act on.

- The subtraction is done for her and the result **is** the headline: *Kurangi 3
  mitra lagi* / *Tambah 3 mitra lagi* / *Target tercapai*. The current count is
  gone outright — a number that exists only to be subtracted from another number
  is a number the app should be holding.
- The hero says *Penuhi 4 target lagi* instead of *3 dari 7 tercapai*. Same
  fact, phrased as work remaining. Period → Juni 2026 is the 7/7 all-clear.
- What survives: the target as small print (a BP gets asked the threshold, and
  nobody recites seven), and the bonus as a pill on the name line (it is what
  makes the gap worth closing). The percentage badge and the footer motivation
  strip both went.
- **Not adopted:** the reference's *Tugas ›* deep link per lagging row, and the
  *3/7* score on the KPI tab. The first contradicts this direction's thesis that
  the schedule owns the work; the second adds a number back to save none.

## Open questions

1. **Does the attendance gate pay for itself?** Collection cannot open until all 22 mitra are marked, per the reference. It means the BP passes the room twice. The 15 pre-paid mitra are seeded present so she marks 7 rather than 22, but the gate is the main thing to judge against `apartner-task-first`, which records attendance and payment on one card in one pass.
2. **Page vs sheet for collection.** This direction opens a full page where `apartner-task-first` opens a bottom sheet. The page can afford the week strip; the sheet kept the queue visible behind it. Both prototypes exist to be compared here.
3. **The credit-limit line on the recap is generic.** Stating the relationship without a number is deliberate — a real figure needs a scoring model this prototype doesn't have, and a fabricated one is the kind of number a BP might repeat to a mitra as a promise.
4. **Contact rows on the mitra page do nothing.** WhatsApp and route are affordances only, same as in `apartner-task-first`.
5. **A prospect has no home between her two tasks.** Designer's call: no fourth
   tab, the schedule owns the work. So the sosialisasi task stays on the day as
   a record and its screen doubles as that event's lead list — the only route to
   a prospect who isn't due today. That holds while a BP runs one session a
   week; the moment she carries fifty open leads across six sessions, "which
   sosialisasi did I meet her at?" becomes a real question with no screen behind
   it. The alternative was a Prospek tab, and it stays the obvious fix if this
   ever bites.
6. **Nothing feeds the KPI page.** "Siap diajukan" says it counts toward
   *Pencairan mitra baru*, but the KPI figures are authored per period and don't
   move. Wiring them would mean the scoreboard changes while you demo it, which
   is either the best argument for the flow or a distraction from it — worth a
   decision, not worth guessing.
