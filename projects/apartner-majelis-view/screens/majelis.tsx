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
// state are they in. Each card is down to the two facts that answer that —
// tunggakan and DPD — and nothing carries an action except the one button that
// begins the visit. The loan and the weekly instalment used to sit here too;
// they were four numbers per card on a page read 22 cards at a time, and they
// are still one tap away where they are actually quoted.
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
import { IconCalendar, IconChevronDown, IconPin } from '../lib/icons'
import { DpdBadge, MitraCard } from '../lib/mitra-card'
import { openMajelisEntry, store, useApp } from '../lib/store'
import { SectionTitle, StickyBar, VisitTitle } from '../lib/ui'

type Sort = 'tunggakan' | 'nama'

export function MajelisScreen() {
  const flow = useFlow()
  const s = useApp()
  const group = openMajelisEntry(s)
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
          title={<VisitTitle title={group.name} when={`${MAJELIS.members.length} mitra`} />}
          onBack={() => flow.go('majelis-list')}
        />
      }
    >
      {/* Where the group meets, and when. Both belong at the top of the page
          rather than in the nav bar: a BP who reached this roster from the
          directory is looking a group UP, and "kapan majelis ini?" / "di mana?"
          are the two questions that route asks most. */}
      <div className="flex flex-col gap-8 rounded-12 bg-neutral-white p-12">
        <div className="flex items-start gap-8 text-12 text-default">
          <span className="shrink-0 text-caption">
            <IconPin size={16} />
          </span>
          <span className="min-w-0 flex-1">{group.place}</span>
        </div>
        <div className="flex items-start gap-8 text-12 text-default">
          <span className="shrink-0 text-caption">
            <IconCalendar size={16} />
          </span>
          <span className="min-w-0 flex-1">
            Kumpulan {group.day}, {group.time}
          </span>
        </div>
      </div>

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
            // Two facts per card, not four. The roster is scanned, not read:
            // what she owes and how late she is are the pair that decides who
            // the BP looks at first, and the contract behind them (pinjaman,
            // angsuran) is one tap away on her page.
            meta={
              <span className="truncate text-12 text-caption">
                Tunggakan {rupiah(outstandingOf(mitra).total)}
              </span>
            }
            trailing={<DpdBadge dpd={mitra.dpd} format="short" />}
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
            // No task id: this route didn't come from the schedule. Submitting
            // still ticks the day's row for this group — the work is the same
            // work, and only the way in differed.
            store.startVisit(s.openMajelis)
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
