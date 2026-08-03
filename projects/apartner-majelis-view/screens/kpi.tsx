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
import { KPI_DAYS_LEFT, KPI_TIERS, buildKpi, type KpiRow } from '../lib/kpi'
import { IconCheck } from '../lib/icons'
import { TabBar } from '../lib/tabs'
import { useApp } from '../lib/store'
import { Meter, SectionTitle } from '../lib/ui'

export function KpiScreen() {
  const [tiered, setTiered] = useState(false)

  // Always the running month — see the file note on why there is no picker.
  // The store holds which month only so the demo controls can reach the
  // conditions a happy-path tap-through never gets to; the BP never sets it.
  const { kpiPeriod } = useApp()
  const d = buildKpi(kpiPeriod)

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
            competes with it for the same glance.

            Rp0 is never green. Green on this page means banked, and a green
            zero is the page congratulating her on nothing. */}
        <div className="mt-8 flex items-start justify-between gap-12 border-t border-default pt-12">
          <div className="min-w-0">
            <p className="text-10 text-caption">Capaian sekarang</p>
            <p
              className={`mt-2 text-14 font-bold ${
                d.earned > 0 ? 'text-green-600' : 'text-caption'
              }`}
            >
              {rupiah(d.earned)}
            </p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-10 text-caption">Bisa diraih lagi</p>
            <p className="mt-2 text-14 font-bold text-primary-600">
              {rupiah(d.maxBonus - d.earned)}
            </p>
          </div>
        </div>

        {/* The gate, stated at the top where the money is. Collection failing
            does not cost her one row — it costs her every growth row she has
            already won, so the figure above is smaller than her work and she
            deserves to be told why before she goes hunting for the missing
            rupiah in the list.

            "Tertahan", not "dianulir", while the month is still running: the
            money is behind a condition she can still clear, and a word that
            reads as final is how you make a BP with 12 days left stop trying.
            It only becomes annulled when the month closes on it. */}
        {d.annulledTotal > 0 ? (
          <div className="mt-12 rounded-8 bg-red-50 p-12">
            <p className="text-12 font-bold text-red-600">
              {rupiah(d.annulledTotal)} tertahan
            </p>
            <p className="mt-2 text-12 text-red-600">
              {d.earned === 0
                ? 'Semua target yang sudah kamu capai ada di pencairan dan cross-sell, dan itu belum bisa cair selama target penagihan belum tercapai.'
                : 'Target penagihan belum tercapai, jadi insentif pencairan dan cross-sell belum bisa cair.'}{' '}
              Penuhi semua target DPD untuk membukanya.
            </p>
          </div>
        ) : null}

        {/* The other zero — nothing met, nothing held — gets NO extra line. The
            card already says it three times over: "Penuhi 7 target lagi", the
            days left on the overline, and the full Rp2,5jt still on the table.
            What separates the two zeros is the held banner above, and its
            ABSENCE is the signal here. */}
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

/**
 * Where the TARGET sits on every row's rail — the fixed landmark the scale is
 * built around, leaving a quarter of the track beyond it for overshoot. The min
 * lands just short of it, at whatever ratio that row's two numbers give (170
 * against 180 on DPD 0 puts it at 75.6%).
 *
 * Anchoring on the target rather than on a per-row ceiling is what keeps the
 * seven cards readable as a list: a landmark that moved from 80% on one card to
 * 7% on the next is a landmark nobody learns.
 */
const TARGET_MARK = 80

/**
 * A value's position on the rail, 0–100. Both directions put the target on
 * TARGET_MARK, so one notch means one thing all the way down the list.
 *
 *   higher-is-better — position is the plain ratio to target.
 *   lower-is-better  — the good direction is DOWN, so the ratio inverts. Going
 *     further BELOW the ceiling moves her further RIGHT, which is the whole
 *     point: "beyond the threshold" has to travel the same way on every row.
 */
const railPos = (value: number, target: number, lower?: boolean) =>
  Math.max(0, Math.min(100, (lower ? target / Math.max(value, 0.01) : value / target) * TARGET_MARK))

