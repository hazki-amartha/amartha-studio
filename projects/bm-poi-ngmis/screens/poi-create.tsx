'use client'

// Branches ▸ POI creation ▸ Tambah POI — mirrors the fields the mobile BM app
// asks for (projects/apartner-bm-majelis-view/screens/create-poi.tsx), on the
// desktop NG-MIS form pattern instead of a mobile sheet. Kecamatan gates Desa:
// the field starts disabled and only opens once a kecamatan is picked.

import { useState } from 'react'
import { Button, Input } from '@/design-system/components'
import { Plus } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { BmShell, PageHeading } from '../lib/shell'
import { Panel, PanelHeading, Select } from '../lib/ui'
import { addPoi } from '../lib/store'

const JENIS_OPTIONS = ['Pasar', 'Balai', 'Warung', 'Sekolah', 'Kampung', 'Lainnya'].map((v) => ({
  value: v,
  label: v,
}))

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

export function PoiCreateScreen() {
  const flow = useFlow()
  const [name, setName] = useState('')
  const [jenis, setJenis] = useState('')
  const [kecamatan, setKecamatan] = useState('')
  const [desa, setDesa] = useState('')
  const [jamMulai, setJamMulai] = useState('')
  const [jamSelesai, setJamSelesai] = useState('')

  const desaOptions = kecamatan ? KECAMATAN_DESA[kecamatan].map((v) => ({ value: v, label: v })) : []
  const canSubmit = name.trim() && jenis && kecamatan && desa && jamMulai && jamSelesai

  return (
    <BmShell
      breadcrumbs={[
        { label: 'Branches' },
        { label: 'POI creation' },
        { label: 'Tambah POI', current: true },
      ]}
    >
      <PageHeading title="Tambah POI" meta="Titik baru untuk cabang ini" />

      <Panel className="flex max-w-[480px] flex-col gap-16 p-16">
        <PanelHeading title="Detail lokasi" />

        <Input label="Nama tempat" placeholder="cth. Pasar Ciseeng" value={name} onChange={(e) => setName(e.target.value)} required />

        <Select label="Jenis" value={jenis} onChange={setJenis} options={JENIS_OPTIONS} />

        <div className="grid grid-cols-2 gap-12">
          <Select
            label="Kecamatan"
            value={kecamatan}
            onChange={(v) => {
              setKecamatan(v)
              setDesa('')
            }}
            options={KECAMATAN_OPTIONS}
          />
          <Select label="Desa" value={desa} onChange={setDesa} options={desaOptions} disabled={!kecamatan} />
        </div>

        <div className="grid grid-cols-2 gap-12">
          <Select label="Jam mulai" value={jamMulai} onChange={setJamMulai} options={HOURS} />
          <Select label="Jam selesai" value={jamSelesai} onChange={setJamSelesai} options={HOURS} />
        </div>

        <div className="flex justify-end gap-8 pt-8">
          <Button variant="outline" size="sm" onClick={flow.back}>
            Batal
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!canSubmit}
            onClick={() => {
              addPoi({ name, jenis, kecamatan, desa, jamMulai, jamSelesai })
              flow.go('poi-list')
            }}
          >
            <Plus size={16} />
            Simpan POI
          </Button>
        </div>
      </Panel>
    </BmShell>
  )
}
