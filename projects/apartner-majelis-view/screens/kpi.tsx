'use client'

// KPI — the seven monthly parameters and what each one is worth.
//
// The metrics and the layout are ported from `apartner-homepage-ia` so the two
// directions are judged on the same scoreboard rather than on two different
// inventions of what a BP is measured on. Seven parameters, each with a flat
// rupiah bonus; the hero states how many are met and splits the incentive into
// what has been earned and what is still on the table, because the money is the
// reason this tab gets opened.
//
// What this direction does NOT copy is the tap-through. In homepage-ia a lagging
// parameter is a way to navigate into the tasks that would fix it — that is that
// direction's whole thesis. Here the schedule owns the work, so the page stays
// read-only: hang a task off a score and the score becomes the way you navigate,
// which is the model this direction is arguing against.

import { useState } from 'react'
import { BottomSheet, Button, Card, SelectableCard } from '@/design-system/components'
import { Screen, TopBar } from '@/platform/primitives'
import { rupiah } from '../lib/data'
import { KPI_DAYS_LEFT, KPI_PERIODS, buildKpi, type KpiRow } from '../lib/kpi'
import { IconCheck, IconChevronDown } from '../lib/icons'
import { TabBar } from '../lib/tabs'
import { Meter, SectionTitle } from '../lib/ui'

export function KpiScreen() {
  const [period, setPeriod] = useState(KPI_PERIODS[0])
  const [picking, setPicking] = useState(false)

  const d = buildKpi(period)

  return (
    <Screen
      topBar={
        <TopBar>
          <span className="flex-1">KPI</span>
        </TopBar>
      }
    >
      {/* The period is a filter, not a tab: three months is a list that grows, and
          the BP spends nearly all her time in the current one. */}
      <div className="flex">
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="flex items-center gap-4 rounded-full border border-default bg-neutral-white px-12 py-8 text-12 font-bold text-default"
        >
          {period}
          <IconChevronDown size={16} />
        </button>
      </div>

      <p className="text-12 text-caption">
        Kamu pegang {d.totalMajelis} majelis · {d.totalMitra} mitra
      </p>

      {/* Hero — target progress leads; the incentive is shown as reward earned
          plus what is still up for grabs, which is the framing that makes the
          seven rows below worth reading. */}
      <Card>
        <p className="text-12 text-caption">Progres target bulan ini</p>
        <div className="mt-2 flex items-baseline gap-8">
          <span className="text-24 font-bold text-default">
            {d.metCount} dari {d.totalParams}
          </span>
          <span className="text-12 text-disabled">target tercapai</span>
        </div>
        <div className="mt-8">
          <Meter progress={(d.metCount / d.totalParams) * 100} />
        </div>

        <div className="mt-12 flex gap-8">
          <div className="flex-1 rounded-8 bg-green-50 px-8 py-8">
            <p className="text-10 text-caption">Insentif diraih</p>
            <p className="mt-2 text-14 font-bold text-green-600">{rupiah(d.earned)}</p>
          </div>
          <div className="flex-1 rounded-8 bg-primary-50 px-8 py-8">
            <p className="text-10 text-caption">Masih bisa diraih</p>
            <p className="mt-2 text-14 font-bold text-primary-600">
              {rupiah(d.maxBonus - d.earned)}
            </p>
          </div>
        </div>

        <p className="mt-8 text-right text-10 text-disabled">Sisa {KPI_DAYS_LEFT} hari</p>
      </Card>

      <section className="flex flex-col gap-8 pb-16">
        <div>
          <SectionTitle>Target &amp; insentif</SectionTitle>
          <p className="mt-4 text-12 text-caption">Capai tiap target untuk raih insentifnya.</p>
        </div>
        {d.rows.map((r) => (
          <KpiRowCard key={r.k} r={r} />
        ))}
      </section>

      <TabBar active="kpi" />

      <BottomSheet
        open={picking}
        onClose={() => setPicking(false)}
        title="Periode"
        secondaryAction={
          <Button className="w-full" variant="ghost" onClick={() => setPicking(false)}>
            Tutup
          </Button>
        }
      >
        <div className="flex flex-col gap-8">
          {KPI_PERIODS.map((p) => (
            <SelectableCard
              key={p}
              name="kpi-period"
              inputType="radio"
              title={p}
              checked={period === p}
              onChange={() => {
                setPeriod(p)
                setPicking(false)
              }}
            />
          ))}
        </div>
      </BottomSheet>
    </Screen>
  )
}

function KpiRowCard({ r }: { r: KpiRow }) {
  const label = r.baseLabel || 'mitra'
  const pct = Math.min(100, Math.max(0, Math.round((r.count / r.targetCount) * 100)))
  const gap = r.lower ? r.count - r.targetCount : r.targetCount - r.count

  // The gap stated in mitra, tied to the rupiah it unlocks. A percentage on its
  // own tells the BP she is behind; this tells her by how many women and what
  // closing it is worth.
  const motiv = r.met
    ? `${rupiah(r.bonus)} berhasil diraih`
    : r.lower
      ? `Turunkan ${gap} mitra lagi untuk raih ${rupiah(r.bonus)}`
      : `Kurang ${gap} mitra lagi untuk raih ${rupiah(r.bonus)}`

  return (
    <div className="overflow-hidden rounded-12 border border-default bg-neutral-white">
      <div className="px-12 py-12">
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

        <div className="mt-8 flex items-baseline gap-4">
          <span className="text-24 font-bold text-default">{r.count}</span>
          <span className="text-14 text-caption">{label}</span>
        </div>

        <div className="mt-12">
          <Meter progress={pct} tone={r.met ? 'green' : r.lower ? 'red' : 'orange'} />
        </div>
      </div>

      <div
        className={`border-t px-12 py-8 ${r.met ? 'border-green-50 bg-green-50 text-green-600' : 'border-primary-200 bg-primary-50 text-primary-600'}`}
      >
        <span className="text-12 font-bold">{motiv}</span>
      </div>
    </div>
  )
}
