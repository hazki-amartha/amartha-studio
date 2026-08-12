'use client'

// One briefing form, shared by the morning and evening screens (they differ by
// `kind`). The BM reviews the branch scorecard on the left; every briefing action
// lives in a panel on the right — a voice recorder, a per-BP discussion checklist
// (each with its own note), an optional overall note, the attendance photo, and a
// submit CTA pinned in the card's footer.
//
// The panel's content is a per-kind DRAFT in the store, so leaving the form and
// returning resumes it (the dashboard offers "Lanjutkan …"). `readOnly` renders a
// submitted briefing with the same layout but every control disabled.

import { useEffect, useState, type ReactNode } from 'react'
import { useFlow } from '@/platform/runtime'
import { Badge, Button } from '@/design-system/components'
import { ArrowLeft, Camera, Check, NotePencil, Trash } from '@/design-system/icons'
import { BmShell } from './shell'
import { MicGlyph, PageHeading } from './ui'
import { Scorecard } from './scorecard'
import {
  BPS,
  BRANCH_LABEL,
  BRIEFING_INTRO,
  BRIEFING_LABEL,
  REPORT_DATE,
  sectionsForBriefing,
  taskCount,
  unmetTargets,
  type Bp,
  type BriefingKind,
} from './data'
import { store, useFlowState, type BriefingDraft } from './store'

/** Width of the sticky action panel (frame geometry → inline style). */
const PANEL_W = 400
const NOTE_MAX = 350

/** What a submitted-but-not-authored-this-session briefing shows in read-only. */
const SAMPLE_DRAFT: BriefingDraft = {
  attendance: {},
  discussed: Object.fromEntries(BPS.map((b) => [b.id, true])),
  notes: { 'bp-c': 'DPD 0 masih di bawah target — dampingi penagihan Cenli.' },
  overall: 'Hujan besar sepanjang pagi; sebagian BP terlambat turun ke lapangan.',
  photoAttached: true,
  recordings: 1,
}

