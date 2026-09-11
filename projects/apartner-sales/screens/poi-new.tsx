'use client'

// New POI — the BM's "Add POI" form (from the "Add" bottom sheet). It registers
// a titik sosialisasi: where it is, who to ask for, when it is busy, an optional
// schedule, and the petugas it is assigned to. Saving adds it to the POI store,
// so it appears on the Sales board (with "Belum ada jadwal" if no date was set).

import { useState } from 'react'
import { Button, Input, NavigationHeader } from '@/design-system/components'
import { MapPin } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import {
  KECAMATAN_LIST,
  WILAYAH,
  FIELD_OFFICERS,
  type Agenda,
} from '../lib/pipeline'
import { PickSheet, SelectField } from '../lib/pipeline-ui'
import { poiStore } from '../lib/poi-store'
import { pipelineStore } from '../lib/pipeline-store'
import { AppScreen, StickyBar } from '../lib/ui'

type SheetId = 'kecamatan' | 'desa' | 'jadwal' | 'fo' | null

// When to run the sosialisasi. "Belum dijadwalkan" leaves the POI schedulable
// later — it shows on the board as "Belum ada jadwal".
const SCHEDULE_OPTIONS: { label: string; days: number | null }[] = [
  { label: 'Belum dijadwalkan', days: null },
  { label: 'Hari ini', days: 0 },
  { label: 'Besok', days: 1 },
  { label: 'Lusa', days: 2 },
  { label: 'Minggu depan', days: 7 },
]

function Heading({ children }: { children: string }) {
  return <span className="pt-8 text-14 font-bold text-default">{children}</span>
}

