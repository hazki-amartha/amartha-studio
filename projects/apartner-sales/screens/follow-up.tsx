'use client'

// Lead Follow Up — the record a BP works when she taps a lead on the Sales board.
//
// It opens on the prospect's card (who she is, where she is, when the follow-up
// is due and what happened last time) and one question: "Follow up result?"
//
//   Continue application   → Self-service via AFIN, or FO Assisted (the checklist)
//   Takeover application    → (once self-service is started) straight to assisted
//   Reschedule follow up    → why, then a new date
//   Drop lead               → why she is not interested
//
// The card shape is the same for a 1st follow-up, a 2nd follow-up, and the
// reactivation of an ex-mitra; only the heading and the "last time" line differ.

import { useState } from 'react'
import { Button, Card, Input, NavigationHeader, SelectableCard } from '@/design-system/components'
import { MapPin, Phone } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import {
  dateFromToday,
  majelisLine,
  sourceDetail,
  type MajelisAssignment,
  type PipelineLead,
  type Product,
} from '../lib/pipeline'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { assignmentLabel, MajelisPickerSheet, SelectField } from '../lib/pipeline-ui'
import { leadScheduleLabel, overdueDays } from '../lib/tasks'
import { AppScreen, ContactButton } from '../lib/ui'
import { BottomSheet } from '@/design-system/components'

type SheetId = 'continue' | 'self-setup' | 'reschedule-why' | 'drop' | null

const DEFAULT_MAJELIS: MajelisAssignment = { kind: 'none', branch: 'BP Ciseeng' }

