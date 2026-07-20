# A-Partner Task-First IA — notes

A second direction on the A-Partner IA, deliberately opposite in premise to
`apartner-homepage-ia`. That exploration makes the KPI page the spine and hangs
tasks off each metric. This one starts from the other end: **the BP should not
be handed a score at all.** Open the app, see the next thing to do, do it.

## The premise

- A BP carries four daily targets, visits 10+ mitra by motorbike, and works
  07:00–21:00 with no lunch break — burnout is structural.
- **Tugas Hari Ini is already the most-appreciated feature in the app** (71%
  CSAT), while the KPI-style Majelis page sits near the bottom (53%). The task
  view is the thing that works.
- The top complaint in feedback is that recent versions feel **"ribet"**
  (cluttered) — adding surface area is the failure mode, not the fix.
- DPD recovery already runs outside the app on an RM's pre-filtered Google
  Form. BPs are visibly willing to work a list someone else has reasoned about
  for them.

So: the app does the synthesising, the BP just does the visiting.

## What's built

- **Jadwal** (entry tab) — the day's schedule. One "Sekarang" card with one
  button; later tasks are a light timeline; done tasks collapse to a count.
  Each task carries a pre-reasoned line ("Menunggak 34 hari · Rp 450.000")
  instead of raw data.
- **Majelis visit** — a 3-step flow (collection → optional cross-sell offer →
  proof & submit), because a visit is a sequence, not one screen. Attendance is
  two named pills; payment is one "Tagih" button opening one sheet that holds
  every outcome, with "Bayar Penuh" preselected. A full miss ("tidak bayar") is
  a first-class, closeable outcome rather than something left unrecorded.
- **Home visit** — a 2-step flow for one mitra who is significantly behind
  (reach her, record the outcome → proof & submit). The amount owed is on
  screen the whole time, and the payment options are shown **inline on the
  page** rather than in a sheet: a majelis needs a sheet to keep its 22-card
  queue scannable, a home visit is one conversation and has nothing to protect.
  The options are the same either way, so the control is still learned once.
- **Proof** — both visits close by recording a location *and* a photo. A photo
  alone doesn't prove the BP was there, only that she photographed something.
- **Info Majelis** — reached from the "Info" pill inside a visit. Group
  schedule and ketua, plus the full mitra list with each one's outstanding loan
  and weekly instalment. Mitra who are behind sit up top; the rest are in a
  collapsed list, and every row opens that mitra's page.
- **Mitra page** — opened from any mitra's name across the app. Leads with one
  reasoned recommendation and a button; loan/payment history and attendance
  sit underneath in collapsed sections, for when the BP wants to dig in rather
  than by default.
- **Majelis tab** — a directory (where a group is, when it meets, who's
  behind), for when the schedule isn't what's sending you there.
- **KPI tab** — the four daily targets, deliberately read-only. No "do this
  now" attached to a lagging number — that's the model the other direction
  (`apartner-homepage-ia`) is testing, not this one.

## Open questions for review

1. **Portfolio percentages and the weekly collection target are cut** from
   the BP's view — the argument is these are BM/AM monitoring numbers, not a
   BP's daily work surface. Worth confirming with BM-side stakeholders.
2. **Cross-sell is demoted** to step 2 of a majelis visit (after collection,
   capped at one offer per mitra, skippable) rather than pushed harder for the
   digitalisation target — reflects that BPs don't champion offers they don't
   understand.
3. Only one majelis (`Majelis Mawar`) has a full roster in this prototype;
   the other two are schedule entries only.
4. The mitra page's contact buttons (WhatsApp, rute) currently just record a
   tap — they don't leave the app. Fine for a prototype; worth deciding what a
   real handoff should do.
5. **Agent onboarding (Agent AOne) has been pulled** from the cross-sell step
   until it's confirmed as a priority. Easy to put back.
6. **Peldis has been removed** from the home visit for now, pending
   confirmation of the settlement route.

## Parked — the guiding rule, and the case it doesn't cover

The rule this direction now works to: **work starts in Jadwal; lookup can start
anywhere and hands work back to Jadwal.** Info and stats live on secondary
layers — the reverse of the `apartner-homepage-ia` approach.

The Majelis tab is the one place that currently breaks it: tapping a group
launches its visit directly, bypassing the schedule. The open question is what
should happen for **a majelis not scheduled for today** — a visit that got
moved, or a group the BP is asked about. The proposal, agreed but deliberately
**postponed**, is that the tab shouldn't launch a visit at all: it should create
an unscheduled task on today's schedule and land the BP there, so there stays
exactly one surface where work lives. Open sub-question: should that task slot
in at *now* or at the group's usual meeting time?

## Design-system gaps surfaced

A few components were built locally in this project (in `lib/`) because FunDS
Lite doesn't have them yet — a step indicator, an attendance pill pair, a
selectable chip (used for reasons and promise-to-pay dates, to keep the sheet
short), a proof-capture tile, a collapsible section, and a status-summary row
(label/value list), among others. Several are now used across two projects and
are reasonable promotion candidates; happy to walk through them.

Two more from the agenda pass on the schedule tab:

- **`HeaderAction`** (`lib/ui.tsx`) — a top-bar icon button with a corner unread
  counter. Used twice on the schedule tab (inbox, notifications), and
  `apartner-homepage-ia`'s home screen hand-rolls the same badge markup. Two
  projects want it, which is the promotion tell. `Badge` doesn't cover it: that's
  an inline status pill, not a corner-mounted count.
- **`AgendaRow`** (`lib/ui.tsx`) — a fixed 40px time gutter beside a content
  slot, so a day's cards line up on one clock rail. Only used here so far, so
  it's not a candidate yet — noting it because any calendar/agenda surface will
  want the same primitive.
