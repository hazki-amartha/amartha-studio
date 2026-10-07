'use client'

// Group formation — two shapes, chosen by the formation context (see
// lib/formation.ts):
//
//   form   — activate a NEW (draft) majelis: all four steps (Ketua · Perjanjian ·
//            Jadwal & Lokasi · Ritual).
//   accept — accept a calon mitra into an EXISTING majelis: the two per-member
//            steps (Perjanjian · Ritual).
//
// Every upload / location / photo is a click-through affordance (it flips a
// badge), never a real file picker — same as the rest of this prototype.

import { useState, type ReactNode } from 'react'
import { Badge, BottomSheet, Button, Card, NavigationHeader, SelectableCard } from '@/design-system/components'
import { Camera, Check, CheckCircle, ChevronDown, File, MagnifyingGlass, MapPin, User, Users } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { statusBadge } from '../lib/pipeline'
import { DRAFT_SCHEDULE } from '../lib/schedule'
import {
  FORMATION_STEP_LABEL,
  formationStore,
  getFormation,
  stepsForContext,
  type FormationStepId,
} from '../lib/formation'
import { SelectField } from '../lib/pipeline-ui'
import { store } from '../lib/store'
import { RITUAL_POINTS } from '../lib/survey'
import { AppScreen, StageBar, StickyBar } from '../lib/ui'

// A majelis needs at least this many members to be formed.
const MIN_MEMBERS = 5

type MemberIntent = 'green' | 'blue' | 'orange'
// The candidate members, each with her current sales / application state.
// A new majelis needs this many members before its activation can start.
const MIN_ACTIVATION_MEMBERS = 5

const MEMBERS: { name: string; state: string; intent: MemberIntent }[] = [
  { name: 'Rohaya', state: 'Survey approved', intent: 'green' },
  { name: 'Siti Aisyah', state: 'Survey submitted', intent: 'blue' },
  { name: 'Euis Komariah', state: 'Complete onboarding', intent: 'orange' },
  { name: 'Nia Kurniasih', state: 'Survey approved', intent: 'green' },
  { name: 'Dewi Anggraeni', state: 'Complete onboarding', intent: 'orange' },
  { name: 'Sri Mulyani', state: 'Survey submitted', intent: 'blue' },
]
const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const pad = (n: number) => String(n).padStart(2, '0')
const TIMES: string[] = []
for (let m = 8 * 60; m <= 16 * 60; m += 30) TIMES.push(`${pad(Math.floor(m / 60))}.${pad(m % 60)}`)

function UploadRow({
  icon,
  label,
  done,
  onToggle,
  action = 'Upload',
}: {
  icon: ReactNode
  label: string
  done: boolean
  onToggle: () => void
  /** The affordance label — "Upload" for documents, "Take photo" for a photo. */
  action?: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-12 rounded-8 border border-default bg-neutral-white p-12 text-left active:bg-neutral-50"
    >
      <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-14 font-bold text-default">{label}</span>
      {done ? (
        <Badge intent="green">Terlampir</Badge>
      ) : (
        <span className="shrink-0 text-12 font-bold text-link">{action}</span>
      )}
    </button>
  )
}

/** A picker drawn like UploadRow, so the two sit together as one style. */
function PickerRow({
  icon,
  label,
  value,
  placeholder,
  onClick,
}: {
  icon: ReactNode
  label: string
  value: string
  placeholder: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-12 rounded-8 border border-default bg-neutral-white p-12 text-left active:bg-neutral-50"
    >
      <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-14 font-bold text-default">
          {label}
          <span className="text-red-500"> *</span>
        </span>
        <span className={`truncate text-12 ${value ? 'text-default' : 'text-placeholder'}`}>
          {value || placeholder}
        </span>
      </span>
      <span className="shrink-0 text-disabled">
        <ChevronDown size={20} />
      </span>
    </button>
  )
}

function StepHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-18 font-bold text-default">{title}</span>
      <span className="text-12 text-caption">{sub}</span>
    </div>
  )
}

type SheetId = 'ketua' | 'hari' | 'jam' | null

