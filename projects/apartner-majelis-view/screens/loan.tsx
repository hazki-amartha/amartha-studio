'use client'

import { AppScreen } from '../lib/ui'

// One pencairan, opened from the list of all of them.
//
// The list answers "how many cycles, and how did they go". This answers the
// question a mitra actually argues with: "minggu ke berapa yang belum kebayar?"
// — so it is the whole schedule, every instalment, with the answered ones
// carrying their outcome and the rest carrying their date.
//
// Fifty rows is the point, not a problem to solve. The mitra page already
// summarises the recent weeks; a BP opens this one when the summary is being
// disputed, and a disputed week is always the one off the edge of a summary.
//
// Every row opens, because the argument is never about the amount — it is about
// what happened that week, and that is the line the row hides until asked.

import { useState } from 'react'
import { Badge, NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { findMitra, rupiah } from '../lib/data'
import { findLoan, scheduleOf, type Instalment } from '../lib/loans'
import { IconChevronDown, IconChevronUp } from '../lib/icons'
import { useApp } from '../lib/store'

export function LoanScreen() {
  const flow = useFlow()
  const s = useApp()

  const mitra = findMitra(s.openMitra)
  const loan = findLoan(mitra, s.openLoan)
  const schedule = scheduleOf(mitra, loan)

  const total = loan.weekly * loan.tenor
  const paidCount = schedule.filter((i) => i.status === 'lunas').length
  const sisa = total - paidCount * loan.weekly

  return (
    <AppScreen
      topBar={
        <NavigationHeader title={`Pencairan ${loan.no}`} onBack={() => flow.back()} />
      }
    >
      {/* What is left, over what it is left OF. The remaining figure leads
          because it is the one the mitra asks for by name; the contract total
          under it is what makes the number arguable rather than announced. A
          tinted panel rather than a card: it is the page's own header, not the
          first item in a list of cards. */}
      <div className="flex flex-col gap-12 rounded-16 bg-neutral-50 p-12">
        <div className="flex flex-col gap-2">
          <span className="text-12 text-caption">Sisa angsuran</span>
          <span className="text-24 font-bold text-default">{rupiah(sisa)}</span>
          <span className="text-12 text-caption">
            dari total <span className="font-bold text-default">{rupiah(total)}</span>
          </span>
        </div>
        <div className="flex gap-12 border-t border-default pt-12">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="text-12 text-caption">Sudah dibayar</span>
            <span className="text-14 font-bold text-default">
              {paidCount} dari {loan.tenor} angsuran
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="text-12 text-caption">Angsuran per minggu</span>
            <span className="text-14 font-bold text-default">{rupiah(loan.weekly)}</span>
          </div>
        </div>
      </div>

      {/* Same 16px heading the pencairan list uses, so the two pages of one
          subject sound alike. */}
      <h2 className="text-16 font-bold text-default">Jadwal angsuran</h2>

      <div className="flex flex-col pb-16">
        {schedule.map((row, i) => (
          <ScheduleRow key={row.no} row={row} last={i === schedule.length - 1} />
        ))}
      </div>
    </AppScreen>
  )
}

/**
 * One instalment, on the rail.
 *
 * The rail is what makes fifty rows a SEQUENCE rather than fifty cards: the
 * numbered discs run down one line, filled where the week has been answered and
 * hollow where it is still ahead, so how far in she is reads before any figure
 * does.
 *
 * A week still ahead sets its amount grey and its date on the right, because
 * nothing has happened to it — the row states a plan. An answered week sets the
 * amount solid, moves the date under it as "Jatuh tempo", and spends the right
 * edge on the outcome, which is the only thing that differs between the two.
 */
function ScheduleRow({ row, last }: { row: Instalment; last: boolean }) {
  const [open, setOpen] = useState(false)
  const answered = row.status !== 'akan'

  return (
    <div className="flex gap-12">
      {/* The rail: a disc, and the line that carries on to the next row. The
          line is coloured only where the sequence has already happened, so it
          reads as a progress track rather than a border. */}
      <div className="flex w-24 shrink-0 flex-col items-center gap-4">
        <span
          className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-12 font-bold ${
            answered
              ? 'bg-primary-500 text-neutral-white'
              : 'border border-default bg-neutral-white text-caption'
          }`}
        >
          {row.no}
        </span>
        {last ? null : (
          <span
            className={`w-2 flex-1 rounded-full ${answered ? 'bg-primary-200' : 'bg-neutral-200'}`}
          />
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex min-w-0 flex-1 flex-col gap-4 pb-16 text-left"
      >
        <span className="flex items-center gap-8">
          <span className="flex min-w-0 flex-1 flex-col gap-2">
            <span
              className={`truncate text-14 font-bold ${answered ? 'text-default' : 'text-caption'}`}
            >
              {rupiah(row.amount)}
            </span>
            {answered ? (
              <span className="truncate text-12 text-caption">Jatuh tempo: {row.due}</span>
            ) : null}
          </span>
          {answered ? (
            <Badge intent={row.status === 'lunas' ? 'green' : 'red'} variant="outline">
              {row.status === 'lunas' ? 'Lunas' : 'Belum Bayar'}
            </Badge>
          ) : (
            <span className="shrink-0 text-12 text-caption">{row.due}</span>
          )}
          <span className="shrink-0 text-disabled">
            {open ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
          </span>
        </span>

        {/* What actually happened that week — the line the row is opened for.
            A part-payment is the case that makes it worth having: "Lunas" and
            "Belum Bayar" both hide the week she handed over half. */}
        {open ? (
          <span className="flex flex-col gap-2 rounded-8 bg-neutral-50 px-12 py-8">
            <span className="text-12 text-caption">
              {row.status === 'akan'
                ? `Jatuh tempo ${row.due}`
                : row.paid && row.paid > 0
                  ? `Diterima ${rupiah(row.paid)} dari ${rupiah(row.amount)}`
                  : 'Belum ada pembayaran yang diterima'}
            </span>
            <span className="text-12 text-caption">Angsuran ke-{row.no}</span>
          </span>
        ) : null}
      </button>
    </div>
  )
}
