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
import { MapPin, WhatsappLogo } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import {
  INTEREST_META,
  INTEREST_ORDER,
  dateFromToday,
  followUpDateFor,
  leadType,
  sourceDetail,
  statusBadge,
  type Interest,
} from '../lib/pipeline'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { RiwayatSheet } from '../lib/pipeline-ui'
import { findTask } from '../lib/schedule'
import { rescheduleCount, store, useApp } from '../lib/store'
import { AppScreen, ContactButton, RescheduleSheet, SectionTitle, StageBar, StickyBar, VisitTitle } from '../lib/ui'

type Method = 'call' | 'visit'
type Contact = 'terhubung' | 'tidak-diangkat' | 'nomor-salah' | 'ketemu' | 'tidak-ketemu'

const METHODS: { value: Method; title: string; desc?: string }[] = [
  { value: 'call', title: 'Call' },
  { value: 'visit', title: 'Visit', desc: 'Recommended jika kemungkinan pengajuan tinggi' },
]

const CALL_OUTCOMES: { value: Contact; title: string; desc: string }[] = [
  { value: 'terhubung', title: 'Terhubung', desc: 'Sempat bicara - catat minat dan langkah berikutnya' },
  { value: 'tidak-diangkat', title: 'Tidak diangkat / tidak dibalas', desc: 'Jadwalkan percobaan berikutnya' },
  { value: 'nomor-salah', title: 'Nomor tidak aktif / salah', desc: 'Prospek ditutup kecuali ada nomor lain' },
]

const VISIT_OUTCOMES: { value: Contact; title: string; desc: string }[] = [
  { value: 'ketemu', title: 'Ketemu', desc: 'Sempat bertemu - catat minat dan langkah berikutnya' },
  { value: 'tidak-ketemu', title: 'Tidak ketemu', desc: 'Catat alasan lalu jadwalkan ulang' },
]

