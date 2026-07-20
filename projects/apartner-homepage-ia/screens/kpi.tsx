'use client'

import { useState } from 'react'
import { Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { KPI_PERIODS, PARAM_TO_TYPE, buildKpi, rp, type KpiRow } from '../lib/data'
import { IconCheck, IconChevR } from '../lib/icons'
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

      {/* Hero — target progress leads; incentive shown as reward earned + still on the table */}
      <Card>
        <p className="text-12 text-caption">Progres target bulan ini</p>
        <div className="mt-2 flex items-baseline gap-8">
          <span className="text-24 font-bold text-default">
            {d.metCount} dari {d.totalParams}
          </span>
          <span className="text-12 text-disabled">target tercapai</span>
        </div>
        <div className="mt-10">
          <ProgressBar value={(d.metCount / d.totalParams) * 100} />
        </div>

        {/* Incentive as the reward: earned so far + what's still up for grabs */}
        <div className="mt-12 flex gap-8">
          <div className="flex-1 rounded-8 bg-green-50 px-10 py-8">
            <p className="text-10 text-caption">Insentif diraih</p>
            <p className="mt-2 text-14 font-bold text-green-600">{rp(d.earned)}</p>
          </div>
          <div className="flex-1 rounded-8 bg-primary-50 px-10 py-8">
            <p className="text-10 text-caption">Masih bisa diraih</p>
            <p className="mt-2 text-14 font-bold text-primary-600">{rp(d.maxBonus - d.earned)}</p>
          </div>
        </div>

        <p className="mt-8 text-right text-10 text-disabled">Sisa {DAYS_LEFT} hari</p>
      </Card>

      <section className="flex flex-col gap-10 pb-16">
        <div>
          <h2 className="text-14 font-bold text-default">Target & insentif</h2>
          <p className="mt-4 text-12 text-caption">Capai tiap target untuk raih insentifnya.</p>
        </div>
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
  const label = r.baseLabel || 'mitra'
  const pct = Math.min(100, Math.max(0, Math.round((r.count / r.targetCount) * 100)))
  const barFill = r.met ? 'bg-green-500' : r.lower ? 'bg-red-500' : 'bg-orange-500'
  const gap = r.lower ? r.count - r.targetCount : r.targetCount - r.count

  // Incentive framed as motivation: connect the remaining gap to the reward.
  const motiv = r.met
    ? `${rp(r.bonus)} berhasil diraih`
    : r.lower
      ? `Turunkan ${gap} mitra lagi untuk raih ${rp(r.bonus)}`
      : `Kurang ${gap} mitra lagi untuk raih ${rp(r.bonus)}`
  const motivClasses = r.met ? 'bg-green-50 border-green-50 text-green-600' : 'bg-primary-50 border-primary-100 text-primary-600'

  return (
    <button type="button" onClick={onGoTasks} className="overflow-hidden rounded-12 border border-default bg-neutral-white text-left">
      <div className="px-14 py-13">
        <div className="flex items-center gap-8">
          <span className="min-w-0 flex-1 text-14 font-bold text-default">{r.n}</span>
          {r.met ? (
            <span className="flex shrink-0 items-center gap-2 text-10 font-bold text-green-600">
              <IconCheck size={16} />
              Tercapai
            </span>
          ) : (
            <span className="shrink-0 text-10 font-bold text-disabled">{pct}%</span>
          )}
        </div>

        <p className="mt-2 text-12 text-caption">
          Target: {r.lower ? 'maks' : 'min'} {r.targetCount} {label}
        </p>

        <div className="mt-10 flex items-baseline gap-6">
          <span className="text-24 font-bold text-default">{r.count}</span>
          <span className="text-14 text-caption">{label}</span>
        </div>

        <div className="mt-12 h-8 overflow-hidden rounded-full bg-neutral-100">
          <div className={`h-full rounded-full ${barFill}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className={`flex items-center gap-8 border-t px-14 py-10 ${motivClasses}`}>
        <span className="min-w-0 flex-1 text-12 font-bold">{motiv}</span>
        <span className="flex shrink-0 items-center gap-2 text-10 font-bold text-link">
          Tugas <IconChevR size={16} />
        </span>
      </div>
    </button>
  )
}
