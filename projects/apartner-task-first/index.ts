// Project module — exports config + the screens array.

import type { ProjectModule } from '@/platform/types'
import { config } from './project.config'
import { TodayScreen } from './screens/today'
import { MajelisVisitScreen } from './screens/majelis-visit'
import { MajelisOffersScreen } from './screens/majelis-offers'
import { MajelisProofScreen } from './screens/majelis-proof'
import { HomeVisitScreen } from './screens/home-visit'
import { HomeProofScreen } from './screens/home-proof'
import { MitraScreen } from './screens/mitra'
import { LadderScreen } from './screens/ladder'
import { MajelisInfoScreen } from './screens/majelis-info'
import { MajelisListScreen } from './screens/majelis-list'
import { KpiScreen } from './screens/kpi'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'today',
      title: "Today's Schedule",
      component: TodayScreen,
      entry: true,
      notes: [
        'One question, one answer: "what do I do now?" gets one card with one button — nothing else on screen is tappable.',
        'The "Sekarang" card states the reason ("Menunggak 34 hari · Rp 450.000") instead of raw numbers to interpret.',
        'Later tasks are a light timeline, no KPIs or filters. Each row is tappable if a BP\'s plan slips and she wants to jump ahead. Finishing a visit auto-promotes the next task.',
      ],
      flowsTo: [
        { to: 'majelis-visit', label: 'Mulai Kunjungan (tugas majelis)' },
        { to: 'home-visit', label: 'Mulai Kunjungan (home visit)' },
        { to: 'majelis-list', label: 'tab Majelis' },
        { to: 'kpi', label: 'tab KPI' },
      ],
    },
    {
      id: 'majelis-visit',
      title: 'Majelis Visit - 1 — Attendance & Payment',
      component: MajelisVisitScreen,
      notes: [
        'Step 1 of 3 — a visit is a sequence: collect, then offer, then prove and submit. The step bar shows position but isn\'t tappable; steps only advance by being finished.',
        'The queue clears on "recorded", not "paid" — a mitra who said no with a reason still counts as done, so the count can actually reach zero.',
        'Attendance is two named pills ("Hadir" / "Tidak"), no default selected — leaving it blank is a real state, not an assumption. They were ✗/✓ icons before; a bare ✗ has no fixed meaning on a card that already shows a red overdue line.',
        'Payment is one button — "Tagih" — opening one sheet that holds every outcome, with "Bayar Penuh" already selected. It was two buttons before; this trades a tap for a card that isn\'t split between two competing actions, and gives the BP a chance to correct a full payment before it\'s recorded.',
        'A recorded "tidak bayar" is treated as a finished, closeable result — not a gap to hide — since that\'s what lets ops actually chase it up.',
      ],
      flowsTo: [
        { to: 'majelis-offers', label: 'Lanjut → langkah 2' },
        { to: 'mitra', label: 'ketuk nama mitra' },
        { to: 'majelis-info', label: 'Info' },
      ],
    },
    {
      id: 'majelis-offers',
      title: 'Majelis Visit - 2 — Additional Tasks',
      component: MajelisOffersScreen,
      notes: [
        'Step 2 of 3 — same mitra list as step 1, same card, only the action row changes to the recommended offer. Keeps the two steps reading as one screen with one thing changed.',
        'Cross-sell is optional and comes after collection: one offer per mitra, and the whole step is skippable ("Lewati") if nothing applies.',
        'Agent onboarding (Agent AOne) has been pulled from this step — it isn\'t confirmed as a prioritised initiative, and the step should only carry pitches a BP will actually be asked to make.',
        'Only mitra with an actual recommendation are shown — no empty rows for everyone else.',
      ],
      flowsTo: [
        { to: 'majelis-proof', label: 'Lanjut / Lewati → langkah 3' },
        { to: 'majelis-visit', label: 'kembali' },
        { to: 'mitra', label: 'ketuk nama mitra' },
      ],
    },
    {
      id: 'majelis-proof',
      title: 'Majelis Visit - 3 — Proof & Submit',
      component: MajelisProofScreen,
      notes: [
        'Step 3 of 3 — both a recorded location and a photo are required before "Selesaikan Tugas" unlocks; an unproven visit shouldn\'t count as submitted.',
        'Location was added alongside the photo because a photo alone doesn\'t prove the BP was there — it proves she photographed something. The two are shown as equal tiles, since neither substitutes for the other.',
        'The recap reads back what was entered, since submitting is final — it\'s the BP\'s last chance to catch a missed mitra.',
        'Missing attendance or unpaid mitra show a warning, not a block — the field decides, the app doesn\'t force it.',
      ],
      flowsTo: [
        { to: 'today', label: 'Selesaikan Tugas' },
        { to: 'majelis-offers', label: 'kembali' },
      ],
    },
    {
      id: 'home-visit',
      title: 'Home Visit - 1 — Meet & Collect',
      component: HomeVisitScreen,
      notes: [
        'Step 1 of 2 — a home visit is for one mitra who\'s behind, so there\'s no cross-sell step; it\'s optimised end-to-end for collection.',
        'One doorstep card up top: who she is, WhatsApp/call buttons, her address. Calling is built in, since not reaching her is the most common way a home visit fails.',
        'The amount owed sits in its own card directly beneath, visible from the moment the step opens and no matter what has been answered — the BP should never be talking to her with the number she is asking for off-screen.',
        'Who the BP actually met (her / a family member / nobody) is one question, asked once, then the rest of the form follows from that answer.',
        'Payment options are shown inline on the page, not in a bottom sheet. A majelis step keeps its sheet because the screen behind it is a queue of 22 cards that has to stay scannable; a home visit is one mitra, so the page has nothing to protect and can simply grow as she answers. The options themselves are identical to the majelis sheet.',
        'There is no "Simpan" — with the options inline, what is on screen is the record. Selections write immediately, so the answer survives tapping through to her mitra page and back.',
        'The Peldis (principal-only settlement) recommendation has been removed for now — parked until the settlement route is confirmed. This step records the outcome and nothing else.',
      ],
      flowsTo: [
        { to: 'home-proof', label: 'Lanjut → langkah 2' },
        { to: 'mitra', label: 'ketuk nama mitra' },
      ],
    },
    {
      id: 'home-proof',
      title: 'Home Visit - 2 — Proof & Submit',
      component: HomeProofScreen,
      notes: [
        'Step 2 of 2 — location and photo both required, same as the majelis close. Location arguably matters more here: a majelis has a fixed meeting place the BM already knows, while a home visit is the one that gets doubted.',
        'The recap reads back who was met and what she paid.',
        'Only warns if nothing was recorded at all. A properly-recorded "no" is finished work, not something to nag about.',
      ],
      flowsTo: [
        { to: 'today', label: 'Selesaikan Tugas' },
        { to: 'home-visit', label: 'kembali' },
      ],
    },
    {
      id: 'mitra',
      title: 'Mitra Page',
      component: MitraScreen,
      notes: [
        'Opened by tapping a mitra\'s name from any visit card (chevron is the tell) — no extra button needed on already-crowded cards.',
        'This is where loan/payment history lives, since CSAT says it\'s wanted but it doesn\'t belong cluttering the collection queue.',
        'The page opens on what to DO about her (one reasoned recommendation), with the full record collapsed underneath — not a dashboard of numbers to interpret first.',
        'A mitra who\'s current with nothing to offer shows "Tidak ada tindak lanjut" — a real, time-saving outcome, not a gap.',
        '"Bahan obrolan" sits between the actions and the record — the one thing on the page meant to be said rather than done. Its subtitle carries the ladder\'s conclusion, so a BP who never opens the screen still learns the fact.',
      ],
      flowsTo: [{ to: 'ladder', label: 'Jalur Naik Modal' }],
    },
    {
      id: 'ladder',
      title: 'Jalur Naik Modal',
      component: LadderScreen,
      notes: [
        'Reframed from a mitra-facing screen into a BP briefing: the BP reads the quoted line out loud, then turns the phone around so the mitra can read the rail herself. The framing copy speaks to the BP about the mitra; the script and rail speak to the mitra.',
        'Leads with the sentence to say, not the ladder — same rule as the mitra page. A BP who only reads the top of the screen has still got what she came for. The line is quoted verbatim because a BP handed bullet points has to compose it herself at the door, which is where a real argument collapses into "ada program top up, Bu".',
        'The blocked ("Tertahan") state is the one that matters — most mitra worth opening are behind, and a cheerful progress bar for a woman 34 days down is a claim the BP has to walk back. Held rungs go orange, the meter greys out, and the script changes.',
        'What releases it is the WHOLE arrears, not this week\'s angsuran — stated as one number with the arithmetic shown. It gets no button of its own: collecting is already the mitra page\'s recommendation, and two buttons for one job is how a second place for work quietly appears.',
        'Rung amounts escalate off her current contract value (25% → 50% → 2× limit). The reference mock repeated the same +Rp1.250.000 on rungs 1 and 2, which makes the ladder a calendar rather than a ladder.',
        'Framed as leverage for collection, not cross-sell — which is why it lands in this direction at all, given cross-sell is deliberately demoted elsewhere (NOTES, open question 2).',
      ],
      flowsTo: [{ to: 'mitra', label: 'kembali' }],
    },
    {
      id: 'majelis-info',
      title: 'Majelis Info',
      component: MajelisInfoScreen,
      notes: [
        'Opened via the "Info" pill in the visit header, so the visit screen itself doesn\'t have to carry group details like schedule and ketua.',
        'Reads back today\'s progress but doesn\'t nag — that warning lives on step 3 only, so it isn\'t repeated in two places.',
        'Now carries the full mitra list, each row showing outstanding loan and weekly instalment — the numbers a BP gets asked about. Mitra who are behind stay in their own section up top; everyone else sits in a collapsed "Semua mitra" list, so the page answers a question when asked rather than opening as a wall of balances.',
        'Every row opens that mitra\'s page, so these rows stay a way in to the record rather than a substitute for it.',
      ],
      flowsTo: [{ to: 'majelis-visit', label: 'kembali' }],
    },
    {
      id: 'majelis-list',
      title: 'Majelis',
      component: MajelisListScreen,
      notes: [
        'Every group the BP carries, not just today\'s — for when someone asks about a group off-schedule (a BM, a moved visit).',
        'Stays a directory, not a dashboard: what the group is, when it meets, how many mitra are behind. No portfolio percentages — those are BM-level numbers.',
        'Today\'s groups sort first, so this tab agrees with the schedule rather than competing with it.',
        'Prototype edge: only Majelis Mawar has a full mitra roster — the other groups open to placeholder data.',
      ],
      flowsTo: [
        { to: 'majelis-visit', label: 'buka kunjungan' },
        { to: 'today', label: 'tab Jadwal' },
        { to: 'kpi', label: 'tab KPI' },
      ],
    },
    {
      id: 'kpi',
      title: 'KPI',
      component: KpiScreen,
      notes: [
        'The four daily targets, tucked behind a tab rather than on the working surface — the BP checks it when she wants to, it doesn\'t interrupt her.',
        'Deliberately read-only, no "do this now" attached to a lagging number — that\'s the model `apartner-homepage-ia` explores, not this one.',
        'Ends by pointing back at the schedule: the targets move because visits get done, not the other way round.',
      ],
      flowsTo: [
        { to: 'today', label: 'tab Jadwal' },
        { to: 'majelis-list', label: 'tab Majelis' },
      ],
    },
  ],
}
