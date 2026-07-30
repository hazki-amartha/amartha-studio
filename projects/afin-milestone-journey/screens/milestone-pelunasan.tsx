'use client'

// Dedicated tracker for the 26 Jan 2027 milestone — pelunasan dini, which opens
// a fresh loan. Kept on track by the one habit that matters here: paying weekly.

import { useFlow } from '@/platform/runtime'
import { HISTORY } from '../lib/data'
import { MilestoneTracker, healthOf } from '../lib/milestone-tracker'

export function MilestonePelunasanScreen() {
  const flow = useFlow()

  const weeks = HISTORY.length
  const bayar = HISTORY.filter((e) => e.bayar).length

  return (
    <MilestoneTracker
      date="26 Jan 2027"
      weeksLeft="26 minggu lagi"
      emoji="🎯"
      headline="Menuju pelunasan dini"
      caption="Terus jaga hal berikut agar target ini terbuka."
      reward={{
        label: 'Yang Ibu buka',
        value: 'Pinjaman baru',
        sub: 'Lewat pelunasan dini · 26 Jan 2027',
      }}
      tasks={[
        {
          who: 'Ibu Siti',
          habit: 'Lancar bayar angsuran',
          health: healthOf(bayar, weeks),
          onOpen: () => flow.go('riwayat'),
        },
      ]}
      onBack={() => flow.go('progress')}
    />
  )
}
