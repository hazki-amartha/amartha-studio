'use client'

// Option B — Status Modal on a 12-week clock.
//
// A anchors on a rupiah figure at week 48. B anchors on the STATE OF THE LOAN,
// graded now and re-graded every twelve weeks, and the card only ever says two
// things: what the status is worth, and what keeps it there. Everything B used
// to carry besides those two — a tier to be won, a comparison against the mitra
// she is not, three labels saying the same thing — is gone.
//
// Why a grade and not a tier: see the status banner in lib/data.ts. The short
// version is that the thing already behaved like a grade (it moves down
// mid-tenor and recovers), so naming it a membership was the card arguing with
// its own mechanics.
//
// The MAJELIS is on this card's list now, as its third line. It moves the
// week-48 limit rather than her grade, which earned it a heading of its own for
// a while — but a second lead-in over a single row read as a second card inside
// the card. One list, and the row itself says what it is for.
//
// Read top to bottom: WHO the loan is (band) → WHAT COMES NEXT (track) → WHAT
// IT ADDS (the quote) → WHAT KEEPS IT (two habits) → everything else, one tap
// away on the status page.

import type { ReactNode } from 'react'
import {
  ABSENCE_BUDGET,
  CURRENT_LIMIT,
  GROUP_SIZE,
  STATUS_NAME,
  TOTAL_WEEKS,
  WINDOW_LENGTH,
  absencesLeft,
  accessWeek,
  currentWindow,
  goodWeeks,
  gradeIncrement,
  gradeInfo,
  gradeOf,
  groupStatus,
  paidThisWeek,
  outcomeOf,
  rupiah,
  weeksLeftInWindow,
  windowQuote,
  windowRows,
  type Grade,
  type WindowRow,
} from '../lib/data'
import { store, useApp } from '../lib/store'
import { HomeShell, StatusLink } from '../lib/ui'
import { useFlow } from '@/platform/runtime'
import {
  Check,
  ChevronRight,
  Coins,
  CreditCard,
  LogoModal,
  Majelis,
  Minus,
  TrendUp,
  Users,
  Warning,
  Withdraw,
} from '@/design-system/icons'

export function HomeBScreen() {
  const s = useApp()
  const grade = gradeOf(s)
  // Everything still owed, not only this window's — a grade of Tidak Lancar is
  // owed from a stretch that has already closed, and there has to be a way to
  // clear it from home or the state is a dead end.
  const owing = s.unpaid

  return (
    <HomeShell>
      <div className="overflow-hidden rounded-20 border border-default bg-neutral-white">
        {/* The band: the grade, and the one count that evidences it. "28 dari
            48 minggu lancar" is the whole argument for whatever word sits above
            it — a grade with no visible basis is just an opinion. */}
        <div className="bg-gradient-to-br from-primary-400 to-primary-600 px-16 pb-24 pt-16">
          <div className="flex items-start gap-12">
            <span className="flex h-48 w-48 shrink-0 items-center justify-center rounded-12 bg-primary-700 text-neutral-white">
              <LogoModal size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-14 text-neutral-white">{STATUS_NAME}</p>
              <p className="mt-2 text-16 font-bold text-neutral-white">
                {gradeInfo(grade).label}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-14 font-bold text-neutral-white">
                {goodWeeks(s)} dari {TOTAL_WEEKS}
              </p>
              <p className="text-12 text-neutral-200">minggu lancar</p>
            </div>
          </div>
        </div>

        <div className="-mt-12 rounded-t-20 bg-neutral-white px-16 pb-16 pt-20">
          {/* The two bad grades are the only states that put something EXTRA on
              home, and it goes above everything because it is the only thing
              that matters until it is cleared. */}
          {grade === 'tidak-lancar' ? <Stalled /> : null}

          {owing.length > 0 ? <Outstanding weeks={owing} grade={grade} /> : null}

          {/* The first draw, and only the first. Everything a later stretch
              adds is withdrawn from the status page — see DisburseCard. */}
          {s.principalTaken ? null : <DisburseCard />}

          <h2 className="text-16 font-bold text-default">Keuntungan Ibu</h2>

          {/* Four stops, not one 48-week bar. A bar says "you are 17% of the way
              through something"; four stops say what the tenor is made of and
              what each one adds — which is the thing a 12-week cadence has that
              a 48-week climb does not. */}
          <div className="mt-16 flex">
            {windowRows(s).map((row, i, all) => (
              <Milestone
                key={row.index}
                row={row}
                first={i === 0}
                last={i === all.length - 1}
                next={row.index === currentWindow(s)}
              />
            ))}
          </div>

          <Quote grade={grade} />

          {/* Until the financing is drawn there is no instalment to pay and no
              kumpulan to be at, so the two habits are not on the page. Showing
              "Bayar angsuran Rp112.000" to a mitra who has not received money
              is the card asking for something that does not exist yet. */}
          {s.principalTaken ? (
            <>
              <p className="mt-20 text-14 text-caption">{askLine(grade)}</p>

              <div className="mt-16 flex flex-col gap-16">
                <Habit
                  icon={<CreditCard size={20} />}
                  label={`Bayar angsuran ${rupiah(112_000)}`}
                  done={s.paid}
                  trailing={<PayAction />}
                />
                <Habit
                  icon={<Users size={20} />}
                  label="Datang kumpulan hari Kamis"
                  done={s.attended}
                  note={
                    absencesLeft(s) < ABSENCE_BUDGET
                      ? `Sisa ${absencesLeft(s)} kali tidak hadir di ${WINDOW_LENGTH} minggu ini`
                      : undefined
                  }
                  trailing={
                    s.attended ? null : (
                      <span className="text-12 text-caption">Dicatat otomatis</span>
                    )
                  }
                />
                <MajelisHabit />
              </div>
            </>
          ) : (
            <p className="mt-20 text-14 text-caption">
              Angsuran mingguan dan kumpulan dimulai setelah pendanaan Ibu cair.
            </p>
          )}
        </div>

        <StatusLink />
      </div>
    </HomeShell>
  )
}

