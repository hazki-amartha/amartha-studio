// Project module — exports config + the screens array.

import type { ProjectModule } from '@/platform/types'
import { config } from './project.config'
import { TodayScreen } from './screens/today'
import { MajelisVisitScreen } from './screens/majelis-visit'
import { MajelisOffersScreen } from './screens/majelis-offers'
import { MajelisProofScreen } from './screens/majelis-proof'

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
        'Later tasks are a timeline to read, not a list to pick from: no buttons, no chevrons. Finished tasks collapse into a count. This is the deliberate opposite of a homepage full of filters.',
        'Completing a visit promotes the next task into "Sekarang" — the schedule advances by itself, so the BP never chooses what to do next.',
        'Home Visit tasks appear on the timeline but have no page yet, so their button is disabled when they reach "Sekarang". That page is the next thing to build.',
      ],
      flowsTo: [{ to: 'majelis-visit', label: 'Mulai Kunjungan (tugas majelis)' }],
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
  ],
}
