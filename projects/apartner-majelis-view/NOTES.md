# Notes — apartner-majelis-view

## Project-local components (§4)

- `TabBar` — the three L0 destinations (Jadwal / Majelis / KPI), hidden inside a pelayanan. Ported from `apartner-task-first`.
- `AgendaRow`, `HeaderAction` — the schedule's clock gutter and its top-bar icon buttons. Ported from `apartner-task-first`.
- `HomeMitraCard` / `TagihanCard` — the home visit's doorstep card (identity + WhatsApp/call + address) and the ledger-derived amount card beneath it.
- `StageBar` — three numbered stages with rails; a cleared stage turns green and swaps its number for a tick. Used on attendance, collection, growth, recap.
- `WeekStrip` — horizontal repayment rail carrying the amount inside each week. Superseded on payment pages by `WeekGrid` + `AngsuranCard`; kept for any surface that still wants the scrollable, amount-per-week form.
- `WeekGrid` — the recent cycle as a fixed six-cell band on a lightest-grey fill: each cell stacks the week's date, its outcome as a status circle (green paid / orange part-paid / red missed / hollow primary ring for the open week), and the rupiah received that week. No dividers and no outer border — the grey ground and the spacing are the only edges — so it reads as one calendar band, flat enough to sit in a card or straight on the page. The amount under each cell is the point: a red Rp0 and an orange Rp100rb are a miss and a shortfall, and only one is a sentence the BP can say. Full history is behind "Lihat Semua".
- `AngsuranCard` — `WeekGrid` + the tagihan breakdown, titled "Riwayat Angsuran" with an optional "Lihat Semua" link. Only the total is bold — the tunggakan and weekly lines are set regular so the sum has something to be louder than — and it is ruled off from the two parts it is made of. `flat` strips the border, padding and heading so the card sits straight on the page: the collect page uses it to read identity, history and bill as one unified block, while the mitra page keeps the carded form. The one payment card the mitra page, home visit and collect page all open on, so the bill is drawn one way everywhere. Lives in `mitra-card.tsx` beside `TagihanBreakdown`.
- `ResultRow` — what a stage card says once its outcome is RECORDED, as opposed to `ActionRow`, which is right while the card still asks for something. Same caption-over-figure at the same 16px as the "Tagihan" it replaces, so a card doesn't change type size the moment it's answered. Status badge and a round `NotePencil` button sit together at the edge, where "Tagih" was — the word "Ubah" cost a whole label for what the pencil says in an icon. Anything further — what is still short, the reason, the janji bayar — drops to a SECOND row under a rule, set regular rather than bold so it doesn't argue with the collected figure above it. The second row only renders when there is something to put in it, so a clean "Lunas" stays one row tall. Used on the collection stage.
- `MitraBadges` / `StatusChip` — her standing facts as a wrapping row of outlined, icon-led chips (product · DPD bucket · relief or pre-disbursement), used under the name on the mitra detail page. Supports the new labels the top bar couldn't hold: `keringanan` → "Dapat Keringanan", `predisburse` → "Ready to Disburse" (which replaces the DPD chip, a new mitra having no bucket). The filled `Badge` / `DpdBadge` stay where a single status is scanned down a column (roster, queue); this is for the header row where several line up and the icon is the anchor. `predisburse` added to the `Mitra` type.
- `ProdukCard` / `LabeledRow` / `PhotoLink` / `CircleButton` / `PinButton` — the mitra page's lower detail cards (Produk chips, Detail with majelis + addresses, Penanggung Jawab). `LabeledRow` is a label-over-value card row with an optional right-pinned control and an under-value link; `CircleButton` the round bordered icon button the reference puts every route pin and WhatsApp in. Local to `mitra.tsx`.
- `ProgressCard` — headline value + denominator over a meter. `showPercent={false}` drops the percentage, which was a third way of saying what the value, the denominator and the bar already said, and let the denominator take the right-hand slot; all three majelis-visit stages now use it that way. `flat` drops the card chrome for the white header band those stages sit it in. Stage 2 runs on CASH only (`cashCollectedTotal` / `cashBillableTotal`) — the self-serve mitra settled through the app and were never the BP's to collect, so counting them would start the bar part-full for work she didn't do.
- `StickyBar` — pinned footer holding a summary above its button. Used on all six action screens; the collect page needs the summary inside the sticky region or "sisa setelah ini" scrolls away from the button it qualifies.
- `PinMark` / `WaMark` — the two glyphs that are never neutral in this project: a location pin is red, WhatsApp is green, in a header, on a card, or inside a line of caption text. Components rather than a convention, because a convention is what drifts — one screen tints the pin, the next inherits `text-caption`, and the BP is left wondering whether the grey one means something else. The only pins left untinted are the ones inside tinted tiles (`ProofTile`'s "Rekam lokasi", the edit sheet's "Ubah lokasi"), where the container already carries the colour.
- `TagihanBreakdown` / `TagihanCard` — total tagihan and its two parts. Superseded everywhere by `AngsuranCard`, which the mitra page, the collect page and now the home visit all open on; kept for any surface that wants the bill without the week strip.
- `MitraCard` / `DpdBadge` / `MitraPhoto` — the one member card, shared by roster, attendance, collection and growth. `MitraPhoto` replaced the initials `Avatar` on every MITRA surface (roster, collect, doorstep): a BP in a room of 22 women recognises a face, and "SH" is something she has to decode into a name and then match to a person. It is a silhouette placeholder — the prototype has no photos — but it says what the real thing is. Leads keep `Avatar`: a prospect genuinely has no photo on file.
- `ActionRow` — the bottom half of a stage card: caption + bold figure left, one control right. Used by all three visit stages, which is what keeps the card one object as the BP moves through them.
- `ChoicePill` — the two-outcome pill pair (Tidak/Hadir, Tidak/Tertarik), selected in primary. Replaces `AttendancePill`'s green/red selection: the pills record what was said, and a red "Tidak hadir" beside a red DPD badge puts two alarms in one colour. Used on attendance and growth.
- `OptionCard` — a radio card that HOLDS its own follow-up (the amount field, a reason list). FunDS `SelectableCard` is a `<label>`, so every click inside it re-triggers the radio and pulls focus off whatever is being typed; this is the same look drawn from tokens with only the header row acting as the label. Used on the collect page.
- `ChoiceList` / `ChosenRow` — a single-choice reason picker as full-width rows with a radio mark, collapsing to the answer + "Ubah" once picked. Replaces the chip wrap for absence and decline reasons: reasons are uneven-length sentences, and a chip wrap gives ragged rows and unequal tap targets. Used on attendance and growth.
- `Chip`, `ChipGroup`, `ProofTile`, `StatRows`, `Meter`, `Avatar`, `IconTile`, `Collapsible`, `Overline`, `SectionTitle`, `VisitTitle` — carried over from `apartner-task-first`.
- `LeadRow` / `LeadIdentityCard` — a prospect as a list row and as the identity block on her own record. Both lead with the interest grade, because a list of leads has no other ranking.
- `ContactButton` — the round WhatsApp/handset pair, lifted out of `home-card.tsx` into `ui.tsx`: reaching someone is now the whole job on two screens, not one.
- `RescheduleSheet` — a bottom sheet for moving a home visit to another day (reason + new date), reachable from the `link` slot of all three home-visit steps' top bars. A sheet, not an inline block or its own screen, because it is a meta-action on the TASK and has to be reachable mid-visit; the draft resets on open so a cancelled reschedule leaves nothing on the next door. Recorded in `store.reschedules` (keyed by task id), surfaced on the schedule as a "Dijadwalkan ulang" section — off today's plate, not to-do and not done.
- `IconTile` gained `blue` and `orange` tints for the two NTB task kinds, and `IconMegaphone` / `IconUserPlus` were added to `icons.tsx`.
- `ProductBadge` — the lending product wherever it appears, on a group or on a mitra. One component so the colours cannot drift between screens, which is the only way a colour code is worth having: Modal blue, GL purple, Hybrid neutral. The palette avoids the green/orange/yellow the status badges own. "Hybrid" is the internal word; the badge prints **GL Modal Mix**, which names both products in it.
- `SearchField`, `FilterBar`, `FilterChip`, `OptionSheet`, `ResetLink`, `EmptyState` — the Majelis tab's find-a-group layer, lifted shape-for-shape from `apartner-homepage-ia` (which solves the same problem on the same tab). Strong promotion candidates: three projects now want a filter chip over a bottom sheet, and two of them have written it independently. `SearchField` uses the shared `MagnifyingGlass` from `@/design-system/icons` rather than a local icon.
- `h-40` on a default-size `Button` — FunDS button sizes step 28 (xs) → 36 (sm) → 38 (md), so none lands on the 40px avatar rhythm the cards use. `h-40` is a token class, not an arbitrary value. The in-card actions (Tagih, Tawarkan) use the DEFAULT size rather than `sm`: `sm` sets 12px type and the attendance pills are 14px, so the same card was read at two sizes from one stage to the next.

