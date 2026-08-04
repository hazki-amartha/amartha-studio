'use client'

// Semua pencairan — every cycle Ibu Siti has taken, active first, settled below.
//
// Opened from the "Detail" link on her progress page: this is the loan-level
// view behind the weekly record — how long she has been with us and how the
// past cycles went, which is the evidence a top-up conversation leans on.
//
// The card layout follows the A-Partner "Semua pencairan" reference (identity on
// top, four facts in a 2×2, a DPD badge on the live cycle). Copied into this
// project rather than imported across it (CLAUDE.md §1).

import { Badge, Card, NavigationHeader } from '@/design-system/components'
import { MoneyBag, Warning } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { DISBURSEMENTS, dpdBucket, rupiah, type Disbursement } from '../lib/data'

export function PencairanScreen() {
  const flow = useFlow()
  const active = DISBURSEMENTS.filter((l) => l.status === 'aktif')
  const settled = DISBURSEMENTS.filter((l) => l.status === 'lunas')

  return (
    <Screen topBar={<NavigationHeader title="Semua pencairan" onBack={() => flow.back()} />}>
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
 * One cycle. Identity on top, then the four facts in a 2×2 — read as pairs (when
 * it started / how long it runs, how far in / what it costs a week), not scanned
 * down a column. A settled cycle keeps every number and loses only its colour.
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
          {/* The mark is on the bad state only: a warning beside a bucket is what
              makes one card in the list stop the eye. */}
          {done ? null : (
            <Badge
              intent={loan.dpd > 0 ? 'yellow' : 'green'}
              variant="outline"
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
