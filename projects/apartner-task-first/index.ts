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
import { MajelisInfoScreen } from './screens/majelis-info'
import { MajelisListScreen } from './screens/majelis-list'
import { KpiScreen } from './screens/kpi'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'today',
      title: 'Jadwal Hari Ini',
      component: TodayScreen,
      entry: true,
      notes: [
        'The whole homepage is one question — what do I do now? — and the answer is one card with one button. Nothing else on the screen is tappable.',
        'The "Sekarang" card carries the task\'s reason as a pre-reasoned line ("Menunggak 34 hari · Rp 450.000"), so the BP is never handed raw data to interpret.',
        'Later tasks stay a lightweight timeline — no KPIs, no filters, the deliberate opposite of a homepage full of them — but each row is now tappable (a right chevron is the tell) to launch its visit directly. The schedule still promotes the next task by itself; this just lets a BP whose plan slips start the mitra in front of them without clearing the queue in clock order. Finished tasks collapse into a count.',
        'Completing a visit promotes the next task into "Sekarang" — the schedule advances by itself, so the BP never chooses what to do next.',
        'Both task kinds now open a real flow: a majelis task opens the group visit, a home-visit task opens the single-mitra visit. The "Sekarang" button is the same "Mulai Kunjungan" either way — the schedule, not the BP, decides which one is next.',
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
      title: 'Langkah 1 — Kehadiran & Pembayaran',
      component: MajelisVisitScreen,
      notes: [
        'Step 1 of 3. The visit is a sequence, so it is three pages rather than one long screen: collect, then offer, then prove and submit. The StepBar shows position; steps advance by being finished, never by tapping the bar.',
        'The queue drains on RECORDED, not on paid. The step\'s job is to record an outcome for every mitra — not to make everyone lunas — so the split is "Belum ditagih / Sudah ditagih" and a card leaves the queue once it has an outcome of any kind.',
        'That fixed a real bug: grouped on lunas, a mitra recorded as "tidak bayar" was finished but sat in the queue forever, so the count could never reach zero — and the old "Sudah lunas" copy claimed she had paid when she plainly had not.',
        'Everything on the card sits on a 40px rhythm — avatar, both attendance circles, both buttons — so the two rows read as clean bands. FunDS button sizes step 28 (xs) → 36 (sm), so neither lands on 40; the buttons carry h-40 to pin them. See NOTES.md.',
        'Attendance is two circular icon buttons (✗/✓) in the identity row — at 22 cards the words "Hadir"/"Tidak" would repeat 44 times for a question whose answer is a shape. Unselected is a real third state, so there is no default: a default would fabricate attendance data.',
        'Payment is two buttons. "Bayar Penuh" is the common case at one tap and no sheet. "Lainnya" is the one door to every other outcome: the sheet opens on a mode switch — bayar sebagian (any amount, over or under) or tidak bayar (reason + janji bayar).',
        '"Tidak Bayar" as a first-class outcome is the point: a no with a reason and a date is a result the BP can close and ops can chase. Leaving it unrecorded is exactly what pushes DPD work onto the RM\'s Google Form.',
        'Recorded mitra collapse into "Sudah ditagih", each row carrying its outcome and an "Ubah" that reopens the sheet that produced it — so leaving the queue never traps an entry.',
        'The status card is two quiet label/value rows (Kehadiran, Penagihan), and step 2 uses the SAME card with its rows swapped for offer progress — so the two steps read as one screen with its list changed, not two screens.',
      ],
      flowsTo: [
        { to: 'majelis-offers', label: 'Lanjut → langkah 2' },
        { to: 'mitra', label: 'ketuk nama mitra' },
        { to: 'majelis-info', label: 'Info' },
      ],
    },
    {
      id: 'majelis-offers',
      title: 'Langkah 2 — Tugas Tambahan',
      component: MajelisOffersScreen,
      notes: [
        'Step 2 of 3. The same mitra list, rendered by the same MitraCard as step 1 — only the action row is swapped for the recommended action. The sameness does work: the BP reads the same faces in the same layout, so the only new thing is the recommendation.',
        'That sameness now runs all the way up the screen: same header (title, slot, Info pill), same StatRows status card, same "Daftar Mitra" heading. Step 2 counts by what the mitra DID — "Sudah menabung: 2 dari 15 mitra" — one row per offer kind, mirroring step 1\'s "Sudah ditagih".',
        'Cross-sell is nice-to-have, so the SEQUENCE carries the priority rather than the visual weight: this step comes after collection, is capped at one action per mitra, and is skippable — the CTA reads "Lewati" until something is offered.',
        'Only mitra with a recommendation are listed. Everyone else is simply absent, rather than shown as an empty row.',
      ],
      flowsTo: [
        { to: 'majelis-proof', label: 'Lanjut / Lewati → langkah 3' },
        { to: 'majelis-visit', label: 'kembali' },
        { to: 'mitra', label: 'ketuk nama mitra' },
      ],
    },
    {
      id: 'majelis-proof',
      title: 'Langkah 3 — Foto & Kirim',
      component: MajelisProofScreen,
      notes: [
        'Step 3 of 3. Photo proof of the majelis, then submit. The photo gates "Selesaikan Tugas" — an unproven visit is not a submitted one, and a disabled button with a reason under it beats accepting the task and failing it at sync.',
        'The recap is the one place this direction shows a summary, and it is earned: submission is irreversible from the BP\'s side, so this is their last chance to catch "I forgot to mark Ibu Ani". It reads back what they entered rather than asking them to interpret a metric.',
        'Unmarked attendance or unpaid mitra raise a warning, not a block — the field decides, not the app. A majelis where three mitra never showed up is a real Tuesday.',
        'Submitting marks the task done and returns to the schedule, which promotes the next task into "Sekarang".',
      ],
      flowsTo: [
        { to: 'today', label: 'Selesaikan Tugas' },
        { to: 'majelis-offers', label: 'kembali' },
      ],
    },
    {
      id: 'home-visit',
      title: 'Home Visit — Temui & Tagih',
      component: HomeVisitScreen,
      notes: [
        'Step 1 of TWO. A home visit happens because a mitra is behind, so the flow is optimised end to end for collection and the cross-sell step was cut — there is nothing to upsell someone two months down.',
        'The doorstep card is one card, not three stacked blocks: who she is, WhatsApp and call buttons, her address, and the pre-reasoned reason line with "Selengkapnya" into her mitra page. A home visit fails most often by not reaching her, and the BP\'s real next move at a locked gate is to phone — which until now meant leaving the app for a number the app already had.',
        'The team\'s flowchart branches hard (met mitra? → met PJ? → met neighbour?, then can-pay? → full/partial → reason → PTP → Peldis). apartner-homepage-ia renders that faithfully as fourteen stacked questions. Here the same tree is asked in two places: the PAGE holds what is simply true on arrival, the SHEET holds what has to be negotiated.',
        'Three collapses do the work. (1) "met mitra / met PJ / met neighbour" is ONE question with three answers — they all ask who the BP talked to. (2) Mitra and PJ share the same outcome controls: whether the money came from her or her husband does not change what is recorded, so it is a tag, not a branch. (3) "Nobody home" cannot produce a payment, so its sheet drops the mode switch and opens straight on the reason and the revisit date.',
        'Peldis is the one offer this flow makes, and it is a collection outcome rather than a pitch: 60+ days down, settle the principal, route to the BM. The app raises it because it already knows she is eligible — the BP should not have to remember a threshold.',
        '"Pindah rumah" is the one reason that asks for more than a label. An address is what turns a relocation into something ops can act on instead of a dead end.',
      ],
      flowsTo: [
        { to: 'home-proof', label: 'Lanjut → langkah 2' },
        { to: 'mitra', label: 'ketuk nama mitra' },
      ],
    },
    {
      id: 'home-proof',
      title: 'Home Visit — Foto & Kirim',
      component: HomeProofScreen,
      notes: [
        'Step 2 of 2. Photo gates submission and the recap reads back what the BP entered — same contract as the majelis close, scaled to one mitra: who was met, what she paid, whether Peldis went in, and is there a promise to come back for.',
        'The only warning is "nothing recorded at all". A recorded "tidak bayar" with a reason and a date is finished work, so nagging about the unpaid balance would just train the BP to ignore the banner.',
        'Submitting finishes the task and returns to the schedule, which promotes the next task into "Sekarang" — the same self-advancing loop the majelis flow closes.',
      ],
      flowsTo: [
        { to: 'today', label: 'Selesaikan Tugas' },
        { to: 'home-visit', label: 'kembali' },
      ],
    },
    {
      id: 'mitra',
      title: 'Halaman Mitra',
      component: MitraScreen,
      notes: [
        'Opened by tapping a mitra\'s name on her card in any visit step — the chevron beside the name is the tell. It is the identity BLOCK, not an added button: a separate control would cost a row on every one of 22 cards, which is the "ribet" failure mode this direction exists to avoid.',
        'This is where the loan and payment history cut from the queue lives. CSAT says that record is among the most-sought data in the app, so the cut was never "BPs don\'t need it" — it was "it does not belong in a collection queue".',
        'The ORDER of the page is the argument. A mitra page is the classic place a task-first app quietly turns back into a dashboard: open a person, get a wall of balances and percentages, leave having read a lot and done nothing. So the page opens on what to DO about her and the record sits underneath, collapsed.',
        'One recommendation, already reasoned, chosen from her state: 30+ days down gets a home visit, a few days down gets a WhatsApp nudge, current-with-an-offer gets the offer. The BP is handed a conclusion, never a number to interpret — the same move the schedule\'s "Sekarang" card makes.',
        'A mitra who is current with nothing to offer shows "Tidak ada tindak lanjut". That is a first-class outcome, not a gap: she should cost the BP no time at all.',
        'Reaching her (WhatsApp, rute) is plumbing, not a recommendation, so it is a quiet list under the one thing that IS recommended — never competing with it.',
        'The record — tagihan & pinjaman, 8 weeks of payments, kehadiran — is three collapsed sections. It exists to answer a follow-up the BP already has ("kenapa dia telat?"), not to brief her on arrival.',
        'Taking a follow-up is recorded, not navigated: the card reads back "Kunjungan dijadwalkan" rather than resetting, so the BP can tell what she already did about this mitra.',
      ],
    },
    {
      id: 'majelis-info',
      title: 'Info Majelis',
      component: MajelisInfoScreen,
      notes: [
        'Opened by the "Info" pill in the visit header. It exists so the VISIT does not have to carry this: step 1\'s job is to record an outcome per mitra, and the moment it also answers "when does this group meet?" and "who is the ketua?", the queue stops being a queue.',
        'Reference material one tap away, behind a control that is clearly not part of the flow — the same move the mitra page makes for a borrower, at group scale.',
        '"Kunjungan hari ini" reads back the visit\'s progress but does not nag. Step 3 is where an incomplete collection gets flagged; two places warning about the same thing trains the BP to ignore both.',
      ],
      flowsTo: [{ to: 'majelis-visit', label: 'kembali' }],
    },
    {
      id: 'majelis-list',
      title: 'Majelis',
      component: MajelisListScreen,
      notes: [
        'The Majelis tab — every group the BP carries, not just today\'s. This is the one thing the schedule genuinely cannot do: "open the app, see the next thing" answers "what now?", but a BP also gets asked "kapan majelis Anggrek?" by a BM, or needs a group whose visit was moved.',
        'It stays a DIRECTORY, not a dashboard: what a group is, when it meets, and the one number worth carrying (how many mitra are behind). No portfolio percentages — those are BM monitoring numbers, and keeping them off the BP\'s surfaces is a standing decision in this direction.',
        'Today\'s groups sort first, so the tab agrees with the schedule rather than competing with it.',
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
        'The four daily targets, and the whole argument for where they live. This direction\'s claim was never "targets don\'t exist" — a BP carries four simultaneous daily targets and is measured on them. The claim is about PLACEMENT: a number on the working surface makes her synthesise before she can move; a number behind a tab is something she checks when she wants to know how the day is going.',
        'Deliberately read-only. There is no "kerjakan sekarang" next to a lagging metric, because that is exactly the KPI-spine model apartner-homepage-ia explores — hang a task off a score and the score becomes how you navigate work.',
        'The page ends by pointing back at the schedule: the targets move because visits get done, not the other way round.',
      ],
      flowsTo: [
        { to: 'today', label: 'tab Jadwal' },
        { to: 'majelis-list', label: 'tab Majelis' },
      ],
    },
  ],
}
