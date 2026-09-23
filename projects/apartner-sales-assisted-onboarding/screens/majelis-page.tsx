'use client'

// Halaman Majelis — a majelis record, reached from the Majelis directory, an
// approved lead's CTA, or a lead's own group. It shows the group's schedule,
// product and status, its (stand-in) mitra roster, and — under it — the
// "Potential member" section: the calon mitra being onboarded into this majelis.
//
//   - Existing majelis → shows its roster + potential members.
//   - New (draft) majelis → a "Majelis ini belum aktif" box that runs the full
//     group formation, plus the potential members gathering under it.

import { Badge, Card, NavigationHeader } from '@/design-system/components'
import { CalendarDots, ChevronRight, MapPin, Users } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { MAJELIS_DIRECTORY, MIN_MEMBERS, type MajelisEntry } from '../lib/schedule'
import { isCalonMitra, majelisLine, type PipelineLead } from '../lib/pipeline'
import { useApp } from '../lib/store'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { isMajelisActivated, setFormation, useFormation } from '../lib/formation'
import { AppScreen, ProductBadge } from '../lib/ui'

// A short stand-in mitra roster for an active majelis.
const ROSTER = ['Rohaya', 'Siti Aisyah', 'Euis Komariah', 'Nia Kurniasih', 'Dewi Anggraeni']

function StatusBadge({ entry }: { entry: MajelisEntry }) {
  if (entry.status === 'draft') return <Badge intent="yellow">Draft</Badge>
  if (entry.menunggak > 0) return <Badge intent="orange">{entry.menunggak} Mitra DPD</Badge>
  return <Badge intent="green">Aktif</Badge>
}

