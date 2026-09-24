'use client'

// Halaman Majelis — a majelis record, reached from the Majelis directory, an
// approved lead's CTA, or a lead's own group. Header ported from the A-Partner
// BP New Concept majelis view: the group name over its kumpulan slot + mitra
// count, an "Edit" link, and a route row. Under it the "Anggota Majelis" roster
// (each mitra with her product, arrangement and DPD bucket) and the "Potential
// member" section — the calon mitra being onboarded into this majelis.
//
//   - Existing majelis → roster + potential members.
//   - New (draft) majelis → a "belum aktif" box that runs the full group
//     formation, plus the potential members gathering under it.

import { useState, type ReactNode } from 'react'
import { Badge, BottomSheet, Card, NavigationHeader } from '@/design-system/components'
import { ArrowRight, CalendarDots, ChevronRight, MapPin, Users } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { DRAFT_SCHEDULE, MAJELIS_DIRECTORY, MIN_MEMBERS, type MajelisEntry } from '../lib/schedule'
import { isOnboardingLead, majelisLine, type LeadStatus, type PipelineLead } from '../lib/pipeline'
import type { BadgeIntent } from '@/design-system/components/Badge'
import { useApp } from '../lib/store'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { isLeadAccepted, isMajelisActivated, setFormation, useFormation } from '../lib/formation'
import {
  draftApprovedCount,
  draftPotential,
  MAJELIS_ROSTER,
  MitraRosterCard,
  PotentialMemberRow,
} from '../lib/roster'
import { AppScreen, VisitTitle } from '../lib/ui'

/** A member's status on the majelis page — the survey stage, or, once approved,
 *  whether she is still waiting to be accepted or is already a Mitra. */
function memberStatus(status: LeadStatus, accepted: boolean): { label: string; intent: BadgeIntent } {
  if (status === 'approved')
    return accepted ? { label: 'Mitra', intent: 'green' } : { label: 'Survey approved', intent: 'green' }
  if (status === 'survey-submitted') return { label: 'Survey submitted', intent: 'blue' }
  return { label: 'Survey ongoing', intent: 'orange' }
}

