'use client'

// One briefing form, shared by the morning and evening screens — they differ
// only in `kind` (the title, the prompt, and which of today's two slots gets
// marked sent). The BM reads the same branch scorecard the Monitoring tab shows,
// writes a comment where it's needed, attaches a photo as proof the briefing
// happened, and sends it.
//
// `commentStyle` is the one thing the three variants of this form disagree on:
//
//   'inline'    — the shipped shape: a Komentar box in every activity table, per
//                 BP, typed straight into the cell.
//   'dedicated' — no Komentar on the tables at all. One "Komentar briefing"
//                 section underneath, one note per BP for the whole briefing.
//   'dialog'    — Komentar stays on every table, but the cell is only a CTA;
//                 the note is typed in a dialog the CTA opens.
//
// Comments and the photo are the form's own useState: the BM stays on this
// screen while filling it in, and on submit the outcome is carried to the
// Briefings tab through the store, not through this local state.

import { useState } from 'react'
import { useFlow } from '@/platform/runtime'
import { Button, Modal } from '@/design-system/components'
import { Camera, Check, Trash } from '@/design-system/icons'
import { BmShell } from './shell'
import { Panel, PanelHeading, PageHeading, SegmentedControl } from './ui'
import { Scorecard, CommentInput, ORIENTATION_OPTIONS, type CommentMode } from './scorecard'
import {
  BPS,
  BRANCH_LABEL,
  BRIEFING_INTRO,
  BRIEFING_LABEL,
  REPORT_DATE,
  briefingCommentKey,
  commentLabel,
  sectionsForBriefing,
  type BriefingKind,
  type Orientation,
} from './data'
import { store, useFlowState } from './store'

/** Where the commentary lives in this variant of the form. */
export type CommentStyle = 'inline' | 'dedicated' | 'dialog'

export function BriefingForm({
  kind,
  commentStyle = 'inline',
  variantLabel,
}: {
  kind: BriefingKind
  commentStyle?: CommentStyle
  /** Names the alternative in the page meta, so a side-by-side review can tell
   *  which shape is on screen. Omitted on the shipped form. */
  variantLabel?: string
}) {
  const flow = useFlow()
  const { orientation } = useFlowState()
  const [comments, setComments] = useState<Record<string, string>>({})
  const [photoAttached, setPhotoAttached] = useState(false)
  // The dialog variant edits into a draft, so Batal leaves the note as it was.
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const label = BRIEFING_LABEL[kind]
  const setComment = (key: string, value: string) =>
    setComments((prev) => ({ ...prev, [key]: value }))

  const openDialog = (key: string) => {
    setDraft(comments[key] ?? '')
    setEditingKey(key)
  }
  const closeDialog = () => setEditingKey(null)
  const saveDialog = () => {
    if (editingKey) setComment(editingKey, draft.trim())
    setEditingKey(null)
  }

  const comment: CommentMode =
    commentStyle === 'inline'
      ? { kind: 'edit', comments, onChange: setComment }
      : commentStyle === 'dialog'
        ? { kind: 'cta', comments, onOpen: openDialog }
        : { kind: 'none' }

  const submit = () => {
    store.markSubmitted(kind)
    store.set({ tab: 'briefings', viewing: { kind, date: REPORT_DATE, own: true } })
    flow.go('briefing-detail')
  }

  const editing = editingKey ? commentLabel(editingKey) : null

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
          meta={`${BRANCH_LABEL} · ${variantLabel ? `${variantLabel} · ` : ''}${BRIEFING_INTRO[kind]}`}
          actions={
            <Button variant="outline" size="sm" onClick={() => flow.go('dashboard')}>
              Kembali
            </Button>
          }
        />
      }
    >
      <div className="flex justify-end pb-16">
        <SegmentedControl
          label="Tampilan tabel"
          value={orientation}
          options={ORIENTATION_OPTIONS}
          onChange={(v) => store.set({ orientation: v as Orientation })}
        />
      </div>

      <Scorecard sections={sectionsForBriefing(kind)} orientation={orientation} comment={comment} />

      {commentStyle === 'dedicated' ? (
        <div className="pt-16">
          <BriefingCommentPanel label={label} comments={comments} onChange={setComment} />
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

      <Modal
        open={editingKey !== null}
        onClose={closeDialog}
        size="md"
        title="Tulis komentar"
        description={editing ? `${editing.section} · ${editing.bp}` : undefined}
        slot={
          <CommentInput value={draft} onChange={setDraft} rows={5} />
        }
        secondaryAction={
          <Button variant="outline" size="md" onClick={closeDialog}>
            Batal
          </Button>
        }
        primaryAction={
          <Button variant="primary" size="md" onClick={saveDialog}>
            Simpan
          </Button>
        }
      />
    </BmShell>
  )
}

/** The alternative that takes commentary off the activity tables: one note per
 *  BP for the whole briefing, gathered in a single section under the scorecard. */
function BriefingCommentPanel({
  label,
  comments,
  onChange,
}: {
  label: string
  comments: Record<string, string>
  onChange: (key: string, value: string) => void
}) {
  return (
    <Panel>
      <PanelHeading
        title="Komentar briefing"
        subtitle={`Satu komentar per BP untuk seluruh ${label} — bukan per aktivitas.`}
      />
      <div className="flex flex-col gap-12">
        {BPS.map((bp) => {
          const key = briefingCommentKey(bp.id)
          return (
            <div key={bp.id} className="flex flex-col gap-4">
              <span className="text-14 font-bold text-default">{bp.name}</span>
              <CommentInput value={comments[key] ?? ''} onChange={(v) => onChange(key, v)} rows={2} />
            </div>
          )
        })}
      </div>
    </Panel>
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
