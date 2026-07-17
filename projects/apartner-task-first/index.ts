// Project module — exports config + the screens array.

import type { ProjectModule } from '@/platform/types'
import { config } from './project.config'
import { TodayScreen } from './screens/today'
import { MajelisVisitScreen } from './screens/majelis-visit'
import { MajelisOffersScreen } from './screens/majelis-offers'
import { MajelisProofScreen } from './screens/majelis-proof'
import { HomeVisitScreen } from './screens/home-visit'
import { HomeOfferScreen } from './screens/home-offer'
import { HomeProofScreen } from './screens/home-proof'

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
      ],
    },
    {
      id: 'majelis-visit',
      title: 'Langkah 1 — Kehadiran & Pembayaran',
      component: MajelisVisitScreen,
      notes: [
        'Step 1 of 3. The visit is a sequence, so it is three pages rather than one long screen: collect, then offer, then prove and submit. The StepBar shows position; steps advance by being finished, never by tapping the bar.',
        'The queue drains on RECORDED, not on paid. The step\'s job is to record an outcome for every mitra — not to make everyone lunas — so the split is "Belum dicatat / Sudah dicatat" and a card leaves the queue once it has an outcome of any kind.',
        'That fixed a real bug: grouped on lunas, a mitra recorded as "tidak bayar" was finished but sat in the queue forever, so the count could never reach zero — and the old "Sudah lunas" copy claimed she had paid when she plainly had not.',
        'Everything on the card sits on a 32px rhythm — avatar, both attendance circles, both buttons — so the two rows read as clean bands. FunDS button sizes step 28 (xs) → 36 (sm), so neither lands on 32; the buttons carry h-32 to pin them. See NOTES.md.',
        'Attendance is two circular icon buttons (✗/✓) in the identity row — at 22 cards the words "Hadir"/"Tidak" would repeat 44 times for a question whose answer is a shape. Unselected is a real third state, so there is no default: a default would fabricate attendance data.',
        'Payment is two buttons. "Lunas" is the common case at one tap and no sheet. "Catatan" is the one door to every other outcome: the sheet opens on a mode switch — bayar sebagian (any amount, over or under) or tidak bayar (reason + janji bayar).',
        '"Tidak Bayar" as a first-class outcome is the point: a no with a reason and a date is a result the BP can close and ops can chase. Leaving it unrecorded is exactly what pushes DPD work onto the RM\'s Google Form.',
        'Recorded mitra collapse into "Sudah dicatat", each row carrying its outcome and an "Ubah" that reopens the sheet that produced it — so leaving the queue never traps an entry.',
      ],
      flowsTo: [{ to: 'majelis-offers', label: 'Lanjut → langkah 2' }],
    },
    {
      id: 'majelis-offers',
      title: 'Langkah 2 — Tugas Tambahan',
      component: MajelisOffersScreen,
      notes: [
        'Step 2 of 3. The same mitra list, rendered by the same MitraCard as step 1 — only the action row is swapped for the recommended action. The sameness does work: the BP reads the same faces in the same layout, so the only new thing is the recommendation.',
        'Cross-sell is nice-to-have, so the SEQUENCE carries the priority rather than the visual weight: this step comes after collection, is capped at one action per mitra, and is skippable — the CTA reads "Lewati" until something is offered.',
        'Only mitra with a recommendation are listed. Everyone else is simply absent, rather than shown as an empty row.',
      ],
      flowsTo: [
        { to: 'majelis-proof', label: 'Lanjut / Lewati → langkah 3' },
        { to: 'majelis-visit', label: 'kembali' },
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
        'Step 1 of 3, and the single-mitra twin of majelis step 1. A home visit is one borrower at her door, so where a majelis opens on a countdown queue this opens on the "why now": the address and the pre-reasoned reason line lifted straight from the schedule.',
        'The card is the same MitraCard, the payment sheet is the same sheet, the 32px rhythm is the same — deliberately. A BP who has done a majelis already knows this screen; only the roster size changed.',
        'Attendance is reread as "Ditemui / Tidak di rumah" — on a doorstep the first fact is whether you reached her at all. "Not home" is a real outcome, logged through Catatan as a no with reason "Tidak ada di rumah" and a date to come back, never left as a blank.',
        '"Tidak Bayar" carries a reason and a promise/revisit date, exactly as in the majelis flow — the point of a collection visit is to close the loop that otherwise falls to a Google Form.',
      ],
      flowsTo: [{ to: 'home-offer', label: 'Lanjut → langkah 2' }],
    },
    {
      id: 'home-offer',
      title: 'Home Visit — Tugas Tambahan',
      component: HomeOfferScreen,
      notes: [
        'Step 2 of 3. The same offers step, for the one mitra. For a delinquent the honest "extra task" is relief, not growth — a longer tenor rather than a new loan — so it reads as part of the collection conversation instead of a bolt-on pitch.',
        'Still skippable and self-closing: "Tawarkan" records what she said, not that she was asked. A mitra with nothing to offer (Sari, keeping today\'s promise) lands on the empty state, which is a first-class outcome, not a gap.',
      ],
      flowsTo: [
        { to: 'home-proof', label: 'Lanjut / Lewati → langkah 3' },
        { to: 'home-visit', label: 'kembali' },
      ],
    },
    {
      id: 'home-proof',
      title: 'Home Visit — Foto & Kirim',
      component: HomeProofScreen,
      notes: [
        'Step 3 of 3. Photo gates submission and the recap reads back what the BP entered — same contract as the majelis close, scaled to one mitra: was she met, what did she pay, is there a promise to come back for.',
        'The only warning is "nothing recorded at all". A recorded "tidak bayar" with a reason and a date is finished work, so nagging about the unpaid balance would just train the BP to ignore the banner.',
        'Submitting finishes the task and returns to the schedule, which promotes the next task into "Sekarang" — the same self-advancing loop the majelis flow closes.',
      ],
      flowsTo: [
        { to: 'today', label: 'Selesaikan Tugas' },
        { to: 'home-offer', label: 'kembali' },
      ],
    },
  ],
}
