'use client'

// Dedicated tracker for the 26 Jan 2027 milestone — pelunasan dini, which opens
// a fresh loan on a higher limit whose disbursement clears the loan she is still
// paying. Because that new limit rides on the whole majelis, not just her, the
// still-ahead view carries the same three habits as the limit rise.
//
// Once reached it turns into a success page: the reward card breaks the deal
// down (a payoff plus a new disbursement) and the habits give way to the reasons
// she earned it — the same shape the pencairan milestones open when they unlock.

import { useFlow } from '@/platform/runtime'
import { HISTORY, MILESTONE_SETS } from '../lib/data'
import { members, store, useApp } from '../lib/store'
import { MilestoneTracker, healthOf } from '../lib/milestone-tracker'

const REACHED_REASONS = [
  'Hadir kumpulan majelis setiap minggu',
  'Bayar angsuran tepat waktu setiap minggu',
  'Menabung rutin di Celengan',
  'Pakai Poket untuk transaksi',
]

export function MilestonePelunasanScreen() {
  const flow = useFlow()
  const s = useApp()

  const weeks = HISTORY.length
  const bayar = HISTORY.filter((e) => e.bayar).length
  const hadir = HISTORY.filter((e) => e.kumpulan).length
  const roster = members(s)
  const memberCount = roster.length
  const membersBayar = roster.filter((m) => m.bayar).length

  // Once the pelunasan rung is reached and still awaiting its action, the page
  // becomes a success/claim page. Before that it stays a tracker of the habits
  // that earn it.
  const reached = MILESTONE_SETS[s.journeyPhase].some(
    (m) => m.detail === 'milestone-pelunasan' && m.cta === 'Mulai',
  )

  if (reached) {
    return (
      <MilestoneTracker
        date="26 Jan 2027"
        weeksLeft="26 minggu lagi"
        emoji="🎯"
        headline="Menuju pelunasan dini"
        caption="Lunasi sisa pinjaman lama dan mulai pinjaman baru."
        reward={{
          items: [
            { label: 'Lunasi sisa pinjaman lama', value: 'Rp1.250.000' },
            {
              label: 'Cairkan pinjaman baru',
              value: 'Rp2.500.000',
              sub: '- Rp7.000.000',
            },
          ],
        }}
        reasons={REACHED_REASONS}
        onBack={() => flow.go('progress')}
        action={{
          label: 'Mulai pelunasan dini',
          onAction: () => {
            store.startDisburse(7000000, 2500000)
            flow.go('disburse-amount')
          },
          secondaryLabel: 'Nanti saja',
          onSecondary: () => flow.go('progress'),
        }}
      />
    )
  }

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
