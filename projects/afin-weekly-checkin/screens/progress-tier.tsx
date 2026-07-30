'use client'

// Detail B — the Status Modal page. Option A's detail page (progress-weeks) is
// frozen and still counts in weeks with Rp500rb per four-week chapter on it;
// this page counts in twelve-week stretches, and the two never link to each
// other on purpose. A page built on "four weeks pay you Rp500rb" and a page
// built on "twelve weeks are graded, and the grade decides the increment"
// cannot sit in one flow without one of them lying.
//
// Four blocks, in the order the questions actually arrive:
//
//   1. The money — what she can take out today, and the four additions that
//      built it. One balance and its history, so they are one card.
//   2. The status — the grade, what holds it up (two criteria she owns), and
//      the two benefits it is worth. This is the card the whole concept is now
//      about, and it says exactly two things because there are exactly two.
//   3. The scale — all four grades, with the increment each one pays. Needed
//      only because two of them pay differently; if they all paid the same
//      this block would be decoration.
//   4. What keeps it — the three rules, and the ONLY place allowed to carry
//      numbers, because they are about her behaviour rather than our money.
//
// Two corrections this page carries, both from the designer:
//
//   · Twelve clean weeks do not OPEN a window that shuts again — they ADD to a
//     balance that never expires. She takes it whenever she likes, in part or
//     in full. See WINDOW_DISBURSEMENT in lib/data.ts.
//   · The majelis is not a status criterion. It appears once, inside the limit
//     benefit, because that is the only thing it moves.

import { NavigationHeader } from '@/design-system/components'
import {
  CalendarDots,
  CheckCircleFill,
  Coins,
  Hourglass,
  LockKey,
  Majelis,
  Minus,
  MoneyBag,
  TrendUp,
  Warning,
  Withdraw,
} from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import type { ReactNode } from 'react'
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
  short,
  weeksIntoWindow,
  windowQuote,
  windowRows,
  type Criterion,
  type Grade,
  type WindowRow,
} from '../lib/data'
import { store, useApp } from '../lib/store'

