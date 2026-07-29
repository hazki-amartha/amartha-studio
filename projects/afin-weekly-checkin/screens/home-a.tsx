'use client'

// Option A, built to the high-fidelity comp.
//
// The argument is unchanged — destination on top, the chapter beneath it, the
// reward closing it — but it is drawn rather than sketched now: a purple
// gradient band carrying the limit and the 48-week bar, and a white sheet
// overlapping its lower edge with the week tiles on it.
//
// Two things the comp settles that the sketch left open:
//
//   · The tiles carry the action. "Bayar" sits on the current week's tile, not
//     on a button in the list below, so those two rows become a plain statement
//     of what fills a week rather than controls.
//   · The last tile of the chapter IS the reward. Week 20 shows the increment
//     instead of a fourth identical checkbox, so the row ends in what those
//     weeks pay rather than handing off to a separate bar underneath. It pays
//     into the next disbursement window — it is never cash on the day, which is
//     why the tile says "Tambahan" and not "Bonus".

import type { ReactNode } from 'react'
import {
  CHAPTER_LENGTH,
  CURRENT_LIMIT,
  MILESTONE_REWARD,
  TOTAL_WEEKS,
  chapterCells,
  goodWeeks,
  journeyPercent,
  limitOnOffer,
  rewardReady,
  rupiah,
  short,
  type WeekCell,
} from '../lib/data'
import { store, useApp } from '../lib/store'
import { HomeShell, MajelisCard, windowLine } from '../lib/ui'
import {
  CheckCircleFill,
  ChevronRight,
  CreditCard,
  LogoModal,
  Minus,
  Users,
  Withdraw,
} from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'

export function HomeAScreen() {
  const s = useApp()
  const cells = chapterCells(s)
  const ready = rewardReady(s)

  return (
    <HomeShell>
      <div className="overflow-hidden rounded-20 border border-default bg-neutral-white">
        {/* The destination band. One figure, one fraction, one bar — the same
            thin destination line as before, given the card's whole top. */}
        <div className="bg-gradient-to-br from-primary-400 to-primary-600 px-16 pb-24 pt-16">
          <div className="flex items-start gap-12">
            <span className="flex h-48 w-48 shrink-0 items-center justify-center rounded-12 bg-primary-700 text-neutral-white">
              <LogoModal size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-14 text-neutral-white">Naik limit hingga</p>
              <p className="mt-2 text-24 font-bold text-neutral-white">
                {rupiah(CURRENT_LIMIT + limitOnOffer(s))}
              </p>
            </div>
            <p className="shrink-0 text-right text-14 text-neutral-white">
              {goodWeeks(s)} dari {TOTAL_WEEKS}
              <br />
              minggu lancar
            </p>
          </div>

          <span className="mt-16 block h-8 w-full overflow-hidden rounded-full bg-primary-700">
            <span
              className="block h-8 rounded-full bg-green-400"
              // Data-driven: the value IS the geometry.
              style={{ width: `${Math.max(journeyPercent(s), 2)}%` }}
            />
          </span>
        </div>

        {/* The white sheet, overlapping the band's lower edge. */}
        <div className="-mt-12 rounded-t-20 bg-neutral-white px-16 pb-16 pt-20">
          <h2 className="text-18 font-bold text-default">Goal berikutnya</h2>

          {/* The chapter. Four tiles, one more for every week missed, and the
              last of them is the bonus rather than a fourth checkbox. */}
          <div className="mt-16 flex gap-8">
            {cells.map((cell, i) => (
              <ChapterTile key={cell.week} cell={cell} last={i === cells.length - 1} />
            ))}
          </div>

          <div className="mt-16 rounded-12 border border-default bg-neutral-50 p-16">
            <p className="text-14 text-caption">
              {ready ? 'Sudah terbuka' : `Setelah ${CHAPTER_LENGTH} minggu lancar`}
            </p>
            <p className="mt-4 text-16 font-bold text-primary-500">
              {short(MILESTONE_REWARD)} di pencairan berikutnya
            </p>
            {ready ? <p className="mt-4 text-12 text-caption">{windowLine(s)}</p> : null}
          </div>

          {/* Not controls. The tiles above carry the action; this is the plain
              statement of what a filled week is made of. */}
          <p className="mt-20 text-14 text-caption">Selesaikan 2 hal ini setiap minggu:</p>
          <div className="mt-12 flex flex-col gap-16">
            <Habit
              icon={<CreditCard size={20} />}
              label={`Bayar angsuran ${rupiah(112_000)}`}
              done={s.paid}
            />
            <Habit icon={<Users size={20} />} label="Datang kumpulan hari Kamis" done={s.attended} />
          </div>
        </div>

        <LadderFooter />
      </div>

      <MajelisCard />
    </HomeShell>
  )
}

