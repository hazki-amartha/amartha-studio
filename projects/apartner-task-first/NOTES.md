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
later tasks are a timeline the BP reads rather than a list they choose from; done
tasks collapse to a count. Finishing a visit promotes the next task, so the BP
never picks. Each task carries a pre-reasoned one-liner ("Menunggak 34 hari ·
Rp 450.000") instead of raw data.

**`majelis-visit`** — a queue that drains. One count at the top that is a
countdown to zero, and one card per mitra who still owes. The page empties as the
work gets done, which is the only progress indicator it needs.

## What a majelis visit records

Exactly two things per mitra, so each card carries exactly those two controls:

1. **Attendance** — `Hadir` / `Tidak`, a two-option pill group answerable in one
   tap. Unselected is a real third state: it means the BP hasn't marked them yet.
2. **Payment** — an **amount, not a flag.** Partial payment is a normal field
   outcome, so a boolean would lose it. "Terima" opens a sheet prefilled with the
   full instalment: paying in full is two taps (Terima → Simpan), paying part
   costs one edit.

A mitra leaves the queue only once they are **lunas**. A partial payment keeps
them in the list showing `Kurang Rp X`, because they still owe — an unfinished
row is more honest than a green tick.

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
3. **Cross-sell demoted to a tail.** Offers are collapsed, marked "opsional",
   capped at one per mitra, and only listed for mitra who are already lunas, so
   they can never compete with collection. The digitalisation target is real, but
   *Day in a Life* found BPs don't champion initiatives they don't understand —
   a pitch buried behind settled payment is the honest priority.

## Next — to design together

The mitra page and the Home Visit page overlap heavily (both are about one
borrower and her repayment record), so they get tackled as one piece:

- **Mitra page** — the destination for the loan/payment history cut from the
  queue (point 2). Entry point is a button on the mitra card. **The button is not
  built yet**: a dead control in a prototype misleads reviewers, so it lands with
  the page.
- **Home Visit page.** Home visits are on the schedule and the timeline, but the
  "Mulai Kunjungan" button is disabled when one reaches "Sekarang". Per Ciseeng
  it should absorb the Google Form: visit outcome, amount paid, PTP date, reason
  for non-payment, photo.

Also outstanding: only `Majelis Mawar` has a roster; the other two majelis tasks
are schedule entries only.

## Components proposed for promotion

Per the §4 missing-component protocol, these live in `lib/` and are built only
from tokens + design-system components:

- **Segmented** (`lib/ui.tsx`) — a 2–3 option pill group for a single choice that
  must stay visible and answerable in one tap (attendance on every mitra card).
  Motivating gap: the design system's sanctioned "pick one" pairing is a
  BottomSheet + SelectableCard, which costs a tap and hides the answer; `Toggle`
  can't express "not answered yet" as distinct from "no". A recurring need on any
  high-frequency row-level choice.
- **Collapsible** (`lib/ui.tsx`) — a disclosure section (header row + count hint +
  chevron) that expands its children. This direction leans on it hard: collapsing
  is how the page stays about one job. FunDS Lite has no disclosure control, and
  the pattern already recurs three times across two screens here.
- **Avatar** (`lib/ui.tsx`) — the circular initials chip leading every mitra row.
  Also proposed by `apartner-homepage-ia` — that is a second independent ask, so
  it has arguably earned promotion.
- **IconTile** (`lib/ui.tsx`) — a rounded square holding a 20px icon on a status
  tint. Also proposed by `apartner-homepage-ia`.
