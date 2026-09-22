'use client'

// POI Baru / Edit POI — reached from Branches ▸ POI creation, either from
// "Tambah POI" or by clicking a row in the list. Same screen either way: the
// list decides which by calling `beginCreate` or `beginEdit` before it
// navigates here, and `editingId` is what the form and Submit read that
// decision back from.
//
// Fields read from and write to the module store's draft, not useState — that
// is what lets the "Auto-filled" state (index.ts) and an edited row's own
// values fill the form before this screen even mounts.

import { Button, Input } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import {
  addPoi,
  beginCreate,
  setDraftField,
  updatePoi,
  useDemoBookings,
  useDraft,
  useEditingId,
  usePois,
} from '../lib/store'
import { BmShell } from '../lib/shell'
import { EmptyState, FieldLabel, FoAvailabilityGrid, PageHeading, Panel, Select, SectionTitle } from '../lib/ui'

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

const JADWAL_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((v) => ({
  value: v,
  label: v,
}))

const FO_OPTIONS = ['Sari Handayani', 'Rina Marlina', 'Ani Suryani', 'Dewi Lestari'].map((v) => ({
  value: v,
  label: v,
}))

// 09.00–18.00, one column per hour slot — the FO availability grid's own
// range, narrower than the Jam ramai POI picker's full-day one.
const GRID_HOURS = Array.from({ length: 10 }, (_, i) => {
  const v = `${String(9 + i).padStart(2, '0')}.00`
  return { value: v, label: v }
})

function nextHour(hour: string) {
  const h = Number(hour.split('.')[0]) + 1
  return `${String(h).padStart(2, '0')}.00`
}

export function PoiCreateScreen() {
  const flow = useFlow()
  const draft = useDraft()
  const editingId = useEditingId()
  const pois = usePois()
  const demoBookings = useDemoBookings()
  const title = editingId ? 'Edit POI' : 'POI Baru'

  // The selected FO's own bookings this week — excluding the record being
  // edited, so editing a POI doesn't show it blocking its own slot. Only
  // bookings with their own hours can be placed on an hourly grid. Demo
  // bookings (the "Jadwal padat" state) ride along on top, for a presentation.
  const bookings = [
    ...pois
      .filter(
        (p) => p.id !== editingId && p.assignedFo === draft.assignedFo && p.jadwal && p.jamMulai && p.jamSelesai,
      )
      .map((p) => ({ day: p.jadwal, jamMulai: p.jamMulai, jamSelesai: p.jamSelesai, poiName: p.name })),
    ...(draft.assignedFo === 'Sari Handayani' ? demoBookings : []),
  ]

  const canSubmit = draft.name.trim() && draft.jenis.trim() && draft.kecamatan && draft.desa

  const cancel = () => {
    beginCreate()
    flow.go('poi-list')
  }

  return (
    <BmShell
      breadcrumbs={[
        { label: 'Home' },
        { label: 'Branches' },
        { label: 'POI creation', onClick: cancel },
        { label: title, current: true },
      ]}
    >
      <div className="flex flex-col gap-24">
        <PageHeading
          title={title}
          actions={
            <Button variant="outline" onClick={cancel}>
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

              <div className="flex flex-col gap-8">
                <FieldLabel>Ketersediaan FO minggu ini</FieldLabel>
                {draft.assignedFo ? (
                  <FoAvailabilityGrid
                    fo={draft.assignedFo}
                    days={JADWAL_OPTIONS}
                    hours={GRID_HOURS}
                    bookings={bookings}
                    selectedDay={draft.jadwal}
                    selectedHour={draft.jamMulai}
                    onPick={(day, hour) => {
                      setDraftField('jadwal', day)
                      setDraftField('jamMulai', hour)
                      setDraftField('jamSelesai', nextHour(hour))
                    }}
                  />
                ) : (
                  <div className="rounded-8 border border-default">
                    <EmptyState title="Pilih Assigned FO dahulu" body="Ketersediaannya akan tampil di sini, per jam." />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => {
                  if (editingId) {
                    updatePoi(editingId, draft)
                  } else {
                    addPoi(draft)
                  }
                  beginCreate()
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
