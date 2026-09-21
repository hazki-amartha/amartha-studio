'use client'

// Buat Majelis Baru — the "new majelis" branch of the onboarding flow, reached
// from Mulai Pendaftaran when the BP forms a new group instead of joining an
// existing one. Just names the majelis and sets its kumpulan schedule; saving
// opens the onboarding-mode sheet (self-service / assisted) and starts the
// survey, keeping the lead on the Leads list. No sosialisasi form any more.

import { useState } from 'react'
import { BottomSheet, Button, Input, NavigationHeader, SelectableCard } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { OnboardingModeSheet, SelectField } from '../lib/pipeline-ui'
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
  const [hari, setHari] = useState('')
  const [jam, setJam] = useState('')
  const [picker, setPicker] = useState<PickerKey | null>(null)
  const [modeOpen, setModeOpen] = useState(false)

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Buat Majelis Baru" onBack={() => flow.back()} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const ready = namaMajelis.trim() !== ''
  const pickerOptions = picker === 'hari' ? HARI : TIMES
  const pickerValue = picker === 'hari' ? hari : jam

  function onPick(v: string) {
    if (picker === 'hari') setHari(v)
    else if (picker === 'jam') setJam(v)
    setPicker(null)
  }

  // Name the majelis on her record, start the survey in the chosen mode, and
  // route to the matching survey screen.
  function startOnboarding(mode: 'self' | 'assisted') {
    setModeOpen(false)
    pipelineStore.beginOnboarding(lead.id, mode, { kind: 'new', name: namaMajelis.trim() })
    if (mode === 'self') {
      pipelineStore.setFlash(`${lead.name} diundang mengisi survey self-service`)
      flow.go('survey-started')
    } else {
      flow.go('application')
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

        <div className="flex flex-col gap-12">
          <span className="text-18 font-bold text-default">Jadwal Kumpulan</span>
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
        <Button size="lg" className="w-full" disabled={!ready} onClick={() => setModeOpen(true)}>
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

      <OnboardingModeSheet open={modeOpen} onClose={() => setModeOpen(false)} onPick={startOnboarding} />
    </AppScreen>
  )
}