export function GroupFormationScreen() {
  const flow = useFlow()
  const ctx = getFormation()
  const steps = stepsForContext(ctx)
  // Jadwal & lokasi were set on "Buat Majelis Baru" — prefill them here.
  const { leads, openId } = usePipeline()
  const newAssign = leads[openId]?.majelis.kind === 'new' ? leads[openId].majelis : undefined
  const draftSched = DRAFT_SCHEDULE[ctx.majelisName]
  const prefLocation =
    (newAssign && 'location' in newAssign ? newAssign.location : undefined) ??
    draftSched?.location ??
    ''
  const prefHari =
    (newAssign && 'day' in newAssign ? newAssign.day : undefined) ?? draftSched?.day ?? ''
  const prefJam =
    (newAssign && 'time' in newAssign ? newAssign.time : undefined) ?? draftSched?.time ?? ''
  // The majelis' current members (pipeline leads on this new majelis).
  const majelisMembers = Object.values(leads).filter(
    (l) => l.majelis.kind === 'new' && l.majelis.name === ctx.majelisName,
  )
  const [idx, setIdx] = useState(0)
  const [sheet, setSheet] = useState<SheetId>(null)

  // Anggota — who goes into the group; everyone is pre-checked, uncheck to drop.
  const [members, setMembers] = useState<Set<string>>(() => new Set(MEMBERS.map((m) => m.name)))
  // Ketua
  const [ketua, setKetua] = useState('')
  const [votingPhoto, setVotingPhoto] = useState(false)
  const [kmPhoto, setKmPhoto] = useState(false)
  // Perjanjian
  const [pernyataan, setPernyataan] = useState(false)
  // Jadwal & Lokasi — prefilled from the new majelis' saved schedule.
  const [locationAddr, setLocationAddr] = useState(prefLocation)
  const [mapOpen, setMapOpen] = useState(false)
  const [addrDraft, setAddrDraft] = useState('')
  const [hari, setHari] = useState(prefHari)
  const [jam, setJam] = useState(prefJam)
  // Ritual
  const [ritual, setRitual] = useState<Set<string>>(new Set())

  const current: FormationStepId = steps[idx]
  const isLast = idx === steps.length - 1

  const stepDone =
    current === 'anggota'
      ? members.size >= MIN_MEMBERS
      : current === 'ketua'
      ? ketua !== '' && votingPhoto && kmPhoto
      : current === 'perjanjian'
        ? pernyataan
        : current === 'jadwal'
          ? locationAddr !== '' && hari !== '' && jam !== ''
          : ritual.size === RITUAL_POINTS.length

  function back() {
    if (idx === 0) flow.back()
    else setIdx(idx - 1)
  }

  function finish() {
    // Return to whoever launched the flow (`returnTo`) — the Survey Ongoing page
    // when it was started from there, otherwise the default per mode.
    if (ctx.mode === 'accept') {
      ctx.memberIds.forEach((id) => formationStore.acceptLead(id))
      pipelineStore.setFlash(`${ctx.memberIds.length} anggota baru diterima di ${ctx.majelisName}`)
      flow.go(ctx.returnTo ?? 'majelis-page')
    } else if (ctx.phase === 'perjanjian') {
      // Onboarding perjanjian agreed — the actual group is formed after approval.
      formationStore.agreePerjanjian(ctx.majelisName)
      store.setFlash(`Perjanjian ${ctx.majelisName} tersimpan`)
      if (ctx.returnTo) flow.go(ctx.returnTo)
      else flow.back()
    } else {
      formationStore.activateMajelis(ctx.majelisName)
      store.setFlash(`Majelis ${ctx.majelisName} berhasil dibentuk`)
      // Return to where the formation was started — from a lead, that's her
      // page, now showing "Ready for disbursement".
      if (ctx.returnTo) flow.go(ctx.returnTo)
      else flow.back()
    }
  }

  function next() {
    if (!stepDone) return
    if (isLast) finish()
    else setIdx(idx + 1)
  }

  function toggleMember(name: string) {
    setMembers((prev) => {
      const nextSet = new Set(prev)
      if (nextSet.has(name)) nextSet.delete(name)
      else nextSet.add(name)
      return nextSet
    })
  }

  function toggleRitual(point: string) {
    setRitual((prev) => {
      const nextSet = new Set(prev)
      if (nextSet.has(point)) nextSet.delete(point)
      else nextSet.add(point)
      return nextSet
    })
  }

  const title =
    ctx.mode === 'accept'
      ? 'Penerimaan Anggota'
      : ctx.phase === 'perjanjian'
        ? 'Upload perjanjian majelis'
        : `Group activation ${ctx.majelisName}`

  // Not enough members to activate yet — show who's in and how many more are
  // needed, instead of the Ketua / Jadwal steps.
  if (
    ctx.mode === 'form' &&
    ctx.phase === 'majelis' &&
    majelisMembers.length < MIN_ACTIVATION_MEMBERS
  ) {
    const need = MIN_ACTIVATION_MEMBERS - majelisMembers.length
    return (
      <AppScreen topBar={<NavigationHeader title={title} onBack={() => flow.back()} />}>
        <div className="flex items-start gap-8 rounded-16 border border-orange-200 bg-orange-50 p-12">
          <span className="shrink-0 text-orange-500">
            <Users size={20} />
          </span>
          <div className="flex flex-col gap-2">
            <span className="text-14 font-bold text-default">Belum bisa aktivasi majelis</span>
            <span className="text-12 text-default">
              Butuh {MIN_ACTIVATION_MEMBERS} anggota untuk mulai aktivasi. Baru{' '}
              {majelisMembers.length} anggota — kurang {need} anggota lagi.
            </span>
          </div>
        </div>

        <span className="pt-2 text-14 font-bold text-default">Anggota majelis</span>
        <div className="flex flex-col gap-8">
          {majelisMembers.map((m) => {
            const b = statusBadge(m)
            return (
              <div
                key={m.id}
                className="flex items-center gap-8 rounded-12 border border-default bg-neutral-white p-12"
              >
                <span className="min-w-0 flex-1 text-14 font-bold text-default">{m.name}</span>
                <Badge intent={b.intent} size="sm">
                  {b.label}
                </Badge>
              </div>
            )
          })}
        </div>
      </AppScreen>
    )
  }

  return (
    <AppScreen topBar={<NavigationHeader title={title} onBack={back} />}>
      {/* The stepper only makes sense for a multi-step flow — not the single-page
          acceptance, nor the one-step onboarding perjanjian. */}
      {ctx.mode === 'form' && steps.length > 1 ? (
        <StageBar current={idx + 1} labels={steps.map((s) => FORMATION_STEP_LABEL[s])} />
      ) : null}

      {current === 'anggota' ? (
        <div className="flex flex-col gap-12">
          <StepHeading
            title="Anggota Majelis"
            sub="Semua calon tercentang. Hilangkan centang untuk anggota yang tidak masuk majelis ini."
          />
          <div className="flex flex-col gap-8">
            {MEMBERS.map((m) => {
              const checked = members.has(m.name)
              return (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => toggleMember(m.name)}
                  className="flex items-center gap-12 rounded-8 border border-default bg-neutral-white p-12 text-left active:bg-neutral-50"
                >
                  <span
                    className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-8 border-2 ${
                      checked ? 'border-primary-500 bg-primary-500 text-neutral-white' : 'border-neutral-200'
                    }`}
                  >
                    {checked ? <Check size={16} /> : null}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col items-start gap-2">
                    <span className="text-14 font-bold text-default">{m.name}</span>
                    <Badge intent={m.intent} size="sm">
                      {m.state}
                    </Badge>
                  </span>
                </button>
              )
            })}
          </div>
          <span
            className={`text-12 ${members.size < MIN_MEMBERS ? 'font-bold text-orange-500' : 'text-caption'}`}
          >
            {members.size < MIN_MEMBERS
              ? `Pilih minimal ${MIN_MEMBERS} anggota (${members.size} dipilih)`
              : `${members.size} anggota dipilih`}
          </span>
        </div>
      ) : current === 'ketua' ? (
        <div className="flex flex-col gap-12">
          <StepHeading title="Ketua Majelis" sub="Pilih ketua hasil voting dan lampirkan buktinya." />
          <PickerRow
            icon={<User size={20} />}
            label="Ketua Majelis"
            value={ketua}
            placeholder="Pilih ketua majelis"
            onClick={() => setSheet('ketua')}
          />
          <UploadRow
            icon={<Camera size={20} />}
            label="Form bukti pemilihan majelis"
            action="Take photo"
            done={votingPhoto}
            onToggle={() => setVotingPhoto((v) => !v)}
          />
          <UploadRow
            icon={<Camera size={20} />}
            label="Surat pernyataan KM"
            action="Take photo"
            done={kmPhoto}
            onToggle={() => setKmPhoto((v) => !v)}
          />
        </div>
      ) : current === 'perjanjian' ? (
        <div className="flex flex-col gap-12">
          <UploadRow
            icon={<File size={20} />}
            label="Surat pernyataan majelis & tanggung renteng"
            action="Take photo"
            done={pernyataan}
            onToggle={() => setPernyataan((v) => !v)}
          />
        </div>
      ) : current === 'jadwal' ? (
        <div className="flex flex-col gap-12">
          <StepHeading title="Jadwal & Lokasi" sub="Tentukan lokasi dan jadwal kumpulan majelis." />
          <div className="flex flex-col gap-8">
            <span className="text-12 font-regular text-default">
              Lokasi kumpulan<span className="text-red-500"> *</span>
            </span>
            {locationAddr ? (
              <div className="flex items-start justify-between gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8">
                <span className="flex min-w-0 items-start gap-8 text-12 text-green-600">
                  <span className="shrink-0">
                    <MapPin size={20} />
                  </span>
                  <span className="min-w-0">{locationAddr}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAddrDraft(locationAddr)
                    setMapOpen(true)
                  }}
                  className="shrink-0 text-12 font-bold text-link"
                >
                  Ubah
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAddrDraft('')
                  setMapOpen(true)
                }}
                className="flex items-center justify-center gap-8 rounded-8 border border-dashed border-default py-16 text-14 font-bold text-primary-500"
              >
                <MapPin size={20} />
                Pilih lokasi kumpulan
              </button>
            )}
          </div>
          <SelectField
            label="Hari kumpulan"
            required
            value={hari || undefined}
            placeholder="Pilih hari kumpulan"
            onClick={() => setSheet('hari')}
          />
          <SelectField
            label="Jam kumpulan"
            required
            value={jam || undefined}
            placeholder="Pilih jam kumpulan"
            onClick={() => setSheet('jam')}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          <StepHeading title="Ritual Majelis" sub="Jalankan dan centang ketiga ritual berikut." />
          <Card>
            <div className="flex flex-col">
              {RITUAL_POINTS.map((point, i) => {
                const checked = ritual.has(point)
                return (
                  <button
                    key={point}
                    type="button"
                    onClick={() => toggleRitual(point)}
                    className={`flex items-center gap-12 py-12 text-left ${i > 0 ? 'border-t border-default' : ''}`}
                  >
                    <span className="shrink-0">
                      {checked ? (
                        <span className="text-green-500">
                          <CheckCircle size={24} />
                        </span>
                      ) : (
                        <span className="block h-24 w-24 rounded-full border-2 border-neutral-400" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 text-14 text-default">{point}</span>
                  </button>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      <StickyBar>
        <Button size="lg" className="w-full" disabled={!stepDone} onClick={next}>
          {isLast
            ? ctx.mode === 'accept'
              ? 'Terima anggota'
              : ctx.phase === 'perjanjian'
                ? 'Submit'
                : 'Aktifkan Majelis'
            : 'Lanjut'}
        </Button>
      </StickyBar>

      {/* Pickers */}
      <BottomSheet open={sheet === 'ketua'} onClose={() => setSheet(null)} title="Pilih ketua majelis">
        <div className="flex flex-col gap-8">
          {MEMBERS.filter((m) => members.has(m.name)).map((m) => (
            <SelectableCard
              key={m.name}
              name="ketua"
              inputType="radio"
              title={m.name}
              checked={ketua === m.name}
              onChange={() => {
                setKetua(m.name)
                setSheet(null)
              }}
            />
          ))}
        </div>
      </BottomSheet>
      <BottomSheet open={sheet === 'hari'} onClose={() => setSheet(null)} title="Pilih hari kumpulan">
        <div className="flex flex-col gap-8">
          {HARI.map((h) => (
            <SelectableCard
              key={h}
              name="hari"
              inputType="radio"
              title={h}
              checked={hari === h}
              onChange={() => {
                setHari(h)
                setSheet(null)
              }}
            />
          ))}
        </div>
      </BottomSheet>
      <BottomSheet open={sheet === 'jam'} onClose={() => setSheet(null)} title="Pilih jam kumpulan">
        <div className="flex flex-col gap-8">
          {TIMES.map((t) => (
            <SelectableCard
              key={t}
              name="jam"
              inputType="radio"
              title={t}
              checked={jam === t}
              onChange={() => {
                setJam(t)
                setSheet(null)
              }}
            />
          ))}
        </div>
      </BottomSheet>

      <BottomSheet
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        size="fullscreen"
        title="Pilih lokasi kumpulan"
        description="Lokasi kumpulan bisa berbeda dari lokasi majelis yang didaftarkan."
      >
        <div className="flex flex-col gap-12">
          <div className="flex items-center gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 focus-within:border-primary-500">
            <span className="shrink-0 text-disabled">
              <MagnifyingGlass size={20} />
            </span>
            <input
              value={addrDraft}
              onChange={(e) => setAddrDraft(e.target.value)}
              placeholder="Ketik alamat lokasi kumpulan"
              aria-label="Cari alamat lokasi kumpulan"
              className="min-w-0 flex-1 bg-transparent text-14 text-default outline-none placeholder:text-placeholder"
            />
          </div>
          <div className="relative flex flex-col items-center justify-center gap-8 overflow-hidden rounded-12 bg-blue-50 py-48 text-caption">
            <span className="text-primary-500">
              <MapPin size={24} />
            </span>
            <span className="px-16 text-center text-12">
              {addrDraft.trim() ? addrDraft.trim() : 'Ketik alamat atau geser peta untuk menandai lokasi'}
            </span>
          </div>
          <Button
            size="lg"
            className="w-full"
            disabled={!addrDraft.trim()}
            onClick={() => {
              setLocationAddr(addrDraft.trim())
              setMapOpen(false)
            }}
          >
            Gunakan lokasi ini
          </Button>
        </div>
      </BottomSheet>
    </AppScreen>
  )
}