export function BriefingForm({
  kind,
  readOnly = false,
  own = true,
  date = REPORT_DATE,
}: {
  kind: BriefingKind
  readOnly?: boolean
  own?: boolean
  date?: string
}) {
  const flow = useFlow()
  const { drafts } = useFlowState()
  const label = BRIEFING_LABEL[kind]
  const sections = sectionsForBriefing(kind)

  // Edit mode reads/writes the live draft; read-only shows the live draft for the
  // BM's own submission, else a representative sample for a past briefing.
  const live = drafts[kind]
  const draft = readOnly && !own ? SAMPLE_DRAFT : live
  const set = (patch: Partial<BriefingDraft>) => store.setDraft(kind, patch)

  // Progress: one step per BP discussed, plus the photo. The overall note is
  // optional, so it doesn't count.
  const total = BPS.length + 1
  const done = BPS.filter((b) => draft.discussed[b.id]).length + (draft.photoAttached ? 1 : 0)
  const complete = done === total

  const submit = () => {
    store.markSubmitted(kind)
    store.set({ viewing: { kind, date: REPORT_DATE, own: true } })
    flow.go('briefing-detail')
  }

  return (
    <BmShell
      breadcrumbs={[
        { label: 'Home' },
        { label: 'Branches' },
        { label: BRANCH_LABEL },
        { label: readOnly ? `${label} · ${date}` : label, current: true },
      ]}
      header={
        <PageHeading
          title={`${label} — ${date}`}
          meta={
            readOnly
              ? `${BRANCH_LABEL} · Dikirim oleh ${own ? 'Rina Marlina (Anda)' : 'Rina Marlina'}`
              : `${BRANCH_LABEL} · ${BRIEFING_INTRO[kind]}`
          }
          leading={
            <Button
              variant="ghost"
              size="sm"
              aria-label="Kembali"
              onClick={() => flow.go(readOnly ? 'briefing-history' : 'dashboard')}
            >
              <ArrowLeft size={20} />
            </Button>
          }
        />
      }
    >
      {/* The row fills the screen height: the report column on the left scrolls
          on its own, while the panel on the right stays fixed and scrolls its own
          body — so scrolling the report never moves the panel. */}
      <div className="flex min-h-0 flex-1 gap-16">
        <div className="min-w-0 flex-1 overflow-y-auto">
          <Scorecard sections={sections} comment={{ kind: 'none' }} />
        </div>
        <div
          className="flex shrink-0 flex-col overflow-hidden rounded-16 border border-default bg-neutral-white"
          style={{ width: PANEL_W }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-16">
            <BriefingPanel kind={kind} draft={draft} set={set} disabled={readOnly} />
          </div>
          {/* Sticky footer — the submit CTA (or the sent state) stays visible. */}
          <div className="flex flex-col gap-8 border-t border-default p-16">
            {readOnly ? (
              <span className="flex items-center justify-center gap-8 py-4">
                <Badge intent="green" variant="subtle" size="md" leadingIcon={<Check size={16} />}>
                  Terkirim
                </Badge>
                <span className="text-12 text-caption">Briefing sudah dikirim.</span>
              </span>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={!complete}
                  onClick={submit}
                >
                  Submit briefing
                </Button>
                <span className="text-center text-12 text-caption">
                  {done}/{total} selesai
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </BmShell>
  )
}

/** The scrolling panel body: everything the BM works through to close the
 *  briefing (the submit CTA lives in the card's sticky footer, not here). */
function BriefingPanel({
  kind,
  draft,
  set,
  disabled,
}: {
  kind: BriefingKind
  draft: BriefingDraft
  set: (patch: Partial<BriefingDraft>) => void
  disabled: boolean
}) {
  return (
    <div className="flex flex-col gap-16">
      <div className="flex items-center justify-between gap-12">
        <span className="text-20 font-bold text-default">Catatan Briefing</span>
        <PanelRecorder
          count={draft.recordings}
          onAdd={() => set({ recordings: draft.recordings + 1 })}
          disabled={disabled}
        />
      </div>

      <Section
        title="Kehadiran BP"
        subtitle="Hapus centang jika ada yang tidak hadir"
      >
        <div className="flex flex-col gap-8 rounded-16 border border-default p-16">
          {BPS.map((bp) => {
            const present = draft.attendance[bp.id] ?? true
            return (
              <div key={bp.id} className="flex items-center gap-12">
                <Checkbox
                  checked={present}
                  disabled={disabled}
                  onChange={() =>
                    set({ attendance: { ...draft.attendance, [bp.id]: !present } })
                  }
                />
                <span className="text-14 font-bold text-default">{bp.name}</span>
              </div>
            )
          })}
        </div>
      </Section>

      <Section title="Bahas per BP" subtitle="Bahas target dan tugas hari ini untuk semua BP">
        {BPS.map((bp) => (
          <BpCard
            key={bp.id}
            bp={bp}
            kind={kind}
            checked={!!draft.discussed[bp.id]}
            onToggle={() => set({ discussed: { ...draft.discussed, [bp.id]: !draft.discussed[bp.id] } })}
            note={draft.notes[bp.id] ?? ''}
            onNote={(v) => set({ notes: { ...draft.notes, [bp.id]: v } })}
            disabled={disabled}
          />
        ))}
      </Section>

      <Section
        title="Catatan keseluruhan (opsional)"
        subtitle="Jelaskan situasi yang menggambarkan situasi yang mempengaruhi semua BP, misal: hujan besar, bencana alam"
      >
        <textarea
          value={draft.overall}
          onChange={(e) => set({ overall: e.target.value.slice(0, NOTE_MAX) })}
          maxLength={NOTE_MAX}
          placeholder="Tulis catatan"
          rows={2}
          readOnly={disabled}
          className={`w-full resize-none rounded-8 border border-default p-12 text-14 font-regular text-default placeholder:text-placeholder focus:border-primary-500 focus:outline-none ${
            disabled ? 'bg-neutral-50' : 'bg-neutral-white'
          }`}
        />
        {disabled ? null : (
          <span className="text-12 text-caption">
            {draft.overall.length}/{NOTE_MAX} karakter
          </span>
        )}
      </Section>

      <Section title="Bukti Kehadiran" subtitle="Ambil foto bersama semua peserta yang hadir">
        <PhotoBox
          attached={draft.photoAttached}
          onToggle={() => set({ photoAttached: !draft.photoAttached })}
          disabled={disabled}
        />
      </Section>
    </div>
  )
}

/** A labelled block inside the panel: bold title, caption subtitle, then body. */
function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-16 font-bold text-default">{title}</span>
        <span className="text-12 text-caption">{subtitle}</span>
      </div>
      {children}
    </div>
  )
}

/** One BP row: a discussed checkbox, the BP's name and today's status, and a
 *  collapsible per-BP note. Morning shows the task count; evening shows how many
 *  targets are still unmet. */
function BpCard({
  bp,
  kind,
  checked,
  onToggle,
  note,
  onNote,
  disabled,
}: {
  bp: Bp
  kind: BriefingKind
  checked: boolean
  onToggle: () => void
  note: string
  onNote: (value: string) => void
  disabled: boolean
}) {
  const [editing, setEditing] = useState(false)

  const status =
    kind === 'morning'
      ? { text: `${taskCount(bp.id)} tugas`, cls: 'text-caption' }
      : unmetTargets(bp.id) === 0
        ? { text: 'Semua target terpenuhi', cls: 'text-green-500' }
        : { text: `${unmetTargets(bp.id)} target belum terpenuhi`, cls: 'text-red-500' }

  const showNote = editing || note.length > 0

  return (
    <div className="rounded-12 border border-default p-12">
      <div className="flex items-start gap-12">
        <Checkbox checked={checked} onChange={onToggle} disabled={disabled} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-14 font-bold text-default">{bp.name}</span>
          <span className={`text-12 ${status.cls}`}>{status.text}</span>
          {showNote ? (
            <textarea
              value={note}
              onChange={(e) => onNote(e.target.value)}
              placeholder="Tulis catatan…"
              rows={2}
              readOnly={disabled}
              autoFocus={editing && note.length === 0}
              className={`mt-4 w-full resize-none rounded-8 border border-default p-8 text-14 font-regular text-default placeholder:text-placeholder focus:border-primary-500 focus:outline-none ${
                disabled ? 'bg-neutral-50' : 'bg-neutral-white'
              }`}
            />
          ) : disabled ? (
            <span className="mt-4 text-12 text-placeholder">Tidak ada catatan</span>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="mt-4 flex items-center gap-4 text-14 font-bold text-link active:opacity-70"
            >
              Tambah catatan <NotePencil size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/** A square checkbox — FunDS ships none, so a project-local toggle (§4). */
function Checkbox({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`mt-2 flex size-20 shrink-0 items-center justify-center rounded-4 border ${
        checked ? 'border-primary-500 bg-primary-500 text-neutral-white' : 'border-default bg-neutral-white'
      } ${disabled ? 'opacity-70' : ''}`}
    >
      {checked ? <Check size={16} /> : null}
    </button>
  )
}

/** The voice recorder, condensed to the panel header: a Rekam toggle that turns
 *  into a live Berhenti timer, plus a saved-clips count (kept in the draft).
 *  Click-through only — no real mic (CLAUDE.md §3). Disabled in read-only. */
function PanelRecorder({
  count,
  onAdd,
  disabled,
}: {
  count: number
  onAdd: () => void
  disabled: boolean
}) {
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!recording) return
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => window.clearInterval(id)
  }, [recording])

  const toggle = () => {
    if (recording) {
      setRecording(false)
      onAdd()
    } else {
      setElapsed(0)
      setRecording(true)
    }
  }

  const fmt = (t: number) =>
    `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        variant={recording ? 'danger' : 'outline'}
        size="sm"
        disabled={disabled}
        onClick={toggle}
      >
        <span className="flex items-center gap-4">
          <MicGlyph size={16} /> {recording ? `Berhenti ${fmt(elapsed)}` : 'Rekam'}
        </span>
      </Button>
      {count > 0 && !recording ? (
        <span className="text-10 text-caption">{count} rekaman tersimpan</span>
      ) : null}
    </div>
  )
}

/** The attendance-photo block: a placeholder dropzone that toggles to an attached
 *  state. Click-through only — no real file picker (CLAUDE.md §3). Disabled in
 *  read-only (shows the attached state without the remove action). */
function PhotoBox({
  attached,
  onToggle,
  disabled,
}: {
  attached: boolean
  onToggle: () => void
  disabled: boolean
}) {
  if (attached) {
    return (
      <div className="flex items-center gap-12 rounded-12 border border-default bg-neutral-50 p-12">
        <span className="flex size-40 shrink-0 items-center justify-center rounded-12 bg-primary-50 text-primary-500">
          <Camera size={20} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="flex items-center gap-4 text-14 font-bold text-green-500">
            <Check size={16} /> Foto terlampir
          </span>
          <span className="truncate text-12 text-caption">briefing-{REPORT_DATE}.jpg</span>
        </span>
        {disabled ? null : (
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-4 text-12 font-bold text-link active:opacity-70"
          >
            <Trash size={16} /> Hapus
          </button>
        )}
      </div>
    )
  }
  if (disabled) {
    return (
      <div className="flex w-full items-center justify-center rounded-12 border border-dashed border-default bg-neutral-50 py-20 text-12 text-placeholder">
        Tidak ada foto
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full flex-col items-center justify-center gap-4 rounded-12 border border-dashed border-default bg-neutral-50 py-20 text-caption active:opacity-70"
    >
      <Camera size={24} />
      <span className="text-14 font-bold text-default">Upload or take a photo</span>
      <span className="text-12 text-caption">JPG, PNG up to 10MB</span>
    </button>
  )
}
