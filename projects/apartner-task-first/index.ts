// Project module — exports config + the screens array.

import type { ProjectModule } from '@/platform/types'
import { config } from './project.config'
import { TodayScreen } from './screens/today'
import { MajelisVisitScreen } from './screens/majelis-visit'

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
      title: 'Kunjungan Majelis',
      component: MajelisVisitScreen,
      notes: [
        'A queue that drains, not a dashboard. One number at the top — how many mitra still owe, and how much. It is a countdown to zero, not a metric: the page is finished when it empties.',
        'A visit records exactly two things per mitra, so each card carries exactly those two controls: kehadiran (Hadir/Tidak, one tap, with "not yet marked" as a real third state) and pembayaran.',
        'Payment is an amount, not a flag — partial payment is a normal field outcome. "Terima" opens a sheet prefilled with the full instalment: paying in full is two taps, paying part costs one edit.',
        'A mitra leaves the queue only once lunas. A partial payment keeps them in the list showing "Kurang Rp X" — an unfinished row is more honest than a green tick. Lunas mitra collapse into a count.',
        'Cross-sell is a tail, not a step: offers only list mitra who are already lunas, stay collapsed, are capped at one per mitra, and are labelled "opsional" so they never compete with collection.',
        'Cut on purpose: portfolio percentages, the weekly collection target, and per-mitra loan history. History is not deleted — it moves to a mitra page, which lands together with the Home Visit page. See NOTES.md.',
      ],
      flowsTo: [{ to: 'today', label: 'Selesaikan Kunjungan / kembali' }],
    },
  ],
}