const RESCHEDULE_REASONS = [
  'Tidak sempat kunjungi hari ini',
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

/** How this follow-up reads: reactivation, or the Nth call. */
function followUpTitle(lead: PipelineLead): string {
  if (lead.status === 'not-interested' || lead.status === 'rejected') return 'Lead Reactivation'
  const prior = lead.log.filter((l) => l.via === 'telepon').length
  return prior === 0 ? 'Lead: 1st Follow up' : 'Lead: 2nd Follow up'
}

export function FollowUpScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]
  const [sheet, setSheet] = useState<SheetId>(null)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  // Self-service AFIN needs a majelis and a product picked before it is sent.
  const [selfMajelis, setSelfMajelis] = useState<MajelisAssignment>(DEFAULT_MAJELIS)
  const [selfProduct, setSelfProduct] = useState<Product | null>(null)
  const [majelisOpen, setMajelisOpen] = useState(false)

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Follow up" onBack={() => flow.go('sales')} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const isReactivation = lead.status === 'not-interested' || lead.status === 'rejected'
  const late = overdueDays(lead.agenda)
  const firstLog = lead.log[0]

  // The result of her most recent meeting, on the "previous meeting" line.
  const withReason = (label: string, reason?: string) =>
    reason ? `${label} — "${reason}"` : label
  const result = lead.lastResult
  // With no in-app result recorded, the previous meeting is still one of the
  // defined outcomes — never a raw log note. A lead already followed up by phone
  // got here because the last meeting was rescheduled; only a freshly captured
  // lead, never contacted, reads "Lead created".
  const calls = lead.log.filter((l) => l.via === 'telepon').length
  const lastLog = lead.log[lead.log.length - 1]
  const defaultLine = calls >= 1 ? 'Rescheduled' : 'Lead created'
  const defaultDate =
    calls >= 1
      ? lastLog
        ? `${lastLog.at} 2026`
        : '-'
      : firstLog
        ? `${firstLog.at} 2026`
        : '-'
  const previousLine =
    result?.kind === 'rescheduled'
      ? withReason('Rescheduled', result.reason)
      : result?.kind === 'assisted'
        ? withReason('Assisted application started', result.reason)
        : result?.kind === 'self-service'
          ? 'Self service application started'
          : result?.kind === 'dropped'
            ? withReason('Dropped', result.reason)
            : defaultLine
  // That meeting's date — the recorded result date, or the last contact's date.
  const previousDate = result?.date ?? defaultDate

  // An application already begun (assisted saved, or self-service sent) resumes
  // straight in the checklist; a fresh lead first picks self-service vs assisted.
  const resumeApplication = lead.assistedStarted || lead.selfServiceStarted
  const continueLabel = lead.selfServiceStarted && !lead.assistedStarted
    ? 'Takeover application'
    : 'Continue application'

  function dropLead() {
    pipelineStore.dropLead(lead.id, reason || 'Lead di-drop')
    pipelineStore.setFlash(`${lead.name} dipindahkan ke reaktivasi`)
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

  function confirmSelfService() {
    if (selfMajelis.kind === 'none' || !selfProduct) return
    pipelineStore.assignMajelis(lead.id, selfMajelis)
    pipelineStore.setProduct(lead.id, selfProduct)
    pipelineStore.startSelfService(lead.id)
    pipelineStore.setFlash(`Aplikasi self-service AFIN dikirim ke ${lead.name}`)
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
        </div>
      </Card>

      {/* Follow-up context — the task, kept out of the profile box, on a pale
          blue field with an outline. */}
      <div className="flex flex-col gap-12 rounded-12 border border-blue-200 bg-blue-50 p-16">
        <div className="flex items-start justify-between gap-8">
          <span className="flex flex-col gap-2">
            <span className="text-12 text-caption">Next follow-up</span>
            <span className="text-18 font-bold text-default">
              {lead.nextFollowUp || leadScheduleLabel(lead.agenda)}
            </span>
          </span>
          {late > 0 ? (
            <span className="shrink-0 text-12 font-bold text-orange-500">Telat {late} hari</span>
          ) : null}
        </div>

        {isReactivation && lead.reactivation ? (
          <div className="flex flex-col gap-2 border-t border-blue-200 pt-12 text-12">
            <span className="text-caption">
              Previous loan limit: <span className="text-default">{lead.reactivation.prevLimit}</span>
            </span>
            <span className="text-caption">
              Potential loan limit:{' '}
              <span className="font-bold text-green-600">{lead.reactivation.potentialLimit}</span>
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2 border-t border-blue-200 pt-12 text-12">
            <span className="text-caption">Previous meeting ({previousDate}):</span>
            <span className="text-caption">{previousLine}</span>
          </div>
        )}
      </div>

      {/* Follow up result — the heading sits with its buttons. */}
      <div className="mt-auto flex flex-col gap-8 pb-24 pt-8">
        <span className="text-14 font-bold text-default">Follow up result?</span>
        <Button
          size="lg"
          className="w-full"
          onClick={() => (resumeApplication ? flow.go('application') : setSheet('continue'))}
        >
          {continueLabel}
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full"
          onClick={() => {
            setReason('')
            setNote('')
            setSheet('reschedule-why')
          }}
        >
          Reschedule follow up
        </Button>
        <button
          type="button"
          onClick={() => {
            setReason('')
            setSheet('drop')
          }}
          className="mt-8 self-center py-4 text-12 font-bold text-link underline"
        >
          Drop lead
        </button>
      </div>

      {/* Continue application — self-service, or the FO-assisted checklist. */}
      <BottomSheet open={sheet === 'continue'} onClose={() => setSheet(null)} title="Continue application">
        <div className="flex flex-col gap-8">
          <button
            type="button"
            onClick={() => {
              setSelfMajelis(lead.majelis.kind === 'none' ? DEFAULT_MAJELIS : lead.majelis)
              setSelfProduct(lead.product)
              setSheet('self-setup')
            }}
            className="flex flex-col gap-2 rounded-12 border border-default bg-neutral-white p-16 text-left active:bg-neutral-50"
          >
            <span className="text-14 font-bold text-default">Self-service via AFIN</span>
            <span className="text-12 text-caption">Calon mitra mengisi aplikasi sendiri di AFIN</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSheet(null)
              flow.go('application')
            }}
            className="flex flex-col gap-2 rounded-12 border border-default bg-neutral-white p-16 text-left active:bg-neutral-50"
          >
            <span className="text-14 font-bold text-default">FO Assisted Application</span>
            <span className="text-12 text-caption">
              Pastikan KTP, KK, dan buku rekening sudah siap
            </span>
          </button>
        </div>
      </BottomSheet>

      {/* Self-service setup — a majelis and a product before the AFIN app is sent. */}
      <BottomSheet
        open={sheet === 'self-setup' && !majelisOpen}
        onClose={() => setSheet(null)}
        title="Kirim aplikasi self-service"
        description="Pilih majelis dan produk sebelum calon mitra mengisi di AFIN."
        primaryAction={
          <Button
            size="lg"
            className="w-full"
            disabled={selfMajelis.kind === 'none' || !selfProduct}
            onClick={confirmSelfService}
          >
            Kirim aplikasi
          </Button>
        }
      >
        <div className="flex flex-col gap-12">
          <SelectField
            label="Majelis"
            required
            value={selfMajelis.kind === 'none' ? undefined : assignmentLabel(selfMajelis)}
            placeholder="Pilih majelis"
            onClick={() => setMajelisOpen(true)}
          />
          <div className="flex flex-col gap-4">
            <span className="text-12 text-caption">
              Produk<span className="text-red-500"> *</span>
            </span>
            <div className="flex flex-col gap-8">
              {(['GL', 'Modal'] as Product[]).map((p) => (
                <SelectableCard
                  key={p}
                  name="self-product"
                  inputType="radio"
                  title={p}
                  checked={selfProduct === p}
                  onChange={() => setSelfProduct(p)}
                />
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>

      <MajelisPickerSheet
        open={majelisOpen}
        value={selfMajelis}
        onClose={() => setMajelisOpen(false)}
        onPick={(m) => {
          setSelfMajelis(m)
          setMajelisOpen(false)
        }}
      />

      {/* Reschedule — why; the next follow-up is set to one day later. */}
      <BottomSheet open={sheet === 'reschedule-why'} onClose={() => setSheet(null)} title="Kenapa dijadwalkan ulang?">
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
          <span className="text-12 text-caption">
            Follow up berikutnya: <span className="font-bold text-default">{dateFromToday(1)}</span> (besok)
          </span>
          <Button size="lg" className="w-full" disabled={!reason} onClick={reschedule}>
            Reschedule follow up
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
    </AppScreen>
  )
}
