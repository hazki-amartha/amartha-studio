'use client'

// Sosialisasi — the lead-generation stop, and the first task on this day that
// is not about a woman who already borrows.
//
// One task, three steps, on an in-screen stepper: Kunjungi POI (the brief —
// where she is going, who to ask for, and what the BP already knows about the
// place), Catat lead (the prospects she takes there), and Bukti (the photo that
// proves the visit). Every prospect captured IS a Sales lead from THIS POI, so
// the capture form is the Sales "Tambah Lead" form with its source fixed to
// this POI, and each save lands a real lead in the pipeline.

import { useState } from 'react'
import { Badge, BottomSheet, Button, Card, Input, NavigationHeader } from '@/design-system/components'
import { Camera, FileCheck, MapPin, WhatsappLogo } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { INCOMPLETE_LABEL, dateFromToday, leadType, majelisLine, statusBadge, type MajelisAssignment } from '../lib/pipeline'
import { pipelineStore, setAddLeadEntry, usePipeline } from '../lib/pipeline-store'
import { KtpSheet } from '../lib/pipeline-ui'
import { IconUserPlus } from '../lib/icons'
import { openEvent, rescheduleCount, store, useApp } from '../lib/store'
import { findTask } from '../lib/schedule'
import { AppScreen, RescheduleSheet, SectionTitle, StageBar, StickyBar, VisitTitle } from '../lib/ui'
import { PoiImage } from '../lib/poi-image'
import type { ReactNode } from 'react'

const STEP_LABELS = ['Kunjungi POI', 'Catat lead', 'Bukti']

