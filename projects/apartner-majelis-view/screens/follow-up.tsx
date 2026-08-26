'use client'

// Follow Up — the scheduled call, a two-step task on the pipeline record, worked
// like a home visit: tapping an outcome opens its sheet straight away.
//
//   1. HUBUNGI    — Terhubung → step 2; Tidak diangkat → reschedule the next
//      attempt; Nomor tidak aktif → ask for an alternative number, and close the
//      prospect if there is none. The record is compact, with a show/hide toggle.
//   2. FOLLOW-UP  — Interested / Undecided → pick when to follow up next (a sheet
//      that recommends the cadence but lets the BP override it); Not interested →
//      note the reason; Ajukan Pinjaman → the Sales submit flow.
//
// Recording an outcome closes the task on the schedule and returns to the day.

import { useEffect, useState } from 'react'
import { Badge, BottomSheet, Button, Card, Input, NavigationHeader, SelectableCard } from '@/design-system/components'
import { NotePencil, WhatsappLogo } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import {
  INTEREST_META,
  INTEREST_ORDER,
  dateFromToday,
  followUpDateFor,
  hasInterest,
  ktpDetail,
  majelisDetail,
  sourceDetail,
  statusBadge,
  type Interest,
} from '../lib/pipeline'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import {
  DetailRow,
  EditContactSheet,
  INTEREST_TEXT,
  KtpSheet,
  MajelisPickerSheet,
  SourceSheet,
  SubmitSheet,
} from '../lib/pipeline-ui'
import { findTask } from '../lib/schedule'
import { rescheduleCount, store, useApp } from '../lib/store'
import { AppScreen, ContactButton, RescheduleSheet, SectionTitle, StageBar, StickyBar, VisitTitle } from '../lib/ui'
import { IconPhone } from '../lib/icons'

type Contact = 'terhubung' | 'tidak-diangkat' | 'nomor-salah'

const CONTACTS: { value: Contact; title: string; desc: string }[] = [
  { value: 'terhubung', title: 'Terhubung', desc: 'Sempat bicara - catat minat dan langkah berikutnya' },
  { value: 'tidak-diangkat', title: 'Tidak diangkat / tidak dibalas', desc: 'Jadwalkan percobaan berikutnya' },
  { value: 'nomor-salah', title: 'Nomor tidak aktif / salah', desc: 'Prospek ditutup kecuali ada nomor lain' },
]

const STEP_LABELS = ['Hubungi', 'Follow-up']

// When to follow up next — the day offsets offered per interest. Interested is
// worked sooner (tomorrow … 5 days); Undecided is given more room (6 … 10 days).
const WHEN_OFFSETS: Record<Interest, number[]> = {
  interested: [1, 2, 3, 4, 5],
  undecided: [6, 7, 8, 9, 10],
  'not-interested': [30],
}

function whenOptions(interest: Interest): { label: string; date: string }[] {
  return WHEN_OFFSETS[interest].map((n) => ({
    label: n === 1 ? 'Besok' : `${n} hari lagi`,
    date: dateFromToday(n),
  }))
}

type SheetId =
  | 'contact'
  | 'source'
  | 'majelis'
  | 'ktp'
  | 'submit'
  | 'when'
  | 'reason'
  | 'altnumber'
  | 'reschedule'
  | null

