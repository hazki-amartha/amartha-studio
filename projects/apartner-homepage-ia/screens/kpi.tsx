'use client'

import { useState } from 'react'
import { Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { KPI_PERIODS, PARAM_TO_TYPE, buildKpi, rp, type KpiRow } from '../lib/data'
import { IconChevR } from '../lib/icons'
import { TabBar } from '../lib/shell'
import { store } from '../lib/store'
import { FilterBar, FilterChip, OptionSheet, ProgressBar } from '../lib/ui'

const DAYS_LEFT = 12

export function KpiScreen() {
  const flow = useFlow()
  const [period, setPeriod] = useState(KPI_PERIODS[0])
  const [menuOpen, setMenuOpen] = useState(false)

  const d = buildKpi(period)
  const periodOpts = KPI_PERIODS.map((p) => ({ l: p, v: p }))

  function goTasks(paramKey: string) {
    store.goTasksFrom(paramKey, PARAM_TO_TYPE[paramKey])
    flow.go('home')
  }

  return (
    <Screen topBar={<NavigationHeader title="KPI" hideBack />}>
      <FilterBar>
        <FilterChip label={period} active open={menuOpen} onClick={() => setMenuOpen(true)} />
      </FilterBar>

      <p className="text-12 text-caption">
        Kamu pegang {d.totalMajelis} majelis · {d.totalMitra} mitra
      </p>

      {/* Insentif hero — earned Rp out of the maximum */}
      <Card>
        <p className="text-12 text-caption">Insentif bulan ini</p>
        <div className="mt-2 flex items-baseline gap-8">
          <span className="text-24 font-bold text-default">{rp(d.earned)}</span>
          <span className="text-12 text-disabled">/ {rp(d.maxBonus)}</span>
        </div>
        <div className="mt-10">
          <ProgressBar value={(d.earned / d.maxBonus) * 100} />
        </div>
        <div className="mt-6 flex justify-between text-10 text-disabled">
          <span>
            {d.metCount} dari {d.totalParams} target tercapai
          </span>
          <span>Sisa {DAYS_LEFT} hari</span>
        </div>
      </Card>

      <section className="flex flex-col gap-10 pb-16">
        <h2 className="text-14 font-bold text-default">Rincian per parameter</h2>
        {d.rows.map((r) => (
          <KpiRowCard key={r.k} r={r} onGoTasks={() => goTasks(r.k)} />
        ))}
      </section>

      <TabBar active="kpi" />

      <OptionSheet
        open={menuOpen}
        title="Periode"
        name="period"
        options={periodOpts}
        value={period}
        onPick={(v) => {
          setPeriod(v)
          setMenuOpen(false)
        }}
        onClose={() => setMenuOpen(false)}
      />
    </Screen>
  )
}

function KpiRowCard({ r, onGoTasks }: { r: KpiRow; onGoTasks: () => void }) {
  const pct = Math.min(100, Math.max(0, Math.round((r.count / r.targetCount) * 100)))
  const barFill = r.met ? 'bg-green-500' : r.lower ? 'bg-red-500' : 'bg-orange-500'

  return (
    <div className={`flex overflow-hidden rounded-12 border border-default bg-neutral-white`}>
      <span className={`w-4 shrink-0 ${r.met ? 'bg-green-500' : 'bg-neutral-200'}`} />
      <div className="min-w-0 flex-1 px-14 py-11">
        <div className="flex items-baseline gap-10">
          <span className={`min-w-0 flex-1 text-14 font-bold ${r.met ? 'text-default' : 'text-disabled'}`}>{r.n}</span>
          <span className={`shrink-0 text-14 font-bold ${r.met ? 'text-green-600' : 'text-placeholder'}`}>{rp(r.bonus)}</span>
        </div>
        <div className="mt-8">
          <div className="h-5 overflow-hidden rounded-full bg-neutral-100">
            <div className={`h-full rounded-full ${barFill}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="mt-6 flex items-center gap-8">
          <span className={`min-w-0 flex-1 text-12 ${r.met ? 'text-caption' : 'text-disabled'}`}>
            <b className={r.met ? 'text-green-600' : 'text-red-500'}>{r.count}</b>
            <span> ({r.lower ? 'maks' : 'min'} {r.targetCount} mitra)</span>
          </span>
          <button type="button" onClick={onGoTasks} className="flex shrink-0 items-center gap-2 text-12 font-bold text-link">
            Tugas <IconChevR size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