/**
 * The financing itself, for a mitra who is approved and has never drawn it.
 * Nothing else on home can be tapped in that state, so the button is the page.
 *
 * It appears for HER ONLY. Once the money has moved, the balance the closed
 * stretches add lives on the status page and nowhere else — a Cairkan button
 * standing on home for the whole tenor would make withdrawing the thing the
 * page is for, when what home is actually for is the two habits that raise the
 * amount. Taking it out is a decision about debt; the card should not be
 * nudging her toward it every week.
 */
function DisburseCard() {
  return (
    <div className="mb-20 rounded-12 border border-primary-200 bg-primary-50 p-12">
      <div className="flex items-center gap-12">
        <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-500 text-neutral-white">
          <Withdraw size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-12 text-caption">Pendanaan Ibu siap dicairkan</span>
          <span className="mt-2 block text-20 font-bold text-default">
            {rupiah(CURRENT_LIMIT)}
          </span>
        </span>
      </div>
      <button
        type="button"
        onClick={() => store.takePrincipal()}
        className="mt-12 w-full rounded-full bg-primary-500 py-8 text-14 font-bold text-neutral-white"
      >
        Cairkan
      </button>
    </div>
  )
}

/**
 * One of the four stops. The circle carries the verdict — a check once the
 * twelve weeks closed clean, the reward's own glyph while it is still ahead —
 * the week above it says when, and the word below says what it adds.
 *
 * No rupiah on the track. The figure belongs to the ONE stop she is walking
 * toward and is quoted once underneath; printing it four times turns a cadence
 * into a price list and implies three more promises we cannot keep.
 */
