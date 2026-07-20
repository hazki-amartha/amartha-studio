'use client'

import { useState } from 'react'
import { Button, Card } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { TITIP } from '../lib/data'
import { IconCheck, IconX } from '../lib/icons'

export function TitipBayarScreen() {
  const flow = useFlow()
  const [paid, setPaid] = useState(false)

  const header = (
    <header className="flex items-center gap-8 border-b border-default bg-neutral-white px-16 py-12">
      <button type="button" onClick={flow.back} className="-ml-4 flex shrink-0 text-default">
        <IconX size={24} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-16 font-bold text-default">Setor titip bayar</p>
        <p className="text-12 text-caption">Batas setor {TITIP.due}</p>
      </div>
    </header>
  )

  if (paid) {
    return (
      <Screen topBar={header}>
        <Card className="flex flex-col items-center py-20 text-center">
          <span className="mb-12 flex h-48 w-48 items-center justify-center rounded-full bg-green-50 text-green-600">
            <IconCheck size={24} />
          </span>
          <p className="text-16 font-bold text-default">Setoran dikonfirmasi</p>
          <p className="mt-4 text-12 text-caption">
            {TITIP.total} sedang diverifikasi. Kamu akan dapat notifikasi bila sudah masuk.
          </p>
          <Button className="mt-16 w-full" onClick={flow.back}>
            Selesai
          </Button>
        </Card>
      </Screen>
    )
  }

  return (
    <Screen topBar={header}>
      <Card>
        <p className="text-12 text-caption">Total titip bayar</p>
        <p className="mt-2 text-24 font-bold text-default">{TITIP.total}</p>
        <p className="mt-2 text-10 text-disabled">Dari {TITIP.items.length} setoran mitra</p>
      </Card>

      <section className="flex flex-col gap-8">
        <h2 className="text-10 font-bold uppercase tracking-wide text-disabled">Nomor Virtual Account</h2>
        <Card>
          <div className="flex items-center gap-8">
            <div className="min-w-0 flex-1">
              <p className="text-10 text-caption">{TITIP.bank}</p>
              <p className="mt-2 text-16 font-bold tracking-wide text-default">{TITIP.va}</p>
            </div>
            <button type="button" className="shrink-0 text-12 font-bold text-link">
              Salin
            </button>
          </div>
        </Card>
      </section>

      <section className="flex flex-col gap-8 pb-16">
        <h2 className="text-10 font-bold uppercase tracking-wide text-disabled">Rincian setoran mitra</h2>
        <Card flush>
          {TITIP.items.map((it, i) => (
            <div key={it.n} className={`flex items-center gap-8 px-12 py-12 ${i === 0 ? '' : 'border-t border-light'}`}>
              <div className="min-w-0 flex-1">
                <p className="text-12 font-bold text-default">{it.n}</p>
                <p className="mt-2 text-10 text-caption">{it.m}</p>
              </div>
              <span className="text-12 font-bold text-default">{it.a}</span>
            </div>
          ))}
          <div className="flex border-t border-default bg-neutral-50 px-12 py-12">
            <span className="flex-1 text-12 font-bold text-neutral-700">Total</span>
            <span className="text-12 font-bold text-default">{TITIP.total}</span>
          </div>
        </Card>

        <Button className="mt-4 w-full" onClick={() => setPaid(true)}>
          Saya sudah setor
        </Button>
        <p className="text-center text-10 text-disabled">Tekan setelah kamu transfer ke VA di atas dari aplikasi bank kamu.</p>
      </section>
    </Screen>
  )
}
