'use client'

// Evening briefing — the meeting that CLOSES the branch day with the seven BPs.
//
// The mirror of the morning one, and deliberately the same machine: the same
// register, the same stage bar, the same Kembali / Lanjut footer, the same
// closing photo. A BM runs both from the same handset ten hours apart, so a
// second shape for the same meeting would be a second thing to learn.
//
// What differs is the tense. The morning hands out a plan — targets, stops, who
// is going where. This one reads back what happened, so every figure on it is a
// PAIR: awal hari beside setelah closing. A DPD bucket standing at 19 tonight
// says nothing on its own; that it opened at 21 is the whole conversation.
//
// It draws in one of THREE cuts, chosen by `eveningVariant` — a presentation
// switch for the designer, not something the BM picks. They line up one-for-one
// with the morning's first three:
//   • default — the whole closing on ONE page (Alt-1): absensi collapsed to its
//     count, then the three subjects as script cards she ticks off, each with
//     its NG-MIS path printed.
//   • stepper — the same script, one subject per page behind the stage bar
//     (Alt-2).
//   • live    — Alt-2's stepper with the numbers ON the handset (Alt-3): what
//     got done, the money in and the DPD movement behind it, the money out and
//     the stops behind that.
//
// There is no Alt-4 or Alt-5 here. Those two are about folding TUGAS into the
// target, and an evening briefing has no tugas to hand out — the day is over.

import { useState } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { BUSINESS_PARTNERS } from '../lib/bp'
import {
  AgendaCard,
  BriefingCard,
  EVENING_AGENDA,
  PhotoSheet,
  PrintedAgenda,
  RollCallChoice,
  RollCallTicks,
  hadirCount,
  type AgendaItem,
  type Attendance,
} from '../lib/briefing'
import { DisbursementStep, RepaymentStep, TaskCompletionStep } from '../lib/briefing-evening'
import { IconChevronDown, IconChevronUp } from '../lib/icons'
import { BRIEFINGS } from '../lib/schedule'
import { store, useApp } from '../lib/store'
import {
  AppScreen,
  SectionTitle,
  StageBar,
  StepSectionTitle,
  StickyBar,
  VisitTitle,
} from '../lib/ui'

const agendaItem = (id: string): AgendaItem =>
  EVENING_AGENDA.find((a) => a.id === id) ?? EVENING_AGENDA[0]

// The stepper's pages. Absensi leads for the same reason it does in the
// morning: the meeting has not started until the room is accounted for, and a
// BM who reads out closing numbers to four of seven BPs has briefed nobody.
// The closing photo is not among them — it comes up as a sheet over the last.
const STEPS = [
  { id: 'absensi', label: 'Absensi', title: 'Absensi BP' },
  { id: 'tugas', label: 'Tugas', title: 'Bahas penyelesaian tugas hari ini' },
  { id: 'repayment', label: 'Repayment', title: 'Bahas capaian repayment' },
  { id: 'disbursement', label: 'Disbursement', title: 'Bahas capaian disbursement' },
] as const

