'use client'

// Dedicated tracker for the 6 Okt 2026 milestone — the next pencairan and the
// one habit that keeps it on track. Every milestone has its own page like this;
// the shared shape lives in lib/milestone-tracker.

import { useFlow } from '@/platform/runtime'
import { HISTORY, MILESTONE_AMOUNT, rupiah } from '../lib/data'
import { MilestoneTracker, healthOf } from '../lib/milestone-tracker'

export function MilestoneProgressScreen() {
  const flow = useFlow()

  const weeks = HISTORY.length
  const bayar = HISTORY.filter((e) => e.bayar).length

  return (
    <MilestoneTracker
      date="6 Okt 2026"
      weeksLeft="10 minggu lagi"
      emoji="🎯"
      headline="Sedikit lagi, Ibu tetap on track!"
      caption="Terus jaga hal berikut agar target Ibu terbuka."
      reward={{
        label: 'Modal yang bisa dicairkan',
        value: `+${rupiah(MILESTONE_AMOUNT)}`,
        sub: 'Cair di 6 Okt 2026',
      }}
      tasks={[
        {
          title: 'Bayar angsuran tiap minggu',
          health: healthOf(bayar, weeks),
          onOpen: () => flow.go('riwayat'),
        },
      ]}
      onBack={() => flow.go('progress')}
    />
  )
}
