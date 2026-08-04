'use client'

// Dedicated tracker for the 23 Mar 2027 milestone — the big one, a higher credit
// limit. It rides on the whole majelis, not just her, so it carries three
// habits: her weekly payment, her attendance, and the majelis paying on time.

import { useFlow } from '@/platform/runtime'
import { HISTORY } from '../lib/data'
import { members, useApp } from '../lib/store'
import { MilestoneTracker, healthOf } from '../lib/milestone-tracker'

export function MilestoneLimitScreen() {
  const flow = useFlow()

  const weeks = HISTORY.length
  const bayar = HISTORY.filter((e) => e.bayar).length
  const hadir = HISTORY.filter((e) => e.kumpulan).length
  const roster = members(useApp())
  const memberCount = roster.length
  const membersBayar = roster.filter((m) => m.bayar).length

  return (
    <MilestoneTracker
      date="23 Mar 2027"
      weeksLeft="34 minggu lagi"
      emoji="🏆"
      headline="Menuju limit baru"
      caption="Terus jaga hal berikut agar target terbesar ini terbuka."
      reward={{
        label: 'Peluang naik limit kredit',
        value: 's/d Rp8jt',
        sub: 'Target 23 Mar 2027',
      }}
      tasks={[
        {
          who: 'Ibu Siti',
          habit: 'Lancar bayar angsuran',
          health: healthOf(bayar, weeks),
          onOpen: () => flow.go('riwayat'),
        },
        {
          who: 'Ibu Siti',
          habit: 'Rutin datang kumpulan',
          health: healthOf(hadir, weeks),
          onOpen: () => flow.go('riwayat'),
        },
        {
          who: 'Majelis Melati 07',
          habit: 'Lancar bayar angsuran',
          health: healthOf(membersBayar, memberCount),
          onOpen: () => flow.go('majelis'),
        },
      ]}
      onBack={() => flow.go('progress')}
    />
  )
}
