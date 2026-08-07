'use client'

// Evening briefing — the meeting that CLOSES the branch day with the seven BPs.
//
// The mirror of the morning one, and deliberately the same machine: the same
// four-step bar, the same per-BP sections, the same Kembali / Lanjut footer. A
// BM runs both from the same handset an hour apart, so a second shape for the
// same meeting would be a second thing to learn.
//
// What differs is the tense. The morning briefing hands out a plan — targets,
// stops, who is going where. This one reads back what happened, so every figure
// on it is a PAIR: awal hari beside setelah closing. A DPD bucket standing at
// 19 tonight says nothing on its own; that it opened at 21 is the whole
// conversation.
//
// Four steps, in the order the day is accounted for: what got DONE, then the
// money that came IN, then the money that went OUT, then sales. Sales is empty —
// its spec is the next conversation, and drawing a guess at it would answer a
// question nobody has asked yet.

import { useState } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import {
  DisbursementStep,
  RepaymentStep,
  SalesStep,
  TaskCompletionStep,
} from '../lib/briefing-evening'
import { BRIEFINGS } from '../lib/schedule'
import { store } from '../lib/store'
import { AppScreen, StageBar, StickyBar, VisitTitle } from '../lib/ui'

const STEPS = [
  { id: 'tugas', label: 'Tugas' },
  { id: 'repayment', label: 'Repayment' },
  { id: 'disbursement', label: 'Disbursement' },
  { id: 'sales', label: 'Sales' },
] as const

export function BriefingEveningScreen() {
  const flow = useFlow()
  const briefing = BRIEFINGS[1]
  const [step, setStep] = useState(1)

  const stepId = STEPS[step - 1].id
  const isLast = step === STEPS.length

  function back() {
    if (step > 1) setStep(step - 1)
    else flow.go('today')
  }
  function next() {
    if (step < STEPS.length) setStep(step + 1)
  }
  function finish() {
    store.finishBriefing(briefing.id)
    flow.go('today')
  }

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={briefing.name} when={`${briefing.time} · ${briefing.place}`} />}
          onBack={back}
        />
      }
    >
      <StageBar current={step} labels={STEPS.map((s) => s.label)} />

      {/* No step heading above the sections. Each section is titled with whose
          numbers it is — the branch, then a BP — so a "Tugas selesai" over them
          would be a heading nobody reads twice. Sales has no sections yet, so
          it carries its own empty state instead. */}
      {stepId === 'tugas' ? <TaskCompletionStep /> : null}
      {stepId === 'repayment' ? <RepaymentStep /> : null}
      {stepId === 'disbursement' ? <DisbursementStep /> : null}
      {stepId === 'sales' ? <SalesStep /> : null}

      <StickyBar>
        <div className="flex gap-8">
          <Button variant="outline" size="lg" className="flex-1" onClick={back}>
            Kembali
          </Button>
          <Button size="lg" className="flex-1" onClick={isLast ? finish : next}>
            {isLast ? 'Selesaikan Briefing' : 'Lanjut'}
          </Button>
        </div>
      </StickyBar>
    </AppScreen>
  )
}
