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
        'A queue that drains, not a dashboard. One number at the top — how many mitra still owe, and how much. It is a countdown to zero: the step is finished when it empties.',
        'Each card is one glance and at most two taps: the action row is a single row — kehadiran (Hadir/Tidak, with "not yet marked" as a real third state) on the left, "Terima Pembayaran" on the right.',
        'Payment is an amount, not a flag — partial payment is a normal field outcome. The sheet opens prefilled with the full instalment: paying in full is two taps, paying part costs one edit.',
        'A mitra leaves the queue only once lunas. A partial payer keeps their card, with the button showing what is still short ("Kurang Rp 100.000") — an unfinished row is more honest than a green tick.',
        'Cut on purpose: portfolio percentages, the weekly collection target, and per-mitra loan history. History is not deleted — it moves to a mitra page, which lands together with the Home Visit page. See NOTES.md.',
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