function Milestone({
  row,
  first,
  last,
  next,
}: {
  row: WindowRow
  first: boolean
  last: boolean
  next: boolean
}) {
  const closed = row.status === 'closed'
  const failed = closed && row.outcome === 'failed'
  const done = closed && !failed

  const circle = done
    ? 'bg-primary-500 text-neutral-white'
    : failed
      ? 'bg-neutral-200 text-neutral-500'
      : next
        ? 'bg-primary-50 text-primary-500'
        : 'bg-neutral-50 text-neutral-500'

  // The rail behind the stops: filled up to where she has actually been.
  const rail = 'h-2 flex-1'
  const behind = done ? 'bg-primary-500' : 'bg-neutral-200'
  const ahead = closed ? 'bg-primary-500' : 'bg-neutral-200'

  return (
    <span className="flex min-w-0 flex-1 flex-col items-center">
      <span className={`text-12 ${next ? 'font-bold text-primary-500' : 'text-caption'}`}>
        {row.to}
      </span>

      <span className="mt-4 flex w-full items-center">
        <span className={`${rail} ${first ? '' : behind}`} />
        <span
          className={`flex h-32 w-32 shrink-0 items-center justify-center rounded-full ${circle}`}
        >
          {done ? (
            <Check size={20} />
          ) : failed ? (
            <Minus size={20} />
          ) : row.final ? (
            <TrendUp size={20} />
          ) : (
            <Coins size={20} />
          )}
        </span>
        <span className={`${rail} ${last ? '' : ahead}`} />
      </span>

      <span
        className={`mt-4 w-full truncate text-center text-12 ${
          next ? 'font-bold text-primary-500' : 'text-caption'
        }`}
      >
        {row.final ? 'Naik limit' : 'Pencairan'}
      </span>
    </span>
  )
}

/**
 * What the next stop is worth at TODAY'S grade — the sharpest thing the four
 * names buy us. Sangat Baik and Baik add different figures, so a mitra sitting
 * at Baik sees the smaller number and, underneath it, exactly what the bigger
 * one costs her: paying on time. That second line is the entire argument for
 * having a scale instead of a pass/fail.
 *
 * "Bertambah", never "terbuka": the twelve weeks raise a balance she can take
 * whenever she likes — they do not open a door that shuts again. The badge is
 * when the addition lands, not a deadline to withdraw.
 */
function Quote({ grade }: { grade: Grade }) {
  const s = useApp()
  const left = weeksLeftInWindow(s)
  const forecast = windowQuote(outcomeOf(s, currentWindow(s)))

  if (grade === 'tidak-lancar' || grade === 'perlu-ditingkatkan') return null

  return (
    <div className="mt-16 rounded-12 border border-default bg-neutral-50 p-12">
      <p className="text-14 text-caption">Pencairan Ibu bertambah</p>
      <div className="mt-4 flex flex-wrap items-center gap-8">
        <span className="text-20 font-bold text-primary-500">+{rupiah(forecast)}</span>
        <span className="rounded-full bg-orange-500 px-8 py-2 text-12 font-bold text-neutral-white">
          {left === 0 ? 'Minggu ini' : `${left} minggu lagi`}
        </span>
      </div>
      {grade === 'baik' ? (
        <p className="mt-8 text-12 text-caption">
          Jadi {rupiah(gradeIncrement('sangat-baik'))} kalau semua angsuran 12 minggu ini tepat
          waktu.
        </p>
      ) : null}
    </div>
  )
}

/** The lead-in to the two habits. One line, and it moves with the grade. */
function askLine(grade: Grade): string {
  switch (grade) {
    case 'sangat-baik':
      return `Jaga ${STATUS_NAME.toLowerCase()} Ibu dengan cara ini:`
    case 'baik':
      return `Tingkatkan ${STATUS_NAME.toLowerCase()} Ibu dengan cara ini:`
    default:
      return `Naikkan lagi ${STATUS_NAME.toLowerCase()} Ibu dengan cara ini:`
  }
}

/**
 * The unpaid-week row. It asks for one thing and says what clearing it protects
 * — never what it costs, because the cost is the engine's number and she cannot
 * act on it.
 */
function Outstanding({ weeks, grade }: { weeks: number[]; grade: Grade }) {
  const s = useApp()

  return (
    <div className="mb-20 rounded-12 border border-orange-200 bg-orange-50 p-12">
      <div className="flex items-start gap-12">
        <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-orange-500 text-neutral-white">
          <Warning size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-14 font-bold text-default">
            Angsuran minggu {weeks.join(', ')} belum dibayar
          </span>
          <span className="mt-2 block text-12 text-caption">
            {grade === 'tidak-lancar'
              ? `Lunasi untuk menaikkan status modal dan penambahan pencairan di minggu ${accessWeek(s)}.`
              : 'Masih bisa dibayar sekarang. Setelah lunas, status modal Ibu naik lagi.'}
          </span>
        </span>
      </div>
      <button
        type="button"
        onClick={() => store.payOutstanding()}
        className="mt-12 w-full rounded-full bg-primary-500 py-8 text-14 font-bold text-neutral-white"
      >
        Bayar tunggakan
      </button>
    </div>
  )
}

