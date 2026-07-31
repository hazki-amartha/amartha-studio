'use client'

// Detail B — the Status Modal page. Option A's detail page (progress-weeks) is
// frozen and still counts in weeks with Rp500rb per four-week chapter on it;
// this page counts in twelve-week stretches, and the two never link to each
// other on purpose. A page built on "four weeks pay you Rp500rb" and a page
// built on "twelve weeks are graded, and the grade decides the increment"
// cannot sit in one flow without one of them lying.
//
// Three blocks, in the order the questions actually arrive:
//
//   1. The money — what she can take out today, then the four additions that
//      built it, each drawn as the twelve weeks it is made of (detail A's
//      block, on B's clock). The history is its own section rather than a
//      footnote inside the balance card: twelve boxes wide, it is no longer a
//      list of doors but the evidence behind every grade this page quotes.
//   2. The status — the grade, what holds it up (two criteria she owns), and
//      the two benefits it is worth. The scale lives here too, as four
//      tappable names above the benefits rather than a card of its own: the
//      only thing the four grades differ on IS the benefits, so a separate
//      list of them was the same table printed twice. Tap another name and the
//      benefits become that status's — hers stays outlined throughout.
//   3. What keeps it — the three rules, and the ONLY place allowed to carry
//      numbers, because they are about her behaviour rather than our money.
//
// Two corrections this page carries, both from the designer:
//
//   · Twelve clean weeks do not OPEN a window that shuts again — they ADD to a
//     balance that never expires. She takes it whenever she likes, in part or
//     in full. See WINDOW_DISBURSEMENT in lib/data.ts.
//   · The majelis is not a status criterion. It appears once, inside the limit
//     benefit, because that is the only thing it moves.

