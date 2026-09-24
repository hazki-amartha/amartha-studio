'use client'

// Buat Majelis Baru — the "new majelis" branch of the onboarding flow, reached
// from Mulai Pendaftaran when the BP forms a new group instead of joining an
// existing one. Just names the majelis and sets its kumpulan schedule; saving
// opens the onboarding-mode sheet (self-service / assisted) and starts the
// survey, keeping the lead on the Leads list. No sosialisasi form any more.

import { useState } from 'react'
import { BottomSheet, Button, Input, NavigationHeader, SelectableCard } from '@/design-system/components'
import { MapPin } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { getOnboardingTiming, pipelineStore, usePipeline } from '../lib/pipeline-store'
import { SelectField } from '../lib/pipeline-ui'
import { AppScreen, StickyBar } from '../lib/ui'

const pad = (n: number) => String(n).padStart(2, '0')
const fmt = (mins: number) => `${pad(Math.floor(mins / 60))}.${pad(mins % 60)}`
const TIMES: string[] = []
for (let m = 8 * 60; m <= 16 * 60; m += 30) TIMES.push(fmt(m))

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

type PickerKey = 'hari' | 'jam'

export function KumpulanJadwalScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]

  const [namaMajelis, setNamaMajelis] = useState('')
  const [lokasi, setLokasi] = useState('')
  const [hari, setHari] = useState('')
  const [jam, setJam] = useState('')
  const [picker, setPicker] = useState<PickerKey | null>(null)

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Buat Majelis Baru" onBack={() => flow.back()} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const ready = namaMajelis.trim() !== '' && lokasi.trim() !== '' && hari !== '' && jam !== ''
  const pickerOptions = picker === 'hari' ? HARI : TIMES
  const pickerValue = picker === 'hari' ? hari : jam

  function onPick(v: string) {
    if (picker === 'hari') setHari(v)
    else if (picker === 'jam') setJam(v)
    setPicker(null)
  }

  // Marking the pin stands in for a map point (§3 — the prototype draws the map,
  // nothing opens a real one), same as the Add Leads address field. It fills a
  // readable location near the lead.
  function markLocation() {
    const desa = lead.address?.desa
    setLokasi(desa ? `Kp. ${desa} RT 02/RW 05` : 'Balai RW setempat')
  }

  // Name the new majelis on her record and start the survey. The now/later choice
  // was made back on the Lengkapi data page; the mode (assisted / self) comes
  // later, on the Calon Mitra page.
  function save() {
    pipelineStore.beginOnboarding(lead.id, undefined, {
      kind: 'new',
      name: namaMajelis.trim(),
      location: lokasi.trim(),
      day: hari,
      time: jam,
    })
    if (getOnboardingTiming() === 'now') {
      flow.go('calon-mitra')
    } else {
      pipelineStore.setFlash(`${lead.name} disimpan sebagai calon mitra`)
      flow.go('sales')
    }
  }

  return (
    <AppScreen topBar={<NavigationHeader title="Buat Majelis Baru" onBack={() => flow.back()} />}>
      <div className="flex flex-col gap-16 pt-8">
        <Input
          label="Nama Majelis"
          required
          value={namaMajelis}
          onChange={(e) => setNamaMajelis(e.target.value)}
          placeholder="Masukkan nama majelis"
          helperText="Contoh: 123_Kota_Kelurahan_01"
        />

        <div className="flex flex-col gap-8">
          <span className="text-12 font-regular text-default">
            Lokasi Kumpulan<span className="text-red-500"> *</span>
          </span>
          {lokasi ? (
            <>
              <div className="relative flex items-center justify-center rounded-8 bg-blue-50 py-32">
                <span className="text-primary-500">
                  <MapPin size={24} />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-12 text-green-600">Lokasi sudah ditandai</span>
                <button type="button" onClick={() => setLokasi('')} className="text-12 font-bold text-link">
                  Ubah pin
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={markLocation}
              className="flex items-center justify-center gap-8 rounded-8 border border-dashed border-default py-16 text-14 font-bold text-primary-500"
            >
              <MapPin size={20} />
              Tandai lokasi di peta
            </button>
          )}
        </div>

        <div className="flex flex-col gap-12">
          <SelectField
            label="Tentukan hari kumpulan"
            boldLabel
            value={hari || undefined}
            placeholder="Pilih hari kumpulan"
            onClick={() => setPicker('hari')}
          />
          <SelectField
            label="Tentukan jam kumpulan"
            boldLabel
            value={jam || undefined}
            placeholder="Pilih jam kumpulan"
            onClick={() => setPicker('jam')}
          />
        </div>
      </div>

      <StickyBar>
        <span className="text-center text-12 text-caption">
          Pastikan data yang diisi benar dan dapat dipertanggungjawabkan.
        </span>
        <Button size="lg" className="w-full" disabled={!ready} onClick={save}>
          Simpan
        </Button>
      </StickyBar>

      <BottomSheet
        open={picker !== null}
        onClose={() => setPicker(null)}
        title={picker === 'hari' ? 'Pilih hari kumpulan' : 'Pilih jam kumpulan'}
      >
        <div className="flex flex-col gap-8">
          {pickerOptions.map((o) => (
            <SelectableCard
              key={o}
              name="picker"
              inputType="radio"
              title={o}
              checked={pickerValue === o}
              onChange={() => onPick(o)}
            />
          ))}
        </div>
      </BottomSheet>

    </AppScreen>
  )
}