export function SosialisasiScreen() {
  const flow = useFlow()
  const s = useApp()
  const { leads, order } = usePipeline()
  const event = openEvent(s)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [rescheduling, setRescheduling] = useState(false)
  const [adding, setAdding] = useState(false)
  const [photo, setPhoto] = useState(false)
  const [maximize, setMaximize] = useState(false)
  // When she moves on short of the target, why — captured before the proof step.
  const [missSheet, setMissSheet] = useState(false)
  const [missReason, setMissReason] = useState('')
  // Only a rostered sosialisasi has a task to move; opened without one, the
  // reschedule entry point stays off.
  const taskId = s.activeTask
  const when = findTask(taskId)?.time ?? '14.00'

  // Every prospect sourced from THIS POI — the ones the creator (BM/AM) pre-
  // recorded plus whatever the BP adds in this session, since a POI capture
  // lands in the pipeline with its source fixed to this POI.
  const captured = order
    .map((id) => leads[id])
    .filter((l) => l && l.source === 'poi' && l.poi === event.poi)
  const hit = captured.length >= event.target

  function finish() {
    store.finishTask()
    flow.go('today')
  }

  function reschedule(reason: string, date: string) {
    if (taskId) store.rescheduleTask(taskId, reason, date)
    setRescheduling(false)
    flow.go('today')
  }

  function reject(reason: string) {
    if (taskId) store.rejectTask(taskId, reason)
    setRescheduling(false)
    flow.go('today')
  }

  // One header across all three steps: the POI's name over a subtitle that
  // always reads "Sosialisasi · Selasa, HH.MM", so the visit is named the same
  // way whether she is on the brief, the leads, or the proof. Reschedule stays
  // on the first two steps; back walks the flow before it leaves to the schedule.
  const topBar = (
    <NavigationHeader
      title={<VisitTitle title={event.title} when={`Sosialisasi · Selasa, ${when}`} />}
      link={step !== 3 && taskId ? 'Jadwal ulang' : undefined}
      onLinkClick={step !== 3 && taskId ? () => setRescheduling(true) : undefined}
      onBack={() => (step === 1 ? flow.go('today') : setStep((step - 1) as 1 | 2))}
    />
  )

  return (
    <AppScreen topBar={topBar}>
      <StageBar current={step} labels={STEP_LABELS} />

      {/* --- Step 1 · Kunjungi POI: the brief. Where she is going and what she
          already knows about the place, ending in the button that starts it. */}
      {step === 1 ? (
        <>
          <Card>
            <div className="flex flex-col gap-12">
              <div className="flex items-center gap-8">
                {/* The POI's "photo" — tap to maximize. */}
                <button
                  type="button"
                  onClick={() => setMaximize(true)}
                  aria-label={`Perbesar foto ${event.title}`}
                  className="h-40 w-40 shrink-0 overflow-hidden rounded-8 border border-default"
                >
                  <PoiImage art={event.art} className="h-full w-full" />
                </button>
                <span className="min-w-0 flex-1 truncate text-14 font-bold text-default">
                  {event.title}
                </span>
              </div>

              <BriefRow
                label="Alamat"
                action={
                  <PinButton label={`Buka peta ${event.title}`} tone="red">
                    <MapPin size={20} />
                  </PinButton>
                }
              >
                {event.address}
              </BriefRow>

              <BriefRow
                label="Kontak"
                action={
                  event.contact ? (
                    <PinButton label={`WhatsApp ${event.contact}`} tone="green">
                      <WhatsappLogo size={20} />
                    </PinButton>
                  ) : undefined
                }
              >
                {event.contact || '-'}
              </BriefRow>

              <BriefRow label="Capaian/target">
                {captured.length}/{event.target} leads
              </BriefRow>

              {event.guide ? (
                <BriefRow label="Catatan panduan">
                  <span className="italic">{event.guide}</span>
                </BriefRow>
              ) : null}
            </div>
          </Card>

          <StickyBar>
            <Button size="lg" className="w-full" onClick={() => setStep(2)}>
              Mulai cari leads
            </Button>
          </StickyBar>
        </>
      ) : null}

      {/* --- Step 2 · Catat lead: the prospects taken here, and the one control
          that adds another. */}
      {step === 2 ? (
        <>
          <div className="flex flex-col gap-2">
            <SectionTitle>List leads</SectionTitle>
            <span className="text-12 text-caption">
              {captured.length}/{event.target} target tercapai
            </span>
          </div>

          {captured.length > 0 ? (
            <div className="flex flex-col gap-8">
              {captured.map((lead) => {
                const badge = statusBadge(lead)
                const unqualified = leadType(lead) === 'unqualified'
                return (
                  // Same card as the Sales roster, minus the Sumber line — every
                  // lead here shares this POI's source, so printing it on each
                  // row would say one thing many times.
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => {
                      pipelineStore.open(lead.id)
                      flow.go('lead-detail')
                    }}
                    className="flex w-full items-start gap-8 rounded-12 border border-default bg-neutral-white p-12 text-left active:bg-neutral-50"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <span className="truncate text-14 font-bold text-default">{lead.name}</span>
                      <span className="truncate text-12 text-caption">{majelisLine(lead)}</span>
                      {unqualified ? (
                        <span className="truncate text-12 text-orange-600">{INCOMPLETE_LABEL}</span>
                      ) : null}
                    </div>
                    <Badge intent={badge.intent}>{badge.label}</Badge>
                  </button>
                )
              })}
            </div>
          ) : (
            <Card>
              <div className="flex flex-col items-center gap-8 py-24 text-center">
                <span className="text-14 font-bold text-default">Belum ada prospek</span>
                <span className="text-12 text-caption">
                  Catat setiap ibu yang tertarik sebagai lead POI Visit. Data lengkapnya bisa
                  menyusul saat follow up.
                </span>
              </div>
            </Card>
          )}

          <Button size="md" className="w-full" onClick={() => setAdding(true)}>
            <span className="flex items-center justify-center gap-8">
              <IconUserPlus size={20} />
              Tambah lead
            </span>
          </Button>

          <StickyBar>
            <div className="flex items-center gap-8">
              <span className="flex-1 text-12 text-caption">
                {hit ? 'Target tercapai' : `Kurang ${event.target - captured.length} prospek dari target`}
              </span>
              <Badge intent={hit ? 'green' : 'orange'} size="sm">
                {captured.length}/{event.target}
              </Badge>
            </div>
            <div className="flex gap-8">
              <Button size="lg" variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                Kembali
              </Button>
              {/* Short of target → ask why before the proof step; on target, straight on. */}
              <Button size="lg" className="flex-1" onClick={() => (hit ? setStep(3) : setMissSheet(true))}>
                Lanjut
              </Button>
            </div>
          </StickyBar>
        </>
      ) : null}

      {/* --- Step 3 · Bukti: the photo that proves the visit, gating the close. */}
      {step === 3 ? (
        <>
          <SectionTitle>Bukti kunjungan</SectionTitle>
          {photo ? (
            <div className="flex items-center gap-8 rounded-12 border border-green-500 bg-green-50 px-12 py-12 text-12">
              <span className="text-green-500">
                <FileCheck size={20} />
              </span>
              <span className="flex-1 text-default">Foto kunjungan tersimpan</span>
              <button
                type="button"
                onClick={() => setPhoto(false)}
                className="shrink-0 text-12 font-bold text-link"
              >
                Ambil ulang
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPhoto(true)}
              className="flex w-full flex-col items-center gap-8 rounded-12 border border-default bg-canvas-blue p-24 text-caption"
            >
              <Camera size={24} />
              <span className="text-14 font-bold text-default">Ambil foto</span>
            </button>
          )}

          <StickyBar>
            {!photo ? (
              <span className="text-center text-12 text-caption">Ambil foto dulu untuk mengirim</span>
            ) : null}
            <Button size="lg" className="w-full" disabled={!photo} onClick={finish}>
              Selesaikan Tugas
            </Button>
          </StickyBar>
        </>
      ) : null}

      <AddProspekSheet
        open={adding}
        onClose={() => setAdding(false)}
        poi={event.poi}
        onSaved={() => setAdding(false)}
        onFullForm={(draft) => {
          setAddLeadEntry({ mode: 'ajukan', draft: { ...draft, poi: event.poi } })
          setAdding(false)
          flow.go('lead-new')
        }}
      />

      <RescheduleSheet
        open={rescheduling}
        onClose={() => setRescheduling(false)}
        subject={event.title}
        subjectNoun="Sosialisasi"
        count={taskId ? rescheduleCount(s, taskId) : 0}
        onConfirm={reschedule}
        onReject={reject}
      />

      <BottomSheet open={maximize} onClose={() => setMaximize(false)} title={event.title}>
        <div className="aspect-square w-full overflow-hidden rounded-12 border border-default">
          <PoiImage art={event.art} className="h-full w-full" />
        </div>
      </BottomSheet>

      <BottomSheet
        open={missSheet}
        onClose={() => setMissSheet(false)}
        title="Kenapa tidak bisa memenuhi target?"
        primaryAction={
          <Button
            size="lg"
            className="w-full"
            disabled={!missReason.trim()}
            onClick={() => {
              setMissSheet(false)
              setStep(3)
            }}
          >
            Lanjut
          </Button>
        }
      >
        <Input
          label="Alasan"
          value={missReason}
          onChange={(e) => setMissReason(e.target.value)}
          placeholder="Mis. banyak pedagang sedang sibuk melayani pembeli"
        />
      </BottomSheet>
    </AppScreen>
  )
}

