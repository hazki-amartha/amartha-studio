'use client'

// Mulai Pendaftaran — the page reached from a follow-up's "Mulai pendaftaran".
// Before the majelis logic runs, the BP confirms the lead's KTP and address
// (pre-filled from what was captured when the lead was added) and picks the
// majelis: an existing one, or a new one. Tapping "Mulai Pendaftaran" then runs
// the same downstream flow as before — existing majelis creates the Perkenalan
// majelis follow-up; a new majelis opens the Sosialisasi form.

import { useState } from 'react'
import { BottomSheet, Button, Input, NavigationHeader, SelectableCard } from '@/design-system/components'
import { Camera, FileCheck, MapPin } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { MAJELIS_DIRECTORY, majelisDistanceKm } from '../lib/schedule'
import { pipelineStore, setOnboardingTiming, usePipeline } from '../lib/pipeline-store'
import { OnboardingTimingSheet, PickSheet, SelectField } from '../lib/pipeline-ui'
import { AppScreen, SearchField, StickyBar } from '../lib/ui'
import {
  EMPTY_ADDRESS,
  KECAMATAN_LIST,
  WILAYAH,
  addressComplete,
  type LeadAddress,
} from '../lib/pipeline'

type SheetId = 'kecamatan' | 'desa' | 'majelis' | null

const NEW_MAJELIS = 'Majelis baru'
// A stand-in for OCR — uploading the KTP reads a NIK the BP can still edit.
const READ_NIK = '3201094507910023'

