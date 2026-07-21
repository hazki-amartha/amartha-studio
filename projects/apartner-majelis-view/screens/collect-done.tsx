'use client'

// Pembayaran diterima — the receipt.
//
// A confirmation screen after every collection is a real cost: it is one more
// tap on a queue the BP runs 22 times. It earns its place here for one reason —
// cash. The BP has just taken physical money from a woman who will ask her to
// confirm what was counted, and a queue that silently absorbed the amount would
// leave both of them without a moment where the figure was stated and agreed.
//
// So it reads back three numbers and nothing else: what was owed, what was paid,
// what is left. The remaining balance is the one that matters and it is not
// softened — a mitra who has just handed over Rp300.000 against Rp650.000 should
// see the Rp350.000 while the BP is still standing there, not discover it next
// week.

import { Button, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findMitra, rupiah } from '../lib/data'
import { IconCheck } from '../lib/icons'
import { useApp } from '../lib/store'
import { StatRows, StickyBar } from '../lib/ui'

export function CollectDoneScreen() {
  const flow = useFlow()
  const s = useApp()

  const receipt = s.lastCollect
  const mitra = findMitra(receipt?.mitraId ?? s.openMitra)
  const owed = receipt?.owed ?? 0
  const paid = receipt?.paid ?? 0
  const left = Math.max(0, owed - paid)

  return (
    <Screen topBar={<NavigationHeader title="Pembayaran Diterima" hideBack />}>
      <div className="flex flex-col items-center gap-8 py-24 text-center">
        <span className="flex h-48 w-48 items-center justify-center rounded-full bg-green-50 text-green-500">
          <IconCheck size={24} />
        </span>
        <span className="text-24 font-bold text-default">{rupiah(paid)}</span>
        <span className="text-14 text-caption">diterima dari {mitra.name}</span>
      </div>

      <StatRows
        rows={[
          { label: 'Total tagihan', value: rupiah(owed) },
          { label: 'Dibayar sekarang', value: rupiah(paid), tone: 'green' },
          {
            label: 'Sisa tunggakan',
            value: rupiah(left),
            tone: left === 0 ? 'green' : 'red',
          },
        ]}
      />

      {left > 0 ? (
        <p className="text-12 text-caption">
          Sisa {rupiah(left)} tetap tercatat sebagai tunggakan dan akan muncul lagi minggu depan.
        </p>
      ) : (
        <p className="text-12 text-caption">
          Tagihan {mitra.name} lunas — termasuk minggu-minggu yang sebelumnya terlewat.
        </p>
      )}

      <StickyBar>
        <Button size="lg" className="w-full" onClick={() => flow.go('collection')}>
          Kembali ke Daftar
        </Button>
      </StickyBar>
    </Screen>
  )
}