export function BriefingEveningScreen() {
  const flow = useFlow()
  const s = useApp()
  const briefing = BRIEFINGS[1]
  const variant = s.eveningVariant
  const isLive = variant === 'live'

  // Local state, not the store: none of it has to survive leaving the page.
  // What survives is the one fact the Tugas card reads back — that the briefing
  // is closed — and that is written on the way out.
  const [marks, setMarks] = useState<Attendance>({})
  const [rollOpen, setRollOpen] = useState(true)
  const [ticked, setTicked] = useState<string[]>([])
  const [photo, setPhoto] = useState(false)
  const [step, setStep] = useState(1)
  const [photoSheet, setPhotoSheet] = useState(false)

  const hadir = hadirCount(marks)
  // Alt-1's tick is the same record with one of its two values: ticked means
  // hadir, unticked means not answered yet.
  const togglePresent = (id: string) =>
    setMarks((prev) => {
      const next = { ...prev }
      if (next[id] === 'hadir') delete next[id]
      else next[id] = 'hadir'
      return next
    })
  const mark = (id: string, value: 'hadir' | 'tidak') =>
    setMarks((prev) => ({ ...prev, [id]: value }))
  const toggle = (id: string) =>
    setTicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const agendaDone = ticked.length === EVENING_AGENDA.length

  function finish() {
    store.finishBriefing(briefing.id)
    flow.go('today')
  }

  const topBar = (
    <NavigationHeader
      title={<VisitTitle title={briefing.name} when={`${briefing.time} · ${briefing.place}`} />}
      onBack={() => flow.go('today')}
    />
  )

  const photoSheetEl = (
    <PhotoSheet
      open={photoSheet}
      photo={photo}
      onToggle={() => setPhoto(!photo)}
      onClose={() => setPhotoSheet(false)}
      onConfirm={finish}
    />
  )

  // === Alt-1 — the whole closing on one page ================================
  if (variant === 'default') {
    return (
      <AppScreen topBar={topBar}>
        <SectionTitle>Rangkaian acara</SectionTitle>

        <BriefingCard
          title="Absensi BP"
          hint={
            <button
              type="button"
              onClick={() => setRollOpen(!rollOpen)}
              aria-expanded={rollOpen}
              className="flex items-center gap-4 text-14 font-bold text-link"
            >
              {hadir}/{BUSINESS_PARTNERS.length} Hadir
              {rollOpen ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
            </button>
          }
        >
          {rollOpen ? (
            <div className="border-t border-default pt-12">
              <RollCallTicks marks={marks} onToggle={togglePresent} />
            </div>
          ) : null}
        </BriefingCard>

        {EVENING_AGENDA.map((item) => (
          <AgendaCard
            key={item.id}
            item={item}
            done={ticked.includes(item.id)}
            onToggle={() => toggle(item.id)}
          />
        ))}

        <StickyBar>
          {!agendaDone ? (
            <span className="text-center text-12 font-bold text-orange-500">
              Masih ada tugas yang belum selesai
            </span>
          ) : null}
          <Button
            size="lg"
            className="w-full"
            disabled={!agendaDone}
            onClick={() => setPhotoSheet(true)}
          >
            Selesaikan Briefing
          </Button>
        </StickyBar>

        {photoSheetEl}
      </AppScreen>
    )
  }

  // === Alt-2 & Alt-3 — the stepper ==========================================
  const stepId = STEPS[step - 1].id
  const isLast = step === STEPS.length

  function next() {
    if (step < STEPS.length) setStep(step + 1)
  }
  function back() {
    if (step > 1) setStep(step - 1)
    else flow.go('today')
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
      <StageBar current={step} labels={STEPS.map((x) => x.label)} />

      {/* Absensi keeps its title and hangs the running count beside it. The
          in-app cut drops the step title on the three subject pages — each BP
          is her own section title below, so a heading over them would just be
          a fourth. */}
      {stepId === 'absensi' ? (
        <StepSectionTitle>
          {STEPS[step - 1].title}
          <span className="text-14 font-bold text-primary-500">
            {hadir}/{BUSINESS_PARTNERS.length} hadir
          </span>
        </StepSectionTitle>
      ) : isLive ? null : (
        <StepSectionTitle>{STEPS[step - 1].title}</StepSectionTitle>
      )}

      {stepId === 'absensi' ? <RollCallChoice marks={marks} onMark={mark} /> : null}

      {stepId === 'tugas' ? (
        isLive ? <TaskCompletionStep /> : <PrintedAgenda item={agendaItem('tugas')} />
      ) : null}

      {stepId === 'repayment' ? (
        isLive ? <RepaymentStep /> : <PrintedAgenda item={agendaItem('repayment')} />
      ) : null}

      {stepId === 'disbursement' ? (
        isLive ? <DisbursementStep /> : <PrintedAgenda item={agendaItem('disbursement')} />
      ) : null}

      <StickyBar>
        <div className="flex gap-8">
          <Button variant="outline" size="lg" className="flex-1" onClick={back}>
            Kembali
          </Button>
          <Button
            size="lg"
            className="flex-1"
            onClick={isLast ? () => setPhotoSheet(true) : next}
          >
            {isLast ? 'Selesaikan Briefing' : 'Lanjut'}
          </Button>
        </div>
      </StickyBar>

      {photoSheetEl}
    </AppScreen>
  )
}
