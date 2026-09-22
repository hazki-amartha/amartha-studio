'use client'

// POI Baru — the form behind the "POI creation" menu item. Kecamatan gates
// Kelurahan/Desa the way the reference mobile POI form does: the field starts
// disabled and only opens once a kecamatan is picked. The map point is a
// BottomSheet placeholder rather than a real map (CLAUDE.md §3 — nothing that
// leaves the prototype).

import { useState } from 'react'
import { BottomSheet, Button, Input, NavigationHeader } from '@/design-system/components'
import { Check } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { FieldLabel, OptionSheet, SectionTitle, SelectField } from '../lib/ui'

const KECAMATAN_DESA: Record<string, string[]> = {
  Ciseeng: ['Ciseeng', 'Putat Nutug', 'Cibeuteung Udik', 'Cibeuteung Hilir'],
  Parung: ['Parung', 'Waru', 'Jabon Mekar'],
  'Gunung Sindur': ['Gunung Sindur', 'Curug', 'Cidokom'],
}
const KECAMATAN_OPTIONS = Object.keys(KECAMATAN_DESA).map((v) => ({ label: v, value: v }))

const HOURS = Array.from({ length: 16 }, (_, i) => {
  const v = `${String(6 + i).padStart(2, '0')}.00`
  return { label: v, value: v }
})

const JADWAL_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((v) => ({
  label: v,
  value: v,
}))

const FO_OPTIONS = ['Sari Handayani', 'Rina Marlina', 'Ani Suryani', 'Dewi Lestari'].map((v) => ({
  label: v,
  value: v,
}))

type MenuId = 'jam-mulai' | 'jam-selesai' | 'kecamatan' | 'desa' | 'jadwal' | 'fo' | null

