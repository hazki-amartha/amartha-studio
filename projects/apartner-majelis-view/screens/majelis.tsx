'use client'

// Majelis View — the screen the direction is named after.
//
// Reached from the Majelis tab, not from the schedule: a BP sent here by the
// day already knows the group and goes straight into stage 1, while a BP who
// opened the directory is looking something up and this is the answer. The
// "Mulai Pelayanan" button stays, so a look-up can turn into work without
// going back out to the schedule — it just doesn't tick a scheduled task,
// because she was never sent.
//
// It is a ROSTER, not a dashboard and not yet a queue. Before the BP starts the
// pelayanan she wants one thing from this page: who is in this group and what
// state are they in. So every card carries the three facts the reference calls
// for — outstanding loan, DPD bucket, weekly instalment — and nothing carries an
// action except the one button that begins the visit.
//
// Sorting is the only control. It exists because "who is behind?" and "who is
// this group, in order?" are both real questions and neither is a filter: a BP
// scanning for trouble still needs to see everyone, and hiding the current mitra
// would make the count at the top a lie. Default is by arrears, because the
// mitra worth reading about first are the ones who are behind.

import { useState } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { MAJELIS, outstandingOf, rupiah } from '../lib/data'
import { IconChevronDown } from '../lib/icons'
import { DpdBadge, MitraCard } from '../lib/mitra-card'
import { store } from '../lib/store'
import { SectionTitle, StickyBar, VisitTitle } from '../lib/ui'

type Sort = 'tunggakan' | 'nama'

export function MajelisScreen() {
  const flow = useFlow()
  const [sort, setSort] = useState<Sort>('tunggakan')

  const members = [...MAJELIS.members].sort((a, b) =>
    sort === 'nama' ? a.name.localeCompare(b.name) : b.dpd - a.dpd || a.name.localeCompare(b.name),
  )

  const behind = MAJELIS.members.filter((m) => m.dpd > 0).length
  const billable = MAJELIS.members.reduce((sum, m) => sum + outstandingOf(m).total, 0)

  return (
    <Screen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={MAJELIS.name} when={`${MAJELIS.members.length} mitra`} />}
          onBack={() => flow.go('majelis-list')}
        />
      }
    >
      {/* The group's standing facts, before any work has started. Two numbers,
          both of which the BP is asked about by her BM and neither of which she
          should have to add up from the list below. */}
      <div className="flex gap-8">
        <Fact label="Tagihan minggu ini" value={rupiah(billable)} />
        <Fact label="Mitra menunggak" value={`${behind} mitra`} tone={behind > 0 ? 'red' : 'green'} />
      </div>

      <div className="flex items-center gap-8">
        <SectionTitle>Daftar Mitra</SectionTitle>
        <span className="flex-1" />
        {/* A two-state toggle rather than a menu: there are exactly two useful
            orders, and a dropdown for two options is a menu that exists to look
            like a feature. */}
        <button
          type="button"
          onClick={() => setSort(sort === 'tunggakan' ? 'nama' : 'tunggakan')}
          className="flex items-center gap-4 rounded-full border border-default bg-neutral-white px-12 py-4 text-12 font-bold text-default"
        >
          {sort === 'tunggakan' ? 'Tunggakan' : 'Nama'}
          <IconChevronDown size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-8 pb-16">
        {members.map((mitra) => (
          <MitraCard
            key={mitra.id}
            mitra={mitra}
            trailing={<DpdBadge dpd={mitra.dpd} />}
            onOpen={() => {
              store.openMitraPage(mitra.id)
              flow.go('mitra')
            }}
          />
        ))}
      </div>

      <StickyBar>
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            store.startVisit()
            flow.go('attendance')
          }}
        >
          Mulai Pelayanan
        </Button>
      </StickyBar>
    </Screen>
  )
}

function Fact({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'red' | 'green'
}) {
  const valueTone = tone === 'red' ? 'text-red-500' : tone === 'green' ? 'text-green-500' : 'text-default'
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-12 bg-neutral-white p-12">
      <span className="text-12 text-caption">{label}</span>
      <span className={`text-16 font-bold ${valueTone}`}>{value}</span>
    </div>
  )
}
