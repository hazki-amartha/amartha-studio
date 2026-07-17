# A-Partner Task-First IA — notes

A second direction on the A-Partner IA, deliberately opposite in premise to
`apartner-homepage-ia`. That exploration makes the KPI page the spine and hangs
tasks off each metric, so a score always has an action attached. This one starts
from the other end: **the BP should not be handed a score at all.** Open the app,
see the next thing to do, do it.

## The premise

From the insight library, the BP's day is not short of information — it is short
of time and attention:

- A BP carries **four simultaneous daily targets** (disbursement, repayment, PAR
  recovery, digitalisation), visits 10+ mitra by motorbike, and works 07:00–21:00
  with no lunch break. Burnout is structural. — *Day in a Life of a Field Officer*
- **Tugas Hari Ini is the most-appreciated feature in the whole app** — 71% say it
  helps them prioritise and focus — while the Majelis page sits near the bottom at
  53% CSAT. The task view is already the thing that works. — *CSAT A-Partner Q1 2026*
- The top qualitative theme is that recent versions are **"ribet"**, with explicit
  requests to roll back. Adding surface area is the failure mode here, not the fix.
- **DPD recovery already runs outside the app** on an RM's Google Form, and the
  work arrives pre-filtered and pre-prioritised ("Prio BP" / "Prio BM"). BPs are
  visibly willing to work a list someone else has reasoned about for them.
  — *Field Visit — Point Ciseeng*

So: the app does the synthesising, the BP does the visiting.

## The two screens

