'use client'

// Confirmation first, method second.
//
// The old flow made her pick a payment method before she had ever seen what she
// was paying — six cards, no total, no fees. This screen inverts that: the page
// states the bill, the admin fee and the total, and the method sits in the
// footer as a line she can change rather than a decision she must make. Poket
// is preselected because it is the method the app can settle instantly, so the
// common path is one tap.
//
// The picker itself is a sheet, not a page (§3 two-step flow): changing method
// is a detour off the confirmation, and coming back to a page she has already
// read is the wrong shape for it.

import { useState } from 'react'
import { BottomSheet, NavigationHeader } from '@/design-system/components'
import { ArrowRight, Coins, Wallet } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { METHODS, WEEKLY_BILL, rupiah, type MethodId } from '../lib/data'
import { IconAgent, methodIcon } from '../lib/method-icons'
import { chargeable, store, useApp } from '../lib/store'
import { FullWidthButton, IconTile, OptionCard, StickyBar } from '../lib/ui'

/** The one promo on offer in this prototype. */
const PROMO = 10300

export function KonfirmasiScreen() {
  const flow = useFlow()
  const s = useApp()
  const [sheetOpen, setSheetOpen] = useState(false)

  const method = METHODS.find((m) => m.id === s.method) ?? METHODS[0]
  const full = s.amount >= WEEKLY_BILL
  const total = chargeable(s)

  const pay = () => {
    if (method.id === 'poket') {
      if (s.poketBalance >= total) {
        store.setMethod('poket')
        store.payWithPoket()
        flow.go('success')
      } else {
        flow.go('poket-shortfall')
      }
    } else {
      flow.go('instruction')
    }
  }

  return (
    <Screen topBar={<NavigationHeader title="Konfirmasi" onBack={() => flow.go('amount')} />}>
      {/* The band names the transaction, so the rows under it can be pure
          numbers — no row has to repeat what is being paid for. */}
      <div className="-mx-16 -mt-16 flex items-center gap-12 bg-primary-50 px-16 py-16">
        <IconTile tint="primary" size={48}>
          <Wallet size={24} />
        </IconTile>
        <span className="text-18 font-bold text-default">Bayar angsuran</span>
      </div>

      <div className="flex flex-col">
        {full ? (
          <>
            <BillRow
              title="Pinjaman 1 • #23414"
              caption="Angsuran ke 4/40"
              value={rupiah(100000)}
            />
            <BillRow
              title="Pinjaman 2 • #28901"
              caption="Angsuran ke 2/40"
              value={rupiah(50000)}
            />
          </>
        ) : (
          <BillRow
            title="Angsuran minggu ini"
            caption="Pembayaran sebagian"
            value={rupiah(s.amount)}
          />
        )}
        <BillRow title="Biaya admin" value="Gratis" />
        {s.discount > 0 ? (
          <BillRow title="Diskon" value={`- ${rupiah(s.discount)}`} tone="green" />
        ) : null}
        <div className="flex items-center gap-12 py-12">
          <span className="flex-1 text-14 font-bold text-default">Total bayar</span>
          <span className="text-16 font-bold text-primary-500">{rupiah(total)}</span>
        </div>
      </div>

      <StickyBar>
        {/* Promo, then method, then the amount — read bottom-up, the button is
            the sum of the two lines above it. */}
        <button
          type="button"
          onClick={() => store.setDiscount(s.discount > 0 ? 0 : PROMO)}
          className={`flex items-center gap-12 rounded-12 px-12 py-8 text-left ${
            s.discount > 0 ? 'bg-green-50' : 'bg-blue-50'
          }`}
        >
          <span className={s.discount > 0 ? 'text-green-600' : 'text-blue-500'}>
            <Coins size={20} />
          </span>
          <span
            className={`flex-1 text-14 font-bold ${
              s.discount > 0 ? 'text-green-600' : 'text-blue-500'
            }`}
          >
            {s.discount > 0 ? `Diskon ${rupiah(PROMO)} dipakai` : `Gunakan diskon ${rupiah(PROMO)}`}
          </span>
          <span
            className={`flex h-24 w-24 items-center justify-center rounded-full text-neutral-white ${
              s.discount > 0 ? 'bg-green-500' : 'bg-blue-500'
            }`}
          >
            <ArrowRight size={16} />
          </span>
        </button>

        <div className="flex items-center gap-12 rounded-12 border border-default p-12">
          <IconTile tint={method.id === 'amartha-link' ? 'green' : 'primary'} size={32}>
            {method.id === 'amartha-link' ? <IconAgent size={20} /> : methodIcon(method.id, 20)}
          </IconTile>
          <span className="min-w-0 flex-1">
            <span className="block text-14 font-bold text-default">{method.name}</span>
            <span className="block text-12 text-caption">
              {method.id === 'poket' ? rupiah(s.poketBalance) : method.sub}
            </span>
          </span>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="shrink-0 text-12 font-bold text-primary-500"
          >
            Ubah
          </button>
        </div>

        <FullWidthButton onClick={pay}>Bayar {rupiah(total)}</FullWidthButton>
      </StickyBar>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Pilih metode pembayaran"
        slot={
          <div className="flex flex-col gap-8">
            {METHODS.map((m) => (
              <OptionCard
                key={m.id}
                selected={method.id === m.id}
                onClick={() => {
                  store.setMethod(m.id as MethodId)
                  setSheetOpen(false)
                }}
                leading={
                  <IconTile tint={m.id === 'amartha-link' ? 'green' : 'primary'} size={32}>
                    {m.id === 'amartha-link' ? <IconAgent size={20} /> : methodIcon(m.id, 20)}
                  </IconTile>
                }
                title={m.name}
                description={m.id === 'poket' ? rupiah(s.poketBalance) : m.sub}
              />
            ))}
          </div>
        }
      />
    </Screen>
  )
}

function BillRow({
  title,
  caption,
  value,
  tone = 'default',
}: {
  title: string
  caption?: string
  value: string
  tone?: 'default' | 'green'
}) {
  return (
    <div className="flex items-start gap-12 border-b border-light py-12">
      <span className="min-w-0 flex-1">
        <span className="block text-14 text-default">{title}</span>
        {caption ? <span className="mt-2 block text-12 text-caption">{caption}</span> : null}
      </span>
      <span
        className={`text-14 font-bold ${tone === 'green' ? 'text-green-600' : 'text-default'}`}
      >
        {value}
      </span>
    </div>
  )
}
