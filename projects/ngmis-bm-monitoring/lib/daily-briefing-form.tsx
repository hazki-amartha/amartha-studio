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
//
// Ported from ngmis-bm-monitoring-v2 (§1) — BmShell and PageHeading are our own
// shared components; everything else (Scorecard, data, store) is this tab's own
// ported copy.

import { useEffect, useState, type ReactNode } from 'react'
import { useFlow } from '@/platform/runtime'
import { Badge, Button } from '@/design-system/components'
import { ArrowLeft, Camera, Check, Trash } from '@/design-system/icons'
import { BmShell } from './shell'
import { PageHeading } from './ui'
import { MicGlyph } from './daily-ui'
import { Scorecard } from './daily-scorecard'
import {
  BPS,
  BRANCH_LABEL,
  BRIEFING_INTRO,
  BRIEFING_LABEL,
  REPORT_DATE,
  sectionsForBriefing,
  type Bp,
  type BriefingKind,
} from './daily-data'
import { store, useFlowState, type BriefingDraft } from './daily-store'

/** Width of the sticky action panel (frame geometry → inline style). */
const PANEL_W = 400

/** The morning briefing's "what to do" checklist — the BM confirms each item. */
const CHECKLIST_ITEMS = [
  { id: 'chk-1', label: 'Are all BPs aware of the tasks?' },
  { id: 'chk-2', label: 'Are all BPs aware of Repayment target?' },
  { id: 'chk-3', label: 'Are all BPs aware of Outstanding cash that haven’t been settled?' },
  { id: 'chk-4', label: 'Are all BPs aware of Disbursement target?' },
]

/** The evening briefing's checklist — just text pointers (placeholder for now). */
const EVENING_POINTERS = [
  'Poin 1 — teks placeholder pointer pertama.',
  'Poin 2 — teks placeholder pointer kedua.',
  'Poin 3 — teks placeholder pointer ketiga.',
]

/** What a submitted-but-not-authored-this-session briefing shows in read-only. */
const SAMPLE_DRAFT: BriefingDraft = {
  attendance: {},
  checklist: Object.fromEntries(CHECKLIST_ITEMS.map((i) => [i.id, true])),
  discussed: Object.fromEntries(BPS.map((b) => [b.id, true])),
  notes: { 'bp-c': 'DPD 0 masih di bawah target — dampingi penagihan Cenli.' },
  report: 'Sebagian besar BP mencapai target; Cenli & Fadhil tertinggal di repayment.',
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

  // The photo (Bukti Kehadiran) is the one hard requirement to submit; the notes
  // are all optional.
  const complete = draft.photoAttached

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
              onClick={() => flow.go(readOnly ? 'briefing-history' : 'branch-summary')}
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
                  {complete
                    ? 'Report briefing siap dikirim.'
                    : 'Lampirkan foto bukti untuk mengirim.'}
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
        <span className="text-20 font-bold text-default">Report Briefing</span>
        <PanelRecorder
          count={draft.recordings}
          onAdd={() => set({ recordings: draft.recordings + 1 })}
          disabled={disabled}
        />
      </div>

      {kind === 'morning' ? (
        <Section
          title="Checklist what to do"
          subtitle="Konfirmasi setiap poin bersama BP saat briefing pagi."
        >
          {CHECKLIST_ITEMS.map((item) => {
            const done = !!draft.checklist[item.id]
            return (
              <div
                key={item.id}
                className="flex items-center gap-12 rounded-12 border border-default p-12"
              >
                <Checkbox
                  checked={done}
                  disabled={disabled}
                  onChange={() => set({ checklist: { ...draft.checklist, [item.id]: !done } })}
                />
                <span className="text-14 font-bold text-default">{item.label}</span>
              </div>
            )
          })}
        </Section>
      ) : (
        <Section
          title="Checklist what to do"
          subtitle="Hal-hal yang perlu diperhatikan BM saat briefing sore."
        >
          <div className="flex flex-col gap-8 rounded-12 border border-default p-12">
            {EVENING_POINTERS.map((point, i) => (
              <div key={i} className="flex gap-8">
                <span className="text-14 text-caption">•</span>
                <span className="text-14 font-regular text-default">{point}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {kind === 'evening' ? (
        <Section
          title="Laporan BM"
          subtitle="Jelaskan kenapa BP achieve atau tidak achieve target"
        >
          {BPS.map((bp) => (
            <BpCard
              key={bp.id}
              bp={bp}
              note={draft.notes[bp.id] ?? ''}
              onNote={(v) => set({ notes: { ...draft.notes, [bp.id]: v } })}
              disabled={disabled}
            />
          ))}
          <OverallCard
            value={draft.report}
            onChange={(v) => set({ report: v })}
            disabled={disabled}
          />
        </Section>
      ) : null}

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

/** One BP row in "Laporan BM": the BP's name over an always-open note box. */
function BpCard({
  bp,
  note,
  onNote,
  disabled,
}: {
  bp: Bp
  note: string
  onNote: (value: string) => void
  disabled: boolean
}) {
  return (
    <div className="flex flex-col gap-2 rounded-12 border border-default p-12">
      <span className="text-14 font-bold text-default">{bp.name}</span>
      {disabled && !note ? (
        <span className="mt-4 text-12 text-placeholder">Tidak ada catatan</span>
      ) : (
        <textarea
          value={note}
          onChange={(e) => onNote(e.target.value)}
          placeholder="Tulis catatan…"
          rows={2}
          readOnly={disabled}
          className={`mt-4 w-full resize-none rounded-8 border border-default p-8 text-14 font-regular text-default placeholder:text-placeholder focus:border-primary-500 focus:outline-none ${
            disabled ? 'bg-neutral-50' : 'bg-neutral-white'
          }`}
        />
      )}
    </div>
  )
}

/** The "Overall" card at the foot of "Laporan BM" — why BPs did or didn't hit
 *  their targets overall. */
function OverallCard({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  disabled: boolean
}) {
  return (
    <div className="flex flex-col gap-2 rounded-12 border border-default p-12">
      <span className="text-14 font-bold text-default">Overall</span>
      {disabled && !value ? (
        <span className="mt-4 text-12 text-placeholder">Tidak ada catatan</span>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Tulis laporan…"
          rows={2}
          readOnly={disabled}
          className={`mt-4 w-full resize-none rounded-8 border border-default p-8 text-14 font-regular text-default placeholder:text-placeholder focus:border-primary-500 focus:outline-none ${
            disabled ? 'bg-neutral-50' : 'bg-neutral-white'
          }`}
        />
      )}
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
      className={`flex size-20 shrink-0 items-center justify-center rounded-4 border ${
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
