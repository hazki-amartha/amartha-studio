'use client'

import { useState } from 'react'
import { Badge, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  MAJELIS,
  METRIC,
  MITRA,
  TONE_TEXT,
  mitraOf,
  rp,
  type LoanType,
  type Majelis,
  type MetricKey,
  type Tone,
} from '../lib/data'
import { IconChevR, IconUsers } from '../lib/icons'
import { TabBar } from '../lib/shell'
import { store, useApp } from '../lib/store'
import { EmptyState, FilterBar, FilterChip, IconTile, OptionSheet, ResetLink, SearchField } from '../lib/ui'

type MenuId = 'sort' | 'loan' | null

const LOAN_OPTS: { l: string; v: LoanType | null }[] = [
  { l: 'Semua tipe', v: null },
  { l: 'Group loan', v: 'Group loan' },
  { l: 'Modal', v: 'Modal' },
  { l: 'Hybrid', v: 'Hybrid' },
]

const SORT_OPTS: { l: string; v: string | null }[] = [
  { l: 'Default', v: null },
  ...(Object.keys(METRIC) as MetricKey[]).flatMap((k) => [
    { l: `${METRIC[k].l} terendah`, v: `${k}:asc` },
    { l: `${METRIC[k].l} tertinggi`, v: `${k}:desc` },
  ]),
]

const healthTone = (rep: number): Tone => (rep >= 90 ? 'on' : rep >= 75 ? 'warn' : 'off')
const healthLabel = (rep: number) => (rep >= 90 ? 'Sehat' : rep >= 75 ? 'Perhatian' : 'Kritis')
const attTone = (att: number): Tone => (att >= 80 ? 'on' : att >= 70 ? 'warn' : 'off')