export function PoiNewScreen() {
  const flow = useFlow()
  const [sheet, setSheet] = useState<SheetId>(null)

  const [name, setName] = useState('')
  const [poiType, setPoiType] = useState('')
  const [jamStart, setJamStart] = useState('')
  const [jamEnd, setJamEnd] = useState('')
  const [kecamatan, setKecamatan] = useState('')
  const [desa, setDesa] = useState('')
  const [pinned, setPinned] = useState(false)
  const [detail, setDetail] = useState('')
  const [contact, setContact] = useState('')
  const [phone, setPhone] = useState('')
  const [catatan, setCatatan] = useState('')
  const [scheduleLabel, setScheduleLabel] = useState('Belum dijadwalkan')
  const [scheduleDays, setScheduleDays] = useState<number | null>(null)
  const [time, setTime] = useState('')
  const [fo, setFo] = useState('')

  const desaOptions = kecamatan ? WILAYAH[kecamatan] ?? [] : []
  const ready = name.trim() !== '' && poiType.trim() !== '' && kecamatan !== '' && desa !== ''

  // Marking the pin stands in for a reverse-geocode — it fills the detail line
  // if it is still empty.
  function markPin() {
    setPinned(true)
    setDetail((d) => (d.trim() === '' ? (desa ? `Kp. ${desa} RT 02/RW 05` : 'Kp. sekitar lokasi RT 02/RW 05') : d))
  }

  function save() {
    if (!ready) return
    const address = detail.trim()
      ? `${detail.trim()}, Desa ${desa}, Kec. ${kecamatan}`
      : `Desa ${desa}, Kec. ${kecamatan}`
    const busyHours = jamStart && jamEnd ? `${jamStart} - ${jamEnd}` : undefined
    const agenda: Agenda | undefined =
      scheduleDays === null
        ? undefined
        : {
            day: scheduleDays === 0 ? 'today' : 'upcoming',
            kind: 'Sosialisasi POI',
            when: time ? `${scheduleLabel}, ${time}` : scheduleLabel,
            order: 0,
            dueDays: scheduleDays,
          }
    poiStore.add({
      title: name.trim(),
      poi: name.trim(),
      place: address,
      address,
      target: 10,
      contact: contact.trim(),
      contactPhone: phone.trim() || undefined,
      busyHours,
      type: poiType.trim(),
      poiType: poiType.trim(),
      guide: catatan.trim(),
      gmapsLink: pinned ? 'pinned' : undefined,
      art: 'pasar-ikan',
      fo,
      agenda,
    })
    pipelineStore.setFlash(`POI ${name.trim()} ditambahkan`)
    flow.go('sales')
  }

  return (
    <AppScreen topBar={<NavigationHeader title="New POI" onBack={() => flow.back()} />}>
      <div className="flex flex-col gap-12">
        <Heading>General</Heading>
        <Input label="POI Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama POI" />
        <Input
          label="POI Type"
          required
          value={poiType}
          onChange={(e) => setPoiType(e.target.value)}
          placeholder="mis. Pasar, Posyandu"
        />
        <div className="flex flex-col gap-8">
          <span className="text-12 font-bold text-default">
            Jam ramai <span className="font-regular text-caption">(opsional)</span>
          </span>
          <div className="flex gap-8">
            <Input label="Mulai" value={jamStart} onChange={(e) => setJamStart(e.target.value)} placeholder="08.00" />
            <Input label="Selesai" value={jamEnd} onChange={(e) => setJamEnd(e.target.value)} placeholder="11.00" />
          </div>
        </div>

        <Heading>Address &amp; Contact</Heading>
        <SelectField
          label="Kecamatan"
          required
          value={kecamatan || undefined}
          placeholder="Pilih kecamatan"
          onClick={() => setSheet('kecamatan')}
          description={<span className="text-caption">Hanya kecamatan &amp; desa dalam wilayahmu</span>}
        />
        <SelectField
          label="Desa"
          required
          value={desa || undefined}
          placeholder={kecamatan ? 'Pilih desa' : 'Pilih kecamatan dulu'}
          onClick={() => (kecamatan ? setSheet('desa') : undefined)}
        />
        <div className="flex flex-col gap-8">
          <span className="text-12 text-default">
            Lokasi di Maps <span className="text-caption">(opsional)</span>
          </span>
          {pinned ? (
            <div className="flex items-center justify-between">
              <span className="text-12 text-green-600">Lokasi sudah ditandai</span>
              <button
                type="button"
                onClick={() => setPinned(false)}
                className="text-12 font-bold text-link"
              >
                Ubah pin
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={markPin}
              className="flex items-center justify-center gap-8 rounded-8 border border-dashed border-default py-16 text-14 font-bold text-primary-500"
            >
              <MapPin size={20} />
              Tandai Lokasi di Maps
            </button>
          )}
        </div>
        <Input
          label="Detail alamat"
          optionalText="opsional"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Kampung / RT / RW / patokan"
        />
        <Input label="Nama kontak" optionalText="opsional" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Nama kontak POI" />
        <Input
          label="No. HP kontak"
          optionalText="opsional"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08xx-xxxx-xxxx"
        />

        <Heading>Catatan</Heading>
        <Input label="Catatan" optionalText="opsional" value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan untuk petugas" />

        <Heading>Detail POI Visit</Heading>
        <SelectField
          label="Jadwal POI Visit"
          value={scheduleLabel}
          placeholder="Pilih jadwal"
          onClick={() => setSheet('jadwal')}
        />
        {scheduleDays !== null ? (
          <Input label="Jam" optionalText="opsional" value={time} onChange={(e) => setTime(e.target.value)} placeholder="14.00" />
        ) : null}
        <SelectField label="Assigned FO" optionalText="opsional" value={fo || undefined} placeholder="Pilih petugas" onClick={() => setSheet('fo')} />
      </div>

      <StickyBar>
        <Button size="lg" className="w-full" disabled={!ready} onClick={save}>
          Save POI
        </Button>
      </StickyBar>

      <PickSheet
        open={sheet === 'kecamatan'}
        title="Kecamatan"
        options={KECAMATAN_LIST}
        value={kecamatan}
        onClose={() => setSheet(null)}
        onPick={(k) => {
          setKecamatan(k)
          if (k !== kecamatan) setDesa('')
          setSheet(null)
        }}
      />
      <PickSheet
        open={sheet === 'desa'}
        title="Desa"
        options={desaOptions}
        value={desa}
        onClose={() => setSheet(null)}
        onPick={(d) => {
          setDesa(d)
          setSheet(null)
        }}
      />
      <PickSheet
        open={sheet === 'jadwal'}
        title="Jadwal POI Visit"
        options={SCHEDULE_OPTIONS.map((o) => o.label)}
        value={scheduleLabel}
        onClose={() => setSheet(null)}
        onPick={(label) => {
          const opt = SCHEDULE_OPTIONS.find((o) => o.label === label)
          setScheduleLabel(label)
          setScheduleDays(opt?.days ?? null)
          setSheet(null)
        }}
      />
      <PickSheet
        open={sheet === 'fo'}
        title="Assigned FO"
        options={FIELD_OFFICERS}
        value={fo}
        onClose={() => setSheet(null)}
        onPick={(v) => {
          setFo(v)
          setSheet(null)
        }}
      />
    </AppScreen>
  )
}
