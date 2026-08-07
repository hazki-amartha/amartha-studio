'use client'

// Morning briefing — the meeting that opens the branch day, as a checklist the
// BM works down while seven BPs sit in front of her.
//
// It is a RUNNING ORDER, not a form: nothing here is typed, everything is
// ticked. The whole card is the tap target rather than a checkbox on the edge
// of one — she is talking while she uses this.
//
// The screen draws in one of FIVE cuts, chosen by `morningVariant` — a
// presentation switch for the designer, not something the BM picks:
//   • default — the single-page checklist (Alt-1). Absensi is open and
//     interactive: she ticks each BP present as the room fills.
//   • stepper — the same running order, one card per page behind a StageBar
//     (Alt-2), the shape the MV/HV visits already use.
//   • live    — Alt-2's stepper, but the repayment and disbursement steps are
//     worked INSIDE the app on dummy data (Alt-3) instead of printing an NG-MIS
//     path for her to go and open elsewhere. Each BP is her own section — a
//     name over her progress card — and the day's stops stay a tugas step of
//     THEIR own, one card per stop with a 3-dot menu (add to my task,
//     reschedule). The books show numbers; the tugas step shows the work.
//   • merged  — Alt-3 with no tugas step at all (Alt-4): each BP's stops fold
//     INTO her repayment and disbursement section, one card per stop with the
//     money it is meant to bring. A tugas is not a separate subject; it is how
//     the target gets hit.
//   • pointer — Alt-4 with the meters and task cards dropped (Alt-5): each BP's
//     achievement and stops are read out as pointer sentences, so the section
//     is a script she reads down rather than a set of cards she scans.
//
// Crossing all three in-app cuts is `morningUnit` — the "b" of Alt-3b / 4b / 5b
// — which counts every repayment and disbursement target in MITRA instead of
// rupiah. It is a unit rather than a sixth cut because it changes what the
// numbers say and nothing about the shape they are said in.
//
// On every stepper cut the register is the BP app's own two-cell answer — Tidak
// hadir / Hadir — rather than a tick, because "not marked yet" and "marked
// absent" are different facts about a BP who is not in the room. Each BP sits in
// her own card, drawn like the mitra roster on the MV: photo and name, a rule,
// then the two-cell answer.
//
// On the two stepper cuts the closing photo is NOT its own page — it is a bottom
// sheet that comes up over the last step when she taps "Selesaikan Briefing",
// so the running order ends on the tugas she actually briefs and the proof is a
// gesture on top of it, not a screen of its own.

import { useState } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { BUSINESS_PARTNERS } from '../lib/bp'
import {
  AgendaCard,
  BriefingCard,
  MORNING_AGENDA,
  PhotoSheet,
  PrintedAgenda,
  RollCallChoice,
  RollCallTicks,
  hadirCount,
  type AgendaItem,
  type Attendance,
} from '../lib/briefing'
import { BookSections, BpTugasSections, bookRows } from '../lib/briefing-live'
import { IconChevronDown, IconChevronUp } from '../lib/icons'
import { BRIEFINGS } from '../lib/schedule'
import { store, useApp } from '../lib/store'
import {
  AppScreen,
  SectionTitle,
  StepSectionTitle,
  StageBar,
  StickyBar,
  VisitTitle,
} from '../lib/ui'

const agendaItem = (id: string): AgendaItem =>
  MORNING_AGENDA.find((a) => a.id === id) ?? MORNING_AGENDA[0]

// The stepper's pages, in the order of the running order. The closing photo is
// not among them — it comes up as a sheet over the last one.
const STEPS = [
  { id: 'absensi', label: 'Absensi', title: 'Absensi BP' },
  { id: 'repayment', label: 'Repayment', title: 'Bahas target repayment' },
  { id: 'disbursement', label: 'Disbursement', title: 'Bahas target disbursement' },
  { id: 'tugas', label: 'Tugas', title: 'Bahas tugas hari ini' },
] as const

// Alt-4 and Alt-5 have no separate tugas step: each BP's stops sit inside her
// own repayment and disbursement section, one card per stop. Alt-2 (printed)
// and Alt-3 (live) both keep Tugas as a page of its own.
const MERGED_STEPS = STEPS.filter((s) => s.id !== 'tugas')

