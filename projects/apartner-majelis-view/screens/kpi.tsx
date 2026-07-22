'use client'

// KPI — the seven monthly parameters and what each one is worth.
//
// The metrics are ported from `apartner-homepage-ia` so the two directions are
// judged on the same scoreboard rather than on two inventions of what a BP is
// measured on. Seven parameters, each carrying a flat rupiah bonus.
//
// EVERY CARD ANSWERS ONE QUESTION: how many more women.
//
// The page used to print four numbers per parameter — a percentage, a target
// count, the current count, and a rupiah line — and the BP had to subtract two
// of them to learn the only thing she can act on. So the subtraction is done
// for her and the result IS the headline: "Kurangi 3 mitra lagi", "Tambah 3
// mitra lagi", "Target tercapai". The current count is gone entirely; it was
// only ever an input to a sum, and a number that exists to be subtracted from
// another number is a number the app should be holding, not the BP.
//
// What survives as small print is the target itself ("maks. 11 mitra"), because
// a BP does get asked what the threshold is. What survives as a pill is the
// bonus, because it is what makes the gap worth closing. Everything else went.
//
// Same edit in the hero: "3 dari 7 tercapai" became "Penuhi 4 target lagi" —
// the same fact, already phrased as work remaining rather than a score.
//
// What this direction still does NOT copy from the reference is the "Tugas ›"
// deep link on each lagging row. In homepage-ia a lagging parameter is the way
// into the tasks that would fix it — that is that direction's whole thesis.
// Here the schedule owns the work, so the page stays read-only: hang a task off
// a score and the score becomes how you navigate, which is the model this
// direction exists to argue against.

import { useState } from 'react'
import { Badge, BottomSheet, Button, Card, SelectableCard } from '@/design-system/components'
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
  const allMet = d.metCount === d.totalParams

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

      {/* Hero — one sentence of work remaining, then the money. The deadline
          rides on the overline rather than taking a line of its own: it
          qualifies "bulan ini" and is not a fifth figure to read. */}
      <Card>
        <p className="text-12 text-caption">Bulan ini · sisa {KPI_DAYS_LEFT} hari</p>
        <p
          className={`mt-2 text-24 font-bold ${allMet ? 'text-green-600' : 'text-default'}`}
        >
          {allMet ? 'Semua target tercapai' : `Penuhi ${d.totalParams - d.metCount} target lagi`}
        </p>
        <div className="mt-8">
          <Meter progress={(d.metCount / d.totalParams) * 100} tone={allMet ? 'green' : 'primary'} />
        </div>

        {/* Banked against still on the table. Two figures, no tinted boxes —
            the hero's job is the sentence above, and a pair of coloured chips
            competes with it for the same glance. */}
        <div className="mt-8 flex items-start justify-between gap-12 border-t border-default pt-12">
          <div className="min-w-0">
            <p className="text-10 text-caption">Capaian sekarang</p>
            <p className="mt-2 text-14 font-bold text-green-600">{rupiah(d.earned)}</p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-10 text-caption">Bisa diraih lagi</p>
            <p className="mt-2 text-14 font-bold text-primary-600">
              {rupiah(d.maxBonus - d.earned)}
            </p>
          </div>
        </div>
      </Card>

      <section className="flex flex-col gap-8 pb-16">
        <SectionTitle>List KPI</SectionTitle>
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

  // The headline, and the only number on the card the BP has to do anything
  // with. "Kurangi" for the DPD buckets, where the target is a ceiling and the
  // work is moving women OUT; "Tambah" everywhere else.
  const action = r.met
    ? 'Target tercapai'
    : r.lower
      ? `Kurangi ${gap} mitra lagi`
      : `Tambah ${gap} mitra lagi`

  return (
    <div className="rounded-12 border border-default bg-neutral-white p-12">
      <div className="flex items-center gap-8">
        <span className="min-w-0 flex-1 text-12 font-bold text-default">{r.n}</span>
        {/* What closing the gap is worth, banked or not. It stays a pill on the
            same line as the parameter name so the money never competes with the
            headline underneath it. */}
        {r.met ? (
          <Badge intent="green" size="sm" leadingIcon={<IconCheck size={16} />}>
            {rupiah(r.bonus)}
          </Badge>
        ) : (
          <Badge intent="primary" size="sm" dot>
            {rupiah(r.bonus)}
          </Badge>
        )}
      </div>

      <p className={`mt-4 text-18 font-bold ${r.met ? 'text-green-600' : 'text-default'}`}>
        {action}
      </p>

      <div className="mt-12">
        <Meter progress={pct} tone={r.met ? 'green' : r.lower ? 'red' : 'orange'} />
      </div>

      {/* Small print, and deliberately the only surviving raw figure: a BP does
          get asked what the threshold is, and nobody can recite seven of them. */}
      <p className="mt-8 text-10 text-disabled">
        Target: {r.lower ? 'maks.' : 'min.'} {r.targetCount} {label}
      </p>
    </div>
  )
}