import { Badge, NavigationHeader } from '@/design-system/components'
import {
  CheckCircleFill,
  Coins,
  Majelis,
  Minus,
  MoneyBag,
  TrendUp,
  Warning,
  Withdraw,
} from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { useState, type ReactNode } from 'react'
import {
  FINAL_LIMIT,
  GRADES,
  LIMIT_CEILING,
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
  // Which status the benefits below are describing. Hers until she taps
  // another one — the scale is read by comparison, not by reading a table.
  const [shown, setShown] = useState<Grade>(grade)

  return (
    <Screen topBar={<NavigationHeader title={STATUS_NAME} onBack={flow.back} />}>
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

      {/* The four additions, drawn the way detail A draws its blocks — as the
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

      {/* 2. The status itself: the grade on the band, what holds it up inside
             the band, and what it is worth underneath. Criteria sit ON the
             purple because they are the evidence for the word above them —
             separating the two put a claim on one card and its proof on
             another. */}
      <div className="overflow-hidden rounded-16 border border-default bg-neutral-white">
        <div className="bg-gradient-to-br from-primary-400 to-primary-600 px-16 pb-24 pt-16">
          <div className="flex items-start gap-12">
            <span className="flex h-48 w-48 shrink-0 items-center justify-center rounded-12 bg-primary-700 text-neutral-white">
              <MoneyBag size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-14 text-neutral-white">{STATUS_NAME}</p>
              <p className="mt-2 text-24 font-bold text-neutral-white">{gradeInfo(grade).label}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-14 font-bold text-neutral-white">
                {goodWeeks(s)} dari {TOTAL_WEEKS}
              </p>
              <p className="text-12 text-neutral-200">minggu lancar</p>
            </div>
          </div>

          <div className="mt-16 flex flex-col gap-12">
            {criteria(s).map((item) => (
              <CriterionRow key={item.label} item={item} />
            ))}
          </div>

          <p className="mt-12 text-12 text-neutral-200">
            Dinilai tiap {WINDOW_LENGTH} minggu. Sekarang minggu ke-{weeksIntoWindow(s)} dari{' '}
            {WINDOW_LENGTH} di penilaian ke-{currentWindow(s)}.
          </p>
        </div>

        <div className="-mt-12 rounded-t-20 bg-neutral-white px-16 pb-16 pt-20">
          {/* The scale, folded into the card it was describing. It used to be a
              second card listing four names and four figures beside a card
              already quoting one of them — the same table, printed twice. Here
              the four names are a control: tap one and the benefits below
              become that status's, so the comparison is read in the one place
              the benefits are stated instead of copied next to them. */}
          <div className="flex flex-wrap gap-8">
            {GRADES.map((g) => (
              <GradePill
                key={g.id}
                id={g.id}
                mine={g.id === grade}
                shown={g.id === shown}
                onSelect={() => setShown(g.id)}
              />
            ))}
          </div>

          <h2 className="mt-20 text-16 font-bold text-default">
            {shown === grade ? 'Keuntungan Ibu' : `Keuntungan ${gradeInfo(shown).label}`}
          </h2>
          <p className="mt-4 text-12 text-caption">
            {shown === grade
              ? gradeInfo(grade).earned
              : `${gradeInfo(shown).earned} · status Ibu sekarang ${gradeInfo(grade).label}`}
          </p>

          {/* Two benefits, and only two. They run on different clocks, and the
              order says so: the increment is recurring, twelve weeks away and
              concrete; the limit lands once, at week 48, and stays hedged. */}
          <div className="mt-16 flex flex-col gap-16">
            {/* The figure is the SELECTED grade's — hers unless she has tapped
                another one. Quoting the top increment to a mitra sitting at
                Baik would be the page telling her she has something she does
                not, so a comparison has to be something she asked for. */}
            <Benefit
              icon={<Coins size={20} />}
              title={
                gradeIncrement(shown) > 0
                  ? `Tambah ${rupiah(gradeIncrement(shown))} di pencairan berikutnya`
                  : 'Pencairan tidak bertambah'
              }
            >
              <span className="mt-2 block text-12 text-caption">
                Setiap {WINDOW_LENGTH} minggu lancar menambah jumlah yang bisa Ibu cairkan.{' '}
                {shown === 'sangat-baik'
                  ? 'Status Sangat Baik menambah paling besar.'
                  : shown === 'baik'
                    ? `Jadi ${rupiah(gradeIncrement('sangat-baik'))} kalau semua angsuran tepat waktu.`
                    : 'Belum bertambah selama masih ada angsuran yang belum dibayar.'}
              </span>
            </Benefit>

            <Benefit
              icon={<TrendUp size={20} />}
              title={`Naik limit hingga ${rupiah(LIMIT_CEILING)}`}
            >
              <span className="mt-2 block text-12 text-caption">
                {gradeIncrement(shown) > 0
                  ? `Kalau status modal Ibu terjaga sampai minggu ${TOTAL_WEEKS}.`
                  : `Limit baru naik kalau status modal Ibu pulih dan terjaga sampai minggu ${TOTAL_WEEKS}.`}
              </span>
              {/* The majelis, named once — under the benefit it actually moves,
                  never as a criterion of her own grade. */}
              <span className="mt-8 flex items-start gap-8 rounded-8 bg-neutral-50 p-8">
                <span className="shrink-0 text-primary-500">
                  <Majelis size={16} />
                </span>
                <span className="min-w-0 flex-1 text-12 text-caption">
                  {rupiah(LIMIT_CEILING)} kalau kelompok Ibu juga lancar,{' '}
                  {rupiah(FINAL_LIMIT)} kalau tidak.{' '}
                  {groupStatus(s) === 'lewat'
                    ? 'Kelompok Melati tidak tercapai tenor ini.'
                    : 'Kelompok Melati sedang lancar.'}
                </span>
              </span>
            </Benefit>
          </div>
        </div>
      </div>

      {/* 3. What keeps it. The one block with numbers in it. */}
      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <h2 className="text-16 font-bold text-default">Yang perlu Ibu jaga</h2>
        <div className="mt-16 flex flex-col gap-16">
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
 * One criterion, on the band. Drawn white-on-purple with a filled mark rather
 * than a tinted pill: at this size the state has to be readable at a glance,
 * and three fill colours on a gradient is where a band starts to look like a
 * dashboard.
 */
function CriterionRow({ item }: { item: Criterion }) {
  return (
    <span className="flex items-start gap-12">
      <span
        className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full ${
          item.state === 'met'
            ? 'bg-primary-700 text-neutral-white'
            : item.state === 'warn'
              ? 'bg-orange-500 text-neutral-white'
              : 'bg-red-500 text-neutral-white'
        }`}
      >
        {item.state === 'met' ? <CheckCircleFill size={16} /> : <Warning size={16} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-14 text-neutral-white">{item.label}</span>
        <span className="mt-2 block text-12 text-neutral-200">{item.note}</span>
      </span>
    </span>
  )
}

/**
 * One rung of the scale, as a control rather than a row. Hers is outlined even
 * when she is reading another one, so a comparison can never be mistaken for
 * the status she actually has.
 */
function GradePill({
  id,
  mine,
  shown,
  onSelect,
}: {
  id: Grade
  mine: boolean
  shown: boolean
  onSelect: () => void
}) {
  const tone = shown
    ? 'border-primary-500 bg-primary-500 text-neutral-white'
    : mine
      ? 'border-primary-500 bg-neutral-white text-primary-500'
      : 'border-default bg-neutral-white text-caption'

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center gap-4 rounded-full border px-12 py-4 text-12 font-bold ${tone}`}
    >
      {mine ? <CheckCircleFill size={16} /> : null}
      {gradeInfo(id).label}
    </button>
  )
}

/**
 * One of the four additions, as a block of its twelve weeks — detail A's shape,
 * on B's clock. A closed stretch carries the grade it was given and what that
 * grade ADDED, because those two facts together are the argument the whole page
 * makes; the boxes above them are the evidence for the grade.
 *
 * The open and future ones carry no amount at all: what twelve weeks will add
 * is the engine's to say on the day.
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
        ) : null}
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
  if (row.final) return 'Limit Ibu ditentukan di sini'
  if (row.status === 'open') {
    return `Sedang berjalan — dinilai di akhir minggu ${row.to}`
  }
  return 'Belum mulai'
}

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
      <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-12 bg-primary-50 text-primary-500">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-16 font-bold text-default">{title}</span>
        {children}
      </span>
    </div>
  )
}
