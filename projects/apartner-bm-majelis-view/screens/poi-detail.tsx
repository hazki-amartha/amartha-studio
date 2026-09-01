'use client'

// POI detail — a compact summary (name + who works it), with "Lihat detail" onto
// the full editable record. Below sits the list of leads captured here, then a
// floating Tambah Lead. The header carries the POI name over its lead count with
// WhatsApp / route discs.

import { Badge, Button } from '@/design-system/components'
import { MapPin, Plus, WhatsappLogo } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { leadsForPoi, pipelineStore, usePipeline } from '../lib/pipeline-store'
import { assigneeName, leadType, majelisLine, sosialisasiLabel, statusBadge, type PipelineLead } from '../lib/pipeline'
import { AppScreen, ContactButton, EmptyState } from '../lib/ui'

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
        {unqualified ? <span className="truncate text-12 text-orange-600">Belum ada KTP</span> : null}
      </div>
      <Badge intent={badge.intent}>{badge.label}</Badge>
    </button>
  )
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" onClick={onBack} aria-label="Kembali" className="shrink-0 text-default">
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
  )
}

export function PoiDetailScreen() {
  const flow = useFlow()
  const stateSnap = usePipeline()
  const poi = stateSnap.pois[stateSnap.openPoiId]

  if (!poi) {
    return (
      <AppScreen
        topBar={
          <div className="flex items-center gap-12 border-b border-default bg-neutral-white px-16 py-8">
            <BackButton onBack={() => flow.back()} />
            <span className="text-16 font-bold text-default">Detail POI</span>
          </div>
        }
      >
        <span className="text-14 text-caption">POI tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const poiLeads = leadsForPoi(stateSnap, poi.name)

  return (
    <AppScreen
      topBar={
        <div className="flex items-start gap-12 border-b border-default bg-neutral-white px-16 py-8">
          <span className="pt-2">
            <BackButton onBack={() => flow.back()} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="truncate text-16 font-bold text-default">{poi.name}</span>
            <span className="truncate text-12 text-caption">Petugas · {assigneeName(poi.assignedTo)}</span>
            <span className={`truncate text-12 ${poi.sosialisasi ? 'text-caption' : 'text-disabled'}`}>
              Sosialisasi: {sosialisasiLabel(poi.sosialisasi)}
            </span>
            <button
              type="button"
              onClick={() => flow.go('poi-edit')}
              className="self-start text-12 font-bold text-link"
            >
              Lihat detail
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-8 pt-2">
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
      {/* Leads from this POI */}
      <div className="flex items-center justify-between pt-4">
        <span className="text-14 font-bold text-default">Lead dari POI ini</span>
        <span className="text-12 text-caption">
          {poiLeads.length} lead{poi.target ? ` / ${poi.target} target` : ''}
        </span>
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
    </AppScreen>
  )
}
