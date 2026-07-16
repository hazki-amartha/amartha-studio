'use client'

import { useState } from 'react'
import { Badge, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  GROUP_TO_METRIC,
  GROUP_TO_TYPE,
  KPI_PERIODS,
  MAJELIS,
  TONE_BAR,
  TONE_TEXT,
  buildKpi,
  fmt,
  insentifFor,
  rp,
  type KpiGroup,
} from '../lib/data'
import { IconHelp } from '../lib/icons'
import { TabBar } from '../lib/shell'
import { store, useApp } from '../lib/store'
import { FilterBar, FilterChip, OptionSheet, ProgressBar, ResetLink } from '../lib/ui'

type MenuId = 'period' | 'maj' | null

const DAYS_LEFT = 12

export function KpiScreen() {
  const flow = useFlow()
  const s = useApp()
  const [menu, setMenu] = useState<MenuId>(null)

  const majObj = s.kpiMajelis ? (MAJELIS.find((m) => m.n === s.kpiMajelis) ?? null) : null
  const d = buildKpi(s.kpiPeriod, majObj)

  const insentifRp = insentifFor(d.score)
  const insentifStatus = d.tone === 'on' ? 'Tercapai' : d.tone === 'warn' ? 'On track' : 'Tertinggal'

  const periodOpts = KPI_PERIODS.map((p) => ({ l: p, v: p }))
  const majOpts = [
    { l: 'Semua majelis', v: null as string | null },
    ...MAJELIS.map((m) => ({ l: m.n, v: m.n as string | null })),
  ]

  /** KPI → Tugas, carrying this group's KPI type as a pre-applied filter. */
  function goTasks(groupName: string) {
    store.goTasksFrom(groupName, GROUP_TO_TYPE[groupName])
    flow.go('home')
  }

  /** KPI → Majelis, ranked worst-first on this group's metric. */
  function goMajelis(groupName: string) {
    store.goMajelisFrom(groupName, GROUP_TO_METRIC[groupName])
    flow.go('majelis')
  }

  return (
    <Screen topBar={<NavigationHeader title="KPI" hideBack />}>
      <FilterBar>
        <FilterChip label={s.kpiPeriod} active open={menu === 'period'} onClick={() => setMenu('period')} />
        <FilterChip
          label={s.kpiMajelis ?? 'Semua majelis'}
          active={Boolean(s.kpiMajelis)}
          open={menu === 'maj'}
          onClick={() => setMenu('maj')}
        />
        {s.kpiMajelis ? <ResetLink onClick={() => store.set({ kpiMajelis: null })} /> : null}
      </FilterBar>

      {/* Portfolio context — as subtext, not a card */}
      <p className="text-12 text-caption">
        {s.kpiMajelis
          ? `${s.kpiMajelis} · ${d.totalMitra} mitra`
          : `Kamu pegang ${d.totalMajelis} majelis · ${d.totalMitra} mitra`}
      </p>

      {/* Insentif hero — the answer to "why did I open this page" */}
      {!s.kpiMajelis ? (
        <Card className="flex flex-col gap-8">
          <div className="flex items-start gap-8">
            <span className="flex-1 text-12 text-caption">Estimasi insentif bulan ini</span>
            <button
              type="button"
              onClick={() => flow.go('kpi-info')}
              aria-label="Cara perhitungan KPI"
              className="shrink-0 text-disabled"
            >
              <IconHelp size={20} />
            </button>
          </div>
          <div className="flex items-baseline gap-8">
            <span className="text-24 font-bold text-default">{rp(insentifRp)}</span>
            <span className={`text-12 font-bold ${TONE_TEXT[d.tone]}`}>{insentifStatus}</span>
          </div>
          <ProgressBar value={d.score} fill={TONE_BAR[d.tone]} />
          <div className="flex justify-between text-10 text-disabled">
            <span>{d.score}% dari target</span>
            <span>Sisa {DAYS_LEFT} hari</span>
          </div>
        </Card>
      ) : null}

      {/* Metric groups — target-based colours, no cabang comparison */}
      <section className="flex flex-col gap-12 pb-16">
        <h2 className="text-14 font-bold text-default">Kinerja kamu bulan ini</h2>
        {d.groups.map((g) => (
          <KpiGroupCard key={g.n} g={g} onGoTasks={() => goTasks(g.n)} onGoMajelis={() => goMajelis(g.n)} />
        ))}
      </section>

      <TabBar active="kpi" />

      <OptionSheet
        open={menu === 'period'}
        title="Periode"
        name="period"
        options={periodOpts}
        value={s.kpiPeriod}
        onPick={(v) => {
          store.set({ kpiPeriod: v })
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
      <OptionSheet
        open={menu === 'maj'}
        title="Majelis"
        name="kpi-maj"
        options={majOpts}
        value={s.kpiMajelis}
        onPick={(v) => {
          store.set({ kpiMajelis: v })
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
    </Screen>
  )
}

function KpiGroupCard({
  g,
  onGoTasks,
  onGoMajelis,
}: {
  g: KpiGroup
  onGoTasks: () => void
  onGoMajelis: () => void
}) {
  /* Weakest row within the group — drives that group's "kejar" link. */
  const weak = g.rows.filter((r) => r.tone !== 'on').sort((a, b) => a.pct - b.pct)[0]

  return (
    <Card>
      {/* Group header — name, bobot, boost tag */}
      <div className="flex items-center gap-8">
        <h3 className="flex-1 text-10 font-bold uppercase text-disabled">{g.n}</h3>
        <Badge intent="neutral">{g.weight > 0 ? `Bobot ${g.weight}%` : 'Di luar skor'}</Badge>
        {g.boost ? <Badge intent="primary">{g.boost}</Badge> : null}
      </div>

      {/* Parameters */}
      <div className="mt-12 flex flex-col gap-12">
        {g.rows.map((r) => (
          <div key={r.k} className="flex flex-col gap-4">
            <div className="flex items-baseline gap-8">
              <span className="min-w-0 flex-1 text-12 text-neutral-700">{r.n}</span>
              <span className={`text-14 font-bold ${TONE_TEXT[r.tone]}`}>
                {r.unit === 'mitra' ? `${r.val} / ${r.target}` : fmt(r.val, r.unit)}
              </span>
            </div>
            <ProgressBar value={r.pct} fill={TONE_BAR[r.tone]} />
            <div className="flex items-baseline gap-8 text-10 text-disabled">
              <span className="flex-1">
                {r.unit !== 'mitra' ? `Target ${fmt(r.target, r.unit)}` : ''}
              </span>
              {r.w ? <span>Bobot {r.w}%</span> : null}
            </div>
          </div>
        ))}
      </div>

      {/* Footer — chase the weak metric, or drill into majelis */}
      <div className="mt-12 flex items-center gap-12 border-t border-light pt-12">
        <button type="button" onClick={onGoTasks} className="text-12 font-bold text-link">
          {weak ? `Kejar ${weak.n.split(' ').slice(0, 2).join(' ')}` : 'Lihat tugas terkait'}
        </button>
        <span className="h-12 w-2 bg-neutral-200" />
        <button type="button" onClick={onGoMajelis} className="text-12 font-bold text-link">
          Lihat per majelis
        </button>
      </div>
    </Card>
  )
}