export function MajelisScreen() {
  const flow = useFlow()
  const s = useApp()
  const [q, setQ] = useState('')
  const [menu, setMenu] = useState<MenuId>(null)

  const qq = q.trim().toLowerCase()
  const { majSort: sort, majLoan } = s

  let groups = MAJELIS.filter((g) => {
    const majHit = !qq || g.n.toLowerCase().includes(qq) || g.area.toLowerCase().includes(qq)
    const mitraHit = qq ? mitraOf(g.n).some((m) => m.n.toLowerCase().includes(qq)) : false
    return majHit || mitraHit
  })

  if (majLoan) groups = groups.filter((g) => g.loan === majLoan)

  if (sort) {
    const get = METRIC[sort.m].get
    groups = [...groups].sort((a, b) => (sort.dir === 'asc' ? get(a) - get(b) : get(b) - get(a)))
  }

  const hasFilter = Boolean(sort || majLoan)
  const sortValue = sort ? `${sort.m}:${sort.dir}` : null
  const sortLabel = sort
    ? `${METRIC[sort.m].l} ${sort.dir === 'asc' ? 'terendah' : 'tertinggi'}`
    : 'Urutkan'

  function pickSort(v: string | null) {
    if (!v) {
      store.set({ majSort: null })
      return
    }
    const [m, dir] = v.split(':')
    store.set({ majSort: { m: m as MetricKey, dir: dir as 'asc' | 'desc' } })
  }

  function open(g: Majelis) {
    store.set({ selMajelis: g.n })
    flow.go('majelis-detail')
  }

  return (
    <Screen topBar={<NavigationHeader title="Majelis" hideBack />}>
      <SearchField
        value={q}
        onChange={setQ}
        placeholder="Cari majelis, desa, atau nama mitra"
        aria-label="Cari majelis"
      />

      <FilterBar>
        <FilterChip
          label={sortLabel}
          active={Boolean(sort)}
          open={menu === 'sort'}
          onClick={() => setMenu('sort')}
        />
        <FilterChip
          label={majLoan ?? 'Tipe pinjaman'}
          active={Boolean(majLoan)}
          open={menu === 'loan'}
          onClick={() => setMenu('loan')}
        />
        {hasFilter ? <ResetLink onClick={() => store.resetMajelisFilters()} /> : null}
      </FilterBar>

      <p className="text-12 text-caption">
        {qq || hasFilter
          ? `${groups.length} dari ${MAJELIS.length} majelis`
          : `${MAJELIS.length} majelis · ${MITRA.length} mitra`}
      </p>

      {groups.length === 0 ? (
        <EmptyState title="Tidak ada hasil" body="Coba kata kunci lain." />
      ) : (
        <ul className="flex flex-col gap-12">
          {groups.map((g, i) => (
            <li key={g.n}>
              <MajelisCard g={g} rank={sort ? i + 1 : null} sortedBy={sort?.m ?? null} onOpen={() => open(g)} />
            </li>
          ))}
        </ul>
      )}

      <TabBar active="majelis" />

      <OptionSheet
        open={menu === 'sort'}
        title="Urutkan"
        name="sort"
        options={SORT_OPTS}
        value={sortValue}
        onPick={(v) => {
          pickSort(v)
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
      <OptionSheet
        open={menu === 'loan'}
        title="Tipe pinjaman"
        name="loan"
        options={LOAN_OPTS}
        value={majLoan as LoanType | null}
        onPick={(v) => {
          store.set({ majLoan: v })
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
    </Screen>
  )
}

function MajelisCard({
  g,
  rank,
  sortedBy,
  onOpen,
}: {
  g: Majelis
  rank: number | null
  sortedBy: MetricKey | null
  onOpen: () => void
}) {
  const ht = healthTone(g.rep)

  /* The metric being sorted on gets promoted to a highlighted stat. */
  const stats: { k: MetricKey; l: string; v: string; c: string }[] = [
    { k: 'rep', l: 'Repayment', v: `${g.rep}%`, c: TONE_TEXT[ht] },
    { k: 'att', l: 'Attendance', v: `${g.att}%`, c: TONE_TEXT[attTone(g.att)] },
    ...(sortedBy === 'disb'
      ? [{ k: 'disb' as const, l: 'Disbursement', v: rp(g.disb), c: 'text-default' }]
      : []),
    ...(sortedBy === 'acq'
      ? [{ k: 'acq' as const, l: 'Akuisisi', v: `${g.acq} mitra`, c: 'text-default' }]
      : []),
    ...(sortedBy === 'celengan'
      ? [
          {
            k: 'celengan' as const,
            l: 'Celengan',
            v: `${METRIC.celengan.get(g)}%`,
            c: 'text-default',
          },
        ]
      : []),
  ]

  return (
    <Card className="w-full text-left" onClick={onOpen} role="button" tabIndex={0}>
      <div className="flex items-center gap-8">
        {rank ? <span className="w-16 shrink-0 text-10 font-bold text-caption">{rank}</span> : null}
        <IconTile tone="primary">
          <IconUsers size={20} />
        </IconTile>
        <p className="min-w-0 flex-1 truncate text-14 font-bold text-default">{g.n}</p>
        <Badge intent={ht === 'on' ? 'green' : ht === 'warn' ? 'orange' : 'red'}>
          {healthLabel(g.rep)}
        </Badge>
        <span className="shrink-0 text-placeholder">
          <IconChevR size={20} />
        </span>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <Badge intent="neutral">{g.cnt} mitra</Badge>
        <Badge intent="neutral">{g.loan}</Badge>
        <Badge intent="neutral">{g.day}</Badge>
      </div>

      <div className="mt-12 flex flex-wrap gap-12">
        {stats.map((st) => {
          const on = sortedBy === st.k
          return (
            <span
              key={st.k}
              className={`flex items-center gap-4 rounded-full text-10 ${
                on ? 'bg-primary-50 px-8 py-2' : ''
              }`}
            >
              <span className={on ? 'font-bold text-default' : 'text-caption'}>{st.l}</span>
              <span className={`font-bold ${st.c}`}>{st.v}</span>
            </span>
          )
        })}
      </div>
    </Card>
  )
}