export function PoiCreateScreen() {
  const flow = useFlow()
  const [menu, setMenu] = useState<MenuId>(null)
  const [mapOpen, setMapOpen] = useState(false)

  const [name, setName] = useState('')
  const [jenis, setJenis] = useState('')
  const [jamMulai, setJamMulai] = useState('')
  const [jamSelesai, setJamSelesai] = useState('')
  const [kecamatan, setKecamatan] = useState('')
  const [desa, setDesa] = useState('')
  const [alamat, setAlamat] = useState('')
  const [namaKontak, setNamaKontak] = useState('')
  const [hpKontak, setHpKontak] = useState('')
  const [jadwal, setJadwal] = useState('')
  const [assignedFo, setAssignedFo] = useState('')
  const [catatan, setCatatan] = useState('')
  const [done, setDone] = useState(false)

  const canSubmit = name.trim() && jenis.trim() && kecamatan && desa && jadwal

  if (done) {
    return (
      <Screen topBar={<NavigationHeader title="POI Baru" onBack={flow.back} />}>
        <div className="flex flex-1 flex-col items-center justify-center gap-8 py-48 text-center">
          <span className="flex h-48 w-48 items-center justify-center rounded-full bg-green-50 text-green-500">
            <Check size={24} />
          </span>
          <span className="text-16 font-bold text-default">POI ditambahkan</span>
          <span className="text-14 text-caption">{name || 'Lokasi ini'} tersimpan sebagai titik baru.</span>
          <div className="pt-8">
            <Button onClick={flow.back}>Kembali</Button>
          </div>
        </div>
      </Screen>
    )
  }

  return (
    <Screen topBar={<NavigationHeader title="POI Baru" onBack={flow.back} />}>
      <div className="flex flex-1 flex-col gap-24">
        <div className="flex flex-col gap-12">
          <SectionTitle>General</SectionTitle>

          <Input
            label="POI Name"
            required
            placeholder="Isi nama POI"
            helperText="Contoh: Pasar Ciseeng, Puskesmas RT 01, Warung Ibu"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="POI Type"
            required
            placeholder="Isi tipe POI"
            helperText="Contoh: Pasar, Posyandu, Warung, dll"
            value={jenis}
            onChange={(e) => setJenis(e.target.value)}
          />

          <div className="flex flex-col gap-8">
            <FieldLabel optional>Jam ramai POI</FieldLabel>
            <div className="flex gap-8">
              <SelectField
                label=""
                placeholder="Start with"
                value={jamMulai}
                onClick={() => setMenu('jam-mulai')}
              />
              <SelectField
                label=""
                placeholder="End with"
                value={jamSelesai}
                onClick={() => setMenu('jam-selesai')}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-12">
          <SectionTitle>Kontak dan Lokasi</SectionTitle>

          <SelectField
            label="Kecamatan"
            required
            placeholder="Pilih kecamatan"
            value={kecamatan}
            onClick={() => setMenu('kecamatan')}
          />

          <SelectField
            label="Kelurahan atau Desa"
            required
            placeholder="Pilih kelurahan atau desa"
            value={desa}
            onClick={() => setMenu('desa')}
            disabled={!kecamatan}
          />

          <SelectField
            label="Alamat (titik di peta)"
            optional
            placeholder="Atur titik alamat di peta"
            value={alamat}
            onClick={() => setMapOpen(true)}
            chevron="right"
          />

          <Input
            label="Nama kontak"
            optionalText="(optional)"
            placeholder="Contoh: John Doe"
            value={namaKontak}
            onChange={(e) => setNamaKontak(e.target.value)}
          />

          <Input
            label="No. HP kontak"
            optionalText="(optional)"
            prefix="+62"
            placeholder="Isi nomor HP yang aktif"
            helperText="Contoh: 8567891298"
            value={hpKontak}
            onChange={(e) => setHpKontak(e.target.value.replace(/\D/g, ''))}
          />
        </div>

        <div className="flex flex-col gap-12">
          <SectionTitle>Detail Sosialisasi</SectionTitle>

          <SelectField
            label="Jadwal Sosialisasi"
            required
            placeholder="Isi jadwal POI"
            value={jadwal}
            onClick={() => setMenu('jadwal')}
          />

          <SelectField
            label="Assigned FO"
            optional
            placeholder="Pilih FO / BP"
            value={assignedFo}
            onClick={() => setMenu('fo')}
          />

          <Input
            label="Catatan"
            optionalText="(optional)"
            placeholder="Tulis catatan"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          />
        </div>

        <Button onClick={() => setDone(true)} disabled={!canSubmit}>
          Submit
        </Button>
      </div>

      <OptionSheet
        open={menu === 'jam-mulai'}
        title="Jam mulai"
        name="jam-mulai"
        options={HOURS}
        value={jamMulai}
        onPick={setJamMulai}
        onClose={() => setMenu(null)}
      />
      <OptionSheet
        open={menu === 'jam-selesai'}
        title="Jam selesai"
        name="jam-selesai"
        options={HOURS}
        value={jamSelesai}
        onPick={setJamSelesai}
        onClose={() => setMenu(null)}
      />
      <OptionSheet
        open={menu === 'kecamatan'}
        title="Kecamatan"
        name="kecamatan"
        options={KECAMATAN_OPTIONS}
        value={kecamatan}
        onPick={(v) => {
          setKecamatan(v)
          setDesa('')
        }}
        onClose={() => setMenu(null)}
      />
      <OptionSheet
        open={menu === 'desa'}
        title="Kelurahan atau Desa"
        name="desa"
        options={(KECAMATAN_DESA[kecamatan] ?? []).map((v) => ({ label: v, value: v }))}
        value={desa}
        onPick={setDesa}
        onClose={() => setMenu(null)}
      />
      <OptionSheet
        open={menu === 'jadwal'}
        title="Jadwal Sosialisasi"
        name="jadwal"
        options={JADWAL_OPTIONS}
        value={jadwal}
        onPick={setJadwal}
        onClose={() => setMenu(null)}
      />
      <OptionSheet
        open={menu === 'fo'}
        title="Assigned FO"
        name="fo"
        options={FO_OPTIONS}
        value={assignedFo}
        onPick={setAssignedFo}
        onClose={() => setMenu(null)}
      />

      <BottomSheet open={mapOpen} onClose={() => setMapOpen(false)} title="Atur titik alamat">
        <div className="flex flex-col gap-16">
          <div className="flex items-center justify-center rounded-12 bg-neutral-50 py-48 text-14 text-caption">
            Peta (placeholder)
          </div>
          <Button
            onClick={() => {
              setAlamat('Titik ditandai di peta')
              setMapOpen(false)
            }}
          >
            Gunakan titik ini
          </Button>
        </div>
      </BottomSheet>
    </Screen>
  )
}
