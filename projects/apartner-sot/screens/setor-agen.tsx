'use client'

// Setor tunai — the agen road of the New Concept.
//
// Same two legs as the VA road, for the same reason: the entities reconcile
// separately, so the counter takes the cash against two numbers rather than
// one. What changes is everything under them — how the errand works, and WHERE
// the counters are, because this road ends at a desk she has to ride to.
//
// The agent list is `AgentList`, shared with the Agen Terdekat page so a
// counter reads identically wherever she meets it. Nothing in it leaves the
// prototype (CLAUDE.md §3): Whatsapp draws a sent state on the row, Buka Peta
// opens the drawn map page.

import { useState } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { Wordmark } from '@/design-system/assets'
import { RpHistory } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { AGENT } from '../lib/schedule'
import { AgentList } from '../lib/agent-list'
import { SETOR_DEADLINE, DeadlineNote, HowList, LegCard, setorLegs } from '../lib/setor'
import { store, unsettledTotal, useApp } from '../lib/store'
import { AppScreen, Collapsible, SectionTitle, StickyBar } from '../lib/ui'

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

  const amount = s.depositAmount ?? unsettledTotal(s)
  const no = s.settlements.length + 1
  const legs = setorLegs(no, amount)

  const [paid, setPaid] = useState<boolean[]>(() => legs.map(() => false))
  const markPaid = (i: number) => setPaid((prev) => prev.map((p, j) => (j === i ? true : p)))
  const allPaid = paid.every(Boolean)

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          title="Setor tunai"
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
      <LegCard
        title={
          <>
            <span>Setor tunai ke Agen</span>
            <Wordmark name="amartha-link" height={12} />
          </>
        }
        amount={amount}
        legs={legs}
        paid={paid}
        onPaid={markPaid}
        action="Saya sudah setor"
      />

      <DeadlineNote>Setor sebelum {SETOR_DEADLINE} ke VA yang sesuai.</DeadlineNote>

      <Collapsible title={`Cara setor tunai di Agen ${AGENT.name}`} defaultOpen>
        <HowList steps={HOW_TO_PAY} />
      </Collapsible>

      {/* The counters she can actually reach, nearest first. */}
      <SectionTitle>Agen terdekat</SectionTitle>
      <AgentList onMap={() => flow.go('agent-map')} />

      {allPaid ? (
        <StickyBar>
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              store.settle(false)
              flow.go('setor-riwayat')
            }}
          >
            Konfirmasi Setoran
          </Button>
        </StickyBar>
      ) : null}
    </AppScreen>
  )
}
