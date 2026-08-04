'use client'

// How much to pay. The screen's real subject is the partial payment.
//
// "Sesuai tagihan" is trivial; the option that needs designing is the one where
// she cannot pay in full, and the helper line under the field is what does the
// work — it names the shortfall as a tunggakan BEFORE she commits, so a partial
// payment is a choice she made rather than a surprise she discovers on the home
// screen next week.
//
// The field caps at the outstanding amount: overpaying a weekly instalment is
// not a thing this flow supports, and silently clamping is kinder than an error.

import { useState } from 'react'
import { Badge, BottomSheet, NavigationHeader } from '@/design-system/components'
import { ChevronRight } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BILL_DUE, rupiah } from '../lib/data'
import { outstanding, store, useApp } from '../lib/store'
import { FullWidthButton, Meter, OptionCard, SectionTitle, StickyBar } from '../lib/ui'

type Mode = 'full' | 'custom'

export function AmountScreen() {
  const flow = useFlow()
  const s = useApp()
  const cap = outstanding(s)

  const [mode, setMode] = useState<Mode>('custom')
  const [custom, setCustom] = useState(0)
  const [detailOpen, setDetailOpen] = useState(false)

  const effective = mode === 'full' ? cap : custom

  let helper = 'Minimal Rp10.000'
  let helperError = false
  let canContinue = false

  if (mode === 'full') {
    helper = ''
    canContinue = true
  } else if (!custom) {
    helper = 'Minimal Rp10.000'
  } else if (custom < 10000) {
    helper = 'Jumlah minimal Rp10.000'
    helperError = true
  } else if (custom < cap) {
    helper = `Sisa ${rupiah(cap - custom)} akan menjadi tunggakan`
    canContinue = true
  } else {
    helper = 'Bayar penuh — tagihan lunas'
    canContinue = true
  }

  const headline = mode === 'full' ? cap : custom > 0 ? custom : cap

  return (
    <Screen topBar={<NavigationHeader title="Bayar angsuran" onBack={() => flow.go('home')} />}>
      <AutodebitBanner
        on={s.autodebit}
        short={s.poketBalance < cap}
        onEnable={() => store.setAutodebit(true)}
        onTopUp={() => {
          store.goTopUp('amount')
          flow.go('topup')
        }}
      />

      <div className="rounded-12 border border-default bg-neutral-white p-20 text-center">
        <p className="text-12 text-caption">Tagihan minggu ini</p>
        <p className="my-4 text-24 font-bold text-default">{rupiah(headline)}</p>
        <p className="text-12 text-caption">
          {s.paidAmount > 0
            ? `Sisa tunggakan • Jatuh tempo ${BILL_DUE}`
            : `Jatuh tempo ${BILL_DUE}`}
        </p>
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className="mt-12 inline-flex items-center gap-4 text-12 font-bold text-primary-500"
        >
          Detail tagihan <ChevronRight size={16} />
        </button>
      </div>

      <SectionTitle>Pilih jumlah pembayaran</SectionTitle>

      <OptionCard
        selected={mode === 'full'}
        onClick={() => setMode('full')}
        title="Sesuai tagihan"
        description={rupiah(cap)}
      />

      <OptionCard
        selected={mode === 'custom'}
        onClick={() => setMode('custom')}
        title="Bayar jumlah lain"
        description="Minimum Rp10.000"
      >
        {mode === 'custom' ? (
          <>
            <div className="mt-12 flex items-center gap-8 rounded-8 border border-default bg-neutral-white p-8">
              <span className="rounded-4 bg-neutral-50 px-8 py-4 text-14 font-bold text-caption">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                aria-label="Jumlah pembayaran"
                value={custom > 0 ? custom.toLocaleString('id-ID') : ''}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const num = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0
                  setCustom(Math.min(num, cap))
                }}
                className="min-w-0 flex-1 bg-transparent text-18 font-bold text-default outline-none"
              />
            </div>
            <div className={`mt-4 text-12 ${helperError ? 'text-red-500' : 'text-caption'}`}>
              {helper}
            </div>
          </>
        ) : null}
      </OptionCard>

      <StickyBar>
        <FullWidthButton
          disabled={!canContinue}
          onClick={() => {
            store.setAmount(effective)
            flow.go('konfirmasi')
          }}
        >
          Lanjut
        </FullWidthButton>
      </StickyBar>

      {/* Two loans, one weekly bill. The sheet exists because the total on the
          card above is a sum the mitra never agreed to as a single number — she
          took out two loans, and this is where that reconciles. */}
      <BottomSheet
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Detail tagihan minggu ini"
        description={`Jatuh tempo ${BILL_DUE}`}
        slot={
          <div className="flex flex-col gap-8">
            <LoanCard
              name="Pinjaman 1"
              id="#23414"
              amount="Rp100.000"
              percent={(4 / 40) * 100}
              caption="Angsuran ke-4 dari 40 minggu"
              remaining="Rp4.000.000 sisa pokok"
            />
            <LoanCard
              name="Pinjaman 2"
              id="#28901"
              amount="Rp50.000"
              percent={(2 / 40) * 100}
              caption="Angsuran ke-2 dari 40 minggu"
              remaining="Rp1.900.000 sisa pokok"
            />
            <div className="flex items-center gap-12 rounded-12 bg-primary-50 p-12">
              <span className="flex-1 text-14 font-bold text-default">
                Total tagihan minggu ini
              </span>
              <span className="text-16 font-bold text-primary-500">Rp150.000</span>
            </div>
          </div>
        }
      />
    </Screen>
  )
}

