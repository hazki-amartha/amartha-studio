'use client'

// Card 2 — dana siap / disbursement. The exploration under test: the "bayar
// tepat waktu and this grows" projection is collapsed behind a disclosure
// rather than always-on, so the card leads with one number.

import { useState } from 'react'
import { Button, Card } from '@/design-system/components'
import { Chevron } from './icons'
import { CardHeader, Divider } from './ui'
import { PLAFON, outstandingFor, projection, rp, type LoanState } from './data'

export function DanaCard({ state, onPrimary }: { state: LoanState; onPrimary?: () => void }) {
  // Disclosure state is intentionally local: it should reset when the state
  // changes, so it does NOT belong in a module store (see CLAUDE.md §3).
  const [open, setOpen] = useState(false)

  const settled = state === 'settled'
  const outstanding = outstandingFor(state)

  if (state === 'late') {
    return (
      <Card className="bg-neutral-50">
        <CardHeader title="Dana Siap Untukmu" tone="text-neutral-700" />
        <Divider />
        <p className="text-12 text-neutral-700">
          Selesaikan tunggakanmu dulu. Pencairan akan tersedia lagi setelah pinjaman lancar.
        </p>
      </Card>
    )
  }

  const shown = settled ? PLAFON : PLAFON - outstanding

  return (
    <Card className={settled ? 'border-primary-200 bg-primary-50' : undefined}>
      <CardHeader title="Dana Siap Untukmu!" />
      <Divider />

      <p className={`text-24 font-bold ${settled ? 'text-primary-600' : 'text-default'}`}>
        {rp(shown)}
      </p>

      {settled ? (
        <p className="mt-4 text-12 text-neutral-700">
          Pinjaman lunas — plafon penuh siap dicairkan.
        </p>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="mt-4 flex w-full items-center gap-8 text-neutral-700"
            aria-expanded={open}
          >
            <span className="flex-1 text-left text-12">dari Total Limit: {rp(PLAFON)}</span>
            <Chevron open={open} />
          </button>

          <p className="mt-8 text-12 text-default">
            Bayar tepat waktu, jumlah ini <span className="font-bold">bertambah</span>:
          </p>

          {open ? (
            <div className="mt-8 rounded-8 bg-neutral-50 px-12">
              {projection(outstanding).map((row, i) => (
                <div
                  key={row.k}
                  className={`flex items-baseline justify-between py-8 ${
                    i ? 'border-t border-default' : ''
                  }`}
                >
                  <span
                    className={`text-12 ${row.strong ? 'font-bold text-primary-600' : 'text-neutral-700'}`}
                  >
                    {row.k}
                  </span>
                  <span
                    className={`text-12 font-bold ${row.strong ? 'text-primary-600' : 'text-default'}`}
                  >
                    {rp(row.v)}
                  </span>
                </div>
              ))}
              <p className="pb-8 text-12 text-disabled">Perkiraan jika kamu bayar tepat waktu.</p>
            </div>
          ) : null}
        </>
      )}

      <Button
        variant={settled ? 'primary' : 'secondary'}
        size="xl"
        className="mt-12 w-full"
        onClick={onPrimary}
      >
        {settled ? 'Ajukan Pencairan' : 'Ajukan Top-up'}
      </Button>
    </Card>
  )
}
