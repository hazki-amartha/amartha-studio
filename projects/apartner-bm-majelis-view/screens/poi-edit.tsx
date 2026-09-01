'use client'

// Detail POI — the full, directly-editable POI record, reached from the POI
// summary's "Lihat detail". Every field is open for editing here (no per-card
// Ubah); changes write straight through. The leads list stays on the summary.

import { useState } from 'react'
import { Button, Card, NavigationHeader } from '@/design-system/components'
import { Camera, Image, MapPin } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { leadsForPoi, pipelineStore, usePipeline } from '../lib/pipeline-store'
import { AddressSheet, AssigneePickerSheet, SelectField, SosialisasiSheet, TextField } from '../lib/pipeline-ui'
import { assigneeName, sosialisasiLabel } from '../lib/pipeline'
import { AppScreen, StickyBar } from '../lib/ui'

export function PoiEditScreen() {
  const flow = useFlow()
  const stateSnap = usePipeline()
  const poi = stateSnap.pois[stateSnap.openPoiId]
  const [sheet, setSheet] = useState<'assignee' | 'address' | 'sosialisasi' | null>(null)

  if (!poi) {
    return (
      <AppScreen topBar={<NavigationHeader title="Detail POI" onBack={() => flow.back()} />}>
        <span className="text-14 text-caption">POI tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const pinned = Boolean(poi.mapsCoord)
  const capaian = `Capaian saat ini: ${leadsForPoi(stateSnap, poi.name).length} lead`

  return (
    <AppScreen topBar={<NavigationHeader title="Detail POI" onBack={() => flow.back()} />}>
      <Card>
        <div className="flex flex-col gap-12">
          <TextField
            label="Nama POI"
            value={poi.name}
            editing
            onChange={(e) => pipelineStore.setPoiText(poi.id, { name: e.target.value })}
            placeholder="Nama POI"
          />

          <SelectField
            label="Petugas"
            value={assigneeName(poi.assignedTo)}
            placeholder="Pilih petugas"
            onClick={() => setSheet('assignee')}
          />

          <TextField
            label="Target lead"
            inputMode="numeric"
            value={poi.target ? String(poi.target) : ''}
            editing
            onChange={(e) => {
              const n = e.target.value.replace(/\D/g, '')
              pipelineStore.updatePoi(poi.id, { target: n === '' ? 0 : parseInt(n, 10) })
            }}
            placeholder="mis. 9"
            helperText={capaian}
          />

          <SelectField
            label="Jadwal sosialisasi"
            value={poi.sosialisasi ? sosialisasiLabel(poi.sosialisasi) : undefined}
            placeholder="Atur jadwal sosialisasi"
            onClick={() => setSheet('sosialisasi')}
          />

          <TextField
            label="Catatan panduan"
            value={poi.note ?? ''}
            editing
            onChange={(e) => pipelineStore.setPoiText(poi.id, { note: e.target.value })}
            placeholder="Kenapa POI ini menjanjikan"
            helperText="Isi catatan untuk membantu proses sosialisasi."
          />

          {/* Foto POI */}
          <div className="flex flex-col gap-8">
            <span className="text-12 text-caption">Foto POI</span>
            {poi.photo ? (
              <>
                <div className="flex items-center justify-center rounded-8 bg-neutral-200 py-40 text-neutral-500">
                  <Image size={24} />
                </div>
                <button
                  type="button"
                  onClick={() => pipelineStore.updatePoi(poi.id, { photo: false })}
                  className="self-end text-12 font-bold text-link"
                >
                  Hapus foto
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => pipelineStore.updatePoi(poi.id, { photo: true })}
                className="flex w-full flex-col items-center gap-4 rounded-8 border border-dashed border-default bg-canvas-blue p-16 text-caption"
              >
                <Camera size={24} />
                <span className="text-14 text-default">Upload Foto POI</span>
              </button>
            )}
          </div>

          <SelectField
            label="Alamat"
            value={poi.area || undefined}
            placeholder="Isi alamat"
            onClick={() => setSheet('address')}
            description={pinned ? (
                <span className="text-green-600">Lokasi sudah ditandai di peta</span>
              ) : undefined}
          />

          <TextField
            label="Nama kontak"
            value={poi.contactName ?? ''}
            editing
            onChange={(e) => pipelineStore.setPoiText(poi.id, { contactName: e.target.value })}
            placeholder="Kontak di lokasi, mis. pemilik warung"
          />
          <TextField
            label="No. HP kontak"
            inputMode="tel"
            value={poi.contactPhone ?? ''}
            editing
            onChange={(e) => pipelineStore.setPoiText(poi.id, { contactPhone: e.target.value })}
            placeholder="08xx-xxxx-xxxx"
          />
        </div>
      </Card>

      <StickyBar>
        <Button size="lg" className="w-full" onClick={() => flow.back()}>
          Simpan
        </Button>
      </StickyBar>

      <AddressSheet
        key={sheet === 'address' ? 'addr-open' : 'addr-closed'}
        open={sheet === 'address'}
        address={poi.area}
        mapsCoord={poi.mapsCoord ?? ''}
        onClose={() => setSheet(null)}
        onSave={(address, mapsCoord) => {
          pipelineStore.updatePoi(poi.id, { area: address, mapsCoord })
          setSheet(null)
        }}
      />
      <AssigneePickerSheet
        open={sheet === 'assignee'}
        value={poi.assignedTo}
        onClose={() => setSheet(null)}
        onPick={(v) => {
          pipelineStore.assignPoi(poi.id, v)
          setSheet(null)
        }}
      />
      <SosialisasiSheet
        open={sheet === 'sosialisasi'}
        value={poi.sosialisasi}
        onClose={() => setSheet(null)}
        onSave={(schedule) => {
          pipelineStore.setSosialisasi(poi.id, schedule)
          setSheet(null)
        }}
      />
    </AppScreen>
  )
}
