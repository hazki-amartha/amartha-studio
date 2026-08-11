'use client'

// The branch scorecard: one Panel + matrix per subject. BPs run across the top,
// each spanning its subject's paired measures (Target/Completed, Aktif/Terbayar,
// Collected/Settled); the metrics run down the side. A two-level header carries
// the BP name over its measure pair. Shared by the Monitoring tab (read-only)
// and both briefing forms, which pass `comment` to add a "Komentar" row.

import type { ReactNode } from 'react'
import { Badge } from '@/design-system/components'
import { CheckCircleFill, CrossCircleFill, NotePencil } from '@/design-system/icons'
import { Panel, PanelHeading } from './ui'
import {
  BPS,
  CLOSING_SECTION_ID,
  SECTIONS,
  TASK_SECTION_ID,
  commentKey,
  measureTone,
  pctText,
  rupiah,
  type Bp,
  type CellKind,
  type MatrixRow,
  type MatrixSection,
  type Tone,
} from './data'

/** Figure colour: red when a target is missed, green when a goal is met. */
const toneMainClass = (t: Tone): string =>
  t === 'bad' ? 'font-bold text-red-500' : t === 'good' ? 'font-bold text-green-500' : 'text-default'
const toneNoteClass = (t: Tone): string =>
  t === 'bad' ? 'text-red-500' : t === 'good' ? 'text-green-500' : 'text-caption'

// Fixed widths (frame geometry → inline, not spacing tokens). One measure width
// for EVERY subject — so each BP's column sits at the same x in all four tables
// and the eye can skim a BP straight down the page. 132 fits the widest cell
// (a rupiah amount over a "Sisa …" line).
const W_LABEL = 220
const MEASURE_W = 132

/** How the "Komentar" row behaves: absent (Monitoring), an editable box (a live
 *  briefing), or seeded read-only text (a past briefing). */
export type CommentMode =
  | { kind: 'none' }
  | { kind: 'edit'; comments: Record<string, string>; onChange: (key: string, value: string) => void }
  | { kind: 'read'; comments: Record<string, string> }
  | { kind: 'cta'; comments: Record<string, string>; onOpen: (sectionId: string, bpId: string) => void }

const fmtMain = (value: number, kind: CellKind): string =>
  kind === 'rupiah' ? rupiah(value) : String(value)

/** The secondary line under a row's SECOND measure: a percentage of the first
 *  (Terbayar of Aktif) or the remainder still held (Collected less Settled). */
function noteText(row: MatrixRow, first: number, second: number): string | null {
  if (row.note === 'pct') return `(${pctText(second, first)})`
  if (row.note === 'sisa') return `Sisa ${rupiah(first - second)}`
  return null
}

function CommentInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Tulis komentar…"
      rows={2}
      className="w-full resize-none rounded-8 border border-default bg-neutral-white p-8 text-14 font-regular text-default placeholder:text-placeholder focus:border-primary-500 focus:outline-none"
    />
  )
}

function commentCell(comment: CommentMode, sectionId: string, bpId: string): ReactNode {
  if (comment.kind === 'none') return null
  const key = commentKey(sectionId, bpId)
  const value = comment.comments[key]
  if (comment.kind === 'edit') {
    return <CommentInput value={value ?? ''} onChange={(v) => comment.onChange(key, v)} />
  }
  if (comment.kind === 'cta') {
    return (
      <div className="flex flex-col items-start gap-4">
        {value ? <span className="block whitespace-normal text-14 text-default">{value}</span> : null}
        <button
          type="button"
          onClick={() => comment.onOpen(sectionId, bpId)}
          className="flex items-center gap-4 text-14 font-bold text-link active:opacity-70"
        >
          <NotePencil size={16} /> {value ? 'Ubah' : 'Isi'}
        </button>
      </div>
    )
  }
  return (
    <span className="block whitespace-normal text-14 text-default">
      {value ? value : <span className="text-placeholder">—</span>}
    </span>
  )
}

