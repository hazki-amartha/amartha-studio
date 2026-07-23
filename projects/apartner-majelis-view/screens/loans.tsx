'use client'

// Semua Pencairan — every cycle she has taken, active first, settled below.
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

import { Badge, Card, NavigationHeader } from '@/design-system/components'
import { MoneyBag, Warning } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findMitra, rupiah } from '../lib/data'
import { dpdBucket, loansOf, type Disbursement } from '../lib/loans'
import { useApp } from '../lib/store'

export function LoansScreen() {
  const flow = useFlow()
  const s = useApp()

  const mitra = findMitra(s.openMitra)
  const loans = loansOf(mitra)
  const active = loans.filter((l) => l.status === 'aktif')
  const settled = loans.filter((l) => l.status === 'lunas')

  return (
    <Screen
      topBar={<NavigationHeader title="Semua pencairan" onBack={() => flow.back()} />}
    >
      <div className="flex items-center gap-8">
        <h2 className="flex-1 text-16 font-bold text-default">Pencairan Aktif</h2>
        <span className="text-12 text-caption">{active.length} pencairan</span>
      </div>
      <div className="flex flex-col gap-12">
        {active.map((loan) => (
          <LoanCard key={loan.id} loan={loan} />
        ))}
      </div>

      {settled.length > 0 ? (
        <>
          <h2 className="text-16 font-bold text-default">Pencairan Lunas</h2>
          <div className="flex flex-col gap-12 pb-16">
            {settled.map((loan) => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        </>
      ) : null}
    </Screen>
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
 */
function LoanCard({ loan }: { loan: Disbursement }) {
  const done = loan.status === 'lunas'

  return (
    <Card>
      <div className="flex flex-col gap-12">
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
            <span className="truncate text-12 text-caption">Loan ID: {loan.id}</span>
          </div>
          {done ? null : (
            <Badge
              intent={loan.dpd > 0 ? 'yellow' : 'green'}
              variant="outline"
              // The mark is on the bad state only. A tick beside "Lancar" would
              // be decoration; a warning beside a bucket is the thing that makes
              // one card in a list of four stop the eye.
              leadingIcon={loan.dpd > 0 ? <Warning size={16} /> : undefined}
            >
              {dpdBucket(loan.dpd)}
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-12 border-t border-default pt-12">
          <div className="flex gap-12">
            <Fact label="Tanggal cair" value={loan.cairDate} />
            <Fact label="Tenor" value={`${loan.tenor} minggu`} />
          </div>
          <div className="flex gap-12">
            <Fact label="Progres" value={`${loan.paidCount}/${loan.tenor} angsuran`} />
            <Fact label="Angsuran per minggu" value={rupiah(loan.weekly)} />
          </div>
        </div>
      </div>
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