export function FollowUpScreen() {
  const flow = useFlow()
  const s = useApp()
  const { leads, openId, followUpTaskId } = usePipeline()
  const lead = leads[openId]

  const [step, setStep] = useState<1 | 2>(1)
  const [contact, setContact] = useState<Contact | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [pick, setPick] = useState<Interest | 'ajukan' | null>(null)
  const [sheet, setSheet] = useState<SheetId>(null)

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Follow up" onBack={() => flow.go('today')} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const canSubmit = lead.status === 'qualified'
  const worked = hasInterest(lead.status)
  const when = `Follow up · Selasa, ${findTask(followUpTaskId)?.time ?? '11.45'}`
  const badge = statusBadge(lead)
  const interest = worked && lead.interest ? lead.interest : null
  const rowsVisible = step === 2 || expanded

  function complete() {
    setSheet(null)
    if (followUpTaskId) store.finishTask(followUpTaskId)
    pipelineStore.endFollowUp()
    flow.go('today')
  }

  function leave() {
    pipelineStore.endFollowUp()
    flow.go('today')
  }

  // Step 1 — "Terhubung" is confirmed with "Lanjut" to move on; the two failed
  // outcomes open their sheet on tap and are completed there.
  function selectContact(value: Contact) {
    setContact(value)
    if (value === 'tidak-diangkat') setSheet('reschedule')
    else if (value === 'nomor-salah') setSheet('altnumber')
  }

  // Step 2 — tapping an outcome opens its sheet.
  function pickOutcome(value: Interest | 'ajukan') {
    setPick(value)
    if (value === 'ajukan') setSheet('submit')
    else if (value === 'not-interested') setSheet('reason')
    else setSheet('when')
  }

  function reschedule(reason: string, date: string) {
    if (followUpTaskId) store.rescheduleTask(followUpTaskId, reason, date)
    leave()
  }

  function reject(reason: string) {
    if (followUpTaskId) store.rejectTask(followUpTaskId, reason)
    leave()
  }

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={lead.name} when={when} />}
          link="Jadwal ulang"
          onLinkClick={() => setSheet('reschedule')}
          onBack={step === 2 ? () => setStep(1) : leave}
        />
      }
    >
      <StageBar current={step} labels={STEP_LABELS} />

      <Card>
        <div className="flex flex-col gap-12">
          <div className="flex items-start gap-12">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="truncate text-18 font-bold text-default">{lead.name}</span>
              <span className="flex items-center gap-8">
                <span className="truncate text-14 text-caption">{lead.phone}</span>
                {step === 2 ? (
                  <button
                    type="button"
                    aria-label="Ubah kontak"
                    onClick={() => setSheet('contact')}
                    className="shrink-0 text-primary-500"
                  >
                    <NotePencil size={16} />
                  </button>
                ) : null}
              </span>
            </div>
            <div className="flex shrink-0 gap-8">
              <ContactButton label={`WhatsApp ${lead.name}`} tone="green" onClick={() => {}}>
                <WhatsappLogo size={20} />
              </ContactButton>
              <ContactButton label={`Telepon ${lead.name}`} tone="primary" onClick={() => {}}>
                <IconPhone size={20} />
              </ContactButton>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-8">
            <Badge intent={badge.intent} variant="outline">
              {badge.label}
            </Badge>
            {interest ? (
              <span className={`text-14 font-bold ${INTEREST_TEXT[interest]}`}>
                {INTEREST_META[interest].label}
              </span>
            ) : null}
          </div>

          {rowsVisible ? (
            <div className="flex flex-col">
              {/* Sumber and KTP lock once she is past Qualified; Majelis stays
                  editable. Editing is only offered on step 2. */}
              <DetailRow
                label="Sumber"
                value={sourceDetail(lead)}
                onEdit={step === 2 && worked ? () => setSheet('source') : undefined}
              />
              <DetailRow
                label="KTP"
                value={ktpDetail(lead)}
                onEdit={step === 2 && worked ? () => setSheet('ktp') : undefined}
                warning={!lead.nik}
              />
              <DetailRow
                label="Majelis"
                value={majelisDetail(lead)}
                onEdit={step === 2 ? () => setSheet('majelis') : undefined}
                warning={lead.majelis.kind === 'none'}
              />
            </div>
          ) : null}

          {/* Show / hide toggle — only on step 1, where the record starts compact. */}
          {step === 1 ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="self-start text-12 font-bold text-link underline"
            >
              {expanded ? 'Lihat lebih sedikit' : 'Lihat selengkapnya'}
            </button>
          ) : null}
        </div>
      </Card>

      {step === 1 ? (
        <>
          <SectionTitle>Hasil kontak</SectionTitle>
          <div className="flex flex-col gap-8">
            {CONTACTS.map((o) => (
              <SelectableCard
                key={o.value}
                name="hasil-kontak"
                inputType="radio"
                title={o.title}
                description={o.desc}
                checked={contact === o.value}
                onChange={() => selectContact(o.value)}
              />
            ))}
          </div>
          <StickyBar>
            <Button
              size="lg"
              className="w-full"
              disabled={contact !== 'terhubung'}
              onClick={() => setStep(2)}
            >
              Lanjut
            </Button>
          </StickyBar>
        </>
      ) : (
        <>
          <SectionTitle>Hasil Follow-Up</SectionTitle>
          <div className="flex flex-col gap-8 pb-16">
            {INTEREST_ORDER.map((value) => (
              <SelectableCard
                key={value}
                name="hasil-follow-up"
                inputType="radio"
                title={INTEREST_META[value].label}
                description={INTEREST_META[value].hint}
                checked={pick === value}
                onChange={() => pickOutcome(value)}
              />
            ))}
            <SelectableCard
              name="hasil-follow-up"
              inputType="radio"
              title="Ajukan Pinjaman"
              description={canSubmit ? 'Kirim pengajuan pinjaman' : 'Pastikan KTP sudah tersedia'}
              checked={pick === 'ajukan'}
              onChange={() => pickOutcome('ajukan')}
            />
          </div>
        </>
      )}

      <EditContactSheet
        open={sheet === 'contact'}
        name={lead.name}
        phone={lead.phone}
        onClose={() => setSheet(null)}
        onSave={(name, phone) => {
          pipelineStore.updateContact(lead.id, name, phone)
          setSheet(null)
        }}
      />
      <SourceSheet
        open={sheet === 'source'}
        onClose={() => setSheet(null)}
        onDone={(data) => {
          pipelineStore.setSource(lead.id, data)
          setSheet(null)
        }}
      />
      <MajelisPickerSheet
        open={sheet === 'majelis'}
        value={lead.majelis}
        onClose={() => setSheet(null)}
        onPick={(m) => {
          pipelineStore.assignMajelis(lead.id, m)
          setSheet(null)
        }}
      />
      <KtpSheet
        open={sheet === 'ktp'}
        nik={lead.nik}
        ktp={lead.ktp}
        onClose={() => setSheet(null)}
        onSave={(nik, ktp) => {
          pipelineStore.updateKtp(lead.id, nik, ktp)
          setSheet(null)
        }}
      />

      {/* Ajukan runs the same submit flow as the Sales page; both finish the task. */}
      <SubmitSheet lead={lead} open={sheet === 'submit'} onClose={() => setSheet(null)} onSaved={complete} />

      {/* Interested / Undecided — pick when to follow up next, cadence recommended. */}
      {pick && pick !== 'ajukan' ? (
        <FollowUpWhenSheet
          interest={pick}
          open={sheet === 'when'}
          onClose={() => setSheet(null)}
          onSave={(date, note) => {
            pipelineStore.recordInterest(lead.id, pick, note, date)
            complete()
          }}
        />
      ) : null}

      {/* Not interested — just the reason. */}
      <ReasonSheet
        open={sheet === 'reason'}
        onClose={() => setSheet(null)}
        onSave={(note) => {
          pipelineStore.recordInterest(lead.id, 'not-interested', note)
          complete()
        }}
      />

      {/* Nomor tidak aktif — an alternative number keeps her open; none closes her. */}
      <AltNumberSheet
        open={sheet === 'altnumber'}
        onClose={() => setSheet(null)}
        onSaveNumber={(phone) => {
          pipelineStore.updateContact(lead.id, lead.name, phone)
          complete()
        }}
        onCloseProspek={complete}
      />

      <RescheduleSheet
        open={sheet === 'reschedule'}
        onClose={() => setSheet(null)}
        subject={lead.name}
        subjectNoun="Follow up"
        count={followUpTaskId ? rescheduleCount(s, followUpTaskId) : 0}
        onConfirm={reschedule}
        onReject={reject}
        hideReason
      />
    </AppScreen>
  )
}