// --- The chapter tile ------------------------------------------------------
// Four faces of one tile. Done and future are quiet outlines; the current week
// is filled and wears the "Sekarang" flag; the last tile of the chapter is
// filled darker and shows the gift, because that week IS the reward.

function ChapterTile({ cell, last }: { cell: WeekCell; last: boolean }) {
  const flow = useFlow()
  const s = useApp()

  const settle = () => {
    store.pay()
    // Attendance arrives from the majelis on its own — there is nothing to tap.
    window.setTimeout(() => {
      store.attend()
      const next = store.get()
      if (next.paid && next.attended && store.stampWeek()) flow.go('milestone')
    }, 1400)
  }

  if (cell.status === 'active') {
    return (
      <div className="relative flex min-w-0 flex-1 flex-col pt-12">
        <span className="absolute left-0 right-0 top-0 mx-auto w-fit rounded-8 bg-orange-500 px-8 py-2 text-10 font-bold text-neutral-white">
          Sekarang
        </span>
        <button
          type="button"
          onClick={settle}
          className="flex w-full flex-col items-center gap-8 rounded-12 bg-primary-500 px-4 py-12 text-neutral-white"
        >
          <span className="w-full truncate text-center text-12">Minggu {cell.week}</span>
          <span className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-neutral-white text-10 font-bold">
            Rp
          </span>
          <span className="w-full truncate text-center text-12 font-bold">
            {s.paid ? 'Menunggu' : 'Bayar'}
          </span>
        </button>
      </div>
    )
  }

  if (last) {
    return (
      <div className="flex min-w-0 flex-1 flex-col pt-12">
        <span className="flex w-full flex-col items-center gap-8 rounded-12 bg-primary-600 px-4 py-12 text-neutral-white">
          <span className="w-full truncate text-center text-12">Minggu {cell.week}</span>
          {/* Not a gift box: the fourth week adds to what the next window
              disburses, so the tile wears the withdrawal glyph and the word
              "Tambahan" rather than "Bonus". */}
          <Withdraw size={24} />
          <span className="w-full truncate text-center text-12 font-bold">Tambahan</span>
        </span>
      </div>
    )
  }

  const done = cell.status === 'done'
  const missed = cell.status === 'missed'

  return (
    <div className="flex min-w-0 flex-1 flex-col pt-12">
      <span
        className={`flex w-full flex-col items-center gap-8 rounded-12 border px-4 py-12 ${
          missed ? 'border-orange-200 bg-orange-50' : 'border-default bg-neutral-white'
        }`}
      >
        <span className="w-full truncate text-center text-12 text-caption">Minggu {cell.week}</span>
        {done ? (
          <CheckCircleFill size={24} className="text-primary-500" />
        ) : missed ? (
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-500 text-neutral-white">
            <Minus size={16} />
          </span>
        ) : (
          <span className="h-24 w-24 rounded-full border-2 border-default" />
        )}
        <span
          className={`w-full truncate text-center text-12 ${missed ? 'text-orange-500' : 'text-caption'}`}
        >
          {done ? 'Lancar' : missed ? 'Terlewat' : 'Belum'}
        </span>
      </span>
    </div>
  )
}

function Habit({ icon, label, done }: { icon: ReactNode; label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-16">
      <span
        className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-12 ${
          done ? 'bg-green-50 text-green-500' : 'bg-primary-50 text-primary-500'
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-16 text-default">{label}</span>
    </div>
  )
}

function LadderFooter() {
  const flow = useFlow()

  return (
    <button
      type="button"
      onClick={() => flow.go('progress-weeks')}
      className="flex w-full items-center justify-center gap-8 border-t border-default py-16 text-16 text-caption"
    >
      Lihat seluruh goal
      <ChevronRight size={20} />
    </button>
  )
}
