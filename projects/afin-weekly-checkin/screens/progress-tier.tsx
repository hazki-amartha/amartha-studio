'use client'

// The Status Modal page — the whole tenor read as four twelve-week stretches.
//
// The status is the page's HEADER — a coloured band in the page's own chrome,
// the way the homepage carries its brand band, rather than a purple card in the
// middle of a page already about it. The band says one thing only: the grade,
// what earns it, and the count that evidences it. The benefits used to sit on
// the band too; they were the page answering "what is this worth" before it had
// said what it is, and the block below already answers it with the weeks
// attached.
//
// Then three blocks, in the order the questions actually arrive:
//
//   1. The money — what she can take out today.
//   2. Where it came from — the four additions. Each one opens to reveal the
//      twelve weeks behind it; twelve boxes standing open, four times over, is
//      forty-eight boxes on one page and nobody reads that.
//   3. What keeps it — where she stands on each criterion. The rule list that
//      used to sit under it said the same things a second time, in the same
//      words, so the criteria carry it alone.
//
// Two corrections this page carries, both from the designer:
//
//   · Twelve clean weeks do not OPEN a window that shuts again — they ADD to a
//     balance that never expires. She takes it whenever she likes, in part or
//     in full. See WINDOW_DISBURSEMENT in lib/data.ts.
//   · The majelis is not a status criterion. It has its own page, because the
//     only thing it moves is the week-48 limit.

import { Badge } from '@/design-system/components'
import {
  ArrowLeft,
  ChevronDown,
  CheckCircleFill,
  LogoModal,
  Minus,
  TrendUp,
  Warning,
  Withdraw,
} from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { useState } from 'react'
import {
  QUOTE_FULL,
  QUOTE_REDUCED,
  STATUS_NAME,
  TOTAL_WEEKS,
  WINDOW_LENGTH,
  criteria,
  currentWindow,
  disbursable,
  goodWeeks,
  gradeInfo,
  gradeOf,
  gradeOfOutcome,
  rupiah,
  short,
  weekDate,
  weeksIntoWindow,
  windowCells,
  windowQuote,
  windowRows,
  type Criterion,
  type WindowRow,
} from '../lib/data'
import { store, useApp } from '../lib/store'
import { WeekLegend, WeekTile } from '../lib/ui'

