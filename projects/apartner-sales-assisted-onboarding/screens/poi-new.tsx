'use client'

// Tambah lokasi sosialisasi — the "Add Sosialisasi" form (reached from the Add
// sheet when the source is a POI / sosialisasi). It registers a titik
// sosialisasi: where it is, who to ask for, when it is busy, an optional
// schedule, and — in the BM view — the petugas (BP) it is handed to. Saving adds
// it to the POI store, so it appears on the Sales board (with "Belum ada jadwal"
// if no date was set).
//
// BM view adds one required field the BP view doesn't need: "Nama petugas" — the
// BM runs seven BPs, so she names who the sosialisasi belongs to; a BP is always
// herself.

import { useState } from 'react'
import { BottomSheet, Button, Input, NavigationHeader, SelectableCard } from '@/design-system/components'
import { MapPin } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import {
  KECAMATAN_LIST,
  WILAYAH,
  FIELD_OFFICERS,
  foLabel,
  type Agenda,
} from '../lib/pipeline'
import { PickSheet, SelectField } from '../lib/pipeline-ui'
import { poiStore } from '../lib/poi-store'
import { pipelineStore } from '../lib/pipeline-store'
import { useApp } from '../lib/store'
import { AppScreen, StickyBar } from '../lib/ui'

type SheetId = 'jenis' | 'kecamatan' | 'desa' | 'jadwal' | 'fo' | null

// The preset kinds of sosialisasi location.
const LOKASI_TYPES = ['Pasar', 'Posyandu', 'Sekolah', 'Warung', 'Masjid', 'Kantor desa', 'Lainnya']

// When to run the sosialisasi. "Belum dijadwalkan" leaves it schedulable later —
// it shows on the board as "Belum ada jadwal".
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
  const { role } = useApp()
  const isBM = role === 'BM'
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
  // BM must name the petugas; a BP is herself, so the field is hers to skip.
  const petugasReady = !isBM || fo !== ''
  const ready =
    name.trim() !== '' && poiType.trim() !== '' && kecamatan !== '' && desa !== '' && petugasReady

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
    pipelineStore.setFlash(`Lokasi sosialisasi ${name.trim()} ditambahkan`)
    flow.go('sales')
  }

  return (
    <AppScreen topBar={<NavigationHeader title="Tambah lokasi sosialisasi" onBack={() => flow.back()} />}>
      <div className="flex flex-col gap-12">
        <Heading>Info</Heading>
        <Input
          label="Nama lokasi"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama lokasi sosialisasi"
          helperText="Lokasi tempat sosialisasi dilakukan"
        />
        <SelectField
          label="Jenis lokasi"
          required
          value={poiType || undefined}
          placeholder="Pilih jenis lokasi"
          onClick={() => setSheet('jenis')}
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

        <Heading>Kontak dan alamat</Heading>
        <SelectField
          label="Kecamatan lokasi sosialisasi"
          required
          value={kecamatan || undefined}
          placeholder="Pilih kecamatan"
          onClick={() => setSheet('kecamatan')}
          description={<span className="text-caption">Hanya kecamatan &amp; desa dalam wilayahmu</span>}
        />
        <SelectField
          label="Kelurahan/desa lokasi sosialisasi"
          required
          value={desa || undefined}
          placeholder={kecamatan ? 'Pilih desa' : 'Pilih kecamatan dulu'}
          onClick={() => (kecamatan ? setSheet('desa') : undefined)}
        />
        <div className="flex flex-col gap-8">
          <span className="text-12 text-default">
            Titik alamat di peta <span className="text-caption">(opsional)</span>
          </span>
          {pinned ? (
            <div className="flex items-center justify-between">
              <span className="text-12 text-green-600">Lokasi sudah ditandai</span>
              <button type="button" onClick={() => setPinned(false)} className="text-12 font-bold text-link">
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
              Tandai lokasi di peta
            </button>
          )}
        </div>
        <Input
          label="Alamat lokasi sosialisasi"
          optionalText="opsional"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Kampung / RT / RW / patokan"
        />
        <Input
          label="Nama kontak di lokasi"
          optionalText="opsional"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Nama kontak"
        />
        <Input
          label="Nomor HP kontak di lokasi"
          optionalText="opsional"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08xx-xxxx-xxxx"
        />

        <Heading>Detail penugasan</Heading>
        {/* BM view: who runs this sosialisasi. A BP is always herself. */}
        {isBM ? (
          <SelectField
            label="Nama petugas"
            required
            value={fo ? foLabel(fo) : undefined}
            placeholder="Pilih petugas"
            onClick={() => setSheet('fo')}
          />
        ) : null}
        <SelectField
          label="Jadwal sosialisasi"
          value={scheduleLabel}
          placeholder="Pilih jadwal"
          onClick={() => setSheet('jadwal')}
        />
        {scheduleDays !== null ? (
          <Input label="Jam" optionalText="opsional" value={time} onChange={(e) => setTime(e.target.value)} placeholder="14.00" />
        ) : null}
        <Input
          label="Catatan"
          optionalText="opsional"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Catatan untuk petugas"
        />
      </div>

      <StickyBar>
        <Button size="lg" className="w-full" disabled={!ready} onClick={save}>
          Tambahkan ke Prospek
        </Button>
      </StickyBar>

      <PickSheet
        open={sheet === 'jenis'}
        title="Pilih jenis lokasi"
        options={LOKASI_TYPES}
        value={poiType}
        onClose={() => setSheet(null)}
        onPick={(t) => {
          setPoiType(t)
          setSheet(null)
        }}
      />
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
        title="Jadwal sosialisasi"
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

      {/* BM view — pick the BP who runs this sosialisasi (the BM carries a "(BM)" tag). */}
      <BottomSheet open={sheet === 'fo'} onClose={() => setSheet(null)} title="Pilih petugas">
        <div className="flex flex-col gap-8">
          {FIELD_OFFICERS.map((f) => (
            <SelectableCard
              key={f}
              name="poi-petugas"
              inputType="radio"
              title={foLabel(f)}
              checked={fo === f}
              onChange={() => {
                setFo(f)
                setSheet(null)
              }}
            />
          ))}
        </div>
      </BottomSheet>
    </AppScreen>
  )
}
