'use client'

// Tambah POI — the BM plans a point of interest and hands it to someone. Name
// and area are required; the assignee defaults to the BM (SELF); a planned date
// and a note are optional. Saving opens the POI's page.

import { useState } from 'react'
import { BottomSheet, Button, Card, Input, NavigationHeader } from '@/design-system/components'
import { Camera, MapPin } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { pipelineStore } from '../lib/pipeline-store'
import { AssigneePickerSheet } from '../lib/pipeline-ui'
import { IconChevronDown } from '../lib/icons'
import { AppScreen, StickyBar } from '../lib/ui'
import { assigneeName } from '../lib/pipeline'

export function PoiNewScreen() {
  const flow = useFlow()
  const [name, setName] = useState('')
  const [area, setArea] = useState('')
  // A stand-in for a dropped map pin — the prototype draws the map, nothing
  // opens a real Google Maps (§3).
  const [coord, setCoord] = useState('')
  // Not preselected — the BM picks who works it.
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [photo, setPhoto] = useState(false)
  const [target, setTarget] = useState('')
  const [note, setNote] = useState('')
  const [sheet, setSheet] = useState<'assignee' | 'save' | null>(null)

  const pinned = Boolean(coord)
  const ready = name.trim() !== '' && area.trim() !== '' && assignedTo !== ''

  // Both paths create the POI; they differ only in where they land — back to the
  // Sales list, or straight onto the new POI's page to start adding leads.
  function saveAnd(dest: 'sales' | 'poi-detail') {
    if (!ready) return
    pipelineStore.addPoi({
      name,
      area,
      mapsCoord: coord,
      assignedTo,
      contactName,
      contactPhone,
      photo,
      target: target.trim() === '' ? undefined : parseInt(target, 10),
      note,
    })
    flow.go(dest)
  }

  return (
    <AppScreen topBar={<NavigationHeader title="Tambah POI" onBack={() => flow.back()} />}>
      <Card>
        <div className="flex flex-col gap-12">
          <Input
            label={<span className="font-bold">Nama POI</span>}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pasar, posyandu, warung, majelis taklim…"
          />
          <Input
            label={<span className="font-bold">Alamat</span>}
            required
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Jl., No., RT/RW, desa, kecamatan"
            helperText="Isi alamat lengkap"
          />

          {/* Tandai lokasi di peta — a dropped pin, drawn inside the frame. */}
          <div className="flex flex-col gap-8">
            <span className="text-12 font-bold text-default">Lokasi di peta</span>
            {pinned ? (
              <>
                <div className="relative flex items-center justify-center rounded-8 bg-blue-50 py-32">
                  <span className="text-primary-500">
                    <MapPin size={24} />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-12 text-green-600">Lokasi sudah ditandai</span>
                  <button type="button" onClick={() => setCoord('')} className="text-12 font-bold text-link">
                    Ubah pin
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setCoord('pinned')}
                className="flex items-center justify-center gap-8 rounded-8 border border-dashed border-default py-16 text-14 font-bold text-primary-500"
              >
                <MapPin size={20} />
                Tandai lokasi di peta
              </button>
            )}
          </div>

          {/* Foto POI — optional, a stand-in for a captured photo. */}
          <div className="flex flex-col gap-8">
            <span className="text-12 font-bold text-default">Foto POI (opsional)</span>
            {photo ? (
              <div className="flex items-center gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-12">
                <span className="text-green-500">
                  <Camera size={20} />
                </span>
                <span className="flex-1 text-default">Foto POI terlampir</span>
                <button type="button" onClick={() => setPhoto(false)} className="shrink-0 text-12 font-bold text-link">
                  Hapus
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPhoto(true)}
                className="flex w-full flex-col items-center gap-4 rounded-8 border border-dashed border-default bg-canvas-blue p-16 text-caption"
              >
                <Camera size={24} />
                <span className="text-14 text-default">Upload Foto POI</span>
              </button>
            )}
          </div>

          <Input
            label={<span className="font-bold">Nama kontak (opsional)</span>}
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Kontak di lokasi, mis. pemilik warung"
          />
          <Input
            label={<span className="font-bold">No. HP kontak (opsional)</span>}
            inputMode="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="08xx-xxxx-xxxx"
          />

          {/* Penugasan — right under the contact, styled like the other fields:
              label above, a picker control below, nothing preselected. */}
          <div className="flex flex-col gap-4">
            <span className="text-12 font-bold text-default">
              Ditugaskan ke<span className="text-red-500"> *</span>
            </span>
            <button
              type="button"
              onClick={() => setSheet('assignee')}
              className="flex items-center justify-between gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-left text-14"
            >
              <span className={assignedTo ? 'text-default' : 'text-placeholder'}>
                {assignedTo ? assigneeName(assignedTo) : 'Pilih petugas'}
              </span>
              <span className="shrink-0 text-disabled">
                <IconChevronDown size={20} />
              </span>
            </button>
          </div>

          <Input
            label={<span className="font-bold">Target lead (opsional)</span>}
            inputMode="numeric"
            value={target}
            onChange={(e) => setTarget(e.target.value.replace(/\D/g, ''))}
            placeholder="mis. 9"
            helperText="Jumlah lead yang ditargetkan dari POI ini."
          />
          <Input
            label={<span className="font-bold">Catatan (opsional)</span>}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Kenapa POI ini menjanjikan"
            helperText="Isi catatan untuk membantu proses sosialisasi. Kenapa POI ini menjanjikan, siapa yang perlu ditargetkan, dsb."
          />
        </div>
      </Card>

      <StickyBar>
        <Button size="lg" className="w-full" disabled={!ready} onClick={() => setSheet('save')}>
          Simpan
        </Button>
      </StickyBar>

      <AssigneePickerSheet
        open={sheet === 'assignee'}
        value={assignedTo}
        onClose={() => setSheet(null)}
        onPick={(v) => {
          setAssignedTo(v)
          setSheet(null)
        }}
      />

      {/* After Simpan: save and leave, or save and go add leads on the new POI. */}
      <BottomSheet
        open={sheet === 'save'}
        onClose={() => setSheet(null)}
        title="POI siap disimpan"
        description="Simpan saja, atau lanjut mengisi lead dari POI ini."
      >
        <div className="flex flex-col gap-8">
          <Button size="lg" className="w-full" onClick={() => saveAnd('sales')}>
            Simpan
          </Button>
          <Button variant="secondary" size="lg" className="w-full" onClick={() => saveAnd('poi-detail')}>
            Lanjut isi Leads
          </Button>
        </div>
      </BottomSheet>
    </AppScreen>
  )
}