/** Arrears outlived a close. One fact, one route back, no scolding. */
function Stalled() {
  const s = useApp()

  return (
    <div className="mb-20 rounded-12 border border-default bg-neutral-50 p-12">
      <p className="text-14 font-bold text-default">Jumlah pencairan tidak bertambah</p>
      <p className="mt-4 text-12 text-caption">
        Ada minggu yang belum dibayar sampai 12 minggu sebelumnya selesai. Setelah tunggakan lunas,
        status modal Ibu naik lagi dan jumlah pencairan bisa bertambah di minggu {accessWeek(s)}.
      </p>
    </div>
  )
}

/**
 * One half of a good week. Drawn as A draws it — 40px tinted square, one plain
 * sentence — with a trailing slot, because B has no week tile to hang the
 * payment on: the row itself has to carry the action.
 */
function Habit({
  icon,
  label,
  done,
  note,
  trailing,
}: {
  icon: ReactNode
  label: string
  done: boolean
  note?: string
  trailing?: ReactNode
}) {
  return (
    <div className="flex items-center gap-16">
      <span
        className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-12 ${
          done ? 'bg-green-50 text-green-500' : 'bg-primary-50 text-primary-500'
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-16 text-default">{label}</span>
        {note ? <span className="mt-2 block text-12 text-orange-500">{note}</span> : null}
      </span>
      {done ? (
        <span className="flex shrink-0 items-center gap-4 text-12 font-bold text-green-500">
          <Check size={16} /> Selesai
        </span>
      ) : (
        <span className="shrink-0">{trailing}</span>
      )}
    </div>
  )
}

/**
 * The majelis, the third line of the list. It buys a different thing from the
 * two above it — the week-48 limit, not the grade — and it is the one line that
 * is somebody else's behaviour, so the row says what it is for underneath
 * itself rather than borrowing a heading. Still a door: it opens the majelis
 * page, where the roster and the real numbers live.
 *
 * The count appears only in the state where there is something to do about it,
 * same rule the standalone card followed.
 */
function MajelisHabit() {
  const flow = useFlow()
  const s = useApp()
  const status = groupStatus(s)

  return (
    <button
      type="button"
      onClick={() => flow.go('majelis')}
      className="flex w-full items-center gap-16 text-left"
    >
      <span
        className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-12 ${
          status === 'lewat' ? 'bg-neutral-50 text-neutral-500' : 'bg-primary-50 text-primary-500'
        }`}
      >
        <Majelis size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-16 text-default">Jaga kelancaran majelis</span>
        {status === 'jaga' ? (
          <span className="mt-2 block text-12 text-orange-500">
            {paidThisWeek(s)} dari {GROUP_SIZE} sudah bayar minggu ini
          </span>
        ) : status === 'lewat' ? (
          <span className="mt-2 block text-12 text-caption">
            Tambahan limit dari kelompok tidak tercapai tenor ini
          </span>
        ) : (
          <span className="mt-2 block text-12 text-caption">
            Untuk tambahan limit di akhir tenor
          </span>
        )}
      </span>
      <ChevronRight size={20} className="shrink-0 text-neutral-500" />
    </button>
  )
}

/**
 * The only thing on this page that is tapped. Paying stamps the week once the
 * majelis records attendance a moment later — and if that stamp was the last
 * week of the twelve, the stretch is graded and we go to the verdict rather
 * than to a four-week celebration. B's beat is twelve weeks; the chapter is A's.
 */
function PayAction() {
  const flow = useFlow()

  const pay = () => {
    store.pay()
    // Attendance arrives from the majelis a moment later, on its own.
    window.setTimeout(() => {
      store.attend()
      const now = store.get()
      if (!now.paid || !now.attended) return
      // Read this BEFORE stamping: the stamp moves the cursor into the next week.
      const closes = now.week === accessWeek(now)
      store.stampWeek()
      if (closes) {
        store.closeWindow()
        flow.go('window-close')
      }
    }, 1400)
  }

  return (
    <button
      type="button"
      onClick={pay}
      className="rounded-full bg-primary-500 px-24 py-8 text-14 font-bold text-neutral-white"
    >
      Bayar
    </button>
  )
}