export function ProgressTierScreen() {
  const flow = useFlow()
  const s = useApp()
  const grade = gradeOf(s)
  const ready = disbursable(s)
  // Which stretch has its weeks showing. Null — everything closed — is the
  // default: the figures read on their own, and the boxes are there for the
  // one she wants to check.
  const [open, setOpen] = useState<number | null>(null)

  return (
    <Screen statusBar="none">
      {/* The header. The status used to be a purple card in the middle of the
          page — a band on a page that was already about the band. Promoted to
          the page's own chrome it stops competing: the grade IS the title, the
          criteria under it are the evidence, and everything below is what the
          grade is worth and where it came from.

          Drawn like the homepage's brand band — edge to edge, reaching into the
          status strip (statusBar="none" plus -mt-48: 32px of strip and 16px of
          page padding). */}
      <div className="-mx-16 -mt-48 bg-gradient-to-br from-primary-400 to-primary-600 px-16 pb-24 pt-48">
        <div className="flex h-48 items-center gap-12">
          <button
            type="button"
            onClick={flow.back}
            aria-label="Kembali"
            className="shrink-0 text-neutral-white"
          >
            <ArrowLeft size={24} />
          </button>
          <span className="min-w-0 flex-1 truncate text-16 font-bold text-neutral-white">
            {STATUS_NAME}
          </span>
        </div>

        <div className="mt-8 flex items-start gap-12">
          <span className="flex h-48 w-48 shrink-0 items-center justify-center rounded-12 bg-primary-700 text-neutral-white">
            <LogoModal size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-16 font-bold text-neutral-white">{gradeInfo(grade).label}</p>
            <p className="mt-2 text-12 text-neutral-200">{gradeInfo(grade).earned}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-14 font-bold text-neutral-white">
              {goodWeeks(s)} dari {TOTAL_WEEKS}
            </p>
            <p className="text-12 text-neutral-200">minggu lancar</p>
          </div>
        </div>
      </div>

      {/* 1. The balance, and the four things that build it — one card, because
             they are one subject. The card stays on screen at Rp0: "nothing
             yet" is a state of the same balance, and hiding it would make the
             four rows below look like a schedule of doors rather than the
             history of a figure. */}
      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <div className="flex items-center gap-12">
          <span
            className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-full ${
              ready > 0 ? 'bg-primary-50 text-primary-500' : 'bg-neutral-50 text-disabled'
            }`}
          >
            <Withdraw size={24} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-12 text-caption">Bisa dicairkan sekarang</span>
            <span className="mt-2 block text-20 font-bold text-default">{rupiah(ready)}</span>
          </span>
        </div>

        <button
          type="button"
          disabled={ready === 0}
          onClick={() => store.disburse()}
          className={`mt-16 w-full rounded-full py-12 text-14 font-bold ${
            ready > 0 ? 'bg-primary-500 text-neutral-white' : 'bg-neutral-50 text-disabled'
          }`}
        >
          Cairkan
        </button>

      </div>

      {/* 2. The four additions. Each row states its verdict and its figure on
             its own, and OPENS to show the twelve weeks behind it — collapsed
             by default, because forty-eight boxes standing open on one page is
             a wall, and the weeks are the evidence for the figure rather than
             the point of it. One open at a time, so the page never grows past
             a stretch and a half. */}
      <div>
        <h2 className="text-16 font-bold text-default">Keuntungan yang bisa Ibu dapatkan</h2>
        <p className="mt-4 text-12 text-caption">
          Jaga status modal di Sangat Baik untuk dapat keuntungan maksimal.
        </p>
      </div>

      <div className="flex flex-col gap-12">
        {windowRows(s).map((row) => (
          <WindowBlock
            key={row.index}
            row={row}
            open={open === row.index}
            onToggle={() => setOpen(open === row.index ? null : row.index)}
          />
        ))}
      </div>

      {/* 3. What keeps it — and, at the top of it, where she actually stands on
             each criterion. The live state sits next to the rules it is
             measured against. */}
      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <h2 className="text-16 font-bold text-default">Yang perlu Ibu jaga</h2>

        <div className="mt-16 flex flex-col gap-12">
          {criteria(s).map((item) => (
            <CriterionRow key={item.label} item={item} />
          ))}
        </div>

        <p className="mt-12 text-12 text-caption">
          Dinilai tiap {WINDOW_LENGTH} minggu. Sekarang minggu ke-{weeksIntoWindow(s)} dari{' '}
          {WINDOW_LENGTH} di penilaian ke-{currentWindow(s)}.
        </p>
      </div>

      <div className="pb-16" />
    </Screen>
  )
}

/**
 * One criterion — where she actually stands, next to the rules it is measured
 * against. Three states, carried by the mark's own colour: met, at risk, gone.
 */
function CriterionRow({ item }: { item: Criterion }) {
  return (
    <span className="flex items-start gap-12">
      <span
        className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full ${
          item.state === 'met'
            ? 'bg-green-50 text-green-500'
            : item.state === 'warn'
              ? 'bg-orange-50 text-orange-500'
              : 'bg-red-50 text-red-500'
        }`}
      >
        {item.state === 'met' ? <CheckCircleFill size={16} /> : <Warning size={16} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-14 text-default">{item.label}</span>
        <span className="mt-2 block text-12 text-caption">{item.note}</span>
      </span>
    </span>
  )
}

/**
 * One of the four additions. Closed at rest: the weeks it is made of live
 * behind a tap, because twelve boxes times four stretches is the whole page and
 * the boxes are evidence rather than the subject.
 *
 * A closed stretch carries the grade it was given and what that grade ADDED,
 * because those two facts together are the argument the whole page makes. The
 * ones still ahead carry a RANGE, never a figure: what twelve weeks end up
 * adding is the engine's to say on the day, and the two ends of the range are
 * the two outcomes the mitra herself controls — clean, or clean but late. A
 * single number here would be a promise; the range is the rule.
 */