// Why she wasn't home when the BP visited — same list the home visit uses.
const ABSENT_REASONS = [
  'Sedang bekerja',
  'Sedang berdagang',
  'Sakit',
  'Sedang bepergian',
  'Tidak tahu',
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
  | 'riwayat'
  | 'ajukan'
  | 'pandu'
  | 'when'
  | 'reason'
  | 'altnumber'
  | 'visit-reason'
  | 'reschedule'
  | null

export function FollowUpScreen() {
  const flow = useFlow()
  const s = useApp()
  const { leads, openId, followUpTaskId } = usePipeline()
  const lead = leads[openId]

  const [step, setStep] = useState<1 | 2>(1)
  const [method, setMethod] = useState<Method | null>(null)
  const [contact, setContact] = useState<Contact | null>(null)
  const [visitReason, setVisitReason] = useState<string | null>(null)
  const [pick, setPick] = useState<Interest | 'ajukan' | null>(null)
  const [sheet, setSheet] = useState<SheetId>(null)

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Follow up" onBack={() => flow.go('today')} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const canSubmit = leadType(lead) === 'qualified'
  const isNewMajelis = lead.majelis.kind === 'new'
  const when = `Follow up · Selasa, ${findTask(followUpTaskId)?.time ?? '11.45'}`
  const badge = statusBadge(lead)

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
    // Both "not reached" outcomes close & reschedule; a wrong number asks for
    // an alternative first. Terhubung / Ketemu are confirmed with Lanjut.
    // A missed visit records WHY first, then reschedules; a missed call goes
    // straight to reschedule; a wrong number asks for an alternative.
    if (value === 'tidak-ketemu') setSheet('visit-reason')
    else if (value === 'tidak-diangkat') setSheet('reschedule')
    else if (value === 'nomor-salah') setSheet('altnumber')
  }

  // Step 2 — tapping an outcome opens its sheet.
  function pickOutcome(value: Interest | 'ajukan') {
    setPick(value)
    if (value === 'ajukan') setSheet('ajukan')
    else if (value === 'not-interested') setSheet('reason')
    else setSheet('when')
  }

  function reschedule(reason: string, date: string) {
    // For a missed visit the reason is the absence reason picked first.
    if (followUpTaskId) store.rescheduleTask(followUpTaskId, visitReason ?? reason, date)
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
              <span className="truncate text-14 text-caption">{lead.phone}</span>
            </div>
            <div className="flex shrink-0 gap-8">
              <ContactButton label={`WhatsApp ${lead.name}`} tone="green" onClick={() => {}}>
                <WhatsappLogo size={20} />
              </ContactButton>
              <ContactButton label={`Peta ${lead.name}`} tone="red" onClick={() => {}}>
                <MapPin size={20} />
              </ContactButton>
            </div>
          </div>

          {/* Sumber, with a divider below it. */}
          <div className="flex items-start gap-4 border-b border-default pb-12 text-14">
            <span className="shrink-0 text-caption">Sumber:</span>
            <span className="text-default">{sourceDetail(lead)}</span>
          </div>

          {/* Her flat status, with the full log one tap away beside it. */}
          <div className="flex items-center gap-8">
            <Badge intent={badge.intent} variant="outline">
              {badge.label}
            </Badge>
            <button
              type="button"
              onClick={() => setSheet('riwayat')}
              className="text-12 text-link"
            >
              Lihat riwayat
            </button>
          </div>
        </div>
      </Card>

      {step === 1 ? (
        <>
          <SectionTitle>Metode</SectionTitle>
          <div className="flex flex-col gap-8">
            {METHODS.map((m) => (
              <SelectableCard
                key={m.value}
                name="metode"
                inputType="radio"
                title={m.title}
                description={m.desc}
                checked={method === m.value}
                onChange={() => {
                  setMethod(m.value)
                  setContact(null)
                }}
              />
            ))}
          </div>

          {method ? (
            <>
              <SectionTitle>{method === 'call' ? 'Hasil kontak' : 'Hasil kunjungan'}</SectionTitle>
              <div className="flex flex-col gap-8">
                {(method === 'call' ? CALL_OUTCOMES : VISIT_OUTCOMES).map((o) => (
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
            </>
          ) : null}

          <StickyBar>
            <Button
              size="lg"
              className="w-full"
              disabled={contact !== 'terhubung' && contact !== 'ketemu'}
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

      <RiwayatSheet lead={lead} open={sheet === 'riwayat'} onClose={() => setSheet(null)} />

      {/* Ajukan Pinjaman — the same choice the Sales record offers. */}
      <BottomSheet open={sheet === 'ajukan'} onClose={() => setSheet(null)} title="Ajukan Pinjaman">
        <div className="flex flex-col gap-8">
          <button
            type="button"
            disabled={isNewMajelis}
            onClick={() => {
              pipelineStore.invite(lead.id)
              complete()
            }}
            className={`flex flex-col gap-2 rounded-12 border p-16 text-left ${
              isNewMajelis ? 'border-default bg-neutral-50' : 'border-default bg-neutral-white'
            }`}
          >
            <span className={`text-14 font-bold ${isNewMajelis ? 'text-disabled' : 'text-default'}`}>
              Undang pengajuan via AFin
            </span>
            <span className="text-12 text-caption">
              {isNewMajelis
                ? 'Tidak tersedia untuk majelis baru — perlu dipandu'
                : 'Calon mitra pengajuan mandiri'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSheet('pandu')}
            className="flex flex-col gap-2 rounded-12 border border-default bg-neutral-white p-16 text-left"
          >
            <span className="text-14 font-bold text-default">Ajukan langsung via APartner</span>
            <span className="text-12 text-caption">Bantu mitra lakukan pengajuan</span>
          </button>
        </div>
      </BottomSheet>

      {/* Pandu calon Mitra — the guided flow. Blank for now; closing finishes the task. */}
      <BottomSheet open={sheet === 'pandu'} onClose={complete} size="fullscreen" title="Pandu Calon Mitra">
        <span className="text-14 text-caption">Alur pandu akan dibuat di sini.</span>
      </BottomSheet>

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

      {/* Tidak ketemu — record why she wasn't there, then reschedule. */}
      <BottomSheet
        open={sheet === 'visit-reason'}
        onClose={() => setSheet(null)}
        title="Kenapa tidak ketemu?"
      >
        <div className="flex flex-col gap-8">
          {ABSENT_REASONS.map((r) => (
            <SelectableCard
              key={r}
              name="visit-reason"
              inputType="radio"
              title={r}
              checked={visitReason === r}
              onChange={() => {
                setVisitReason(r)
                setSheet('reschedule')
              }}
            />
          ))}
        </div>
      </BottomSheet>

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
