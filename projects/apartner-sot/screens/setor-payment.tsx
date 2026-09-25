'use client'

// Setor pembayaran — the New Concept's front door, reached from the Setor
// button on the schedule.
//
// The difference from the older Setoran screen is what it asks FIRST. That one
// opened on the picker: every source of cash, ticked, waiting to be read before
// she could get to the method. This one assumes the common case — the whole bag
// goes down — states the figure once, and asks the only question left: which
// road. Splitting the handover is still there, as a text link under the button,
// because it is the rarer answer and it costs a page rather than a screenful of
// checkboxes on the way to the road.

import { NavigationHeader } from '@/design-system/components'
import { Button } from '@/design-system/components'
import { MapPin, RpHistory } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { AGENT, TASKS } from '../lib/schedule'
import { SetorSummary } from '../lib/setor'
import { store, unsettledEntries, unsettledTotal, useApp } from '../lib/store'
import { AppScreen, OptionCard, SectionTitle, StickyBar } from '../lib/ui'

export function SetorPaymentScreen() {
  const flow = useFlow()
  const s = useApp()

  const entries = unsettledEntries(s)
  // What she is settling: whatever the partial page left behind, or the whole
  // bag when she has not been there.
  const amount = s.depositAmount ?? unsettledTotal(s)
  const no = s.settlements.length + 1

  const kindOf = (taskId: string) => TASKS.find((t) => t.id === taskId)?.kind
  const pelayanan = entries.filter((e) => kindOf(e.taskId) === 'majelis').length
  const homeVisit = entries.filter((e) => kindOf(e.taskId) === 'home-visit').length

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          title="Setor pembayaran"
          onBack={() => flow.back()}
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
      <SetorSummary no={no} amount={amount} pelayanan={pelayanan} homeVisit={homeVisit} />

      {/* --- Which road. Just the choice: the numbers each road settles to
          live on the road's own page, where she is actually paying them. */}
      <SectionTitle>Pilih metode pembayaran</SectionTitle>
      <div className="flex flex-col gap-8">
        <OptionCard
          selected={s.depositMethod === 'agent'}
          title={`Agen ${AGENT.name}`}
          description="Setor tunai ke agen terdekat pakai kode unik"
          onSelect={() => store.setDepositMethod('agent')}
        >
          {/* Where to walk the cash to is a question she may want answered
              BEFORE she commits to this road at all — there has to be a counter
              on her route for it to be the right one. */}
          <button
            type="button"
            onClick={() => flow.go('agent-locator')}
            className="flex items-center justify-center gap-4 rounded-full border border-primary-500 py-8 text-12 font-bold text-primary-500"
          >
            <MapPin size={16} />
            Cari Agen Terdekat
          </button>
        </OptionCard>

        <OptionCard
          selected={s.depositMethod === 'va'}
          title="Virtual Account"
          description="Setor lewat mobile banking ke 2 VA cabang"
          onSelect={() => store.setDepositMethod('va')}
        />
      </div>

      <StickyBar>
        <Button
          size="lg"
          className="w-full"
          disabled={!s.depositMethod || amount <= 0}
          onClick={() => {
            store.setDepositAmount(amount)
            flow.go(s.depositMethod === 'agent' ? 'setor-agen' : 'setor-va')
          }}
        >
          Setor {rupiah(amount)}
        </Button>
        {/* The rarer answer, and deliberately quiet: a BP who wants to hold
            some of the bag back knows she does, and everyone else should reach
            the road in one tap. */}
        <button
          type="button"
          onClick={() => flow.go('setor-partial')}
          className="text-center text-12 font-bold text-link"
        >
          Setor sebagian
        </button>
      </StickyBar>
    </AppScreen>
  )
}
