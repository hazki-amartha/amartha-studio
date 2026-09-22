'use client'

// POI Baru — reached from Branches ▸ POI creation. The same General / Kontak
// dan Lokasi / Detail Sosialisasi fields as the mobile handoff, laid out on
// the desktop canvas as a two-column grid. Kecamatan gates Kelurahan/Desa the
// way the reference form does — the field starts disabled and only opens once
// a kecamatan is picked.
//
// Fields read from and write to the module store's draft, not useState — that
// is what lets the "Auto-filled" state (index.ts) fill the form before this
// screen even mounts.

import { Button, Input } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { addPoi, resetDraft, setDraftField, useDraft } from '../lib/store'
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
  const draft = useDraft()

  const canSubmit = draft.name.trim() && draft.jenis.trim() && draft.kecamatan && draft.desa && draft.jadwal

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
                  value={draft.name}
                  onChange={(e) => setDraftField('name', e.target.value)}
                />
                <Input
                  label="POI Type"
                  required
                  placeholder="Isi tipe POI"
                  helperText="Contoh: Pasar, Posyandu, Warung, dll"
                  value={draft.jenis}
                  onChange={(e) => setDraftField('jenis', e.target.value)}
                />
                <div className="flex flex-col gap-8">
                  <FieldLabel optional>Jam ramai POI</FieldLabel>
                  <div className="grid grid-cols-2 gap-16">
                    <Select
                      label=""
                      placeholder="Start with"
                      value={draft.jamMulai}
                      onChange={(v) => setDraftField('jamMulai', v)}
                      options={HOURS}
                    />
                    <Select
                      label=""
                      placeholder="End with"
                      value={draft.jamSelesai}
                      onChange={(v) => setDraftField('jamSelesai', v)}
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
                  value={draft.kecamatan}
                  onChange={(v) => {
                    setDraftField('kecamatan', v)
                    setDraftField('desa', '')
                  }}
                  options={KECAMATAN_OPTIONS}
                />
                <Select
                  label="Kelurahan atau Desa"
                  required
                  placeholder="Pilih kelurahan atau desa"
                  value={draft.desa}
                  onChange={(v) => setDraftField('desa', v)}
                  options={(KECAMATAN_DESA[draft.kecamatan] ?? []).map((v) => ({ value: v, label: v }))}
                  disabled={!draft.kecamatan}
                />
                <Input
                  label="Alamat (titik di peta)"
                  optionalText="(optional)"
                  placeholder="cth. Jl. Raya Ciseeng No. 12"
                  value={draft.alamat}
                  onChange={(e) => setDraftField('alamat', e.target.value)}
                />
                <Input
                  label="Nama kontak"
                  optionalText="(optional)"
                  placeholder="Contoh: John Doe"
                  value={draft.namaKontak}
                  onChange={(e) => setDraftField('namaKontak', e.target.value)}
                />
                <Input
                  label="No. HP kontak"
                  optionalText="(optional)"
                  prefix="+62"
                  placeholder="Isi nomor HP yang aktif"
                  helperText="Contoh: 8567891298"
                  value={draft.hpKontak}
                  onChange={(e) => setDraftField('hpKontak', e.target.value.replace(/\D/g, ''))}
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
                  value={draft.jadwal}
                  onChange={(v) => setDraftField('jadwal', v)}
                  options={JADWAL_OPTIONS}
                />
                <Select
                  label="Assigned FO"
                  optional
                  placeholder="Pilih FO / BP"
                  value={draft.assignedFo}
                  onChange={(v) => setDraftField('assignedFo', v)}
                  options={FO_OPTIONS}
                />
                <Input
                  label="Catatan"
                  optionalText="(optional)"
                  placeholder="Tulis catatan"
                  value={draft.catatan}
                  onChange={(e) => setDraftField('catatan', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => {
                  addPoi({
                    name: draft.name,
                    jenis: draft.jenis,
                    kecamatan: draft.kecamatan,
                    desa: draft.desa,
                    jadwal: draft.jadwal,
                    assignedFo: draft.assignedFo,
                  })
                  resetDraft()
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
