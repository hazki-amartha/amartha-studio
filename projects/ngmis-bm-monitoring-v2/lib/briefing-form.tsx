'use client'

// One briefing form, shared by the morning and evening screens — they differ by
// `kind` (title, prompt, which slot gets marked sent). The BM reads the same
// scorecard the Monitoring tab shows, leaves commentary, attaches a photo as
// proof, and sends it.
//
// Commentary has THREE layouts, chosen by the `commentStyle` state (set by the
// controls beside the device, see lib/demo.ts + index.ts):
//   - 'inline'    a Komentar box in every section's table (default)
//   - 'dedicated' no per-section box; one note per BP in a section of its own
//   - 'dialog'    a "✎ Isi" CTA in every section, opening a dialog that shows the
//                 BP's figures for that section while the BM types
//
// Comments and the photo are the form's own useState: the BM stays on this
// screen while filling it in, and on submit the outcome is carried to the
// Briefings tab through the store.

import { useState } from 'react'
import { useFlow } from '@/platform/runtime'
import { Button, Modal } from '@/design-system/components'
import { Camera, Check, Trash } from '@/design-system/icons'
import { BmShell } from './shell'
import { Panel, PanelHeading, PageHeading } from './ui'
import { Scorecard, type CommentMode } from './scorecard'
import {
  BPS,
  BRANCH_LABEL,
  BRIEFING_INTRO,
  BRIEFING_LABEL,
  REPORT_DATE,
  commentKey,
  rowSummary,
  sectionsForBriefing,
  type Bp,
  type BriefingKind,
  type MatrixSection,
} from './data'
import { store, useFlowState } from './store'

export function BriefingForm({ kind }: { kind: BriefingKind }) {
  const flow = useFlow()
  const { commentStyle } = useFlowState()
  const [comments, setComments] = useState<Record<string, string>>({})
  const [photoAttached, setPhotoAttached] = useState(false)
  const [dialog, setDialog] = useState<{ sectionId: string; bpId: string } | null>(null)
  const [draft, setDraft] = useState('')

  const label = BRIEFING_LABEL[kind]
  const sections = sectionsForBriefing(kind)
  const setComment = (key: string, value: string) =>
    setComments((prev) => ({ ...prev, [key]: value }))

  const openDialog = (sectionId: string, bpId: string) => {
    setDraft(comments[commentKey(sectionId, bpId)] ?? '')
    setDialog({ sectionId, bpId })
  }
  const saveDialog = () => {
    if (dialog) setComment(commentKey(dialog.sectionId, dialog.bpId), draft)
    setDialog(null)
  }

  const submit = () => {
    store.markSubmitted(kind)
    store.set({ tab: 'briefings', viewing: { kind, date: REPORT_DATE, own: true } })
    flow.go('briefing-detail')
  }

  // The scorecard's commentary slot follows the chosen style. 'dedicated' takes
  // it out of the table entirely — the notes live in their own section below.
  const comment: CommentMode =
    commentStyle === 'inline'
      ? { kind: 'edit', comments, onChange: setComment }
      : commentStyle === 'dialog'
        ? { kind: 'cta', comments, onOpen: openDialog }
        : { kind: 'none' }

  const dialogSection = dialog ? sections.find((s) => s.id === dialog.sectionId) ?? null : null
  const dialogBp = dialog ? BPS.find((b) => b.id === dialog.bpId) ?? null : null

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
      <Scorecard sections={sections} comment={comment} />

      {commentStyle === 'dedicated' ? (
        <div className="pt-16">
          <DedicatedComments comments={comments} onChange={setComment} />
        </div>
      ) : null}

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

      <CommentDialog
        section={dialogSection}
        bp={dialogBp}
        draft={draft}
        onDraft={setDraft}
        onSave={saveDialog}
        onClose={() => setDialog(null)}
      />
    </BmShell>
  )
}

/** 'dedicated' style: one note per BP, in a section of its own below the
 *  scorecard. Keyed by BP id (no section), so it's one comment per BP. */
function DedicatedComments({
  comments,
  onChange,
}: {
  comments: Record<string, string>
  onChange: (key: string, value: string) => void
}) {
  return (
    <Panel>
      <PanelHeading title="Komentar per BP" subtitle="Satu catatan untuk tiap BP di briefing ini." />
      <div className="flex flex-col gap-12">
        {BPS.map((bp) => (
          <div key={bp.id} className="flex flex-col gap-4">
            <span className="text-14 font-bold text-default">{bp.name}</span>
            <textarea
              value={comments[bp.id] ?? ''}
              onChange={(e) => onChange(bp.id, e.target.value)}
              rows={2}
              placeholder="Tulis komentar…"
              className="w-full resize-none rounded-8 border border-default bg-neutral-white p-8 text-14 font-regular text-default placeholder:text-placeholder focus:border-primary-500 focus:outline-none"
            />
          </div>
        ))}
      </div>
    </Panel>
  )
}

/** 'dialog' style: the sheet a "✎ Isi" CTA opens — the BP's figures for that
 *  section on top (so the BM comments against the numbers), a box underneath. */
function CommentDialog({
  section,
  bp,
  draft,
  onDraft,
  onSave,
  onClose,
}: {
  section: MatrixSection | null
  bp: Bp | null
  draft: string
  onDraft: (value: string) => void
  onSave: () => void
  onClose: () => void
}) {
  const open = section !== null && bp !== null
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={bp ? `Komentar — ${bp.name}` : 'Komentar'}
      description={section?.title}
      slot={
        section && bp ? (
          <div className="flex flex-col gap-12">
            <div className="rounded-12 border border-default p-12">
              {section.rows.map((row, i) => (
                <div
                  key={row.id}
                  className={`flex items-center justify-between gap-16 py-4 ${
                    i > 0 ? 'border-t border-default' : ''
                  }`}
                >
                  <span className="flex flex-col">
                    <span className="text-14 font-bold text-default">{row.label}</span>
                    {row.sublabel ? (
                      <span className="text-12 text-caption">{row.sublabel}</span>
                    ) : null}
                  </span>
                  <span className="flex items-center gap-4 text-14">
                    {rowSummary(section, bp.id, row).map((x, j) => (
                      <span key={x.label} className="flex items-center gap-4">
                        {j > 0 ? <span className="text-placeholder">/</span> : null}
                        <span
                          className={
                            x.tone === 'bad'
                              ? 'font-bold text-red-500'
                              : x.tone === 'good'
                                ? 'font-bold text-green-500'
                                : 'text-default'
                          }
                        >
                          {x.value}
                        </span>
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
            <textarea
              value={draft}
              onChange={(e) => onDraft(e.target.value)}
              rows={3}
              placeholder="Tulis komentar…"
              className="w-full resize-none rounded-8 border border-default bg-neutral-white p-8 text-14 font-regular text-default placeholder:text-placeholder focus:border-primary-500 focus:outline-none"
            />
          </div>
        ) : null
      }
      primaryAction={
        <Button variant="primary" onClick={onSave}>
          Simpan
        </Button>
      }
      secondaryAction={
        <Button variant="outline" onClick={onClose}>
          Batal
        </Button>
      }
    />
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
