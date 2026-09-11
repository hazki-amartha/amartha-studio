'use client'

// Lead Follow Up — the record a BP works when she taps a lead on the Sales board.
//
// It opens on the prospect's card, a context-history stepper (past steps + the
// upcoming follow-up), and one question: "Follow up result?"
//
//   Continue application → pick product (GL / Modal); Modal → existing majelis
//     (a "Perkenalan" task) or new majelis (schedule a sosialisasi)
//   Reschedule follow up → why, then one day later
//   Drop lead            → why she is not interested
//
// A "Perkenalan" lead swaps the result buttons for "Lead sudah hadir" +
// "Reschedule"; a reactivation shows loan limits above the stepper.

import { useState, type ReactNode } from 'react'
import { BottomSheet, Button, Card, Input, NavigationHeader, SelectableCard } from '@/design-system/components'
import { MapPin, Phone } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import {
  CURRENT_FO,
  contextSteps,
  dateFromToday,
  FIELD_OFFICERS,
  majelisLine,
  sourceDetail,
  type ContextStep,
  type PipelineLead,
} from '../lib/pipeline'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { ChevronRow, PickSheet } from '../lib/pipeline-ui'
import { useApp } from '../lib/store'
import { agendaDueDays, leadScheduleLabel, overdueDays } from '../lib/tasks'
import { AppScreen, ContactButton } from '../lib/ui'

type SheetId = 'reschedule-why' | 'drop' | 'majelis' | null

const RESCHEDULE_REASONS = [
  'Lead butuh waktu',
  'Lead perlu diskusi dengan keluarga',
  'Belum bisa dihubungi',
]

const DROP_REASONS = [
  'Belum diizinkan suami / keluarga',
  'Belum butuh pinjaman saat ini',
  'Keberatan biaya / angsuran',
  'Masih ada pinjaman di tempat lain',
  'Tidak cocok dengan skema pinjaman',
  'Takut, ragu, atau trauma',
  'Lainnya',
]

/** How this follow-up reads: kumpulan, reactivation, or a plain follow-up. */
function followUpTitle(lead: PipelineLead): string {
  if (lead.kumpulanStage === 'follow-up') return 'Lead: Perkenalan majelis'
  if (lead.status === 'not-interested' || lead.status === 'rejected') return 'Lead Reactivation'
  return 'Lead: Follow up'
}

/** One node's circle on the stepper's rail. */
function StepDot({ next }: { next?: boolean }) {
  return (
    <span
      className={`h-20 w-20 shrink-0 rounded-full border-2 ${
        next ? 'border-primary-500 bg-primary-500' : 'border-neutral-400 bg-neutral-white'
      }`}
    />
  )
}

/** One row of the stepper: a rail node on the left, its content on the right. */
function StepRow({
  dot,
  lineBelow,
  children,
}: {
  dot: ReactNode
  lineBelow: boolean
  children: ReactNode
}) {
  return (
    <div className="flex gap-12">
      <div className="flex flex-col items-center">
        {dot}
        {lineBelow ? <span className="w-2 flex-1 rounded-full bg-neutral-200" /> : null}
      </div>
      <div className="min-w-0 flex-1 pb-16">{children}</div>
    </div>
  )
}

function PastStep({ step }: { step: ContextStep }) {
  return (
    <span className="flex flex-col gap-2">
      <span className="text-12 text-caption">{step.date}</span>
      <span className="text-14 font-bold text-default">{step.title}</span>
      {step.detail ? (
        <span className="text-12 italic text-caption">&ldquo;{step.detail}&rdquo;</span>
      ) : null}
    </span>
  )
}

/**
 * The follow-up context history as a stepper — at most the first and last past
 * steps plus the upcoming follow-up, with a "see N more" node between them when
 * there are hidden middle steps.
 */
