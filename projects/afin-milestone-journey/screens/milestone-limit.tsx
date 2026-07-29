'use client'

// Dedicated tracker for the 23 Mar 2027 milestone — the big one, a higher credit
// limit. It rides on the whole majelis, not just her, so it carries three
// habits: her weekly payment, her attendance, and the majelis paying on time.

import { useFlow } from '@/platform/runtime'
import { HISTORY, MEMBERS } from '../lib/data'
import { MilestoneTracker, healthOf } from '../lib/milestone-tracker'

export function MilestoneLimitScreen() {
  const flow = useFlow()

  const weeks = HISTORY.length
  const bayar = HISTORY.filter((e) => e.bayar).length
  const hadir = HISTORY.filter((e) => e.kumpulan).length
  const members = MEMBERS.length
  const membersBayar = MEMBERS.filter((m) => m.bayar).length

  return (
    <MilestoneTracker
      date="23 Mar 2027"
      weeksLeft="34 minggu lagi"
      emoji="🏆"
      headline="Menuju limit baru"
      caption="Terus jaga hal berikut agar target terbesar ini terbuka."
      reward={{
        label: 'Naik limit kredit hingga',
        value: 'Rp8jt',
        sub: 'Target 23 Mar 2027',
      }}
      tasks={[
        {
          title: 'Bayar angsuran tiap minggu',
          health: healthOf(bayar, weeks),
          onOpen: () => flow.go('riwayat'),
        },
        {
          title: 'Datang kumpulan tiap minggu',
          health: healthOf(hadir, weeks),
          onOpen: () => flow.go('riwayat'),
        },
        {
          title: 'Teman-teman majelis lancar membayar',
          health: healthOf(membersBayar, members),
          onOpen: () => flow.go('majelis'),
        },
      ]}
      onBack={() => flow.go('progress')}
    />
  )
}
