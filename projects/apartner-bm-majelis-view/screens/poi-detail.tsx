'use client'

// POI detail — one point of interest as a single card, label-over-value with a
// per-field edit affordance:
//
//   • Header  — photo (tap to change) + POI name (pencil edits the name).
//   • Petugas — the assignee (a BP, or the BM).
//   • Alamat  — the address text + a dropped map pin, with a route disc; the
//     edit sheet carries both the text and "Tandai lokasi di peta".
//   • Kontak  — the on-site contact, with a WhatsApp disc; the edit sheet
//     carries both the name and the phone.
//   • Capaian/target — leads captured against the POI's target (read-only).
//   • Catatan panduan — the sosialisasi note.
//
// Below the card sits the list of leads captured here, then a floating Tambah
// POI action.

import { useState, type ReactNode } from 'react'
import { Badge, BottomSheet, Button, Card, Input, NavigationHeader } from '@/design-system/components'
import { Camera, Image, MapPin, NotePencil, Plus, WhatsappLogo } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { leadsForPoi, pipelineStore, usePipeline } from '../lib/pipeline-store'
import { AssigneePickerSheet } from '../lib/pipeline-ui'
import { assigneeName, leadType, majelisLine, statusBadge, type PipelineLead } from '../lib/pipeline'
import { AppScreen, ContactButton, EmptyState } from '../lib/ui'

type SheetId = 'name' | 'photo' | 'address' | 'kontak' | 'target' | 'note' | 'assignee' | null

/** A label-over-value row, ruled off from its neighbour, with an optional right
 *  accessory (a route / WhatsApp disc) and an edit pencil. */