function ContextStepper({
  past,
  nextDate,
  nextSuffix,
  nextLate,
  nextExtra,
}: {
  past: ContextStep[]
  nextDate: string
  nextSuffix: string
  nextLate: boolean
  /** An extra line under the follow-up date (e.g. the kumpulan reminder). */
  nextExtra?: ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const hidden = past.length - 2

  return (
    <div className="flex flex-col">
      {past.length > 0 ? (
        <StepRow dot={<StepDot />} lineBelow>
          <PastStep step={past[0]} />
        </StepRow>
      ) : null}

      {past.length > 2 ? (
        <StepRow
          dot={<span className="h-20 w-20 shrink-0 rounded-full border-2 border-neutral-500 bg-neutral-white" />}
          lineBelow
        >
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="pt-2 text-12 font-bold text-caption"
          >
            {expanded ? 'see less ^' : `see ${hidden} more ^`}
          </button>
        </StepRow>
      ) : null}

      {expanded
        ? past.slice(1, -1).map((s, i) => (
            <StepRow key={`${s.date}-${i}`} dot={<StepDot />} lineBelow>
              <PastStep step={s} />
            </StepRow>
          ))
        : null}

      {past.length >= 2 ? (
        <StepRow dot={<StepDot />} lineBelow>
          <PastStep step={past[past.length - 1]} />
        </StepRow>
      ) : null}

      <StepRow dot={<StepDot next />} lineBelow={false}>
        <span className="flex flex-col gap-2">
          <span className="text-12 text-primary-500">Next follow up:</span>
          <span className="text-14 font-bold">
            <span className="text-primary-500">{nextDate}</span>
            <span className="text-primary-500"> - </span>
            <span className={nextLate ? 'text-orange-500' : 'text-primary-500'}>{nextSuffix}</span>
          </span>
          {nextExtra}
        </span>
      </StepRow>
    </div>
  )
}

export function FollowUpScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const { role } = useApp()
  const isBM = role === 'BM'
  const lead = leads[openId]
  const [sheet, setSheet] = useState<SheetId>(null)
  const [foOpen, setFoOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Follow up" onBack={() => flow.go('sales')} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const isReactivation = lead.status === 'not-interested' || lead.status === 'rejected'
  const late = overdueDays(lead.agenda)

  // The context stepper: past steps, then the upcoming follow-up node.
  const past = contextSteps(lead)
  const dueDays = agendaDueDays(lead.agenda)
  const nextDate = lead.nextFollowUp || dateFromToday(dueDays)
  const nextSuffix =
    late > 0 ? `Telat ${late} hari` : dueDays === 0 ? 'Hari ini' : leadScheduleLabel(lead.agenda)

  // A lead in the "Perkenalan" stage is worked differently: she is reminded
  // to attend the kumpulan, not asked to continue an application.
  const isKumpulan = lead.kumpulanStage === 'follow-up'

  // A BM can oversee and reassign anyone's task, but can only work a task that is
  // hers — the action buttons are disabled on another petugas' lead.
  const canAct = !isBM || lead.fo === CURRENT_FO

  function dropLead() {
    pipelineStore.dropLead(lead.id, reason || 'Lead di-drop')
    pipelineStore.setFlash(`${lead.name} di-drop — dijadwalkan ulang 90 hari`)
    flow.go('sales')
  }

  // Reschedule always sets the next follow-up to one day later.
  function reschedule() {
    pipelineStore.rescheduleFollowUp(
      lead.id,
      1,
      dateFromToday(1),
      [reason, note].filter(Boolean).join(' — '),
    )
    pipelineStore.setFlash(`Follow up ${lead.name} dijadwalkan ulang ke ${dateFromToday(1)}`)
    flow.go('sales')
  }

  return (
    <AppScreen
      topBar={<NavigationHeader title={followUpTitle(lead)} onBack={() => flow.go('sales')} />}
    >
      {/* Profile box — who she is and where, nothing about the task. Source sits
          directly under the name; phone and address each carry their own
          affordance on the right. */}
      <Card>
        <div className="flex flex-col gap-16">
          <div className="flex items-center gap-12">
            {/* 48px is the largest square the design-system spacing scale offers. */}
            <span className="flex h-48 w-48 shrink-0 items-center justify-center rounded-8 bg-neutral-200 text-12 text-caption">
              Photo
            </span>
            <span className="min-w-0 flex-1 text-20 font-bold text-default">{lead.name}</span>
          </div>

          <span className="text-14 text-default">
            {isReactivation ? `Source: Reaktivasi — eks ${majelisLine(lead)}` : `Source: ${sourceDetail(lead)}`}
          </span>

          <div className="flex items-center gap-8">
            <span className="min-w-0 flex-1 text-14 text-default">{lead.phone}</span>
            <ContactButton label={`Telepon ${lead.name}`} tone="green" onClick={() => {}}>
              <Phone size={20} />
            </ContactButton>
          </div>

          {lead.address?.desa ? (
            <div className="flex items-center gap-8">
              <span className="min-w-0 flex-1 text-14 text-default">
                Desa {lead.address.desa}, Kecamatan {lead.address.kecamatan}
              </span>
              <ContactButton label={`Peta ${lead.name}`} tone="red" onClick={() => {}}>
                <MapPin size={20} />
              </ContactButton>
            </div>
          ) : null}

          {/* BM sees who owns the task and can reassign it. */}
          {isBM ? (
            <div className="flex items-center justify-between gap-8 border-t border-default pt-8">
              <span className="text-14 text-default">Petugas: {lead.fo}</span>
              <button
                type="button"
                onClick={() => setFoOpen(true)}
                className="shrink-0 text-12 font-bold text-link"
              >
                Ganti
              </button>
            </div>
          ) : null}
        </div>
      </Card>

      {/* The context history stepper. A kumpulan lead shows the attend reminder,
          a reactivation shows the loan limits — both under the follow-up date. */}
      <ContextStepper
        past={past}
        nextDate={nextDate}
        nextSuffix={nextSuffix}
        nextLate={late > 0}
        nextExtra={
          isKumpulan ? (
            <span className="text-14 text-default">
              Ingatkan Lead untuk hadir ke kumpulan {majelisLine(lead)}. Perkenalkan dengan
              anggota Majelis, pastikan seluruh anggota Majelis setuju untuk menambahkan{' '}
              {lead.name} sebagai anggota baru Majelis
            </span>
          ) : isReactivation && lead.reactivation ? (
            <span className="text-14 text-default">
              {lead.name} sebelumnya punya limit {lead.reactivation.prevLimit}, dan bisa
              diaktifkan kembali dengan potensi limit sampai{' '}
              <span className="font-bold text-green-600">{lead.reactivation.potentialLimit}</span>.
            </span>
          ) : undefined
        }
      />

      {/* Follow up result — the heading sits with its buttons in a full-bleed
          background bar at the bottom of the page (not sticky). */}
      <div className="-mx-16 mt-auto flex flex-col gap-12 border-t border-default bg-neutral-white p-16">
        <span className="text-14 font-bold text-default">Follow up result?</span>
        {!canAct ? (
          <span className="text-12 text-caption">
            Tugas ini milik {lead.fo}. Tugaskan ke dirimu untuk mengerjakannya.
          </span>
        ) : null}
        {isKumpulan ? (
          <>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              disabled={!canAct}
              onClick={() => {
                setReason('')
                setNote('')
                setSheet('reschedule-why')
              }}
            >
              Reschedule to next kumpulan
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              disabled={!canAct}
              onClick={() => {
                pipelineStore.cancelKumpulanFollowUp(lead.id)
                pipelineStore.setFlash(`${lead.name} batal gabung ${majelisLine(lead)} — kembali ke follow up`)
                flow.go('sales')
              }}
            >
              Batal gabung {majelisLine(lead)}
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="w-full"
              disabled={!canAct}
              onClick={() => {
                setReason('')
                setSheet('drop')
              }}
            >
              Drop lead
            </Button>
          </>
        ) : (
          <>
            <Button
              size="lg"
              className="w-full"
              disabled={!canAct}
              onClick={() => setSheet('majelis')}
            >
              Mulai pendaftaran
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              disabled={!canAct}
              onClick={() => {
                setReason('')
                setNote('')
                setSheet('reschedule-why')
              }}
            >
              Butuh waktu lebih
            </Button>
            <button
              type="button"
              disabled={!canAct}
              onClick={() => {
                setReason('')
                setSheet('drop')
              }}
              className={`mt-8 self-center py-4 text-12 font-bold underline ${
                canAct ? 'text-link' : 'text-disabled'
              }`}
            >
              Drop lead
            </button>
          </>
        )}
      </div>


      {/* Continue application / Change majelis — pick existing or new; each card
          taps straight through to its own page. */}
      <BottomSheet open={sheet === 'majelis'} onClose={() => setSheet(null)} title="Pilih Majelis">
        <div className="flex flex-col gap-8">
          <ChevronRow
            title="Majelis existing"
            description="Gabung ke majelis yang sudah ada"
            onClick={() => {
              setSheet(null)
              flow.go('majelis-existing')
            }}
          />
          <ChevronRow
            title="Majelis baru"
            description="Atur jadwal sosialisasi majelis baru"
            onClick={() => {
              setSheet(null)
              flow.go('kumpulan-jadwal')
            }}
          />
        </div>
      </BottomSheet>

      {/* Reschedule — why; the next follow-up is set to one day later. */}
      <BottomSheet open={sheet === 'reschedule-why'} onClose={() => setSheet(null)} title="Alasan">
        <div className="flex flex-col gap-8">
          {RESCHEDULE_REASONS.map((r) => (
            <SelectableCard
              key={r}
              name="reschedule-why"
              inputType="radio"
              title={r}
              checked={reason === r}
              onChange={() => setReason(r)}
            />
          ))}
          <label className="flex flex-col gap-4 pt-4">
            <span className="text-12 text-caption">Catatan (opsional)</span>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tambahkan catatan…" />
          </label>
          <Button size="lg" className="w-full" disabled={!reason} onClick={reschedule}>
            Submit
          </Button>
        </div>
      </BottomSheet>

      {/* Drop lead — why she is not interested. */}
      <BottomSheet open={sheet === 'drop'} onClose={() => setSheet(null)} title="Kenapa tidak berminat?">
        <div className="flex flex-col gap-8">
          {DROP_REASONS.map((r) => (
            <SelectableCard
              key={r}
              name="drop-why"
              inputType="radio"
              title={r}
              checked={reason === r}
              onChange={() => setReason(r)}
            />
          ))}
          <Button size="lg" className="w-full" disabled={!reason} onClick={dropLead}>
            Drop lead
          </Button>
        </div>
      </BottomSheet>

      {/* BM: reassign this lead to another petugas. */}
      <PickSheet
        open={foOpen}
        title="Ganti petugas"
        options={FIELD_OFFICERS}
        value={lead.fo}
        onClose={() => setFoOpen(false)}
        onPick={(f) => {
          pipelineStore.setFo(lead.id, f)
          setFoOpen(false)
        }}
      />
    </AppScreen>
  )
}
