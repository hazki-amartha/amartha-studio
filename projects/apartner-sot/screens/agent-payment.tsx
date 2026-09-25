'use client'

// Setor tunai — the agent road's own page, reached by tapping Lanjut on the
// settlement screen with "Setor tunai ke Agen" picked.
//
// It replaces the proof BOTTOM SHEET that used to open there. A sheet was the
// wrong container for this step: the kode bayar is a number the BP reads out at
// a counter she has not walked to yet, so the screen holding it has to survive
// her putting the phone in her pocket, riding somewhere, and coming back. A
// sheet is a thing you finish or dismiss; this is a thing she leaves open.
//
// Three blocks, in the order the errand happens:
//
//   1. THE NUMBER — what she owes and the kode bayar she says at the desk, with
//      Salin for the agent who would rather be shown it. The "sudah setor?" row
//      underneath is the way back IN once the cash is across the counter.
//   2. HOW — the steps, collapsed, for a BP doing this for the first time.
//   3. WHERE — the counters near today's route, each with how far, how fresh,
//      and the two ways to reach it.
//
// The WHERE block is `AgentList`, shared with the Agen Terdekat page so a
// counter reads identically in both places. Nothing in it leaves the prototype
// (CLAUDE.md §3): Whatsapp draws a sent state on the row, and Buka Peta opens
// the drawn map page rather than handing the viewer to an app the demo laptop
// may not have.

import { useState } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { Wordmark } from '@/design-system/assets'
import {
  ArrowRight,
  Camera,
  CheckCircleFill,
  ChecklistDocFill,
  Copy,
} from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { AGENT, agentCodeFor } from '../lib/schedule'
import { AgentList } from '../lib/agent-list'
import { store, unsettledTotal, useApp } from '../lib/store'
import { AppScreen, Collapsible, SectionTitle, StickyBar } from '../lib/ui'

/** What the desk actually does, in her order of operations. */
const HOW_TO_PAY = [
  'Datangi salah satu agen AmarthaLink di bawah.',
  'Sebutkan atau tunjukkan Kode Bayar di atas.',
  'Serahkan uang tunai sesuai jumlah yang tertera.',
  'Minta struk dari agen, lalu kirim fotonya lewat tombol di halaman ini.',
]

export function AgentPaymentScreen() {
  const flow = useFlow()
  const s = useApp()

  // The figure she ticked on the settlement screen, parked in the store on the
  // way here — a screen remounts on every navigation, so the picked nominal
  // cannot ride along in local state. Falls back to the whole bag for anyone
  // who lands on this screen from the flow view rather than through Lanjut.
  const amount = s.depositAmount ?? unsettledTotal(s)
  const code = agentCodeFor(s.settlements.length + 1)

  // The struk. Local, because it is captured minutes before the bag settles and
  // the screen navigates away — it never needs to survive a trip.
  const [proof, setProof] = useState(false)
  const [copied, setCopied] = useState(false)

  const copy = () => {
    setCopied(true)
    navigator.clipboard?.writeText(code).catch(() => {})
  }

  return (
    <AppScreen
      topBar={<NavigationHeader title="Setor Tunai via Agen" onBack={() => flow.back()} />}
    >
      {/* --- 1. THE NUMBER ---------------------------------------------------
          One card carrying the whole transaction: who it is with, how much, and
          the code that identifies it. The amount sits above the code rather
          than beside it because at the counter she says them in that order. */}
      <div className="flex flex-col gap-12 rounded-16 border border-default bg-neutral-white p-12">
        <div className="flex flex-col items-center gap-4">
          <span className="flex items-center gap-4">
            <span className="text-14 text-default">Bayar di Agen</span>
            <Wordmark name="amartha-link" height={12} />
          </span>
          <span className="text-20 font-bold text-default">{rupiah(amount)}</span>
        </div>

        <div className="flex items-center gap-12 rounded-8 border border-default p-12">
          <span className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="truncate text-12 text-default">Kode Bayar</span>
            <span className="truncate text-14 font-bold text-default">{code}</span>
          </span>
          <Button variant="outline" size="xs" onClick={copy}>
            <span className="flex items-center gap-2">
              <Copy size={16} />
              {copied ? 'Tersalin' : 'Salin'}
            </span>
          </Button>
        </div>

        <span className="border-t border-default" />

        {/* The way back in. This is the only control on the page that changes
            anything: the cash is already across the counter by the time she
            taps it, so it captures the struk rather than asking her to confirm
            something she has not done yet. */}
        <button
          type="button"
          onClick={() => setProof(!proof)}
          className={`flex items-center gap-12 rounded-8 border p-12 text-left ${
            proof ? 'border-green-500 bg-green-50' : 'border-default'
          }`}
        >
          <span className={`shrink-0 ${proof ? 'text-green-500' : 'text-primary-500'}`}>
            {proof ? <CheckCircleFill size={20} /> : <ChecklistDocFill size={20} />}
          </span>
          <span
            className={`min-w-0 flex-1 truncate text-12 font-bold ${
              proof ? 'text-green-500' : 'text-link'
            }`}
          >
            {proof ? 'Bukti setor tersimpan' : 'Sudah setor? Kirim bukti setor di sini'}
          </span>
          <span className="shrink-0 text-disabled">
            {proof ? <Camera size={20} /> : <ArrowRight size={20} />}
          </span>
        </button>
      </div>

      {/* --- 2. HOW ---------------------------------------------------------
          Collapsed, because a BP on her tenth handover does not read it and a
          BP on her first cannot do this without it. */}
      <Collapsible title={`Cara bayar di Agen ${AGENT.name}`}>
        <ol className="flex flex-col gap-8">
          {HOW_TO_PAY.map((step, i) => (
            <li key={step} className="flex gap-8">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-50 text-12 font-bold text-primary-500">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 text-12 text-default">{step}</span>
            </li>
          ))}
        </ol>
      </Collapsible>

      {/* --- 3. WHERE -------------------------------------------------------
          The counters she can actually reach, nearest first — the same card the
          Agen Terdekat page is made of, so a counter reads identically whether
          she meets it here or looks it up on its own. */}
      <SectionTitle>Agen terdekat</SectionTitle>
      <AgentList onMap={() => flow.go('agent-map')} />

      {/* Only once there is a struk. Before that the page has nothing to
          confirm — the money has not moved — so a button here would be asking
          her to claim something she has not done. */}
      {proof ? (
        <StickyBar>
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              store.settle(false)
              flow.go('today')
            }}
          >
            Konfirmasi Setoran
          </Button>
        </StickyBar>
      ) : null}
    </AppScreen>
  )
}
