'use client'

import { AppScreen } from '../lib/ui'

// Riwayat angsuran — every cycle she has taken, Aktif and Lunas as two tabs.
//
// The mitra page answers "what does she owe today". This answers "how long has
// she been with us, and how did the last cycles go" — a different question with
// a different shelf life, which is why it is a page rather than another section
// on a page already carrying a ledger.
//
// It matters because it is the evidence behind the ladder. "Ibu sudah tiga kali
// cair dan dua lunas tepat waktu" is the sentence that makes a top-up
// conversation land, and until this screen existed the BP had to remember it.
//
// One active card, always — see `loansOf` for why a second live pencairan is
// the one thing from the reference this direction does not copy.

import { useState } from 'react'
import { Badge, Card, NavigationHeader } from '@/design-system/components'
import { MoneyBag } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { findMitra, rupiah } from '../lib/data'
import { loansOf, type Disbursement } from '../lib/loans'
import { store, useApp } from '../lib/store'

export function LoansScreen() {
  const flow = useFlow()
  const s = useApp()

  const mitra = findMitra(s.openMitra)
  const loans = loansOf(mitra)
  const active = loans.filter((l) => l.status === 'aktif')
  const settled = loans.filter((l) => l.status === 'lunas')

  function openLoan(id: string) {
    store.openLoanPage(id)
    flow.go('loan')
  }

  // Aktif / Lunas as two tabs, per the BP APP 2026 Figma ("Riwayat angsuran").
  const [tab, setTab] = useState<'aktif' | 'lunas'>('aktif')
  const shown = tab === 'aktif' ? active : settled

  return (
    <AppScreen
      topBar={<NavigationHeader title="Riwayat angsuran" onBack={() => flow.back()} />}
    >
      <div role="tablist" className="-mx-16 -mt-16 flex bg-neutral-white">
        {(['aktif', 'lunas'] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex-1 border-b py-12 text-14 ${
              tab === id
                ? 'border-primary-500 font-bold text-primary-500'
                : 'border-default font-regular text-caption'
            }`}
          >
            {id === 'aktif' ? 'Aktif' : 'Lunas'}
          </button>
        ))}
      </div>

      <span className="text-12 text-caption">
        {shown.length} pencairan {tab === 'aktif' ? 'aktif' : 'lunas'}
      </span>
      <div className="flex flex-col gap-12 pb-16">
        {shown.map((loan) => (
          <LoanCard key={loan.id} loan={loan} onOpen={() => openLoan(loan.id)} />
        ))}
      </div>
    </AppScreen>
  )
}

/**
 * One cycle. Identity on top, then the four facts in a 2×2 — which is the right
 * shape for them: they are read as pairs (when it started / how long it runs,
 * how far in / what it costs a week), not scanned down a column.
 *
 * A settled cycle keeps every number and loses only its colour. It is still the
 * thing a BP quotes — "dua belas dari dua belas, tepat waktu" — and greying it
 * into a summary line would throw away the proof to save a card.
 *
 * The whole card opens the cycle's schedule. No chevron: every card in the list
 * goes somewhere, so a tell on each one says nothing that the four identical
 * cards below it don't already.
 */
function LoanCard({ loan, onOpen }: { loan: Disbursement; onOpen: () => void }) {
  const done = loan.status === 'lunas'

  return (
    <Card>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Buka jadwal angsuran pencairan ${loan.no}`}
        className="flex w-full flex-col gap-12 text-left"
      >
        <div className="flex items-center gap-12">
          <span
            className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-8 ${
              done ? 'bg-neutral-50 text-neutral-500' : 'bg-blue-50 text-blue-500'
            }`}
          >
            <MoneyBag size={20} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className={`truncate text-16 font-bold ${done ? 'text-caption' : 'text-default'}`}>
              Pencairan {loan.no}
            </span>
            <span className="truncate text-14 text-default">
              Pokok: {rupiah(loan.principal)}
            </span>
          </div>
          {done ? null : (
            <Badge intent={loan.dpd > 0 ? 'red' : 'green'} variant="outline">
              {loan.dpd > 0 ? 'Telat' : 'Lancar'}
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-12 border-t border-default pt-12">
          <div className="flex gap-12">
            <Fact label="Tanggal pencairan" value={loan.cairDate} />
            <Fact label="Angsuran per minggu" value={rupiah(loan.weekly)} />
          </div>
          <div className="flex gap-12">
            <Fact label="Sudah dibayar" value={`${loan.paidCount} dari ${loan.tenor} angsuran`} />
            <Fact
              label="Sisa angsuran"
              value={rupiah((loan.tenor - loan.paidCount) * loan.weekly)}
            />
          </div>
        </div>
      </button>
    </Card>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <span className="text-12 text-caption">{label}</span>
      <span className="text-14 font-bold text-default">{value}</span>
    </div>
  )
}
