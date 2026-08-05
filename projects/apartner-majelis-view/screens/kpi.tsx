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
import { Badge, Card } from '@/design-system/components'
import { TopBar } from '@/platform/primitives'
import { ringkas, rupiah } from '../lib/data'
import { KPI_BANDS, KPI_DAYS_LEFT, buildKpi, type KpiRow } from '../lib/kpi'
import { IconCheck } from '../lib/icons'
import { TabBar } from '../lib/tabs'
import { useApp } from '../lib/store'
import { AppScreen, Meter, SectionTitle } from '../lib/ui'

/**
 * A: the per-parameter rupiah model. B1/B2: the weighted-score model, which
 * pays the same way in both — they differ only in how a MET row states where
 * she stands (a mitra count in B1, a normalised achievement/target ratio in
 * B2). Three, not a boolean, because B1 and B2 are both live questions this
 * concept is arguing, not a display preference on top of one answer.
 */
type KpiVersion = 'A' | 'B1' | 'B2'
const KPI_VERSIONS: KpiVersion[] = ['A', 'B1', 'B2']

/**
 * The one condition every version closes on. Shared rather than typed out
 * three times: it is the same rule in all three, so it has to read the same
 * in all three — and a sentence copied per version is one that drifts the
 * first time anyone edits a single copy of it.
 */
const KPI_GATE_NOTE = 'Mitra DPD 0 harus tercapai untuk mendapatkan insentif'

