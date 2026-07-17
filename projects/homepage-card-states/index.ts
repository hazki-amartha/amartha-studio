// Project module — exports config + the screens array.
// Each screen is one lifecycle STATE of the same card stack, not a page. The
// flow view is therefore the state machine, and the edges are the transitions.

import type { ProjectModule } from '@/platform/types'
import { config } from './project.config'
import { OnTrackScreen } from './screens/ontrack'
import { SettledScreen } from './screens/settled'
import { LateScreen } from './screens/late'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'ontrack',
      title: 'On-track',
      component: OnTrackScreen,
      entry: true,
      notes: [
        'The baseline state, and the one the new direction is designed against: motivational purple headline plus a circular arrow affordance on every card.',
        'Card 2 collapses the top-up projection behind the "dari Total Limit" disclosure — tap the chevron. The bet is that leading with one number beats showing the whole ladder.',
        'Card 3 rolls the three ring meters up into a single current → potential gauge; the thumb marks the projected Rp 6,5 jt. The rings survive underneath as the drivers, not the headline.',
        '"Bayar Sekarang" jumps to Lunas — it stands in for paying the final angsuran.',
      ],
      flowsTo: [{ to: 'settled', label: 'bayar angsuran terakhir' }],
    },
    {
      id: 'settled',
      title: 'Lunas',
      component: SettledScreen,
      notes: [
        'Loan cleared. Card 1 drops the weekly angsuran entirely — there is nothing to pay — and its CTA becomes "Ajukan Pinjaman", promoted to filled primary.',
        'Card 2 tints primary-50 and shows the full Rp 7 jt plafon with a filled CTA: this is the one state where disbursement is the loudest thing on the screen.',
        'Card 3 is unchanged — limit growth is assessed on a period, not on whether a loan is running.',
        'The original draft put a 🎉 in the headline and a 👍 in the footer. Both are dropped: the design system bans emoji (foundations/colors.md).',
      ],
      flowsTo: [{ to: 'ontrack', label: 'ajukan pinjaman baru' }],
    },
    {
      id: 'late',
      title: 'Late',
      component: LateScreen,
      notes: [
        'Card 1 turns alert: red headline, a tinted red-50 notice, and the pay CTA promoted to filled primary.',
        'Card 2 mutes to a neutral-50 shell — no "Dana Siap" pitch to someone who is behind. Card 3 is removed from the screen entirely.',
        'The whole state carries one message: get current. It is the sharpest test of the new direction, because a motivational purple headline is exactly wrong here — hence the red tone override.',
        'Reached from the flow view rather than by a tap: falling behind is time passing, not a user action, so there is deliberately no inbound edge.',
      ],
      flowsTo: [{ to: 'ontrack', label: 'tunggakan dibayar' }],
    },
  ],
}