/** One label-over-value row on the POI brief, with an optional pin/WA action. */
function BriefRow({
  label,
  children,
  action,
}: {
  label: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex items-start gap-8 border-t border-default pt-12">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-12 text-caption">{label}:</span>
        <span className="text-14 text-default">{children}</span>
      </div>
      {action ? <span className="shrink-0">{action}</span> : null}
    </div>
  )
}

/** The small round map / WhatsApp affordance beside a brief row. Draws the
 *  control; the prototype never leaves the frame (§3), so it does not navigate. */
function PinButton({
  label,
  tone = 'neutral',
  children,
}: {
  label: string
  tone?: 'neutral' | 'green' | 'red'
  children: ReactNode
}) {
  const toneClass =
    tone === 'green'
      ? 'border-green-200 bg-green-50 text-green-500'
      : tone === 'red'
        ? 'border-red-200 bg-red-50 text-red-500'
        : 'border-default bg-neutral-white text-caption'
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {}}
      className={`flex h-32 w-32 items-center justify-center rounded-full border ${toneClass}`}
    >
      {children}
    </button>
  )
}

const DEFAULT_MAJELIS: MajelisAssignment = { kind: 'none', branch: 'BP Ciseeng' }

// The follow-up options offered right after a prospect is saved. 3 days is the
// recommended cadence for a fresh (Interested) lead.
const FOLLOWUP_OPTIONS: { label: string; days: number; recommended?: boolean }[] = [
  { label: '1 hari lagi', days: 1 },
  { label: '2 hari lagi', days: 2 },
  { label: '3 hari lagi', days: 3, recommended: true },
  { label: '4 hari lagi', days: 4 },
  { label: '5 hari lagi', days: 5 },
]

