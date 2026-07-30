'use client'

// Detail A — the repayment tracker. Nothing about the tier lives here; this page
// is the schedule and the money it moves.
//
// The unit is the WEEK and the beat is FOUR of them. Every week behind her
// carries one verdict — paid, paid late, not paid — and every four weeks those
// verdicts settle into the one figure this page exists to explain: what that
// block added to the amount she can disburse. Four clean weeks add Rp500rb, a
// late week takes a quarter off, and a week never paid means the block adds
// nothing.
//
// Two things follow from that, and between them they are the whole layout:
//
//   · The amount comes FIRST, with the button that spends it — enabled exactly
//     when a closed block has left something to take. It is the only thing on
//     the page she can act on, so nothing is allowed above it.
//   · A row is four boxes wide and nothing else. What the four weeks earned is
//     a line UNDER them, in plain text, because it is the result of the four and
//     not a fifth thing to collect.

import { Badge, NavigationHeader } from '@/design-system/components'
import { TrendUp, Withdraw } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  CHAPTER_LENGTH,
  GROUP_BONUS,
  LIMIT_INCREASE,
  MILESTONE_REWARD,
  TOTAL_WEEKS,
  cycles,
  disbursementWeek,
  goodWeeks,
  groupStatus,
  journeyPercent,
  limitOnOffer,
  short,
  weeksToDisbursement,
  withdrawable,
  type Cycle,
} from '../lib/data'
import { store, useApp, type AppState } from '../lib/store'
import { Meter, WeekLegend, WeekTile } from '../lib/ui'

export function ProgressWeeksScreen() {
  const flow = useFlow()
  const s = useApp()
  const blocks = cycles(s)
  const ready = withdrawable(s)

  return (
    <Screen topBar={<NavigationHeader title="Angsuran & pencairan" onBack={flow.back} />}>
      {/* What she can do something about, at the top. The button is the state
          the whole page resolves to: open when a closed block left something,
          flat when it did not. */}
      <div className="rounded-12 border border-default bg-neutral-white p-12">
        <div className="flex items-center gap-12">
          <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
            <Withdraw size={24} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-12 text-caption">Bisa dicairkan sekarang</span>
            <span className="mt-2 block text-20 font-bold text-default">{short(ready)}</span>
          </span>
        </div>

        <p className="mt-12 text-12 text-caption">{disbursementLine(s)}</p>

        <button
          type="button"
          disabled={ready === 0}
          onClick={() => store.withdraw()}
          className={`mt-12 w-full rounded-full py-12 text-14 font-bold ${
            ready === 0 ? 'bg-neutral-200 text-disabled' : 'bg-primary-500 text-neutral-white'
          }`}
        >
          Cairkan
        </button>
      </div>

      {/* Where the weeks are heading: the limit at the end of the tenor, and the
          two things that move it. */}
      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <div className="flex items-center gap-12">
          <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
            <TrendUp size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-16 font-bold text-default">
              Limit naik {groupStatus(s) === 'lewat' ? '' : 's/d '}
              {short(limitOnOffer(s))}
            </p>
            <p className="mt-2 text-12 text-caption">
              {goodWeeks(s)} dari {TOTAL_WEEKS} minggu lancar
            </p>
          </div>
        </div>
        <div className="mt-12">
          <Meter percent={journeyPercent(s)} />
        </div>

        <div className="mt-16 flex flex-col gap-8">
          <SplitLine label={`Dari ${TOTAL_WEEKS} minggu Ibu`} amount={short(LIMIT_INCREASE)} />
          <SplitLine
            label="Dari kelompok lancar"
            amount={short(GROUP_BONUS)}
            struck={groupStatus(s) === 'lewat'}
          />
        </div>
      </div>

      <WeekLegend />

      {/* The forty-eight weeks, four to a row — always four, because the due
          dates never moved. Each row ends in what those four weeks earned. */}
      <div className="flex flex-col gap-12">
        {blocks.map((block) => (
          <CycleBlock key={block.index} cycle={block} />
        ))}
      </div>

      <div className="pb-16" />
    </Screen>
  )
}

/** One line about timing: when the amount can next move, or that it just did. */
function disbursementLine(s: AppState): string {
  const left = weeksToDisbursement(s)
  if (left === 0) return `Minggu ini menutup 4 minggu — jumlahnya dihitung akhir minggu`
  return `Tambahan berikutnya di minggu ${disbursementWeek(s)} · ${left} minggu lagi`
}

/** Four calendar weeks and what they earned. */
function CycleBlock({ cycle }: { cycle: Cycle }) {
  return (
    <div
      className={`rounded-12 border bg-neutral-white p-12 ${
        cycle.status === 'open' ? 'border-primary-500' : 'border-default'
      }`}
    >
      <div className="flex items-center gap-8">
        <span className="min-w-0 flex-1 text-14 font-bold text-default">
          Minggu {cycle.from}–{cycle.to}
        </span>
        {cycle.status === 'open' ? (
          <Badge intent="primary" variant="solid" size="sm">
            Sekarang
          </Badge>
        ) : null}
      </div>

      <div className="mt-12 flex gap-4">
        {cycle.cells.map((cell) => (
          <WeekTile key={cell.week} cell={cell} size="sm" />
        ))}
      </div>

      {/* The increase, stated rather than staged: a label that says WHY it is
          the figure it is, and the figure. No chip, no medal — the four boxes
          above are the thing being tracked. */}
      <div className="mt-12 flex items-baseline gap-8 border-t border-default pt-12">
        <span className="min-w-0 flex-1 text-12 text-caption">{incrementLabel(cycle)}</span>
        <span className={`shrink-0 text-14 font-bold ${incrementTone(cycle)}`}>
          {cycle.status === 'closed' && cycle.increment === 0 ? '—' : `+${short(cycle.increment)}`}
        </span>
      </div>
    </div>
  )
}

function incrementLabel(cycle: Cycle): string {
  if (cycle.status !== 'closed') {
    return `Kalau ${CHAPTER_LENGTH} minggu ini dibayar tepat waktu`
  }
  if (cycle.unpaid > 0) return 'Ada minggu yang belum dibayar — tidak ada tambahan'
  if (cycle.late > 0) return `${cycle.late} minggu telat, jadi tambahannya berkurang`
  return 'Tambahan pencairan'
}

function incrementTone(cycle: Cycle): string {
  if (cycle.status !== 'closed') return 'text-caption'
  if (cycle.increment === 0) return 'text-red-500'
  if (cycle.increment < MILESTONE_REWARD) return 'text-orange-500'
  return 'text-default'
}

function SplitLine({
  label,
  amount,
  struck,
}: {
  label: string
  amount: string
  struck?: boolean
}) {
  return (
    <div className="flex items-baseline gap-8">
      <span className="min-w-0 flex-1 text-12 text-caption">{label}</span>
      <span
        className={`shrink-0 text-12 font-bold ${struck ? 'text-caption line-through' : 'text-default'}`}
      >
        {amount}
      </span>
    </div>
  )
}