// The band above the bill. Autodebit is a standing arrangement, not a payment
// method, so it belongs here — before she picks an amount — rather than beside
// Poket in the method sheet.
//
// Three readings, because "on" is not one state: armed and funded is a promise
// the app can keep, and armed with an empty wallet is a promise it can't. The
// second one leads with the fix (Top-up) instead of the date, since a date it
// cannot honour is the least useful thing to state.
function AutodebitBanner({
  on,
  short,
  onEnable,
  onTopUp,
}: {
  on: boolean
  /** Poket cannot cover this week's bill, so the pull would fail. */
  short: boolean
  onEnable: () => void
  onTopUp: () => void
}) {
  return (
    <div className="-mx-16 -mt-16 bg-blue-50 px-16 py-12">
      <div className="flex items-center gap-12">
        <span className="flex-1 text-14 font-bold text-default">
          {on ? 'Autodebit' : 'Aktifkan pembayaran Autodebit'}
        </span>
        {on ? (
          <Badge intent="green" variant="subtle" size="sm">
            Sudah aktif
          </Badge>
        ) : null}
      </div>
      <p className="mt-2 text-12 text-caption">
        {!on ? (
          <>
            Bisa bayar otomatis dari saldo Poket.{' '}
            <BannerLink onClick={onEnable}>Aktifkan</BannerLink>
          </>
        ) : short ? (
          <>
            Saldo Poket kurang. <BannerLink onClick={onTopUp}>Top-up</BannerLink>
          </>
        ) : (
          `Penarikan akan dilakukan ${BILL_DUE}`
        )}
      </p>
    </div>
  )
}

/** The one inline link in the banner — underlined, because it sits inside a
 *  sentence and colour alone is not enough to read as tappable there. */
function BannerLink({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button type="button" onClick={onClick} className="font-bold text-primary-500 underline">
      {children}
    </button>
  )
}

function LoanCard({
  name,
  id,
  amount,
  percent,
  caption,
  remaining,
}: {
  name: string
  id: string
  amount: string
  percent: number
  caption: string
  remaining: string
}) {
  return (
    <div className="rounded-12 border border-default p-12">
      <div className="mb-8 flex items-start gap-12">
        <div className="min-w-0 flex-1">
          <div className="text-14 font-bold text-default">{name}</div>
          <div className="mt-2 text-12 text-caption">{id}</div>
        </div>
        <div className="text-16 font-bold text-primary-500">{amount}</div>
      </div>
      <Meter percent={percent} />
      <div className="mt-8 flex gap-8 text-10 text-caption">
        <span className="flex-1">{caption}</span>
        <span className="font-bold">{remaining}</span>
      </div>
    </div>
  )
}
