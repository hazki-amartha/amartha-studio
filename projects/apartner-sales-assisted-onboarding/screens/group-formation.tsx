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
import { Camera, CheckCircle, File, MagnifyingGlass, MapPin, Users } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { pipelineStore } from '../lib/pipeline-store'
import {
  FORMATION_STEP_LABEL,
  formationStore,
  getFormation,
  stepsForContext,
  type FormationStepId,
} from '../lib/formation'
import { SelectField } from '../lib/pipeline-ui'
import { RITUAL_POINTS } from '../lib/survey'
import { AppScreen, StageBar, StickyBar } from '../lib/ui'

const MEMBERS = ['Rohaya', 'Siti Aisyah', 'Euis Komariah', 'Nia Kurniasih', 'Dewi Anggraeni', 'Sri Mulyani']
const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const pad = (n: number) => String(n).padStart(2, '0')
const TIMES: string[] = []
for (let m = 8 * 60; m <= 16 * 60; m += 30) TIMES.push(`${pad(Math.floor(m / 60))}.${pad(m % 60)}`)

function UploadRow({
  icon,
  label,
  done,
  onToggle,
}: {
  icon: ReactNode
  label: string
  done: boolean
  onToggle: () => void
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
        <span className="shrink-0 text-12 font-bold text-link">Upload</span>
      )}
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
  const [idx, setIdx] = useState(0)
  const [sheet, setSheet] = useState<SheetId>(null)

  // Ketua
  const [ketua, setKetua] = useState('')
  const [votingPhoto, setVotingPhoto] = useState(false)
  // Perjanjian
  const [pernyataan, setPernyataan] = useState(false)
  const [tanggungRenteng, setTanggungRenteng] = useState(false)
  // Jadwal & Lokasi
  const [locationAddr, setLocationAddr] = useState('')
  const [mapOpen, setMapOpen] = useState(false)
  const [addrDraft, setAddrDraft] = useState('')
  const [hari, setHari] = useState('')
  const [jam, setJam] = useState('')
  // Ritual
  const [ritual, setRitual] = useState<Set<string>>(new Set())

  const current: FormationStepId = steps[idx]
  const isLast = idx === steps.length - 1

  const stepDone =
    current === 'ketua'
      ? ketua !== '' && votingPhoto
      : current === 'perjanjian'
        ? pernyataan && tanggungRenteng
        : current === 'jadwal'
          ? locationAddr !== '' && hari !== '' && jam !== ''
          : ritual.size === RITUAL_POINTS.length

  function back() {
    if (idx === 0) flow.back()
    else setIdx(idx - 1)
  }

  function finish() {
    if (ctx.mode === 'accept') {
      ctx.memberIds.forEach((id) => formationStore.acceptLead(id))
      pipelineStore.setFlash(`${ctx.memberIds.length} anggota baru diterima di ${ctx.majelisName}`)
      flow.go('majelis-page')
    } else {
      formationStore.activateMajelis(ctx.majelisName)
      pipelineStore.setFlash(`${ctx.majelisName} terbentuk`)
      flow.go('sales')
    }
  }

  function next() {
    if (!stepDone) return
    if (isLast) finish()
    else setIdx(idx + 1)
  }

  function toggleRitual(point: string) {
    setRitual((prev) => {
      const nextSet = new Set(prev)
      if (nextSet.has(point)) nextSet.delete(point)
      else nextSet.add(point)
      return nextSet
    })
  }

  const title = ctx.mode === 'accept' ? 'Penerimaan Anggota' : 'Pembentukan Majelis'

  return (
    <AppScreen topBar={<NavigationHeader title={title} onBack={back} />}>
      <div className="flex items-start gap-8 rounded-12 border border-primary-200 bg-primary-50 px-12 py-12">
        <span className="shrink-0 text-primary-500">
          <Users size={20} />
        </span>
        <span className="text-12 text-caption">
          {ctx.mode === 'accept' ? (
            <>
              Penerimaan{' '}
              <span className="font-bold text-primary-500">{ctx.memberNames.join(', ')}</span> ke{' '}
              {ctx.majelisName}
            </>
          ) : (
            <>
              MV pertama <span className="font-bold text-primary-500">{ctx.majelisName}</span> ·{' '}
              {ctx.memberCount} anggota disetujui
            </>
          )}
        </span>
      </div>

      <StageBar current={idx + 1} labels={steps.map((s) => FORMATION_STEP_LABEL[s])} />

      {current === 'ketua' ? (
        <div className="flex flex-col gap-12">
          <StepHeading title="Ketua Majelis" sub="Pilih ketua hasil voting dan lampirkan buktinya." />
          <SelectField
            label="Ketua Majelis"
            required
            value={ketua || undefined}
            placeholder="Pilih ketua majelis"
            onClick={() => setSheet('ketua')}
          />
          <UploadRow
            icon={<Camera size={20} />}
            label="Foto bukti voting"
            done={votingPhoto}
            onToggle={() => setVotingPhoto((v) => !v)}
          />
        </div>
      ) : current === 'perjanjian' ? (
        <div className="flex flex-col gap-12">
          <StepHeading title="Perjanjian Majelis" sub="Lampirkan dokumen perjanjian majelis." />
          <UploadRow
            icon={<File size={20} />}
            label="Surat pernyataan majelis"
            done={pernyataan}
            onToggle={() => setPernyataan((v) => !v)}
          />
          <UploadRow
            icon={<File size={20} />}
            label="Surat tanggung renteng"
            done={tanggungRenteng}
            onToggle={() => setTanggungRenteng((v) => !v)}
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
          {isLast ? (ctx.mode === 'accept' ? 'Terima anggota' : 'Aktifkan Majelis') : 'Lanjut'}
        </Button>
      </StickyBar>

      {/* Pickers */}
      <BottomSheet open={sheet === 'ketua'} onClose={() => setSheet(null)} title="Pilih ketua majelis">
        <div className="flex flex-col gap-8">
          {MEMBERS.map((m) => (
            <SelectableCard
              key={m}
              name="ketua"
              inputType="radio"
              title={m}
              checked={ketua === m}
              onChange={() => {
                setKetua(m)
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