export function BriefingMorningScreen() {
  const flow = useFlow()
  const s = useApp()
  const briefing = BRIEFINGS[0]
  const variant = s.morningVariant
  // Alt-3, Alt-4 and Alt-5 all read real data, so everything that asks "is this
  // cut live" says yes for all three. Where they part: Alt-4 / Alt-5 (`isMerged`)
  // fold each BP's stops INTO her repayment / disbursement section and drop the
  // tugas step; Alt-3 keeps the tugas step and shows only numbers in the books.
  // Alt-5 alone swaps the meters for pointer sentences.
  const isLive = variant === 'live' || variant === 'merged' || variant === 'pointer'
  const isMerged = variant === 'merged' || variant === 'pointer'
  const isPointer = variant === 'pointer'
  // The "b" of Alt-3b / 4b / 5b: the same three cuts with every target counted
  // in mitra rather than rupiah. A unit, not a sixth variant — it applies to
  // whichever in-app cut is drawing.
  const unit = s.morningUnit
  const steps = isMerged ? MERGED_STEPS : STEPS

  // Local state, not the store: none of it has to survive leaving the page.
  // What survives is the one fact the Tugas card reads back — that the briefing
  // is closed — and that is written on the way out.
  //
  // The register starts EMPTY, not pre-marked 7/7: the BM ticks each BP as the
  // room fills, so the count on the card is the room she can see.
  const [marks, setMarks] = useState<Attendance>({})
  const [rollOpen, setRollOpen] = useState(true)
  const [ticked, setTicked] = useState<string[]>([])
  const [photo, setPhoto] = useState(false)

  const [step, setStep] = useState(1)
  // The closing-photo sheet, opened from the last stepper step.
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

  // The checklist is the gate to OPENING the photo sheet; the photo inside it is
  // the gate to finishing. Every cut now closes the same way — tick the running
  // order, then the closing photo comes up as a sheet.
  const agendaDone = ticked.length === MORNING_AGENDA.length

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

  // === Alt-1 — the single-page checklist =====================================
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

        {MORNING_AGENDA.map((item) => (
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

        <PhotoSheet
          open={photoSheet}
          photo={photo}
          onToggle={() => setPhoto(!photo)}
          onClose={() => setPhotoSheet(false)}
          onConfirm={finish}
        />
      </AppScreen>
    )
  }

  // === Alt-2 … Alt-5 — the stepper ==========================================
  const stepId = steps[step - 1].id
  const isLast = step === steps.length

  function next() {
    if (step < steps.length) setStep(step + 1)
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
      <StageBar current={step} labels={steps.map((x) => x.label)} />
      {/* Absensi keeps its title and hangs the running count beside it, in the
          brand colour. The in-app repayment / disbursement cuts drop the step
          title entirely — each BP is her own section title below, so a
          "Bahas target repayment" over them would just be a fourth heading. */}
      {stepId === 'absensi' ? (
        <StepSectionTitle>
          {steps[step - 1].title}
          <span className="text-14 font-bold text-primary-500">
            {hadir}/{BUSINESS_PARTNERS.length} hadir
          </span>
        </StepSectionTitle>
      ) : isLive && (stepId === 'repayment' || stepId === 'disbursement' || stepId === 'tugas') ? null : (
        <StepSectionTitle>{steps[step - 1].title}</StepSectionTitle>
      )}

      {stepId === 'absensi' ? <RollCallChoice marks={marks} onMark={mark} /> : null}

      {stepId === 'repayment' ? (
        isLive ? (
          <BookSections
            rows={bookRows('repayment', unit)}
            book="repayment"
            unit={unit}
            pointer={isPointer}
            withTasks={isMerged}
          />
        ) : (
          <PrintedAgenda item={agendaItem('repayment')} />
        )
      ) : null}

      {stepId === 'disbursement' ? (
        isLive ? (
          <BookSections
            rows={bookRows('disbursement', unit)}
            book="disbursement"
            unit={unit}
            pointer={isPointer}
            withTasks={isMerged}
          />
        ) : (
          <PrintedAgenda item={agendaItem('disbursement')} />
        )
      ) : null}

      {stepId === 'tugas' ? (
        isLive ? <BpTugasSections /> : <PrintedAgenda item={agendaItem('tugas')} />
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

      <PhotoSheet
        open={photoSheet}
        photo={photo}
        onToggle={() => setPhoto(!photo)}
        onClose={() => setPhotoSheet(false)}
        onConfirm={finish}
      />
    </AppScreen>
  )
}