function SectionMatrix({
  section,
  bps,
  comment,
}: {
  section: MatrixSection
  bps: Bp[]
  comment: CommentMode
}) {
  const { measures } = section
  const mw = MEASURE_W
  const totalWidth = W_LABEL + bps.length * measures.length * mw

  return (
    <Panel>
      <PanelHeading title={section.title} />
      <div className="overflow-x-auto">
        <table className="table-fixed border-collapse text-left" style={{ width: totalWidth }}>
          <colgroup>
            <col style={{ width: W_LABEL }} />
            {bps.flatMap((bp) =>
              measures.map((mm) => <col key={`${bp.id}-${mm.id}`} style={{ width: mw }} />),
            )}
          </colgroup>
          <thead>
            <tr className="bg-neutral-50">
              <th
                rowSpan={2}
                className="sticky left-0 z-10 rounded-l-8 border-r border-default bg-neutral-50 px-12 py-8 text-left align-bottom text-12 font-bold text-default"
              />
              {bps.map((bp, i) => (
                <th
                  key={bp.id}
                  colSpan={measures.length}
                  className={`border-l border-default px-12 py-8 text-12 font-bold text-default ${
                    i === bps.length - 1 ? 'rounded-tr-8' : ''
                  }`}
                >
                  {bp.name}
                </th>
              ))}
            </tr>
            <tr className="bg-neutral-50">
              {bps.flatMap((bp) =>
                measures.map((mm, j) => (
                  <th
                    key={`${bp.id}-${mm.id}`}
                    className={`px-12 py-8 text-12 font-regular text-caption ${
                      j === 0 ? 'border-l border-default' : ''
                    }`}
                  >
                    {mm.label}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-default align-top bg-neutral-white"
              >
                <td className="sticky left-0 z-10 border-r border-default bg-neutral-white px-12 py-8">
                  <span className="block text-14 font-bold text-default">{row.label}</span>
                  {row.sublabel ? (
                    <span className="block text-12 font-regular text-caption">{row.sublabel}</span>
                  ) : null}
                </td>
                {bps.flatMap((bp) => {
                  const cells = section.values[bp.id][row.id]
                  const first = cells[measures[0].id]
                  const second = cells[measures[1].id]
                  return measures.map((mm, j) => {
                    const note = j === 1 ? noteText(row, first, second) : null
                    const tone = measureTone(section, row, cells, j)
                    return (
                      <td
                        key={`${bp.id}-${mm.id}`}
                        className={`px-12 py-8 text-14 ${j === 0 ? 'border-l border-default' : ''}`}
                      >
                        <span className={`block ${toneMainClass(tone)}`}>
                          {fmtMain(cells[mm.id], row.kind)}
                        </span>
                        {note ? <span className={`block text-12 ${toneNoteClass(tone)}`}>{note}</span> : null}
                      </td>
                    )
                  })
                })}
              </tr>
            ))}
            {comment.kind !== 'none' ? (
              <tr className="border-b border-default bg-neutral-white align-top">
                <td className="sticky left-0 z-10 border-r border-default bg-neutral-white px-12 py-8 text-14 font-bold text-default">
                  Catatan tambahan
                </td>
                {bps.map((bp) => (
                  <td
                    key={bp.id}
                    colSpan={measures.length}
                    className="border-l border-default px-12 py-8"
                  >
                    {commentCell(comment, section.id, bp.id)}
                  </td>
                ))}
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

/** The subject matrices in the reference's order. */
export function Scorecard({
  sections = SECTIONS,
  bps = BPS,
  comment = { kind: 'none' },
}: {
  sections?: MatrixSection[]
  bps?: Bp[]
  comment?: CommentMode
}) {
  return (
    <div className="flex flex-col gap-16">
      {sections.map((section) => (
        <SectionMatrix key={section.id} section={section} bps={bps} comment={comment} />
      ))}
    </div>
  )
}

// --- The transposed layout --------------------------------------------------
//
// Same figures and the same two-level header, BPs turned into ROWS. The measure
// pair stays two columns under its metric — Target beside Completed reads
// cleaner than one stacked cell — but three repetitions the matrix pays for six
// times over go away:
//   1. the BP name is printed once per table (the leftmost column) instead of
//      once per measure pair;
//   2. "Target / Completed" is written once per metric, not once per BP;
//   3. a metric's own target (">90%") sits in its column header, not repeated
//      down every BP.
// The table then fills the container instead of scrolling sideways, and the
// roster grows downward (free) rather than out of view.

const W_BP = 180
/** The tutup-hari column — a badge, so it takes a fixed width rather than an
 *  equal share of the measure columns. */
const W_STATUS = 140

/** "Sudah / belum tutup" as a badge. Closing the day in the field app is the
 *  last thing on the BP's task list, so in this layout it rides in the Task
 *  table as a trailing column rather than living in a panel of its own. */
function ClosedDayBadge({ bp }: { bp: Bp }) {
  return bp.closedDay ? (
    <Badge intent="green" variant="subtle" size="sm" leadingIcon={<CheckCircleFill size={16} />}>
      Sudah tutup
    </Badge>
  ) : (
    <Badge intent="red" variant="subtle" size="sm" leadingIcon={<CrossCircleFill size={16} />}>
      Belum tutup
    </Badge>
  )
}

function BpRowsMatrix({ section, bps, status }: { section: MatrixSection; bps: Bp[]; status?: boolean }) {
  const { rows, measures } = section

  return (
    <Panel>
      <PanelHeading title={section.title} />
      <div className="min-w-0 overflow-x-auto">
        {/* table-fixed + w-full: the BP column is pinned at 180 and every
            measure column splits the rest of the container equally. */}
        <table className="w-full table-fixed border-collapse text-left">
          <colgroup>
            <col style={{ width: W_BP }} />
            {rows.flatMap((row) =>
              measures.map((mm) => <col key={`${row.id}-${mm.id}`} />),
            )}
            {status ? <col style={{ width: W_STATUS }} /> : null}
          </colgroup>
          <thead>
            <tr className="bg-neutral-50">
              <th
                rowSpan={2}
                className="sticky left-0 z-10 rounded-l-8 border-r border-default bg-neutral-50 px-12 py-8 text-left align-bottom text-12 font-bold text-default"
              >
                Business Partner
              </th>
              {rows.map((row, i) => (
                <th
                  key={row.id}
                  colSpan={measures.length}
                  className={`border-l border-default px-12 py-8 text-12 font-bold text-default ${
                    i === rows.length - 1 && !status ? 'rounded-tr-8' : ''
                  }`}
                >
                  <span className="block">{row.label}</span>
                  {row.sublabel ? (
                    <span className="block font-regular text-caption">{row.sublabel}</span>
                  ) : null}
                </th>
              ))}
              {status ? (
                <th
                  rowSpan={2}
                  className="rounded-tr-8 rounded-br-8 border-l border-default px-12 py-8 align-bottom text-12 font-bold text-default"
                >
                  Tutup hari
                </th>
              ) : null}
            </tr>
            <tr className="bg-neutral-50">
              {rows.flatMap((row) =>
                measures.map((mm, j) => (
                  <th
                    key={`${row.id}-${mm.id}`}
                    className={`px-12 py-8 text-12 font-regular text-caption ${
                      j === 0 ? 'border-l border-default' : ''
                    }`}
                  >
                    {mm.label}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {bps.map((bp) => (
              <tr key={bp.id} className="border-b border-default bg-neutral-white align-top">
                <td className="sticky left-0 z-10 border-r border-default bg-neutral-white px-12 py-8 text-14 font-bold text-default">
                  {bp.name}
                </td>
                {rows.flatMap((row) => {
                  const cells = section.values[bp.id][row.id]
                  const first = cells[measures[0].id]
                  const second = cells[measures[1].id]
                  return measures.map((mm, j) => {
                    const note = j === 1 ? noteText(row, first, second) : null
                    const tone = measureTone(section, row, cells, j)
                    return (
                      <td
                        key={`${row.id}-${mm.id}`}
                        className={`px-12 py-8 text-14 ${j === 0 ? 'border-l border-default' : ''}`}
                      >
                        <span className={`block ${toneMainClass(tone)}`}>
                          {fmtMain(cells[mm.id], row.kind)}
                        </span>
                        {note ? <span className={`block text-12 ${toneNoteClass(tone)}`}>{note}</span> : null}
                      </td>
                    )
                  })
                })}
                {status ? (
                  <td className="border-l border-default px-12 py-8">
                    <ClosedDayBadge bp={bp} />
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

/** The scorecard with BPs down the side. Two subjects move: closing the day is
 *  the last item on the BP's task list, so it rides as a column in the Task
 *  table; cash settlement is one metric per BP, so it folds into
 *  `ClosingPanel` instead of standing as a one-column table. */
export function ScorecardByBp({
  sections = SECTIONS,
  bps = BPS,
}: {
  sections?: MatrixSection[]
  bps?: Bp[]
}) {
  return (
    <div className="flex flex-col gap-16">
      {sections
        .filter((s) => s.id !== CLOSING_SECTION_ID)
        .map((section) => (
          <BpRowsMatrix
            key={section.id}
            section={section}
            bps={bps}
            status={section.id === TASK_SECTION_ID}
          />
        ))}
    </div>
  )
}

/** Cash settlement, per BP: what was collected, what reached the branch, and
 *  what is still in the BP's hands. One metric per BP, so it reads as a plain
 *  row-per-BP panel rather than a one-column matrix. */
export function ClosingPanel({
  sections = SECTIONS,
  bps = BPS,
}: {
  sections?: MatrixSection[]
  bps?: Bp[]
}) {
  const cash = sections.find((s) => s.id === CLOSING_SECTION_ID)
  const row = cash?.rows[0]

  return (
    <Panel>
      <PanelHeading title="Cash settlement" />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-neutral-50">
              <th className="rounded-l-8 px-12 py-8 text-12 font-bold text-default">Business Partner</th>
              <th className="px-12 py-8 text-12 font-bold text-default">Collected</th>
              <th className="px-12 py-8 text-12 font-bold text-default">Settled</th>
              <th className="rounded-r-8 px-12 py-8 text-12 font-bold text-default">Sisa di BP</th>
            </tr>
          </thead>
          <tbody>
            {bps.map((bp) => {
              const cells = cash && row ? cash.values[bp.id][row.id] : null
              const collected = cells && cash ? cells[cash.measures[0].id] : 0
              const settled = cells && cash ? cells[cash.measures[1].id] : 0
              const sisa = collected - settled
              return (
                <tr key={bp.id} className="border-b border-default bg-neutral-white">
                  <td className="px-12 py-8 text-14 font-bold text-default">{bp.name}</td>
                  <td className="px-12 py-8 text-14 text-default">{rupiah(collected)}</td>
                  <td className={`px-12 py-8 text-14 ${sisa > 0 ? 'font-bold text-red-500' : 'text-default'}`}>
                    {rupiah(settled)}
                  </td>
                  <td className={`px-12 py-8 text-14 ${sisa > 0 ? 'text-red-500' : 'text-caption'}`}>
                    {rupiah(sisa)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

/** "Has closed the day?" — per BP. A BP who hasn't closed is the one the BM
 *  chases at the evening briefing. */
export function ClosedDayPanel({ bps = BPS }: { bps?: Bp[] }) {
  return (
    <Panel>
      <PanelHeading title="Tutup hari" subtitle="Apakah BP sudah menutup hari di aplikasi lapangan?" />
      <div className="flex flex-col">
        {bps.map((bp) => (
          <div
            key={bp.id}
            className="flex items-center justify-between gap-16 rounded-8 bg-neutral-white p-12"
          >
            <span className="text-14 font-bold text-default">{bp.name}</span>
            {bp.closedDay ? (
              <Badge intent="green" variant="subtle" size="sm" leadingIcon={<CheckCircleFill size={16} />}>
                Sudah tutup
              </Badge>
            ) : (
              <Badge intent="red" variant="subtle" size="sm" leadingIcon={<CrossCircleFill size={16} />}>
                Belum tutup
              </Badge>
            )}
          </div>
        ))}
      </div>
    </Panel>
  )
}