/** Edit — affordance-only routes for a group's schedule, ketua and members. */
function EditSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const rows: { icon: ReactNode; title: string; subtitle: string }[] = [
    { icon: <CalendarDots size={20} />, title: 'Ubah jadwal kumpulan', subtitle: 'Hari dan jam pertemuan mingguan' },
    { icon: <Users size={20} />, title: 'Ubah Ketua Majelis', subtitle: 'Pilih mitra lain sebagai KM' },
    { icon: <ArrowRight size={20} />, title: 'Pindahkan anggota', subtitle: 'Pindahkan mitra ke majelis lain' },
  ]
  return (
    <BottomSheet open={open} onClose={onClose} title="Ubah data majelis">
      <div className="flex flex-col gap-8">
        {rows.map((r) => (
          <button
            key={r.title}
            type="button"
            onClick={onClose}
            className="flex items-center gap-12 rounded-12 border border-default bg-neutral-white p-12 text-left active:bg-neutral-50"
          >
            <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-primary-50 text-primary-500">
              {r.icon}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-14 font-bold text-default">{r.title}</span>
              <span className="truncate text-12 text-caption">{r.subtitle}</span>
            </span>
            <span className="shrink-0 text-disabled">
              <ChevronRight size={20} />
            </span>
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}

export function MajelisPageScreen() {
  const flow = useFlow()
  const { openMajelis } = useApp()
  const formation = useFormation()
  const { leads, openId, order } = usePipeline()
  const lead = leads[openId]
  const [editOpen, setEditOpen] = useState(false)

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

  // The leads onboarding into this majelis — survey ongoing, submitted, approved.
  const potential: PipelineLead[] = order
    .map((id) => leads[id])
    .filter(
      (l) =>
        isOnboardingLead(l) &&
        (existing
          ? l.majelis.kind === 'existing' && l.majelis.id === existing.id
          : draftName !== '' && l.majelis.kind === 'new' && l.majelis.name === draftName),
    )

  // Only an ACTIVE directory majelis has a running mitra roster ("Anggota
  // Majelis"). A draft — directory or synthesized — is still being gathered, so
  // it shows Potential members instead.
  const isDirectoryDraft = existing?.status === 'draft'
  const showRoster = existing?.status === 'aktif'
  const more = existing ? Math.max(0, existing.members - MAJELIS_ROSTER.length) : 0
  // A majelis activates only once at least MIN_MEMBERS of its members are
  // "survey approved" (cleared underwriting) — not merely gathered. That count
  // comes from a directory draft's stand-in roster, or a synthesized draft's
  // pipeline leads.
  const approvedCount =
    isDirectoryDraft && existing
      ? draftApprovedCount(existing.id)
      : potential.filter((l) => l.status === 'approved').length
  const readyToActivate = approvedCount >= MIN_MEMBERS
  const shortApproved = Math.max(0, MIN_MEMBERS - approvedCount)

  // Approved members not yet accepted into the group — the "new members" that a
  // "update group formation" (member acceptance) run brings in.
  const newApproved = potential.filter((l) => l.status === 'approved' && !isLeadAccepted(formation, l.id))

  const draftSched = DRAFT_SCHEDULE[name]
  const subtitle = existing
    ? `${existing.day}, ${existing.time} · ${existing.members} mitra`
    : isDraft
      ? draftSched
        ? `${draftSched.day}, ${draftSched.time} · ${potential.length} calon mitra`
        : `Majelis baru · ${potential.length} calon mitra`
      : 'Wilayah BP'

  function openPotential(l: PipelineLead) {
    pipelineStore.open(l.id)
    flow.go('calon-mitra')
  }

  function formMajelis() {
    setFormation({ mode: 'form', majelisName: name, memberCount: approvedCount })
    flow.go('group-formation')
  }

  function acceptNewMembers() {
    setFormation({
      mode: 'accept',
      majelisName: name,
      memberIds: newApproved.map((l) => l.id),
      memberNames: newApproved.map((l) => l.name),
    })
    flow.go('group-formation')
  }

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={name} when={subtitle} />}
          link={existing ? 'Edit' : undefined}
          onLinkClick={existing ? () => setEditOpen(true) : undefined}
          onBack={() => flow.back()}
        />
      }
    >
      {/* Route out — the one thing the header doesn't carry: a way there. */}
      {existing ? (
        <div className="flex items-center gap-8 rounded-12 bg-neutral-white p-12">
          <span className="shrink-0 text-caption">
            <MapPin size={20} />
          </span>
          <span className="min-w-0 flex-1 truncate text-12 text-default">{existing.place}</span>
          <button type="button" className="flex shrink-0 items-center gap-4 text-12 font-bold text-link">
            Rute
            <ArrowRight size={16} />
          </button>
        </div>
      ) : null}

      {/* New approved members waiting to be accepted — the entry point to the
          member acceptance (Perjanjian + Ritual). Only for an ACTIVE majelis;
          a draft brings its members in through the full formation instead. */}
      {newApproved.length > 0 && !isDraft ? (
        <button
          type="button"
          onClick={acceptNewMembers}
          className="flex items-center justify-between gap-8 rounded-12 border border-primary-200 bg-primary-50 px-12 py-12 text-left active:bg-neutral-50"
        >
          <span className="flex min-w-0 flex-col gap-2">
            <span className="text-14 font-bold text-primary-500">Ada {newApproved.length} anggota baru</span>
            <span className="text-12 text-caption">Update group formation untuk menerima mereka.</span>
          </span>
          <span className="shrink-0 text-primary-500">
            <ChevronRight size={20} />
          </span>
        </button>
      ) : null}

      {/* Draft majelis — form it through the full group formation. */}
      {isDraft ? (
        activated ? (
          <div className="rounded-12 border border-green-500 bg-green-50 px-12 py-12 text-12 font-bold text-green-600">
            Majelis sudah dibentuk & aktif
          </div>
        ) : readyToActivate ? (
          <button
            type="button"
            onClick={formMajelis}
            className="flex items-center justify-between gap-8 rounded-12 border border-green-500 bg-green-50 px-12 py-12 text-left active:bg-neutral-50"
          >
            <span className="flex min-w-0 flex-col gap-2">
              <span className="text-14 font-bold text-green-600">Majelis siap diaktivasi</span>
              <span className="text-12 text-caption">
                {approvedCount} anggota sudah survey approved — jalankan pembentukan majelis.
              </span>
            </span>
            <span className="shrink-0 text-green-600">
              <ChevronRight size={20} />
            </span>
          </button>
        ) : (
          <div className="flex flex-col gap-2 rounded-12 border border-default bg-neutral-50 px-12 py-12">
            <span className="text-14 font-bold text-orange-500">Majelis ini belum aktif</span>
            <span className="text-12 text-caption">
              Butuh {MIN_MEMBERS} anggota survey approved untuk aktivasi — baru {approvedCount} approved,
              kurang {shortApproved} lagi.
            </span>
          </div>
        )
      ) : null}

      {/* Mitra roster — only an active group has one. Standalone cards, each
          carrying her product, arrangement and DPD bucket. */}
      {showRoster ? (
        <>
          <span className="flex items-center gap-8 pt-4 text-14 font-bold text-default">
            <Users size={20} />
            Anggota Majelis
          </span>
          <div className="flex flex-col gap-8">
            {MAJELIS_ROSTER.map((m) => (
              <MitraRosterCard key={m.id} mitra={m} />
            ))}
            {more > 0 ? (
              <div className="flex items-center gap-4">
                <span className="text-12 text-caption">dan {more} anggota lainnya</span>
                <button type="button" className="text-12 font-bold text-link">
                  Lihat selengkapnya
                </button>
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      {/* Potential members. A draft DIRECTORY majelis (Kenari, Teratai) has no
          pipeline leads of its own yet, so it shows the stand-in list; a
          synthesized draft / active group shows its real onboarding leads. */}
      {isDirectoryDraft && existing ? (
        <>
          <span className="flex items-center gap-8 pt-4 text-14 font-bold text-default">
            <Users size={20} />
            Potential member ({existing.members})
          </span>
          <span className="-mt-8 text-12 text-caption">
            {approvedCount} dari {existing.members} anggota sudah survey approved
          </span>
          <Card>
            <div className="flex flex-col">
              {draftPotential(existing.id).map((m, i) => (
                <PotentialMemberRow key={m.id} member={m} divider={i > 0} />
              ))}
              {existing.members > draftPotential(existing.id).length ? (
                <span className="pt-8 text-12 text-caption">
                  dan {existing.members - draftPotential(existing.id).length} calon mitra lainnya
                </span>
              ) : null}
            </div>
          </Card>
        </>
      ) : null}

      {/* Potential members — calon mitra being onboarded into this majelis. The
          heading sits outside the box, like Anggota Majelis. */}
      {!isDirectoryDraft && potential.length > 0 ? (
        <>
          <span className="flex items-center gap-8 pt-4 text-14 font-bold text-default">
            <Users size={20} />
            Potential member ({potential.length})
          </span>
          <Card>
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
                  {(() => {
                    const st = memberStatus(l.status, isLeadAccepted(formation, l.id))
                    return (
                      <Badge intent={st.intent} size="sm">
                        {st.label}
                      </Badge>
                    )
                  })()}
                  <span className="shrink-0 text-disabled">
                    <ChevronRight size={20} />
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </>
      ) : null}

      <EditSheet open={editOpen} onClose={() => setEditOpen(false)} />
    </AppScreen>
  )
}
