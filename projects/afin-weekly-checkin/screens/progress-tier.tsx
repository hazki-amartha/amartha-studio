'use client'

// Detail B — the Status Modal page. Option A's detail page (progress-weeks) is
// frozen and still counts in weeks with Rp500rb per four-week chapter on it;
// this page counts in twelve-week stretches, and the two never link to each
// other on purpose. A page built on "four weeks pay you Rp500rb" and a page
// built on "twelve weeks are graded, and the grade decides the increment"
// cannot sit in one flow without one of them lying.
//
// The status is the page's HEADER — a coloured band in the page's own chrome,
// the way the homepage carries its brand band, rather than a purple card in the
// middle of a page already about it. The band carries the grade AND what the
// grade is worth, because a status and its benefits are one statement: the two
// benefits sat in a white card underneath repeating the header's subject. Two
// benefit lines and nothing else — the grade is already the title and the count
// beside it is already its evidence, so a heading and a scale above them were
// the band introducing itself twice before saying anything.
//
// Then three blocks, in the order the questions actually arrive:
//
//   1. The money — what she can take out today.
//   2. Where it came from — the four additions, each drawn as the twelve weeks
//      it is made of (detail A's block, on B's clock), four boxes to a row.
//   3. What keeps it — where she stands on each criterion, then the three
//      rules. The ONLY place allowed to carry numbers, because they are about
//      her behaviour rather than our money.
//
// Two corrections this page carries, both from the designer:
//
//   · Twelve clean weeks do not OPEN a window that shuts again — they ADD to a
//     balance that never expires. She takes it whenever she likes, in part or
//     in full. See WINDOW_DISBURSEMENT in lib/data.ts.
//   · The majelis is not a status criterion. It appears once, inside the limit
//     benefit, because that is the only thing it moves.

import { Badge } from '@/design-system/components'
import {
  ArrowLeft,
  CheckCircleFill,
  Coins,
  LogoModal,
  Majelis,
  Minus,
  TrendUp,
  Warning,
  Withdraw,
} from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import type { ReactNode } from 'react'
import {
  GROUP_BONUS,
  LIMIT_CEILING,
  QUOTE_FULL,
  QUOTE_REDUCED,
  STATUS_NAME,
  STATUS_RULES,
  TOTAL_WEEKS,
  WINDOW_LENGTH,
  criteria,
  currentWindow,
  disbursable,
  goodWeeks,
  gradeIncrement,
  gradeInfo,
  gradeOf,
  gradeOfOutcome,
  groupStatus,
  rupiah,
  short,
  weeksIntoWindow,
  windowCells,
  windowQuote,
  windowRows,
  type Criterion,
  type Grade,
  type WindowRow,
} from '../lib/data'
import { store, useApp } from '../lib/store'
import { WeekLegend, WeekTile } from '../lib/ui'

