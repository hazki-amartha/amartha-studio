'use client'

// Card 1 — the active loan. Carries the lifecycle: berjalan → terlambat → lunas.

import { Button, Card } from '@/design-system/components'
import { WarningCircle } from './icons'
import { CardHeader, Divider, Notice } from './ui'
import { WEEKLY, rp, type LoanState } from './data'

const TITLE: Record<LoanState, string> = {
  ontrack: 'Pinjamanmu Berjalan Lancar!',
  settled: 'Pinjaman Kamu Lunas!',
  late: 'Angsuranmu Terlambat',
}

export function LoanCard({ state, onPrimary }: { state: LoanState; onPrimary?: () => void }) {
  const late = state === 'late'
  const settled = state === 'settled'

  return (
    <Card>
      <CardHeader title={TITLE[state]} tone={late ? 'text-red-500' : 'text-primary-600'} />
      <Divider />

      {settled ? (
        <p className="text-14 text-neutral-700">
          Tidak ada angsuran berjalan. Kamu bisa ajukan pinjaman baru kapan saja.
        </p>
      ) : (
        <>
          <p className="text-12 text-neutral-700">Angsuran per minggu</p>
          <p className="text-20 font-bold text-default">{rp(WEEKLY)}</p>

          {late ? (
            <Notice icon={<WarningCircle />}>
              <span className="font-bold">Terlambat 5 hari.</span> Segera bayar agar pinjamanmu
              tetap lancar.
            </Notice>
          ) : null}
        </>
      )}

      <Divider />

      <div className="flex items-center justify-between gap-12">
        {settled ? (
          <p className="text-12 text-neutral-700">Riwayat pembayaranmu lancar</p>
        ) : (
          <div>
            <p className="text-10 font-bold uppercase text-neutral-700">Jadwal Pembayaran</p>
            <p className={`text-14 font-bold ${late ? 'text-red-500' : 'text-default'}`}>
              {late ? '9 Agu 2024 · Lewat' : '19 Agu 2024'}
            </p>
          </div>
        )}
        <Button
          variant={settled || late ? 'primary' : 'secondary'}
          size="md"
          onClick={onPrimary}
        >
          {settled ? 'Ajukan Pinjaman' : 'Bayar Sekarang'}
        </Button>
      </div>
    </Card>
  )
}