export function MajelisPageScreen() {
  const flow = useFlow()
  const { openMajelis } = useApp()
  const formation = useFormation()
  const { leads, openId, order } = usePipeline()
  const lead = leads[openId]

  // Resolve the target: an existing directory group, or a new (draft) majelis
  // by name. Falls back to the open lead's own majelis.
  const assignment = lead?.majelis
  let existing: MajelisEntry | undefined
  let draftName = ''
  if (openMajelis?.kind === 'existing') {
    existing = MAJELIS_DIRECTORY.find((m) => m.id === openMajelis.id)
  } else if (openMajelis?.kind === 'draft') {
    draftName = openMajelis.name
  } else if (assignment?.kind === 'existing') {
    existing = MAJELIS_DIRECTORY.find((m) => m.id === assignment.id)
  } else if (assignment?.kind === 'new') {
    draftName = assignment.name
  }

  const name = existing?.name ?? (draftName || (lead ? majelisLine(lead) : 'Majelis'))
  // Any not-yet-running majelis is a draft — a synthesized new-majelis group, or
  // a directory entry whose status is 'draft'. All of them can be formed.
  const isDraft = existing ? existing.status === 'draft' : draftName !== ''
  const activated = isMajelisActivated(formation, name)

  // Potential members — calon mitra whose majelis is this one.
  const potential: PipelineLead[] = order
    .map((id) => leads[id])
    .filter(
      (l) =>
        isCalonMitra(l) &&
        (existing
          ? l.majelis.kind === 'existing' && l.majelis.id === existing.id
          : draftName !== '' && l.majelis.kind === 'new' && l.majelis.name === draftName),
    )

  const members = existing?.members ?? potential.length
  // A directory majelis (active or draft) has a mitra roster; a synthesized new
  // majelis is still forming from its potential members and has none yet.
  const showRoster = Boolean(existing)
  const roster = showRoster ? ROSTER.slice(0, Math.min(members, ROSTER.length)) : []
  const more = showRoster ? Math.max(0, members - roster.length) : 0
  // A majelis needs at least MIN_MEMBERS mitra before it can be formed/activated.
  const canForm = members >= MIN_MEMBERS

  function openPotential(l: PipelineLead) {
    pipelineStore.open(l.id)
    flow.go('calon-mitra')
  }

  function formMajelis() {
    setFormation({ mode: 'form', majelisName: name, memberCount: members })
    flow.go('group-formation')
  }

  return (
    <AppScreen topBar={<NavigationHeader title="Halaman Majelis" onBack={() => flow.back()} />}>
      <Card>
        <div className="flex flex-col gap-12">
          <div className="flex items-start justify-between gap-8">
            <div className="flex min-w-0 flex-col gap-2">
              <span className="text-18 font-bold text-default">{name}</span>
              <span className="flex items-center gap-4 text-12 text-caption">
                <MapPin size={16} />
                {existing?.place ?? (isDraft ? 'Majelis baru' : 'Wilayah BP')}
              </span>
            </div>
            {activated ? (
              <Badge intent="green">Aktif</Badge>
            ) : existing ? (
              <StatusBadge entry={existing} />
            ) : (
              <Badge intent="yellow">Draft</Badge>
            )}
          </div>

          <div className="flex items-center gap-8 rounded-12 bg-canvas-blue px-12 py-8 text-12 text-default">
            <span className="text-primary-500">
              <CalendarDots size={20} />
            </span>
            {existing ? `Kumpulan ${existing.day}, ${existing.time}` : 'Jadwal kumpulan diatur saat pembentukan'}{' '}
            · {members} anggota
          </div>

          {existing ? (
            <div className="flex">
              <ProductBadge product={existing.type} />
            </div>
          ) : null}

          {/* Draft majelis — activate it through the full group formation, but
              only once it has at least MIN_MEMBERS mitra. */}
          {isDraft ? (
            activated ? (
              <div className="rounded-12 border border-green-500 bg-green-50 px-12 py-12 text-12 font-bold text-green-600">
                Majelis sudah dibentuk & aktif
              </div>
            ) : canForm ? (
              <button
                type="button"
                onClick={formMajelis}
                className="flex items-center justify-between gap-8 rounded-12 border border-orange-200 bg-orange-50 px-12 py-12 text-left active:bg-neutral-50"
              >
                <span className="flex min-w-0 flex-col gap-2">
                  <span className="text-14 font-bold text-orange-500">Majelis ini belum aktif</span>
                  <span className="text-12 text-caption">
                    Jalankan pembentukan majelis untuk mengaktifkannya.
                  </span>
                </span>
                <span className="shrink-0 text-orange-500">
                  <ChevronRight size={20} />
                </span>
              </button>
            ) : (
              <div className="flex flex-col gap-2 rounded-12 border border-default bg-neutral-50 px-12 py-12">
                <span className="text-14 font-bold text-orange-500">Majelis ini belum aktif</span>
                <span className="text-12 text-caption">
                  Butuh minimal {MIN_MEMBERS} anggota untuk dibentuk — kurang{' '}
                  {MIN_MEMBERS - members} anggota lagi.
                </span>
              </div>
            )
          ) : null}
        </div>
      </Card>

      {/* Mitra roster — only an active group has one. */}
      {showRoster ? (
        <Card>
          <div className="flex flex-col gap-12">
            <span className="flex items-center gap-8 text-14 font-bold text-default">
              <Users size={20} />
              Anggota Majelis
            </span>
            <div className="flex flex-col">
              {roster.map((n, i) => (
                <div
                  key={n}
                  className={`flex items-center gap-12 py-8 ${i > 0 ? 'border-t border-default' : ''}`}
                >
                  <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-12 font-bold text-caption">
                    {n.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-14 text-default">{n}</span>
                </div>
              ))}
              {more > 0 ? (
                <span className="pt-8 text-12 text-caption">dan {more} anggota lainnya</span>
              ) : null}
            </div>
          </div>
        </Card>
      ) : null}

      {/* Potential members — calon mitra being onboarded into this majelis. */}
      {potential.length > 0 ? (
        <Card>
          <div className="flex flex-col gap-12">
            <span className="flex items-center gap-8 text-14 font-bold text-default">
              <Users size={20} />
              Potential member ({potential.length})
            </span>
            <div className="flex flex-col">
              {potential.map((l, i) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => openPotential(l)}
                  className={`flex items-center gap-12 py-8 text-left ${i > 0 ? 'border-t border-default' : ''}`}
                >
                  <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-primary-50 text-12 font-bold text-primary-500">
                    {l.name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-14 text-default">{l.name}</span>
                  <Badge intent="orange" size="sm">
                    Calon Mitra
                  </Badge>
                  <span className="shrink-0 text-disabled">
                    <ChevronRight size={20} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      ) : null}
    </AppScreen>
  )
}