/** Pick the next follow-up date — the cadence is recommended, not forced. */
function FollowUpWhenSheet({
  interest,
  open,
  onClose,
  onSave,
}: {
  interest: Interest
  open: boolean
  onClose: () => void
  onSave: (date: string, note: string) => void
}) {
  const recommended = followUpDateFor(interest)
  const options = whenOptions(interest)
  const [date, setDate] = useState(recommended)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) {
      setDate(recommended)
      setNote('')
    }
  }, [open, recommended])

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Jadwal follow-up berikutnya"
      primaryAction={
        <Button size="lg" className="w-full" onClick={() => onSave(date, note)}>
          Simpan & Selesai
        </Button>
      }
    >
      <div className="flex flex-col gap-8">
        {options.map((o) => {
          // The cadence recommendation now rides the option itself, not a
          // sheet subtitle — e.g. "3 hari lagi (Recommended)".
          const isRecommended = o.date === recommended
          return (
            <SelectableCard
              key={o.date}
              name="followup-when"
              inputType="radio"
              title={isRecommended ? `${o.label} (Recommended)` : o.label}
              description={o.date}
              checked={date === o.date}
              onChange={() => setDate(o.date)}
            />
          )
        })}
        <label className="flex flex-col gap-4 pt-4">
          <span className="text-12 text-caption">Catatan (opsional)</span>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Hasil pembicaraan…" />
        </label>
      </div>
    </BottomSheet>
  )
}

/** The reason a lead is not interested. */
function ReasonSheet({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (note: string) => void
}) {
  const [note, setNote] = useState('')
  useEffect(() => {
    if (open) setNote('')
  }, [open])

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Catat alasan"
      primaryAction={
        <Button size="lg" className="w-full" disabled={note.trim() === ''} onClick={() => onSave(note)}>
          Simpan & Selesai
        </Button>
      }
    >
      <Input
        label="Alasan"
        required
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Apa yang dia katakan"
      />
    </BottomSheet>
  )
}

/**
 * Nomor tidak aktif — ask for an alternative number. One entered keeps the lead
 * open (with her new number); none closes the prospect. One button, its label
 * following what she has.
 */
function AltNumberSheet({
  open,
  onClose,
  onSaveNumber,
  onCloseProspek,
}: {
  open: boolean
  onClose: () => void
  onSaveNumber: (phone: string) => void
  onCloseProspek: () => void
}) {
  const [phone, setPhone] = useState('')
  useEffect(() => {
    if (open) setPhone('')
  }, [open])

  const hasNumber = phone.trim() !== ''

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Nomor tidak aktif / salah"
      description="Apakah ada nomor lain untuk dihubungi? Tanpa nomor lain, prospek ditutup."
      primaryAction={
        <Button
          size="lg"
          className="w-full"
          onClick={() => (hasNumber ? onSaveNumber(phone.trim()) : onCloseProspek())}
        >
          {hasNumber ? 'Simpan nomor' : 'Tutup prospek'}
        </Button>
      }
    >
      <Input
        label="Nomor alternatif"
        optionalText="opsional"
        inputMode="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="08xx-xxxx-xxxx"
      />
    </BottomSheet>
  )
}