export function PendaftaranScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]
  const [sheet, setSheet] = useState<SheetId>(null)
  const [ktp, setKtp] = useState(lead?.ktp ?? false)
  const [nik, setNik] = useState(lead?.nik ?? '')
  const [address, setAddress] = useState<LeadAddress>(lead?.address ?? EMPTY_ADDRESS)
  // '' = none, 'baru' = new majelis, otherwise an existing majelis id.
  const [majelisChoice, setMajelisChoice] = useState('')
  const [majelisQuery, setMajelisQuery] = useState('')
  // The onboarding-timing sheet (existing majelis) — opened once the data is
  // filled: onboard now, or save as a calon mitra and continue later.
  const [timingOpen, setTimingOpen] = useState(false)

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Lengkapi data" onBack={() => flow.back()} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const active = MAJELIS_DIRECTORY.filter((g) => g.status === 'aktif')
  const desaOptions = address.kecamatan ? WILAYAH[address.kecamatan] ?? [] : []
  const pinned = Boolean(address.mapsCoord)
  const majelisLabel =
    majelisChoice === 'baru'
      ? NEW_MAJELIS
      : active.find((g) => g.id === majelisChoice)?.name
  const majelisResults = active.filter((g) =>
    g.name.toLowerCase().includes(majelisQuery.trim().toLowerCase()),
  )
  const nikValid = nik.replace(/\D/g, '').length === 16
  const ready =
    ktp && nikValid && addressComplete(address) && address.detail.trim() !== '' && majelisChoice !== ''

  function uploadKtp() {
    setKtp(true)
    // The NIK is read off the photo — filled unless a valid one is already there.
    if (nik.replace(/\D/g, '').length !== 16) setNik(READ_NIK)
  }

  function markPin() {
    setAddress((a) => {
      const guessed = a.desa ? `Kp. ${a.desa} RT 02/RW 05` : 'Kp. sekitar lokasi RT 02/RW 05'
      return { ...a, mapsCoord: 'pinned', detail: a.detail.trim() === '' ? guessed : a.detail }
    })
  }

  function submit() {
    if (!ready) return
    pipelineStore.saveRegistrationDetails(lead.id, nik, ktp, address)
    // Ask now-or-later here for BOTH paths. A new majelis then goes to "Buat
    // Majelis Baru" carrying the choice; an existing one starts right away.
    setTimingOpen(true)
  }

  // The mode (assisted / self) is chosen later, on the Calon Mitra page.
  function startOnboarding(when: 'now' | 'later') {
    setTimingOpen(false)
    // New majelis: carry the timing into the "Buat Majelis Baru" step.
    if (majelisChoice === 'baru') {
      setOnboardingTiming(when)
      flow.go('kumpulan-jadwal')
      return
    }
    // Existing majelis: assign her to the group and start the survey.
    pipelineStore.beginOnboarding(lead.id, undefined, { kind: 'existing', id: majelisChoice })
    if (when === 'now') {
      flow.go('calon-mitra')
    } else {
      pipelineStore.setFlash(`${lead.name} disimpan sebagai calon mitra`)
      flow.go('sales')
    }
  }

  return (
    <AppScreen topBar={<NavigationHeader title="Lengkapi data" onBack={() => flow.back()} />}>
      <div className="flex flex-col gap-12">
        {/* KTP — photo and NIK exposed inline, no sheet. */}
        <div className="flex flex-col gap-8">
          <span className="text-12 font-regular text-default">
            KTP<span className="text-red-500"> *</span>
          </span>
          {ktp ? (
            <div className="flex items-center gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-12">
              <span className="text-green-500">
                <FileCheck size={20} />
              </span>
              <span className="flex-1 text-default">Foto KTP terlampir</span>
              <button type="button" onClick={() => setKtp(false)} className="shrink-0 text-12 font-bold text-link">
                Ambil ulang
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={uploadKtp}
              className="flex w-full flex-col items-center gap-4 rounded-8 border border-default bg-canvas-blue p-16 text-caption"
            >
              <Camera size={24} />
              <span className="text-14 text-default">Upload Foto KTP</span>
            </button>
          )}
        </div>
        <Input
          label="NIK (16 digit)"
          required
          inputMode="numeric"
          maxLength={16}
          value={nik}
          onChange={(e) => setNik(e.target.value)}
          placeholder="Unggah KTP untuk mengisi otomatis"
          state={nik && !nikValid ? 'error' : 'default'}
          helperText={nik && !nikValid ? 'NIK harus 16 digit' : undefined}
        />

        <SelectField
          label="Kecamatan"
          required
          value={address.kecamatan || undefined}
          placeholder="Pilih kecamatan"
          onClick={() => setSheet('kecamatan')}
        />
        <SelectField
          label="Desa"
          required
          value={address.desa || undefined}
          placeholder={address.kecamatan ? 'Pilih desa' : 'Pilih kecamatan dulu'}
          onClick={() => {
            if (address.kecamatan) setSheet('desa')
          }}
        />
        <div className="flex flex-col gap-8">
          <span className="text-12 font-regular text-default">
            Titik alamat <span className="text-caption">(opsional)</span>
          </span>
          {pinned ? (
            <>
              <div className="relative flex items-center justify-center rounded-8 bg-blue-50 py-32">
                <span className="text-primary-500">
                  <MapPin size={24} />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-12 text-green-600">Lokasi sudah ditandai</span>
                <button
                  type="button"
                  onClick={() => setAddress({ ...address, mapsCoord: '' })}
                  className="text-12 font-bold text-link"
                >
                  Ubah pin
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={markPin}
              className="flex items-center justify-center gap-8 rounded-8 border border-dashed border-default py-16 text-14 font-bold text-primary-500"
            >
              <MapPin size={20} />
              Tandai lokasi di peta
            </button>
          )}
        </div>
        <Input
          label="Detail alamat"
          required
          value={address.detail}
          onChange={(e) => setAddress({ ...address, detail: e.target.value })}
          placeholder="Kampung / RT / RW"
        />

        <SelectField
          label="Majelis"
          required
          value={majelisLabel}
          placeholder="Pilih majelis"
          onClick={() => setSheet('majelis')}
        />
      </div>

      <StickyBar>
        <Button size="lg" className="w-full" disabled={!ready} onClick={submit}>
          Submit
        </Button>
      </StickyBar>

      <PickSheet
        open={sheet === 'kecamatan'}
        title="Kecamatan"
        options={KECAMATAN_LIST}
        value={address.kecamatan}
        onClose={() => setSheet(null)}
        onPick={(k) => {
          setAddress({ ...address, kecamatan: k, desa: k === address.kecamatan ? address.desa : '' })
          setSheet(null)
        }}
      />
      <PickSheet
        open={sheet === 'desa'}
        title="Desa"
        options={desaOptions}
        value={address.desa}
        onClose={() => setSheet(null)}
        onPick={(d) => {
          setAddress({ ...address, desa: d })
          setSheet(null)
        }}
      />
      <BottomSheet open={sheet === 'majelis'} onClose={() => setSheet(null)} title="Pilih majelis">
        <div className="flex flex-col gap-8">
          <SearchField
            value={majelisQuery}
            onChange={setMajelisQuery}
            placeholder="Cari majelis"
            label="Cari majelis"
          />
          <SelectableCard
            name="majelis"
            inputType="radio"
            title={NEW_MAJELIS}
            description="Atur jadwal sosialisasi majelis baru"
            checked={majelisChoice === 'baru'}
            onChange={() => {
              setMajelisChoice('baru')
              setSheet(null)
            }}
          />
          {majelisResults.map((g) => (
            <SelectableCard
              key={g.id}
              name="majelis"
              inputType="radio"
              title={g.name}
              description={`${majelisDistanceKm(g.id)} km dari lokasi · ${g.members} mitra aktif`}
              checked={majelisChoice === g.id}
              onChange={() => {
                setMajelisChoice(g.id)
                setSheet(null)
              }}
            />
          ))}
          {majelisResults.length === 0 ? (
            <span className="px-4 py-8 text-12 text-caption">Majelis tidak ditemukan.</span>
          ) : null}
        </div>
      </BottomSheet>

      <OnboardingTimingSheet open={timingOpen} onClose={() => setTimingOpen(false)} onPick={startOnboarding} />
    </AppScreen>
  )
}
