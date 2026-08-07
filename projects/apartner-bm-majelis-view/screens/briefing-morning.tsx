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
//   • live    — Alt-2's stepper, but the repayment, disbursement and per-BP
//     tugas steps are worked INSIDE the app on dummy data (Alt-3) instead of
//     printing an NG-MIS path for her to go and open elsewhere.
//   • merged  — Alt-3 with no tugas step at all (Alt-4): each BP's stops for
//     today sit inside her own repayment and disbursement card, each with what
//     it is expected to add. A tugas is not a separate subject; it is how the
//     target gets hit.
//   • pointer — Alt-4 with the meters dropped (Alt-5): every figure states its
//     gap as a sentence, so the card is a script she reads out rather than a
//     chart she interprets.
//
// On every cut but Alt-1 the register is the BP app's own two-cell answer —
// Tidak hadir / Hadir — rather than a tick, because "not marked yet" and
// "marked absent" are different facts about a BP who is not in the room.
//
// On the two stepper cuts the closing photo is NOT its own page — it is a bottom
// sheet that comes up over the last step when she taps "Selesaikan Briefing",
// so the running order ends on the tugas she actually briefs and the proof is a
// gesture on top of it, not a screen of its own.

import { useState } from 'react'
import { BottomSheet, Button, NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { BUSINESS_PARTNERS } from '../lib/bp'
import { AgendaCard, BriefingCard, CheckMark, MORNING_AGENDA, type AgendaItem } from '../lib/briefing'
import {
  BP_ROLL,
  BP_TASKS,
  BpTaskCard,
  DISBURSEMENT,
  REPAYMENT,
  StatCard,
  type Book,
  type StatRow,
} from '../lib/briefing-live'
import { IconCamera, IconChevronDown, IconChevronUp } from '../lib/icons'
import { BRIEFINGS } from '../lib/schedule'
import { store, useApp } from '../lib/store'
import {
  AppScreen,
  AttendanceChoice,
  SectionTitle,
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

// Alt-4 and Alt-5 have no tugas step: the stops are inside the two books.
const MERGED_STEPS = STEPS.filter((s) => s.id !== 'tugas')

export function BriefingMorningScreen() {
  const flow = useFlow()
  const s = useApp()
  const briefing = BRIEFINGS[0]
  const variant = s.morningVariant
  // Alt-4 and Alt-5 are Alt-3 with the books rearranged, so everything that
  // asks "is this cut reading real data" has to say yes for all three.
  const isMerged = variant === 'merged' || variant === 'pointer'
  const isLive = variant === 'live' || isMerged
  const steps = isMerged ? MERGED_STEPS : STEPS

  // Local state, not the store: none of it has to survive leaving the page.
  // What survives is the one fact the Tugas card reads back — that the briefing
  // is closed — and that is written on the way out.
  //
  // The register starts EMPTY, not pre-marked 7/7: the BM ticks each BP as the
  // room fills, so the count on the card is the room she can see.
  const [marks, setMarks] = useState<Record<string, 'hadir' | 'tidak'>>({})
  const [rollOpen, setRollOpen] = useState(true)
  const [ticked, setTicked] = useState<string[]>([])
  const [photo, setPhoto] = useState(false)

  const [step, setStep] = useState(1)
  // The closing-photo sheet, opened from the last stepper step.
  const [photoSheet, setPhotoSheet] = useState(false)

  const hadirCount = BUSINESS_PARTNERS.filter((bp) => marks[bp.id] === 'hadir').length
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

  // --- The register on Alt-1: each name its own tap target, unticked by
  // default, because attendance is something she records in the room.
  const rollCall = (
    <div className="flex flex-col gap-12">
      {BUSINESS_PARTNERS.map((bp) => (
        <button
          key={bp.id}
          type="button"
          onClick={() => togglePresent(bp.id)}
          aria-pressed={marks[bp.id] === 'hadir'}
          className="flex items-center gap-12 text-left active:opacity-70"
        >
          <CheckMark done={marks[bp.id] === 'hadir'} />
          <span className="min-w-0 flex-1 truncate text-16 font-regular text-default">
            {bp.name}
          </span>
        </button>
      ))}
    </div>
  )

  // --- The register on every stepper cut: the BP app's own two-cell answer,
  // green for present and red for absent, the unchosen cell going quiet once
  // she has answered. A tick cannot say "tidak hadir" — it can only fail to say
  // "hadir", which is the same mark as a name she has not reached yet.
  const rollCallChoice = (
    <div className="flex flex-col gap-12">
      {BUSINESS_PARTNERS.map((bp) => {
        const answer = marks[bp.id]
        return (
          <div key={bp.id} className="flex flex-col gap-8">
            <span className="min-w-0 truncate text-16 font-regular text-default">{bp.name}</span>
            <div className="flex gap-8">
              <AttendanceChoice
                tone="red"
                selected={answer === 'tidak'}
                answered={Boolean(answer)}
                label={`Tidak hadir — ${bp.name}`}
                onClick={() => mark(bp.id, 'tidak')}
              >
                Tidak hadir
              </AttendanceChoice>
              <AttendanceChoice
                tone="green"
                selected={answer === 'hadir'}
                answered={Boolean(answer)}
                label={`Hadir — ${bp.name}`}
                onClick={() => mark(bp.id, 'hadir')}
              >
                Hadir
              </AttendanceChoice>
            </div>
          </div>
        )
      })}
    </div>
  )

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
              {hadirCount}/{BUSINESS_PARTNERS.length} Hadir
              {rollOpen ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
            </button>
          }
        >
          {rollOpen ? <div className="border-t border-default pt-12">{rollCall}</div> : null}
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
      {/* Alt-3's tugas page is a stack of BP sections, each with its own name
          header, so the step title over it would just be a third label saying
          "Tugas" after the stage bar already does. */}
      {isLive && stepId === 'tugas' ? null : <SectionTitle>{steps[step - 1].title}</SectionTitle>}

      {stepId === 'absensi' ? (
        <div className="flex flex-col gap-12 rounded-12 border border-default bg-neutral-white p-12">
          <span className="text-14 font-regular text-caption">
            Tandai kehadiran setiap BP. {hadirCount}/{BUSINESS_PARTNERS.length} hadir.
          </span>
          {rollCallChoice}
        </div>
      ) : null}

      {stepId === 'repayment' ? (
        isLive ? (
          <LiveBook
            rows={REPAYMENT}
            book={isMerged ? 'repayment' : undefined}
            pointer={variant === 'pointer'}
          />
        ) : (
          <PrintedAgenda item={agendaItem('repayment')} />
        )
      ) : null}

      {stepId === 'disbursement' ? (
        isLive ? (
          <LiveBook
            rows={DISBURSEMENT}
            book={isMerged ? 'disbursement' : undefined}
            pointer={variant === 'pointer'}
          />
        ) : (
          <PrintedAgenda item={agendaItem('disbursement')} />
        )
      ) : null}

      {stepId === 'tugas' ? (
        isLive ? <LiveBpTugasAll /> : <PrintedAgenda item={agendaItem('tugas')} />
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

/**
 * An agenda item drawn read-only for a stepper page — the same subtitle and
 * numbered steps the single-page card carries, minus the tick. In Alt-2 the
 * subtitle is still the printed NG-MIS path; Alt-3 replaces the whole card with
 * live data instead.
 */
function PrintedAgenda({ item }: { item: AgendaItem }) {
  return (
    <div className="flex flex-col gap-12 rounded-12 border border-default bg-neutral-white p-12">
      {item.subtitle ? (
        <span className="text-14 font-regular text-caption">{item.subtitle}</span>
      ) : null}
      {item.steps ? (
        <ol className="flex flex-col gap-8 border-t border-default pt-12">
          {item.steps.map((s, i) => (
            <li key={s} className="flex gap-12">
              <span className="w-12 shrink-0 text-14 font-bold text-default">{i + 1}</span>
              <span className="min-w-0 flex-1 text-14 font-regular text-default">{s}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  )
}

/**
 * The repayment / disbursement step on every in-app cut: the branch TOTAL
 * first, then the same two periods broken down by BP — the seven people she is
 * briefing. Per-majelis for the whole branch would be a hundred cards; per-BP is
 * the seven she can turn to in the room. Alt-4 adds each BP's stops for today
 * inside her own card, and Alt-5 swaps the meters for the sentence.
 */
function LiveBook({
  rows,
  book,
  pointer,
}: {
  rows: StatRow[]
  /** Set on Alt-4 / Alt-5 — each BP's stops ride inside her own card. */
  book?: Book
  pointer?: boolean
}) {
  return (
    <div className="flex flex-col gap-8">
      {rows.map((r) => (
        <StatCard key={`${r.title}-${r.subtitle ?? ''}`} {...r} book={book} pointer={pointer} />
      ))}
    </div>
  )
}

/**
 * Alt-3's tugas step: every BP on one page, each her own section. The pager was
 * dropped — walking BPs one at a time behind the main button hid six of the
 * seven behind a tap, when the point of the step is that the BM sees the whole
 * branch's day at once.
 */
function LiveBpTugasAll() {
  return (
    <div className="flex flex-col gap-16">
      {BP_ROLL.map((bp) => {
        const tasks = BP_TASKS[bp.id] ?? []
        return (
          <div key={bp.id} className="flex flex-col gap-8">
            <div className="flex min-w-0 flex-col pt-4">
              <span className="truncate text-16 font-bold text-default">{bp.name}</span>
              <span className="truncate text-12 text-caption">
                {bp.code} · {tasks.length} tugas
              </span>
            </div>
            {tasks.map((t) => (
              <BpTaskCard key={`${t.time}-${t.title}`} task={t} />
            ))}
          </div>
        )
      })}
    </div>
  )
}

/**
 * The closing photo, as a bottom sheet on the two stepper cuts. It comes up over
 * the last step when she taps "Selesaikan Briefing"; the briefing does not close
 * until the photo is taken, so the confirm inside the sheet is what actually
 * finishes it.
 */
function PhotoSheet({
  open,
  photo,
  onToggle,
  onClose,
  onConfirm,
}: {
  open: boolean
  photo: boolean
  onToggle: () => void
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Bukti kehadiran">
      <div className="flex flex-col gap-12">
        <span className="text-14 font-regular text-caption">
          Ambil foto bersama semua peserta yang hadir
        </span>
        <button
          type="button"
          onClick={onToggle}
          className={`flex flex-col items-center gap-8 rounded-12 border border-dashed p-24 ${
            photo ? 'border-green-500 bg-green-50 text-green-500' : 'border-default text-caption'
          }`}
        >
          <IconCamera size={24} />
          <span className="text-14 font-bold">{photo ? 'Foto tersimpan' : 'Ambil foto'}</span>
        </button>
        <Button size="lg" className="w-full" disabled={!photo} onClick={onConfirm}>
          Selesaikan Briefing
        </Button>
      </div>
    </BottomSheet>
  )
}