function PoiField({
  label,
  value,
  italic,
  right,
  onEdit,
}: {
  label: string
  value: string
  italic?: boolean
  right?: ReactNode
  onEdit?: () => void
}) {
  return (
    <div className="flex items-center gap-8 border-t border-default py-12">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-12 text-caption">{label}</span>
        {/* Value with the edit pencil right beside it, not pushed to the edge. */}
        <span className="flex items-start gap-8">
          <span className={`min-w-0 text-14 text-default${italic ? ' italic' : ''}`}>{value}</span>
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Ubah ${label}`}
              className="mt-2 shrink-0 text-primary-500"
            >
              <NotePencil size={16} />
            </button>
          ) : null}
        </span>
      </div>
      {right ? <span className="shrink-0">{right}</span> : null}
    </div>
  )
}

/** Edit the POI name — required. */
function NameSheet({
  open,
  name: init,
  onClose,
  onSave,
}: {
  open: boolean
  name: string
  onClose: () => void
  onSave: (name: string) => void
}) {
  const [name, setName] = useState(init)
  const canSave = name.trim() !== ''
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Ubah nama POI"
      primaryAction={
        <Button size="lg" className="w-full" disabled={!canSave} onClick={() => onSave(name)}>
          Simpan
        </Button>
      }
    >
      <Input label="Nama POI" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama POI" />
    </BottomSheet>
  )
}

/** Edit the address text and the dropped map pin together. */
function AddressSheet({
  open,
  area: initArea,
  coord: initCoord,
  onClose,
  onSave,
}: {
  open: boolean
  area: string
  coord: string
  onClose: () => void
  onSave: (area: string, coord: string) => void
}) {
  const [area, setArea] = useState(initArea)
  const [coord, setCoord] = useState(initCoord)
  const pinned = Boolean(coord)
  const canSave = area.trim() !== ''

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Alamat"
      primaryAction={
        <Button size="lg" className="w-full" disabled={!canSave} onClick={() => onSave(area, coord)}>
          Simpan
        </Button>
      }
    >
      <div className="flex flex-col gap-12">
        <Input
          label="Alamat"
          required
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Jl. / Kampung / RT / RW, desa"
        />
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
                  Hapus pin
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
      </div>
    </BottomSheet>
  )
}

/** Edit the on-site contact — name + phone, both optional. */
function ContactSheet({
  open,
  contactName: initName,
  contactPhone: initPhone,
  onClose,
  onSave,
}: {
  open: boolean
  contactName: string
  contactPhone: string
  onClose: () => void
  onSave: (contactName: string, contactPhone: string) => void
}) {
  const [name, setName] = useState(initName)
  const [phone, setPhone] = useState(initPhone)
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Kontak POI"
      primaryAction={
        <Button size="lg" className="w-full" onClick={() => onSave(name, phone)}>
          Simpan
        </Button>
      }
    >
      <div className="flex flex-col gap-12">
        <Input label="Nama kontak (opsional)" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kontak di lokasi, mis. pemilik warung" />
        <Input label="No. HP kontak (opsional)" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xx-xxxx-xxxx" />
      </div>
    </BottomSheet>
  )
}

/** Attach or remove the POI photo. */
function PhotoSheet({
  open,
  photo: initPhoto,
  onClose,
  onSave,
}: {
  open: boolean
  photo: boolean
  onClose: () => void
  onSave: (photo: boolean) => void
}) {
  const [photo, setPhoto] = useState(initPhoto)
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Foto POI"
      primaryAction={
        <Button size="lg" className="w-full" onClick={() => onSave(photo)}>
          Simpan
        </Button>
      }
    >
      <div className="flex flex-col gap-8">
        {photo ? (
          <>
            <div className="flex items-center justify-center rounded-8 bg-neutral-100 py-32 text-neutral-500">
              <Camera size={24} />
            </div>
            <button type="button" onClick={() => setPhoto(false)} className="self-end text-12 font-bold text-link">
              Hapus foto
            </button>
          </>
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
    </BottomSheet>
  )
}

/** Edit the catatan — optional, with the sosialisasi helper text. */
function NoteSheet({
  open,
  note: initNote,
  onClose,
  onSave,
}: {
  open: boolean
  note: string
  onClose: () => void
  onSave: (note: string) => void
}) {
  const [note, setNote] = useState(initNote)
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Catatan panduan"
      primaryAction={
        <Button size="lg" className="w-full" onClick={() => onSave(note)}>
          Simpan
        </Button>
      }
    >
      <Input
        label="Catatan (opsional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Kenapa POI ini menjanjikan"
        helperText="Isi catatan untuk membantu proses sosialisasi. Kenapa POI ini menjanjikan, siapa yang perlu ditargetkan, dsb."
      />
    </BottomSheet>
  )
}

/** Edit the lead target — a count; blank clears it. */
function TargetSheet({
  open,
  target: init,
  onClose,
  onSave,
}: {
  open: boolean
  target?: number
  onClose: () => void
  onSave: (target: number) => void
}) {
  const [val, setVal] = useState(init ? String(init) : '')
  const n = parseInt(val, 10)
  const canSave = val.trim() === '' || (!Number.isNaN(n) && n >= 0)
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Target lead"
      primaryAction={
        <Button size="lg" className="w-full" disabled={!canSave} onClick={() => onSave(val.trim() === '' ? 0 : n)}>
          Simpan
        </Button>
      }
    >
      <Input
        label="Target lead (opsional)"
        inputMode="numeric"
        value={val}
        onChange={(e) => setVal(e.target.value.replace(/\D/g, ''))}
        placeholder="mis. 9"
        helperText="Jumlah lead yang ditargetkan dari POI ini."
      />
    </BottomSheet>
  )
}

function LeadRow({ lead, onOpen }: { lead: PipelineLead; onOpen: () => void }) {
  const badge = statusBadge(lead)
  const unqualified = leadType(lead) === 'unqualified'
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-8 overflow-hidden rounded-12 border border-default bg-neutral-white p-12 text-left active:bg-neutral-50"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="truncate text-14 font-bold text-default">{lead.name}</span>
        <span className="truncate text-12 text-caption">{majelisLine(lead)}</span>
        <span className="truncate text-12 text-caption">{assigneeName(lead.assignedTo)}</span>
        {unqualified ? <span className="truncate text-12 text-orange-600">Data pribadi belum lengkap</span> : null}
      </div>
      <Badge intent={badge.intent}>{badge.label}</Badge>
    </button>
  )
}

export function PoiDetailScreen() {
  const flow = useFlow()
  const stateSnap = usePipeline()
  const poi = stateSnap.pois[stateSnap.openPoiId]
  const [sheet, setSheet] = useState<SheetId>(null)

  if (!poi) {
    return (
      <AppScreen topBar={<NavigationHeader title="Detail POI" onBack={() => flow.back()} />}>
        <span className="text-14 text-caption">POI tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const poiLeads = leadsForPoi(stateSnap, poi.name)
  const capaian = poi.target ? `${poiLeads.length}/${poi.target} leads` : `${poiLeads.length} leads`

  return (
    <AppScreen topBar={<NavigationHeader title="Detail POI" onBack={() => flow.back()} />}>
      {/* The record card — one wrapper, per-field edit. */}
      <Card>
        <div className="flex flex-col">
          {/* Header: photo (tap to edit) + name (pencil edits name). */}
          <div className="flex items-center gap-12 pb-12">
            <button
              type="button"
              onClick={() => setSheet('photo')}
              aria-label="Ubah foto POI"
              className={`flex h-48 w-48 shrink-0 items-center justify-center overflow-hidden rounded-8 ${
                poi.photo ? 'bg-neutral-200 text-neutral-500' : 'border border-dashed border-default text-disabled'
              }`}
            >
              {poi.photo ? <Image size={24} /> : <Camera size={20} />}
            </button>
            {/* Name with the edit pencil right beside it. */}
            <div className="flex min-w-0 flex-1 items-center gap-8">
              <span className="min-w-0 truncate text-16 font-bold text-default">{poi.name}</span>
              <button
                type="button"
                onClick={() => setSheet('name')}
                aria-label="Ubah nama POI"
                className="shrink-0 text-primary-500"
              >
                <NotePencil size={16} />
              </button>
            </div>
          </div>

          <PoiField label="Petugas" value={assigneeName(poi.assignedTo)} onEdit={() => setSheet('assignee')} />

          <PoiField
            label="Alamat"
            value={poi.area || 'Belum ada'}
            right={
              <ContactButton label={`Peta ${poi.name}`} tone="red" onClick={() => {}}>
                <MapPin size={20} />
              </ContactButton>
            }
            onEdit={() => setSheet('address')}
          />

          <PoiField
            label="Kontak"
            value={poi.contactName || poi.contactPhone || 'Belum ada'}
            right={
              <ContactButton label={`WhatsApp kontak ${poi.name}`} tone="green" onClick={() => {}}>
                <WhatsappLogo size={20} />
              </ContactButton>
            }
            onEdit={() => setSheet('kontak')}
          />

          <PoiField label="Capaian/target" value={capaian} onEdit={() => setSheet('target')} />

          <PoiField
            label="Catatan panduan"
            value={poi.note || 'Belum ada'}
            italic={Boolean(poi.note)}
            onEdit={() => setSheet('note')}
          />
        </div>
      </Card>

      {/* Leads from this POI */}
      <div className="flex items-center justify-between pt-4">
        <span className="text-14 font-bold text-default">Lead dari POI ini</span>
        <span className="text-12 text-caption">{poiLeads.length} lead</span>
      </div>
      <div className="flex flex-col gap-8 pb-16">
        {poiLeads.length === 0 ? (
          <EmptyState title="Belum ada lead" body="Lead yang ditemui di POI ini akan muncul di sini." />
        ) : (
          poiLeads.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              onOpen={() => {
                pipelineStore.open(lead.id)
                flow.go('lead-detail')
              }}
            />
          ))
        )}
      </div>

      {/* Tambah Lead — floating action, bottom-right (a lead met at this POI). */}
      <div className="pointer-events-none sticky bottom-0 -mx-16 mt-auto flex justify-end px-16 pb-16">
        <Button size="sm" className="pointer-events-auto shadow-lg" onClick={() => flow.go('lead-new')}>
          <span className="flex items-center gap-4">
            <Plus size={16} />
            Tambah Lead
          </span>
        </Button>
      </div>

      <NameSheet
        key={sheet === 'name' ? 'name-open' : 'name-closed'}
        open={sheet === 'name'}
        name={poi.name}
        onClose={() => setSheet(null)}
        onSave={(name) => {
          pipelineStore.updatePoi(poi.id, { name })
          setSheet(null)
        }}
      />
      <PhotoSheet
        key={sheet === 'photo' ? 'photo-open' : 'photo-closed'}
        open={sheet === 'photo'}
        photo={Boolean(poi.photo)}
        onClose={() => setSheet(null)}
        onSave={(photo) => {
          pipelineStore.updatePoi(poi.id, { photo })
          setSheet(null)
        }}
      />
      <AddressSheet
        key={sheet === 'address' ? 'addr-open' : 'addr-closed'}
        open={sheet === 'address'}
        area={poi.area}
        coord={poi.mapsCoord ?? ''}
        onClose={() => setSheet(null)}
        onSave={(area, coord) => {
          pipelineStore.updatePoi(poi.id, { area, mapsCoord: coord })
          setSheet(null)
        }}
      />
      <ContactSheet
        key={sheet === 'kontak' ? 'kontak-open' : 'kontak-closed'}
        open={sheet === 'kontak'}
        contactName={poi.contactName ?? ''}
        contactPhone={poi.contactPhone ?? ''}
        onClose={() => setSheet(null)}
        onSave={(contactName, contactPhone) => {
          pipelineStore.updatePoi(poi.id, { contactName, contactPhone })
          setSheet(null)
        }}
      />
      <TargetSheet
        key={sheet === 'target' ? 'target-open' : 'target-closed'}
        open={sheet === 'target'}
        target={poi.target}
        onClose={() => setSheet(null)}
        onSave={(target) => {
          pipelineStore.updatePoi(poi.id, { target })
          setSheet(null)
        }}
      />
      <NoteSheet
        key={sheet === 'note' ? 'note-open' : 'note-closed'}
        open={sheet === 'note'}
        note={poi.note ?? ''}
        onClose={() => setSheet(null)}
        onSave={(note) => {
          pipelineStore.updatePoi(poi.id, { note })
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
    </AppScreen>
  )
}