function WindowBlock({
  row,
  open,
  onToggle,
}: {
  row: WindowRow
  open: boolean
  onToggle: () => void
}) {
  const s = useApp()
  const closed = row.status === 'closed'
  const added = closed ? windowQuote(row.outcome) : 0
  // A stretch that already paid out is settled history: it recedes to the
  // canvas tint so the open one and the ones still ahead are what the eye
  // lands on, and the check carries "done" without a word.
  const earned = added > 0

  return (
    <div
      className={`overflow-hidden rounded-12 border ${
        row.status === 'open'
          ? 'border-primary-500 bg-neutral-white'
          : closed
            ? 'border-default bg-neutral-50'
            : 'border-default bg-neutral-white'
      }`}
    >
      {/* The row itself is the control: the whole summary is tappable, so the
          caret is an affordance rather than the only target. */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full p-12 text-left"
      >
        <div className="flex items-center gap-8">
          <span
            className={`min-w-0 flex-1 text-14 font-bold ${
              closed ? 'text-caption' : 'text-default'
            }`}
          >
            {/* The date the stretch lands on, not "Minggu 1–12" — the same
                unit home's track uses, and the only end that matters is the
                one it closes on. */}
            {weekDate(row.to)}
          </span>
          {row.status === 'open' ? (
            <Badge intent="primary" variant="solid" size="sm">
              Sekarang
            </Badge>
          ) : row.final ? (
            <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-yellow-50 text-yellow-600">
              <TrendUp size={16} />
            </span>
          ) : null}
        </div>

        <div className="mt-8 flex items-baseline gap-8">
          <span className="min-w-0 flex-1 text-12 text-caption">{windowLabel(row)}</span>
          {closed ? (
            <span
              className={`flex shrink-0 items-center gap-4 text-16 font-bold ${
                earned ? 'text-primary-500' : 'text-caption'
              }`}
            >
              {earned ? (
                <>
                  <CheckCircleFill size={16} className="text-green-500" />+{rupiah(added)}
                </>
              ) : (
                <Minus size={16} />
              )}
            </span>
          ) : (
            <span className="shrink-0 text-14 font-bold text-caption">
              {short(QUOTE_REDUCED)}–{short(QUOTE_FULL)}
            </span>
          )}
          <span
            className={`shrink-0 text-neutral-500 ${open ? 'rotate-180' : ''}`}
            aria-hidden
          >
            <ChevronDown size={16} />
          </span>
        </div>
      </button>

      {/* Twelve boxes, four to a row, stacked three deep — twelve across one
          phone width is a 24px tile with no room for its own week number. The
          key travels with them: it is only readable next to the fills it
          explains, and only worth the space while they are on screen. */}
      {open ? (
        <div className="border-t border-default p-12">
          <div className="grid grid-cols-4 gap-8">
            {windowCells(s, row.index).map((cell) => (
              <WeekTile key={cell.week} cell={cell} size="sm" />
            ))}
          </div>
          <div className="mt-12">
            <WeekLegend />
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** What the line under the twelve boxes says — the grade, or why there isn't one yet. */
function windowLabel(row: WindowRow): string {
  if (row.status === 'closed') {
    // A settled stretch leads with what it DID, not with the grade it was
    // given: the grade is the reason, and the reason only earns a mention
    // where the outcome was short of the full one.
    if (row.outcome === 'failed') {
      return `${gradeInfo(gradeOfOutcome(row.outcome)).label} — ada angsuran yang belum dibayar`
    }
    if (row.outcome === 'reduced') return 'Keuntungan tercapai — ada angsuran telat'
    return 'Keuntungan tercapai'
  }
  if (row.status === 'open') {
    return row.final
      ? `Sedang berjalan — limit Ibu juga ditentukan di sini`
      : `Sedang berjalan — dinilai di akhir minggu ${row.to}`
  }
  if (row.final) return 'Limit Ibu ditentukan di sini'
  return `Kalau ${WINDOW_LENGTH} minggu ini lancar`
}
