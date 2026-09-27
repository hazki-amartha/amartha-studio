'use client'

// Setor tunai — the agen road of the New Concept.
//
// Same two legs as the VA road, for the same reason: the entities reconcile
// separately, so the counter takes the cash against two numbers rather than
// one. What changes is everything under them — how the errand works, and WHERE
// the counters are, because this road ends at a desk she has to ride to.
//
// The counters are a page away, behind "Cari Agen Terdekat" — the list is the
// Agen Terdekat page's, so a counter reads identically wherever she meets it.
// Status, Perbarui Halaman, Batalkan setoran and Back work as on the VA road.

import { Button, NavigationHeader } from '@/design-system/components'
import { Wordmark } from '@/design-system/assets'
import { MapPin, RpHistory } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { AGENT } from '../lib/schedule'
import { SETOR_DEADLINE, CancelSetor, DeadlineNote, HowList, LegCard, setorLegs } from '../lib/setor'
import { store, unsettledTotal, useApp } from '../lib/store'
import { AppScreen, Collapsible } from '../lib/ui'

/** What the desk actually does, in her order of operations. */
const HOW_TO_PAY = [
  `Kunjungi Agen ${AGENT.name} terdekat.`,
  'Tunjukkan kode bayar di atas ke agen.',
  'Setor sesuai dengan nominal di atas.',
  `Minta bukti pembayaran berhasil ke agen ${AGENT.name}.`,
]

export function SetorAgenScreen() {
  const flow = useFlow()
  const s = useApp()

  const f = s.setorInFlight ?? {
    no: s.settlements.length + 1,
    amount: s.depositAmount ?? unsettledTotal(s),
    paid: 0,
  }
  const legs = setorLegs(f.no, f.amount)

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          title="Setor pembayaran"
          onBack={() => flow.go('today')}
          trailingIcons={[
            <button
              key="riwayat"
              type="button"
              aria-label="Riwayat pembayaran"
              onClick={() => flow.go('setor-riwayat')}
            >
              <RpHistory size={24} />
            </button>,
          ]}
        />
      }
    >
      <LegCard
        title={
          <>
            <span>Setor tunai ke Agen</span>
            <Wordmark name="amartha-link" height={12} />
          </>
        }
        amount={f.amount}
        legs={legs}
        paid={f.paid}
        onRefresh={() => store.refreshSetor()}
      />

      {f.paid < legs.length ? (
        <DeadlineNote>Setor sebelum {SETOR_DEADLINE} ke kedua VA di atas.</DeadlineNote>
      ) : null}

      <Collapsible title={`Cara setor tunai di Agen ${AGENT.name}`} defaultOpen>
        <HowList steps={HOW_TO_PAY} />
      </Collapsible>

      <Button variant="outline" className="w-full" onClick={() => flow.go('agent-locator')}>
        <span className="flex items-center justify-center gap-4">
          <MapPin size={16} />
          Cari Agen Terdekat
        </span>
      </Button>

      <CancelSetor
        disabled={f.paid > 0}
        onCancelled={() => {
          store.cancelSetor()
          flow.go('today')
        }}
      />
    </AppScreen>
  )
}