## The L0 layer (Jadwal / Majelis / Mitra / KPI / Profil)

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
- **Majelis tab → the roster; Mitra tab → the borrower.** The two look-up
  surfaces answer different questions. "Who is in Kenanga" is a group; "where is
  Ibu Rina" is a person, and a directory of groups cannot take it — the woman
  phoning the BP does not open with which balai she attends. The Mitra card is
  the roster's card with one line added under the name for her majelis, which is
  the only difference the two lists need: on the roster, the group is the page
  you are already on.
- **Profil** is ported from `apartner-homepage-ia` unchanged except for one cut:
  that version carried a KPI card as a second route into the scoreboard, which
  made sense when Profil sat behind an avatar in a header. Here KPI is its own
  tab one thumb away, so the card would be a shortcut to the thing beside it.
- **Prototype edge:** only Majelis Mawar has a real roster — every task and every
  directory row opens Mawar's 22 mitra under the name of the group tapped. The
  Mitra tab handles this differently: the other groups borrow Mawar's LEDGERS,
  so every card carries a real DPD, product and repayment record, but each takes
  a distinct name from a pool of 100. A list whose whole purpose is search cannot
  show the same woman five times — that does not read as a shared fixture, it
  reads as a bug, and it makes the one gesture the screen exists for useless.

## Where this departs from the reference

- **Payment history screen dropped.** The week strip carries the amount per week, so a 50-row table says the same thing one screen further from the conversation. Designer's call.
- **"Tidak Bayar" added as a fourth collect option.** The reference's three choices are all payments, which leaves a mitra who hands over nothing unrecordable — she stays in the queue and the queue never reaches zero.
- **Home-visit outcomes extended to five.** The door is a collections visit, so its Tagih step carries two outcomes the majelis collect page doesn't: **Tanggung Renteng** (the group settles her whole bill under joint liability — the "PAR payment" the visit exists to reach; recorded as a full collection, tagged by `payMode === 'tanggung'`) and **Drop Out** (she is leaving the program — a flag with a reason, not a payment or a promise; it retracts both). The Lanjut gate now requires a COMPLETE outcome rather than only that someone was met.
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