export function ProgressTierScreen() {
  const flow = useFlow()
  const s = useApp()
  const grade = gradeOf(s)
  const ready = disbursable(s)

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
            <p className="text-24 font-bold text-neutral-white">{gradeInfo(grade).label}</p>
            <p className="mt-2 text-12 text-neutral-200">{gradeInfo(grade).earned}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-14 font-bold text-neutral-white">
              {goodWeeks(s)} dari {TOTAL_WEEKS}
            </p>
            <p className="text-12 text-neutral-200">minggu lancar</p>
          </div>
        </div>

        {/* What the status is WORTH, on the purple. It was a white card under
            the header saying the same thing the header was about; a status and
            its benefits are one statement, so they are one block. */}
        <Worth grade={grade} />
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

        {/* The rule in one breath, and the only place it is stated in full:
            the money is not a window, it is a balance. */}
        <p className="mt-12 text-12 text-caption">
          Jumlah ini bertambah setiap {WINDOW_LENGTH} minggu lancar. Tidak hangus — Ibu bisa
          mencairkan kapan saja, sebagian dulu atau semuanya.
        </p>

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

      {/* 2. The four additions, drawn the way detail A draws its blocks — as the
          weeks they are made of. A stretch is twelve boxes wide and the figure
          it produced is a line UNDER them, because the figure is the result of
          the twelve and not a thirteenth thing to collect. */}
      <div>
        <h2 className="text-16 font-bold text-default">
          Empat kali penambahan dalam {TOTAL_WEEKS} minggu
        </h2>
        <p className="mt-4 text-12 text-caption">
          Besar penambahannya mengikuti status modal Ibu di {WINDOW_LENGTH} minggu itu.
        </p>
      </div>

      <WeekLegend />

      <div className="flex flex-col gap-12">
        {windowRows(s).map((row) => (
          <WindowBlock key={row.index} row={row} />
        ))}
      </div>

      {/* 3. What keeps it — and, at the top of it, where she actually stands on
             each criterion. The criteria used to sit on the band as the proof
             for the grade; the band now carries the benefits instead, so the
             live state moves next to the rules it is measured against. */}
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

        <div className="mt-16 flex flex-col gap-16 border-t border-default pt-16">
          {STATUS_RULES.map((item) => (
            <div key={item.rule}>
              <p className="text-14 font-bold text-default">{item.rule}</p>
              <p className="mt-2 text-12 text-caption">{item.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pb-16" />
    </Screen>
  )
}

/**
 * What the status is worth: two benefits and nothing else. The four grade names
 * and the "Keuntungan Ibu" heading are gone — the grade is already the header's
 * title and the count beside it is already its evidence, so both were the band
 * introducing itself twice before saying anything.
 *
 * The figures are HER grade's, never the best one: quoting the top increment to
 * a mitra sitting at Baik would be the page telling her she has something she
 * does not.
 */
function Worth({ grade }: { grade: Grade }) {
  const s = useApp()

  return (
    /* Two benefits, and only two. They run on different clocks, and the order
       says so: the increment is recurring, twelve weeks away and concrete; the
       limit lands once, at week 48, and stays hedged. */
    <div className="mt-20 flex flex-col gap-16">
      {/* "s/d", never an exact figure: the amount a window releases is the
          engine's on the day, and the grade only sets its ceiling. */}
      <Benefit
        icon={<Coins size={20} />}
        title={
          gradeIncrement(grade) > 0
            ? `Tambah s/d ${short(gradeIncrement(grade))} di pencairan berikutnya`
            : 'Pencairan tidak bertambah'
        }
      />

      <Benefit icon={<TrendUp size={20} />} title={`Naik limit hingga ${rupiah(LIMIT_CEILING)}`}>
        <span className="mt-2 block text-12 text-neutral-200">
          {gradeIncrement(grade) > 0
            ? `Kalau status modal Ibu terjaga sampai minggu ${TOTAL_WEEKS}.`
            : `Limit baru naik kalau status modal Ibu pulih dan terjaga sampai minggu ${TOTAL_WEEKS}.`}
        </span>
        {/* The majelis, named once — under the benefit it actually moves, never
            as a criterion of her own grade. One line: what the group is worth,
            not an arithmetic of two limits she has to hold in her head. */}
        <span className="mt-8 flex items-center gap-8 rounded-8 bg-primary-700 px-8 py-4">
          <span className="shrink-0 text-neutral-white">
            <Majelis size={16} />
          </span>
          <span className="min-w-0 flex-1 text-12 text-neutral-200">
            {groupStatus(s) === 'lewat'
              ? `Tambahan ${short(GROUP_BONUS)} dari majelis tidak tercapai`
              : `+${short(GROUP_BONUS)} dari majelis lancar`}
          </span>
        </span>
      </Benefit>
    </div>
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
 * One of the four additions, as a block of its twelve weeks — detail A's shape,
 * on B's clock. A closed stretch carries the grade it was given and what that
 * grade ADDED, because those two facts together are the argument the whole page
 * makes; the boxes above them are the evidence for the grade.
 *
 * The ones still ahead carry a RANGE, never a figure. What twelve weeks end up
 * adding is the engine's to say on the day, and the two ends of the range are
 * the two outcomes the mitra herself controls — clean, or clean but late. A
 * single number here would be a promise; the range is the rule.
 */
function WindowBlock({ row }: { row: WindowRow }) {
  const s = useApp()
  const closed = row.status === 'closed'
  const added = closed ? windowQuote(row.outcome) : 0

  return (
    <div
      className={`rounded-12 border bg-neutral-white p-12 ${
        row.status === 'open' ? 'border-primary-500' : 'border-default'
      }`}
    >
      <div className="flex items-center gap-8">
        <span className="min-w-0 flex-1 text-14 font-bold text-default">
          Minggu {row.from}–{row.to}
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

      {/* Twelve boxes, four to a row — the same four-wide rhythm detail A uses,
          stacked three deep. Twelve across one phone width is a 24px tile with
          no room for its own week number. */}
      <div className="mt-12 grid grid-cols-4 gap-8">
        {windowCells(s, row.index).map((cell) => (
          <WeekTile key={cell.week} cell={cell} size="sm" />
        ))}
      </div>

      <div className="mt-12 flex items-baseline gap-8 border-t border-default pt-12">
        <span className="min-w-0 flex-1 text-12 text-caption">{windowLabel(row)}</span>
        {closed ? (
          <span
            className={`shrink-0 text-14 font-bold ${
              added > 0 ? 'text-primary-500' : 'text-caption'
            }`}
          >
            {added > 0 ? `+${rupiah(added)}` : <Minus size={16} />}
          </span>
        ) : (
          <span className="shrink-0 text-14 font-bold text-caption">
            {short(QUOTE_REDUCED)}–{short(QUOTE_FULL)}
          </span>
        )}
      </div>
    </div>
  )
}

/** What the line under the twelve boxes says — the grade, or why there isn't one yet. */
function windowLabel(row: WindowRow): string {
  if (row.status === 'closed') {
    const label = gradeInfo(gradeOfOutcome(row.outcome)).label
    if (row.outcome === 'failed') return `${label} — ada angsuran yang belum dibayar`
    if (row.outcome === 'reduced') return `${label} — ada angsuran telat`
    return `${label} · tambahan pencairan`
  }
  if (row.status === 'open') {
    return row.final
      ? `Sedang berjalan — limit Ibu juga ditentukan di sini`
      : `Sedang berjalan — dinilai di akhir minggu ${row.to}`
  }
  if (row.final) return 'Limit Ibu ditentukan di sini'
  return `Kalau ${WINDOW_LENGTH} minggu ini lancar`
}

/** One benefit, on the band: white on purple, with the glyph on the darker tint. */
function Benefit({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children?: ReactNode
}) {
  return (
    <div className="flex items-start gap-12">
      <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-12 bg-primary-700 text-neutral-white">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-16 font-bold text-neutral-white">{title}</span>
        {children}
      </span>
    </div>
  )
}