export function KpiScreen() {
  const [version, setVersion] = useState<KpiVersion>('A')

  // Always the running month — see the file note on why there is no picker.
  // The store holds which month only so the demo controls can reach the
  // conditions a happy-path tap-through never gets to; the BP never sets it.
  const { kpiPeriod } = useApp()
  const d = buildKpi(kpiPeriod)

  return (
    <AppScreen
      topBar={
        <TopBar>
          <span className="flex-1">KPI</span>
          {/* The one control on the page: swap the whole scoreboard between the
              per-parameter rupiah model and the two readings of the
              weighted-score model. */}
          <div className="flex items-center gap-2 rounded-full border border-default bg-canvas-blue p-2">
            {KPI_VERSIONS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVersion(v)}
                aria-pressed={version === v}
                className={`rounded-full px-12 py-4 text-12 font-bold ${
                  version === v ? 'bg-primary-500 text-neutral-white' : 'text-caption'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </TopBar>
      }
    >
      <p className="text-12 text-caption">
        Kamu pegang {d.totalMajelis} majelis · {d.totalMitra} mitra
      </p>

      {version === 'A' ? (
        <ClassicBody d={d} />
      ) : version === 'B1' ? (
        <ScoredBody d={d} />
      ) : (
        <ScoredBodyB2 d={d} />
      )}

      <TabBar active="kpi" />
    </AppScreen>
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
        {/* The standing condition rides INSIDE the banner when money is
            actually being held — the rule and the consequence of breaking it
            are one thought, and splitting them across a divider made the
            reader match them up themselves. With nothing held there is no
            banner, so it stands on its own instead.

            The other zero — nothing met, nothing held — still gets no extra
            line: the card already says it three times over, and what
            separates the two zeros is this banner's ABSENCE. */}
        {d.annulledTotal > 0 ? (
          <div className="mt-12 rounded-8 bg-red-50 p-12">
            <p className="text-12 font-bold text-red-600">
              {rupiah(d.annulledTotal)} tertahan
            </p>
            {/* The explanation came off — the gate note below says the same
                thing in one line, and the paragraph was a third telling of a
                rule the amount above already makes felt. */}
            <p className="mt-2 text-12 text-red-600">{KPI_GATE_NOTE}</p>
          </div>
        ) : (
          <p className="mt-8 border-t border-default pt-12 text-12 text-caption">
            {KPI_GATE_NOTE}
          </p>
        )}
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

  // Earning the incentive fills the bar. The rail anchors the target at
  // TARGET_MARK to leave room for overshoot, which meant a row that had won
  // its money still drew four-fifths full — a progress bar that stops short
  // of the end reads as work outstanding, and there is none.
  const pct = r.incentivised ? 100 : railPos(r.val, r.target, r.lower)

  // The only number on the card the BP has to do anything with. "Kurangi" for
  // the DPD buckets, where the target is a ceiling and the work is moving women
  // OUT; "Tambah" everywhere else.
  //
  // A met row states where she actually STANDS, not just that she cleared the
  // bar: "tercapai" alone leaves her guessing whether she is one mitra past the
  // threshold or forty — mitra, not a normalised ratio: this is the version
  // that stays in the units she works in. The X/100 reading lives in B2.
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
          threshold={TARGET_MARK}
        />
        {/* The notch is the TARGET, and "insentif" names the stretch past it —
            the two labels split ON the mark, so the words sit over the
            geometry they describe. The notch used to sit on the min with
            "insentif" beside it, which read as though clearing the min
            already paid. The min is not drawn here at all: it lands four
            percent from the target on a ~320px rail, and two marks that close
            together are two marks nobody can tell apart. It is spelled out in
            words on the line below instead. */}
        <p className="mt-4 flex text-10 text-caption">
          <span className="pr-4 text-right" style={{ width: `${TARGET_MARK}%` }}>
            target {r.targetCount}
          </span>
          {/* Pinned to the far edge — "insentif" names the whole stretch from
              the notch to the end of the rail, so sitting at its far end is
              what says "everything from here on". */}
          <span className="flex-1 pl-4 text-right">insentif</span>
        </p>
      </div>

      {/* Both thresholds, in words, because only one of them is drawable on
          the rail (see the note above) and a BP does get asked what each is.
          Stated in the order they bite: the floor she has to hold, then the
          bar the money starts above. */}
      <p className="mt-8 text-14 text-default">
        Minimum {r.minCount} {label} · insentif {r.lower ? 'dibawah' : 'diatas'} {r.targetCount}{' '}
        {label}
      </p>
    </div>
  )
}

// --- Version B1: one weighted score, a band, and two modifiers -------------

function ScoredBody({ d }: { d: ReturnType<typeof buildKpi> }) {
  const b = d.scored

  return (
    <>
      {/* Hero — what she takes home, then the score that produced it. The
          rupiah leads because it is why she opens the tab; the percentage is
          the thing she can still move. */}
      <Card>
        <p className="text-12 text-caption">Insentif bulan ini · sisa {KPI_DAYS_LEFT} hari</p>
        <p
          className={`mt-2 text-24 font-bold ${
            b.total > 0 ? 'text-green-600' : b.boomTriggered ? 'text-red-600' : 'text-caption'
          }`}
        >
          {rupiah(b.total)}
        </p>
        {/* The band name came off: the rail below already draws which band
            she is in, and naming it here restated the same fact in words
            she then had to reconcile against the picture. */}
        <p className="mt-2 text-12 text-caption">Total skor {b.score}</p>

        <ScoreTrackB2 score={b.score} />

        {/* The one condition under the score, stated flat: the running
            commentary that used to live here — how far to the next band, the
            boom line, the boost top-up — was three different sentences the
            figure above already accounts for. */}
        <p className="mt-8 border-t border-default pt-12 text-12 text-caption">
          {KPI_GATE_NOTE}
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

// B1 draws its rail with ScoreTrackB2 — the two versions disagree about how
// a ROW states its progress, not about how the score bar looks, and giving
// each its own bar made the same two bands read as two different scales.

function WeightRowCard({ r }: { r: KpiRow }) {
  const label = r.baseLabel || 'mitra'
  const gap = r.lower ? r.count - r.targetCount : r.targetCount - r.count

  // B1 stays in mitra — the unit she works in, same as version A: "Target
  // tercapai · 102 mitra", "Kurangi 3 mitra lagi". The X/100 ratio reading
  // lives in B2's own row card below.
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
            to occupy. Green with a tick once it is fully banked. Reads "skor
            N", same wording as B2: the two versions are arguing about the row
            BELOW this pill, so the pill itself has no reason to differ. */}
        {r.met ? (
          <Badge intent="green" size="sm" leadingIcon={<IconCheck size={16} />}>
            skor {r.weight}
          </Badge>
        ) : (
          <Badge intent="neutral" size="sm">
            skor {r.weight}
          </Badge>
        )}
      </div>

      <p className={`mt-4 text-16 font-bold ${r.met ? 'text-green-600' : 'text-default'}`}>
        {action}
      </p>

      <div className="mt-12">
        <Meter progress={r.progress} tone={r.met ? 'green' : r.lower ? 'red' : 'orange'} />
      </div>

      <p className="mt-8 text-14 text-default">
        Target: {r.lower ? 'dibawah' : 'diatas'} {r.targetCount} {label}
      </p>
    </div>
  )
}

// --- Version B2: the same score, stripped to numbers ------------------------
//
// B1 argues its case in sentences — "Tambah 3% lagi", the boom/boost lines,
// "Target tercapai". B2 argues it in numbers alone: a score, two thresholds,
// and a ratio per row. Nothing here says WHY a number is what it is; B2 is the
// bet that she doesn't need the sentence once the number is legible enough.

function ScoredBodyB2({ d }: { d: ReturnType<typeof buildKpi> }) {
  const b = d.scored

  return (
    <>
      {/* Identical to B1's hero, deliberately: the two versions disagree
          about how a ROW reads, not about the score card above them, and two
          different heroes made that look like a second axis of difference. */}
      <Card>
        <p className="text-12 text-caption">Insentif bulan ini · sisa {KPI_DAYS_LEFT} hari</p>
        {/* text-24 is the largest size the type scale carries — see the
            CHEATSHEET — so this is as big as the figure gets without a new
            token, which is a Tier 2 change this project-local screen can't
            make on its own. */}
        <p
          className={`mt-2 text-24 font-bold ${
            b.total > 0 ? 'text-green-600' : b.boomTriggered ? 'text-red-600' : 'text-caption'
          }`}
        >
          {rupiah(b.total)}
        </p>
        <p className="mt-2 text-12 text-caption">Total skor {b.score}</p>

        <ScoreTrackB2 score={b.score} />

        <p className="mt-8 border-t border-default pt-12 text-12 text-caption">
          {KPI_GATE_NOTE}
        </p>
      </Card>

      {/* Split by group, not one flat list — collection and growth are the two
          halves of the job (see the gate note on `KpiRowDef.group`), and a BP
          reads them as two separate questions: is the book healthy, then is it
          growing. */}
      <section className="flex flex-col gap-8 pb-16">
        <SectionTitle>Target saya</SectionTitle>

        {/* Quieter than the section title above them — these only sort the
            list into its two halves, so matching "Target saya" in size AND
            weight made three headings of equal rank in a row. */}
        <p className="text-14 text-caption">Pembayaran</p>
        {d.rows
          .filter((r) => r.group === 'collection')
          .map((r) => (
            <WeightRowCardB2 key={r.k} r={r} />
          ))}

        <p className="mt-4 text-14 text-caption">Pencairan</p>
        {d.rows
          .filter((r) => r.group === 'growth')
          .map((r) => (
            <WeightRowCardB2 key={r.k} r={r} />
          ))}
      </section>
    </>
  )
}

/**
 * The rail ends at 100 — no headroom past the last dot, unlike B1's
 * 120-wide rail. A score over 100 just reads as a full bar; the exact
 * figure is already printed above.
 *
 * The two bands sit 10 points apart, which at phone width is about 31px of
 * track — narrower than "Rp300rb" renders at text-12. Dropping the "Rp" is
 * what buys the room: "300rb" fits, so every label centres under its own
 * dot. The currency is already stated in full by the hero figure directly
 * above, so nothing is lost by leaving it off two axis labels.
 */
function ScoreTrackB2({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score))

  return (
    // Extra padding on the right, not the left: the 100 dot sits at the
    // track's right edge, and the label under it needs room or it runs
    // past the card.
    <div className="mt-16 pb-24 pl-8 pr-16 pt-24">
      <div className="relative h-8 rounded-full bg-neutral-200">
        <div className="h-8 rounded-full bg-primary-500" style={{ width: `${clamped}%` }} />

        {KPI_BANDS.map((band, i) => {
          // Capped at 100 for both position and label: the band's true floor
          // is 100.001, but a dot past the right edge of its own track clips
          // against the card and nobody is measured against "101".
          const at = Math.min(100, Math.ceil(band.at))
          const reached = score >= band.at
          // Dead-centre on both dots puts "300rb" and "600rb" 7px into each
          // other at phone width, so the FIRST band's pair slides left far
          // enough to open a gap. Legibility beats exact centring: a label
          // a few px off its dot still reads as that dot's, two labels
          // touching read as one word. The DOTS never move — only the text.
          const nudge = i === 0 ? '-ml-16' : ''
          return (
            <div
              key={band.at}
              className="absolute top-1/2"
              style={{ left: `${at}%`, transform: 'translate(-50%, -50%)' }}
            >
              {/* The threshold itself, above the dot — what she is being
                  measured against, read before what it pays. */}
              <span
                className={`absolute bottom-full left-1/2 mb-8 -translate-x-1/2 whitespace-nowrap text-12 font-bold text-caption ${nudge}`}
              >
                {at}
              </span>
              {/* A reached dot is the same purple as the fill it sits on top
                  of — without a ring around it, it disappears into the bar
                  the moment the score clears it. */}
              <span
                className={`block h-16 w-16 rounded-full border-2 border-neutral-white ${
                  reached ? 'bg-primary-500' : 'bg-neutral-300'
                }`}
              />
              {/* What it pays, below — the consequence, read second. The
                  "Rp" is dropped so the label fits centred; see the file
                  note. */}
              <span
                className={`absolute top-full left-1/2 mt-8 -translate-x-1/2 whitespace-nowrap text-12 font-bold text-caption ${nudge}`}
              >
                {ringkas(band.nominal).replace('Rp', '')}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeightRowCardB2({ r }: { r: KpiRow }) {
  const label = r.baseLabel || 'mitra'

  return (
    <div className="rounded-12 border border-default bg-neutral-white p-12">
      <div className="flex items-center gap-8">
        <span className="min-w-0 flex-1 text-14 font-bold text-default">{r.n}</span>
        {/* Green with a tick once the target is met, same as B1 — a banked
            score reads as banked at a glance rather than only through the
            ratio further down the card. */}
        {r.met ? (
          <Badge intent="green" size="sm" leadingIcon={<IconCheck size={16} />}>
            skor {r.weight}
          </Badge>
        ) : (
          <Badge intent="neutral" size="sm">
            skor {r.weight}
          </Badge>
        )}
      </div>

      <p className="mt-4 text-14 text-default">
        Target: {r.lower ? 'dibawah' : 'diatas'} {r.targetCount} {label}
      </p>

      {/* Meter and ratio side by side — B1 stacks the verdict above the meter
          as its own headline; B2 folds it back onto the meter's own row, since
          the ratio here is the only verdict the card states.

          The fill reads off countProgress (uncapped internally, clamped for
          display), but the printed ratio is the plain mitra count over the
          target count — the same two figures as "Target: diatas N mitra"
          above, not a rescaled /100 score. A reader shouldn't have to convert
          a normalised score back into the unit she actually works in. */}
      <div className="mt-12 flex items-center gap-12">
        <div className="min-w-0 flex-1">
          <Meter
            progress={Math.max(0, Math.min(100, r.countProgress))}
            tone={r.met ? 'green' : r.lower ? 'red' : 'orange'}
          />
        </div>
        <span
          className={`shrink-0 text-16 font-bold ${r.met ? 'text-green-600' : 'text-default'}`}
        >
          {r.count}/{r.targetCount}
        </span>
      </div>
    </div>
  )
}