export function ProgressTierScreen() {
  const flow = useFlow()
  const s = useApp()
  const grade = gradeOf(s)
  const ready = disbursable(s)

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

        <div className="mt-20 border-t border-default pt-16">
          <h2 className="text-14 font-bold text-default">
            Empat kali penambahan dalam {TOTAL_WEEKS} minggu
          </h2>
          <p className="mt-4 text-12 text-caption">
            Besar penambahannya mengikuti status modal Ibu di {WINDOW_LENGTH} minggu itu.
          </p>

          <div className="mt-16 flex flex-col gap-8">
            {windowRows(s).map((row) => (
              <WindowRowView key={row.index} row={row} />
            ))}
          </div>
        </div>
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
          <h2 className="text-16 font-bold text-default">Keuntungan Ibu</h2>

          {/* Two benefits, and only two. They run on different clocks, and the
              order says so: the increment is recurring, twelve weeks away and
              concrete; the limit lands once, at week 48, and stays hedged. */}
          <div className="mt-16 flex flex-col gap-16">
            {/* The figure is TODAY'S grade, not the best one — quoting the top
                increment to a mitra sitting at Baik would be the page telling
                her she has something she does not. When the grade pays nothing
                at all, the amount becomes a ceiling ("sampai") and the sentence
                underneath is the route back rather than an encouragement. */}
            <Benefit
              icon={<Coins size={20} />}
              title={
                gradeIncrement(grade) > 0
                  ? `Tambah ${rupiah(gradeIncrement(grade))} di pencairan berikutnya`
                  : `Tambah sampai ${rupiah(gradeIncrement('sangat-baik'))} di pencairan berikutnya`
              }
            >
              <span className="mt-2 block text-12 text-caption">
                Setiap {WINDOW_LENGTH} minggu lancar menambah jumlah yang bisa Ibu cairkan.{' '}
                {grade === 'sangat-baik'
                  ? 'Status Sangat Baik menambah paling besar.'
                  : grade === 'baik'
                    ? `Jadi ${rupiah(gradeIncrement('sangat-baik'))} kalau semua angsuran tepat waktu.`
                    : 'Belum bertambah selama masih ada angsuran yang belum dibayar.'}
              </span>
            </Benefit>

            <Benefit
              icon={<TrendUp size={20} />}
              title={`Naik limit hingga ${rupiah(LIMIT_CEILING)}`}
            >
              <span className="mt-2 block text-12 text-caption">
                Kalau status modal Ibu terjaga sampai minggu {TOTAL_WEEKS}.
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

      {/* 3. The scale. It earns its place only because the top two pay
             different figures — that difference is the whole reason the status
             has four names instead of two states. */}
      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <h2 className="text-16 font-bold text-default">Empat {STATUS_NAME.toLowerCase()}</h2>
        <div className="mt-16 flex flex-col gap-8">
          {GRADES.map((g) => (
            <GradeRow key={g.id} id={g.id} current={g.id === grade} />
          ))}
        </div>
      </div>

      {/* 4. What keeps it. The one block with numbers in it. */}
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
 * One rung of the scale, with what it pays. The two that pay nothing say so in
 * words rather than "Rp0" — a zero in the same column as a real figure reads
 * as a debt, and nothing is being taken away from her here.
 */
function GradeRow({ id, current }: { id: Grade; current: boolean }) {
  const info = gradeInfo(id)
  const adds = gradeIncrement(id)

  return (
    <div
      className={`flex items-center gap-12 rounded-12 border p-12 ${
        current ? 'border-primary-500 bg-primary-50' : 'border-default bg-neutral-white'
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-8">
          <span className="truncate text-14 font-bold text-default">{info.label}</span>
          {current ? (
            <span className="shrink-0 rounded-full bg-primary-500 px-8 py-2 text-10 font-bold text-neutral-white">
              Status Ibu
            </span>
          ) : null}
        </span>
        <span className="mt-2 block text-12 text-caption">{info.earned}</span>
      </span>
      <span
        className={`shrink-0 text-14 font-bold ${adds > 0 ? 'text-primary-500' : 'text-caption'}`}
      >
        {adds > 0 ? `+${short(adds)}` : 'Tidak bertambah'}
      </span>
    </div>
  )
}

/**
 * One of the four additions — read as a statement of account, not a schedule of
 * doors. A closed stretch carries the grade it was given and what that grade
 * ADDED, because those two facts together are the argument the whole page
 * makes. The open and future ones carry no amount at all: what twelve weeks
 * will add is the engine's to say on the day.
 */
function WindowRowView({ row }: { row: WindowRow }) {
  const closed = row.status === 'closed'
  const failed = closed && row.outcome === 'failed'
  const added = closed ? windowQuote(row.outcome) : 0

  return (
    <div
      className={`flex items-center gap-12 rounded-12 border p-12 ${
        row.status === 'open'
          ? 'border-primary-500 bg-primary-50'
          : 'border-default bg-neutral-white'
      }`}
    >
      <span
        className={`flex h-32 w-32 shrink-0 items-center justify-center rounded-full ${
          failed
            ? 'bg-neutral-200 text-caption'
            : closed
              ? 'bg-green-50 text-green-500'
              : row.status === 'open'
                ? 'bg-primary-500 text-neutral-white'
                : 'bg-neutral-50 text-disabled'
        }`}
      >
        {failed ? (
          <LockKey size={16} />
        ) : closed ? (
          <CheckCircleFill size={16} />
        ) : row.status === 'open' ? (
          <Hourglass size={16} />
        ) : (
          <CalendarDots size={16} />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-14 font-bold text-default">
          Minggu {row.from}–{row.to}
        </span>
        <span className="mt-2 block text-12 text-caption">
          {closed
            ? gradeInfo(gradeOfOutcome(row.outcome)).label
            : row.final
              ? 'Limit Ibu ditentukan di sini'
              : row.status === 'open'
                ? 'Sedang berjalan'
                : 'Belum mulai'}
        </span>
      </span>

      {closed ? (
        <span
          className={`shrink-0 text-14 font-bold ${
            added > 0 ? 'text-primary-500' : 'text-caption'
          }`}
        >
          {added > 0 ? `+${rupiah(added)}` : <Minus size={16} />}
        </span>
      ) : row.final ? (
        <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-yellow-50 text-yellow-600">
          <TrendUp size={16} />
        </span>
      ) : null}
    </div>
  )
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
