'use client'

// Her page. It began as the receipts behind the discipline claim — the ledger
// that earns the payout — and grew into the whole personal picture, because a
// mitra opening it wants two different things and used to have to go elsewhere
// for one of them: how her loan stands, and how she has been keeping up.
//
// So the page reads top to bottom as: what she has (limit, and what is left of
// it), what she can do about it right now (draw the remainder, pay the week),
// and then the record that justifies both. The ledger keeps the bottom of the
// page rather than the top: it is the evidence, not the headline.
//
// The two middle blocks are the SAME components home draws (lib/tasks), not
// copies of them, so the two screens cannot disagree about what is owed or what
// is claimable.

import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { HISTORY, LOAN_DRAWN, LOAN_LIMIT, claimableOf, rupiah } from '../lib/data'
import { store, useApp } from '../lib/store'
import { BayarButton, BillLine, PayoutTile, Task, billStatus } from '../lib/tasks'
import { Meter } from '../lib/ui'
import { WeekGrid } from '../lib/week-tiles'

export function RiwayatScreen() {
  const flow = useFlow()
  const s = useApp()

  const total = HISTORY.length
  const bayarCount = HISTORY.filter((e) => e.bayar).length
  const kumpulanCount = HISTORY.filter((e) => e.kumpulan).length

  const claimable = claimableOf(s.journeyPhase)

  const goToPayment = () => {
    store.startPayment()
    flow.go('amount')
  }

  return (
    <Screen
      canvas="white"
      topBar={<NavigationHeader title="Ibu Siti" onBack={() => flow.go('home')} />}
    >
      {/* What is LEFT leads, not the limit: the headline figure should be the
          one she can act on, and "Terpakai" underneath supplies the context
          that makes it mean something. */}
      <div>
        <p className="text-14 text-caption">Sisa Limit Pinjaman</p>
        <p className="mt-2 text-24 font-bold text-default">{rupiah(LOAN_LIMIT - LOAN_DRAWN)}</p>
        <p className="mt-4 text-14 text-caption">
          Terpakai (<span className="font-bold text-default">{rupiah(LOAN_DRAWN)}</span> /{' '}
          {rupiah(LOAN_LIMIT)})
        </p>
        <div className="mt-8">
          <Meter percent={(LOAN_DRAWN / LOAN_LIMIT) * 100} />
        </div>
      </div>

      {/* The two things she can do about the numbers above, in the order the
          money moves: take what is open, then settle what is due. */}
      {claimable?.amount ? (
        <PayoutTile amount={claimable.amount} onCairkan={() => flow.go('disburse-amount')} />
      ) : null}

      <div className="rounded-12 border border-default p-12">
        <Task
          status={billStatus(s)}
          title="Bayar angsuran"
          description={<BillLine />}
          action={<BayarButton onPay={goToPayment} />}
        />
      </div>

      <div className="flex gap-12">
        <Summary label="Bayar tepat waktu" value={`${bayarCount}/${total}`} tone="green" />
        <Summary label="Hadir kumpulan" value={`${kumpulanCount}/${total}`} tone="primary" />
      </div>

      {/* HISTORY is already newest-first, so this week takes the first tile. */}
      <WeekGrid title="Riwayat mingguan" weeks={HISTORY} highlightWeek={HISTORY[0]?.week} />
    </Screen>
  )
}

function Summary({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'green' | 'primary'
}) {
  const toneClass =
    tone === 'green' ? 'bg-green-50 text-green-500' : 'bg-primary-50 text-primary-500'
  return (
    <div className={`flex-1 rounded-12 p-16 ${toneClass}`}>
      <p className="text-12 font-regular">{label}</p>
      <p className="mt-4 text-24 font-bold">{value}</p>
    </div>
  )
}
