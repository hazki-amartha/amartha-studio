'use client'

// KPI — the seven monthly parameters and what each one is worth.
//
// The metrics are ported from `apartner-homepage-ia` so the two directions are
// judged on the same scoreboard rather than on two inventions of what a BP is
// measured on. Seven parameters.
//
// The page carries TWO models of the same seven parameters, on one toggle in
// the header:
//
//   • Classic (default) — each parameter carries its own flat rupiah bonus, and
//     the tab totals what has been banked against what is still on the table.
//   • Tier — each parameter carries a % WEIGHT instead (the seven sum to 100),
//     the weights roll up into one overall completion, and a single bonus hangs
//     off that number at three tiers (50% → Rp500rb, 75% → Rp1,5jt, 100% → Rp2jt).
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
// What survives as small print is the target itself ("dibawah 11 mitra"),
// because a BP does get asked what the threshold is. Everything else went.
//
// There is no period picker: a BP lives in the running month, and last month's
// score is settled — nothing on it is work she can still do. So the page is
// always "bulan ini", and the deadline rides on the overline.
//
// What this direction still does NOT copy from the reference is the "Tugas ›"
// deep link on each lagging row. In homepage-ia a lagging parameter is the way
// into the tasks that would fix it — that is that direction's whole thesis.
// Here the schedule owns the work, so the page stays read-only: hang a task off
// a score and the score becomes how you navigate, which is the model this
// direction exists to argue against.

import { useState } from 'react'
import { Badge, Card, Toggle } from '@/design-system/components'
import { Screen, TopBar } from '@/platform/primitives'
import { ringkas, rupiah } from '../lib/data'
import { KPI_DAYS_LEFT, KPI_PERIODS, KPI_TIERS, buildKpi, type KpiRow } from '../lib/kpi'
import { IconCheck } from '../lib/icons'
import { TabBar } from '../lib/tabs'
import { Meter, SectionTitle } from '../lib/ui'

export function KpiScreen() {
  const [tiered, setTiered] = useState(false)

  // Always the running month — see the file note on why there is no picker.
  const d = buildKpi(KPI_PERIODS[0])

  return (
    <Screen
      topBar={
        <TopBar>
          <span className="flex-1">KPI</span>
          {/* The one control on the page: swap the whole scoreboard between the
              per-parameter rupiah model and the weighted-tier model. */}
          <Toggle
            label="Alt version"
            checked={tiered}
            onChange={(e) => setTiered(e.target.checked)}
          />
        </TopBar>
      }
    >
      <p className="text-12 text-caption">
        Kamu pegang {d.totalMajelis} majelis · {d.totalMitra} mitra
      </p>

      {tiered ? <TieredBody d={d} /> : <ClassicBody d={d} />}

      <TabBar active="kpi" />
    </Screen>
  )
}

// --- Classic: a flat rupiah per parameter ----------------------------------

function ClassicBody({ d }: { d: ReturnType<typeof buildKpi> }) {
  const allMet = d.metCount === d.totalParams

  return (
    <>
      {/* Hero — one sentence of work remaining, then the money. The deadline
          rides on the overline rather than taking a line of its own: it
          qualifies "bulan ini" and is not a fifth figure to read. */}
      <Card>
        <p className="text-12 text-caption">Bulan ini · sisa {KPI_DAYS_LEFT} hari</p>
        <p className={`mt-2 text-24 font-bold ${allMet ? 'text-green-600' : 'text-default'}`}>
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
          <ClassicRowCard key={r.k} r={r} />
        ))}
      </section>
    </>
  )
}

function ClassicRowCard({ r }: { r: KpiRow }) {
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
        Target: {r.lower ? 'dibawah' : 'diatas'} {r.targetCount} {label}
      </p>
    </div>
  )
}

// --- Tier: one weighted score, three bonus tiers ---------------------------