/**
 * The Sales "Tambah Lead" form, adapted for a sosialisasi: everyone here is
 * sourced from this POI Visit, so Sumber and Majelis are not asked. KTP capture
 * follows the Sales page — the photo reads the NIK straight off it (OCR). Each
 * save is a real `pipelineStore.addLead`, then the BP picks when to follow up.
 */
function AddProspekSheet({
  open,
  onClose,
  poi,
  onSaved,
  onFullForm,
}: {
  open: boolean
  onClose: () => void
  poi: string
  onSaved: (id: string) => void
  /** Skip the quick capture — open the full Add Lead form as a pengajuan, with
   *  the name/phone/KTP already typed carried over. */
  onFullForm: (draft: { name: string; phone: string; nik: string; ktp: boolean }) => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [nik, setNik] = useState('')
  const [ktp, setKtp] = useState(false)
  const [sub, setSub] = useState<'ktp' | 'followup' | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)

  const ready = name.trim() !== '' && phone.trim() !== ''
  const hasKtp = ktp && nik.replace(/\D/g, '').length === 16

  function reset() {
    setName('')
    setPhone('')
    setNik('')
    setKtp(false)
    setSub(null)
    setSavedId(null)
  }

  function save() {
    if (!ready) return
    const id = pipelineStore.addLead({
      name,
      phone,
      source: 'poi',
      poi,
      referredBy: '',
      referrerKind: null,
      majelis: DEFAULT_MAJELIS,
      nik,
      ktp,
    })
    setSavedId(id)
    setSub('followup')
  }

  function pickFollowUp(days: number) {
    const id = savedId
    if (id) pipelineStore.setFollowUp(id, dateFromToday(days))
    reset()
    if (id) onSaved(id)
  }

  return (
    <>
      <BottomSheet
        open={open && sub === null}
        onClose={() => {
          reset()
          onClose()
        }}
        title="Tambah Lead"
        primaryAction={
          <div className="flex flex-col gap-8">
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              disabled={!ready}
              onClick={() => onFullForm({ name, phone, nik, ktp })}
            >
              Langsung Ajukan Pinjaman
            </Button>
            <Button size="lg" className="w-full" disabled={!ready} onClick={save}>
              Simpan Lead
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-12">
          <Input
            label="Nama"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama calon mitra"
          />
          <Input
            label="No. HP"
            required
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08xx-xxxx-xxxx"
          />

          {/* KTP — Sales-page style: opens the KTP sheet; the photo reads the NIK. */}
          <div className="flex flex-col gap-4">
            <span className="text-12 text-caption">KTP</span>
            <button
              type="button"
              onClick={() => setSub('ktp')}
              className="flex items-center justify-between gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-left text-14"
            >
              <span className={hasKtp ? 'text-default' : 'text-placeholder'}>
                {hasKtp ? nik : 'Lengkapi KTP (opsional)'}
              </span>
              <span className="shrink-0 text-12 font-bold text-link">{hasKtp ? 'Ubah' : 'Isi'}</span>
            </button>
          </div>
        </div>
      </BottomSheet>

      <KtpSheet
        open={open && sub === 'ktp'}
        nik={nik}
        ktp={ktp}
        onClose={() => setSub(null)}
        onSave={(n, k) => {
          setNik(n)
          setKtp(k)
          setSub(null)
        }}
      />

      {/* After saving, ask when to follow up — 3 days recommended. */}
      <BottomSheet
        open={open && sub === 'followup'}
        onClose={() => pickFollowUp(3)}
        title="Kapan follow up?"
        description="Jadwalkan kapan prospek ini dihubungi lagi."
      >
        <div className="flex flex-col gap-8">
          {FOLLOWUP_OPTIONS.map((o) => (
            <button
              key={o.days}
              type="button"
              onClick={() => pickFollowUp(o.days)}
              className={`flex items-center justify-between gap-8 rounded-12 border p-16 text-left ${
                o.recommended ? 'border-primary-500 bg-primary-50' : 'border-default bg-neutral-white'
              }`}
            >
              <span className="flex flex-col gap-2">
                <span className="text-14 font-bold text-default">{o.label}</span>
                <span className="text-12 text-caption">{dateFromToday(o.days)}</span>
              </span>
              {o.recommended ? (
                <span className="shrink-0 rounded-full bg-primary-500 px-8 py-2 text-10 font-bold text-neutral-white">
                  Disarankan
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  )
}
