'use client'

// One briefing form, shared by the morning and evening screens — they differ
// only in `kind` (the title, the prompt, and which of today's two slots gets
// marked sent). The BM reads the same branch scorecard the Monitoring tab shows,
// writes a comment per BP where it's needed, attaches a photo as proof the
// briefing happened, and sends it.
//
// Comments and the photo are the form's own useState: the BM stays on this
// screen while filling it in, and on submit the outcome is carried to the
// Briefings tab through the store, not through this local state.

import { useState } from 'react'
import { useFlow } from '@/platform/runtime'
import { Button } from '@/design-system/components'
import { Camera, Check, Trash } from '@/design-system/icons'
import { BmShell } from './shell'
import { Panel, PanelHeading, PageHeading } from './ui'
import { Scorecard } from './scorecard'
import {
  BRANCH_LABEL,
  BRIEFING_INTRO,
  BRIEFING_LABEL,
  REPORT_DATE,
  sectionsForBriefing,
  type BriefingKind,
} from './data'
import { store } from './store'

export function BriefingForm({ kind }: { kind: BriefingKind }) {
  const flow = useFlow()
  const [comments, setComments] = useState<Record<string, string>>({})
  const [photoAttached, setPhotoAttached] = useState(false)

  const label = BRIEFING_LABEL[kind]

  const submit = () => {
    store.markSubmitted(kind)
    store.set({ tab: 'briefings', viewing: { kind, date: REPORT_DATE, own: true } })
    flow.go('briefing-detail')
  }

  return (
    <BmShell
      breadcrumbs={[
        { label: 'Home' },
        { label: 'Branches' },
        { label: BRANCH_LABEL },
        { label, current: true },
      ]}
      header={
        <PageHeading
          title={`${label} — ${REPORT_DATE}`}
          meta={`${BRANCH_LABEL} · ${BRIEFING_INTRO[kind]}`}
          actions={
            <Button variant="outline" size="sm" onClick={() => flow.go('dashboard')}>
              Kembali
            </Button>
          }
        />
      }
    >
      <Scorecard
        sections={sectionsForBriefing(kind)}
        comment={{
          kind: 'edit',
          comments,
          onChange: (key, value) => setComments((prev) => ({ ...prev, [key]: value })),
        }}
      />

      <div className="pt-16">
        <PhotoProof attached={photoAttached} onToggle={() => setPhotoAttached((a) => !a)} />
      </div>

      {/* The send bar: proof-first, so a briefing can't be closed without the
          photo that shows it happened. */}
      <div className="mt-16 flex flex-wrap items-center justify-between gap-16 rounded-12 border border-default bg-neutral-white p-16">
        <span className="text-12 text-caption">
          {photoAttached
            ? 'Foto bukti terlampir. Briefing siap dikirim.'
            : 'Lampirkan foto bukti terlebih dahulu untuk mengirim briefing.'}
        </span>
        <Button variant="primary" size="md" disabled={!photoAttached} onClick={submit}>
          Kirim {label}
        </Button>
      </div>
    </BmShell>
  )
}

/** The proof block: a placeholder for the field photo the BM snaps of the team
 *  at the briefing. Click-through only — it toggles to an attached state rather
 *  than opening a real file picker (CLAUDE.md §3: nothing leaves the prototype). */
function PhotoProof({ attached, onToggle }: { attached: boolean; onToggle: () => void }) {
  return (
    <Panel>
      <PanelHeading
        title="Foto bukti briefing"
        subtitle="Foto BP saat briefing sebagai bukti briefing telah dilakukan."
      />
      {attached ? (
        <div className="flex items-center gap-16 rounded-12 border border-default bg-neutral-50 p-16">
          <span className="flex size-48 shrink-0 items-center justify-center rounded-12 bg-primary-50 text-primary-500">
            <Camera size={24} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="flex items-center gap-4 text-14 font-bold text-green-500">
              <Check size={16} /> Foto terlampir
            </span>
            <span className="truncate text-12 text-caption">briefing-{REPORT_DATE}.jpg</span>
          </span>
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-4 text-12 font-bold text-link active:opacity-70"
          >
            <Trash size={16} /> Hapus
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full flex-col items-center justify-center gap-8 rounded-12 border border-dashed border-default bg-neutral-50 py-24 text-caption active:opacity-70"
        >
          <Camera size={24} />
          <span className="text-14 font-bold text-default">Ambil / unggah foto</span>
          <span className="text-12 text-caption">JPG atau PNG, maks. 5 MB</span>
        </button>
      )}
    </Panel>
  )
}