function TieredBody({ d }: { d: ReturnType<typeof buildKpi> }) {
  const allTiers = d.nextTier == null

  return (
    <>
      {/* Hero — the money the current score already pays, then the score that
          earned it, then the ladder it sits on. Rupiah leads because it is why
          she opens the tab; the percentage is what she can move. */}
      <Card>
        <p className="text-12 text-caption">Bonus bulan ini · sisa {KPI_DAYS_LEFT} hari</p>
        <p
          className={`mt-2 text-24 font-bold ${d.currentTier ? 'text-green-600' : 'text-default'}`}
        >
          {d.currentTier ? rupiah(d.currentTier.bonus) : 'Belum ada bonus'}
        </p>
        <p className="mt-2 text-12 text-caption">{d.completion}% dari target tercapai</p>

        <TierTrack completion={d.completion} />

        <p className="mt-8 border-t border-default pt-12 text-12 text-caption">
          {allTiers
            ? 'Semua tier bonus tercapai 🎉'
            : `Tambah ${d.nextTier!.at - d.completion}% lagi untuk ${rupiah(d.nextTier!.bonus)}`}
        </p>
      </Card>

      <section className="flex flex-col gap-8 pb-16">
        <SectionTitle>Bobot KPI</SectionTitle>
        {d.rows.map((r) => (
          <WeightRowCard key={r.k} r={r} />
        ))}
      </section>
    </>
  )
}

// The bonus ladder as a horizontal rail: a fill up to the current score, with a
// dot at each tier threshold carrying its bonus above and its % below. A dot
// turns solid and ticks once the fill has passed it, so the whole "how far, how
// much banked, how much left" reads in one glance without a second chart.
function TierTrack({ completion }: { completion: number }) {
  const clamped = Math.max(0, Math.min(100, completion))
  return (
    // Generous vertical padding leaves room for the labels above and below the
    // rail; the horizontal px keeps the 100% dot's labels off the card edge.
    <div className="mt-12 px-8 pb-32 pt-32">
      <div className="relative h-8 rounded-full bg-neutral-200">
        {/* A data-driven width is the one dimension the rail cannot take from a
            token — the value IS the geometry. */}
        <div className="h-8 rounded-full bg-primary-500" style={{ width: `${clamped}%` }} />

        {KPI_TIERS.map((t) => {
          const reached = clamped >= t.at
          return (
            <div
              key={t.at}
              className="absolute top-1/2"
              style={{ left: `${t.at}%`, transform: 'translate(-50%, -50%)' }}
            >
              <span
                className={`flex h-20 w-20 items-center justify-center rounded-full border-2 border-neutral-white ${
                  reached ? 'bg-primary-500 text-neutral-white' : 'bg-neutral-300 text-transparent'
                }`}
              >
                {reached ? <IconCheck size={16} /> : null}
              </span>
              <span
                className={`absolute bottom-full left-1/2 mb-8 -translate-x-1/2 whitespace-nowrap text-10 font-bold ${
                  reached ? 'text-primary-600' : 'text-caption'
                }`}
              >
                {ringkas(t.bonus)}
              </span>
              <span className="absolute top-full left-1/2 mt-8 -translate-x-1/2 text-10 text-caption">
                {t.at}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeightRowCard({ r }: { r: KpiRow }) {
  const label = r.baseLabel || 'mitra'
  const gap = r.lower ? r.count - r.targetCount : r.targetCount - r.count

  const action = r.met
    ? 'Target tercapai'
    : r.lower
      ? `Kurangi ${gap} mitra lagi`
      : `Tambah ${gap} mitra lagi`

  return (
    <div className="rounded-12 border border-default bg-neutral-white p-12">
      <div className="flex items-center gap-8">
        <span className="min-w-0 flex-1 text-12 font-bold text-default">{r.n}</span>
        {/* The parameter's share of the whole score — the pill the rupiah used
            to occupy. Green with a tick once it is fully banked. */}
        {r.met ? (
          <Badge intent="green" size="sm" leadingIcon={<IconCheck size={16} />}>
            {r.weight}%
          </Badge>
        ) : (
          <Badge intent="neutral" size="sm">
            {r.weight}%
          </Badge>
        )}
      </div>

      <p className={`mt-4 text-18 font-bold ${r.met ? 'text-green-600' : 'text-default'}`}>
        {action}
      </p>

      <div className="mt-12">
        <Meter progress={r.progress} tone={r.met ? 'green' : r.lower ? 'red' : 'orange'} />
      </div>

      <p className="mt-8 text-10 text-disabled">
        Target: {r.lower ? 'dibawah' : 'diatas'} {r.targetCount} {label}
      </p>
    </div>
  )
}