**`today`** — the schedule, hour by hour. One "Sekarang" card with one button;
later tasks are a lightweight timeline (no KPIs, no filters); done tasks collapse
to a count. Finishing a visit still promotes the next task, so the queue advances
by itself — but each "Berikutnya" row is also tappable (a right chevron is the
tell) to launch its visit directly, because a BP's plan slips: a mitra is home
*now*, a majelis moved, and forcing clock-order completion would fight the field
rather than serve it. Each task carries a pre-reasoned one-liner ("Menunggak 34
hari · Rp 450.000") instead of raw data.

**The majelis visit** — three screens, because a visit is a **sequence**, not a
screen. Splitting it means each page holds one job and the BP is never choosing
between kinds of work:

| Step | Screen | The one job |
|------|--------|-------------|
| 1 | `majelis-visit` | Kehadiran & Pembayaran — the collection queue |
| 2 | `majelis-offers` | Tugas Tambahan — the recommended action per mitra |
| 3 | `majelis-proof` | Foto & Kirim — proof, then submit |

A `StepBar` under the header shows position. It is deliberately **not tappable**:
steps advance by being finished, the same way the schedule promotes the next task
by itself.

### Step 1 — what a visit records

Exactly two things per mitra:

1. **Attendance** — two circular icon buttons (✗ / ✓) in the identity row. At 22
   cards the words "Hadir"/"Tidak" repeat 44 times for a question whose answer is
   a shape. Unselected is a real third state — the BP hasn't marked her yet,
   which differs from marking her absent — so there is no default, because a
   default would fabricate attendance data. Selected uses the sanctioned status
   pairing (green/red 500 on its own 50 tint) rather than `primary-500`:
   attendance is a status, not a primary action, and colour resolves at a glance
   while scanning a roster where two purple circles would differ only by glyph.
2. **Payment** — two buttons, primary last where the thumb lands:
   - **Lunas** — the common case, so it costs **one tap and no sheet**.
   - **Catatan** — the one door to every other outcome. The sheet opens on a
     mode switch: *Bayar sebagian* (an amount, over **or** under — partial is a
     normal field outcome and overpayment is marked later) or *Tidak bayar* (a
     reason, plus a promise-to-pay if she gave one). Mode comes first because
     "she paid some" and "she paid nothing" need different questions, and the BP
     knows which she is before the sheet opens.

Three buttons (`Tidak Bayar` / `Jumlah Lain` / `Bayar Lunas`) came first and were
collapsed to two: at 390px three named actions crowd the row, and the split
between "wrong amount" and "no money" is a question for the sheet, not a decision
to make from the card.

**"Tidak Bayar" as a first-class outcome is the point.** A no with a reason and a
date is a result the BP can close and ops can chase. Leaving it unrecorded is
exactly what pushes DPD work onto the RM's Google Form (per Ciseeng).

### The queue drains on *recorded*, not on *paid*

The step's job is to record an outcome for every mitra, not to make everyone
lunas. So the split is **Belum dicatat / Sudah dicatat**, and a card leaves the
queue once it has an outcome of any kind.

This was originally grouped on `lunas` (`Belum lunas` / `Sudah lunas`), which was
wrong twice over: a mitra recorded as *tidak bayar* was finished but sat in the
queue forever, so the count could never reach zero even when every mitra had been
dealt with — and the copy claimed she was "sudah lunas" when she plainly wasn't.

The header number is what's left **in this step** — mitra not yet dealt with and
what they owe — not the majelis's outstanding debt. Recorded mitra collapse into
`Sudah dicatat`, each row carrying its own outcome (`Rp 200.000` lunas / `Kurang
Rp 100.000` / `Tidak bayar` + reason + PTP) and an **Ubah** that reopens the sheet
that produced it, so leaving the queue never traps an entry.

Step 3's warning follows the same rule: it flags work **not done** (`belum
dicatat`), never money not collected. Nagging about a recorded refusal would
train the BP to ignore the warning.

### Step 2 — the same list, one row different

Steps 1 and 2 render the **same `MitraCard`**, which computes the identity block
(avatar, name, subtitle, DPD badge) from state itself so the two steps cannot
drift apart. Only the action row below the rule is swapped. The sameness is doing
work: the BP sees the same faces in the same layout, so the only thing to read is
what changed — the recommendation.

Cross-sell is nice-to-have, so the **sequence** carries the priority rather than
the visual weight: the step comes after collection, is capped at one action per
mitra, lists only mitra who have a recommendation, and is skippable (the CTA
reads "Lewati" until something is offered).

### Step 3 — proof gates submit

The photo gates "Selesaikan Tugas". An unproven visit is not a submitted one, and
a disabled button with a reason under it beats accepting the task and failing it
at sync.

The recap above the camera is **the one place this direction shows a summary**,
and it is earned: submission is irreversible from the BP's side, so this is their
last chance to catch "I forgot to mark Ibu Ani". It reads back what they entered
rather than asking them to interpret a metric. Unmarked attendance or unpaid
mitra raise a **warning, not a block** — the field decides, not the app. A majelis
where three mitra never showed up is a real Tuesday.

### The 32px card rhythm

Everything on the card sits on 32px — avatar, both attendance circles, and both
action buttons — so the two rows read as clean bands rather than a ragged stack.

**Design-system gap:** FunDS button sizes step **28px (`xs`) → 36px (`sm`)**, so
neither lands on the 32px the card is built to. The buttons carry `h-32` (a token
class, not an arbitrary value) to pin them. If this rhythm holds elsewhere, a
32px button rung is worth adding to `Button` rather than re-fixing per screen.

## Deliberate cuts — open questions for review

These are cuts, not oversights:

1. **Portfolio percentages and the weekly collection target.** Removed — these
   are BM/AM monitoring numbers rendered on the BP's work surface. The no-SSOT
   finding says BMs genuinely need them; the argument here is that they belong in
   the BM's view, not in the BP's queue.
2. **Per-mitra loan history** (outstanding, weekly instalment, payment history).
   Cut from the majelis view — *agreed*. The counter-signal is real: CSAT says
   loan/payment history is among the **most-sought** data and FOs complain it is
   unavailable outside pelayanan days. So it does not disappear, it **moves to a
   mitra page**, reached from a button on the mitra card. Deferred on purpose —
   see "Next" below.
3. **Cross-sell demoted to a later step.** Offers are step 2, after collection,
   capped at one per mitra, labelled opsional, and skippable. The digitalisation
   target is real, but *Day in a Life* found BPs don't champion initiatives they
   don't understand — a pitch that waits until the money is counted is the honest
   priority. Note this replaced an earlier gate (only offering to mitra already
   lunas): once offers became their own step, the step order does that job, and
   the gate would only have hidden work from a BP who is standing right there.

## The home visit — the same flow, one borrower

Home visits now open a real flow (the "Mulai Kunjungan" button is no longer
disabled). A home visit is the **single-mitra twin of the majelis visit**, and it
is built as exactly that on purpose: same three-step `StepBar`, same `MitraCard`,
same payment `BottomSheet`, same proof-gates-submit close. A BP who has run a
majelis already knows every control; only the roster size changed.

| Step | Screen | The one job |
|------|--------|-------------|
| 1 | `home-visit` | Temui & Tagih — reach her, record the outcome |
| 2 | `home-offer` | Tugas Tambahan — the one recommended action |
| 3 | `home-proof` | Foto & Kirim — proof, then submit |

What differs, and why:

- **The queue becomes one card.** With one borrower there is no countdown to
  zero, so step 1 opens on the *why now* instead — the address and the
  pre-reasoned reason line lifted straight from the schedule (`Menunggak 34 hari ·
  Rp 450.000`). It is the same "hand the BP the reasoning" move the `today` card
  makes.
- **Attendance is reread as "Ditemui / Tidak di rumah".** On a doorstep the first
  fact is whether you reached her at all. "Not home" is a real outcome, not a
  blank: it is logged through the same **Catatan → Tidak bayar** door, with reason
  `Tidak ada di rumah` and a revisit date, so an empty-handed trip still closes
  the loop instead of vanishing.
- **The extra task is relief, not growth.** For a delinquent the honest offer is a
  longer tenor (`Perpanjangan tenor`), not a new product — so step 2 reads as part
  of the collection conversation. It stays skippable and self-closing; a mitra with
  nothing to offer (Sari, keeping today's promise) lands on the empty state.
- **Step 3's only warning is "nothing recorded at all".** Same rule as the majelis
  close: a recorded `tidak bayar` with a reason and a date is finished work, so the
  banner flags an untouched visit, never an unpaid balance.

Both home-visit mitra reuse the shared store keyed by mitra id
(`attendance` / `payments` / `nonPayments` / `offerResults`), so nothing new was
added to state beyond `openHome` (which home-visit task is open) — the mirror of
`openMajelis`.

## Next — to design together

- **Mitra page** — the destination for the loan/payment history cut from the
  queue (point 2). Entry point is a button on the mitra card. **The button is not
  built yet**: a dead control in a prototype misleads reviewers, so it lands with
  the page. The home visit is the closest existing surface (both are one borrower
  and her repayment record), so the mitra page likely grows out of it.

Also outstanding: only `Majelis Mawar` has a roster; the other two majelis tasks
are schedule entries only.

## Components proposed for promotion

Per the §4 missing-component protocol, these live in `lib/` and are built only
from tokens + design-system components:

- **StepBar** (`lib/ui.tsx`) — three bars + a "Langkah N dari 3" label for a
  multi-step task. FunDS Lite has no stepper at all, and any flow split across
  screens (visit, onboarding/UK, disbursement) needs one.
- **IconToggle** (`lib/ui.tsx`) — a circular icon button holding a selected
  state; two of them make the attendance ✗/✓ on every mitra card. Motivating gap:
  the design system's sanctioned "pick one" pairing is BottomSheet +
  SelectableCard, which costs a tap and hides the answer, and `Toggle` can't
  express "not answered yet" as distinct from "no". Note the unselected style is
  load-bearing — `neutral-400` on `neutral-50` is the *disabled* pairing and made
  unanswered cards look switched off, so it is an outlined circle on white.
- **Collapsible** (`lib/ui.tsx`) — a disclosure section (header row + count hint +
  chevron) that expands its children. This direction leans on it hard: collapsing
  is how the page stays about one job. FunDS Lite has no disclosure control, and
  the pattern already recurs three times across two screens here.
- **Avatar** (`lib/ui.tsx`) — the circular initials chip leading every mitra row.
  Also proposed by `apartner-homepage-ia` — that is a second independent ask, so
  it has arguably earned promotion.
- **IconTile** (`lib/ui.tsx`) — a rounded square holding a 20px icon on a status
  tint. Also proposed by `apartner-homepage-ia`.
