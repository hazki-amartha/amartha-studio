'use client'

// Atur jadwal Sosialisasi — reached from a lead's Continue application → Modal →
// Majelis baru. The BP names the new majelis / area and sets when its sosialisasi
// runs. Saving schedules a sosialisasi task (it lands on the Task page) and the
// lead leaves the Sales list.

import { useState } from 'react'
import { BottomSheet, Button, Input, NavigationHeader, SelectableCard } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { SelectField } from '../lib/pipeline-ui'
import { AppScreen, StickyBar } from '../lib/ui'

// Half-hour sosialisasi slots across the working day.
const pad = (n: number) => String(n).padStart(2, '0')
const fmt = (mins: number) => `${pad(Math.floor(mins / 60))}.${pad(mins % 60)}`
const TIME_SLOTS: string[] = []
for (let m = 8 * 60; m < 17 * 60; m += 30) TIME_SLOTS.push(`${fmt(m)} - ${fmt(m + 30)}`)

export function KumpulanJadwalScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [timeOpen, setTimeOpen] = useState(false)
  const [timeDraft, setTimeDraft] = useState('')

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Atur jadwal Sosialisasi" onBack={() => flow.back()} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const ready = name.trim() !== '' && date !== ''

  function save() {
    if (!ready) return
    const when = time ? `${date}, ${time}` : date
    pipelineStore.createKumpulanSosialisasi(lead.id, name.trim(), when)
    pipelineStore.setFlash('Tugas sosialisasi berhasil ditambahkan')
    flow.go('sales')
  }

  return (
    <AppScreen topBar={<NavigationHeader title="Atur jadwal Sosialisasi" onBack={() => flow.back()} />}>
      <div className="flex flex-col gap-12">
        <Input
          label="Nama Majelis / Daerah"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="mis. Majelis Cibeuteung / Kp. Batu Sangkar"
        />
        <label className="flex flex-col gap-4">
          <span className="text-12 text-default">
            Hari dan Tanggal<span className="text-red-500"> *</span>
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-8 border border-default bg-neutral-white px-12 py-8 text-14 text-default outline-none focus:border-primary-500"
          />
        </label>
        <SelectField
          label="Jam Sosialisasi"
          value={time || undefined}
          placeholder="Tentukan jam sosialisasi"
          onClick={() => {
            setTimeDraft(time)
            setTimeOpen(true)
          }}
        />
      </div>

      <StickyBar>
        <Button size="lg" className="w-full" disabled={!ready} onClick={save}>
          Simpan jadwal
        </Button>
      </StickyBar>

      <BottomSheet
        open={timeOpen}
        onClose={() => setTimeOpen(false)}
        title="Tentukan Jam Sosialisasi"
        secondaryAction={
          <Button variant="outline" size="lg" className="w-full" onClick={() => setTimeOpen(false)}>
            Kembali
          </Button>
        }
        primaryAction={
          <Button
            size="lg"
            className="w-full"
            disabled={!timeDraft}
            onClick={() => {
              setTime(timeDraft)
              setTimeOpen(false)
            }}
          >
            Simpan
          </Button>
        }
      >
        <div className="flex flex-col gap-8">
          {TIME_SLOTS.map((slot) => (
            <SelectableCard
              key={slot}
              name="jam-sosialisasi"
              inputType="radio"
              title={slot}
              checked={timeDraft === slot}
              onChange={() => setTimeDraft(slot)}
            />
          ))}
        </div>
      </BottomSheet>
    </AppScreen>
  )
}
