'use client'

// POI detail — one point of interest, now fully editable: every field Tambah POI
// captures (name, area, map pin, contact, photo, note) can be changed here, plus
// who it is assigned to. Below the form sits the list of leads captured at it,
// each row jumping to that lead's record.

import { useState, type ReactNode } from 'react'
import { Badge, BottomSheet, Button, Card, Input, NavigationHeader } from '@/design-system/components'
import { Camera, MapPin, Plus, WhatsappLogo } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { leadsForPoi, pipelineStore, usePipeline } from '../lib/pipeline-store'
import { AssigneePickerSheet, DetailRow } from '../lib/pipeline-ui'
import {
  assigneeName,
  leadType,
  majelisLine,
  statusBadge,
  type PipelineLead,
} from '../lib/pipeline'
import { IconChevronDown, IconChevronUp } from '../lib/icons'
import { AppScreen, ContactButton, EmptyState } from '../lib/ui'

type SheetId = 'info' | 'location' | 'photo' | 'kontak' | 'note' | 'assignee' | null

function FormCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <div className="flex flex-col gap-8">
        <span className="text-14 font-bold text-default">{title}</span>
        <div className="flex flex-col">{children}</div>
      </div>
    </Card>
  )
}

/** A compact, collapsible card: title + subtitle over an expand toggle. */
function CollapsibleCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-16 border border-default bg-neutral-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-8 p-12 text-left"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-14 font-bold text-default">{title}</span>
          <span className="text-12 text-caption">{subtitle}</span>
        </span>
        <span className="shrink-0 text-disabled">
          {open ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
        </span>
      </button>
      {open ? <div className="flex flex-col px-12 pb-4">{children}</div> : null}
    </div>
  )
}

/** Edit nama & area — both required. */
function InfoSheet({
  open,
  name: initName,
  area: initArea,
  onClose,
  onSave,
}: {
  open: boolean
  name: string
  area: string
  onClose: () => void
  onSave: (name: string, area: string) => void
}) {
  const [name, setName] = useState(initName)
  const [area, setArea] = useState(initArea)
  const canSave = name.trim() !== '' && area.trim() !== ''

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Ubah info POI"
      primaryAction={
        <Button size="lg" className="w-full" disabled={!canSave} onClick={() => onSave(name, area)}>
          Simpan
        </Button>
      }
    >
      <div className="flex flex-col gap-12">
        <Input label="Nama POI" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama POI" />
        <Input label="Lokasi / area" required value={area} onChange={(e) => setArea(e.target.value)} placeholder="Desa / kecamatan" />
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
      title="Catatan"
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

/** Edit the on-site contact — both optional. */
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

/** Mark the location on a map — a dropped pin, drawn inside the frame. */
function LocationSheet({
  open,
  coord: initCoord,
  onClose,
  onSave,
}: {
  open: boolean
  coord: string
  onClose: () => void
  onSave: (coord: string) => void
}) {
  const [coord, setCoord] = useState(initCoord)
  const pinned = Boolean(coord)

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Lokasi di peta"
      primaryAction={
        <Button size="lg" className="w-full" onClick={() => onSave(coord)}>
          Simpan
        </Button>
      }
    >
      <div className="flex flex-col gap-8">
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
  // The optional fields still blank — the "x data belum dilengkapi" count.
  const incomplete = [!poi.mapsCoord, !poi.photo, !poi.contactName, !poi.contactPhone, !poi.note].filter(
    Boolean,
  ).length
  const infoSubtitle = incomplete > 0 ? `${incomplete} data belum dilengkapi` : 'Data lengkap'

  return (
    <AppScreen
      topBar={
        // Custom header: POI name over its lead count, with WhatsApp / map at the
        // right — the design-system NavigationHeader can't hold a two-line title
        // beside two action buttons.
        <div className="flex items-center gap-12 border-b border-default bg-neutral-white px-16 py-8">
          <button
            type="button"
            onClick={() => flow.back()}
            aria-label="Kembali"
            className="shrink-0 text-default"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="truncate text-16 font-bold text-default">{poi.name}</span>
            <span className="truncate text-12 text-caption">{poiLeads.length} lead</span>
          </div>
          <div className="flex shrink-0 items-center gap-8">
            <ContactButton label={`WhatsApp kontak ${poi.name}`} tone="green" onClick={() => {}}>
              <WhatsappLogo size={20} />
            </ContactButton>
            <ContactButton label={`Peta ${poi.name}`} tone="red" onClick={() => {}}>
              <MapPin size={20} />
            </ContactButton>
          </div>
        </div>
      }
    >
      {/* Info POI — compact and collapsible; fields in the Tambah POI order. */}
      <CollapsibleCard title="Info POI" subtitle={infoSubtitle}>
        <DetailRow label="Nama POI" value={poi.name} onEdit={() => setSheet('info')} />
        <DetailRow label="Lokasi / area" value={poi.area} onEdit={() => setSheet('info')} />
        <DetailRow
          label="Lokasi peta"
          value={poi.mapsCoord ? 'Sudah ditandai' : 'Belum ditandai'}
          onEdit={() => setSheet('location')}
          warning={!poi.mapsCoord}
        />
        <DetailRow
          label="Foto POI"
          value={poi.photo ? 'Terlampir' : 'Belum ada'}
          onEdit={() => setSheet('photo')}
          warning={!poi.photo}
        />
        {poi.photo ? (
          <div className="mt-8 flex items-center justify-center rounded-8 bg-neutral-100 py-32 text-neutral-500">
            <Camera size={24} />
          </div>
        ) : null}
        <DetailRow
          label="Nama kontak"
          value={poi.contactName ? poi.contactName : 'Belum ada'}
          onEdit={() => setSheet('kontak')}
          warning={!poi.contactName}
        />
        <DetailRow
          label="No. HP kontak"
          value={poi.contactPhone ? poi.contactPhone : 'Belum ada'}
          onEdit={() => setSheet('kontak')}
          warning={!poi.contactPhone}
        />
        <DetailRow
          label="Catatan"
          value={poi.note ? poi.note : 'Belum ada'}
          onEdit={() => setSheet('note')}
          warning={!poi.note}
        />
      </CollapsibleCard>

      {/* Penugasan */}
      <FormCard title="Penugasan">
        <DetailRow label="Ditugaskan ke" value={assigneeName(poi.assignedTo)} onEdit={() => setSheet('assignee')} />
      </FormCard>

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

      {/* Tambah POI — floating action, bottom-right. */}
      <div className="pointer-events-none sticky bottom-0 -mx-16 mt-auto flex justify-end px-16 pb-16">
        <Button size="sm" className="pointer-events-auto shadow-lg" onClick={() => flow.go('poi-new')}>
          <span className="flex items-center gap-4">
            <Plus size={16} />
            Tambah POI
          </span>
        </Button>
      </div>

      <InfoSheet
        key={sheet === 'info' ? 'info-open' : 'info-closed'}
        open={sheet === 'info'}
        name={poi.name}
        area={poi.area}
        onClose={() => setSheet(null)}
        onSave={(name, area) => {
          pipelineStore.updatePoi(poi.id, { name, area })
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
      <LocationSheet
        key={sheet === 'location' ? 'loc-open' : 'loc-closed'}
        open={sheet === 'location'}
        coord={poi.mapsCoord ?? ''}
        onClose={() => setSheet(null)}
        onSave={(coord) => {
          pipelineStore.updatePoi(poi.id, { mapsCoord: coord })
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
