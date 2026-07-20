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
   - **Bayar Penuh** — the common case, so it costs **one tap and no sheet**.
   - **Lainnya** — the one door to every other outcome. The sheet opens on a
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
lunas. So the split is **Belum ditagih / Sudah ditagih**, and a card leaves the
queue once it has an outcome of any kind.

This was originally grouped on `lunas` (`Belum lunas` / `Sudah lunas`), which was
wrong twice over: a mitra recorded as *tidak bayar* was finished but sat in the
queue forever, so the count could never reach zero even when every mitra had been
dealt with — and the copy claimed she was "sudah lunas" when she plainly wasn't.

The header number is what's left **in this step** — mitra not yet dealt with and
what they owe — not the majelis's outstanding debt. Recorded mitra collapse into
`Sudah ditagih`, each row carrying its own outcome (`Rp 200.000` lunas / `Kurang
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

### The 40px card rhythm

Everything on the card sits on 40px — avatar, both attendance circles, and both
action buttons — so the two rows read as clean bands rather than a ragged stack.

This was 32px until the visit-page pass. The bands worked, but 32 is a small
target for a control the BP hits 22 times per majelis with a thumb, on a phone,
outdoors. 40 keeps the banding and buys back the tap area; the name moved to
18px in the same pass so the identity row still leads the card.

**Design-system gap:** FunDS button sizes step **28px (`xs`) → 36px (`sm`)**, so
neither lands on the 40px the card is built to. The buttons carry `h-40` (a token
class, not an arbitrary value) to pin them. If this rhythm holds elsewhere, a
40px button rung is worth adding to `Button` rather than re-fixing per screen.

### The visit header, and what got quieter

The visit pass moved emphasis to where the work is:

- **Header** carries two facts, not one: the visit's name and the slot it was
  scheduled for (`Majelis Melati` / `Selasa, 07.30`). A BP running two hours late
  needs to see which slot she is standing in, and the app otherwise dropped the
  schedule the moment the visit opened. An **Info** pill opposite the back arrow
  opens the majelis status page.
- **Step title is now the heading** (`Kehadiran & Pembayaran`, 20px bold) with
  `LANGKAH 1 DARI 3` demoted to a caption under it. The two were fused into one
  small line, which buried the only part the BP needs — what this screen is
  asking her to do. Position is reassurance; the job is the headline.
- **The status hero got quiet.** It was a 24px count at the top of the screen,
  which competed with the mitra queue it was meant to be summarising. It is now
  two label/value rows (`Kehadiran`, `Penagihan` with the money underneath). The
  subject of the screen is the list, so the list is what looks like the subject.
- **`Daftar Mitra`** labels the list, and the payment buttons read **`Bayar
  Penuh`** / **`Lainnya`** — plainer than `Lunas` / `Catatan`, which asked the BP
  to know a bit of product vocabulary before she could tap. `Sudah dicatat`
  became `Sudah ditagih` for the same reason.

**Steps 1 and 2 share the whole shell** — same header, same `StatRows` status
card, same `Daftar Mitra` heading — so the only thing that changes between them
is the list, which is the entire design of this flow. Step 2's rows count by what
the mitra *did*, one row per offer kind (`Sudah menabung: 2 dari 15 mitra`),
mirroring step 1's `Sudah ditagih`.

The home visit takes the header and step-title treatment, minus the Info pill:
on a one-borrower visit the status page *is* her mitra page, already reachable by
tapping her name.

## The wider IA — three tabs

Until this pass the direction had exactly one surface, which was the point. A tab
bar is the first thing that can undo "open the app, see the next thing to do", so
the split is deliberate:

| Tab | The question it answers |
|-----|------------------------|
| **Jadwal** | "What do I do now?" — still the entry screen, unchanged. |
| **Majelis** | "Where is Majelis Anggrek, and when?" — when the schedule is *not* the thing sending you there. |
| **KPI** | "How is the day going?" — the four daily targets. |

**Majelis** is the one thing the schedule genuinely cannot do. A BM asks about a
group, a mitra calls, a visit gets moved — and before this tab the only route to
a majelis was to wait for it to come up on the schedule, which is not how a week
goes. It stays a **directory, not a dashboard**: what a group is, when it meets,
and how many mitra are behind. No portfolio percentages — cut 1 still stands.

**KPI** is where the direction has to be honest with itself. The founding claim
was never "targets don't exist" — a BP carries four simultaneous daily targets
and is measured on them. The claim is about **placement**: a number on the
working surface makes her synthesise before she can move; a number behind a tab
is something she checks. So the page is deliberately **read-only** — no
"kerjakan sekarang" beside a lagging metric, because that is precisely the
KPI-spine model `apartner-homepage-ia` explores. It ends by pointing back at the
schedule: targets move because visits get done, not the other way round.

**The bar shows on those three screens only.** Inside a visit it is hidden — a
visit is a sequence with its own sticky CTA, and offering "jump to KPI" in the
middle of a collection queue is how a focused task turns back into browsing.

### Info Majelis

Opened by the header pill. It exists so the *visit* doesn't have to carry it: the
moment step 1 also has to answer "when does this group meet?" and "who is the
ketua?", the queue stops being a queue. Same move the mitra page makes for one
borrower, at group scale. Its "Kunjungan hari ini" block reads back progress but
does **not** nag — step 3 owns that, and two places warning about the same thing
trains the BP to ignore both.

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

## The home visit — two steps, optimised for collection

A home visit is **not** the majelis visit with one row. It was built that way
first — same three steps, same `MitraCard` — and the mismatch showed up as soon
as the branching did. A majelis stop is a queue with a shallow decision per
mitra. A home visit is **one** mitra with a deep decision, and it happens
*because* she is behind. So the flow is now two steps and shaped for recovery:

| Step | Screen | The one job |
|------|--------|-------------|
| 1 | `home-visit` | Temui & Tagih — reach her, record the outcome |
| 2 | `home-proof` | Foto & Kirim — proof, then submit |

**The cross-sell step is gone.** There is nothing to upsell someone two months
down, and the previous answer ("offer a longer tenor — relief, not growth") was
right about the *content* and wrong about the *shape*: relief is a collection
outcome, so it belongs inside the collection step, not in a step of its own that
copies the cross-sell furniture. See Peldis below.

### The doorstep card

One card, replacing three stacked blocks (a place card, a reason card, and the
shared `MitraCard`). On a single-mitra visit those were never three things:

```
[avatar] Nama ›                      [WhatsApp] [Telepon]
📍 Kp. Cibeuteung RT 02
──────────────────────────────────────────────────────────
Menunggak 62 hari · Rp 450.000              Selengkapnya ›
```

**The contact buttons are the point.** A home visit fails most often by simply
not reaching her, and the BP's real next move at a locked gate is to phone —
which until now meant leaving the app to look up a number the app already had.

### Fourteen questions, asked in two places

The team's flowchart branches hard: `met mitra? → can pay? → full/partial →
reason → PTP → Peldis`, and in parallel `not present → met PJ? → titipan? → PJ
PTP?`, and `met neighbour?` if not. `apartner-homepage-ia` renders that
faithfully as fourteen progressively-revealed questions on one page — thorough,
and a lot to stand in front of someone with.

The split here:

- **On the page** — what is simply *true when you arrive*: who answered the door,
  and did she pay in full (one tap, no sheet — the good case stays cheap).
- **In the sheet** — what has to be *negotiated*: the partial amount, the reason,
  the promise-to-pay date, the new address.

Three collapses do the actual work:

1. **`met mitra? → met PJ? → met neighbour?` is one question with three
   answers.** All three ask who the BP talked to. Nesting them made her answer
   the same question repeatedly just to reach "nobody was home".
2. **Mitra and PJ share the same outcome controls.** Whether the money came from
   her or from her husband doesn't change what gets recorded — the amount and the
   promise — so who handed it over is a **tag, not a branch**.
3. **"Nobody home" can't produce a payment**, so its sheet drops the mode switch
   and opens straight on the reason and the revisit date. Choosing it also clears
   any payment on file: you cannot have collected from someone you didn't meet.

`Pindah rumah` is the one reason that asks for more than a label — an address is
what turns a relocation into something ops can act on instead of a dead end.

### Peldis — the one offer a home visit makes

A mitra 60+ days down may settle by paying **principal only**, routed BP → BM →
HO. It surfaces inline in step 1 as a recommendation, because the app already
knows she is eligible and the BP shouldn't have to carry a threshold in her head.

This is what replaced the cross-sell step, and it is a better fit for the same
reason the step was wrong: Peldis exists to **close a bad loan**, not to sell
anything. It is the collection conversation, not a bolt-on to it.

Rina's home-visit record is 62 days down (her majelis record stays at 34 — the
home visit is explicitly the escalated case), so the flow exercises Peldis. Sari
at 3 days is the ordinary nudge.

State added: `metWith` (who answered the door) and `peldis`. Everything else —
`payments`, `nonPayments` — is the shared store keyed by mitra id, unchanged.

## The mitra page — actions first, record underneath

The destination for the loan/payment history cut from the queue (deliberate cut
2), now built. CSAT says that record is among the **most-sought** data in the
app, so the cut was never "BPs don't need it" — it was "it does not belong in a
collection queue". It lands here, on this direction's terms.

**The order of the page is the whole argument.** A mitra page is the classic
place a task-first app quietly turns back into a dashboard: open a person, get a
wall of outstanding balances, instalment tables and attendance percentages, and
leave having read a lot and done nothing. So:

| Zone | What's in it |
|------|--------------|
| Identity | One card: her majelis, mitra sejak, a bucket badge. Enough to be sure you opened the right woman, no more — her name is already in the header. |
| **Yang perlu dilakukan** | **One** recommendation, already reasoned, with the button. |
| Hubungi | WhatsApp + rute — a quiet list, never competing with the recommendation. |
| Riwayat & data | Three **collapsed** sections: tagihan & pinjaman, 8 weeks of payments, kehadiran. |

### The one recommendation

Chosen from her state, and it states its own justification rather than handing
over a metric — the same move the schedule's "Sekarang" card makes:

| Her state | The recommendation | The line under it |
|-----------|-------------------|-------------------|
| DPD ≥ 30 | Jadwalkan kunjungan rumah | "sudah lewat batas ditagih di majelis" |
| DPD 1–29 | Ingatkan lewat WhatsApp | "biasanya bayar setelah diingatkan" |
| Lancar, punya tawaran | Tawarkan *{produk}* | where she stands on it |
| Lancar, tidak ada tawaran | — | **"Tidak ada tindak lanjut"** |

That last row is a first-class outcome, not a gap: a mitra who is current and has
nothing to be offered should cost the BP no time at all.

Taking a follow-up is **recorded, not navigated** — the card reads back
"Kunjungan dijadwalkan" instead of resetting, so the BP can tell what she already
did about this mitra. It lives in the shared store (`followUps`), keyed by mitra
id like every other per-mitra fact.

### The record is collapsed on purpose

It is there to answer a follow-up question the BP **already has** ("kenapa dia
telat?"), not to brief her on arrival. Collapsed sections are also this
direction's established move for "things the BP does not need in front of her" —
the same `Collapsible` that hides `Sudah dicatat` on step 1.

The numbers are derived per-mitra from a hash of her name (`lib/profile.ts`)
rather than hand-authored 24 times, so every mitra is tappable from every screen
and has the same record each time. The history is made to **agree with her DPD
badge** — a mitra 34 days down shows five missed weeks — because a record that
contradicts the card that opened it is worse than no record.

### Entry point — the identity block, not a button

NOTES previously specified "a button on the mitra card". Built as the identity
**block** instead (avatar + name, with a right chevron beside the name as the
tell). A separate button would cost a row on every one of 22 cards in the step 1
queue, and adding surface area is precisely the "ribet" failure mode this
direction exists to avoid. The chevron is the same affordance the schedule's
"Berikutnya" rows already use, so it needs no learning.

It is live from all four card surfaces: both majelis steps and both home-visit
steps. Attendance toggles stay outside the tap target.

## Next — to design together

- Only `Majelis Mawar` has a roster; the other two majelis tasks are schedule
  entries only.
- The mitra page's contact actions (WhatsApp, rute) currently just record
  themselves — they don't leave the app. Fine for a prototype, but worth a
  decision on what a real handoff looks like.

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
- **StatRows** (`lib/ui.tsx`) — a card of label/value rows, with an optional
  second line under a value. Three screens use it (visit status, majelis info,
  and the mitra page's record). It is the shape a summary takes once you decide
  it should NOT be a hero number, which is a decision a design system can help
  people make.
- **VisitTitle** (`lib/ui.tsx`) — a two-line header title (name + when).
  `NavigationHeader` types `title` as `ReactNode`, so this composes cleanly, but
  every task-shaped screen wants the same stacked shape and none of them should
  be inventing the type ramp for it.
- **SectionTitle** (`lib/ui.tsx`) — a 14px bold heading over a list. Louder than
  the existing `Overline`, for the one list that *is* the screen's subject.
- **InfoPill** (`lib/ui.tsx`) — the header affordance that opens a status page.
  Sits in `NavigationHeader`'s `link` slot; a pill rather than a bare link
  because it sits opposite a back arrow and has to read as a control.
- **HomeMitraCard** (`lib/home-card.tsx`) — the doorstep card: identity, contact
  buttons, address, and a reason line that links onward. Not proposed for
  promotion yet — it has one use, and §4 says a component earns promotion by
  being wanted twice. Noted here because its **contact-button pair** is the part
  likely to recur: any screen showing a person the BP has to reach wants it.

Not proposed: the tab bar. `NavigationBar` already exists in FunDS Lite and
`lib/tabs.tsx` only wires it to `useFlow()` — no new component was needed.
