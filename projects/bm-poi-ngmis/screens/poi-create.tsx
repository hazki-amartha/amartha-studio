'use client'

// POI Baru — reached from Branches ▸ POI creation. The same General / Kontak
// dan Lokasi / Detail Sosialisasi fields as the mobile handoff, laid out on
// the desktop canvas as a two-column grid. Kecamatan gates Kelurahan/Desa the
// way the reference form does — the field starts disabled and only opens once
// a kecamatan is picked.

import { useState } from 'react'
import { Button, Input } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { addPoi } from '../lib/store'
import { BmShell } from '../lib/shell'
import { FieldLabel, PageHeading, Panel, Select, SectionTitle } from '../lib/ui'

const KECAMATAN_DESA: Record<string, string[]> = {
  Ciseeng: ['Ciseeng', 'Putat Nutug', 'Cibeuteung Udik', 'Cibeuteung Hilir'],
  Parung: ['Parung', 'Waru', 'Jabon Mekar'],
  'Gunung Sindur': ['Gunung Sindur', 'Curug', 'Cidokom'],
}
const KECAMATAN_OPTIONS = Object.keys(KECAMATAN_DESA).map((v) => ({ value: v, label: v }))

const HOURS = Array.from({ length: 16 }, (_, i) => {
  const v = `${String(6 + i).padStart(2, '0')}.00`
  return { value: v, label: v }
})

const JADWAL_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((v) => ({
  value: v,
  label: v,
}))

const FO_OPTIONS = ['Sari Handayani', 'Rina Marlina', 'Ani Suryani', 'Dewi Lestari'].map((v) => ({
  value: v,
  label: v,
}))

export function PoiCreateScreen() {
  const flow = useFlow()
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

  const canSubmit = name.trim() && jenis.trim() && kecamatan && desa && jadwal

  return (
    <BmShell
      breadcrumbs={[
        { label: 'Home' },
        { label: 'Branches' },
        { label: 'POI creation', onClick: () => flow.go('poi-list') },
        { label: 'POI Baru', current: true },
      ]}
    >
      <div className="flex flex-col gap-24">
        <PageHeading
          title="POI Baru"
          actions={
            <Button variant="outline" onClick={() => flow.go('poi-list')}>
              Batal
            </Button>
          }
        />

        <Panel>
          <div className="flex flex-col gap-32">
            <div className="flex flex-col gap-16">
              <SectionTitle>General</SectionTitle>
              <div className="grid grid-cols-2 gap-16">
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
                  <div className="grid grid-cols-2 gap-16">
                    <Select
                      label=""
                      placeholder="Start with"
                      value={jamMulai}
                      onChange={setJamMulai}
                      options={HOURS}
                    />
                    <Select
                      label=""
                      placeholder="End with"
                      value={jamSelesai}
                      onChange={setJamSelesai}
                      options={HOURS}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-16">
              <SectionTitle>Kontak dan Lokasi</SectionTitle>
              <div className="grid grid-cols-2 gap-16">
                <Select
                  label="Kecamatan"
                  required
                  placeholder="Pilih kecamatan"
                  value={kecamatan}
                  onChange={(v) => {
                    setKecamatan(v)
                    setDesa('')
                  }}
                  options={KECAMATAN_OPTIONS}
                />
                <Select
                  label="Kelurahan atau Desa"
                  required
                  placeholder="Pilih kelurahan atau desa"
                  value={desa}
                  onChange={setDesa}
                  options={(KECAMATAN_DESA[kecamatan] ?? []).map((v) => ({ value: v, label: v }))}
                  disabled={!kecamatan}
                />
                <Input
                  label="Alamat (titik di peta)"
                  optionalText="(optional)"
                  placeholder="cth. Jl. Raya Ciseeng No. 12"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
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
            </div>

            <div className="flex flex-col gap-16">
              <SectionTitle>Detail Sosialisasi</SectionTitle>
              <div className="grid grid-cols-2 gap-16">
                <Select
                  label="Jadwal Sosialisasi"
                  required
                  placeholder="Isi jadwal POI"
                  value={jadwal}
                  onChange={setJadwal}
                  options={JADWAL_OPTIONS}
                />
                <Select
                  label="Assigned FO"
                  optional
                  placeholder="Pilih FO / BP"
                  value={assignedFo}
                  onChange={setAssignedFo}
                  options={FO_OPTIONS}
                />
                <Input
                  label="Catatan"
                  optionalText="(optional)"
                  placeholder="Tulis catatan"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => {
                  addPoi({ name, jenis, kecamatan, desa, jadwal, assignedFo })
                  flow.go('poi-list')
                }}
                disabled={!canSubmit}
              >
                Submit
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    </BmShell>
  )
}