function ClassicRowCard({ r }: { r: KpiRow }) {
  const label = r.baseLabel || 'mitra'
  const gap = r.lower ? r.count - r.targetCount : r.targetCount - r.count

  const pct = railPos(r.val, r.target, r.lower)
  const minMark = railPos(r.min, r.target, r.lower)

  // The only number on the card the BP has to do anything with. "Kurangi" for
  // the DPD buckets, where the target is a ceiling and the work is moving women
  // OUT; "Tambah" everywhere else.
  //
  // A met row states where she actually STANDS, not just that she cleared the
  // bar: "tercapai" alone leaves her guessing whether she is one mitra past the
  // threshold or forty, which is the difference between a target she has to
  // keep defending and one she can stop watching.
  const action = r.met
    ? `Target tercapai · ${r.count} ${label}`
    : r.lower
      ? `Kurangi ${gap} mitra lagi`
      : `Tambah ${gap} mitra lagi`

  return (
    <div className="rounded-12 border border-default bg-neutral-white p-12">
      <div className="flex items-center gap-8">
        <span className="min-w-0 flex-1 text-14 font-bold text-default">{r.n}</span>
        {/* What closing the gap is worth, banked or not. It stays a pill on the
            same line as the parameter name so the money never competes with the
            headline underneath it.

            "Insentif" carries the whole point: a bare figure beside a target
            reads as a fact about the row, not as something she GETS for closing
            the gap. One word in the pill says it without spending a line under
            the action. */}
        {r.annulled ? (
          // Met, but paying nothing. It must not wear the green tick — that is
          // the one signal on the page that means "banked" — so it drops to a
          // neutral pill with the amount struck through: the work counted, the
          // money did not.
          <Badge intent="neutral" size="sm">
            <span className="line-through">Insentif {rupiah(r.bonus)}</span>
          </Badge>
        ) : r.met ? (
          <Badge intent="green" size="sm" leadingIcon={<IconCheck size={16} />}>
            Insentif {rupiah(r.bonus)}
          </Badge>
        ) : (
          <Badge intent="primary" size="sm" dot>
            Insentif {rupiah(r.bonus)}
          </Badge>
        )}
      </div>

      {/* Where she stands, directly under the name — the one line on the card
          she has to act on, so it takes the position the eye lands on first.
          The target it is measured against sits below the rail. */}
      <p
        className={`mt-4 text-16 font-bold ${
          r.annulled ? 'text-caption' : r.met ? 'text-green-600' : 'text-default'
        }`}
      >
        {action}
      </p>

      {/* Why a met row paid nothing. Without this the card is just wrong: a
          tick, a full meter, and no money. The reason names the parameter she
          has to fix, because that is the only thing that unlocks it. It stays
          pinned to the verdict it qualifies. */}
      {r.annulled ? (
        <p className="mt-2 text-12 text-red-600">
          Insentif tertahan — target penagihan belum tercapai
        </p>
      ) : null}

      <div className="mt-12">
        <Meter
          progress={pct}
          tone={r.annulled ? 'muted' : r.incentivised ? 'green' : r.lower ? 'red' : 'orange'}
          threshold={minMark}
        />
        {/* The gate needs naming once, or the notch is a decorative tick. The
            labels split ON it — "min" ends where the mark is, "insentif" begins
            in the stretch it applies to — so the words sit over the geometry
            they describe. The target is not labelled here: it is spelled out in
            full on the line below, and two numbers under a 320px rail four
            percent apart is two numbers nobody can read. */}
        <p className="mt-4 flex text-10 text-caption">
          <span className="pr-4 text-right" style={{ width: `${minMark}%` }}>
            min {r.minCount}
          </span>
          {/* Pinned to the far edge, not left-hugging the notch: the label names
              the whole stretch from the mark to the end of the rail, so sitting
              at its far end is what says "everything from here on". */}
          <span className="flex-1 pl-4 text-right">insentif</span>
        </p>
      </div>

      {/* The threshold, as the footnote it is: the raw figure a BP does get
          asked for, under the rail that plots it. */}
      <p className="mt-8 text-12 text-caption">
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
    ? `Target tercapai · ${r.count} ${label}`
    : r.lower
      ? `Kurangi ${gap} mitra lagi`
      : `Tambah ${gap} mitra lagi`

  return (
    <div className="rounded-12 border border-default bg-neutral-white p-12">
      <div className="flex items-center gap-8">
        <span className="min-w-0 flex-1 text-14 font-bold text-default">{r.n}</span>
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

      <p className={`mt-4 text-16 font-bold ${r.met ? 'text-green-600' : 'text-default'}`}>
        {action}
      </p>

      <div className="mt-12">
        <Meter progress={r.progress} tone={r.met ? 'green' : r.lower ? 'red' : 'orange'} />
      </div>

      <p className="mt-8 text-12 text-caption">
        Target: {r.lower ? 'dibawah' : 'diatas'} {r.targetCount} {label}
      </p>
    </div>
  )
}
